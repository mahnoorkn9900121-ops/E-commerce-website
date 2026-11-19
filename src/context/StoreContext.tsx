import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { STORE_POLICIES } from '../data/catalog.ts';
import { useLocalStorage } from '../hooks/useLocalStorage.ts';
import type {
  CartItem,
  CustomerProfile,
  MarketplaceView,
  OrderRecord,
  PolicyTopic,
  Product,
  ProductSortOption,
  StorefrontBootstrapPayload,
} from '../types/store.ts';

interface StoreContextValue {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  activeView: MarketplaceView;
  goHome: () => void;
  openCategory: (category: string, subcategory?: string) => void;
  openSearch: (
    query: string,
    options?: {
      brand?: string;
      onSaleOnly?: boolean;
      flashSaleOnly?: boolean;
      sortBy?: ProductSortOption;
    }
  ) => void;
  openAdmin: () => void;
  catalogVersion: number;
  bumpCatalogVersion: () => void;
  storefrontConfig: StorefrontBootstrapPayload | null;
  refreshStorefrontConfig: () => Promise<void>;
  cacheProducts: (products: Product[]) => void;
  cart: CartItem[];
  cartCount: number;
  subtotal: number;
  shippingFee: number;
  taxAmount: number;
  orderTotal: number;
  freeShippingRemaining: number;
  addToCart: (product: Product, color?: string, size?: string, quantity?: number) => void;
  removeFromCart: (productId: string, selectedColor: string, selectedSize: string) => void;
  updateCartQuantity: (
    productId: string,
    selectedColor: string,
    selectedSize: string,
    quantity: number
  ) => void;
  clearCart: () => void;
  wishlistIds: string[];
  wishlistProducts: Product[];
  toggleWishlist: (productId: string, productHint?: Product) => void;
  isWishlisted: (productId: string) => boolean;
  recentlyViewedIds: string[];
  recentlyViewedProducts: Product[];
  activeProduct: Product | null;
  openProductDetail: (product: Product) => void;
  closeProductDetail: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isWishlistOpen: boolean;
  setIsWishlistOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  isAccountOpen: boolean;
  setIsAccountOpen: (open: boolean) => void;
  activePolicy: PolicyTopic | null;
  setActivePolicy: (topic: PolicyTopic | null) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  compareIds: string[];
  compareProducts: Product[];
  toggleCompare: (productId: string, productHint?: Product) => void;
  clearCompare: () => void;
  isCompared: (productId: string) => boolean;
  isCompareOpen: boolean;
  setIsCompareOpen: (open: boolean) => void;
  profile: CustomerProfile;
  setProfile: React.Dispatch<React.SetStateAction<CustomerProfile>>;
  orders: OrderRecord[];
  lastPlacedOrder: OrderRecord | null;
  setLastPlacedOrder: (order: OrderRecord | null) => void;
  placeOrder: (
    customer: CustomerProfile,
    paymentMethod: 'Card' | 'Apple Pay' | 'Cash on Delivery'
  ) => OrderRecord;
  toast: string | null;
  showToast: (message: string) => void;
}

const DEFAULT_PROFILE: CustomerProfile = {
  fullName: 'Elena Vance',
  email: 'elena.vance@example.com',
  phone: '+1 (212) 555-0148',
  address: '218 Mercer Street, Apt 4B',
  city: 'New York, NY',
  postalCode: '10012',
  country: 'United States',
};

function parseHashToView(): MarketplaceView {
  if (typeof window === 'undefined') return { type: 'home' };
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash || hash === '/' || hash === 'top') return { type: 'home' };
  if (hash === '/admin') return { type: 'admin' };
  if (hash.startsWith('/category/')) {
    const raw = hash.slice('/category/'.length);
    const [catEncoded, subEncoded] = raw.split('?sub=');
    return {
      type: 'category',
      category: decodeURIComponent(catEncoded || 'Electronics'),
      subcategory: subEncoded ? decodeURIComponent(subEncoded) : undefined,
    };
  }
  if (hash.startsWith('/search')) {
    const queryStr = hash.includes('?') ? hash.split('?')[1] : '';
    const sp = new URLSearchParams(queryStr);
    return {
      type: 'search',
      query: sp.get('q') || '',
      brand: sp.get('brand') || undefined,
      onSaleOnly: sp.get('onSale') === 'true',
      flashSaleOnly: sp.get('flashSale') === 'true',
      sortBy: (sp.get('sort') as ProductSortOption) || undefined,
    };
  }
  return { type: 'home' };
}

function viewToHash(view: MarketplaceView): string {
  switch (view.type) {
    case 'admin':
      return '#/admin';
    case 'category': {
      const base = `#/category/${encodeURIComponent(view.category)}`;
      return view.subcategory ? `${base}?sub=${encodeURIComponent(view.subcategory)}` : base;
    }
    case 'search': {
      const sp = new URLSearchParams();
      if (view.query) sp.set('q', view.query);
      if (view.brand) sp.set('brand', view.brand);
      if (view.onSaleOnly) sp.set('onSale', 'true');
      if (view.flashSaleOnly) sp.set('flashSale', 'true');
      if (view.sortBy) sp.set('sort', view.sortBy);
      const qs = sp.toString();
      return qs ? `#/search?${qs}` : '#/search';
    }
    case 'home':
    default:
      return '#/';
  }
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('mk_theme_v1', 'light');
  const [cart, setCart] = useLocalStorage<CartItem[]>('mk_cart_v1', []);
  const [wishlistIds, setWishlistIds] = useLocalStorage<string[]>('mk_wishlist_v1', []);
  const [recentlyViewedIds, setRecentlyViewedIds] = useLocalStorage<string[]>('mk_recent_v1', []);
  const [compareIds, setCompareIds] = useLocalStorage<string[]>('mk_compare_v1', []);
  const [profile, setProfile] = useLocalStorage<CustomerProfile>('mk_profile_v1', DEFAULT_PROFILE);
  const [orders, setOrders] = useLocalStorage<OrderRecord[]>('mk_orders_v1', []);

  const [activeView, setActiveView] = useState<MarketplaceView>(() => parseHashToView());
  const [catalogVersion, setCatalogVersion] = useState(0);
  const [storefrontConfig, setStorefrontConfig] = useState<StorefrontBootstrapPayload | null>(null);
  const [productMap, setProductMap] = useState<Record<string, Product>>({});
  const fetchedIdsRef = useRef<Set<string>>(new Set());

  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [activePolicy, setActivePolicy] = useState<PolicyTopic | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<OrderRecord | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const onHashChange = () => {
      setActiveView(parseHashToView());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigateView = useCallback((nextView: MarketplaceView) => {
    setActiveView(nextView);
    const targetHash = viewToHash(nextView);
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goHome = useCallback(() => navigateView({ type: 'home' }), [navigateView]);

  const openCategory = useCallback(
    (category: string, subcategory?: string) => {
      navigateView({ type: 'category', category, subcategory });
    },
    [navigateView]
  );

  const openSearch = useCallback(
    (
      query: string,
      options?: {
        brand?: string;
        onSaleOnly?: boolean;
        flashSaleOnly?: boolean;
        sortBy?: ProductSortOption;
      }
    ) => {
      navigateView({
        type: 'search',
        query,
        brand: options?.brand,
        onSaleOnly: options?.onSaleOnly,
        flashSaleOnly: options?.flashSaleOnly,
        sortBy: options?.sortBy,
      });
    },
    [navigateView]
  );

  const openAdmin = useCallback(() => navigateView({ type: 'admin' }), [navigateView]);

  const bumpCatalogVersion = useCallback(() => {
    setCatalogVersion((v) => v + 1);
  }, []);

  const refreshStorefrontConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/storefront/bootstrap');
      if (res.ok) {
        const data = (await res.json()) as StorefrontBootstrapPayload;
        setStorefrontConfig(data);

        // Apply live SEO & Favicon settings
        if (data.cms?.settings) {
          const s = data.cms.settings;
          document.title = s.seoTitle || s.websiteName || 'MAISON KOVA';
          const metaDesc = document.querySelector('meta[name="description"]');
          if (metaDesc && (s.seoDescription || s.description)) {
            metaDesc.setAttribute('content', s.seoDescription || s.description);
          }
          if (s.faviconUrl) {
            let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
            if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.head.appendChild(link);
            }
            link.href = s.faviconUrl;
          }
          if (!localStorage.getItem('mk_theme_v1') && s.defaultTheme) {
            setTheme(s.defaultTheme);
          }
        }
      }
    } catch {
      // Ignore offline errors
    }
  }, [setTheme]);

  useEffect(() => {
    void refreshStorefrontConfig();
  }, [catalogVersion, refreshStorefrontConfig]);

  const cacheProducts = useCallback((products: Product[]) => {
    if (!products.length) return;
    setProductMap((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const p of products) {
        if (!next[p.id] || next[p.id].price !== p.price || next[p.id].stockCount !== p.stockCount) {
          next[p.id] = p;
          fetchedIdsRef.current.add(p.id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, []);

  // Batch-hydrate saved wishlist, recently viewed & compare IDs from SQLite backend
  useEffect(() => {
    const needed = Array.from(
      new Set([...wishlistIds, ...recentlyViewedIds, ...compareIds])
    ).filter((id) => !productMap[id] && !fetchedIdsRef.current.has(id));

    if (needed.length === 0) return;
    needed.forEach((id) => fetchedIdsRef.current.add(id));

    fetch('/api/products/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: needed }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { products?: Product[] } | null) => {
        if (data?.products?.length) {
          cacheProducts(data.products);
        }
      })
      .catch(() => {
        // Silent fallback if offline
      });
  }, [wishlistIds, recentlyViewedIds, compareIds, productMap, cacheProducts]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const showToast = useCallback((message: string) => {
    setToast(message);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, [setTheme]);

  const addToCart = useCallback(
    (product: Product, color?: string, size?: string, quantity = 1) => {
      cacheProducts([product]);
      if (!product.inStock || product.stockCount <= 0) {
        showToast(`${product.name} is currently out of stock.`);
        return;
      }

      const selectedColor = color || product.colors[0]?.name || 'Standard';
      const selectedSize = size || product.sizes[0] || 'One Size';

      setCart((prev) => {
        const existingIndex = prev.findIndex(
          (item) =>
            item.productId === product.id &&
            item.selectedColor === selectedColor &&
            item.selectedSize === selectedSize
        );

        if (existingIndex > -1) {
          const updated = [...prev];
          const nextQty = Math.min(
            updated[existingIndex].quantity + quantity,
            product.stockCount
          );
          updated[existingIndex] = { ...updated[existingIndex], quantity: nextQty };
          return updated;
        }

        return [
          ...prev,
          {
            productId: product.id,
            slug: product.slug,
            name: product.name,
            brand: product.brand,
            image: product.image,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            selectedColor,
            selectedSize,
            quantity: Math.min(quantity, product.stockCount),
            stockCount: product.stockCount,
          },
        ];
      });

      showToast(`Added ${product.name} to your bag.`);
    },
    [cacheProducts, setCart, showToast]
  );

  const removeFromCart = useCallback(
    (productId: string, selectedColor: string, selectedSize: string) => {
      setCart((prev) =>
        prev.filter(
          (item) =>
            !(
              item.productId === productId &&
              item.selectedColor === selectedColor &&
              item.selectedSize === selectedSize
            )
        )
      );
    },
    [setCart]
  );

  const updateCartQuantity = useCallback(
    (productId: string, selectedColor: string, selectedSize: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(productId, selectedColor, selectedSize);
        return;
      }
      setCart((prev) =>
        prev.map((item) =>
          item.productId === productId &&
          item.selectedColor === selectedColor &&
          item.selectedSize === selectedSize
            ? { ...item, quantity: Math.min(quantity, item.stockCount) }
            : item
        )
      );
    },
    [removeFromCart, setCart]
  );

  const clearCart = useCallback(() => {
    setCart([]);
  }, [setCart]);

  const toggleWishlist = useCallback(
    (productId: string, productHint?: Product) => {
      if (productHint) cacheProducts([productHint]);
      const product = productHint || productMap[productId];
      setWishlistIds((prev) => {
        const exists = prev.includes(productId);
        if (exists) {
          showToast(product ? `Removed ${product.name} from wishlist.` : 'Removed from wishlist.');
          return prev.filter((id) => id !== productId);
        }
        showToast(product ? `Saved ${product.name} to wishlist.` : 'Saved to wishlist.');
        return [productId, ...prev];
      });
    },
    [cacheProducts, productMap, setWishlistIds, showToast]
  );

  const isWishlisted = useCallback(
    (productId: string) => wishlistIds.includes(productId),
    [wishlistIds]
  );

  const toggleCompare = useCallback(
    (productId: string, productHint?: Product) => {
      if (productHint) cacheProducts([productHint]);
      const product = productHint || productMap[productId];
      setCompareIds((prev) => {
        if (prev.includes(productId)) {
          showToast(product ? `Removed ${product.name} from comparison.` : 'Removed from comparison.');
          return prev.filter((id) => id !== productId);
        }
        if (prev.length >= 2) {
          const next = [prev[1], productId];
          showToast(
            product
              ? `Comparing ${product.name} (2 of 2 selected).`
              : 'Updated comparison selection (2/2).'
          );
          return next;
        }
        if (product) {
          showToast(
            prev.length === 0
              ? `Selected ${product.name} — pick 1 more item to compare.`
              : `Ready to compare 2 items.`
          );
        }
        return [...prev, productId];
      });
    },
    [cacheProducts, productMap, setCompareIds, showToast]
  );

  const clearCompare = useCallback(() => {
    setCompareIds([]);
    setIsCompareOpen(false);
  }, [setCompareIds]);

  const isCompared = useCallback(
    (productId: string) => compareIds.includes(productId),
    [compareIds]
  );

  const openProductDetail = useCallback(
    (product: Product) => {
      cacheProducts([product]);
      setActiveProduct(product);
      setRecentlyViewedIds((prev) =>
        [product.id, ...prev.filter((id) => id !== product.id)].slice(0, 12)
      );
    },
    [cacheProducts, setRecentlyViewedIds]
  );

  const closeProductDetail = useCallback(() => {
    setActiveProduct(null);
  }, []);

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const shippingFee = useMemo(() => {
    if (cart.length === 0) return 0;
    return subtotal >= STORE_POLICIES.freeShippingThreshold
      ? 0
      : STORE_POLICIES.standardShippingFee;
  }, [cart.length, subtotal]);

  const taxAmount = useMemo(
    () => Math.round(subtotal * STORE_POLICIES.taxRate * 100) / 100,
    [subtotal]
  );

  const orderTotal = useMemo(
    () => Math.round((subtotal + shippingFee + taxAmount) * 100) / 100,
    [subtotal, shippingFee, taxAmount]
  );

  const freeShippingRemaining = useMemo(
    () => Math.max(0, STORE_POLICIES.freeShippingThreshold - subtotal),
    [subtotal]
  );

  const wishlistProducts = useMemo(
    () => wishlistIds.map((id) => productMap[id]).filter((p): p is Product => Boolean(p)),
    [wishlistIds, productMap]
  );

  const recentlyViewedProducts = useMemo(
    () =>
      recentlyViewedIds.map((id) => productMap[id]).filter((p): p is Product => Boolean(p)),
    [recentlyViewedIds, productMap]
  );

  const compareProducts = useMemo(
    () => compareIds.map((id) => productMap[id]).filter((p): p is Product => Boolean(p)),
    [compareIds, productMap]
  );

  const placeOrder = useCallback(
    (
      customer: CustomerProfile,
      paymentMethod: 'Card' | 'Apple Pay' | 'Cash on Delivery'
    ): OrderRecord => {
      const order: OrderRecord = {
        orderNumber: `MK-${Math.floor(100000 + Math.random() * 900000)}`,
        createdAt: new Date().toISOString(),
        status: 'Pending',
        paymentMethod,
        paymentStatus: paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Paid',
        items: [...cart],
        subtotal,
        shipping: shippingFee,
        tax: taxAmount,
        total: orderTotal,
        customer,
      };
      setProfile(customer);
      setOrders((prev) => [order, ...prev]);
      setLastPlacedOrder(order);
      setCart([]);

      // Persist to SQLite orders table & decrement stock
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      })
        .then(() => bumpCatalogVersion())
        .catch(() => {
          // Order remains saved in LocalStorage
        });

      return order;
    },
    [
      bumpCatalogVersion,
      cart,
      orderTotal,
      setCart,
      setOrders,
      setProfile,
      shippingFee,
      subtotal,
      taxAmount,
    ]
  );

  const value: StoreContextValue = {
    theme,
    toggleTheme,
    activeView,
    goHome,
    openCategory,
    openSearch,
    openAdmin,
    catalogVersion,
    bumpCatalogVersion,
    storefrontConfig,
    refreshStorefrontConfig,
    cacheProducts,
    cart,
    cartCount,
    subtotal,
    shippingFee,
    taxAmount,
    orderTotal,
    freeShippingRemaining,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    wishlistIds,
    wishlistProducts,
    toggleWishlist,
    isWishlisted,
    recentlyViewedIds,
    recentlyViewedProducts,
    activeProduct,
    openProductDetail,
    closeProductDetail,
    isCartOpen,
    setIsCartOpen,
    isWishlistOpen,
    setIsWishlistOpen,
    isCheckoutOpen,
    setIsCheckoutOpen,
    isAccountOpen,
    setIsAccountOpen,
    activePolicy,
    setActivePolicy,
    isChatOpen,
    setIsChatOpen,
    compareIds,
    compareProducts,
    toggleCompare,
    clearCompare,
    isCompared,
    isCompareOpen,
    setIsCompareOpen,
    profile,
    setProfile,
    orders,
    lastPlacedOrder,
    setLastPlacedOrder,
    placeOrder,
    toast,
    showToast,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used inside StoreProvider');
  }
  return ctx;
}
