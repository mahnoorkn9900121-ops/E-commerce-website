import fs from 'fs';
import path from 'path';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import {
  AVAILABLE_STUDIO_ASSETS,
  CATEGORY_DEFINITIONS,
  HERO_BANNER_IMAGE,
  STORE_POLICIES,
} from '../src/data/catalog.ts';
import type {
  AboutCmsConfig,
  AdminAnalyticsPayload,
  AdminStatsPayload,
  AiChatbotConfig,
  BannerItem,
  BrandCollectionSummary,
  CategorySummary,
  ChatConversationLog,
  ContactCmsConfig,
  CustomerRecord,
  FaqItem,
  FooterCmsConfig,
  FullCmsPayload,
  HomepageCmsConfig,
  InventoryAdjustment,
  MarketplaceHomePayload,
  NavMenuItem,
  OrderRecord,
  OrderStatus,
  PaginatedProductsResponse,
  PaymentStatus,
  Product,
  ProductReviewRecord,
  ProductSearchParams,
  ReviewModerationStatus,
  SearchSuggestionPayload,
  SiteSettings,
} from '../src/types/store.ts';
import { buildMarketplaceSeedProducts } from './catalogSeed.ts';

let dbInstance: DatabaseSync | null = null;

function getDbPath(): string {
  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'marketplace.db');
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function safeJsonParse<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== 'string' || !raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function rowToProduct(row: Record<string, unknown>): Product {
  const images = safeJsonParse<string[]>(row.images_json, []);
  const primaryImage =
    typeof row.image === 'string' && row.image
      ? row.image
      : images[0] || AVAILABLE_STUDIO_ASSETS[0];
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    brand: String(row.brand),
    category: String(row.category),
    subcategory: String(row.subcategory),
    price: Number(row.price),
    compareAtPrice:
      row.compare_at_price !== null && row.compare_at_price !== undefined
        ? Number(row.compare_at_price)
        : undefined,
    rating: Number(row.rating),
    reviewCount: Number(row.review_count),
    reviews: safeJsonParse(row.reviews_json, []),
    inStock: Number(row.in_stock) === 1 && Number(row.stock_count) > 0,
    stockCount: Number(row.stock_count),
    popularity: Number(row.popularity),
    soldCount: Number(row.sold_count ?? 0),
    featured: Number(row.featured) === 1,
    isFlashSale: Number(row.is_flash_sale) === 1,
    isTrending: Number(row.is_trending) === 1,
    isBestSeller: Number(row.is_best_seller) === 1,
    isNewArrival: Number(row.is_new_arrival) === 1,
    shortDescription: String(row.short_description),
    description: String(row.description),
    specs: safeJsonParse(row.specs_json, {}),
    colors: safeJsonParse(row.colors_json, []),
    sizes: safeJsonParse(row.sizes_json, []),
    tags: safeJsonParse(row.tags_json, []),
    image: primaryImage,
    images: images.length > 0 ? images : [primaryImage],
    createdAt: String(row.created_at),
  };
}

function computeDiscountPct(price: number, compareAtPrice?: number): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

function insertProductRow(db: DatabaseSync, product: Product) {
  const insertProd = db.prepare(`
    INSERT OR REPLACE INTO products (
      id, slug, name, brand, category, subcategory,
      price, compare_at_price, discount_pct, rating, review_count, reviews_json,
      in_stock, stock_count, popularity, sold_count,
      featured, is_flash_sale, is_trending, is_best_seller, is_new_arrival,
      short_description, description, specs_json, colors_json, sizes_json, tags_json,
      image, images_json, created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?
    )
  `);

  const specsText = Object.entries(product.specs)
    .map(([k, v]) => `${k} ${v}`)
    .join(' ');
  const tagsText = product.tags.join(' ');
  const discountPct = computeDiscountPct(product.price, product.compareAtPrice);
  const createdAt = product.createdAt || new Date().toISOString();
  const images = product.images?.length ? product.images : [product.image];

  insertProd.run(
    product.id,
    product.slug,
    product.name,
    product.brand,
    product.category,
    product.subcategory,
    product.price,
    product.compareAtPrice ?? null,
    discountPct,
    product.rating,
    product.reviewCount,
    JSON.stringify(product.reviews ?? []),
    product.inStock && product.stockCount > 0 ? 1 : 0,
    product.stockCount,
    product.popularity,
    product.soldCount ?? 0,
    product.featured ? 1 : 0,
    product.isFlashSale ? 1 : 0,
    product.isTrending ? 1 : 0,
    product.isBestSeller ? 1 : 0,
    product.isNewArrival ? 1 : 0,
    product.shortDescription,
    product.description,
    JSON.stringify(product.specs ?? {}),
    JSON.stringify(product.colors ?? []),
    JSON.stringify(product.sizes ?? []),
    JSON.stringify(product.tags ?? []),
    product.image || images[0],
    JSON.stringify(images),
    createdAt
  );

  db.prepare('DELETE FROM products_fts WHERE id = ?').run(product.id);
  db.prepare(`
    INSERT INTO products_fts (
      id, name, brand, category, subcategory, tags, short_description, description, specs_text
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    product.id,
    product.name,
    product.brand,
    product.category,
    product.subcategory,
    tagsText,
    product.shortDescription,
    product.description,
    specsText
  );
}

function removeDbFiles(dbPath: string) {
  for (const suffix of ['', '-wal', '-shm', '-journal']) {
    const filePath = `${dbPath}${suffix}`;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

function openHealthyDb(dbPath: string): DatabaseSync {
  const existed = fs.existsSync(dbPath);
  const db = new DatabaseSync(dbPath);
  try {
    db.exec('PRAGMA busy_timeout = 5000;');
    if (existed) {
      const check = db.prepare('PRAGMA quick_check(1)').get() as Record<string, unknown> | undefined;
      const status = check ? String(Object.values(check)[0] ?? '') : '';
      if (status.toLowerCase() !== 'ok') {
        throw new Error(`SQLite quick_check failed: ${status}`);
      }
    }
    return db;
  } catch (err) {
    console.warn('Recovering malformed SQLite database:', err instanceof Error ? err.message : err);
    try {
      db.close();
    } catch {
      // Ignore close error
    }
    removeDbFiles(dbPath);
    const fresh = new DatabaseSync(dbPath);
    fresh.exec('PRAGMA busy_timeout = 5000;');
    return fresh;
  }
}

export function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance;

  const dbPath = getDbPath();
  const db = openHealthyDb(dbPath);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA temp_store = MEMORY;

    CREATE TABLE IF NOT EXISTS categories (
      slug TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      image TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT NOT NULL,
      price REAL NOT NULL,
      compare_at_price REAL,
      discount_pct INTEGER NOT NULL DEFAULT 0,
      rating REAL NOT NULL,
      review_count INTEGER NOT NULL DEFAULT 0,
      reviews_json TEXT NOT NULL,
      in_stock INTEGER NOT NULL DEFAULT 1,
      stock_count INTEGER NOT NULL DEFAULT 0,
      popularity INTEGER NOT NULL DEFAULT 50,
      sold_count INTEGER NOT NULL DEFAULT 0,
      featured INTEGER NOT NULL DEFAULT 0,
      is_flash_sale INTEGER NOT NULL DEFAULT 0,
      is_trending INTEGER NOT NULL DEFAULT 0,
      is_best_seller INTEGER NOT NULL DEFAULT 0,
      is_new_arrival INTEGER NOT NULL DEFAULT 0,
      short_description TEXT NOT NULL,
      description TEXT NOT NULL,
      specs_json TEXT NOT NULL,
      colors_json TEXT NOT NULL,
      sizes_json TEXT NOT NULL,
      tags_json TEXT NOT NULL,
      image TEXT NOT NULL,
      images_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
    CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
    CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating);
    CREATE INDEX IF NOT EXISTS idx_products_in_stock ON products(in_stock);
    CREATE INDEX IF NOT EXISTS idx_products_popularity ON products(popularity DESC);
    CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_products_flash ON products(is_flash_sale);
    CREATE INDEX IF NOT EXISTS idx_products_discount ON products(discount_pct DESC);

    CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(
      id UNINDEXED,
      name,
      brand,
      category,
      subcategory,
      tags,
      short_description,
      description,
      specs_text
    );

    CREATE TABLE IF NOT EXISTS catalog_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      order_number TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      items_json TEXT NOT NULL,
      subtotal REAL NOT NULL,
      shipping REAL NOT NULL,
      tax REAL NOT NULL,
      total REAL NOT NULL,
      customer_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Owner',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      token TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      email TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT '',
      postal_code TEXT NOT NULL DEFAULT '',
      country TEXT NOT NULL DEFAULT 'United States',
      status TEXT NOT NULL DEFAULT 'Active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stock_adjustments (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      previous_stock INTEGER NOT NULL,
      new_stock INTEGER NOT NULL,
      delta INTEGER NOT NULL,
      reason TEXT NOT NULL,
      adjusted_by TEXT NOT NULL DEFAULT 'Admin',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_stock_adj_created ON stock_adjustments(created_at DESC);

    CREATE TABLE IF NOT EXISTS product_reviews (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      product_slug TEXT NOT NULL,
      author TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Verified Buyer',
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'approved',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_status ON product_reviews(status);

    CREATE TABLE IF NOT EXISTS site_kv (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chat_logs (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      user_message TEXT NOT NULL,
      assistant_reply TEXT NOT NULL,
      matched_product_ids_json TEXT NOT NULL,
      model_used TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_chat_logs_created ON chat_logs(created_at DESC);
  `);

  // Safe column migrations for existing tables
  const ensureColumn = (table: string, col: string, defSql: string) => {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all();
    const exists = cols.some((c) => String(c.name) === col);
    if (!exists) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${defSql}`);
    }
  };

  ensureColumn('categories', 'is_visible', 'INTEGER NOT NULL DEFAULT 1');
  ensureColumn('orders', 'payment_status', "TEXT NOT NULL DEFAULT 'Paid'");
  ensureColumn('orders', 'refund_note', "TEXT NOT NULL DEFAULT ''");
  ensureColumn('orders', 'updated_at', 'TEXT');

  const CATALOG_SEED_VERSION = '2026-11-v3-perfume-search-fix';
  const countRow = db.prepare('SELECT COUNT(*) AS cnt FROM products').get();
  const existingCount = Number(countRow?.cnt ?? 0);
  const metaRow = db
    .prepare('SELECT value FROM catalog_meta WHERE key = ?')
    .get('seed_version');
  const existingSeedVersion = typeof metaRow?.value === 'string' ? metaRow.value : '';

  if (existingCount === 0 || existingSeedVersion !== CATALOG_SEED_VERSION) {
    const seedProducts = buildMarketplaceSeedProducts();
    db.exec('BEGIN IMMEDIATE');
    try {
      if (existingCount > 0) {
        // Refresh seeded catalog cleanly while preserving any custom admin-added products & orders
        db.prepare("DELETE FROM products WHERE id NOT LIKE 'mk-custom-%'").run();
        db.exec('DELETE FROM products_fts');
      }

      const insertCat = db.prepare(
        'INSERT OR REPLACE INTO categories (slug, name, description, image, sort_order) VALUES (?, ?, ?, ?, ?)'
      );
      CATEGORY_DEFINITIONS.forEach((cat, idx) => {
        insertCat.run(cat.slug, cat.name, cat.description, cat.image, idx);
      });

      const insertProd = db.prepare(`
        INSERT INTO products (
          id, slug, name, brand, category, subcategory,
          price, compare_at_price, discount_pct, rating, review_count, reviews_json,
          in_stock, stock_count, popularity, sold_count,
          featured, is_flash_sale, is_trending, is_best_seller, is_new_arrival,
          short_description, description, specs_json, colors_json, sizes_json, tags_json,
          image, images_json, created_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?
        )
      `);
      const insertFts = db.prepare(`
        INSERT INTO products_fts (
          id, name, brand, category, subcategory, tags, short_description, description, specs_text
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const product of seedProducts) {
        const specsText = Object.entries(product.specs)
          .map(([k, v]) => `${k} ${v}`)
          .join(' ');
        const tagsText = product.tags.join(' ');
        const discountPct = computeDiscountPct(product.price, product.compareAtPrice);
        const createdAt = product.createdAt || new Date().toISOString();
        const images = product.images?.length ? product.images : [product.image];

        insertProd.run(
          product.id,
          product.slug,
          product.name,
          product.brand,
          product.category,
          product.subcategory,
          product.price,
          product.compareAtPrice ?? null,
          discountPct,
          product.rating,
          product.reviewCount,
          JSON.stringify(product.reviews),
          product.inStock && product.stockCount > 0 ? 1 : 0,
          product.stockCount,
          product.popularity,
          product.soldCount ?? 0,
          product.featured ? 1 : 0,
          product.isFlashSale ? 1 : 0,
          product.isTrending ? 1 : 0,
          product.isBestSeller ? 1 : 0,
          product.isNewArrival ? 1 : 0,
          product.shortDescription,
          product.description,
          JSON.stringify(product.specs),
          JSON.stringify(product.colors),
          JSON.stringify(product.sizes),
          JSON.stringify(product.tags),
          product.image,
          JSON.stringify(images),
          createdAt
        );

        insertFts.run(
          product.id,
          product.name,
          product.brand,
          product.category,
          product.subcategory,
          tagsText,
          product.shortDescription,
          product.description,
          specsText
        );
      }

      // Re-index any preserved custom admin products into FTS5
      if (existingCount > 0) {
        const customRows = db
          .prepare("SELECT * FROM products WHERE id LIKE 'mk-custom-%'")
          .all();
        for (const r of customRows) {
          const customProd = rowToProduct(r);
          const specsText = Object.entries(customProd.specs)
            .map(([k, v]) => `${k} ${v}`)
            .join(' ');
          insertFts.run(
            customProd.id,
            customProd.name,
            customProd.brand,
            customProd.category,
            customProd.subcategory,
            customProd.tags.join(' '),
            customProd.shortDescription,
            customProd.description,
            specsText
          );
        }
      }

      db.prepare('INSERT OR REPLACE INTO catalog_meta (key, value) VALUES (?, ?)').run(
        'seed_version',
        CATALOG_SEED_VERSION
      );

      db.exec('COMMIT');
      console.log(`Seeded SQLite marketplace database (${CATALOG_SEED_VERSION}) with ${seedProducts.length} products across ${CATEGORY_DEFINITIONS.length} categories.`);
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }

  ensureDefaultKvEntries(db);
  ensureSeededProductReviews(db);

  dbInstance = db;
  return db;
}

const DEFAULT_CMS_HOMEPAGE: HomepageCmsConfig = {
  heroEyebrow: 'Global Flagship Marketplace',
  heroTitle: 'Every essential, flagship device, and wardrobe icon in one curated marketplace.',
  heroSubtitle:
    'Explore smartphones, gaming laptops, Air Max footwear, home appliances, horology, and architectural fashion—backed by instant FTS search and our AI Shopping Concierge.',
  heroImage: HERO_BANNER_IMAGE,
  primaryCtaLabel: 'Shop Flash Deals',
  secondaryCtaLabel: 'Ask AI Concierge',
  promoBannerText: 'Complimentary Express Shipping on Orders Over $150 · Verified Authenticity Across 20 Departments',
  promoBannerActive: true,
  sections: [
    { key: 'categories', label: 'Marketplace Categories Directory', visible: true },
    { key: 'flashSale', label: 'Flash Sale Deals', visible: true },
    { key: 'curatedShowcase', label: 'Trending / Best Selling Showcase', visible: true },
    { key: 'brands', label: 'Official Brand Boutiques', visible: true },
    { key: 'exploreFeed', label: 'Explore Full Marketplace Feed', visible: true },
  ],
};

const DEFAULT_CMS_NAVIGATION: NavMenuItem[] = [
  { id: 'nav-home', label: 'Marketplace', actionType: 'home', visible: true },
  { id: 'nav-cats', label: 'Categories', actionType: 'categories', visible: true },
  { id: 'nav-flash', label: 'Flash Deals', actionType: 'flashDeals', visible: true },
  { id: 'nav-all', label: 'All Products', actionType: 'allProducts', visible: true },
  { id: 'nav-admin', label: 'Admin', actionType: 'admin', visible: true },
];

const DEFAULT_CMS_FOOTER: FooterCmsConfig = {
  tagline: `${STORE_POLICIES.tagline}. 1,500+ curated products across 20 specialized marketplace departments.`,
  copyrightText: `© ${new Date().getFullYear()} MAISON KOVA Marketplace. All rights reserved.`,
  shippingNotice: 'Complimentary Express Delivery on Orders Over $150',
  socialLinks: {
    instagram: 'https://instagram.com/maisonkova',
    twitter: 'https://x.com/maisonkova',
    youtube: 'https://youtube.com/@maisonkova',
  },
};

const DEFAULT_CMS_ABOUT: AboutCmsConfig = {
  headline: 'Modern Marketplace Craft & Verified Authenticity',
  story: STORE_POLICIES.about,
  warrantyStatement: STORE_POLICIES.warranty,
  shippingPolicy: STORE_POLICIES.shipping,
  returnsPolicy: STORE_POLICIES.returns,
  privacyPolicy: STORE_POLICIES.privacy,
  termsPolicy: STORE_POLICIES.terms,
};

const DEFAULT_CMS_CONTACT: ContactCmsConfig = {
  email: STORE_POLICIES.contact.email,
  phone: STORE_POLICIES.contact.phone,
  showroom: STORE_POLICIES.contact.showroom,
  hours: STORE_POLICIES.contact.hours,
};

const DEFAULT_CMS_FAQS: FaqItem[] = STORE_POLICIES.faqs.map((f, idx) => ({
  id: `faq-${idx + 1}`,
  question: f.q,
  answer: f.a,
}));

const DEFAULT_CMS_BANNERS: BannerItem[] = [
  {
    id: 'banner-flash-electronics',
    title: 'Flagship Tech & Studio Computing Event',
    subtitle: 'Limited-allocation markdowns on OLED laptops, mirrorless cameras, and ANC audio.',
    ctaLabel: 'Shop Tech Deals',
    ctaQuery: 'laptop',
    image: '/src/assets/images/product_aetherbook_pro_1794934151952.jpg',
    active: true,
    sortOrder: 0,
  },
  {
    id: 'banner-sneakers-capsule',
    title: 'Air Max & Architectural Footwear Capsule',
    subtitle: 'Precision cushioning and Italian calfskin silhouettes ready for dispatch.',
    ctaLabel: 'Explore Footwear',
    ctaQuery: 'Nike Air Max',
    image: '/src/assets/images/product_carbon_runner_1794934149798.jpg',
    active: true,
    sortOrder: 1,
  },
];

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  websiteName: 'MAISON KOVA',
  logoText: 'MAISON KOVA',
  logoUrl: '',
  faviconUrl: '',
  description:
    'Curated luxury & flagship marketplace offering smartphones, laptops, Air Max footwear, horology, fashion, beauty, and home design.',
  contactEmail: STORE_POLICIES.contact.email,
  contactPhone: STORE_POLICIES.contact.phone,
  currency: 'USD',
  socialUrls: {
    instagram: 'https://instagram.com/maisonkova',
    twitter: 'https://x.com/maisonkova',
    youtube: 'https://youtube.com/@maisonkova',
  },
  seoTitle: 'MAISON KOVA — Global Curated Marketplace',
  seoDescription:
    'Discover 1,500+ verified products across 20 marketplace categories with instant FTS search and intelligent shopping assistance.',
  defaultTheme: 'light',
  maintenanceMode: false,
  maintenanceMessage:
    'MAISON KOVA is undergoing scheduled catalog maintenance. Our showroom will reopen shortly.',
};

const DEFAULT_AI_SETTINGS: AiChatbotConfig = {
  enabled: true,
  model: 'gemini-4-hydrogen',
  welcomeMessage:
    'Welcome to MAISON KOVA Marketplace. I search across all 1,500+ live products and 20 categories—smartphones, gaming laptops, Nike Air Max, smart watches, fashion, furniture, and appliances. Ask me to find, filter, or compare anything.',
  suggestedPrompts: [
    'Find me an iPhone 17 Pro Max',
    'Show me laptops under $500',
    'Find Nike Air Max shoes',
    'Compare Samsung and Apple phones',
    'Show me the cheapest gaming laptop',
    'Smart watches under $100',
  ],
  customInstructions:
    'Maintain an attentive, concise luxury concierge tone. Highlight verified specs, savings, and stock status accurately.',
  includeOutOfStock: false,
  excludedCategories: [],
};

function ensureDefaultKvEntries(db: DatabaseSync) {
  const now = new Date().toISOString();
  const insertKv = db.prepare(
    'INSERT OR IGNORE INTO site_kv (key, value, updated_at) VALUES (?, ?, ?)'
  );
  const pairs: Array<[string, unknown]> = [
    ['cms_homepage', DEFAULT_CMS_HOMEPAGE],
    ['cms_navigation', DEFAULT_CMS_NAVIGATION],
    ['cms_footer', DEFAULT_CMS_FOOTER],
    ['cms_about', DEFAULT_CMS_ABOUT],
    ['cms_contact', DEFAULT_CMS_CONTACT],
    ['cms_faqs', DEFAULT_CMS_FAQS],
    ['cms_banners', DEFAULT_CMS_BANNERS],
    ['site_settings', DEFAULT_SITE_SETTINGS],
    ['ai_settings', DEFAULT_AI_SETTINGS],
  ];
  for (const [key, val] of pairs) {
    insertKv.run(key, JSON.stringify(val), now);
  }
}

function ensureSeededProductReviews(db: DatabaseSync) {
  const count = Number(db.prepare('SELECT COUNT(*) AS cnt FROM product_reviews').get()?.cnt ?? 0);
  if (count > 0) return;

  const prodRows = db
    .prepare('SELECT id, name, slug, reviews_json FROM products ORDER BY sold_count DESC LIMIT 60')
    .all();

  const insertRev = db.prepare(`
    INSERT OR IGNORE INTO product_reviews (
      id, product_id, product_name, product_slug, author, role, rating, comment, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.exec('BEGIN IMMEDIATE');
  try {
    for (const row of prodRows) {
      const reviews = safeJsonParse<Array<{
        id: string;
        author: string;
        role: string;
        date: string;
        rating: number;
        comment: string;
      }>>(row.reviews_json, []);
      for (const rev of reviews) {
        insertRev.run(
          rev.id || `${String(row.id)}-${Math.random().toString(36).slice(2, 7)}`,
          String(row.id),
          String(row.name),
          String(row.slug),
          rev.author || 'Verified Client',
          rev.role || 'Verified Buyer',
          Math.min(5, Math.max(1, Math.round(rev.rating || 5))),
          rev.comment || 'Verified purchase.',
          'approved',
          rev.date ? `${rev.date}T12:00:00.000Z` : new Date().toISOString()
        );
      }
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

const FTS_SYNONYM_EXPRESSIONS: Record<string, string> = {
  perfume: '("perfume"* OR "perfumes"* OR "fragrance"* OR "fragrances"* OR "parfum"* OR "cologne"*)',
  perfumes: '("perfume"* OR "perfumes"* OR "fragrance"* OR "fragrances"* OR "parfum"* OR "cologne"*)',
  cologne: '("cologne"* OR "perfume"* OR "perfumes"* OR "fragrance"* OR "parfum"*)',
  parfum: '("parfum"* OR "perfume"* OR "perfumes"* OR "fragrance"*)',
  fragrance: '("fragrance"* OR "fragrances"* OR "perfume"* OR "perfumes"* OR "parfum"* OR "cologne"*)',
  fragrances: '("fragrance"* OR "fragrances"* OR "perfume"* OR "perfumes"* OR "parfum"* OR "cologne"*)',
  smartwatch: '("smartwatch"* OR "smartwatches"* OR ("smart" AND "watch"*))',
  smartwatches: '("smartwatch"* OR "smartwatches"* OR ("smart" AND "watch"*))',
  skincare: '("skincare"* OR ("skin" AND "care"*) OR "moisturizer"* OR "cleanser"*)',
  makeup: '("makeup"* OR ("make" AND "up"*) OR "cosmetics"* OR "lipstick"* OR "foundation"* OR "mascara"* OR "concealer"*)',
  cosmetics: '("cosmetics"* OR "makeup"* OR "lipstick"* OR "foundation"* OR "mascara"* OR "concealer"*)',
  mobile: '("mobile"* OR "smartphone"* OR "smartphones"* OR "phone"* OR "phones"* OR "handset"*)',
  mobiles: '("mobile"* OR "smartphone"* OR "smartphones"* OR "phone"* OR "phones"* OR "handset"*)',
  smartphone: '("smartphone"* OR "smartphones"* OR "mobile"* OR "phone"* OR "phones"*)',
  smartphones: '("smartphone"* OR "smartphones"* OR "mobile"* OR "phone"* OR "phones"*)',
  shoe: '("shoe"* OR "shoes"* OR "sneaker"* OR "sneakers"* OR "boot"* OR "boots"* OR "loafer"* OR "loafers"* OR "footwear"*)',
  shoes: '("shoe"* OR "shoes"* OR "sneaker"* OR "sneakers"* OR "boot"* OR "boots"* OR "loafer"* OR "loafers"* OR "footwear"*)',
  sneaker: '("sneaker"* OR "sneakers"* OR "shoe"* OR "shoes"* OR "footwear"*)',
  sneakers: '("sneaker"* OR "sneakers"* OR "shoe"* OR "shoes"* OR "footwear"*)',
  footwear: '("footwear"* OR "shoe"* OR "shoes"* OR "sneaker"* OR "sneakers"* OR "boot"* OR "boots"*)',
  headphone: '("headphone"* OR "headphones"* OR "earbud"* OR "earbuds"* OR "headset"*)',
  headphones: '("headphone"* OR "headphones"* OR "earbud"* OR "earbuds"* OR "headset"*)',
  earbud: '("earbud"* OR "earbuds"* OR "earphone"* OR "earphones"* OR "headphone"* OR "headphones"*)',
  earbuds: '("earbud"* OR "earbuds"* OR "earphone"* OR "earphones"* OR "headphone"* OR "headphones"*)',
  laptop: '("laptop"* OR "laptops"* OR "macbook"* OR "ultrabook"* OR "workstation"*)',
  laptops: '("laptop"* OR "laptops"* OR "macbook"* OR "ultrabook"* OR "workstation"*)',
  men: '("men"* OR "mens"*)',
  mens: '("mens"* OR "men"*)',
  women: '("women"* OR "womens"*)',
  womens: '("womens"* OR "women"*)',
};

const LIKE_SYNONYM_GROUPS: Record<string, string[]> = {
  perfume: ['perfume', 'fragrance', 'parfum', 'cologne'],
  perfumes: ['perfume', 'fragrance', 'parfum', 'cologne'],
  cologne: ['cologne', 'perfume', 'fragrance', 'parfum'],
  fragrance: ['fragrance', 'perfume', 'parfum', 'cologne'],
  smartwatch: ['smartwatch', 'smart watch'],
  smartwatches: ['smartwatch', 'smart watch'],
  skincare: ['skincare', 'skin care', 'moisturizer', 'cleanser'],
  makeup: ['makeup', 'cosmetics', 'lipstick', 'foundation', 'concealer', 'mascara'],
  mobile: ['mobile', 'smartphone', 'phone', 'handset'],
  shoe: ['shoe', 'sneaker', 'boot', 'loafer', 'footwear'],
  shoes: ['shoe', 'sneaker', 'boot', 'loafer', 'footwear'],
  sneakers: ['sneaker', 'shoe', 'footwear'],
  headphones: ['headphone', 'earbud', 'headset'],
  laptop: ['laptop', 'macbook', 'ultrabook', 'workstation'],
  men: ['men', 'mens'],
  mens: ['mens', 'men'],
  women: ['women', 'womens'],
  womens: ['womens', 'women'],
};

function normalizeSearchInput(rawQuery: string): string {
  return rawQuery
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/\bsmart\s+watch(?:es)?\b/g, 'smartwatch')
    .replace(/\bskin\s+care\b/g, 'skincare')
    .replace(/\bmake\s+up\b/g, 'makeup')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim();
}

function singularize(token: string): string {
  if (token.length > 4 && token.endsWith('ies')) return `${token.slice(0, -3)}y`;
  if (token.length > 3 && token.endsWith('es')) return token.slice(0, -2);
  if (token.length > 2 && token.endsWith('s')) return token.slice(0, -1);
  return token;
}

function buildFtsMatchQuery(rawQuery: string): string | null {
  const normalized = normalizeSearchInput(rawQuery);
  const tokens = normalized
    .split(/\s+/)
    .map((t) => t.replace(/^-+|-+$/g, ''))
    .filter((t) => t.length >= 2);

  if (tokens.length === 0) return null;

  return tokens
    .slice(0, 7)
    .map((tok) => {
      const clean = tok.replace(/"/g, '');
      if (FTS_SYNONYM_EXPRESSIONS[clean]) {
        return FTS_SYNONYM_EXPRESSIONS[clean];
      }
      const stem = singularize(clean);
      if (FTS_SYNONYM_EXPRESSIONS[stem]) {
        return FTS_SYNONYM_EXPRESSIONS[stem];
      }
      if (stem !== clean && stem.length >= 2) {
        return `("${clean}"* OR "${stem}"*)`;
      }
      return `"${clean}"*`;
    })
    .join(' AND ');
}

function resolveCategoryName(inputCategory: string): string {
  const lower = inputCategory.trim().toLowerCase();
  const matched = CATEGORY_DEFINITIONS.find(
    (c) => c.name.toLowerCase() === lower || c.slug.toLowerCase() === lower
  );
  return matched ? matched.name : inputCategory.trim();
}

function buildWhereClause(
  params: ProductSearchParams,
  useFts: boolean,
  alias = 'p'
): { whereSql: string; bindings: SQLInputValue[]; ftsJoin: string } {
  const conditions: string[] = [];
  const bindings: SQLInputValue[] = [];
  let ftsJoin = '';

  const ftsQuery = params.q && useFts ? buildFtsMatchQuery(params.q) : null;
  if (ftsQuery) {
    ftsJoin = `JOIN products_fts f ON f.id = ${alias}.id`;
    conditions.push('products_fts MATCH ?');
    bindings.push(ftsQuery);
  } else if (params.q && params.q.trim().length > 0) {
    const normalized = normalizeSearchInput(params.q);
    const terms = normalized.split(/\s+/).filter(Boolean).slice(0, 5);
    const searchableExpr = `(
      REPLACE(REPLACE(LOWER(${alias}.name), '''', ''), '’', '') || ' ' ||
      REPLACE(REPLACE(LOWER(${alias}.brand), '''', ''), '’', '') || ' ' ||
      REPLACE(REPLACE(LOWER(${alias}.category), '''', ''), '’', '') || ' ' ||
      REPLACE(REPLACE(LOWER(${alias}.subcategory), '''', ''), '’', '') || ' ' ||
      REPLACE(REPLACE(LOWER(${alias}.tags_json), '''', ''), '’', '') || ' ' ||
      REPLACE(REPLACE(LOWER(${alias}.short_description), '''', ''), '’', '') || ' ' ||
      REPLACE(REPLACE(LOWER(${alias}.description), '''', ''), '’', '') || ' ' ||
      REPLACE(REPLACE(LOWER(${alias}.specs_json), '''', ''), '’', '')
    )`;

    for (const term of terms) {
      const candidates = LIKE_SYNONYM_GROUPS[term] ?? [term];
      const orClauses: string[] = [];
      for (const cand of candidates) {
        if (cand === 'men' || cand === 'mens') {
          orClauses.push(
            `(' ' || REPLACE(REPLACE(${searchableExpr}, '-', ' '), ',', ' ') || ' ' LIKE ? OR ' ' || REPLACE(REPLACE(${searchableExpr}, '-', ' '), ',', ' ') || ' ' LIKE ?)`
          );
          bindings.push('% men %', '% mens %');
        } else {
          orClauses.push(`${searchableExpr} LIKE ?`);
          bindings.push(`%${cand}%`);
        }
      }
      conditions.push(`(${orClauses.join(' OR ')})`);
    }
  }

  if (params.category && params.category !== 'All') {
    const resolvedCategory = resolveCategoryName(params.category);
    conditions.push(`LOWER(${alias}.category) = LOWER(?)`);
    bindings.push(resolvedCategory);
  }

  if (params.subcategory && params.subcategory !== 'All') {
    conditions.push(`LOWER(${alias}.subcategory) = LOWER(?)`);
    bindings.push(params.subcategory);
  }

  if (params.brand && params.brand !== 'All') {
    conditions.push(`LOWER(${alias}.brand) = LOWER(?)`);
    bindings.push(params.brand);
  }

  if (params.color) {
    const cPat = `%${params.color.toLowerCase()}%`;
    conditions.push(
      `(LOWER(${alias}.colors_json) LIKE ? OR LOWER(${alias}.name) LIKE ? OR LOWER(${alias}.tags_json) LIKE ?)`
    );
    bindings.push(cPat, cPat, cPat);
  }

  if (typeof params.minPrice === 'number' && !Number.isNaN(params.minPrice)) {
    conditions.push(`${alias}.price >= ?`);
    bindings.push(params.minPrice);
  }

  if (typeof params.maxPrice === 'number' && !Number.isNaN(params.maxPrice)) {
    conditions.push(`${alias}.price <= ?`);
    bindings.push(params.maxPrice);
  }

  if (typeof params.minRating === 'number' && !Number.isNaN(params.minRating)) {
    conditions.push(`${alias}.rating >= ?`);
    bindings.push(params.minRating);
  }

  if (params.onSaleOnly) {
    conditions.push(`${alias}.discount_pct > 0`);
  }

  if (params.flashSaleOnly) {
    conditions.push(`${alias}.is_flash_sale = 1`);
  }

  if (params.inStockOnly) {
    conditions.push(`${alias}.in_stock = 1 AND ${alias}.stock_count > 0`);
  }

  const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereSql, bindings, ftsJoin };
}

function getOrderBySql(sortBy: ProductSearchParams['sortBy'], hasFts: boolean): string {
  switch (sortBy) {
    case 'price-asc':
      return 'ORDER BY p.price ASC, p.popularity DESC';
    case 'price-desc':
      return 'ORDER BY p.price DESC, p.popularity DESC';
    case 'rating':
      return 'ORDER BY p.rating DESC, p.review_count DESC';
    case 'popular':
      return 'ORDER BY p.sold_count DESC, p.popularity DESC';
    case 'newest':
      return 'ORDER BY p.created_at DESC, p.popularity DESC';
    case 'featured':
    default:
      if (hasFts) {
        return 'ORDER BY bm25(products_fts, 0.0, 10.0, 8.0, 6.0, 5.0, 4.0, 2.0, 1.0, 1.0) ASC, p.featured DESC, p.popularity DESC';
      }
      return 'ORDER BY p.featured DESC, p.popularity DESC, p.sold_count DESC';
  }
}

export function queryProducts(params: ProductSearchParams = {}): PaginatedProductsResponse {
  const db = getDb();
  const pageSize =
    typeof params.pageSize === 'number' && params.pageSize > 0
      ? Math.min(Math.floor(params.pageSize), 100)
      : 24;
  const requestedPage =
    typeof params.page === 'number' && params.page > 0 ? Math.floor(params.page) : 1;

  let where = buildWhereClause(params, true, 'p');
  let usingFts = Boolean(where.ftsJoin);
  let total = 0;

  try {
    const cntRow = db
      .prepare(`SELECT COUNT(*) AS cnt FROM products p ${where.ftsJoin} ${where.whereSql}`)
      .get(...where.bindings);
    total = Number(cntRow?.cnt ?? 0);
  } catch {
    usingFts = false;
    where = buildWhereClause(params, false, 'p');
    const cntRow = db
      .prepare(`SELECT COUNT(*) AS cnt FROM products p ${where.whereSql}`)
      .get(...where.bindings);
    total = Number(cntRow?.cnt ?? 0);
  }

  // Fallback to LIKE if FTS5 yielded 0 results for punctuation-heavy queries
  if (total === 0 && usingFts && params.q) {
    usingFts = false;
    where = buildWhereClause(params, false, 'p');
    const cntRow = db
      .prepare(`SELECT COUNT(*) AS cnt FROM products p ${where.whereSql}`)
      .get(...where.bindings);
    total = Number(cntRow?.cnt ?? 0);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const offset = (page - 1) * pageSize;
  const orderSql = getOrderBySql(params.sortBy, usingFts);

  const rows = db
    .prepare(
      `SELECT p.* FROM products p ${where.ftsJoin} ${where.whereSql} ${orderSql} LIMIT ? OFFSET ?`
    )
    .all(...where.bindings, pageSize, offset);

  // Build facets scoped to active search query & category (without restricting by brand/subcategory)
  const facetBaseParams: ProductSearchParams = {
    q: params.q,
    category: params.category,
    onSaleOnly: params.onSaleOnly,
    flashSaleOnly: params.flashSaleOnly,
  };
  const facetWhereObj = buildWhereClause(facetBaseParams, usingFts, 'p');

  const brandRows = db
    .prepare(
      `SELECT p.brand, COUNT(*) AS cnt FROM products p ${facetWhereObj.ftsJoin} ${facetWhereObj.whereSql} GROUP BY p.brand ORDER BY cnt DESC LIMIT 32`
    )
    .all(...facetWhereObj.bindings);
  const subRows = db
    .prepare(
      `SELECT p.subcategory, COUNT(*) AS cnt FROM products p ${facetWhereObj.ftsJoin} ${facetWhereObj.whereSql} GROUP BY p.subcategory ORDER BY cnt DESC`
    )
    .all(...facetWhereObj.bindings);
  const priceRow = db
    .prepare(
      `SELECT MIN(p.price) AS minP, MAX(p.price) AS maxP FROM products p ${facetWhereObj.ftsJoin} ${facetWhereObj.whereSql}`
    )
    .get(...facetWhereObj.bindings);

  return {
    total,
    page,
    pageSize,
    totalPages,
    hasMore: page < totalPages,
    products: rows.map(rowToProduct),
    facets: {
      brands: brandRows.map((r) => String(r.brand)),
      subcategories: subRows.map((r) => String(r.subcategory)),
      minPrice: Number(priceRow?.minP ?? 0),
      maxPrice: Number(priceRow?.maxP ?? 3500),
    },
  };
}

export function getProductBySlugOrId(slugOrId: string): { product: Product; related: Product[] } | null {
  const db = getDb();
  const key = slugOrId.trim().toLowerCase();
  const row = db
    .prepare('SELECT * FROM products WHERE LOWER(slug) = ? OR LOWER(id) = ? LIMIT 1')
    .get(key, key);
  if (!row) return null;

  const product = rowToProduct(row);
  const relRows = db
    .prepare(
      `SELECT * FROM products
       WHERE id != ? AND category = ?
       ORDER BY (CASE WHEN subcategory = ? THEN 0 ELSE 1 END), popularity DESC
       LIMIT 6`
    )
    .all(product.id, product.category, product.subcategory);

  return {
    product,
    related: relRows.map(rowToProduct),
  };
}

export function getProductsByIds(ids: string[]): Product[] {
  if (!ids.length) return [];
  const db = getDb();
  const cleanIds = ids.slice(0, 60);
  const placeholders = cleanIds.map(() => '?').join(',');
  const rows = db
    .prepare(`SELECT * FROM products WHERE id IN (${placeholders})`)
    .all(...cleanIds);
  const byId = new Map(rows.map((r) => {
    const p = rowToProduct(r);
    return [p.id, p];
  }));
  return cleanIds.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p));
}

export function suggestProducts(rawQuery: string): SearchSuggestionPayload {
  const db = getDb();
  const q = rawQuery.trim();
  const lower = q.toLowerCase();

  if (!q) {
    const topCategoriesRows = db
      .prepare(
        `SELECT c.slug, c.name, c.image,
                COUNT(p.id) AS cnt,
                COALESCE(SUM(p.sold_count), 0) AS total_sold
         FROM categories c
         JOIN products p ON p.category = c.name
         WHERE c.is_visible = 1
         GROUP BY c.slug
         ORDER BY total_sold DESC, cnt DESC
         LIMIT 8`
      )
      .all();

    const trendingProductRows = db
      .prepare(
        `SELECT * FROM products
         WHERE in_stock = 1
         ORDER BY (is_trending * 2 + is_best_seller + featured) DESC, sold_count DESC, popularity DESC
         LIMIT 6`
      )
      .all();

    const popularSubRows = db
      .prepare(
        `SELECT subcategory, SUM(sold_count) AS total_sold
         FROM products
         WHERE in_stock = 1
         GROUP BY subcategory
         ORDER BY total_sold DESC, COUNT(*) DESC
         LIMIT 8`
      )
      .all();

    const topBrands = db
      .prepare(
        `SELECT brand, COUNT(*) AS cnt, SUM(sold_count) AS total_sold
         FROM products
         GROUP BY brand
         ORDER BY total_sold DESC, cnt DESC
         LIMIT 6`
      )
      .all()
      .map((r) => ({ name: String(r.brand), productCount: Number(r.cnt) }));

    const trendingProducts = trendingProductRows.map(rowToProduct);
    const dynamicTrendingQueries = Array.from(
      new Set(
        trendingProducts.map((p) => {
          // Concise searchable product title/phrase from live catalog
          const words = p.name.split(/\s+/);
          return words.length > 4 ? words.slice(0, 4).join(' ') : p.name;
        })
      )
    ).slice(0, 6);

    const popularKeywords = Array.from(
      new Set([
        ...popularSubRows.map((r) => String(r.subcategory)),
        ...topBrands.slice(0, 4).map((b) => b.name),
      ])
    ).slice(0, 8);

    return {
      query: q,
      queries: dynamicTrendingQueries,
      popularKeywords,
      categories: topCategoriesRows.map((c) => ({
        name: String(c.name),
        slug: String(c.slug),
        productCount: Number(c.cnt),
        image: String(c.image),
      })),
      brands: topBrands,
      products: trendingProducts,
    };
  }

  const matchedProducts = queryProducts({ q, page: 1, pageSize: 6, sortBy: 'featured' }).products;

  const catRows = db
    .prepare(
      `SELECT c.slug, c.name, c.image, COUNT(p.id) AS cnt
       FROM categories c
       LEFT JOIN products p ON p.category = c.name
       WHERE LOWER(c.name) LIKE ? OR LOWER(c.description) LIKE ?
       GROUP BY c.slug
       ORDER BY cnt DESC
       LIMIT 4`
    )
    .all(`%${lower}%`, `%${lower}%`);

  const brandRows = db
    .prepare(
      `SELECT brand, COUNT(*) AS cnt
       FROM products
       WHERE LOWER(brand) LIKE ?
       GROUP BY brand
       ORDER BY cnt DESC
       LIMIT 4`
    )
    .all(`%${lower}%`);

  const querySuggestions = Array.from(
    new Set([
      ...matchedProducts.slice(0, 4).map((p) => p.name),
      ...brandRows.slice(0, 2).map((b) => String(b.brand)),
    ])
  ).slice(0, 5);

  return {
    query: q,
    queries: querySuggestions,
    categories: catRows.map((c) => ({
      name: String(c.name),
      slug: String(c.slug),
      productCount: Number(c.cnt),
      image: String(c.image),
    })),
    brands: brandRows.map((b) => ({
      name: String(b.brand),
      productCount: Number(b.cnt),
    })),
    products: matchedProducts,
  };
}

export function listCategories(includeHidden = false): CategorySummary[] {
  const db = getDb();
  const whereSql = includeHidden ? '' : 'WHERE c.is_visible = 1';
  const rows = db
    .prepare(`
      SELECT c.slug, c.name, c.description, c.image, c.sort_order, c.is_visible,
             COUNT(p.id) AS product_count
      FROM categories c
      LEFT JOIN products p ON p.category = c.name
      ${whereSql}
      GROUP BY c.slug
      ORDER BY c.sort_order ASC, c.name ASC
    `)
    .all();

  const subRows = db
    .prepare('SELECT category, subcategory FROM products GROUP BY category, subcategory')
    .all();
  const subMap = new Map<string, string[]>();
  for (const r of subRows) {
    const cat = String(r.category);
    const list = subMap.get(cat) ?? [];
    list.push(String(r.subcategory));
    subMap.set(cat, list);
  }

  return rows.map((r) => ({
    slug: String(r.slug),
    name: String(r.name),
    description: String(r.description),
    image: String(r.image),
    productCount: Number(r.product_count),
    subcategories: subMap.get(String(r.name)) ?? [],
    sortOrder: Number(r.sort_order ?? 0),
    isVisible: Number(r.is_visible ?? 1) === 1,
  }));
}

export function getMarketplaceHomePayload(): MarketplaceHomePayload {
  const db = getDb();
  const visibleCats = listCategories(false);
  const totalProducts = Number(db.prepare('SELECT COUNT(*) AS cnt FROM products').get()?.cnt ?? 0);
  const totalCategories = visibleCats.length;
  const totalBrands = Number(
    db.prepare('SELECT COUNT(DISTINCT brand) AS cnt FROM products').get()?.cnt ?? 0
  );

  const flashSale = db
    .prepare(
      'SELECT * FROM products WHERE is_flash_sale = 1 AND in_stock = 1 ORDER BY discount_pct DESC, popularity DESC LIMIT 8'
    )
    .all()
    .map(rowToProduct);

  const trending = db
    .prepare(
      'SELECT * FROM products WHERE is_trending = 1 AND in_stock = 1 ORDER BY popularity DESC, rating DESC LIMIT 8'
    )
    .all()
    .map(rowToProduct);

  const bestSelling = db
    .prepare(
      'SELECT * FROM products WHERE in_stock = 1 ORDER BY sold_count DESC, rating DESC LIMIT 8'
    )
    .all()
    .map(rowToProduct);

  const newArrivals = db
    .prepare(
      'SELECT * FROM products WHERE in_stock = 1 ORDER BY created_at DESC, popularity DESC LIMIT 8'
    )
    .all()
    .map(rowToProduct);

  const dailyDeals = db
    .prepare(
      'SELECT * FROM products WHERE discount_pct >= 12 AND in_stock = 1 ORDER BY discount_pct DESC, sold_count DESC LIMIT 8'
    )
    .all()
    .map(rowToProduct);

  const brandRows = db
    .prepare(
      `SELECT brand, COUNT(*) AS cnt, MAX(category) AS top_cat, MAX(image) AS sample_image
       FROM products
       GROUP BY brand
       ORDER BY cnt DESC
       LIMIT 12`
    )
    .all();

  const brands: BrandCollectionSummary[] = brandRows.map((r) => ({
    name: String(r.brand),
    productCount: Number(r.cnt),
    topCategory: String(r.top_cat),
    sampleImage: String(r.sample_image),
  }));

  return {
    totalProducts,
    totalCategories,
    totalBrands,
    flashSale,
    trending,
    bestSelling,
    newArrivals,
    dailyDeals,
    categories: visibleCats,
    brands,
  };
}

export function getCatalogStats() {
  const db = getDb();
  const summary = db
    .prepare(`
      SELECT
        COUNT(*) AS total,
        MIN(price) AS min_price,
        MAX(price) AS max_price,
        SUM(CASE WHEN discount_pct > 0 THEN 1 ELSE 0 END) AS on_sale,
        SUM(CASE WHEN is_flash_sale = 1 THEN 1 ELSE 0 END) AS flash_sale,
        SUM(CASE WHEN rating >= 4.9 THEN 1 ELSE 0 END) AS top_rated,
        SUM(CASE WHEN in_stock = 0 OR stock_count <= 0 THEN 1 ELSE 0 END) AS out_of_stock
      FROM products
    `)
    .get();

  const catCountsRows = db
    .prepare('SELECT category, COUNT(*) AS cnt FROM products GROUP BY category ORDER BY cnt DESC')
    .all();

  const categoryCounts: Record<string, number> = {};
  for (const r of catCountsRows) {
    categoryCounts[String(r.category)] = Number(r.cnt);
  }

  return {
    totalProducts: Number(summary?.total ?? 0),
    totalCategories: Object.keys(categoryCounts).length,
    categoryCounts,
    minPrice: Number(summary?.min_price ?? 0),
    maxPrice: Number(summary?.max_price ?? 0),
    onSaleCount: Number(summary?.on_sale ?? 0),
    flashSaleCount: Number(summary?.flash_sale ?? 0),
    topRatedCount: Number(summary?.top_rated ?? 0),
    outOfStockCount: Number(summary?.out_of_stock ?? 0),
  };
}

const STOP_WORDS = new Set([
  'show', 'me', 'find', 'get', 'need', 'want', 'looking', 'for', 'a', 'an', 'the',
  'some', 'any', 'with', 'in', 'on', 'of', 'to', 'are', 'is', 'have', 'has', 'that',
  'which', 'what', 'products', 'product', 'items', 'item', 'please', 'can', 'you',
  'do', 'under', 'below', 'less', 'than', 'over', 'above', 'more', 'star', 'stars',
  'rating', 'rated', 'available', 'stock', 'discount', 'discounts', 'sale', 'latest',
  'best', 'top', 'good', 'recommend', 'suggest', 'compare', 'and', 'or', 'versus', 'vs',
  'between', 'tell', 'about', 'specs', 'price', 'prices', 'how', 'much', 'cheapest', 'affordable',
]);

const CATEGORY_HINTS: Array<{ regex: RegExp; category: string }> = [
  { regex: /\b(iphone|samsung galaxy|smartphone|smartphones|mobile phone|mobile phones|phone|phones)\b/i, category: 'Mobile Phones' },
  { regex: /\b(gaming laptop|gaming laptops|laptop|laptops|macbook|ultrabook|workstation|computer|computers)\b/i, category: 'Laptops & Computers' },
  { regex: /\b(smart watch|smart watches|smartwatch|smartwatches|fitness watch)\b/i, category: 'Smart Watches' },
  { regex: /\b(watch|watches|chronograph|diver|timepiece)\b/i, category: 'Watches' },
  { regex: /\b(nike|air max|sneaker|sneakers|shoe|shoes|footwear|boot|boots|loafer|loafers|heels)\b/i, category: 'Shoes & Sneakers' },
  { regex: /\b(headphone|headphones|earbud|earbuds|audio|anc|planar)\b/i, category: 'Headphones & Audio' },
  { regex: /\b(camera|cameras|mirrorless|lens|lenses|dslr|rangefinder)\b/i, category: 'Cameras' },
  { regex: /\b(gaming mouse|mechanical keyboard|keyboard|keyboards|controller|esports|gaming gear)\b/i, category: 'Gaming Accessories' },
  { regex: /\b(kitchen appliance|kitchen appliances|air fryer|vacuum|purifier|home appliance)\b/i, category: 'Home Appliances' },
  { regex: /\b(espresso|coffee|kettle|cookware|vase|lamp|kitchen)\b/i, category: 'Home & Kitchen' },
  { regex: /\b(chair|chairs|desk|table|sofa|furniture)\b/i, category: 'Furniture' },
  { regex: /\b(men's|mens|men)\s+.*(jacket|jackets|coat|coats|denim|jeans|shirt)\b/i, category: "Men's Fashion" },
  { regex: /\b(women's|womens|women)\s+.*(dress|blouse|coat|skirt|fashion)\b/i, category: "Women's Fashion" },
  { regex: /\b(jacket|jackets|hoodie|sweater|cashmere|apparel|clothing)\b/i, category: 'Fashion & Clothing' },
  { regex: /\b(perfume|perfumes|cologne|parfum|fragrance|fragrances|makeup|cosmetics|lipstick|foundation|mascara|concealer|blush|serum|skincare|skin care|cleanser|beauty|moisturizer)\b/i, category: 'Beauty & Personal Care' },
  { regex: /\b(dumbbell|theragun|yoga|fitness|gym|sport)\b/i, category: 'Sports & Fitness' },
  { regex: /\b(lego|montessori|toy|toys|stroller|baby)\b/i, category: 'Toys & Baby Products' },
  { regex: /\b(book|books|fountain pen|notebook|stationery)\b/i, category: 'Books & Stationery' },
  { regex: /\b(tote|backpack|wallet|sunglasses|luggage|accessories)\b/i, category: 'Accessories' },
];

export function extractNaturalLanguageIntent(text: string): ProductSearchParams {
  const lower = text.toLowerCase().trim();
  const params: ProductSearchParams = {};

  const underMatch = lower.match(/(?:under|below|less than|<|max)\s*\$?(\d+(?:\.\d+)?)/);
  if (underMatch) params.maxPrice = Number(underMatch[1]);

  const overMatch = lower.match(/(?:over|above|more than|>|min)\s*\$?(\d+(?:\.\d+)?)/);
  if (overMatch) params.minPrice = Number(overMatch[1]);

  if (/\b5[\s-]*star\b/.test(lower) || /\bfive[\s-]*star\b/.test(lower)) {
    params.minRating = 4.9;
  }

  if (/\b(discount|discounts|sale|deal|deals|flash sale|markdown|reduced)\b/.test(lower)) {
    params.onSaleOnly = true;
  }

  if (/\b(in stock|available)\b/.test(lower)) {
    params.inStockOnly = true;
  }

  if (/\b(cheapest|lowest price|least expensive|budget)\b/.test(lower)) {
    params.sortBy = 'price-asc';
  } else if (/\b(best|top rated|highest rated)\b/.test(lower)) {
    params.sortBy = 'rating';
  }

  for (const hint of CATEGORY_HINTS) {
    if (hint.regex.test(lower)) {
      params.category = hint.category;
      break;
    }
  }

  const tokens = lower
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t) && !/^\d+$/.test(t));

  const cleaned = tokens.filter((t) => {
    if (params.category === 'Shoes & Sneakers' && ['shoe', 'shoes', 'footwear'].includes(t)) return false;
    if (params.category === 'Mobile Phones' && ['phone', 'phones', 'mobile', 'smartphone', 'smartphones'].includes(t)) return false;
    if (params.category === 'Laptops & Computers' && ['laptop', 'laptops', 'computer', 'computers'].includes(t)) return false;
    if (params.category === 'Smart Watches' && ['smart', 'watch', 'watches', 'smartwatch', 'smartwatches'].includes(t)) return false;
    if (params.category === 'Beauty & Personal Care' && ['beauty'].includes(t)) return false;
    return true;
  });

  if (cleaned.length > 0) {
    params.q = cleaned.join(' ');
  }

  return params;
}

export function parseNaturalLanguageDbSearch(text: string, limit = 6): Product[] {
  const params = extractNaturalLanguageIntent(text);
  const primary = queryProducts({ ...params, page: 1, pageSize: limit });
  if (primary.products.length > 0) return primary.products;

  if (params.q && params.category) {
    const relaxedCat = queryProducts({ ...params, category: undefined, page: 1, pageSize: limit });
    if (relaxedCat.products.length > 0) return relaxedCat.products;
  }

  if (params.q && (params.category || params.maxPrice || params.onSaleOnly || params.minRating)) {
    const structuredOnly = queryProducts({ ...params, q: undefined, page: 1, pageSize: limit });
    if (structuredOnly.products.length > 0) return structuredOnly.products;
  }

  return [];
}

export function retrieveCandidateProductsFromDb(
  userQuery: string,
  historyTexts: string[] = [],
  maxCandidates = 14,
  allowFeaturedFallback = true
): Product[] {
  const db = getDb();
  const candidates: Product[] = [];
  const seen = new Set<string>();

  const pushUnique = (items: Product[]) => {
    for (const item of items) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        candidates.push(item);
        if (candidates.length >= maxCandidates) break;
      }
    }
  };

  // Multi-brand / comparison query support (e.g. "Compare Samsung and Apple phones")
  const knownBrands = db
    .prepare('SELECT DISTINCT brand FROM products')
    .all()
    .map((r) => String(r.brand));
  const lowerQuery = userQuery.toLowerCase();
  const mentionedBrands = knownBrands.filter((b) =>
    lowerQuery.includes(b.toLowerCase())
  );

  const baseIntent = extractNaturalLanguageIntent(userQuery);
  if (mentionedBrands.length >= 2) {
    const perBrand = Math.max(3, Math.floor(maxCandidates / mentionedBrands.length));
    for (const brand of mentionedBrands) {
      const brandItems = queryProducts({
        brand,
        category: baseIntent.category,
        maxPrice: baseIntent.maxPrice,
        minPrice: baseIntent.minPrice,
        sortBy: baseIntent.sortBy ?? 'featured',
        page: 1,
        pageSize: perBrand,
      }).products;
      pushUnique(brandItems);
    }
  }

  // Primary intent match across 1,500+ products
  pushUnique(parseNaturalLanguageDbSearch(userQuery, 10));

  // Individual keyword fallback for multi-topic queries
  if (candidates.length < maxCandidates) {
    const tokens = lowerQuery
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
    for (const tok of tokens.slice(0, 4)) {
      if (candidates.length >= maxCandidates) break;
      const hit = queryProducts({
        q: tok,
        maxPrice: baseIntent.maxPrice,
        minPrice: baseIntent.minPrice,
        sortBy: baseIntent.sortBy ?? 'featured',
        page: 1,
        pageSize: 4,
      }).products;
      pushUnique(hit);
    }
  }

  // Preserve conversation continuity ("compare those")
  if (historyTexts.length > 0 && candidates.length < maxCandidates) {
    const recentJoined = historyTexts.slice(-4).join(' ');
    const recentTerms = recentJoined
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 3 && !STOP_WORDS.has(t));
    if (recentTerms.length > 0) {
      const historyHit = parseNaturalLanguageDbSearch(recentTerms.slice(0, 5).join(' '), 4);
      pushUnique(historyHit);
    }
  }

  // Fill remaining slots ONLY if zero relevant catalog matches were found and fallback is allowed
  if (allowFeaturedFallback && candidates.length === 0) {
    const featured = queryProducts({ sortBy: 'featured', page: 1, pageSize: Math.min(6, maxCandidates) }).products;
    pushUnique(featured);
  }

  return candidates.slice(0, maxCandidates);
}

// ============================================================
// Orders & Admin Mutations
// ============================================================

export function saveOrderToDb(order: OrderRecord): OrderRecord {
  const db = getDb();
  const now = new Date().toISOString();
  const paymentStatus: PaymentStatus =
    order.paymentStatus ?? (order.paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Paid');
  const status: OrderStatus = order.status || 'Pending';

  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare(`
      INSERT OR REPLACE INTO orders (
        order_number, created_at, updated_at, status, payment_method, payment_status, refund_note,
        items_json, subtotal, shipping, tax, total, customer_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      order.orderNumber,
      order.createdAt,
      now,
      status,
      order.paymentMethod,
      paymentStatus,
      order.refundNote ?? '',
      JSON.stringify(order.items),
      order.subtotal,
      order.shipping,
      order.tax,
      order.total,
      JSON.stringify(order.customer)
    );

    // Upsert customer record automatically from checkout order
    const cleanEmail = order.customer.email.trim().toLowerCase();
    if (cleanEmail) {
      const existingCust = db
        .prepare('SELECT id FROM customers WHERE LOWER(email) = ?')
        .get(cleanEmail);
      if (existingCust) {
        db.prepare(`
          UPDATE customers
          SET full_name = ?, phone = ?, address = ?, city = ?, postal_code = ?, country = ?, updated_at = ?
          WHERE id = ?
        `).run(
          order.customer.fullName,
          order.customer.phone,
          order.customer.address,
          order.customer.city,
          order.customer.postalCode,
          order.customer.country || 'United States',
          now,
          String(existingCust.id)
        );
      } else {
        db.prepare(`
          INSERT INTO customers (
            id, full_name, email, phone, address, city, postal_code, country, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?)
        `).run(
          `cust-${Date.now().toString(36)}-${Math.floor(Math.random() * 9999)}`,
          order.customer.fullName,
          cleanEmail,
          order.customer.phone,
          order.customer.address,
          order.customer.city,
          order.customer.postalCode,
          order.customer.country || 'United States',
          now,
          now
        );
      }
    }

    const selectStock = db.prepare('SELECT name, stock_count FROM products WHERE id = ?');
    const decStock = db.prepare(`
      UPDATE products
      SET stock_count = MAX(0, stock_count - ?),
          sold_count = sold_count + ?,
          in_stock = CASE WHEN MAX(0, stock_count - ?) > 0 THEN 1 ELSE 0 END
      WHERE id = ?
    `);
    const insertAdj = db.prepare(`
      INSERT INTO stock_adjustments (
        id, product_id, product_name, previous_stock, new_stock, delta, reason, adjusted_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of order.items) {
      const prodRow = selectStock.get(item.productId);
      const prevStock = Number(prodRow?.stock_count ?? 0);
      const nextStock = Math.max(0, prevStock - item.quantity);
      decStock.run(item.quantity, item.quantity, item.quantity, item.productId);
      if (prodRow) {
        insertAdj.run(
          `adj-${Date.now().toString(36)}-${Math.floor(Math.random() * 99999)}`,
          item.productId,
          String(prodRow.name),
          prevStock,
          nextStock,
          nextStock - prevStock,
          `Checkout Order #${order.orderNumber}`,
          'Checkout',
          now
        );
      }
    }

    db.exec('COMMIT');
    return { ...order, status, paymentStatus, updatedAt: now };
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function listOrdersFromDb(): OrderRecord[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 300').all();
  return rows.map((r) => ({
    orderNumber: String(r.order_number),
    createdAt: String(r.created_at),
    updatedAt: r.updated_at ? String(r.updated_at) : String(r.created_at),
    status: String(r.status) as OrderStatus,
    paymentMethod: String(r.payment_method) as OrderRecord['paymentMethod'],
    paymentStatus: (r.payment_status ? String(r.payment_status) : 'Paid') as PaymentStatus,
    refundNote: r.refund_note ? String(r.refund_note) : '',
    items: safeJsonParse(r.items_json, []),
    subtotal: Number(r.subtotal),
    shipping: Number(r.shipping),
    tax: Number(r.tax),
    total: Number(r.total),
    customer: safeJsonParse(r.customer_json, {
      fullName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      country: 'United States',
    }),
  }));
}

export function updateOrderStatusInDb(
  orderNumber: string,
  patch: {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    refundNote?: string;
    restockOnCancel?: boolean;
  }
): OrderRecord | null {
  const db = getDb();
  const existingRow = db
    .prepare('SELECT * FROM orders WHERE order_number = ?')
    .get(orderNumber);
  if (!existingRow) return null;

  const now = new Date().toISOString();
  const prevStatus = String(existingRow.status);
  const nextStatus = patch.status ?? (prevStatus as OrderStatus);
  const nextPaymentStatus =
    patch.paymentStatus ??
    (existingRow.payment_status ? (String(existingRow.payment_status) as PaymentStatus) : 'Paid');
  const nextRefundNote =
    patch.refundNote !== undefined
      ? patch.refundNote
      : existingRow.refund_note
        ? String(existingRow.refund_note)
        : '';

  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare(`
      UPDATE orders
      SET status = ?, payment_status = ?, refund_note = ?, updated_at = ?
      WHERE order_number = ?
    `).run(nextStatus, nextPaymentStatus, nextRefundNote, now, orderNumber);

    if (
      patch.restockOnCancel &&
      prevStatus !== 'Cancelled' &&
      (nextStatus === 'Cancelled' || nextPaymentStatus === 'Refunded')
    ) {
      const items = safeJsonParse<OrderRecord['items']>(existingRow.items_json, []);
      const getProd = db.prepare('SELECT name, stock_count FROM products WHERE id = ?');
      const incProd = db.prepare(`
        UPDATE products
        SET stock_count = stock_count + ?,
            in_stock = 1
        WHERE id = ?
      `);
      const insertAdj = db.prepare(`
        INSERT INTO stock_adjustments (
          id, product_id, product_name, previous_stock, new_stock, delta, reason, adjusted_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const item of items) {
        const prodRow = getProd.get(item.productId);
        if (prodRow) {
          const prevStock = Number(prodRow.stock_count ?? 0);
          const nextStock = prevStock + item.quantity;
          incProd.run(item.quantity, item.productId);
          insertAdj.run(
            `adj-${Date.now().toString(36)}-${Math.floor(Math.random() * 99999)}`,
            item.productId,
            String(prodRow.name),
            prevStock,
            nextStock,
            item.quantity,
            `Restocked from Order #${orderNumber} (${nextStatus})`,
            'Admin',
            now
          );
        }
      }
    }

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  const updatedRow = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber);
  if (!updatedRow) return null;
  return {
    orderNumber: String(updatedRow.order_number),
    createdAt: String(updatedRow.created_at),
    updatedAt: String(updatedRow.updated_at || updatedRow.created_at),
    status: String(updatedRow.status) as OrderStatus,
    paymentMethod: String(updatedRow.payment_method) as OrderRecord['paymentMethod'],
    paymentStatus: String(updatedRow.payment_status || 'Paid') as PaymentStatus,
    refundNote: String(updatedRow.refund_note || ''),
    items: safeJsonParse(updatedRow.items_json, []),
    subtotal: Number(updatedRow.subtotal),
    shipping: Number(updatedRow.shipping),
    tax: Number(updatedRow.tax),
    total: Number(updatedRow.total),
    customer: safeJsonParse(updatedRow.customer_json, {
      fullName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      country: 'United States',
    }),
  };
}

export function upsertCategoryInDb(input: {
  name: string;
  description?: string;
  image?: string;
  sortOrder?: number;
  isVisible?: boolean;
}): CategorySummary {
  const db = getDb();
  const name = input.name.trim();
  const slug = slugify(name);
  const existing = db.prepare('SELECT * FROM categories WHERE slug = ?').get(slug);
  const description =
    input.description?.trim() ||
    (existing ? String(existing.description) : `${name} marketplace collection curated for everyday utility.`);
  const image =
    input.image?.trim() || (existing ? String(existing.image) : AVAILABLE_STUDIO_ASSETS[0]);
  const sortOrder =
    typeof input.sortOrder === 'number'
      ? input.sortOrder
      : existing
        ? Number(existing.sort_order)
        : 99;
  const isVisible =
    typeof input.isVisible === 'boolean'
      ? input.isVisible
        ? 1
        : 0
      : existing
        ? Number(existing.is_visible ?? 1)
        : 1;

  db.prepare(
    'INSERT OR REPLACE INTO categories (slug, name, description, image, sort_order, is_visible) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(slug, name, description, image, sortOrder, isVisible);

  return {
    slug,
    name,
    description,
    image,
    productCount: 0,
    subcategories: [],
    sortOrder,
    isVisible: isVisible === 1,
  };
}

export function updateCategoryInDb(
  slug: string,
  patch: {
    name?: string;
    description?: string;
    image?: string;
    sortOrder?: number;
    isVisible?: boolean;
  }
): CategorySummary | null {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM categories WHERE slug = ?').get(slug);
  if (!existing) return null;

  const oldName = String(existing.name);
  const nextName = patch.name?.trim() || oldName;
  const nextDesc = patch.description !== undefined ? patch.description.trim() : String(existing.description);
  const nextImage = patch.image?.trim() || String(existing.image);
  const nextSort =
    typeof patch.sortOrder === 'number' ? patch.sortOrder : Number(existing.sort_order ?? 0);
  const nextVis =
    typeof patch.isVisible === 'boolean'
      ? patch.isVisible
        ? 1
        : 0
      : Number(existing.is_visible ?? 1);

  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare(
      'UPDATE categories SET name = ?, description = ?, image = ?, sort_order = ?, is_visible = ? WHERE slug = ?'
    ).run(nextName, nextDesc, nextImage, nextSort, nextVis, slug);

    if (nextName !== oldName) {
      db.prepare('UPDATE products SET category = ? WHERE category = ?').run(nextName, oldName);
      db.prepare('UPDATE products_fts SET category = ? WHERE category = ?').run(nextName, oldName);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  const all = listCategories(true);
  return all.find((c) => c.slug === slug) ?? null;
}

export function deleteCategoryInDb(slug: string, reassignToCategory?: string): boolean {
  const db = getDb();
  const existing = db.prepare('SELECT name FROM categories WHERE slug = ?').get(slug);
  if (!existing) return false;
  const oldName = String(existing.name);

  const count = Number(
    db.prepare('SELECT COUNT(*) AS cnt FROM products WHERE category = ?').get(oldName)?.cnt ?? 0
  );

  if (count > 0 && !reassignToCategory?.trim()) {
    throw new Error('Cannot delete a category with active products unless reassigned.');
  }

  db.exec('BEGIN IMMEDIATE');
  try {
    if (count > 0 && reassignToCategory?.trim()) {
      const target = reassignToCategory.trim();
      db.prepare('UPDATE products SET category = ? WHERE category = ?').run(target, oldName);
      db.prepare('UPDATE products_fts SET category = ? WHERE category = ?').run(target, oldName);
    }
    const result = db.prepare('DELETE FROM categories WHERE slug = ?').run(slug);
    db.exec('COMMIT');
    return Number(result.changes) > 0;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export interface AdminProductInput {
  id?: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  price: number;
  compareAtPrice?: number;
  stockCount: number;
  rating?: number;
  shortDescription: string;
  description?: string;
  specs?: Record<string, string>;
  colors?: Array<{ name: string; hex: string }>;
  sizes?: string[];
  tags?: string[];
  image: string;
  images?: string[];
  featured?: boolean;
  isFlashSale?: boolean;
  isTrending?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
}

export function createProductInDb(input: AdminProductInput): Product {
  const db = getDb();
  const id = input.id?.trim() || `mk-custom-${Date.now().toString(36)}-${Math.floor(Math.random() * 999)}`;
  const baseSlug = slugify(input.name);
  const existing = db.prepare('SELECT id FROM products WHERE slug = ? AND id != ?').get(baseSlug, id);
  const slug = existing ? `${baseSlug}-${id.slice(-4)}` : baseSlug;

  // Ensure category exists
  const catCheck = db.prepare('SELECT slug FROM categories WHERE LOWER(name) = LOWER(?)').get(input.category);
  if (!catCheck) {
    upsertCategoryInDb({ name: input.category, image: input.image });
  }

  const images =
    input.images && input.images.length > 0
      ? input.images
      : [input.image || AVAILABLE_STUDIO_ASSETS[0]];

  const product: Product = {
    id,
    slug,
    name: input.name.trim(),
    brand: input.brand.trim() || 'MAISON KOVA',
    category: input.category.trim(),
    subcategory: input.subcategory.trim() || 'Featured',
    price: Number(input.price),
    compareAtPrice:
      typeof input.compareAtPrice === 'number' && input.compareAtPrice > Number(input.price)
        ? Number(input.compareAtPrice)
        : undefined,
    rating: typeof input.rating === 'number' ? Math.min(5, Math.max(1, input.rating)) : 4.8,
    reviewCount: 1,
    reviews: [
      {
        id: `${id}-rev-init`,
        author: 'Marketplace Curator',
        role: 'Verified Quality Check',
        date: new Date().toISOString().slice(0, 10),
        rating: 5,
        comment: 'Inspected and verified prior to listing.',
      },
    ],
    inStock: Number(input.stockCount) > 0,
    stockCount: Math.max(0, Math.floor(Number(input.stockCount))),
    popularity: 85,
    soldCount: 0,
    featured: Boolean(input.featured ?? true),
    isFlashSale: Boolean(input.isFlashSale),
    isTrending: Boolean(input.isTrending),
    isBestSeller: Boolean(input.isBestSeller),
    isNewArrival: Boolean(input.isNewArrival ?? true),
    shortDescription: input.shortDescription.trim(),
    description: input.description?.trim() || input.shortDescription.trim(),
    specs: input.specs && Object.keys(input.specs).length > 0
      ? input.specs
      : { Brand: input.brand.trim() || 'MAISON KOVA', Category: input.category.trim() },
    colors:
      input.colors && input.colors.length > 0
        ? input.colors
        : [{ name: 'Obsidian', hex: '#1B1B1D' }],
    sizes: input.sizes && input.sizes.length > 0 ? input.sizes : ['Standard'],
    tags: Array.from(
      new Set([
        input.category.toLowerCase(),
        input.subcategory.toLowerCase(),
        input.brand.toLowerCase(),
        ...input.name.toLowerCase().split(/\s+/).filter((w) => w.length > 2),
        ...(input.tags ?? []),
      ])
    ),
    image: images[0],
    images,
    createdAt: new Date().toISOString(),
  };

  insertProductRow(db, product);
  return product;
}

export function updateProductInDb(
  id: string,
  patch: Partial<AdminProductInput>
): Product | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!row) return null;

  const existing = rowToProduct(row);
  const nextStock =
    typeof patch.stockCount === 'number'
      ? Math.max(0, Math.floor(patch.stockCount))
      : existing.stockCount;
  const nextPrice =
    typeof patch.price === 'number' && !Number.isNaN(patch.price)
      ? Math.max(1, Number(patch.price))
      : existing.price;

  const nextCompare =
    patch.compareAtPrice === undefined
      ? existing.compareAtPrice
      : patch.compareAtPrice && patch.compareAtPrice > nextPrice
        ? Number(patch.compareAtPrice)
        : undefined;

  const nextImages =
    patch.images && patch.images.length > 0
      ? patch.images
      : patch.image
        ? [patch.image, ...existing.images.filter((img) => img !== patch.image)].slice(0, 4)
        : existing.images;

  const updated: Product = {
    ...existing,
    name: patch.name?.trim() || existing.name,
    brand: patch.brand?.trim() || existing.brand,
    category: patch.category?.trim() || existing.category,
    subcategory: patch.subcategory?.trim() || existing.subcategory,
    price: nextPrice,
    compareAtPrice: nextCompare,
    stockCount: nextStock,
    inStock: nextStock > 0,
    shortDescription: patch.shortDescription?.trim() || existing.shortDescription,
    description: patch.description?.trim() || existing.description,
    specs: patch.specs ?? existing.specs,
    colors: patch.colors ?? existing.colors,
    sizes: patch.sizes ?? existing.sizes,
    image: nextImages[0],
    images: nextImages,
    featured: patch.featured ?? existing.featured,
    isFlashSale: patch.isFlashSale ?? existing.isFlashSale,
    isTrending: patch.isTrending ?? existing.isTrending,
    isBestSeller: patch.isBestSeller ?? existing.isBestSeller,
    isNewArrival: patch.isNewArrival ?? existing.isNewArrival,
  };

  insertProductRow(db, updated);

  if (nextStock !== existing.stockCount) {
    db.prepare(`
      INSERT INTO stock_adjustments (
        id, product_id, product_name, previous_stock, new_stock, delta, reason, adjusted_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `adj-${Date.now().toString(36)}-${Math.floor(Math.random() * 99999)}`,
      updated.id,
      updated.name,
      existing.stockCount,
      nextStock,
      nextStock - existing.stockCount,
      'Admin Product Edit',
      'Admin',
      new Date().toISOString()
    );
  }

  return updated;
}

export function deleteProductInDb(id: string): boolean {
  const db = getDb();
  const r1 = db.prepare('DELETE FROM products WHERE id = ?').run(id);
  db.prepare('DELETE FROM products_fts WHERE id = ?').run(id);
  return Number(r1.changes) > 0;
}

export function bulkDeleteProductsInDb(ids: string[]): number {
  const cleanIds = ids.map((id) => id.trim()).filter(Boolean);
  if (cleanIds.length === 0) return 0;
  const db = getDb();
  let deleted = 0;
  const delProd = db.prepare('DELETE FROM products WHERE id = ?');
  const delFts = db.prepare('DELETE FROM products_fts WHERE id = ?');
  db.exec('BEGIN IMMEDIATE');
  try {
    for (const id of cleanIds) {
      const res = delProd.run(id);
      delFts.run(id);
      deleted += Number(res.changes);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  return deleted;
}

function parseCsvLines(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const ch = csvText[i];
    const next = csvText[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentField += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentField += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if (ch === '\r' && next === '\n') {
      currentRow.push(currentField.trim());
      if (currentRow.some((c) => c.length > 0)) rows.push(currentRow);
      currentRow = [];
      currentField = '';
      i += 1;
    } else if (ch === '\n' || ch === '\r') {
      currentRow.push(currentField.trim());
      if (currentRow.some((c) => c.length > 0)) rows.push(currentRow);
      currentRow = [];
      currentField = '';
    } else {
      currentField += ch;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((c) => c.length > 0)) rows.push(currentRow);
  }
  return rows;
}

export function bulkImportProductsFromCsv(csvText: string): {
  importedCount: number;
  skippedCount: number;
  importedProducts: Product[];
} {
  const rows = parseCsvLines(csvText);
  if (rows.length < 2) {
    throw new Error('CSV must include a header row and at least one product row.');
  }

  const headers = rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const colIdx = (aliases: string[]) => headers.findIndex((h) => aliases.includes(h));

  const nameIdx = colIdx(['name', 'title', 'productname']);
  const brandIdx = colIdx(['brand', 'manufacturer']);
  const catIdx = colIdx(['category']);
  const subIdx = colIdx(['subcategory', 'type']);
  const priceIdx = colIdx(['price', 'saleprice']);
  const compareIdx = colIdx(['compareatprice', 'originalprice', 'msrp']);
  const stockIdx = colIdx(['stockcount', 'stock', 'qty', 'quantity']);
  const descIdx = colIdx(['shortdescription', 'description', 'summary']);
  const imgIdx = colIdx(['image', 'imageurl']);

  if (nameIdx === -1 || priceIdx === -1) {
    throw new Error('CSV header must include at least "name" and "price" columns.');
  }

  const importedProducts: Product[] = [];
  let skippedCount = 0;

  const db = getDb();
  db.exec('BEGIN IMMEDIATE');
  try {
    for (let i = 1; i < rows.length; i += 1) {
      const cols = rows[i];
      const name = cols[nameIdx]?.trim();
      const price = Number(cols[priceIdx]);
      if (!name || Number.isNaN(price) || price <= 0) {
        skippedCount += 1;
        continue;
      }

      const category = cols[catIdx]?.trim() || 'Electronics';
      const brand = cols[brandIdx]?.trim() || 'MAISON KOVA';
      const subcategory = cols[subIdx]?.trim() || 'Featured Imports';
      const compareRaw = compareIdx > -1 ? Number(cols[compareIdx]) : undefined;
      const compareAtPrice =
        compareRaw && !Number.isNaN(compareRaw) && compareRaw > price ? compareRaw : undefined;
      const stockRaw = stockIdx > -1 ? Number(cols[stockIdx]) : 25;
      const stockCount = !Number.isNaN(stockRaw) ? Math.max(0, Math.floor(stockRaw)) : 25;
      const shortDescription =
        cols[descIdx]?.trim() || `${brand} ${name} imported via Marketplace Catalog Manager.`;
      const catDef = CATEGORY_DEFINITIONS.find(
        (c) => c.name.toLowerCase() === category.toLowerCase()
      );
      const image =
        (imgIdx > -1 && cols[imgIdx]?.trim()) ||
        catDef?.image ||
        AVAILABLE_STUDIO_ASSETS[i % AVAILABLE_STUDIO_ASSETS.length];

      const prod = createProductInDb({
        name,
        brand,
        category,
        subcategory,
        price,
        compareAtPrice,
        stockCount,
        shortDescription,
        image,
        images: [image],
      });
      importedProducts.push(prod);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  return {
    importedCount: importedProducts.length,
    skippedCount,
    importedProducts,
  };
}

export function getAdminStatsFromDb(): AdminStatsPayload {
  const db = getDb();
  const prodStats = db
    .prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN in_stock = 1 AND stock_count > 0 THEN 1 ELSE 0 END) AS in_stock,
        SUM(CASE WHEN in_stock = 0 OR stock_count <= 0 THEN 1 ELSE 0 END) AS out_of_stock,
        SUM(CASE WHEN discount_pct > 0 THEN 1 ELSE 0 END) AS on_sale,
        SUM(CASE WHEN is_flash_sale = 1 THEN 1 ELSE 0 END) AS flash_sale
      FROM products
    `)
    .get();
  const catCount = Number(db.prepare('SELECT COUNT(*) AS cnt FROM categories').get()?.cnt ?? 0);
  const orderStats = db
    .prepare("SELECT COUNT(*) AS cnt, COALESCE(SUM(CASE WHEN status != 'Cancelled' AND COALESCE(payment_status, 'Paid') != 'Refunded' THEN total ELSE 0 END), 0) AS rev FROM orders")
    .get();

  return {
    totalProducts: Number(prodStats?.total ?? 0),
    totalCategories: catCount,
    totalOrders: Number(orderStats?.cnt ?? 0),
    inStockCount: Number(prodStats?.in_stock ?? 0),
    outOfStockCount: Number(prodStats?.out_of_stock ?? 0),
    onSaleCount: Number(prodStats?.on_sale ?? 0),
    flashSaleCount: Number(prodStats?.flash_sale ?? 0),
    totalRevenue: Number(orderStats?.rev ?? 0),
  };
}

// ============================================================
// CMS, Site Settings & AI Concierge Config Helpers
// ============================================================

function getKvJson<T>(key: string, fallback: T): T {
  const db = getDb();
  const row = db.prepare('SELECT value FROM site_kv WHERE key = ?').get(key);
  return row ? safeJsonParse<T>(row.value, fallback) : fallback;
}

function setKvJson<T>(key: string, value: T): T {
  const db = getDb();
  db.prepare('INSERT OR REPLACE INTO site_kv (key, value, updated_at) VALUES (?, ?, ?)').run(
    key,
    JSON.stringify(value),
    new Date().toISOString()
  );
  return value;
}

export function getFullCmsPayload(): FullCmsPayload {
  return {
    homepage: getKvJson('cms_homepage', DEFAULT_CMS_HOMEPAGE),
    navigation: getKvJson('cms_navigation', DEFAULT_CMS_NAVIGATION),
    footer: getKvJson('cms_footer', DEFAULT_CMS_FOOTER),
    about: getKvJson('cms_about', DEFAULT_CMS_ABOUT),
    contact: getKvJson('cms_contact', DEFAULT_CMS_CONTACT),
    faqs: getKvJson('cms_faqs', DEFAULT_CMS_FAQS),
    banners: getKvJson('cms_banners', DEFAULT_CMS_BANNERS),
    settings: getKvJson('site_settings', DEFAULT_SITE_SETTINGS),
  };
}

export type CmsSectionKey =
  | 'homepage'
  | 'navigation'
  | 'footer'
  | 'about'
  | 'contact'
  | 'faqs'
  | 'banners'
  | 'settings';

export function updateCmsSectionInDb(section: CmsSectionKey, data: unknown): FullCmsPayload {
  const keyMap: Record<CmsSectionKey, string> = {
    homepage: 'cms_homepage',
    navigation: 'cms_navigation',
    footer: 'cms_footer',
    about: 'cms_about',
    contact: 'cms_contact',
    faqs: 'cms_faqs',
    banners: 'cms_banners',
    settings: 'site_settings',
  };
  const kvKey = keyMap[section];
  if (!kvKey) {
    throw new Error(`Unknown CMS section: ${section}`);
  }
  setKvJson(kvKey, data);
  return getFullCmsPayload();
}

export function getAiSettingsFromDb(): AiChatbotConfig {
  return getKvJson('ai_settings', DEFAULT_AI_SETTINGS);
}

export function updateAiSettingsInDb(patch: Partial<AiChatbotConfig>): AiChatbotConfig {
  const current = getAiSettingsFromDb();
  const nextModel =
    patch.model === 'gemini-4-hydrogen' || patch.model === 'gemini-3.1-flash-lite'
      ? patch.model
      : current.model;
  const next: AiChatbotConfig = {
    enabled: typeof patch.enabled === 'boolean' ? patch.enabled : current.enabled,
    model: nextModel,
    welcomeMessage:
      typeof patch.welcomeMessage === 'string' && patch.welcomeMessage.trim()
        ? patch.welcomeMessage.trim()
        : current.welcomeMessage,
    suggestedPrompts: Array.isArray(patch.suggestedPrompts)
      ? patch.suggestedPrompts.map((s) => String(s).trim()).filter(Boolean).slice(0, 8)
      : current.suggestedPrompts,
    customInstructions:
      typeof patch.customInstructions === 'string'
        ? patch.customInstructions.trim()
        : current.customInstructions,
    includeOutOfStock:
      typeof patch.includeOutOfStock === 'boolean'
        ? patch.includeOutOfStock
        : current.includeOutOfStock,
    excludedCategories: Array.isArray(patch.excludedCategories)
      ? patch.excludedCategories.map((c) => String(c).trim()).filter(Boolean)
      : current.excludedCategories,
  };
  return setKvJson('ai_settings', next);
}

export function saveChatLogToDb(entry: {
  sessionId?: string;
  userMessage: string;
  assistantReply: string;
  matchedProductIds: string[];
  modelUsed: string;
}) {
  const db = getDb();
  db.prepare(`
    INSERT INTO chat_logs (
      id, session_id, user_message, assistant_reply, matched_product_ids_json, model_used, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    `chat-${Date.now().toString(36)}-${Math.floor(Math.random() * 9999)}`,
    entry.sessionId || 'storefront',
    entry.userMessage.slice(0, 1000),
    entry.assistantReply.slice(0, 3000),
    JSON.stringify(entry.matchedProductIds),
    entry.modelUsed,
    new Date().toISOString()
  );
}

export function listChatLogsFromDb(limit = 80): ChatConversationLog[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM chat_logs ORDER BY created_at DESC LIMIT ?')
    .all(Math.min(200, Math.max(1, limit)));
  return rows.map((r) => ({
    id: String(r.id),
    sessionId: String(r.session_id),
    userMessage: String(r.user_message),
    assistantReply: String(r.assistant_reply),
    matchedProductIds: safeJsonParse<string[]>(r.matched_product_ids_json, []),
    modelUsed: String(r.model_used),
    createdAt: String(r.created_at),
  }));
}

// ============================================================
// Customers Management Helpers
// ============================================================

export function listCustomersFromDb(search = ''): CustomerRecord[] {
  const db = getDb();
  const allOrders = listOrdersFromDb();
  const ordersByEmail = new Map<string, { count: number; spent: number; lastAt: string | null }>();

  for (const ord of allOrders) {
    const email = ord.customer.email.trim().toLowerCase();
    if (!email) continue;
    const prev = ordersByEmail.get(email) ?? { count: 0, spent: 0, lastAt: null };
    const validRevenue = ord.status !== 'Cancelled' && ord.paymentStatus !== 'Refunded';
    ordersByEmail.set(email, {
      count: prev.count + 1,
      spent: prev.spent + (validRevenue ? ord.total : 0),
      lastAt: prev.lastAt && prev.lastAt > ord.createdAt ? prev.lastAt : ord.createdAt,
    });
  }

  const trimmed = search.trim().toLowerCase();
  const rows = trimmed
    ? db
        .prepare(
          `SELECT * FROM customers
           WHERE LOWER(full_name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(city) LIKE ? OR LOWER(phone) LIKE ?
           ORDER BY updated_at DESC LIMIT 300`
        )
        .all(`%${trimmed}%`, `%${trimmed}%`, `%${trimmed}%`, `%${trimmed}%`)
    : db.prepare('SELECT * FROM customers ORDER BY updated_at DESC LIMIT 300').all();

  return rows.map((r) => {
    const email = String(r.email).toLowerCase();
    const agg = ordersByEmail.get(email) ?? { count: 0, spent: 0, lastAt: null };
    return {
      id: String(r.id),
      fullName: String(r.full_name),
      email: String(r.email),
      phone: String(r.phone),
      address: String(r.address),
      city: String(r.city),
      postalCode: String(r.postal_code),
      country: String(r.country),
      status: String(r.status) === 'Suspended' ? 'Suspended' : 'Active',
      ordersCount: agg.count,
      totalSpent: Math.round(agg.spent * 100) / 100,
      lastOrderAt: agg.lastAt,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    };
  });
}

export function getCustomerDetailFromDb(
  id: string
): { customer: CustomerRecord; orders: OrderRecord[] } | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
  if (!row) return null;
  const email = String(row.email).toLowerCase();
  const customerOrders = listOrdersFromDb().filter(
    (o) => o.customer.email.trim().toLowerCase() === email
  );
  const validSpent = customerOrders
    .filter((o) => o.status !== 'Cancelled' && o.paymentStatus !== 'Refunded')
    .reduce((sum, o) => sum + o.total, 0);

  return {
    customer: {
      id: String(row.id),
      fullName: String(row.full_name),
      email: String(row.email),
      phone: String(row.phone),
      address: String(row.address),
      city: String(row.city),
      postalCode: String(row.postal_code),
      country: String(row.country),
      status: String(row.status) === 'Suspended' ? 'Suspended' : 'Active',
      ordersCount: customerOrders.length,
      totalSpent: Math.round(validSpent * 100) / 100,
      lastOrderAt: customerOrders[0]?.createdAt ?? null,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    },
    orders: customerOrders,
  };
}

export function updateCustomerStatusInDb(id: string, status: 'Active' | 'Suspended'): boolean {
  const db = getDb();
  const res = db
    .prepare('UPDATE customers SET status = ?, updated_at = ? WHERE id = ?')
    .run(status, new Date().toISOString(), id);
  return Number(res.changes) > 0;
}

export function deleteCustomerInDb(id: string): boolean {
  const db = getDb();
  const res = db.prepare('DELETE FROM customers WHERE id = ?').run(id);
  return Number(res.changes) > 0;
}

// ============================================================
// Inventory & Stock Adjustment History Helpers
// ============================================================

export function listInventoryFromDb(params: {
  filter?: 'all' | 'low' | 'out';
  q?: string;
  page?: number;
  pageSize?: number;
}): PaginatedProductsResponse {
  const db = getDb();
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const requestedPage = Math.max(1, params.page ?? 1);

  const conditions: string[] = [];
  const bindings: SQLInputValue[] = [];

  if (params.filter === 'low') {
    conditions.push('stock_count > 0 AND stock_count <= 5');
  } else if (params.filter === 'out') {
    conditions.push('stock_count <= 0');
  }

  if (params.q && params.q.trim()) {
    const pat = `%${params.q.trim().toLowerCase()}%`;
    conditions.push(
      '(LOWER(name) LIKE ? OR LOWER(brand) LIKE ? OR LOWER(category) LIKE ? OR LOWER(id) LIKE ?)'
    );
    bindings.push(pat, pat, pat, pat);
  }

  const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const total = Number(
    db.prepare(`SELECT COUNT(*) AS cnt FROM products ${whereSql}`).get(...bindings)?.cnt ?? 0
  );
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const offset = (page - 1) * pageSize;

  const rows = db
    .prepare(`SELECT * FROM products ${whereSql} ORDER BY stock_count ASC, sold_count DESC LIMIT ? OFFSET ?`)
    .all(...bindings, pageSize, offset);

  return {
    total,
    page,
    pageSize,
    totalPages,
    hasMore: page < totalPages,
    products: rows.map(rowToProduct),
  };
}

export function adjustProductStockInDb(
  productId: string,
  newStock: number,
  reason = 'Manual Inventory Adjustment',
  adjustedBy = 'Admin'
): { product: Product; adjustment: InventoryAdjustment } | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!row) return null;

  const existing = rowToProduct(row);
  const clampedStock = Math.max(0, Math.floor(newStock));
  const delta = clampedStock - existing.stockCount;
  const now = new Date().toISOString();
  const adjId = `adj-${Date.now().toString(36)}-${Math.floor(Math.random() * 99999)}`;

  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare('UPDATE products SET stock_count = ?, in_stock = ? WHERE id = ?').run(
      clampedStock,
      clampedStock > 0 ? 1 : 0,
      productId
    );
    db.prepare(`
      INSERT INTO stock_adjustments (
        id, product_id, product_name, previous_stock, new_stock, delta, reason, adjusted_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      adjId,
      productId,
      existing.name,
      existing.stockCount,
      clampedStock,
      delta,
      reason.trim() || 'Manual Inventory Adjustment',
      adjustedBy,
      now
    );
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  const updatedRow = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  return {
    product: updatedRow ? rowToProduct(updatedRow) : { ...existing, stockCount: clampedStock, inStock: clampedStock > 0 },
    adjustment: {
      id: adjId,
      productId,
      productName: existing.name,
      previousStock: existing.stockCount,
      newStock: clampedStock,
      delta,
      reason: reason.trim() || 'Manual Inventory Adjustment',
      adjustedBy,
      createdAt: now,
    },
  };
}

export function listStockAdjustmentsFromDb(limit = 100): InventoryAdjustment[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM stock_adjustments ORDER BY created_at DESC LIMIT ?')
    .all(Math.min(300, Math.max(1, limit)));
  return rows.map((r) => ({
    id: String(r.id),
    productId: String(r.product_id),
    productName: String(r.product_name),
    previousStock: Number(r.previous_stock),
    newStock: Number(r.new_stock),
    delta: Number(r.delta),
    reason: String(r.reason),
    adjustedBy: String(r.adjusted_by),
    createdAt: String(r.created_at),
  }));
}

// ============================================================
// Product Reviews Moderation Helpers
// ============================================================

function syncProductReviewAggregates(db: DatabaseSync, productId: string) {
  const approvedRows = db
    .prepare(
      "SELECT * FROM product_reviews WHERE product_id = ? AND status = 'approved' ORDER BY created_at DESC"
    )
    .all(productId);

  const reviewObjs = approvedRows.slice(0, 15).map((r) => ({
    id: String(r.id),
    author: String(r.author),
    role: String(r.role),
    date: String(r.created_at).slice(0, 10),
    rating: Number(r.rating),
    comment: String(r.comment),
  }));

  if (approvedRows.length > 0) {
    const avg =
      approvedRows.reduce((sum, r) => sum + Number(r.rating), 0) / approvedRows.length;
    const rounded = Math.round(avg * 10) / 10;
    db.prepare(
      'UPDATE products SET rating = ?, review_count = ?, reviews_json = ? WHERE id = ?'
    ).run(rounded, approvedRows.length, JSON.stringify(reviewObjs), productId);
  } else {
    db.prepare('UPDATE products SET review_count = 0, reviews_json = ? WHERE id = ?').run(
      '[]',
      productId
    );
  }
}

export function listReviewsFromDb(params: {
  status?: ReviewModerationStatus | 'all';
  q?: string;
  limit?: number;
}): ProductReviewRecord[] {
  const db = getDb();
  const conditions: string[] = [];
  const bindings: SQLInputValue[] = [];

  if (params.status && params.status !== 'all') {
    conditions.push('status = ?');
    bindings.push(params.status);
  }
  if (params.q && params.q.trim()) {
    const pat = `%${params.q.trim().toLowerCase()}%`;
    conditions.push(
      '(LOWER(product_name) LIKE ? OR LOWER(author) LIKE ? OR LOWER(comment) LIKE ?)'
    );
    bindings.push(pat, pat, pat);
  }

  const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = Math.min(300, Math.max(1, params.limit ?? 120));
  const rows = db
    .prepare(`SELECT * FROM product_reviews ${whereSql} ORDER BY created_at DESC LIMIT ?`)
    .all(...bindings, limit);

  return rows.map((r) => ({
    id: String(r.id),
    productId: String(r.product_id),
    productName: String(r.product_name),
    productSlug: String(r.product_slug),
    author: String(r.author),
    role: String(r.role),
    rating: Number(r.rating),
    comment: String(r.comment),
    status: String(r.status) as ReviewModerationStatus,
    createdAt: String(r.created_at),
  }));
}

export function submitProductReviewInDb(
  slugOrId: string,
  input: { author: string; rating: number; comment: string; role?: string }
): ProductReviewRecord | null {
  const db = getDb();
  const key = slugOrId.trim().toLowerCase();
  const prodRow = db
    .prepare('SELECT id, name, slug FROM products WHERE LOWER(slug) = ? OR LOWER(id) = ? LIMIT 1')
    .get(key, key);
  if (!prodRow) return null;

  const id = `rev-${Date.now().toString(36)}-${Math.floor(Math.random() * 9999)}`;
  const now = new Date().toISOString();
  const rating = Math.min(5, Math.max(1, Math.round(input.rating)));
  const productId = String(prodRow.id);

  db.prepare(`
    INSERT INTO product_reviews (
      id, product_id, product_name, product_slug, author, role, rating, comment, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
  `).run(
    id,
    productId,
    String(prodRow.name),
    String(prodRow.slug),
    input.author.trim() || 'Marketplace Client',
    input.role?.trim() || 'Verified Customer',
    rating,
    input.comment.trim(),
    now
  );

  return {
    id,
    productId,
    productName: String(prodRow.name),
    productSlug: String(prodRow.slug),
    author: input.author.trim() || 'Marketplace Client',
    role: input.role?.trim() || 'Verified Customer',
    rating,
    comment: input.comment.trim(),
    status: 'pending',
    createdAt: now,
  };
}

export function updateReviewStatusInDb(
  id: string,
  status: ReviewModerationStatus
): ProductReviewRecord | null {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM product_reviews WHERE id = ?').get(id);
  if (!existing) return null;

  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare('UPDATE product_reviews SET status = ? WHERE id = ?').run(status, id);
    syncProductReviewAggregates(db, String(existing.product_id));
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  return {
    id: String(existing.id),
    productId: String(existing.product_id),
    productName: String(existing.product_name),
    productSlug: String(existing.product_slug),
    author: String(existing.author),
    role: String(existing.role),
    rating: Number(existing.rating),
    comment: String(existing.comment),
    status,
    createdAt: String(existing.created_at),
  };
}

export function deleteReviewInDb(id: string): boolean {
  const db = getDb();
  const existing = db.prepare('SELECT product_id FROM product_reviews WHERE id = ?').get(id);
  if (!existing) return false;

  db.exec('BEGIN IMMEDIATE');
  try {
    const res = db.prepare('DELETE FROM product_reviews WHERE id = ?').run(id);
    syncProductReviewAggregates(db, String(existing.product_id));
    db.exec('COMMIT');
    return Number(res.changes) > 0;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

// ============================================================
// Real-Time SQLite Admin Dashboard Analytics
// ============================================================

export function getAdminAnalyticsFromDb(): AdminAnalyticsPayload {
  const db = getDb();

  const prodRow = db
    .prepare(`
      SELECT
        COUNT(*) AS total_products,
        SUM(CASE WHEN stock_count > 0 AND stock_count <= 5 THEN 1 ELSE 0 END) AS low_stock,
        SUM(CASE WHEN stock_count <= 0 OR in_stock = 0 THEN 1 ELSE 0 END) AS out_of_stock,
        SUM(CASE WHEN discount_pct > 0 THEN 1 ELSE 0 END) AS on_sale,
        COALESCE(SUM(sold_count), 0) AS total_sales_units
      FROM products
    `)
    .get();

  const catCount = Number(db.prepare('SELECT COUNT(*) AS cnt FROM categories').get()?.cnt ?? 0);
  const custCount = Number(db.prepare('SELECT COUNT(*) AS cnt FROM customers').get()?.cnt ?? 0);
  const pendingRevCount = Number(
    db.prepare("SELECT COUNT(*) AS cnt FROM product_reviews WHERE status = 'pending'").get()?.cnt ?? 0
  );

  const allOrders = listOrdersFromDb();
  const validOrders = allOrders.filter(
    (o) => o.status !== 'Cancelled' && o.paymentStatus !== 'Refunded'
  );
  const totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = allOrders.filter((o) =>
    ['Pending', 'Confirmed', 'Preparing Shipment', 'Processing', 'Shipped'].includes(o.status)
  ).length;
  const completedOrders = allOrders.filter((o) => o.status === 'Delivered').length;

  // Build real 6-month series from actual orders in DB
  const now = new Date();
  const monthBuckets: Array<{ key: string; label: string; revenue: number; orders: number }> = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' });
    monthBuckets.push({ key, label, revenue: 0, orders: 0 });
  }
  const bucketMap = new Map(monthBuckets.map((b) => [b.key, b]));
  for (const ord of validOrders) {
    const ym = ord.createdAt.slice(0, 7);
    const bucket = bucketMap.get(ym);
    if (bucket) {
      bucket.revenue = Math.round((bucket.revenue + ord.total) * 100) / 100;
      bucket.orders += 1;
    }
  }

  // Real order revenue attribution by product category + catalog units sold
  const prodCatRows = db.prepare('SELECT id, category FROM products').all();
  const prodCatMap = new Map(prodCatRows.map((r) => [String(r.id), String(r.category)]));
  const orderRevByCat = new Map<string, number>();
  for (const ord of validOrders) {
    for (const item of ord.items) {
      const cat = prodCatMap.get(item.productId) || 'Other';
      orderRevByCat.set(cat, (orderRevByCat.get(cat) ?? 0) + item.price * item.quantity);
    }
  }

  const catPerfRows = db
    .prepare(`
      SELECT
        category,
        COUNT(*) AS product_count,
        COALESCE(SUM(sold_count), 0) AS units_sold,
        COALESCE(SUM(price * stock_count), 0) AS catalog_value
      FROM products
      GROUP BY category
      ORDER BY units_sold DESC, product_count DESC
      LIMIT 10
    `)
    .all();

  const categoryPerformance = catPerfRows.map((r) => {
    const catName = String(r.category);
    return {
      category: catName,
      productCount: Number(r.product_count),
      unitsSold: Number(r.units_sold),
      catalogValue: Math.round(Number(r.catalog_value)),
      revenue: Math.round((orderRevByCat.get(catName) ?? 0) * 100) / 100,
    };
  });

  const bestSellingProducts = db
    .prepare('SELECT * FROM products ORDER BY sold_count DESC, rating DESC LIMIT 6')
    .all()
    .map(rowToProduct);

  const recentCustomers = listCustomersFromDb('').slice(0, 6);

  return {
    summary: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders: allOrders.length,
      totalProducts: Number(prodRow?.total_products ?? 0),
      totalCustomers: custCount,
      pendingOrders,
      completedOrders,
      lowStockProducts: Number(prodRow?.low_stock ?? 0),
      outOfStockProducts: Number(prodRow?.out_of_stock ?? 0),
      totalSalesUnits: Number(prodRow?.total_sales_units ?? 0),
      totalCategories: catCount,
      onSaleCount: Number(prodRow?.on_sale ?? 0),
      pendingReviewsCount: pendingRevCount,
    },
    monthlySeries: monthBuckets.map((b) => ({
      month: b.label,
      revenue: b.revenue,
      orders: b.orders,
    })),
    categoryPerformance,
    recentOrders: allOrders.slice(0, 8),
    bestSellingProducts,
    recentCustomers,
  };
}

