import { CATEGORY_DEFINITIONS } from '../src/data/catalog.ts';
import type {
  Product,
  ProductColorVariant,
  ProductReview,
} from '../src/types/store.ts';

interface CuratedBlueprint {
  id?: string;
  name: string;
  brand: string;
  subcategory: string;
  price: number;
  compareAtPrice?: number;
  rating?: number;
  reviewCount?: number;
  stockCount?: number;
  shortDescription: string;
  description?: string;
  specs: Record<string, string>;
  colors?: ProductColorVariant[];
  sizes?: string[];
  tags?: string[];
  images?: string[];
  featured?: boolean;
  isFlashSale?: boolean;
  isTrending?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
}

interface SubcategorySeedGroup {
  subcategory: string;
  brands: string[];
  modelLines: string[];
  editions: string[];
  priceRange?: [number, number];
  sizesPool?: string[][];
  tags?: string[];
  summaryTemplate?: string;
  specsOverride?: (brand: string, model: string, idx: number) => Record<string, string>;
}

interface CategoryGeneratorConfig {
  category: string;
  targetCount?: number;
  heroSpecsTemplate: (brand: string, series: string, sub: string, tierIdx: number) => Record<string, string>;
  brands: string[];
  subcategories: string[];
  modelLines: string[];
  brandModels?: Record<string, string[]>;
  subcategoryGroups?: SubcategorySeedGroup[];
  editions: string[];
  priceRange: [number, number];
  colorsPool: ProductColorVariant[];
  sizesPool: string[][];
  imagesPool: string[];
  summaryTemplates: string[];
  extraTags?: string[];
  curated: CuratedBlueprint[];
}

const DEFAULT_IMAGES = {
  electronics: [
    '/src/assets/images/cat_electronics_speaker_1794937158424.jpg',
    '/src/assets/images/product_studio_monitor_1794935884234.jpg',
    '/src/assets/images/product_planar_headphones_1794934153518.jpg',
    '/src/assets/images/product_desk_clock_1794935887037.jpg',
  ],
  phones: [
    '/src/assets/images/product_phone_ceramic_1794934152279.jpg',
    '/src/assets/images/product_phone_lite_1794934152864.jpg',
    '/src/assets/images/product_tablet_stylus_1794935885871.jpg',
  ],
  laptops: [
    '/src/assets/images/product_aetherbook_pro_1794934151952.jpg',
    '/src/assets/images/product_aetherbook_air_1794934151549.jpg',
    '/src/assets/images/product_studio_monitor_1794935884234.jpg',
    '/src/assets/images/product_tablet_stylus_1794935885871.jpg',
  ],
  fashion: [
    '/src/assets/images/product_cashmere_knit_1794935885365.jpg',
    '/src/assets/images/product_merino_coat_1794934153415.jpg',
    '/src/assets/images/cat_womens_fashion_1794937154454.jpg',
    '/src/assets/images/product_selvedge_denim_1794935886521.jpg',
  ],
  mens: [
    '/src/assets/images/product_merino_coat_1794934153415.jpg',
    '/src/assets/images/product_selvedge_denim_1794935886521.jpg',
    '/src/assets/images/product_cashmere_knit_1794935885365.jpg',
    '/src/assets/images/product_weekender_tote_1794934154195.jpg',
  ],
  womens: [
    '/src/assets/images/cat_womens_fashion_1794937154454.jpg',
    '/src/assets/images/product_cashmere_knit_1794935885365.jpg',
    '/src/assets/images/product_weekender_tote_1794934154195.jpg',
    '/src/assets/images/product_merino_coat_1794934153415.jpg',
  ],
  shoes: [
    '/src/assets/images/product_obsidian_sneaker_1794934149829.jpg',
    '/src/assets/images/product_carbon_runner_1794934149798.jpg',
    '/src/assets/images/product_chalk_lowtop_1794934150634.jpg',
    '/src/assets/images/product_chelsea_boot_1794935884279.jpg',
    '/src/assets/images/product_trail_boot_1794935883596.jpg',
    '/src/assets/images/product_leather_loafer_1794935884716.jpg',
  ],
  watches: [
    '/src/assets/images/product_titanium_watch_1794934154617.jpg',
    '/src/assets/images/product_desk_clock_1794935887037.jpg',
    '/src/assets/images/cat_smart_watch_1794937155343.jpg',
  ],
  beauty: [
    '/src/assets/images/cat_beauty_skincare_1794937154046.jpg',
    '/src/assets/images/product_ceramic_vase_1794935886828.jpg',
  ],
  homeKitchen: [
    '/src/assets/images/product_espresso_machine_1794935886703.jpg',
    '/src/assets/images/product_ceramic_vase_1794935886828.jpg',
    '/src/assets/images/product_travertine_lamp_1794934154162.jpg',
    '/src/assets/images/product_desk_clock_1794935887037.jpg',
  ],
  furniture: [
    '/src/assets/images/cat_furniture_chair_1794937154157.jpg',
    '/src/assets/images/product_travertine_lamp_1794934154162.jpg',
    '/src/assets/images/product_ceramic_vase_1794935886828.jpg',
  ],
  sports: [
    '/src/assets/images/cat_sports_fitness_1794937155937.jpg',
    '/src/assets/images/product_carbon_runner_1794934149798.jpg',
    '/src/assets/images/product_trail_boot_1794935883596.jpg',
  ],
  gaming: [
    '/src/assets/images/cat_gaming_gear_1794937157253.jpg',
    '/src/assets/images/product_mech_keyboard_1794935884595.jpg',
    '/src/assets/images/product_studio_monitor_1794935884234.jpg',
    '/src/assets/images/product_planar_headphones_1794934153518.jpg',
  ],
  cameras: [
    '/src/assets/images/product_mirrorless_camera_1794935886115.jpg',
    '/src/assets/images/product_phone_ceramic_1794934152279.jpg',
  ],
  audio: [
    '/src/assets/images/product_planar_headphones_1794934153518.jpg',
    '/src/assets/images/cat_electronics_speaker_1794937158424.jpg',
  ],
  smartWatches: [
    '/src/assets/images/cat_smart_watch_1794937155343.jpg',
    '/src/assets/images/product_titanium_watch_1794934154617.jpg',
  ],
  toys: [
    '/src/assets/images/cat_toys_baby_1794937156688.jpg',
    '/src/assets/images/product_ceramic_vase_1794935886828.jpg',
  ],
  books: [
    '/src/assets/images/cat_books_stationery_1794937156513.jpg',
    '/src/assets/images/product_desk_clock_1794935887037.jpg',
  ],
  accessories: [
    '/src/assets/images/product_weekender_tote_1794934154195.jpg',
    '/src/assets/images/product_desk_clock_1794935887037.jpg',
    '/src/assets/images/product_titanium_watch_1794934154617.jpg',
  ],
  appliances: [
    '/src/assets/images/cat_home_appliance_1794937156735.jpg',
    '/src/assets/images/product_espresso_machine_1794935886703.jpg',
  ],
};

const REVIEWERS = [
  ['Marcus Sterling', 'Verified Buyer'],
  ['Sora Takahashi', 'Product Designer'],
  ['Elena Rostova', 'Verified Buyer'],
  ['Julian Vance', 'Architect'],
  ['Nadia Al-Mansoor', 'Tech Reviewer'],
  ['Liam O’Connor', 'Verified Buyer'],
  ['Claire Moreau', 'Interior Stylist'],
  ['Devon Patel', 'Systems Engineer'],
  ['Hana Kim', 'Creative Director'],
  ['Mateo Silva', 'Verified Buyer'],
];

const REVIEW_COMMENTS = [
  'Exceeded expectations right out of the box. Build finish and everyday reliability are outstanding.',
  'True to specification with thoughtful detailing. Fast courier dispatch and protective packaging.',
  'Great value for the performance tier. Been using it daily for three weeks without a single flaw.',
  'Clean industrial design and solid materials. Easily outperforms comparable models in this price bracket.',
  'Fits seamlessly into my setup. Accurate sizing, crisp finish, and responsive customer support.',
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function deterministicHash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function buildReviews(id: string, rating: number, seedNum: number): ProductReview[] {
  const r1 = REVIEWERS[seedNum % REVIEWERS.length];
  const r2 = REVIEWERS[(seedNum + 3) % REVIEWERS.length];
  const c1 = REVIEW_COMMENTS[seedNum % REVIEW_COMMENTS.length];
  const c2 = REVIEW_COMMENTS[(seedNum + 2) % REVIEW_COMMENTS.length];
  const rounded = Math.max(4, Math.min(5, Math.round(rating)));
  return [
    {
      id: `${id}-rev-1`,
      author: r1[0],
      role: r1[1],
      date: '2026-02-14',
      rating: rounded,
      comment: c1,
    },
    {
      id: `${id}-rev-2`,
      author: r2[0],
      role: r2[1],
      date: '2026-01-27',
      rating: Math.max(4, rounded - (seedNum % 3 === 0 ? 1 : 0)),
      comment: c2,
    },
  ];
}

function rotateImages(pool: string[], offset: number): string[] {
  const len = pool.length;
  const result: string[] = [];
  for (let i = 0; i < Math.min(3, len); i += 1) {
    result.push(pool[(offset + i) % len]);
  }
  return result;
}

const CATEGORY_CONFIGS: CategoryGeneratorConfig[] = [
  {
    category: 'Electronics',
    brands: ['Sonos', 'Anker', 'Apple', 'Samsung', 'Belkin', 'LG', 'Philips Hue', 'Aether Labs'],
    subcategories: ['Smart Speakers', 'Power & Charging', 'Streaming & TV', 'Smart Home Hubs', 'Projectors'],
    modelLines: ['Era', 'Prime', 'UltraCharge', 'CineBeam', 'StudioHub', 'HomeCore', 'Beam', 'NanoDock'],
    brandModels: {
      Sonos: ['Era 100', 'Era 300', 'Beam Gen 2', 'Arc Ultra', 'Move 2', 'Roam 2', 'Sub Mini'],
      Anker: ['Prime 250W GaN', 'Prime 27,650mAh', 'MagGo Qi2 Station', 'Solix C300', 'Nano II 100W'],
      Apple: ['HomePod 2', 'HomePod Mini', 'Apple TV 4K', 'MagSafe Duo', 'AirTag 4-Pack'],
      Samsung: ['Freestyle Gen 2 Projector', 'Music Frame', 'Q-Series Soundbar', 'SmartThings Hub'],
      Belkin: ['UltraCharge Qi2', 'BoostCharge Pro 3-in-1', 'Thunderbolt 4 Dock', 'SurgePro 12-Outlet'],
      LG: ['CineBeam Q 4K', 'StanbyME Go', 'XBOOM 360', 'CineBeam S Laser'],
      'Philips Hue': ['Gradient Lightstrip', 'Hue Bridge Pro', 'Play HDMI Sync Box', 'Signe Floor Lamp'],
      'Aether Labs': ['StudioHub Pro', 'HomeCore Matter Hub', 'NanoDock GaN', 'Acoustic Soundbar'],
    },
    editions: ['GaN II Edition', 'Wi-Fi 7 Pro', 'Spatial Audio', 'Qi2 Magnetic', '4K HDR10+', 'Matter Certified', 'Studio Reserve', 'Gen 3'],
    priceRange: [39, 1299],
    colorsPool: [
      { name: 'Matte Black', hex: '#1B1B1D' },
      { name: 'Chalk White', hex: '#F2EFE9' },
      { name: 'Brushed Titanium', hex: '#8A8985' },
      { name: 'Slate Navy', hex: '#283444' },
    ],
    sizesPool: [['Standard'], ['65W', '100W', '140W'], ['Room Kit', 'Starter Pack']],
    imagesPool: DEFAULT_IMAGES.electronics,
    summaryTemplates: [
      'Precision-engineered smart electronics designed for seamless multi-room connectivity and clean power delivery.',
      'Modern everyday connected hardware featuring Matter support, low standby draw, and anodized housing.',
    ],
    heroSpecsTemplate: (brand, series, sub, tier) => ({
      Brand: brand,
      Series: series,
      Category: sub,
      Connectivity: tier % 2 === 0 ? 'Wi-Fi 7, Bluetooth 5.4, Thread' : 'USB-C PD 3.1, Wi-Fi 6E, Matter',
      Chassis: 'Anodized Aluminum & Matte Polycarbonate',
      Warranty: '2-Year Official Warranty',
    }),
    curated: [
      {
        name: 'Sonos Era 300 Spatial Audio Smart Speaker',
        brand: 'Sonos',
        subcategory: 'Smart Speakers',
        price: 429,
        compareAtPrice: 449,
        rating: 4.9,
        shortDescription: 'Six-driver spatial Dolby Atmos speaker with Trueplay room tuning and Wi-Fi 6.',
        specs: { Drivers: '6 Class-D Amplified', Audio: 'Dolby Atmos Spatial', Connectivity: 'Wi-Fi 6, Bluetooth 5.0, AirPlay 2', Voice: 'Far-Field Mic Array' },
        featured: true,
        isTrending: true,
        isBestSeller: true,
      },
      {
        name: 'Anker Prime 250W 6-Port GaN Desktop Charger',
        brand: 'Anker',
        subcategory: 'Power & Charging',
        price: 139,
        compareAtPrice: 169,
        rating: 4.9,
        shortDescription: '250W high-output GaN charging station with LCD wattage display and dual 140W USB-C ports.',
        specs: { Output: '250W Max Total', Ports: '4× USB-C + 2× USB-A', Display: '2.26" Smart Wattage LCD', Tech: 'ActiveShield 3.0 GaN' },
        isFlashSale: true,
        isBestSeller: true,
      },
      {
        name: 'Apple TV 4K 128GB Wi-Fi + Ethernet',
        brand: 'Apple',
        subcategory: 'Streaming & TV',
        price: 149,
        rating: 4.9,
        shortDescription: 'A15 Bionic 4K Dolby Vision media hub with Thread border router and Siri Remote.',
        specs: { Processor: 'A15 Bionic', Video: '4K Dolby Vision & HDR10+', Storage: '128GB', SmartHome: 'Matter & Thread Hub' },
        featured: true,
      },
      {
        name: 'Belkin UltraCharge Qi2 3-in-1 Foldable Stand',
        brand: 'Belkin',
        subcategory: 'Power & Charging',
        price: 98,
        compareAtPrice: 129,
        rating: 4.8,
        shortDescription: '15W certified Qi2 magnetic fast-charging stand for phone, watch, and earbuds.',
        specs: { Standard: 'Qi2 15W Fast Charge', Compatibility: 'MagSafe & Qi2 Devices', Included: '36W USB-C Power Supply', Design: 'Travel Foldable' },
        isFlashSale: true,
      },
    ],
  },
  {
    category: 'Mobile Phones',
    brands: ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Sony', 'Nothing', 'Aether Labs'],
    subcategories: ['Flagship Smartphones', 'Foldables', '5G Mid-Range', 'Creator Phones', 'Unlocked Handsets'],
    modelLines: ['iPhone', 'Galaxy S', 'Pixel', 'OnePlus', 'Xiaomi', 'Xperia', 'Phone'],
    brandModels: {
      Apple: ['iPhone 17 Pro Max', 'iPhone 17 Pro', 'iPhone 17', 'iPhone 17 Air', 'iPhone 16 Pro', 'iPhone 16e'],
      Samsung: ['Galaxy S25 Ultra', 'Galaxy S25+', 'Galaxy S25', 'Galaxy Z Fold 6', 'Galaxy Z Flip 6', 'Galaxy A56 5G', 'Galaxy A36 5G'],
      Google: ['Pixel 10 Pro XL', 'Pixel 10 Pro', 'Pixel 10', 'Pixel 9 Pro Fold', 'Pixel 9a 5G'],
      OnePlus: ['OnePlus 13 Pro', 'OnePlus 13', 'OnePlus 13R', 'OnePlus Open', 'OnePlus Nord 4'],
      Xiaomi: ['Xiaomi 15 Ultra', 'Xiaomi 15 Pro', 'Xiaomi 15', 'Redmi Note 14 Pro+', 'Mix Flip'],
      Sony: ['Xperia 1 VI', 'Xperia 5 VI', 'Xperia 10 VI'],
      Nothing: ['Phone (3)', 'Phone (2a) Plus', 'Phone (2a) Special'],
      'Aether Labs': ['Obsidian Phone 2', 'Obsidian Phone Air', 'Studio Ceramic Handset'],
    },
    editions: ['5G Unlocked', 'Titanium Edition', 'Creator Pack', 'Dual-SIM Global', 'Studio Matte', '120Hz OLED', 'Pro Optics'],
    priceRange: [299, 1799],
    colorsPool: [
      { name: 'Desert Titanium', hex: '#B89E82' },
      { name: 'Obsidian Black', hex: '#18181A' },
      { name: 'Titanium Gray', hex: '#7A7A76' },
      { name: 'Ceramic White', hex: '#F3F1EC' },
    ],
    sizesPool: [['128GB', '256GB', '512GB'], ['256GB', '512GB', '1TB']],
    imagesPool: DEFAULT_IMAGES.phones,
    extraTags: ['mobile', 'smartphone', 'phone', '5g unlocked'],
    summaryTemplates: [
      'Unlocked 5G smartphone featuring LTPO OLED 120Hz display, multi-lens computational optics, and all-day battery.',
      'Flagship mobile architecture engineered for low-light photography, titanium durability, and rapid USB-C charging.',
    ],
    heroSpecsTemplate: (brand, series, sub, tier) => ({
      Brand: brand,
      Series: series,
      Category: sub,
      Display: tier % 2 === 0 ? '6.8" LTPO OLED 120Hz' : '6.3" ProMotion AMOLED 120Hz',
      Network: 'Unlocked 5G Dual eSIM + Wi-Fi 7',
      Rating: 'IP68 Water & Dust Resistant',
    }),
    curated: [
      {
        name: 'Apple iPhone 17 Pro Max 256GB Titanium',
        brand: 'Apple',
        subcategory: 'Flagship Smartphones',
        price: 1199,
        compareAtPrice: 1299,
        rating: 5.0,
        reviewCount: 412,
        shortDescription: '6.9-inch ProMotion OLED flagship with A19 Pro silicon, 5x tetraprism telephoto, and Grade 5 titanium.',
        specs: { Chip: 'Apple A19 Pro (3nm)', Display: '6.9" Super Retina XDR 120Hz', Camera: '48MP Fusion + 5x Telephoto', Chassis: 'Grade 5 Titanium · USB-C' },
        sizes: ['256GB', '512GB', '1TB'],
        featured: true,
        isBestSeller: true,
        isTrending: true,
        isNewArrival: true,
        tags: ['iphone', 'iphone 17', 'iphone 17 pro max', 'apple', 'flagship', 'smartphone', 'mobile'],
      },
      {
        name: 'Apple iPhone 17 Pro 128GB',
        brand: 'Apple',
        subcategory: 'Flagship Smartphones',
        price: 999,
        rating: 4.9,
        reviewCount: 268,
        shortDescription: 'Compact 6.3-inch titanium iPhone with A19 Pro GPU, ProRAW capture, and all-day battery.',
        specs: { Chip: 'Apple A19 Pro', Display: '6.3" 120Hz ProMotion OLED', Camera: '48MP Triple Pro System', Material: 'Brushed Titanium' },
        sizes: ['128GB', '256GB', '512GB'],
        featured: true,
        isTrending: true,
        tags: ['iphone', 'iphone 17 pro', 'apple', 'phone', 'mobile'],
      },
      {
        name: 'Apple iPhone 16 Pro 256GB Unlocked',
        brand: 'Apple',
        subcategory: 'Flagship Smartphones',
        price: 899,
        compareAtPrice: 999,
        rating: 4.9,
        reviewCount: 315,
        shortDescription: '4K120 Dolby Vision iPhone with Camera Control button and Desert Titanium frame.',
        specs: { Chip: 'Apple A18 Pro', Display: '6.3" Super Retina XDR', Camera: '48MP Fusion + Ultra Wide', Storage: '256GB' },
        sizes: ['128GB', '256GB', '512GB'],
        isFlashSale: true,
        tags: ['iphone', 'iphone 16', 'apple', 'mobile', 'smartphone'],
      },
      {
        name: 'Samsung Galaxy S25 Ultra 512GB Titanium',
        brand: 'Samsung',
        subcategory: 'Flagship Smartphones',
        price: 1219,
        compareAtPrice: 1399,
        rating: 4.9,
        reviewCount: 344,
        shortDescription: '200MP Quad Telephoto flagship with embedded S Pen, Gorilla Armor 2 anti-reflective glass, and Snapdragon Elite.',
        specs: { Processor: 'Snapdragon 8 Elite for Galaxy', Camera: '200MP Wide + 50MP 5x Zoom', Display: '6.9" QHD+ Dynamic AMOLED 2X', Stylus: 'Integrated S Pen' },
        sizes: ['256GB', '512GB', '1TB'],
        featured: true,
        isFlashSale: true,
        isBestSeller: true,
        tags: ['samsung', 'samsung galaxy', 's25 ultra', 'android', 'smartphone', 'mobile'],
      },
      {
        name: 'Samsung Galaxy Z Fold 6 256GB',
        brand: 'Samsung',
        subcategory: 'Foldables',
        price: 1599,
        compareAtPrice: 1899,
        rating: 4.8,
        shortDescription: 'Dual-screen foldable smartphone unfolding into a 7.6-inch workstation canvas.',
        specs: { MainScreen: '7.6" QXGA+ Foldable AMOLED', CoverScreen: '6.3" Dynamic AMOLED 2X', Hinge: 'Dual Rail Armor Aluminum', RAM: '12GB LPDDR5X' },
        sizes: ['256GB', '512GB', '1TB'],
        isFlashSale: true,
        tags: ['samsung', 'samsung galaxy', 'foldable', 'z fold', 'mobile'],
      },
      {
        name: 'Samsung Galaxy A56 5G Unlocked',
        brand: 'Samsung',
        subcategory: '5G Mid-Range',
        price: 429,
        compareAtPrice: 499,
        rating: 4.7,
        shortDescription: '120Hz Super AMOLED 5G phone with OIS 50MP camera and 5,000mAh fast-charging battery.',
        specs: { Display: '6.6" FHD+ 120Hz AMOLED', Battery: '5,000mAh · 45W Fast Charge', Storage: '128GB + microSD', Rating: 'IP67' },
        isTrending: true,
        tags: ['samsung', 'samsung galaxy', 'a56', 'budget phone', 'mobile'],
      },
      {
        id: 'mk-tech-02',
        name: 'Kova Obsidian Phone 2',
        brand: 'Aether Labs',
        subcategory: 'Flagship Smartphones',
        price: 949,
        compareAtPrice: 1099,
        rating: 4.9,
        reviewCount: 184,
        stockCount: 22,
        shortDescription: 'Matte ceramic chassis flagship with 50MP 1-inch sensor and zero bloatware.',
        specs: { Display: '6.7" 120Hz LTPO AMOLED', Camera: '50MP 1-inch Sony Sensor', Storage: '256GB UFS 4.0', Charging: '45W USB-C & 25W Qi2' },
        sizes: ['256GB', '512GB'],
        featured: true,
        tags: ['kova', 'phone', 'smartphone', 'ceramic', 'mobile'],
      },
    ],
  },
  {
    category: 'Laptops & Computers',
    brands: ['Apple', 'ASUS', 'Razer', 'Lenovo', 'Dell', 'Acer', 'HP', 'Aether Labs'],
    subcategories: ['Gaming Laptops', 'Ultrabooks', 'Creator Workstations', 'Budget Laptops', 'Desktops & Monitors'],
    modelLines: ['ROG Zephyrus', 'Blade', 'Legion Pro', 'MacBook Pro', 'XPS', 'ThinkPad X1', 'Aspire', 'AetherBook'],
    brandModels: {
      Apple: ['MacBook Pro 16" M4 Max', 'MacBook Pro 14" M4 Pro', 'MacBook Air 15" M4', 'MacBook Air 13" M4', 'Mac Studio M4', 'iMac 24" 4.5K'],
      ASUS: ['ROG Zephyrus G16', 'ROG Strix Scar 16', 'Zenbook 14 OLED', 'Vivobook S 15', 'ProArt P16'],
      Razer: ['Blade 16 OLED', 'Blade 14', 'Blade 18'],
      Lenovo: ['Legion Pro 7i', 'Legion Slim 5', 'ThinkPad X1 Carbon', 'Yoga 9i 2-in-1', 'IdeaPad Slim 5'],
      Dell: ['XPS 16 OLED', 'XPS 14', 'XPS 13 Snapdragon', 'Alienware m16 R2', 'Inspiron 15'],
      Acer: ['Nitro V 15', 'Predator Helios Neo 16', 'Swift Go 14 OLED', 'Aspire 5'],
      HP: ['Spectre x360 14', 'OMEN Transcend 14', 'Envy 16 Creator', 'Pavilion Aero 13'],
      'Aether Labs': ['AetherBook Pro 16"', 'AetherBook Air 14"', 'Aether Studio Monitor'],
    },
    editions: ['OLED Edition', 'RTX 5070 Laptop', 'Workstation', 'Slim Laptop', 'Creator 16', 'AI Ready', 'Studio Edition'],
    priceRange: [369, 3499],
    colorsPool: [
      { name: 'Space Black', hex: '#1B1C1E' },
      { name: 'Anodized Silver', hex: '#D0D2D6' },
      { name: 'Eclipse Gray', hex: '#4B4E54' },
    ],
    sizesPool: [['16GB / 512GB', '32GB / 1TB'], ['16GB / 1TB', '32GB / 2TB', '64GB / 2TB'], ['8GB / 256GB', '16GB / 512GB']],
    imagesPool: DEFAULT_IMAGES.laptops,
    extraTags: ['laptop', 'laptops', 'computer', 'notebook'],
    summaryTemplates: [
      'CNC aluminum laptop engineered for sustained thermal performance, color-accurate displays, and rapid NVMe storage.',
      'High-efficiency mobile computing platform built for developers, gamers, and creative workflows.',
    ],
    heroSpecsTemplate: (brand, series, sub, tier) => ({
      Brand: brand,
      Series: series,
      Category: sub,
      Graphics: sub.includes('Gaming') ? 'NVIDIA GeForce RTX 4070 / 5070' : tier % 2 === 0 ? 'Integrated 12-Core GPU' : 'Studio Discrete GPU',
      Display: '16:10 Anti-Glare IPS / OLED',
      Ports: 'Thunderbolt 4, HDMI 2.1, Wi-Fi 7',
    }),
    curated: [
      {
        id: 'mk-tech-01',
        name: 'AetherBook Pro 16" Workstation',
        brand: 'Aether Labs',
        subcategory: 'Creator Workstations',
        price: 2149,
        compareAtPrice: 2399,
        rating: 5.0,
        reviewCount: 205,
        stockCount: 16,
        shortDescription: 'CNC-milled aluminum 16-inch laptop with 120Hz Tandem OLED display and 18-hour battery.',
        specs: { Display: '16" 3.2K 120Hz OLED', Processor: '14-Core ARM Silicon', Memory: '32GB Unified LPDDR5X', Storage: '1TB PCIe 4.0 NVMe' },
        sizes: ['32GB / 1TB', '64GB / 2TB'],
        featured: true,
        isBestSeller: true,
        tags: ['laptop', 'workstation', 'oled laptop'],
      },
      {
        name: 'ASUS ROG Zephyrus G16 OLED Gaming Laptop',
        brand: 'ASUS',
        subcategory: 'Gaming Laptops',
        price: 1849,
        compareAtPrice: 2099,
        rating: 4.9,
        reviewCount: 278,
        shortDescription: 'Ultra-slim 240Hz ROG Nebula OLED gaming laptop powered by RTX 4070 and Intel Core Ultra 9.',
        specs: { GPU: 'NVIDIA GeForce RTX 4070 8GB', CPU: 'Intel Core Ultra 9 185H', Display: '16" 2.5K 240Hz OLED', Cooling: 'Tri-Fan Liquid Metal' },
        featured: true,
        isFlashSale: true,
        isTrending: true,
        tags: ['gaming laptop', 'laptop', 'asus', 'rog', 'oled', 'rtx'],
      },
      {
        name: 'Razer Blade 16 Dual-Mode Gaming Laptop',
        brand: 'Razer',
        subcategory: 'Gaming Laptops',
        price: 2699,
        rating: 4.9,
        shortDescription: 'Anodized unibody gaming laptop with RTX 4080 graphics, Vapor Chamber cooling, and per-key RGB.',
        specs: { GPU: 'NVIDIA GeForce RTX 4080 12GB', CPU: 'Intel Core i9-14900HX', Display: '16" 240Hz QHD+ OLED', Chassis: 'CNC T6 Aluminum' },
        featured: true,
        tags: ['gaming laptop', 'laptop', 'razer', 'blade 16'],
      },
      {
        name: 'Acer Nitro V 15 Budget Gaming Laptop',
        brand: 'Acer',
        subcategory: 'Gaming Laptops',
        price: 699,
        compareAtPrice: 849,
        rating: 4.7,
        shortDescription: 'High-value 144Hz IPS gaming laptop with NVIDIA RTX 4050 and dual-fan exhaust.',
        specs: { GPU: 'NVIDIA GeForce RTX 4050 6GB', CPU: 'Intel Core i5-13420H', Display: '15.6" FHD 144Hz IPS', RAM: '16GB DDR5' },
        isFlashSale: true,
        isBestSeller: true,
        tags: ['gaming laptop', 'laptop', 'cheapest gaming laptop', 'acer', 'budget gaming'],
      },
      {
        name: 'Lenovo IdeaPad Slim 3 15.6" Laptop',
        brand: 'Lenovo',
        subcategory: 'Budget Laptops',
        price: 429,
        compareAtPrice: 499,
        rating: 4.7,
        shortDescription: 'Lightweight everyday Ryzen 5 laptop under $500 with FHD anti-glare panel and 512GB SSD.',
        specs: { CPU: 'AMD Ryzen 5 7520U', Memory: '16GB LPDDR5', Storage: '512GB NVMe SSD', Display: '15.6" FHD IPS' },
        isBestSeller: true,
        tags: ['laptop', 'under 500', 'budget laptop', 'lenovo'],
      },
      {
        name: 'ASUS Vivobook Go 15 OLED Laptop',
        brand: 'ASUS',
        subcategory: 'Budget Laptops',
        price: 459,
        compareAtPrice: 549,
        rating: 4.8,
        shortDescription: 'Vivid 15.6-inch FHD OLED laptop under $500 built for students and remote professionals.',
        specs: { CPU: 'AMD Ryzen 5 7520U', Display: '15.6" FHD OLED 600 nits', Storage: '512GB NVMe SSD', Weight: '1.63 kg' },
        isTrending: true,
        tags: ['laptop', 'under 500', 'asus', 'vivobook'],
      },
      {
        name: 'Apple MacBook Air 15" M4',
        brand: 'Apple',
        subcategory: 'Ultrabooks',
        price: 1249,
        compareAtPrice: 1299,
        rating: 5.0,
        shortDescription: 'Fanless 15.3-inch Liquid Retina laptop powered by Apple M4 silicon and 18-hour battery.',
        specs: { Chip: 'Apple M4 (10-Core CPU)', Display: '15.3" Liquid Retina', Memory: '16GB Unified', Weight: '1.51 kg' },
        featured: true,
        isNewArrival: true,
        tags: ['laptop', 'macbook', 'apple', 'ultrabook'],
      },
      {
        id: 'mk-tech-04',
        name: 'Aether Studio 32" 6K Monitor',
        brand: 'Aether Labs',
        subcategory: 'Desktops & Monitors',
        price: 1599,
        rating: 4.9,
        stockCount: 7,
        shortDescription: 'Nano-textured 6K Retina reference display calibrated to 99.8% DCI-P3.',
        specs: { Resolution: '6016 × 3384 (6K)', ColorGamut: '99.8% DCI-P3', Panel: 'IPS Black Nano-Matte', Hub: '96W Thunderbolt 4' },
        sizes: ['Standard Stand', 'Height-Adjustable Pro Stand'],
      },
    ],
  },
  {
    category: 'Fashion & Clothing',
    brands: ['COS', 'Uniqlo U', 'Everlane', 'Theory', 'Vince', 'Patagonia', 'AllSaints', 'MAISON KOVA'],
    subcategories: ['Knitwear', 'Outerwear', 'Everyday Essentials', 'Loungewear', 'Active Layers'],
    modelLines: ['Atelier Knit', 'Merino Crew', 'Organic Hoodie', 'Boxy Tee', 'Trench Coat', 'Tech Fleece', 'Linen Overshirt', 'Relaxed Blazer'],
    editions: ['Heavyweight 400gsm', 'Fine Gauge Wool', 'Organic Cotton', 'Double-Faced', 'Garment-Dyed', 'Water-Repellent', 'Capsule Edition', 'All-Season'],
    priceRange: [38, 590],
    colorsPool: [
      { name: 'Charcoal', hex: '#2F2F31' },
      { name: 'Oatmeal', hex: '#DFD6C7' },
      { name: 'Jet Black', hex: '#151515' },
      { name: 'Sage Olive', hex: '#636B59' },
    ],
    sizesPool: [['XS', 'S', 'M', 'L', 'XL']],
    imagesPool: DEFAULT_IMAGES.fashion,
    summaryTemplates: [
      'Architectural wardrobe essential cut from breathable natural fibers with reinforced flatlock tailoring.',
      'Minimalist seasonal garment crafted for structured drape, everyday comfort, and enduring wear.',
    ],
    heroSpecsTemplate: (brand, series, sub, tier) => ({
      Brand: brand,
      Collection: series,
      Department: sub,
      Fabric: tier % 2 === 0 ? '100% Grade-A Mongolian Cashmere / Merino' : 'Heavyweight Organic Cotton Twill',
      Care: 'Cold Gentle Wash or Dry Clean',
      Fit: 'Modern Tailored Silhouette',
    }),
    curated: [
      {
        name: 'MAISON KOVA Grade-A Cashmere Crewneck',
        brand: 'MAISON KOVA',
        subcategory: 'Knitwear',
        price: 245,
        compareAtPrice: 295,
        rating: 4.9,
        shortDescription: '12-gauge combed Inner Mongolian cashmere sweater knitted with zero-waste seamless shoulders.',
        specs: { Material: '100% Grade-A Cashmere', Gauge: '12GG Two-Ply', Fit: 'Relaxed Tailored', Origin: 'Biella Yarn' },
        featured: true,
        isBestSeller: true,
      },
      {
        name: 'Uniqlo U Heavyweight Supima Capsule Hoodie',
        brand: 'Uniqlo U',
        subcategory: 'Loungewear',
        price: 54,
        compareAtPrice: 69,
        rating: 4.8,
        shortDescription: '440gsm brushed loopback fleece pullover with structured double-layered hood.',
        specs: { Fabric: '100% Supima Cotton 440gsm', Seams: 'Reinforced Double-Needle', Fit: 'Boxy Modern' },
        isFlashSale: true,
      },
    ],
  },
  {
    category: "Men's Fashion",
    brands: ['MAISON KOVA', 'AllSaints', 'Hugo Boss', 'Patagonia', 'Ralph Lauren', 'Levi’s', 'Arc’teryx', 'Carhartt WIP'],
    subcategories: ['Black Jackets & Outerwear', 'Coats & Blazers', 'Denim & Trousers', 'Shirts & Polos', 'Men’s Knitwear'],
    modelLines: ['Obsidian Jacket', 'Bomber Jacket', 'Field Jacket', 'Merino Overcoat', 'Selvedge Denim', 'Oxford Shirt', 'Harrington Jacket', 'Storm Parka'],
    editions: ['Matte Black', 'Storm Shell', 'Raw Indigo', 'Structured Wool', 'Packable Down', 'Tailored Fit', 'Heavy Canvas', 'Waxed Cotton'],
    priceRange: [55, 680],
    colorsPool: [
      { name: 'Jet Black', hex: '#141416' },
      { name: 'Charcoal Slate', hex: '#383A3E' },
      { name: 'Raw Indigo', hex: '#1F2A44' },
      { name: 'Camel', hex: '#A98358' },
    ],
    sizesPool: [['S', 'M', 'L', 'XL', 'XXL'], ['30', '32', '34', '36']],
    imagesPool: DEFAULT_IMAGES.mens,
    extraTags: ['men', 'mens', "men's fashion", 'menswear'],
    summaryTemplates: [
      'Precision-tailored menswear crafted for sharp silhouette, weather resistance, and effortless daily layering.',
      'Durable heritage fabrics paired with matte black hardware and breathable structured linings.',
    ],
    heroSpecsTemplate: (brand, series, sub, tier) => ({
      Brand: brand,
      Line: series,
      Category: sub,
      OuterMaterial: tier % 2 === 0 ? '3-Layer Matte Technical Nylon / Wool Blend' : '14oz Japanese Selvedge / Cotton Twill',
      Hardware: 'YKK Excella Matte Black Zippers',
      Fit: 'Tailored Menswear Cut',
    }),
    curated: [
      {
        name: "Men's Obsidian Matte Black Bomber Jacket",
        brand: 'AllSaints',
        subcategory: 'Black Jackets & Outerwear',
        price: 189,
        compareAtPrice: 249,
        rating: 4.9,
        reviewCount: 214,
        shortDescription: 'Water-resistant matte black men’s jacket with PrimaLoft insulation and YKK Excella hardware.',
        specs: { Color: 'Matte Jet Black', Insulation: '60g Recycled PrimaLoft', Shell: 'DWR Japanese Nylon', Pockets: '2 Zip Welts + Interior Chest' },
        featured: true,
        isFlashSale: true,
        isBestSeller: true,
        tags: ['men black jacket', 'mens black jackets', 'black jacket', 'bomber', 'mens fashion'],
      },
      {
        name: "Men's Alpine Insulated Black Shell Jacket",
        brand: 'Arc’teryx',
        subcategory: 'Black Jackets & Outerwear',
        price: 279,
        compareAtPrice: 320,
        rating: 4.9,
        shortDescription: 'Windproof black hardshell jacket with articulated elbows and breathable GORE-TEX membrane.',
        specs: { Color: 'Black', Membrane: 'GORE-TEX 3L', Weight: '340g', Seams: 'Micro-Taped Waterproof' },
        isTrending: true,
        tags: ['men black jacket', 'mens black jackets', 'black jacket', 'rain jacket'],
      },
      {
        name: "Men's Harrington Waxed Black Jacket",
        brand: 'Carhartt WIP',
        subcategory: 'Black Jackets & Outerwear',
        price: 145,
        rating: 4.8,
        shortDescription: 'Clean-cut black cotton canvas jacket with corduroy collar and brushed flannel lining.',
        specs: { Color: 'Black', Material: '12oz Organic Dearborn Canvas', Lining: 'Diamond Quilted' },
        tags: ['men black jacket', 'mens black jackets', 'black jacket'],
      },
      {
        id: 'mk-apparel-01',
        name: "Men's Double-Faced Merino Overcoat",
        brand: 'MAISON KOVA',
        subcategory: 'Coats & Blazers',
        price: 540,
        compareAtPrice: 640,
        rating: 4.9,
        stockCount: 9,
        shortDescription: 'Unlined Italian virgin merino wool overcoat with horn buttons and clean architectural lapels.',
        specs: { Fabric: '100% Virgin Merino Wool (680gsm)', Construction: 'Hand-Finished Double-Faced', Buttons: 'Natural Smoked Horn' },
        featured: true,
        tags: ['men coat', 'black coat', 'merino', 'mens fashion'],
      },
    ],
  },
  {
    category: "Women's Fashion",
    brands: ['Sézane', 'Reformation', 'Vince', 'COS', 'Theory', 'Aritzia', 'Mango Selection', 'MAISON KOVA'],
    subcategories: ['Dresses & Skirts', 'Coats & Trench', 'Silk Tops & Blouses', 'Tailored Trousers', 'Knitwear'],
    modelLines: ['Atelier Trench', 'Silk Slip Dress', 'Pleated Trouser', 'Cashmere Wrap', 'Sculpted Blazer', 'Ribbed Midi Dress', 'Linen Suit', 'Poplin Shirt'],
    editions: ['Silk Charmeuse', 'Belted Wool', 'Cropped Tailored', 'Pleated Linen', 'Fine Merino', 'Studio Cream', 'Evening Edit', 'Capsule Silk'],
    priceRange: [48, 560],
    colorsPool: [
      { name: 'Cream Ivory', hex: '#F3EEE4' },
      { name: 'Espresso', hex: '#3B2D26' },
      { name: 'Obsidian Black', hex: '#171718' },
      { name: 'Terracotta', hex: '#A9634A' },
    ],
    sizesPool: [['XXS', 'XS', 'S', 'M', 'L', 'XL']],
    imagesPool: DEFAULT_IMAGES.womens,
    extraTags: ['women', 'womens', "women's fashion", 'womenswear'],
    summaryTemplates: [
      'Effortless women’s ready-to-wear sculpted in fluid silk, Italian wool, and organic French linen.',
      'Tailored silhouette engineered for clean movement from studio hours to evening occasions.',
    ],
    heroSpecsTemplate: (brand, series, sub, tier) => ({
      Brand: brand,
      Collection: series,
      Category: sub,
      Composition: tier % 2 === 0 ? '100% 19-Momme Mulberry Silk / Merino' : 'Italian Virgin Wool & Tencel Blend',
      Fit: 'Fluid Architectural Drape',
      Origin: 'Ethical Atelier Certified',
    }),
    curated: [
      {
        name: "COS Women's Double-Breasted Belted Wool Coat",
        brand: 'COS',
        subcategory: 'Coats & Trench',
        price: 340,
        compareAtPrice: 410,
        rating: 4.9,
        shortDescription: 'Full-length brushed RWS wool coat with oversized notched lapels and detachable waist tie.',
        specs: { Fabric: '100% RWS Certified Wool', Lining: 'Viscose Twill', Fit: 'Relaxed Longline' },
        featured: true,
        isBestSeller: true,
      },
      {
        name: "Theory Women's Mulberry Silk Charmeuse Blouse",
        brand: 'Theory',
        subcategory: 'Silk Tops & Blouses',
        price: 215,
        rating: 4.8,
        shortDescription: 'Bias-cut 19-momme pure silk shirt with concealed mother-of-pearl placket.',
        specs: { SilkWeight: '19-Momme Mulberry Silk', Closures: 'Mother-of-Pearl Buttons', Care: 'Eco Dry Clean' },
        isNewArrival: true,
      },
    ],
  },
  {
    category: 'Shoes & Sneakers',
    targetCount: 85,
    brands: ['Nike', 'Adidas', 'New Balance', 'Hoka', 'Asics', 'Salomon', 'MAISON KOVA', 'Common Projects'],
    subcategories: [
      'Air Max & Lifestyle Sneakers',
      "Women's Shoes & Sneakers",
      'Running Shoes',
      'Leather Boots',
      'Loafers & Dress',
      'Trail Footwear',
    ],
    modelLines: ['Air Max', 'Pegasus', 'Ultraboost', '990v6', 'XT-6', 'Clifton', 'Chelsea Boot', 'Court Low'],
    subcategoryGroups: [
      {
        subcategory: "Women's Shoes & Sneakers",
        brands: ['Nike', 'Adidas', 'New Balance', 'Hoka', 'Asics', 'MAISON KOVA'],
        modelLines: [
          "Women's Air Max 90 Sneakers",
          "Women's Pegasus 41 Running Shoes",
          "Women's Clifton 9 Shoes",
          "Women's Ultraboost Running Shoes",
          "Women's 327 Suede Shoes",
          "Women's Gel-Nimbus Shoes",
          "Women's Nappa Court Sneakers",
          "Women's Trail Runner Shoes",
        ],
        editions: ['Chalk / Rose', 'Triple White', 'Espresso Suede', 'Cloud Cushion', 'Lightweight Mesh', 'Essential'],
        priceRange: [88, 345],
        sizesPool: [['US 5.5', 'US 6', 'US 7', 'US 8', 'US 9', 'US 10']],
        tags: ['women', 'womens', "women's shoes", 'shoes', 'sneakers', 'footwear'],
        summaryTemplate: "Sculpted women's footwear engineered with anatomical arch support, plush midsole cushioning, and breathable uppers.",
      },
      {
        subcategory: 'Air Max & Lifestyle Sneakers',
        brands: ['Nike', 'Adidas', 'New Balance', 'MAISON KOVA', 'Common Projects'],
        modelLines: ['Air Max 90', 'Air Max 97', 'Air Force 1', 'Gazelle', '550 Court', 'Achilles Low', 'Obsidian Sneaker'],
        editions: ['Essential', 'Triple Black', 'Chalk Gum', 'Suede Pack', 'Heritage Edition'],
        priceRange: [95, 395],
        tags: ['shoes', 'sneakers', 'lifestyle sneakers', 'footwear'],
      },
      {
        subcategory: 'Running Shoes',
        brands: ['Nike', 'Adidas', 'Hoka', 'Asics', 'New Balance'],
        modelLines: ['Pegasus 41', 'Vomero 18', 'Ultraboost Light', 'Clifton 9', 'Gel-Nimbus 27', '1080v14'],
        editions: ['Carbon Plate', 'Breathe Mesh', 'Road Runner', 'All-Weather'],
        priceRange: [110, 275],
        tags: ['shoes', 'running shoes', 'sneakers'],
      },
      {
        subcategory: 'Leather Boots',
        brands: ['MAISON KOVA', 'Common Projects', 'Salomon'],
        modelLines: ['Chelsea Boot', 'Combat Lace-Up Boot', 'Suede Desert Boot', 'Alpine Gore-Tex Boot'],
        editions: ['Goodyear Welted', 'Italian Calfskin', 'Vibram Commando', 'GTX Waterproof'],
        priceRange: [185, 460],
        tags: ['shoes', 'boots', 'leather boots', 'footwear'],
      },
      {
        subcategory: 'Loafers & Dress',
        brands: ['MAISON KOVA', 'Common Projects'],
        modelLines: ['Italian Penny Loafer', 'Tassel Suede Loafer', 'Minimalist Derby Shoe', 'Cap-Toe Oxford'],
        editions: ['Full-Grain Calfskin', 'Lug Sole', 'Hand-Burnished', 'Suede'],
        priceRange: [210, 440],
        tags: ['shoes', 'loafers', 'dress shoes', 'footwear'],
      },
      {
        subcategory: 'Trail Footwear',
        brands: ['Salomon', 'Hoka', 'Nike', 'Adidas'],
        modelLines: ['XT-6 GTX', 'Speedcross 6', 'Speedgoat 6', 'Pegasus Trail 5', 'Terrex Free Hiker'],
        editions: ['GTX Waterproof', 'Vibram Megagrip', 'Quicklace', 'Ripstop'],
        priceRange: [130, 260],
        tags: ['shoes', 'trail shoes', 'sneakers', 'outdoor'],
      },
    ],
    editions: ['Essential', 'GTX Waterproof', 'Made in USA', 'Carbon Plate', 'Nappa Leather', 'Suede Pack', 'Triple Black', 'Chalk Gum'],
    priceRange: [75, 460],
    colorsPool: [
      { name: 'Triple Black', hex: '#141416' },
      { name: 'Chalk / Sail', hex: '#EDEAE2' },
      { name: 'Cognac Leather', hex: '#8A5332' },
      { name: 'Graphite Slate', hex: '#4C4E52' },
    ],
    sizesPool: [['US 7', 'US 8', 'US 9', 'US 10', 'US 11', 'US 12']],
    imagesPool: DEFAULT_IMAGES.shoes,
    extraTags: ['shoes', 'sneakers', 'footwear'],
    summaryTemplates: [
      'Responsive midsole cushioning paired with breathable engineered mesh or full-grain Italian leather uppers.',
      'High-traction rubber outsole geometry built for all-day urban mileage and structured support.',
    ],
    heroSpecsTemplate: (brand, series, sub, tier) => ({
      Brand: brand,
      Model: series,
      Category: sub,
      Midsole: tier % 2 === 0 ? 'Visible Air Cushioning / Dual-Density EVA' : 'Goodyear-Welted Leather & Vibram Commando',
      Upper: sub.includes('Boot') || sub.includes('Loafer') ? 'Full-Grain Italian Calfskin' : 'Ripstop Mesh & Suede Overlays',
      Outsole: 'High-Abrasion Carbon Rubber',
    }),
    curated: [
      {
        name: 'Nike Air Max 90 Essential Sneakers',
        brand: 'Nike',
        subcategory: 'Air Max & Lifestyle Sneakers',
        price: 129,
        compareAtPrice: 150,
        rating: 4.9,
        reviewCount: 486,
        shortDescription: 'Iconic Waffle outsole and visible Max Air heel cushioning with stitched leather overlays.',
        specs: { Cushioning: 'Visible Max Air Heel Unit', Upper: 'Leather & Ripstop Mesh', Outsole: 'Classic Rubber Waffle', Fit: 'True to Size' },
        featured: true,
        isBestSeller: true,
        isFlashSale: true,
        tags: ['nike', 'nike air max', 'air max 90', 'sneakers', 'shoes'],
      },
      {
        name: 'Nike Air Max 270 Triple Black',
        brand: 'Nike',
        subcategory: 'Air Max & Lifestyle Sneakers',
        price: 149,
        compareAtPrice: 170,
        rating: 4.9,
        reviewCount: 312,
        shortDescription: '270-degree Max Air heel unit and stretchy knit bootie construction in Triple Black.',
        specs: { AirUnit: '270° Max Air Cushion', Upper: 'Engineered Mesh Bootie', Weight: '318g' },
        featured: true,
        isTrending: true,
        tags: ['nike', 'nike air max', 'air max 270', 'black sneakers', 'shoes'],
      },
      {
        name: 'Nike Air Max Dn Dynamic Air',
        brand: 'Nike',
        subcategory: 'Air Max & Lifestyle Sneakers',
        price: 159,
        rating: 4.8,
        shortDescription: 'Dual-pressure Dynamic Air tube system delivering seamless heel-to-toe responsiveness.',
        specs: { Tech: 'Dynamic Air Dual-Chamber Tubes', Midsole: 'Phylon Foam', Upper: 'Multilayered Textured Mesh' },
        isNewArrival: true,
        tags: ['nike', 'nike air max', 'air max dn', 'shoes'],
      },
      {
        name: "Nike Women's Air Max Muse Sneakers",
        brand: 'Nike',
        subcategory: "Women's Shoes & Sneakers",
        price: 138,
        compareAtPrice: 160,
        rating: 4.9,
        reviewCount: 245,
        shortDescription: "Sculpted women's Air Max sneaker with elevated arch geometry, Air heel unit, and breathable satin-mesh upper.",
        specs: { Gender: "Women's", Cushioning: 'Visible Air Heel Unit', Upper: 'Satin Mesh & Synthetic Leather', Fit: "Women's True to Size" },
        sizes: ['US 5.5', 'US 6', 'US 7', 'US 8', 'US 9', 'US 10'],
        featured: true,
        isTrending: true,
        isFlashSale: true,
        tags: ['women', 'womens', "women's shoes", 'nike', 'nike shoes', 'sneakers', 'shoes'],
      },
      {
        name: "Hoka Women's Clifton 9 Running Shoes",
        brand: 'Hoka',
        subcategory: "Women's Shoes & Sneakers",
        price: 145,
        rating: 4.9,
        reviewCount: 318,
        shortDescription: "Ultralight women's daily road-running shoes with responsive CMEVA foam and Meta-Rocker geometry.",
        specs: { Gender: "Women's", Drop: '5mm', Weight: '205g', Upper: 'Engineered Breathable Knit' },
        sizes: ['US 6', 'US 7', 'US 8', 'US 9', 'US 10'],
        isBestSeller: true,
        tags: ['women', 'womens', "women's shoes", 'running shoes', 'hoka', 'shoes'],
      },
      {
        name: "MAISON KOVA Women's Chelsea Calfskin Ankle Boots",
        brand: 'MAISON KOVA',
        subcategory: "Women's Shoes & Sneakers",
        price: 310,
        compareAtPrice: 365,
        rating: 4.9,
        reviewCount: 142,
        shortDescription: "Hand-lasted women's leather Chelsea boots with sleek almond toe and lightweight Vibram rubber sole.",
        specs: { Gender: "Women's", Upper: 'Full-Grain Italian Calfskin', Sole: 'Vibram Lightweight Lug', Heel: '35mm Stacked' },
        sizes: ['US 6', 'US 7', 'US 8', 'US 9'],
        isNewArrival: true,
        tags: ['women', 'womens', "women's shoes", 'womens boots', 'leather boots', 'shoes'],
      },
      {
        name: "New Balance Women's 327 Suede Lifestyle Shoes",
        brand: 'New Balance',
        subcategory: "Women's Shoes & Sneakers",
        price: 99,
        compareAtPrice: 115,
        rating: 4.8,
        shortDescription: "70s-inspired women's casual sneakers combining suede overlays with a wrap-around lug outsole.",
        specs: { Gender: "Women's", Material: 'Suede & Nylon', Outsole: 'Trail-Inspired Studded Rubber' },
        sizes: ['US 5.5', 'US 6.5', 'US 7.5', 'US 8.5', 'US 9.5'],
        isFlashSale: true,
        tags: ['women', 'womens', "women's shoes", 'new balance', 'sneakers', 'shoes'],
      },
      {
        id: 'mk-footwear-01',
        name: 'Kova Obsidian Architectural Sneaker',
        brand: 'MAISON KOVA',
        subcategory: 'Air Max & Lifestyle Sneakers',
        price: 295,
        compareAtPrice: 345,
        rating: 4.9,
        stockCount: 18,
        shortDescription: 'Full-grain matte black Italian calfskin sneaker with Margom rubber cupsole.',
        specs: { Upper: 'Full-Grain Tuscan Calfskin', Sole: 'Italian Margom Cupsole', Lining: 'Vegetable-Tanned Lambskin' },
        featured: true,
        tags: ['sneakers', 'black sneakers', 'leather shoes', 'shoes'],
      },
      {
        id: 'mk-footwear-02',
        name: 'Kova Carbon Runner 01',
        brand: 'MAISON KOVA',
        subcategory: 'Running Shoes',
        price: 235,
        rating: 4.8,
        stockCount: 24,
        shortDescription: 'Ultra-lightweight Cordura ballistic mesh runner with Vibram Megagrip traction.',
        specs: { Upper: 'Cordura Ballistic Mesh', Outsole: 'Vibram Megagrip', Drop: '8mm' },
        tags: ['shoes', 'running shoes', 'sneakers'],
      },
      {
        id: 'mk-footwear-03',
        name: 'Kova Chalk Minimalist Low-Top',
        brand: 'MAISON KOVA',
        subcategory: 'Air Max & Lifestyle Sneakers',
        price: 270,
        rating: 4.9,
        stockCount: 0,
        shortDescription: 'Hand-lasted chalk white nappa leather court sneaker with tonal waxed laces.',
        specs: { Upper: 'Soft Italian Nappa Leather', Sole: 'Stitched Gum Rubber', Status: 'Limited Run' },
        tags: ['shoes', 'sneakers', 'white sneakers'],
      },
    ],
  },
  {
    category: 'Watches',
    brands: ['Seiko', 'Tissot', 'Hamilton', 'Citizen', 'Casio G-Shock', 'Longines', 'MAISON KOVA', 'Tudor'],
    subcategories: ['Automatic Diver', 'Chronograph', 'Dress & Minimalist', 'GMT & Field', 'Titanium Editions'],
    modelLines: ['Prospex', 'PRX Powermatic', 'Khaki Field', 'Eco-Drive', 'Master Chronometer', 'Horology Mk II', 'Black Bay', 'Presage'],
    brandModels: {
      Seiko: ['Prospex Diver', 'Presage Cocktail Time', 'Seiko 5 Sports GMT', 'Alpinist Field'],
      Tissot: ['PRX Powermatic 80', 'Seastar 1000', 'Gentleman Titanium', 'Le Locle'],
      Hamilton: ['Khaki Field Murph', 'Khaki Field Mechanical', 'Intra-Matic Chronograph'],
      Citizen: ['Eco-Drive Promaster', 'Tsuyosa Automatic', 'Series 8 GMT'],
      'Casio G-Shock': ['G-Shock Full Metal', 'G-Shock CasiOak', 'Master of G Mudmaster'],
      Longines: ['HydroConquest GMT', 'Spirit Zulu Time', 'Flagship Heritage'],
      'MAISON KOVA': ['Chronograph Titanium', 'Horology Mk II Dress', 'Field GMT 39mm'],
      Tudor: ['Black Bay 58', 'Pelagos 39 Titanium', 'Ranger 39'],
    },
    editions: ['Sapphire Automatic', 'Grade 5 Titanium', '200m Diver', 'Solar Quartz', 'Exhibition Back', 'Bauhaus 38mm', 'Heritage Leather'],
    priceRange: [95, 2850],
    colorsPool: [
      { name: 'Brushed Titanium', hex: '#888985' },
      { name: 'Midnight Blue', hex: '#1B2D4B' },
      { name: 'Obsidian Black', hex: '#161618' },
      { name: 'Champagne Silver', hex: '#D6CFC2' },
    ],
    sizesPool: [['38mm', '40mm', '42mm']],
    imagesPool: DEFAULT_IMAGES.watches,
    summaryTemplates: [
      'Swiss or Japanese mechanical timepiece housed beneath anti-reflective sapphire crystal with 100m+ water resistance.',
      'Precision-regulated watch engineered for legibility, balanced wrist ergonomics, and long power reserve.',
    ],
    heroSpecsTemplate: (brand, series, sub, tier) => ({
      Brand: brand,
      Model: series,
      Style: sub,
      Movement: tier % 2 === 0 ? 'Automatic Mechanical (80h Power Reserve)' : 'High-Accuracy Solar / Quartz',
      Crystal: 'Domed Sapphire w/ AR Coating',
      WaterResistance: sub.includes('Diver') ? '200m / 20 ATM' : '100m / 10 ATM',
    }),
    curated: [
      {
        id: 'mk-obj-01',
        name: 'Kova Chronograph Titanium Watch',
        brand: 'MAISON KOVA',
        subcategory: 'Chronograph',
        price: 780,
        compareAtPrice: 890,
        rating: 5.0,
        stockCount: 11,
        shortDescription: 'Grade 5 brushed titanium chronograph with double-domed sapphire and Swiss Sellita movement.',
        specs: { Case: '40mm Grade 5 Titanium', Crystal: 'Sapphire w/ AR', Movement: 'Swiss Automatic Chronograph', WaterResistance: '100m' },
        featured: true,
        isBestSeller: true,
      },
      {
        name: 'Tissot PRX Powermatic 80 Automatic',
        brand: 'Tissot',
        subcategory: 'Dress & Minimalist',
        price: 695,
        compareAtPrice: 750,
        rating: 4.9,
        shortDescription: '1970s-inspired integrated steel bracelet watch with 80-hour Nivachron hairspring movement.',
        specs: { Case: '40mm 316L Stainless Steel', PowerReserve: '80 Hours', Dial: 'Waffle Texture', Crystal: 'Scratch-Resistant Sapphire' },
        featured: true,
        isTrending: true,
      },
    ],
  },
  {
    category: 'Beauty & Personal Care',
    targetCount: 96,
    brands: ['Byredo', 'Dior Beauty', 'Tom Ford', 'Chanel', 'YSL Beauty', 'Jo Malone', 'Aesop', 'La Roche-Posay', 'The Ordinary', 'CeraVe', 'Charlotte Tilbury', 'NARS', 'Fenty Beauty', 'Dyson Beauty', 'Olaplex'],
    subcategories: [
      'Perfumes',
      "Men's Fragrances",
      "Women's Fragrances",
      'Skincare',
      'Makeup',
      'Hair Care & Tools',
    ],
    modelLines: ['Eau de Parfum', 'Parfum Intense', 'Botanical Serum', 'Velvet Lipstick', 'Radiant Foundation'],
    subcategoryGroups: [
      {
        subcategory: 'Perfumes',
        brands: ['Byredo', 'Tom Ford', 'Jo Malone', 'Maison Francis Kurkdjian', 'Le Labo', 'Diptyque'],
        modelLines: [
          'Gypsy Water Perfume Eau de Parfum',
          'Oud Wood Reserve Perfume',
          'Wood Sage & Sea Salt Perfume',
          'Baccarat Amber Perfume Extrait',
          'Santal 33 Signature Perfume',
          'Philosykos Fig Perfume Eau de Parfum',
        ],
        editions: ['Eau de Parfum', 'Extrait de Parfum', 'Travel Atomizer', 'Reserve Spray'],
        priceRange: [95, 395],
        sizesPool: [['30ml', '50ml', '100ml']],
        tags: ['perfume', 'perfumes', 'fragrance', 'eau de parfum', 'parfum', 'unisex fragrance'],
        summaryTemplate: 'Long-wearing fine perfume crafted with high-concentration botanical oils and artisanal French maceration.',
        specsOverride: (brand, model) => ({
          Brand: brand,
          FragranceName: model,
          Concentration: 'Eau de Parfum (20% Aromatic Oils)',
          Longevity: '8–12 Hours on Skin',
          Packaging: 'UV-Shielded Atomizer Glass',
        }),
      },
      {
        subcategory: "Men's Fragrances",
        brands: ['Dior Beauty', 'Tom Ford', 'Chanel', 'Creed', 'YSL Beauty', 'Giorgio Armani'],
        modelLines: [
          "Sauvage Elixir Men's Perfume",
          "Ombré Leather Men's Perfume",
          "Bleu Eau de Parfum Men's Fragrance",
          "Aventus Cologne Men's Perfume",
          "Y Le Parfum Men's Fragrance",
          "Acqua Profondo Men's Perfume",
        ],
        editions: ["Men's Eau de Parfum", "Men's Cologne Intense", "Men's Parfum Spray", "Signature Men's Edit"],
        priceRange: [88, 365],
        sizesPool: [['50ml', '100ml', '150ml']],
        tags: ['men', 'mens', "men's perfume", 'mens perfume', 'perfume', 'cologne', 'fragrance', "men's fragrance"],
        summaryTemplate: "Refined men's perfume blending crisp bergamot, cedarwood, ambergris, and warm aromatic spices.",
        specsOverride: (brand, model) => ({
          Brand: brand,
          Fragrance: model,
          Target: "Men's Fragrance & Cologne",
          Notes: 'Bergamot, Ambroxan, Cedarwood & Vetiver',
          Concentration: 'Eau de Parfum / Parfum',
        }),
      },
      {
        subcategory: "Women's Fragrances",
        brands: ['Chanel', 'YSL Beauty', 'Dior Beauty', 'Jo Malone', 'Guerlain', 'Lancôme'],
        modelLines: [
          "Coco Mademoiselle Women's Perfume",
          "Libre Intense Women's Perfume",
          "Miss Dior Blooming Women's Perfume",
          "Peony & Blush Suede Women's Perfume",
          "Mon Guerlain Vanilla Women's Perfume",
          "La Vie Est Belle Women's Fragrance",
        ],
        editions: ["Women's Eau de Parfum", "Floral Reserve Perfume", "Women's Parfum", "Velvet Mist"],
        priceRange: [85, 295],
        sizesPool: [['30ml', '50ml', '100ml']],
        tags: ['women', 'womens', "women's perfume", 'womens perfume', 'perfume', 'fragrance', "women's fragrance"],
        summaryTemplate: "Luminous women's perfume composed with Grasse jasmine, Damask rose, Madagascar vanilla, and white musk.",
        specsOverride: (brand, model) => ({
          Brand: brand,
          Fragrance: model,
          Target: "Women's Perfume & Fragrance",
          Notes: 'Jasmine Sambac, Rose, Vanilla & Cashmere Musk',
          Concentration: 'Eau de Parfum',
        }),
      },
      {
        subcategory: 'Skincare',
        brands: ['Aesop', 'La Roche-Posay', 'The Ordinary', 'CeraVe', 'Kiehl’s', 'Drunk Elephant'],
        modelLines: [
          'Parsley Seed Antioxidant Skincare Serum',
          'Hyalu B5 Barrier Skincare Serum',
          'Niacinamide 10% + Zinc Skincare Drops',
          'Ceramide Hydrating Skincare Cleanser',
          'Ultra Facial Barrier Skincare Cream',
          'Protini Polypeptide Skincare Moisturizer',
        ],
        editions: ['Clinical Skincare', 'Sensitive Skin', 'Daily Barrier', 'SPF 50+ Fluid', 'Night Repair'],
        priceRange: [18, 135],
        sizesPool: [['30ml', '50ml', '100ml'], ['150ml', '250ml']],
        tags: ['skincare', 'skin care', 'serum', 'moisturizer', 'cleanser', 'spf', 'beauty'],
        summaryTemplate: 'Dermatologist-tested clinical skincare formula fortified with ceramides, peptides, and hyaluronic hydration.',
        specsOverride: (brand, model) => ({
          Brand: brand,
          Product: model,
          Category: 'Clinical & Botanical Skincare',
          KeyActives: 'Hyaluronic Acid, Ceramides, Niacinamide',
          SkinType: 'All Skin Types (Non-Comedogenic)',
        }),
      },
      {
        subcategory: 'Makeup',
        brands: ['Charlotte Tilbury', 'NARS', 'Fenty Beauty', 'MAC', 'Dior Beauty', 'Rare Beauty'],
        modelLines: [
          'Pillow Talk Matte Makeup Lipstick',
          'Light Reflecting Makeup Foundation',
          'Pro Filt’r Soft Matte Makeup Primer',
          'Radiant Creamy Makeup Concealer',
          'Studio Fix Makeup Setting Powder',
          'Soft Pinch Liquid Makeup Blush',
        ],
        editions: ['Longwear Makeup', 'Satin Finish', 'Hydrating Glow', '24H Transfer-Proof', 'Velvet Matte'],
        priceRange: [24, 78],
        sizesPool: [['Full Size'], ['Shade 01–12', 'Universal']],
        tags: ['makeup', 'cosmetics', 'lipstick', 'foundation', 'concealer', 'mascara', 'blush', 'beauty'],
        summaryTemplate: 'High-pigment luxury makeup engineered for seamless skin-like blending, crease resistance, and 16-hour wear.',
        specsOverride: (brand, model) => ({
          Brand: brand,
          Item: model,
          Category: 'Color Cosmetics & Makeup',
          Finish: 'Luminous Natural / Velvet Soft-Matte',
          Testing: 'Cruelty-Free & Dermatologist Tested',
        }),
      },
      {
        subcategory: 'Hair Care & Tools',
        brands: ['Dyson Beauty', 'Olaplex', 'Kérastase', 'Oribe'],
        modelLines: [
          'Supersonic Hair Dryer',
          'Airwrap Multi-Styler',
          'No. 3 Bond Repair Hair Treatment',
          'Elixir Ultime Hair Serum Oil',
          'Gold Lust Repair Shampoo',
        ],
        editions: ['Salon Grade', 'Keratin Safe', 'Ceramic Ionic', 'Refill Size'],
        priceRange: [32, 549],
        sizesPool: [['Standard'], ['100ml', '250ml']],
        tags: ['hair care', 'hair dryer', 'shampoo', 'beauty'],
        summaryTemplate: 'Professional salon hair care and intelligent thermal styling built to protect cuticle strength and shine.',
      },
    ],
    editions: ['Clinical Formula', 'Eau de Parfum', 'Velvet Finish', '50ml', '100ml', 'Salon Edition'],
    priceRange: [18, 429],
    colorsPool: [
      { name: 'Amber Glass', hex: '#8D5828' },
      { name: 'Rose Quartz', hex: '#D8B4AE' },
      { name: 'Porcelain Frosted', hex: '#EFECE6' },
      { name: 'Obsidian Gold', hex: '#262320' },
    ],
    sizesPool: [['30ml', '50ml', '100ml'], ['Full Size']],
    imagesPool: DEFAULT_IMAGES.beauty,
    extraTags: ['beauty', 'personal care'],
    summaryTemplates: [
      'Dermatologist-tested botanical, skincare, makeup, and fragrance formulations sealed in UV-protective glass.',
      'Clean daily beauty and fragrance ritual formulated for lasting performance and refined presentation.',
    ],
    heroSpecsTemplate: (brand, series, sub, tier) => ({
      Brand: brand,
      Formula: series,
      Category: sub,
      KeyNotesOrActives: sub.includes('Fragrance') || sub.includes('Perfume')
        ? 'Bergamot, Cedarwood, Jasmine & Ambergris'
        : tier % 2 === 0 ? 'Niacinamide, Ceramides, Hyaluronic Acid' : 'Botanical Antioxidants & Squalane',
      Quality: 'Dermatologist & IFRA Certified',
      Packaging: 'Recyclable Luxury Glass',
    }),
    curated: [
      {
        name: 'Byredo Blanche Eau de Parfum Perfume 100ml',
        brand: 'Byredo',
        subcategory: 'Perfumes',
        price: 280,
        compareAtPrice: 315,
        rating: 4.9,
        reviewCount: 318,
        shortDescription: 'Crisp minimalist unisex perfume with white rose, pink pepper, neroli, and blonde woods.',
        specs: { Concentration: 'Eau de Parfum', TopNotes: 'Aldehyde, Rose Centifolia', BaseNotes: 'Sandalwood, Musk', Volume: '100ml' },
        sizes: ['50ml', '100ml'],
        featured: true,
        isBestSeller: true,
        isTrending: true,
        tags: ['perfume', 'perfumes', 'byredo', 'fragrance', 'eau de parfum'],
      },
      {
        name: "Dior Sauvage Eau de Parfum Men's Perfume",
        brand: 'Dior Beauty',
        subcategory: "Men's Fragrances",
        price: 155,
        compareAtPrice: 175,
        rating: 5.0,
        reviewCount: 642,
        shortDescription: "Iconic men's perfume uniting Reggio bergamot with Papua New Guinean vanilla and smoky amberwood.",
        specs: { Gender: "Men's Perfume", Concentration: 'Eau de Parfum', Notes: 'Calabrian Bergamot, Sichuan Pepper, Ambroxan', Volume: '100ml' },
        sizes: ['60ml', '100ml', '200ml'],
        featured: true,
        isBestSeller: true,
        isFlashSale: true,
        tags: ['perfume', "men's perfume", 'mens perfume', 'cologne', 'fragrance', 'dior'],
      },
      {
        name: "Tom Ford Oud Wood Men's Perfume Eau de Parfum",
        brand: 'Tom Ford',
        subcategory: "Men's Fragrances",
        price: 295,
        rating: 4.9,
        reviewCount: 289,
        shortDescription: "Smoky men's luxury perfume featuring rare oud wood, Brazilian rosewood, cardamom, and tonka bean.",
        specs: { Gender: "Men's Perfume", Concentration: 'Private Blend Eau de Parfum', Notes: 'Oud, Cardamom, Sandalwood, Vetiver', Volume: '50ml' },
        sizes: ['50ml', '100ml'],
        isTrending: true,
        tags: ['perfume', "men's perfume", 'mens perfume', 'tom ford', 'oud', 'cologne'],
      },
      {
        name: "YSL Libre Intense Women's Perfume Eau de Parfum",
        brand: 'YSL Beauty',
        subcategory: "Women's Fragrances",
        price: 162,
        compareAtPrice: 185,
        rating: 4.9,
        reviewCount: 412,
        shortDescription: "Warm floral women's perfume blending French lavender essence, Moroccan orange blossom, and orchid.",
        specs: { Gender: "Women's Perfume", Concentration: 'Eau de Parfum Intense', Notes: 'Orange Blossom, Lavender, Madagascar Vanilla', Volume: '90ml' },
        sizes: ['50ml', '90ml'],
        featured: true,
        isTrending: true,
        tags: ['perfume', "women's perfume", 'womens perfume', 'fragrance', 'ysl'],
      },
      {
        name: "Chanel Coco Mademoiselle Women's Perfume",
        brand: 'Chanel',
        subcategory: "Women's Fragrances",
        price: 172,
        rating: 5.0,
        reviewCount: 530,
        shortDescription: "Luminous ambery women's perfume with vibrant Sicilian orange, May rose, jasmine, and patchouli.",
        specs: { Gender: "Women's Perfume", Concentration: 'Eau de Parfum', Notes: 'Orange, Rose, Jasmine, White Musk', Volume: '100ml' },
        sizes: ['50ml', '100ml'],
        isBestSeller: true,
        tags: ['perfume', "women's perfume", 'womens perfume', 'chanel', 'fragrance'],
      },
      {
        name: 'Aesop Parsley Seed Anti-Oxidant Skincare Serum',
        brand: 'Aesop',
        subcategory: 'Skincare',
        price: 89,
        compareAtPrice: 98,
        rating: 4.9,
        shortDescription: 'Hydrating daily antioxidant skincare serum fortifying urban skin with red algae and parsley seed.',
        specs: { Volume: '60ml Amber Pipette', KeyNotes: 'Parsley Seed, Tocopherol, Red Algae', Finish: 'Breathable Matte Film' },
        featured: true,
        isBestSeller: true,
        tags: ['skincare', 'serum', 'aesop', 'antioxidant'],
      },
      {
        name: 'La Roche-Posay Hyalu B5 Hyaluronic Skincare Serum',
        brand: 'La Roche-Posay',
        subcategory: 'Skincare',
        price: 42,
        compareAtPrice: 49,
        rating: 4.8,
        shortDescription: 'Pure hyaluronic acid and vitamin B5 plumping skincare serum for sensitive, dehydrated skin.',
        specs: { Actives: 'Dual Hyaluronic Acid + Vitamin B5', DermatologistTested: 'Yes, Fragrance-Free Option', Volume: '30ml' },
        isFlashSale: true,
        tags: ['skincare', 'serum', 'hyaluronic', 'moisturizer'],
      },
      {
        name: 'Charlotte Tilbury Flawless Filter Makeup Foundation',
        brand: 'Charlotte Tilbury',
        subcategory: 'Makeup',
        price: 49,
        rating: 4.9,
        reviewCount: 478,
        shortDescription: 'Soft-focus complexion booster makeup foundation delivering a radiant airbrushed glow.',
        specs: { Coverage: 'Sheer-to-Medium Radiant Glow', KeyIngredients: 'Glossy Oil & Porcelain Flower', Volume: '30ml' },
        featured: true,
        isTrending: true,
        tags: ['makeup', 'foundation', 'cosmetics', 'charlotte tilbury'],
      },
      {
        name: 'NARS Radiant Creamy Makeup Concealer',
        brand: 'NARS',
        subcategory: 'Makeup',
        price: 34,
        compareAtPrice: 38,
        rating: 4.9,
        reviewCount: 390,
        shortDescription: 'Crease-resistant 16-hour hydrating makeup concealer with light-diffusing mineral powder.',
        specs: { WearTime: '16 Hours', Finish: 'Natural Radiant', ParabenFree: 'Yes' },
        isBestSeller: true,
        tags: ['makeup', 'concealer', 'cosmetics', 'nars'],
      },
      {
        name: 'Dyson Supersonic Nural Hair Dryer',
        brand: 'Dyson Beauty',
        subcategory: 'Hair Care & Tools',
        price: 429,
        compareAtPrice: 499,
        rating: 4.9,
        shortDescription: 'Intelligent heat-sensing hair dryer protecting scalp moisture with magnetic styling attachments.',
        specs: { Motor: 'Dyson Digital V9 (110k RPM)', Sensors: 'Scalp-Protect Time-of-Flight', Attachments: '5 Magnetic Attachments' },
        isFlashSale: true,
        tags: ['hair care', 'hair dryer', 'dyson'],
      },
    ],
  },
  {
    category: 'Home & Kitchen',
    brands: ['Breville', 'Le Creuset', 'Fellow', 'MAISON KOVA', 'Staub', 'OXO', 'YETI', 'Zwilling'],
    subcategories: ['Espresso & Coffee', 'Cookware & Bakeware', 'Ceramics & Tableware', 'Table Lighting', 'Cutlery & Prep'],
    modelLines: ['Barista Touch', 'Stagg EKG', 'Dutch Oven', 'Travertine Lamp', 'Stoneware Vase', 'Chef Knife', 'Pour-Over Kit', 'Thermal Carafe'],
    editions: ['Matte Black', 'Brushed Steel', 'Ceramic Glaze', 'PID Temp Control', 'Pro Chef', 'Artisan Cast', 'Roman Travertine', 'Studio Pair'],
    priceRange: [28, 1299],
    colorsPool: [
      { name: 'Matte Obsidian', hex: '#1C1C1E' },
      { name: 'Warm Travertine', hex: '#D8CEBE' },
      { name: 'Brushed Steel', hex: '#B4B6B8' },
      { name: 'Stone Chalk', hex: '#EEECE6' },
    ],
    sizesPool: [['Standard'], ['2.5 Qt', '5.5 Qt'], ['Single', 'Set of 4']],
    imagesPool: DEFAULT_IMAGES.homeKitchen,
    summaryTemplates: [
      'Precision culinary and living object built from food-safe stainless steel, enameled cast iron, or natural stone.',
      'Crafted for daily ritual—balancing thermal stability, tactile weight, and minimalist counter presence.',
    ],
    heroSpecsTemplate: (brand, series, sub, tier) => ({
      Brand: brand,
      Model: series,
      Category: sub,
      Material: tier % 2 === 0 ? '304 Stainless Steel & Borosilicate' : 'Enameled Cast Iron / Hand-Thrown Stoneware',
      Safety: 'BPA-Free & Food-Grade Certified',
      Care: 'Easy-Clean Architectural Finish',
    }),
    curated: [
      {
        id: 'mk-obj-03',
        name: 'Kova Sculpted Espresso Maker',
        brand: 'MAISON KOVA',
        subcategory: 'Espresso & Coffee',
        price: 890,
        compareAtPrice: 990,
        rating: 4.9,
        stockCount: 8,
        shortDescription: 'PID temperature-controlled stainless steel espresso machine with solid walnut portafilter.',
        specs: { Boiler: 'Dual PID Thermal Block', Pressure: '9-Bar OPV Regulated', Portafilter: '58mm Commercial Stainless + Walnut' },
        featured: true,
        isBestSeller: true,
        tags: ['espresso', 'coffee', 'kitchen', 'kitchen appliances'],
      },
      {
        id: 'mk-obj-02',
        name: 'Travertine Monolith Table Lamp',
        brand: 'MAISON KOVA',
        subcategory: 'Table Lighting',
        price: 380,
        rating: 4.8,
        stockCount: 15,
        shortDescription: 'Carved Roman travertine stone base with warm 2700K dimmable opal glass diffuser.',
        specs: { Material: 'Solid Roman Travertine', LightSource: '2700K Warm LED (CRI 95+)', Dimmer: 'Inline Brass Rotary' },
        featured: true,
      },
      {
        name: 'Fellow Stagg EKG Pro Electric Pour-Over Kettle',
        brand: 'Fellow',
        subcategory: 'Espresso & Coffee',
        price: 185,
        compareAtPrice: 215,
        rating: 4.9,
        shortDescription: 'Precision gooseneck electric kettle with degree-by-degree PID control and brew stopwatch.',
        specs: { Capacity: '0.9 Liters', TempRange: '104°F – 212°F', Display: 'Full-Color High-Res LCD' },
        isFlashSale: true,
        tags: ['kettle', 'coffee', 'kitchen'],
      },
    ],
  },
  {
    category: 'Furniture',
    brands: ['Herman Miller', 'Steelcase', 'Article', 'HAY', 'Muuto', 'West Elm', 'IKEA Atelier', 'MAISON KOVA'],
    subcategories: ['Ergonomic Office Chairs', 'Lounge & Accent Chairs', 'Standing Desks', 'Dining & Coffee Tables', 'Shelving & Storage'],
    modelLines: ['Aeron', 'Gesture', 'Wishbone', 'Timber Chair', 'Linear Desk', 'Modular Sofa', 'Oak Credenza', 'Travertine Plinth'],
    editions: ['Graphite Mesh', 'White Oak', 'Smoked Walnut', 'Bouclé Ivory', 'Matte Steel', 'Ergonomic Pro', 'Compact Studio', 'Lounge Low'],
    priceRange: [149, 1899],
    colorsPool: [
      { name: 'White Oak', hex: '#C6AA84' },
      { name: 'Smoked Walnut', hex: '#5E4635' },
      { name: 'Graphite Black', hex: '#28292B' },
      { name: 'Bouclé Cream', hex: '#EFECE3' },
    ],
    sizesPool: [['Standard'], ['Size A', 'Size B', 'Size C'], ['48" Width', '60" Width']],
    imagesPool: DEFAULT_IMAGES.furniture,
    summaryTemplates: [
      'Contract-grade seating and solid timber furniture designed for posture support and timeless architectural proportion.',
      'Kiln-dried hardwood and breathable ergonomic suspension built to last across decades of daily use.',
    ],
    heroSpecsTemplate: (brand, series, sub, tier) => ({
      Brand: brand,
      Model: series,
      Category: sub,
      Frame: tier % 2 === 0 ? 'FSC-Certified Solid Oak / Walnut' : 'Die-Cast Recycled Aluminum & Pellicle Mesh',
      LoadRating: '300 lbs Tested Contract Grade',
      Warranty: '10-Year Structural Guarantee',
    }),
    curated: [
      {
        name: 'Herman Miller Aeron Ergonomic Task Chair',
        brand: 'Herman Miller',
        subcategory: 'Ergonomic Office Chairs',
        price: 1295,
        compareAtPrice: 1495,
        rating: 5.0,
        shortDescription: '8Z Pellicle zoned suspension chair with PostureFit SL lumbar support and tilt limiter.',
        specs: { Suspension: '8Z Pellicle Elastomeric Mesh', Lumbar: 'Adjustable PostureFit SL', Arms: 'Fully Adjustable 4D' },
        featured: true,
        isBestSeller: true,
      },
      {
        name: 'MAISON KOVA Sculpted Oak Lounge Chair',
        brand: 'MAISON KOVA',
        subcategory: 'Lounge & Accent Chairs',
        price: 680,
        compareAtPrice: 790,
        rating: 4.9,
        shortDescription: 'Steam-bent solid white oak lounge frame with removable linen-bouclé cushions.',
        specs: { Wood: 'Solid European White Oak', Upholstery: 'Belgian Linen Bouclé', Joinery: 'Mortise & Tenon' },
        isFlashSale: true,
      },
    ],
  },
  {
    category: 'Sports & Fitness',
    brands: ['Bowflex', 'Therabody', 'Garmin Sports', 'Lululemon', 'Hydro Flask', 'Manduka', 'Nike Training', 'TRX'],
    subcategories: ['Strength & Weights', 'Recovery & Massage', 'Yoga & Mobility', 'Cycling & Trail', 'Hydration & Gym Carry'],
    modelLines: ['SelectTech', 'Theragun', 'PRO Yoga Mat', 'Speed Rope', 'Kettlebell', 'Gym Duffel', 'Foam Roller', 'Resistance Band Set'],
    brandModels: {
      Bowflex: ['SelectTech 552 Dumbbells', 'SelectTech 840 Kettlebell', 'Adjustable Weight Bench'],
      Therabody: ['Theragun Pro Plus', 'Theragun Prime', 'Theragun Mini', 'Wave Roller'],
      'Garmin Sports': ['Edge 840 Solar Cycling', 'HRM-Pro Plus Strap', 'Varia Radar'],
      Lululemon: ['The Mat 5mm', 'Align Yoga Block', 'Double-Roller', 'Studio Gym Duffel'],
      'Hydro Flask': ['32oz Wide Mouth Trail', '40oz Insulated Tumbler', '24oz Sport Cap'],
      Manduka: ['PRO 6mm Yoga Mat', 'eKO Lite Mat', 'Cork Yoga Block Set'],
      'Nike Training': ['Metcon Training Duffel', 'Weighted Speed Jump Rope', 'Pro Resistance Band Kit', 'Training Kettlebell Grip'],
      TRX: ['PRO4 Suspension System', 'Home2 Gym Kit', 'Slam Ball 20lb'],
    },
    editions: ['Adjustable Pro', '6mm Cushion', 'Carbon Steel', 'Quiet Drive', 'All-Weather', 'Competition Grade', 'Home Gym Pack', 'Travel Lite'],
    priceRange: [24, 699],
    colorsPool: [
      { name: 'Carbon Black', hex: '#1B1C1E' },
      { name: 'Slate Sage', hex: '#5D6A5B' },
      { name: 'Crimson Accent', hex: '#9E322D' },
    ],
    sizesPool: [['Standard'], ['5–52.5 lbs', '10–90 lbs'], ['16oz', '32oz', '40oz']],
    imagesPool: DEFAULT_IMAGES.sports,
    summaryTemplates: [
      'Commercial-spec training and recovery equipment engineered for home studios and outdoor conditioning.',
      'Ergonomic grip geometry and high-density elastomer materials built for repetitive high-load training.',
    ],
    heroSpecsTemplate: (brand, series, sub, tier) => ({
      Brand: brand,
      Model: series,
      Category: sub,
      Build: tier % 2 === 0 ? 'Cast Steel & Textured Thermoplastic Grip' : 'High-Density Closed-Cell Natural Rubber',
      UseCase: 'Home Gym, Studio & Outdoor Training',
      Warranty: '2-Year Performance Warranty',
    }),
    curated: [
      {
        name: 'Therabody Theragun Pro Plus Percussive Massager',
        brand: 'Therabody',
        subcategory: 'Recovery & Massage',
        price: 499,
        compareAtPrice: 599,
        rating: 4.9,
        shortDescription: '16mm deep-muscle percussive therapy with near-infrared LED light and biometric sensor.',
        specs: { Amplitude: '16mm Deep Tissue', StallForce: '60 lbs', Therapies: 'Percussive + LED + Vibration' },
        featured: true,
        isFlashSale: true,
      },
      {
        name: 'Bowflex SelectTech 552 Adjustable Dumbbell Pair',
        brand: 'Bowflex',
        subcategory: 'Strength & Weights',
        price: 399,
        compareAtPrice: 449,
        rating: 4.9,
        shortDescription: 'Dial-adjustable dumbbells replacing 15 sets of weights from 5 to 52.5 lbs per hand.',
        specs: { WeightRange: '5 to 52.5 lbs each', Increments: '2.5 lb up to 25 lbs', Storage: 'Compact Moulded Trays' },
        isBestSeller: true,
      },
    ],
  },
  {
    category: 'Gaming Accessories',
    brands: ['Logitech G', 'Razer', 'SteelSeries', 'Keychron', 'ASUS ROG', 'HyperX', 'Sony PlayStation', 'Corsair'],
    subcategories: ['Mechanical Keyboards', 'Wireless Gaming Mice', 'Gaming Headsets', 'Controllers & Docks', 'Desk Mats & Sim Gear'],
    modelLines: ['PRO X Superlight', 'Huntsman V3', 'Q1 Pro HE', 'Apex Pro', 'DualSense Edge', 'Arctis Nova', 'Viper V3', 'K70 Max'],
    brandModels: {
      'Logitech G': ['PRO X Superlight 2 Mouse', 'G915 X TKL Keyboard', 'PRO X 2 Lightspeed Headset', 'G502 X Plus'],
      Razer: ['Viper V3 Pro Mouse', 'Huntsman V3 Pro Keyboard', 'BlackShark V2 Pro Headset', 'DeathAdder V3 HyperSpeed'],
      SteelSeries: ['Apex Pro TKL Gen 3', 'Arctis Nova Pro Wireless', 'Aerox 5 Wireless', 'QcK Heavy Desk Mat'],
      Keychron: ['Q1 HE Magnetic Keyboard', 'Q6 Pro Aluminum Keyboard', 'Lemokey P1 Pro', 'M3 Mini 4K Mouse'],
      'ASUS ROG': ['Azoth Extreme Keyboard', 'Harpe Ace Aim Lab Mouse', 'Delta II Wireless Headset'],
      HyperX: ['Cloud III Wireless Headset', 'Alloy Rise 75 Keyboard', 'Pulsefire Haste 2'],
      'Sony PlayStation': ['DualSense Edge Controller', 'Pulse Elite Wireless Headset', 'DualSense Charging Station'],
      Corsair: ['K70 Max Magnetic Keyboard', 'Virtuoso Max Wireless Headset', 'Scimitar Elite Wireless'],
    },
    editions: ['Rapid Trigger HE', '8K Wireless', '75% Gasket Mount', 'Pro Esports', 'OLED Station', 'Low-Latency Lightspeed', 'Hot-Swap Custom'],
    priceRange: [39, 399],
    colorsPool: [
      { name: 'Matte Black', hex: '#141416' },
      { name: 'Arctic White', hex: '#F0EFEA' },
      { name: 'Graphite Bronze', hex: '#4F4A44' },
    ],
    sizesPool: [['Standard'], ['Linear Red', 'Tactile Brown', 'Hall Effect Magnetic'], ['75% Layout', 'TKL', 'Full Size']],
    imagesPool: DEFAULT_IMAGES.gaming,
    summaryTemplates: [
      'Sub-millisecond wireless esports peripheral featuring precision optical sensors and tournament-grade switches.',
      'Custom-tuned acoustic gasket chassis paired with PBT keycaps or ultra-lightweight shell architecture.',
    ],
    heroSpecsTemplate: (brand, series, sub, tier) => ({
      Brand: brand,
      Model: series,
      Category: sub,
      PollingRate: tier % 2 === 0 ? '4000Hz / 8000Hz HyperPolling Wireless' : '1000Hz Low-Latency Dual Wireless + USB-C',
      SwitchesOrSensor: sub.includes('Keyboard') ? 'Hot-Swappable Optical / Magnetic' : '30K–35K DPI Optical Sensor',
      Battery: 'Up to 95 Hours Continuous Play',
    }),
    curated: [
      {
        name: 'Logitech G PRO X Superlight 2 Wireless Mouse',
        brand: 'Logitech G',
        subcategory: 'Wireless Gaming Mice',
        price: 139,
        compareAtPrice: 159,
        rating: 4.9,
        shortDescription: '60g ultralight wireless esports mouse with HERO 2 32K sensor and LIGHTFORCE hybrid switches.',
        specs: { Weight: '60 grams', Sensor: 'HERO 2 (32,000 DPI)', Polling: '4000Hz Wireless', Battery: '95 Hours USB-C' },
        featured: true,
        isBestSeller: true,
      },
      {
        name: 'Keychron Q1 HE Magnetic Switch Keyboard',
        brand: 'Keychron',
        subcategory: 'Mechanical Keyboards',
        price: 219,
        rating: 4.9,
        shortDescription: 'Full CNC aluminum 75% gasket mechanical keyboard with adjustable Rapid Trigger Hall Effect switches.',
        specs: { Case: 'CNC 6063 Aluminum', Switches: 'Gateron Double-Rail Magnetic', Connectivity: '2.4GHz 1000Hz + Bluetooth + Wired' },
        featured: true,
        isTrending: true,
      },
    ],
  },
  {
    category: 'Cameras',
    brands: ['Sony', 'Fujifilm', 'Canon', 'Nikon', 'Leica', 'DJI', 'GoPro', 'Sigma'],
    subcategories: ['Mirrorless Cameras', 'Prime & Zoom Lenses', 'Action & 360 Cameras', 'Drones & Gimbals', 'Studio Lighting'],
    modelLines: ['Alpha A7', 'X100VI', 'EOS R6', 'Z6 III', 'Osmo Pocket', 'Hero 13', 'Art Lens', 'M11 Rangefinder'],
    brandModels: {
      Sony: ['Alpha A7 IV Mirrorless', 'Alpha A7C II', 'ZV-E1 Full-Frame', 'FE 24-70mm GM II Lens'],
      Fujifilm: ['X100VI Rangefinder', 'X-T5 Mirrorless', 'X-S20 Creator Camera', 'XF 35mm f/1.4 Lens'],
      Canon: ['EOS R6 Mark II', 'EOS R5 II', 'EOS R8 Mirrorless', 'RF 50mm f/1.2L Lens'],
      Nikon: ['Z6 III Mirrorless', 'Zf Heritage Full-Frame', 'Z8 Body', 'NIKKOR Z 24-70mm f/2.8'],
      Leica: ['Q3 43 Full-Frame', 'M11-P Rangefinder', 'SL3 Mirrorless'],
      DJI: ['Osmo Pocket 3', 'Mini 4 Pro Drone', 'RS 4 Pro Gimbal', 'Osmo Action 5 Pro'],
      GoPro: ['HERO 13 Black', 'HERO 13 Creator Edition', 'MAX 360 Camera'],
      Sigma: ['24-70mm f/2.8 DG DN II', '35mm f/1.4 Art Lens', '85mm f/1.4 DG DN'],
    },
    editions: ['Body Only', '24-70mm Kit', 'Creator Combo', 'F/1.4 Prime', 'Cine Rig', 'Compact Edition', 'Weather Sealed'],
    priceRange: [199, 3499],
    colorsPool: [
      { name: 'Anodized Black', hex: '#161618' },
      { name: 'Silver & Black', hex: '#B9B9B5' },
    ],
    sizesPool: [['Body Only', '28-70mm Kit'], ['Standard Combo', 'Creator Combo'], ['35mm', '50mm', '85mm']],
    imagesPool: DEFAULT_IMAGES.cameras,
    summaryTemplates: [
      'High-dynamic-range imaging sensor with phase-detection subject tracking and 10-bit 4K internal video.',
      'Precision multi-coated optical glass and magnesium-alloy weather sealing built for field reliability.',
    ],
    heroSpecsTemplate: (brand, series, sub, tier) => ({
      Brand: brand,
      System: series,
      Category: sub,
      Sensor: tier % 2 === 0 ? 'Full-Frame BSI CMOS (33MP–45MP)' : 'APS-C X-Trans 40MP Sensor',
      Video: '4K 60p 10-Bit 4:2:2 Internal',
      Stabilization: '5-Axis In-Body IBIS (Up to 8 Stops)',
    }),
    curated: [
      {
        name: 'Fujifilm X100VI Digital Rangefinder Camera',
        brand: 'Fujifilm',
        subcategory: 'Mirrorless Cameras',
        price: 1599,
        rating: 5.0,
        reviewCount: 289,
        shortDescription: '40.2MP APS-C camera with 23mm f/2 fixed lens, 6-stop IBIS, and 20 iconic Film Simulations.',
        specs: { Sensor: '40.2MP X-Trans CMOS 5 HR', Lens: 'Fujinon 23mm f/2 II', IBIS: '6.0-Stop 5-Axis', Video: '6.2K/30p 10-bit' },
        featured: true,
        isBestSeller: true,
        isTrending: true,
      },
      {
        name: 'Sony Alpha A7 IV Full-Frame Mirrorless',
        brand: 'Sony',
        subcategory: 'Mirrorless Cameras',
        price: 2198,
        compareAtPrice: 2498,
        rating: 4.9,
        shortDescription: '33MP Exmor R full-frame hybrid camera with Real-Time Eye AF and 4K 60p 10-bit recording.',
        specs: { Sensor: '33MP Full-Frame Exmor R', Autofocus: '759-Point Phase Detection', CardSlots: 'Dual CFexpress A / SD' },
        isFlashSale: true,
      },
    ],
  },
  {
    category: 'Headphones & Audio',
    brands: ['Sony', 'Bose', 'Apple', 'Sennheiser', 'Bowers & Wilkins', 'Anker Soundcore', 'Bang & Olufsen', 'Aether Labs'],
    subcategories: ['Wireless ANC Headphones', 'Studio & Planar Headphones', 'True Wireless Earbuds', 'Portable DACs & Amps', 'Turntables'],
    modelLines: ['WH-1000XM6', 'QuietComfort Ultra', 'Momentum 4', 'AirPods Max', 'Space Q45', 'Planar Studio', 'Px8', 'Beoplay HX'],
    brandModels: {
      Sony: ['WH-1000XM6 Headphones', 'WH-1000XM5 Headphones', 'WF-1000XM5 Earbuds', 'ULT Wear Wireless Headphones'],
      Bose: ['QuietComfort Ultra Headphones', 'QuietComfort Wireless Headphones', 'QuietComfort Ultra Earbuds'],
      Apple: ['AirPods Max USB-C Headphones', 'AirPods Pro 2 USB-C Earbuds', 'AirPods 4 ANC Earbuds'],
      Sennheiser: ['Momentum 4 Wireless Headphones', 'HD 660S2 Studio Headphones', 'Momentum True Wireless 4'],
      'Bowers & Wilkins': ['Px8 Carbon Headphones', 'Px7 S2e Headphones', 'Pi8 Earbuds'],
      'Anker Soundcore': ['Space Q45 ANC Headphones', 'Space One Pro Headphones', 'Liberty 4 Pro Earbuds'],
      'Bang & Olufsen': ['Beoplay H95 Headphones', 'Beoplay HX Headphones', 'Beoplay EX Earbuds'],
      'Aether Labs': ['Planar Studio Headphones', 'Reference DAC Amp', 'Acoustic Turntable'],
    },
    editions: ['ANC Wireless', 'Spatial Audio', 'Lossless USB-C', 'Open-Back Studio', 'Pro Edition', 'Hi-Res LDAC'],
    priceRange: [59, 699],
    colorsPool: [
      { name: 'Midnight Black', hex: '#191A1C' },
      { name: 'Platinum Silver', hex: '#D2D0CA' },
      { name: 'Sandstone', hex: '#C6BBA9' },
      { name: 'Forest Olive', hex: '#485245' },
    ],
    sizesPool: [['Wireless Over-Ear'], ['Wireless In-Ear'], ['Standard 3.5mm + USB-C']],
    imagesPool: DEFAULT_IMAGES.audio,
    extraTags: ['headphones', 'audio', 'wireless headphones', 'anc'],
    summaryTemplates: [
      'Adaptive active noise cancellation and custom dynamic or planar magnetic drivers tuned for studio clarity.',
      'Memory-foam acoustic earcups with multipoint Bluetooth 5.4, lossless USB-C audio, and 35+ hour endurance.',
    ],
    heroSpecsTemplate: (brand, series, sub, tier) => ({
      Brand: brand,
      Model: series,
      Category: sub,
      Drivers: sub.includes('Planar') ? '90mm Planar Magnetic' : '40mm Custom Carbon Dome Dynamic',
      Codecs: tier % 2 === 0 ? 'LDAC, aptX Adaptive, AAC, USB-C Lossless' : 'AAC, SBC, Spatial Head Tracking',
      BatteryLife: 'Up to 40–60 Hours w/ ANC',
    }),
    curated: [
      {
        name: 'Sony WH-1000XM6 Wireless Noise Canceling Headphones',
        brand: 'Sony',
        subcategory: 'Wireless ANC Headphones',
        price: 379,
        compareAtPrice: 429,
        rating: 4.9,
        reviewCount: 518,
        shortDescription: 'Industry-leading multi-mic ANC wireless headphones with 40-hour battery and LDAC Hi-Res audio.',
        specs: { ANC: 'Dual QN2e + V2 Noise Processors', Battery: '40 Hours (3-min quick charge = 3h)', Connectivity: 'Multipoint Bluetooth 5.4 + USB-C' },
        featured: true,
        isBestSeller: true,
        isFlashSale: true,
        tags: ['wireless headphones', 'headphones', 'sony', 'anc headphones', 'bluetooth headphones'],
      },
      {
        name: 'Bose QuietComfort Ultra Wireless Headphones',
        brand: 'Bose',
        subcategory: 'Wireless ANC Headphones',
        price: 399,
        compareAtPrice: 429,
        rating: 4.9,
        shortDescription: 'CustomTune spatial immersive audio with plush protein-leather cushions and world-class ANC.',
        specs: { Audio: 'Bose Immersive Spatial Audio', ANC: 'CustomTune Aware & Quiet Modes', Battery: '24 Hours' },
        isTrending: true,
        tags: ['wireless headphones', 'headphones', 'bose', 'noise canceling'],
      },
      {
        name: 'Anker Soundcore Space Q45 Wireless Headphones',
        brand: 'Anker Soundcore',
        subcategory: 'Wireless ANC Headphones',
        price: 99,
        compareAtPrice: 149,
        rating: 4.8,
        shortDescription: 'Adaptive ANC wireless headphones under $100 with 50-hour ANC battery and LDAC support.',
        specs: { Battery: '50 Hours ANC / 65 Hours Standard', Audio: '40mm Double-Layer Diaphragm + LDAC', Multipoint: 'Dual Device' },
        isFlashSale: true,
        tags: ['wireless headphones', 'headphones', 'headphones under 100', 'bluetooth'],
      },
      {
        id: 'mk-tech-03',
        name: 'Aether Planar Studio Headphones',
        brand: 'Aether Labs',
        subcategory: 'Studio & Planar Headphones',
        price: 549,
        rating: 4.9,
        stockCount: 12,
        shortDescription: 'Open-back 90mm planar magnetic headphones with lambskin pads and braided copper cable.',
        specs: { Driver: '90mm Planar Magnetic', Impedance: '38 Ohms', Sensitivity: '99 dB/mW', Cable: '4.4mm Balanced & 3.5mm' },
        featured: true,
        tags: ['headphones', 'planar', 'studio'],
      },
    ],
  },
  {
    category: 'Smart Watches',
    brands: ['Amazfit', 'Xiaomi', 'CMF by Nothing', 'Apple', 'Samsung', 'Garmin', 'Fitbit', 'Huawei'],
    subcategories: ['Budget Smart Watches Under $100', 'AMOLED Fitness Watches', 'GPS Multisport', 'Flagship Wearables', 'Health Trackers'],
    modelLines: ['Bip', 'Watch Pro', 'Watch Fit', 'Galaxy Watch', 'Watch Ultra', 'Forerunner', 'Venu', 'Redmi Watch'],
    brandModels: {
      Amazfit: ['Bip 5 Unity Smartwatch', 'GTR 4 AMOLED Smartwatch', 'T-Rex 3 GPS Smartwatch', 'Active Edge Smartwatch'],
      Xiaomi: ['Redmi Watch 5 Smartwatch', 'Watch S4 Sport Smartwatch', 'Smart Band 9 Pro'],
      'CMF by Nothing': ['Watch Pro 2 AMOLED Smartwatch', 'Watch Pro Essential Smartwatch'],
      Apple: ['Apple Watch Series 10 Smartwatch', 'Apple Watch Ultra 2 Smartwatch', 'Apple Watch SE Smartwatch'],
      Samsung: ['Galaxy Watch 7 Smartwatch', 'Galaxy Watch Ultra Smartwatch', 'Galaxy Fit 3 Tracker'],
      Garmin: ['Fenix 8 Sapphire Smartwatch', 'Forerunner 265 Smartwatch', 'Venu 3 AMOLED Smartwatch'],
      Fitbit: ['Versa 4 Fitness Smartwatch', 'Sense 2 Health Smartwatch', 'Charge 6 Tracker'],
      Huawei: ['Watch GT 5 Pro Smartwatch', 'Watch Fit 3 AMOLED Smartwatch'],
    },
    editions: ['AMOLED GPS', '46mm Titanium', 'Essential', 'Active Lite', 'Sapphire Solar', 'Cellular LTE', 'Sport Edition'],
    priceRange: [45, 899],
    colorsPool: [
      { name: 'Graphite Black', hex: '#1B1B1D' },
      { name: 'Starlight Silver', hex: '#D8D6D0' },
      { name: 'Terracotta Orange', hex: '#C6663B' },
      { name: 'Sage Mist', hex: '#7A8674' },
    ],
    sizesPool: [['41mm', '45mm'], ['42mm', '46mm'], ['49mm Titanium']],
    imagesPool: DEFAULT_IMAGES.smartWatches,
    extraTags: ['smartwatch', 'smartwatches', 'smart watch', 'smart watches', 'wearable'],
    summaryTemplates: [
      'Always-on AMOLED smart watch tracking continuous heart rate, SpO2, sleep stages, and Bluetooth calls.',
      'Lightweight waterproof wearable smartwatch with multi-GNSS GPS positioning and up to 14-day battery autonomy.',
    ],
    heroSpecsTemplate: (brand, series, sub, tier) => ({
      Brand: brand,
      Model: series,
      Category: sub,
      Display: tier % 2 === 0 ? '1.75" AMOLED (1000 nits)' : '1.43" Sapphire AMOLED Always-On',
      Sensors: 'Heart Rate, SpO2, Sleep, Dual-Band GPS',
      WaterResistance: '5 ATM / 50m Swim-Proof',
    }),
    curated: [
      {
        name: 'Amazfit Bip 5 Unity Smart Watch',
        brand: 'Amazfit',
        subcategory: 'Budget Smart Watches Under $100',
        price: 69,
        compareAtPrice: 89,
        rating: 4.8,
        reviewCount: 342,
        shortDescription: 'Slim stainless-bezel smartwatch under $100 with Bluetooth calling, Alexa, and 11-day battery.',
        specs: { Display: '1.91" HD Display', Battery: 'Up to 11 Days', Calling: 'Built-in Mic & Speaker', Sports: '120+ Modes' },
        featured: true,
        isBestSeller: true,
        isFlashSale: true,
        tags: ['smartwatch', 'smart watch', 'smart watches under 100', 'under $100', 'amazfit', 'fitness watch'],
      },
      {
        name: 'CMF by Nothing Watch Pro 2 AMOLED',
        brand: 'CMF by Nothing',
        subcategory: 'Budget Smart Watches Under $100',
        price: 69,
        rating: 4.8,
        shortDescription: 'Aluminum-alloy 1.32" AMOLED smartwatch under $100 with interchangeable bezels and multi-system GPS.',
        specs: { Display: '1.32" 60Hz AMOLED', GPS: 'Built-in 5-Satellite GPS', Battery: '11 Days', Calls: 'AI Noise Reduction Calling' },
        isTrending: true,
        tags: ['smartwatch', 'smart watch', 'smart watches under 100', 'under $100', 'cmf'],
      },
      {
        name: 'Xiaomi Redmi Watch 5 Active GPS',
        brand: 'Xiaomi',
        subcategory: 'Budget Smart Watches Under $100',
        price: 54,
        compareAtPrice: 69,
        rating: 4.7,
        shortDescription: 'Affordable everyday smartwatch under $100 with 18-day battery and 5ATM swim waterproofing.',
        specs: { Display: '2.0" High-Brightness LCD', Battery: '18 Days Typical', Rating: '5 ATM Waterproof' },
        tags: ['smartwatch', 'smart watch', 'smart watches under 100', 'under $100', 'xiaomi'],
      },
      {
        name: 'Apple Watch Series 10 Titanium Smartwatch',
        brand: 'Apple',
        subcategory: 'Flagship Wearables',
        price: 699,
        compareAtPrice: 749,
        rating: 5.0,
        reviewCount: 388,
        shortDescription: 'Wide-angle OLED flagship Apple smartwatch with sleep apnea detection, depth gauge, and fast charging.',
        specs: { Display: '46mm Wide-Angle LTPO3 OLED', Chip: 'Apple S10 SiP', WaterResistance: '50m Swimproof' },
        featured: true,
        isBestSeller: true,
        tags: ['smartwatch', 'smart watch', 'apple watch', 'apple'],
      },
      {
        name: 'Samsung Galaxy Watch 7 44mm AMOLED Smartwatch',
        brand: 'Samsung',
        subcategory: 'Flagship Wearables',
        price: 299,
        compareAtPrice: 329,
        rating: 4.9,
        reviewCount: 274,
        shortDescription: '3nm BioActive sensor Samsung smartwatch tracking Energy Score, Dual-Frequency GPS, and body composition.',
        specs: { Processor: '3nm Exynos W1000', Display: 'Sapphire Crystal Super AMOLED', OS: 'Wear OS' },
        isTrending: true,
        tags: ['smartwatch', 'smart watch', 'samsung', 'galaxy watch'],
      },
      {
        name: 'Garmin Fenix 8 47mm AMOLED Sapphire',
        brand: 'Garmin',
        subcategory: 'GPS Multisport',
        price: 999,
        rating: 5.0,
        shortDescription: 'Titanium multisport GPS smartwatch with dive rating, built-in LED flashlight, and 16-day battery.',
        specs: { Case: '47mm Titanium + Sapphire', Mapping: 'TopoActive Global Maps', Battery: '16 Days Smartwatch' },
        featured: true,
        tags: ['smartwatch', 'smart watch', 'garmin', 'gps watch'],
      },
    ],
  },
  {
    category: 'Toys & Baby Products',
    brands: ['Lovevery', 'LEGO Ideas', 'UPPAbaby', 'Stokke', 'Jellycat', 'Brio', 'Cybex', 'PlanToys'],
    subcategories: ['Montessori Wooden Toys', 'STEM & Building Sets', 'Strollers & Travel', 'Nursery & Feeding', 'Plush & Early Play'],
    modelLines: ['Play Kit', 'Architecture Set', 'Vista Stroller', 'Tripp Trapp Chair', 'Wooden Train', 'Sensory Blocks', 'Organic Crib Set', 'STEM Lab'],
    editions: ['Beechwood Edition', 'Ages 0–12m', 'Ages 3+', 'Collector Set', 'Travel Fold', 'GOTS Organic', 'Natural Finish'],
    priceRange: [22, 799],
    colorsPool: [
      { name: 'Natural Beechwood', hex: '#D8BD96' },
      { name: 'Sage & Cream', hex: '#88947E' },
      { name: 'Warm Terracotta', hex: '#B96A4D' },
    ],
    sizesPool: [['0–12 Months', '1–3 Years'], ['Ages 4+', 'Ages 8+'], ['One Size']],
    imagesPool: DEFAULT_IMAGES.toys,
    summaryTemplates: [
      'Non-toxic FSC beechwood, food-grade silicone, and developmental play sets tested to ASTM & EN-71 safety standards.',
      'Ergonomic nursery gear and open-ended building toys designed to grow seamlessly with your child.',
    ],
    heroSpecsTemplate: (brand, series, sub, tier) => ({
      Brand: brand,
      Collection: series,
      Category: sub,
      Materials: tier % 2 === 0 ? 'FSC European Beechwood & Water-Based Paints' : 'BPA-Free ABS / GOTS Organic Cotton',
      SafetyCert: 'ASTM F963 & CPSIA Certified Non-Toxic',
      AgeGuidance: sub.includes('STEM') ? 'Ages 6+' : 'Infant & Toddler Safe',
    }),
    curated: [
      {
        name: 'Lovevery The Block Set Solid Wood System',
        brand: 'Lovevery',
        subcategory: 'Montessori Wooden Toys',
        price: 89,
        rating: 5.0,
        shortDescription: '70-piece FSC solid beechwood heirloom block system with shape-sorter storage box.',
        specs: { Pieces: '70 Solid Wood Shapes', Finish: 'Non-Toxic Water-Based Lacquer', Ages: '12 Months – 4+ Years' },
        featured: true,
        isBestSeller: true,
      },
      {
        name: 'LEGO Architecture Notre-Dame Collector Set',
        brand: 'LEGO Ideas',
        subcategory: 'STEM & Building Sets',
        price: 219,
        compareAtPrice: 229,
        rating: 4.9,
        shortDescription: '4,383-piece architectural scale model with removable roof revealing rose windows and vaulted interior.',
        specs: { Pieces: '4,383', Dimensions: '33 × 22 × 41 cm', Age: '18+ Collector' },
        isTrending: true,
      },
    ],
  },
  {
    category: 'Books & Stationery',
    brands: ['Taschen', 'Phaidon', 'Lamy', 'Midori MD', 'Kaweco', 'Moleskine', 'Leuchtturm1917', 'Monocle'],
    subcategories: ['Design & Art Monographs', 'Fountain & Roller Pens', 'Notebooks & Paper', 'Desk Organizers', 'Architecture Books'],
    modelLines: ['Dieter Rams', 'Safari', 'AL-Star', 'MD Notebook', 'Brass Sport', 'Hardcover Edition', 'A5 Dot Grid', 'Atelier Monograph'],
    editions: ['Hardcover XL', 'Medium Nib', 'Fine Nib', 'Cotton Paper', 'Solid Brass', 'Dot Grid 240p', 'Collector Slipcase', 'Matte Charcoal'],
    priceRange: [16, 175],
    colorsPool: [
      { name: 'Cream Ivory', hex: '#F3EFE4' },
      { name: 'Raw Brass', hex: '#B9985A' },
      { name: 'Matte Black', hex: '#1B1B1D' },
    ],
    sizesPool: [['A5', 'A4'], ['Fine Nib', 'Medium Nib'], ['Hardcover']],
    imagesPool: DEFAULT_IMAGES.books,
    summaryTemplates: [
      'Archival fountain-pen friendly Japanese paper, machined brass writing tools, and curated visual monographs.',
      'Tactile desk instruments and Smythe-sewn hardcover volumes built for studios and libraries.',
    ],
    heroSpecsTemplate: (brand, series, sub, tier) => ({
      Brand: brand,
      Edition: series,
      Category: sub,
      PaperOrBody: tier % 2 === 0 ? 'Archival Acid-Free 150gsm Paper' : 'CNC Machined Anodized Aluminum / Solid Brass',
      BindingOrNib: sub.includes('Pen') ? 'German Steel Nib (EF / F / M)' : 'Lay-Flat Thread-Sewn Binding',
      Origin: 'Japan / Germany / Europe',
    }),
    curated: [
      {
        name: 'Phaidon Dieter Rams: The Complete Works',
        brand: 'Phaidon',
        subcategory: 'Design & Art Monographs',
        price: 75,
        compareAtPrice: 85,
        rating: 5.0,
        shortDescription: 'Definitive 344-page hardcover catalogue of industrial designer Dieter Rams’ iconic works.',
        specs: { Pages: '344 Illustrated Pages', Format: 'Hardcover Linen', Dimensions: '21 × 27 cm' },
        featured: true,
        isBestSeller: true,
      },
      {
        name: 'Kaweco Brass Sport Pocket Fountain Pen',
        brand: 'Kaweco',
        subcategory: 'Fountain & Roller Pens',
        price: 84,
        rating: 4.9,
        shortDescription: 'Solid octagonal raw brass fountain pen engineered to develop a rich individual patina.',
        specs: { Body: 'Solid Uncoated Brass', Weight: '44g', Nib: 'German Bock Steel Nib' },
        isTrending: true,
      },
    ],
  },
  {
    category: 'Accessories',
    brands: ['MAISON KOVA', 'Bellroy', 'Peak Design', 'Ray-Ban', 'Nomad', 'Orbitkey', 'Tumi', 'Rimowa'],
    subcategories: ['Leather Bags & Totes', 'Backpacks & Tech Carry', 'Wallets & Organizers', 'Sunglasses & Eyewear', 'Everyday Desk Carry'],
    modelLines: ['Weekender Tote', 'Everyday Backpack', 'Slim Sleeve', 'Desk Clock', 'Classic Wayfarer', 'Horween MagSafe', 'Transit Carry-On', 'Key Organizer'],
    editions: ['Full-Grain Saddle', 'Ballistic Nylon', 'Polarized G-15', 'RFID Protected', 'Solid Aluminum', 'Anodized Slate', 'Cabin 35L', 'Minimalist'],
    priceRange: [29, 890],
    colorsPool: [
      { name: 'Espresso Saddle', hex: '#4B3325' },
      { name: 'Jet Black', hex: '#161618' },
      { name: 'Slate Olive', hex: '#555E4F' },
      { name: 'Natural Tan', hex: '#B48356' },
    ],
    sizesPool: [['One Size'], ['20L', '30L'], ['Standard', 'Large']],
    imagesPool: DEFAULT_IMAGES.accessories,
    summaryTemplates: [
      'Vegetable-tanned full-grain leather goods and weatherproof recycled nylon carry built for daily transit.',
      'Refined functional accessories combining magnetic hardware, concealed pockets, and enduring material finish.',
    ],
    heroSpecsTemplate: (brand, series, sub, tier) => ({
      Brand: brand,
      Model: series,
      Category: sub,
      Material: tier % 2 === 0 ? 'Vegetable-Tanned Full-Grain Leather' : 'Weatherproof 840D Recycled Ballistic Nylon',
      Hardware: 'Custom Anodized Alloy & YKK AquaGuard',
      Protection: sub.includes('Wallet') ? 'Integrated RFID Shielding' : 'Padded 16" Tech Sleeve',
    }),
    curated: [
      {
        id: 'mk-apparel-02',
        name: 'Kova Full-Grain Weekender Tote',
        brand: 'MAISON KOVA',
        subcategory: 'Leather Bags & Totes',
        price: 420,
        compareAtPrice: 480,
        rating: 4.9,
        stockCount: 14,
        shortDescription: 'Structured Tuscan vegetable-tanned leather weekender with padded 16" laptop compartment.',
        specs: { Leather: 'Full-Grain Vegetable-Tanned', Capacity: '34 Liters', LaptopSleeve: 'Up to 16" Suspended' },
        featured: true,
        isBestSeller: true,
      },
      {
        name: 'Bellroy Transit Workpack Pro 28L',
        brand: 'Bellroy',
        subcategory: 'Backpacks & Tech Carry',
        price: 249,
        rating: 4.9,
        shortDescription: 'Clamshell recycled-weave carry-on backpack with external 16" laptop access and hidden bottle pocket.',
        specs: { Capacity: '28L', Fabric: '100% Recycled Dura Nylon', Weight: '1.15 kg' },
        isTrending: true,
      },
    ],
  },
  {
    category: 'Home Appliances',
    brands: ['Dyson', 'Ninja', 'Breville', 'Philips', 'Miele', 'Coway', 'iRobot', 'Smeg'],
    subcategories: ['Air Fryers & Kitchen Appliances', 'Cordless Vacuums', 'Air Purifiers', 'Espresso & Beverage', 'Robot Vacuums'],
    modelLines: ['DualZone XL', 'V15 Detect', 'Airmega 400', 'Barista Express', 'Smart Fryer', 'Complete C3', 'Roomba j9+', 'Kettle Pro'],
    brandModels: {
      Dyson: ['V15 Detect Cordless Vacuum', 'Gen5detect Vacuum', 'Purifier Big+Quiet Formaldehyde'],
      Ninja: ['Foodi DualZone XL Air Fryer', 'Crispi Glass Air Fryer', 'Creami Deluxe Maker'],
      Breville: ['Barista Express Impress', 'Bambino Plus Espresso', 'Smart Oven Air Fryer Pro'],
      Philips: ['3000 Series Air Purifier', '5400 LatteGo Espresso', 'Airfryer XXL Connected'],
      Miele: ['Complete C3 Canister Vacuum', 'Triflex HX2 Cordless Vacuum', 'CM6360 Espresso System'],
      Coway: ['Airmega 400S Purifier', 'Airmega AP-1512HH Mighty', 'Airmega ProX'],
      iRobot: ['Roomba j9+ Robot Vacuum', 'Roomba Combo 10 Max', 'Braava Jet m6'],
      Smeg: ['50s Retro Kettle', 'Espresso Manual Machine', '4-Slice Toaster'],
    },
    editions: ['HEPA H13', 'Dual Basket 10QT', 'Laser Detect', 'Stainless Pro', 'Quiet Night Mode', 'Smart App Wi-Fi', 'Energy Star'],
    priceRange: [79, 1199],
    colorsPool: [
      { name: 'Brushed Steel', hex: '#A9ABAE' },
      { name: 'Matte Black', hex: '#1B1C1E' },
      { name: 'Chalk White', hex: '#F1EFE9' },
    ],
    sizesPool: [['Standard 120V'], ['Compact 6QT', 'Family 10QT']],
    imagesPool: DEFAULT_IMAGES.appliances,
    summaryTemplates: [
      'High-efficiency modern home appliance combining whisper-quiet brushless motors, HEPA filtration, or precision thermal sensors.',
      'Countertop and floor-care hardware engineered for effortless maintenance and reliable daily performance.',
    ],
    heroSpecsTemplate: (brand, series, sub, tier) => ({
      Brand: brand,
      Model: series,
      Category: sub,
      Power: tier % 2 === 0 ? '1750W High-Efficiency Motor / Element' : 'Brushless Digital Inverter Drive',
      FiltrationOrCoat: sub.includes('Vacuum') || sub.includes('Purifier') ? 'True HEPA H13 Sealed (99.97%)' : 'PTFE/PFOA-Free Ceramic Nonstick',
      Warranty: '2-Year Manufacturer Coverage',
    }),
    curated: [
      {
        name: 'Ninja Foodi DualZone XL 10-Quart Air Fryer',
        brand: 'Ninja',
        subcategory: 'Air Fryers & Kitchen Appliances',
        price: 169,
        compareAtPrice: 229,
        rating: 4.9,
        reviewCount: 620,
        shortDescription: 'Dual independent 5-quart baskets with Smart Finish sync cooking up to 400°F.',
        specs: { Capacity: '10 Quarts Dual-Zone', Functions: '6-in-1 Air Fry, Roast, Broil, Bake, Reheat, Dehydrate', Power: '1690W' },
        featured: true,
        isFlashSale: true,
        isBestSeller: true,
        tags: ['kitchen appliances', 'air fryer', 'ninja', 'home appliances'],
      },
      {
        name: 'Dyson V15 Detect Absolute Cordless Vacuum',
        brand: 'Dyson',
        subcategory: 'Cordless Vacuums',
        price: 649,
        compareAtPrice: 749,
        rating: 4.9,
        shortDescription: 'Fluffy Optic illuminated vacuum revealing microscopic dust with piezo particle counter.',
        specs: { Suction: '240 AW', Runtime: 'Up to 60 Minutes', Filtration: 'Whole-Machine HEPA', Screen: 'Real-Time LCD Dust Report' },
        featured: true,
        isFlashSale: true,
        tags: ['vacuum', 'dyson', 'home appliances'],
      },
      {
        name: 'Breville Barista Express Impress Espresso Machine',
        brand: 'Breville',
        subcategory: 'Espresso & Beverage',
        price: 749,
        compareAtPrice: 899,
        rating: 4.9,
        shortDescription: 'Integrated conical burr grinder with assisted 10kg lever tamping and PID thermal precision.',
        specs: { Grinder: '25-Setting Steel Conical Burr', Boiler: 'Thermocoil PID', Pressure: '15-Bar Italian Pump' },
        isTrending: true,
        tags: ['espresso', 'kitchen appliances', 'breville', 'coffee'],
      },
    ],
  },
];

function generateCategoryProducts(
  cfg: CategoryGeneratorConfig,
  catIndex: number,
  usedNames: Set<string>,
  usedSlugs: Set<string>
): Product[] {
  const targetCount = cfg.targetCount ?? 75;
  const results: Product[] = [];
  const catSlugPrefix = slugify(cfg.category).slice(0, 6);

  const pushProduct = (raw: CuratedBlueprint, idx: number) => {
    const uniqueName = raw.name.trim();
    if (usedNames.has(uniqueName.toLowerCase())) return;
    usedNames.add(uniqueName.toLowerCase());

    let slug = slugify(uniqueName);
    if (usedSlugs.has(slug)) {
      slug = `${slug}-${catIndex + 1}-${idx + 1}`;
    }
    usedSlugs.add(slug);

    const id = raw.id || `mk-${catSlugPrefix}-${String(idx + 1).padStart(3, '0')}`;
    const seedNum = deterministicHash(id + uniqueName);
    const images = raw.images && raw.images.length > 0 ? raw.images : rotateImages(cfg.imagesPool, idx + catIndex);
    const stockCount =
      typeof raw.stockCount === 'number'
        ? raw.stockCount
        : idx > 3 && idx % 19 === 0
          ? 0
          : 6 + (seedNum % 58);

    const rating =
      typeof raw.rating === 'number'
        ? raw.rating
        : Number((4.1 + ((seedNum % 10) * 0.09)).toFixed(1));
    const clampedRating = Math.min(5.0, Math.max(3.9, rating));
    const reviewCount = raw.reviewCount ?? 18 + (seedNum % 340);
    const soldCount = 35 + (seedNum % 960);
    const popularity = Math.min(99, 68 + (seedNum % 31));
    const daysAgo = (idx * 3 + catIndex) % 120;
    const createdAt = new Date(Date.UTC(2026, 2, 20) - daysAgo * 86_400_000).toISOString();

    const colors = raw.colors && raw.colors.length > 0
      ? raw.colors
      : [cfg.colorsPool[idx % cfg.colorsPool.length], cfg.colorsPool[(idx + 1) % cfg.colorsPool.length]];

    const sizes = raw.sizes && raw.sizes.length > 0
      ? raw.sizes
      : cfg.sizesPool[idx % cfg.sizesPool.length];

    const tags = Array.from(
      new Set([
        cfg.category.toLowerCase(),
        raw.subcategory.toLowerCase(),
        raw.brand.toLowerCase(),
        ...uniqueName.toLowerCase().split(/\s+/).filter((w) => w.length > 2),
        ...(cfg.extraTags || []),
        ...(raw.tags || []),
      ])
    );

    const product: Product = {
      id,
      slug,
      name: uniqueName,
      brand: raw.brand,
      category: cfg.category,
      subcategory: raw.subcategory,
      price: raw.price,
      compareAtPrice: raw.compareAtPrice,
      rating: clampedRating,
      reviewCount,
      reviews: buildReviews(id, clampedRating, seedNum),
      inStock: stockCount > 0,
      stockCount,
      popularity,
      soldCount,
      featured: Boolean(raw.featured ?? idx < 6),
      isFlashSale: Boolean(raw.isFlashSale ?? (raw.compareAtPrice && idx % 5 === 0)),
      isTrending: Boolean(raw.isTrending ?? idx % 6 === 1),
      isBestSeller: Boolean(raw.isBestSeller ?? idx % 7 === 2),
      isNewArrival: Boolean(raw.isNewArrival ?? daysAgo <= 18),
      shortDescription: raw.shortDescription,
      description:
        raw.description ||
        `${raw.shortDescription} Crafted by ${raw.brand} for the ${raw.subcategory} lineup, engineered with verified components, multi-point quality inspection, and full marketplace warranty coverage.`,
      specs: raw.specs,
      colors,
      sizes,
      tags,
      image: images[0],
      images,
      createdAt,
    };

    results.push(product);
  };

  cfg.curated.forEach((item, idx) => pushProduct(item, idx));

  let comboCounter = 0;
  const seriesVariants = ['S', 'X', 'Pro', 'Air', 'Core', 'Plus', 'Select', 'Prime'];

  // Combinatorial deterministic expansion to reach targetCount unique, brand-coherent products
  while (results.length < targetCount && comboCounter < 800) {
    const idx = results.length;
    const subGroups = cfg.subcategoryGroups;

    let brand: string;
    let modelLine: string;
    let edition: string;
    let sub: string;
    let priceRange = cfg.priceRange;
    let sizesOverride: string[] | undefined;
    let extraSubTags: string[] = [];
    let summaryText: string;
    let specsObj: Record<string, string>;

    if (subGroups && subGroups.length > 0) {
      const group = subGroups[(comboCounter + catIndex) % subGroups.length];
      const gIdx = Math.floor(comboCounter / subGroups.length);
      brand = group.brands[gIdx % group.brands.length];
      modelLine = group.modelLines[(gIdx + Math.floor(gIdx / group.brands.length)) % group.modelLines.length];
      edition = group.editions[(comboCounter + gIdx) % group.editions.length];
      sub = group.subcategory;
      if (group.priceRange) priceRange = group.priceRange;
      if (group.sizesPool) sizesOverride = group.sizesPool[idx % group.sizesPool.length];
      if (group.tags) extraSubTags = group.tags;
      summaryText = group.summaryTemplate || cfg.summaryTemplates[idx % cfg.summaryTemplates.length];
      const code = 100 + ((catIndex * 31 + comboCounter * 17) % 880);
      const genSuffix = seriesVariants[(comboCounter + gIdx) % seriesVariants.length];
      const candidateName =
        comboCounter % 2 === 0
          ? `${brand} ${modelLine} ${edition} (${genSuffix}-${code})`
          : `${brand} ${edition} ${modelLine} ${code}`;

      comboCounter += 1;
      if (usedNames.has(candidateName.toLowerCase())) continue;

      const [minP, maxP] = priceRange;
      const spread = maxP - minP;
      const tierFactor = ((idx * 17 + catIndex * 11) % 29) / 28;
      const rawPrice = Math.round(minP + spread * tierFactor);
      const price = rawPrice > 100 ? Math.round(rawPrice / 5) * 5 - 1 : rawPrice;
      const hasDiscount = idx % 3 === 0 || idx % 5 === 0;
      const discountMult = 1.12 + ((idx % 4) * 0.06);
      const compareAtPrice = hasDiscount ? Math.round((price * discountMult) / 5) * 5 : undefined;

      specsObj = group.specsOverride
        ? group.specsOverride(brand, modelLine, idx)
        : cfg.heroSpecsTemplate(brand, `${modelLine} ${code}`, sub, idx);

      pushProduct(
        {
          name: candidateName,
          brand,
          subcategory: sub,
          price: Math.max(15, price),
          compareAtPrice,
          sizes: sizesOverride,
          tags: extraSubTags,
          shortDescription: `${sub} by ${brand} — ${summaryText}`,
          specs: specsObj,
          featured: idx < 6,
          isFlashSale: Boolean(compareAtPrice && idx % 6 === 0),
          isTrending: idx % 5 === 2,
          isBestSeller: idx % 4 === 1,
          isNewArrival: idx % 7 === 0,
        },
        idx
      );
      continue;
    }

    const bIdx = comboCounter % cfg.brands.length;
    brand = cfg.brands[bIdx];
    const brandLines = cfg.brandModels?.[brand] ?? cfg.modelLines;
    const mIdx = Math.floor(comboCounter / cfg.brands.length) % brandLines.length;
    const eIdx = Math.floor(comboCounter / (cfg.brands.length * brandLines.length)) % cfg.editions.length;
    const subIdx = (comboCounter + catIndex) % cfg.subcategories.length;

    modelLine = brandLines[mIdx];
    edition = cfg.editions[(eIdx + bIdx + mIdx) % cfg.editions.length];
    sub = cfg.subcategories[subIdx];

    const genSuffix = seriesVariants[(comboCounter + mIdx) % seriesVariants.length];
    const modelCode = 200 + ((catIndex * 37 + comboCounter * 13) % 790);

    const candidateName =
      comboCounter % 2 === 0
        ? `${brand} ${modelLine} ${genSuffix}-${modelCode} ${edition}`
        : `${brand} ${edition} ${modelLine} ${modelCode}`;

    comboCounter += 1;
    if (usedNames.has(candidateName.toLowerCase())) continue;

    const [minP, maxP] = cfg.priceRange;
    const spread = maxP - minP;
    const tierFactor = ((idx * 17 + catIndex * 11) % 29) / 28;
    const rawPrice = Math.round(minP + spread * tierFactor);
    const price = rawPrice > 100 ? Math.round(rawPrice / 5) * 5 - 1 : rawPrice;
    const hasDiscount = idx % 3 === 0 || idx % 5 === 0;
    const discountMult = 1.12 + ((idx % 4) * 0.06);
    const compareAtPrice = hasDiscount ? Math.round((price * discountMult) / 5) * 5 : undefined;

    const summary = cfg.summaryTemplates[idx % cfg.summaryTemplates.length];

    pushProduct(
      {
        name: candidateName,
        brand,
        subcategory: sub,
        price: Math.max(15, price),
        compareAtPrice,
        shortDescription: `${sub} by ${brand} — ${summary}`,
        specs: cfg.heroSpecsTemplate(brand, `${modelLine} ${modelCode}`, sub, idx),
        featured: idx < 6,
        isFlashSale: Boolean(compareAtPrice && idx % 6 === 0),
        isTrending: idx % 5 === 2,
        isBestSeller: idx % 4 === 1,
        isNewArrival: idx % 7 === 0,
      },
      idx
    );
  }

  return results;
}

export function buildMarketplaceSeedProducts(): Product[] {
  const usedNames = new Set<string>();
  const usedSlugs = new Set<string>();
  const allProducts: Product[] = [];

  CATEGORY_CONFIGS.forEach((cfg, idx) => {
    const items = generateCategoryProducts(cfg, idx, usedNames, usedSlugs);
    allProducts.push(...items);
  });

  // Ensure every category definition name matches a seeded category
  const covered = new Set(allProducts.map((p) => p.category));
  for (const def of CATEGORY_DEFINITIONS) {
    if (!covered.has(def.name)) {
      throw new Error(`Missing seeded category: ${def.name}`);
    }
  }

  return allProducts;
}
