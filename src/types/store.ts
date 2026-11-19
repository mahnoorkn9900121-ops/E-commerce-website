export const MARKETPLACE_CATEGORIES = [
  'Electronics',
  'Mobile Phones',
  'Laptops & Computers',
  'Fashion & Clothing',
  'Men\'s Fashion',
  'Women\'s Fashion',
  'Shoes & Sneakers',
  'Watches',
  'Beauty & Personal Care',
  'Home & Kitchen',
  'Furniture',
  'Sports & Fitness',
  'Gaming Accessories',
  'Cameras',
  'Headphones & Audio',
  'Smart Watches',
  'Toys & Baby Products',
  'Books & Stationery',
  'Accessories',
  'Home Appliances',
] as const;

export type ProductCategory = (typeof MARKETPLACE_CATEGORIES)[number] | (string & {});

export interface ProductColorVariant {
  name: string;
  hex: string;
}

export interface ProductReview {
  id: string;
  author: string;
  role: string;
  date: string;
  rating: number;
  comment: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: ProductCategory;
  subcategory: string;
  price: number;
  compareAtPrice?: number;
  rating: number;
  reviewCount: number;
  reviews: ProductReview[];
  inStock: boolean;
  stockCount: number;
  popularity: number;
  soldCount?: number;
  featured: boolean;
  isFlashSale?: boolean;
  isTrending?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  shortDescription: string;
  description: string;
  specs: Record<string, string>;
  colors: ProductColorVariant[];
  sizes: string[];
  tags: string[];
  image: string;
  images: string[];
  createdAt?: string;
}

export type ProductSortOption =
  | 'featured'
  | 'popular'
  | 'rating'
  | 'price-asc'
  | 'price-desc'
  | 'newest';

export interface ProductSearchParams {
  q?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  onSaleOnly?: boolean;
  flashSaleOnly?: boolean;
  inStockOnly?: boolean;
  sortBy?: ProductSortOption;
  limit?: number;
  offset?: number;
  page?: number;
  pageSize?: number;
}

export interface CatalogFacets {
  brands: string[];
  subcategories: string[];
  minPrice: number;
  maxPrice: number;
}

export interface PaginatedProductsResponse {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
  products: Product[];
  facets?: CatalogFacets;
}

export interface CategorySummary {
  slug: string;
  name: string;
  description: string;
  image: string;
  productCount: number;
  subcategories: string[];
  sortOrder?: number;
  isVisible?: boolean;
}

export interface BrandCollectionSummary {
  name: string;
  productCount: number;
  topCategory: string;
  sampleImage: string;
}

export interface MarketplaceHomePayload {
  totalProducts: number;
  totalCategories: number;
  totalBrands: number;
  flashSale: Product[];
  trending: Product[];
  bestSelling: Product[];
  newArrivals: Product[];
  dailyDeals: Product[];
  categories: CategorySummary[];
  brands: BrandCollectionSummary[];
}

export interface SearchSuggestionPayload {
  query: string;
  queries: string[];
  popularKeywords?: string[];
  categories: Array<{ name: string; slug: string; productCount: number; image: string }>;
  brands: Array<{ name: string; productCount: number }>;
  products: Product[];
}

export interface AdminStatsPayload {
  totalProducts: number;
  totalCategories: number;
  totalOrders: number;
  inStockCount: number;
  outOfStockCount: number;
  onSaleCount: number;
  flashSaleCount: number;
  totalRevenue: number;
}

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  selectedColor: string;
  selectedSize: string;
  quantity: number;
  stockCount: number;
}

export interface CustomerProfile {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export type OrderStatus =
  | 'Pending'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | 'Confirmed'
  | 'Preparing Shipment';

export type PaymentStatus = 'Paid' | 'Pending' | 'Refunded' | 'Failed';

export interface OrderRecord {
  orderNumber: string;
  createdAt: string;
  updatedAt?: string;
  status: OrderStatus;
  paymentMethod: 'Card' | 'Apple Pay' | 'Cash on Delivery';
  paymentStatus?: PaymentStatus;
  refundNote?: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  customer: CustomerProfile;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  products?: Product[];
  suggestedFollowUps?: string[];
  error?: boolean;
}

export type PolicyTopic =
  | 'about'
  | 'shipping'
  | 'returns'
  | 'privacy'
  | 'terms'
  | 'contact';

export type MarketplaceView =
  | { type: 'home' }
  | { type: 'category'; category: string; subcategory?: string }
  | { type: 'search'; query: string; brand?: string; onSaleOnly?: boolean; flashSaleOnly?: boolean; sortBy?: ProductSortOption }
  | { type: 'admin' };

// ============================================================
// Admin Dashboard, CMS, Customers, AI & Analytics Types
// ============================================================

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export type HomepageSectionKey =
  | 'categories'
  | 'flashSale'
  | 'curatedShowcase'
  | 'brands'
  | 'exploreFeed';

export interface HomepageSectionConfig {
  key: HomepageSectionKey;
  label: string;
  visible: boolean;
}

export interface HomepageCmsConfig {
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  promoBannerText: string;
  promoBannerActive: boolean;
  sections: HomepageSectionConfig[];
}

export interface NavMenuItem {
  id: string;
  label: string;
  actionType: 'home' | 'categories' | 'flashDeals' | 'allProducts' | 'search' | 'category' | 'policy' | 'admin';
  targetValue?: string;
  visible: boolean;
}

export interface FooterCmsConfig {
  tagline: string;
  copyrightText: string;
  shippingNotice: string;
  socialLinks: {
    instagram: string;
    twitter: string;
    youtube: string;
  };
}

export interface AboutCmsConfig {
  headline: string;
  story: string;
  warrantyStatement: string;
  shippingPolicy: string;
  returnsPolicy: string;
  privacyPolicy: string;
  termsPolicy: string;
}

export interface ContactCmsConfig {
  email: string;
  phone: string;
  showroom: string;
  hours: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface BannerItem {
  id: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaQuery: string;
  image: string;
  active: boolean;
  sortOrder: number;
}

export interface SiteSettings {
  websiteName: string;
  logoText: string;
  logoUrl: string;
  faviconUrl: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  currency: 'USD' | 'EUR' | 'GBP';
  socialUrls: {
    instagram: string;
    twitter: string;
    youtube: string;
  };
  seoTitle: string;
  seoDescription: string;
  defaultTheme: 'light' | 'dark';
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

export interface FullCmsPayload {
  homepage: HomepageCmsConfig;
  navigation: NavMenuItem[];
  footer: FooterCmsConfig;
  about: AboutCmsConfig;
  contact: ContactCmsConfig;
  faqs: FaqItem[];
  banners: BannerItem[];
  settings: SiteSettings;
}

export type GeminiConciergeModel = 'gemini-4-hydrogen' | 'gemini-3.1-flash-lite';

export interface AiChatbotConfig {
  enabled: boolean;
  model: GeminiConciergeModel;
  welcomeMessage: string;
  suggestedPrompts: string[];
  customInstructions: string;
  includeOutOfStock: boolean;
  excludedCategories: string[];
}

export interface PublicAiConfig {
  enabled: boolean;
  welcomeMessage: string;
  suggestedPrompts: string[];
}

export interface ChatConversationLog {
  id: string;
  sessionId: string;
  userMessage: string;
  assistantReply: string;
  matchedProductIds: string[];
  modelUsed: string;
  createdAt: string;
}

export interface CustomerRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  status: 'Active' | 'Suspended';
  ordersCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryAdjustment {
  id: string;
  productId: string;
  productName: string;
  previousStock: number;
  newStock: number;
  delta: number;
  reason: string;
  adjustedBy: string;
  createdAt: string;
}

export type ReviewModerationStatus = 'approved' | 'pending' | 'rejected';

export interface ProductReviewRecord {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  author: string;
  role: string;
  rating: number;
  comment: string;
  status: ReviewModerationStatus;
  createdAt: string;
}

export interface AdminAnalyticsPayload {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    totalCustomers: number;
    pendingOrders: number;
    completedOrders: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    totalSalesUnits: number;
    totalCategories: number;
    onSaleCount: number;
    pendingReviewsCount: number;
  };
  monthlySeries: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
  categoryPerformance: Array<{
    category: string;
    productCount: number;
    unitsSold: number;
    catalogValue: number;
    revenue: number;
  }>;
  recentOrders: OrderRecord[];
  bestSellingProducts: Product[];
  recentCustomers: CustomerRecord[];
}

export interface StorefrontBootstrapPayload {
  cms: FullCmsPayload;
  categories: CategorySummary[];
  ai: PublicAiConfig;
}

