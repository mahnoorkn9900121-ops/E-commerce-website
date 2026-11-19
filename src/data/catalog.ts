import type { Product } from '../types/store.ts';

export const HERO_BANNER_IMAGE = '/src/assets/images/hero_kova_flagship_1794934149973.jpg';

export interface CategoryMetaDefinition {
  slug: string;
  name: string;
  description: string;
  image: string;
}

export const CATEGORY_DEFINITIONS: CategoryMetaDefinition[] = [
  {
    slug: 'electronics',
    name: 'Electronics',
    description: 'Smart home speakers, streaming hubs, power stations, and everyday connected devices.',
    image: '/src/assets/images/cat_electronics_speaker_1794937158424.jpg',
  },
  {
    slug: 'mobile-phones',
    name: 'Mobile Phones',
    description: 'Flagship iOS and Android smartphones, foldables, and unlocked 5G handsets.',
    image: '/src/assets/images/product_phone_ceramic_1794934152279.jpg',
  },
  {
    slug: 'laptops-computers',
    name: 'Laptops & Computers',
    description: 'Ultrabooks, gaming laptops, creator workstations, studio monitors, and tablets.',
    image: '/src/assets/images/product_aetherbook_pro_1794934151952.jpg',
  },
  {
    slug: 'fashion-clothing',
    name: 'Fashion & Clothing',
    description: 'Architectural knitwear, all-season outerwear, tailored essentials, and capsule staples.',
    image: '/src/assets/images/product_cashmere_knit_1794935885365.jpg',
  },
  {
    slug: 'mens-fashion',
    name: "Men's Fashion",
    description: 'Wool overcoats, matte black jackets, Japanese selvedge denim, and merino layering.',
    image: '/src/assets/images/product_merino_coat_1794934153415.jpg',
  },
  {
    slug: 'womens-fashion',
    name: "Women's Fashion",
    description: 'Tailored coats, silk blouses, draped dresses, and modern studio ready-to-wear.',
    image: '/src/assets/images/cat_womens_fashion_1794937154454.jpg',
  },
  {
    slug: 'shoes-sneakers',
    name: 'Shoes & Sneakers',
    description: 'Nike Air Max runners, Italian leather boots, low-top court sneakers, and loafers.',
    image: '/src/assets/images/product_obsidian_sneaker_1794934149829.jpg',
  },
  {
    slug: 'watches',
    name: 'Watches',
    description: 'Automatic chronographs, Grade 5 titanium divers, GMT field watches, and dress pieces.',
    image: '/src/assets/images/product_titanium_watch_1794934154617.jpg',
  },
  {
    slug: 'beauty-personal-care',
    name: 'Beauty & Personal Care',
    description: 'Botanical serums, barrier skincare, signature fragrances, and precision grooming.',
    image: '/src/assets/images/cat_beauty_skincare_1794937154046.jpg',
  },
  {
    slug: 'home-kitchen',
    name: 'Home & Kitchen',
    description: 'Precision coffee craft, sculptural tableware, travertine lighting, and ceramic vessels.',
    image: '/src/assets/images/product_espresso_machine_1794935886703.jpg',
  },
  {
    slug: 'furniture',
    name: 'Furniture',
    description: 'Ergonomic lounge chairs, solid oak dining pieces, modular desks, and accent lighting.',
    image: '/src/assets/images/cat_furniture_chair_1794937154157.jpg',
  },
  {
    slug: 'sports-fitness',
    name: 'Sports & Fitness',
    description: 'Adjustable weights, trail gear, recovery massagers, yoga mats, and training essentials.',
    image: '/src/assets/images/cat_sports_fitness_1794937155937.jpg',
  },
  {
    slug: 'gaming-accessories',
    name: 'Gaming Accessories',
    description: 'Mechanical keyboards, ultra-light wireless mice, OLED gaming displays, and headsets.',
    image: '/src/assets/images/cat_gaming_gear_1794937157253.jpg',
  },
  {
    slug: 'cameras',
    name: 'Cameras',
    description: 'Full-frame mirrorless cameras, prime lenses, action cams, and optical viewfinders.',
    image: '/src/assets/images/product_mirrorless_camera_1794935886115.jpg',
  },
  {
    slug: 'headphones-audio',
    name: 'Headphones & Audio',
    description: 'ANC wireless headphones, planar magnetic studio cans, true wireless earbuds, and DACs.',
    image: '/src/assets/images/product_planar_headphones_1794934153518.jpg',
  },
  {
    slug: 'smart-watches',
    name: 'Smart Watches',
    description: 'AMOLED fitness trackers, GPS multisport watches, and smart watches under $100.',
    image: '/src/assets/images/cat_smart_watch_1794937155343.jpg',
  },
  {
    slug: 'toys-baby-products',
    name: 'Toys & Baby Products',
    description: 'Montessori wooden sets, STEM building kits, organic nursery gear, and travel strollers.',
    image: '/src/assets/images/cat_toys_baby_1794937156688.jpg',
  },
  {
    slug: 'books-stationery',
    name: 'Books & Stationery',
    description: 'Design monographs, fountain pens, Japanese grid notebooks, and architectural desk tools.',
    image: '/src/assets/images/cat_books_stationery_1794937156513.jpg',
  },
  {
    slug: 'accessories',
    name: 'Accessories',
    description: 'Full-grain leather totes, travel backpacks, sunglasses, wallets, and MagSafe carry.',
    image: '/src/assets/images/product_weekender_tote_1794934154195.jpg',
  },
  {
    slug: 'home-appliances',
    name: 'Home Appliances',
    description: 'Cordless HEPA vacuums, air purifiers, smart air fryers, and espresso systems.',
    image: '/src/assets/images/cat_home_appliance_1794937156735.jpg',
  },
];

export const AVAILABLE_STUDIO_ASSETS = Array.from(
  new Set([
    ...CATEGORY_DEFINITIONS.map((c) => c.image),
    '/src/assets/images/product_aetherbook_air_1794934151549.jpg',
    '/src/assets/images/product_carbon_runner_1794934149798.jpg',
    '/src/assets/images/product_ceramic_vase_1794935886828.jpg',
    '/src/assets/images/product_chalk_lowtop_1794934150634.jpg',
    '/src/assets/images/product_chelsea_boot_1794935884279.jpg',
    '/src/assets/images/product_desk_clock_1794935887037.jpg',
    '/src/assets/images/product_leather_loafer_1794935884716.jpg',
    '/src/assets/images/product_mech_keyboard_1794935884595.jpg',
    '/src/assets/images/product_phone_lite_1794934152864.jpg',
    '/src/assets/images/product_selvedge_denim_1794935886521.jpg',
    '/src/assets/images/product_studio_monitor_1794935884234.jpg',
    '/src/assets/images/product_tablet_stylus_1794935885871.jpg',
    '/src/assets/images/product_trail_boot_1794935883596.jpg',
    '/src/assets/images/product_travertine_lamp_1794934154162.jpg',
  ])
);

// Client bundle stays light; products are served from the SQLite FTS5 backend API.
export const PRODUCTS: Product[] = [];

export const STORE_POLICIES = {
  brandName: 'MAISON KOVA',
  tagline: 'Global Marketplace · Electronics, Fashion, Computing & Design',
  freeShippingThreshold: 150,
  standardShippingFee: 12,
  taxRate: 0.08,
  contact: {
    email: 'concierge@maisonkova.com',
    phone: '+1 (212) 555-0194',
    showroom: '412 Crosby Street, SoHo, New York, NY 10012',
    hours: 'Mon–Sat 10:00 AM – 7:00 PM EST',
  },
  shipping:
    'Complimentary insured express shipping on all orders over $150 (1–3 business days). Orders under $150 ship at a flat $12 express rate. Every order ships in plastic-free FSC-certified packaging with real-time tracking.',
  returns:
    'Enjoy a 30-day complimentary return and size-exchange window from the date of delivery. Items must be unworn, unwashed, and returned in original presentation packaging. Instant store credit or original-method refunds are processed within 48 hours of inspection.',
  warranty:
    'All flagship electronics, laptops, cameras, and horology timepieces include an official 2-year hardware warranty. Footwear and leather goods include complimentary seam and sole care support.',
  about:
    'MAISON KOVA Marketplace brings together 1,500+ curated products across 20 specialized categories—from flagship iPhones, Samsung Galaxy phones, Nike Air Max footwear, and gaming laptops to architectural fashion, furniture, and home appliances—backed by an AI shopping concierge.',
  privacy:
    'We respect customer privacy strictly. Cart, wishlist, and browsing preferences remain stored locally on your device. Order contact details are used solely for fulfillment and concierge support, and are never sold or shared with third-party data brokers.',
  terms:
    'All prices are displayed in USD. Flash Sale and Daily Deal markdowns are valid while allocated stock remains. Cash on Delivery orders require phone verification at checkout. Warranty coverage applies to manufacturing defects under normal use.',
  faqs: [
    {
      q: 'Do you offer free shipping?',
      a: 'Yes—all orders of $150 or more qualify automatically for complimentary 1–3 business day express courier shipping.',
    },
    {
      q: 'What is your return policy?',
      a: 'We offer free 30-day returns and size exchanges on all unworn items and sealed electronics.',
    },
    {
      q: 'Are Flash Sale & Daily Deal discounts applied automatically?',
      a: 'Yes, promotional prices displayed on product cards across our marketplace are reflected directly in your bag.',
    },
    {
      q: 'Do you support Cash on Delivery (COD)?',
      a: 'Yes, Cash on Delivery is available at checkout alongside Credit Card and Apple Pay with instant confirmation.',
    },
  ],
};
