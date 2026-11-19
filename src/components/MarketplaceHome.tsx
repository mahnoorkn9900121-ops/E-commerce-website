import { useEffect, useState } from 'react';
import { ArrowRight, Flame, Sparkles, Tag, TrendingUp } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import type { MarketplaceHomePayload, PaginatedProductsResponse, Product } from '../types/store.ts';
import { HeroSection } from './HeroSection.tsx';
import { ProductCard } from './ProductCard.tsx';
import { ProductImage } from './ProductImage.tsx';

type ShowcaseTab = 'trending' | 'bestSelling' | 'newArrivals' | 'dailyDeals';

export function MarketplaceHome() {
  const {
    catalogVersion,
    cacheProducts,
    openCategory,
    openSearch,
    recentlyViewedProducts,
    storefrontConfig,
  } = useStore();

  const [homeData, setHomeData] = useState<MarketplaceHomePayload | null>(null);
  const [activeTab, setActiveTab] = useState<ShowcaseTab>('trending');
  const [exploreProducts, setExploreProducts] = useState<Product[]>([]);
  const [explorePage, setExplorePage] = useState(1);
  const [exploreHasMore, setExploreHasMore] = useState(false);
  const [exploreTotal, setExploreTotal] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/marketplace/home')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: MarketplaceHomePayload | null) => {
        if (!active || !data) return;
        setHomeData(data);
        cacheProducts([
          ...data.flashSale,
          ...data.trending,
          ...data.bestSelling,
          ...data.newArrivals,
          ...data.dailyDeals,
        ]);
      })
      .catch(() => {
        // Silent network safeguard
      });

    fetch('/api/products?page=1&pageSize=12&sort=featured')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PaginatedProductsResponse | null) => {
        if (!active || !data) return;
        setExploreProducts(data.products);
        setExplorePage(data.page);
        setExploreHasMore(data.hasMore);
        setExploreTotal(data.total);
        cacheProducts(data.products);
      })
      .catch(() => {
        // Silent network safeguard
      });

    return () => {
      active = false;
    };
  }, [catalogVersion, cacheProducts]);

  const handleLoadMoreExplore = async () => {
    if (!exploreHasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = explorePage + 1;
      const res = await fetch(`/api/products?page=${nextPage}&pageSize=12&sort=featured`);
      if (res.ok) {
        const data = (await res.json()) as PaginatedProductsResponse;
        cacheProducts(data.products);
        setExploreProducts((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          return [...prev, ...data.products.filter((p) => !seen.has(p.id))];
        });
        setExplorePage(data.page);
        setExploreHasMore(data.hasMore);
        setExploreTotal(data.total);
      }
    } finally {
      setIsLoadingMore(false);
    }
  };

  const tabProducts = homeData
    ? activeTab === 'trending'
      ? homeData.trending
      : activeTab === 'bestSelling'
        ? homeData.bestSelling
        : activeTab === 'newArrivals'
          ? homeData.newArrivals
          : homeData.dailyDeals
    : [];

  const activeBanners = (storefrontConfig?.cms.banners ?? [])
    .filter((b) => b.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const orderedSections = storefrontConfig?.cms.homepage.sections ?? [
    { key: 'categories' as const, label: 'Categories', visible: true },
    { key: 'flashSale' as const, label: 'Flash Sale', visible: true },
    { key: 'curatedShowcase' as const, label: 'Curated Showcase', visible: true },
    { key: 'brands' as const, label: 'Brands', visible: true },
    { key: 'exploreFeed' as const, label: 'Explore Feed', visible: true },
  ];

  const renderSection = (key: string) => {
    if (key === 'categories') {
      return (
        <section
          key="categories"
          className="max-w-7xl mx-auto px-4 sm:px-8 py-10 lg:py-12 border-b border-stone-200 dark:border-stone-800"
        >
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400 mb-1">
                Shop by Department
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-medium text-stone-900 dark:text-stone-100">
                All {homeData?.categories.length ?? 20} Marketplace Categories
              </h2>
            </div>
            <button
              type="button"
              onClick={() => openSearch('', { sortBy: 'featured' })}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9A6B42] dark:text-[#C89B6E] hover:underline whitespace-nowrap cursor-pointer"
            >
              <span>Browse All Products</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {(homeData?.categories ?? []).map((cat) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => openCategory(cat.name)}
                className="group flex items-center gap-3 p-2.5 rounded-lg bg-white dark:bg-[#191816] border border-stone-200/80 dark:border-stone-800 hover:border-[#9A6B42] dark:hover:border-[#C89B6E] transition-all text-left cursor-pointer"
              >
                <div className="w-12 h-12 rounded-md overflow-hidden bg-[#EFECE6] dark:bg-[#22211E] shrink-0">
                  <ProductImage
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate group-hover:text-[#9A6B42] dark:group-hover:text-[#C89B6E]">
                    {cat.name}
                  </p>
                  <p className="text-[11px] font-mono-tabular text-stone-500 dark:text-stone-400">
                    {cat.productCount} items
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      );
    }

    if (key === 'flashSale' && homeData && homeData.flashSale.length > 0) {
      return (
        <section
          key="flashSale"
          className="max-w-7xl mx-auto px-4 sm:px-8 py-10 lg:py-12 border-b border-stone-200 dark:border-stone-800"
        >
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#9A6B42] dark:text-[#C89B6E] mb-1">
                <Flame className="w-3.5 h-3.5" />
                <span>Flash Sale · Limited Stock Markdowns</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-medium text-stone-900 dark:text-stone-100">
                Today’s Flash Deals
              </h2>
            </div>
            <button
              type="button"
              onClick={() => openSearch('', { flashSaleOnly: true, sortBy: 'popular' })}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium border border-stone-300 dark:border-stone-700 rounded-md hover:border-stone-500 transition-colors cursor-pointer"
            >
              <span>View All Flash Deals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {homeData.flashSale.slice(0, 8).map((product, idx) => (
              <ProductCard key={product.id} product={product} index={idx} />
            ))}
          </div>
        </section>
      );
    }

    if (key === 'curatedShowcase' && homeData) {
      return (
        <section
          key="curatedShowcase"
          className="max-w-7xl mx-auto px-4 sm:px-8 py-10 lg:py-12 border-b border-stone-200 dark:border-stone-800"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400 mb-1">
                Marketplace Highlights
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-medium text-stone-900 dark:text-stone-100">
                Curated for You
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#EFECE6] dark:bg-[#1D1C19] rounded-lg self-start">
              {(
                [
                  ['trending', 'Trending', TrendingUp],
                  ['bestSelling', 'Best Selling', Sparkles],
                  ['newArrivals', 'New Arrivals', Sparkles],
                  ['dailyDeals', 'Daily Deals', Tag],
                ] as const
              ).map(([tabKey, label]) => (
                <button
                  key={tabKey}
                  type="button"
                  onClick={() => setActiveTab(tabKey)}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    activeTab === tabKey
                      ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {tabProducts.map((product, idx) => (
              <ProductCard key={product.id} product={product} index={idx} />
            ))}
          </div>
        </section>
      );
    }

    if (key === 'brands' && homeData && homeData.brands.length > 0) {
      return (
        <section
          key="brands"
          className="max-w-7xl mx-auto px-4 sm:px-8 py-10 lg:py-12 border-b border-stone-200 dark:border-stone-800"
        >
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400 mb-1">
                Authorized Brand Boutiques
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-medium text-stone-900 dark:text-stone-100">
                Shop by Flagship Brand
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {homeData.brands.map((brand) => (
              <button
                key={brand.name}
                type="button"
                onClick={() => openSearch('', { brand: brand.name })}
                className="group p-3.5 rounded-lg bg-white dark:bg-[#191816] border border-stone-200/80 dark:border-stone-800 hover:border-[#9A6B42] dark:hover:border-[#C89B6E] text-left transition-all cursor-pointer"
              >
                <div className="aspect-[16/10] w-full rounded overflow-hidden bg-[#EFECE6] dark:bg-[#22211E] mb-2.5">
                  <ProductImage
                    src={brand.sampleImage}
                    alt={brand.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
                  {brand.name}
                </p>
                <p className="text-[11px] font-mono-tabular text-stone-500 dark:text-stone-400">
                  {brand.productCount} products
                </p>
              </button>
            ))}
          </div>
        </section>
      );
    }

    if (key === 'exploreFeed') {
      return (
        <section key="exploreFeed" className="max-w-7xl mx-auto px-4 sm:px-8 py-10 lg:py-12">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400 mb-1">
                Just For You · {exploreTotal.toLocaleString()} Indexed Listings
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-medium text-stone-900 dark:text-stone-100">
                Explore the Marketplace
              </h2>
            </div>

            <button
              type="button"
              onClick={() => openSearch('', { sortBy: 'featured' })}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9A6B42] dark:text-[#C89B6E] hover:underline cursor-pointer"
            >
              <span>Open Full Filterable Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {exploreProducts.map((product, idx) => (
              <ProductCard key={product.id} product={product} index={idx % 12} />
            ))}
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {exploreHasMore && (
              <button
                type="button"
                onClick={handleLoadMoreExplore}
                disabled={isLoadingMore}
                className="px-7 py-3 text-xs font-medium tracking-wide bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 rounded-md transition-colors disabled:opacity-60 cursor-pointer"
              >
                {isLoadingMore
                  ? 'Loading Products...'
                  : `Load More Products (${Math.max(0, exploreTotal - exploreProducts.length).toLocaleString()} remaining)`}
              </button>
            )}
            <button
              type="button"
              onClick={() => openSearch('', { sortBy: 'featured' })}
              className="px-6 py-3 text-xs font-medium border border-stone-300 dark:border-stone-700 rounded-md hover:border-stone-500 transition-colors cursor-pointer"
            >
              Advanced Filters &amp; Sorting
            </button>
          </div>
        </section>
      );
    }

    return null;
  };

  return (
    <div>
      <HeroSection
        totalProducts={homeData?.totalProducts ?? 1500}
        totalCategories={homeData?.totalCategories ?? 20}
      />

      {/* Dynamic CMS Promotional Banners */}
      {activeBanners.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 pb-2">
          <div
            className={`grid grid-cols-1 ${
              activeBanners.length > 1 ? 'md:grid-cols-2' : ''
            } gap-4`}
          >
            {activeBanners.map((banner) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => openSearch(banner.ctaQuery)}
                className="group relative overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-900 text-left min-h-[168px] flex items-end p-5 cursor-pointer"
              >
                <ProductImage
                  src={banner.image}
                  alt={banner.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-55 group-hover:scale-105 transition-transform duration-300"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/20"
                />
                <div className="relative z-10 max-w-md">
                  <p className="font-display text-xl sm:text-2xl font-medium text-white leading-tight">
                    {banner.title}
                  </p>
                  <p className="text-xs text-stone-200 mt-1 line-clamp-2">{banner.subtitle}</p>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#C89B6E] mt-3 group-hover:underline">
                    <span>{banner.ctaLabel || 'Explore'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {orderedSections.filter((s) => s.visible).map((s) => renderSection(s.key))}

      {/* Recently Viewed Strip */}
      {recentlyViewedProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-8 py-10 border-t border-stone-200 dark:border-stone-800">
          <h2 className="font-display text-2xl font-medium text-stone-900 dark:text-stone-100 mb-5">
            Recently Viewed
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {recentlyViewedProducts.slice(0, 4).map((product, idx) => (
              <ProductCard key={product.id} product={product} index={idx} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
