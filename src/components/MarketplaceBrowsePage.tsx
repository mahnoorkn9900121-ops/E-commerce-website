import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Loader2,
  RotateCcw,
  Scale,
  SlidersHorizontal,
} from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { CATEGORY_DEFINITIONS } from '../data/catalog.ts';
import type {
  CatalogFacets,
  PaginatedProductsResponse,
  Product,
  ProductSortOption,
} from '../types/store.ts';
import { ProductCard } from './ProductCard.tsx';
import { ProductImage } from './ProductImage.tsx';

const PAGE_SIZE = 24;

export function MarketplaceBrowsePage() {
  const {
    activeView,
    catalogVersion,
    cacheProducts,
    goHome,
    openCategory,
    openSearch,
    compareIds,
    setIsCompareOpen,
  } = useStore();

  const isCategoryView = activeView.type === 'category';
  const categoryName = isCategoryView ? activeView.category : 'All';
  const initialSubcategory = isCategoryView ? activeView.subcategory || 'All' : 'All';
  const initialQuery = activeView.type === 'search' ? activeView.query : '';
  const initialBrand = activeView.type === 'search' && activeView.brand ? activeView.brand : 'All';
  const initialOnSale = activeView.type === 'search' ? Boolean(activeView.onSaleOnly) : false;
  const initialFlashSale = activeView.type === 'search' ? Boolean(activeView.flashSaleOnly) : false;
  const initialSort =
    activeView.type === 'search' && activeView.sortBy ? activeView.sortBy : 'featured';

  const [subcategory, setSubcategory] = useState(initialSubcategory);
  const [selectedBrand, setSelectedBrand] = useState(initialBrand);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(initialOnSale);
  const [flashSaleOnly, setFlashSaleOnly] = useState(initialFlashSale);
  const [sortBy, setSortBy] = useState<ProductSortOption>(initialSort);

  const [products, setProducts] = useState<Product[]>([]);
  const [facets, setFacets] = useState<CatalogFacets>({
    brands: [],
    subcategories: [],
    minPrice: 0,
    maxPrice: 3500,
  });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Sync filter defaults whenever top-level route/view props change
  useEffect(() => {
    setSubcategory(initialSubcategory);
    setSelectedBrand(initialBrand);
    setOnSaleOnly(initialOnSale);
    setFlashSaleOnly(initialFlashSale);
    setSortBy(initialSort);
    setMinPrice('');
    setMaxPrice('');
    setMinRating(undefined);
    setInStockOnly(false);
    setPage(1);
  }, [
    categoryName,
    initialSubcategory,
    initialQuery,
    initialBrand,
    initialOnSale,
    initialFlashSale,
    initialSort,
  ]);

  const buildParams = (targetPage: number) => {
    const sp = new URLSearchParams();
    if (initialQuery.trim()) sp.set('q', initialQuery.trim());
    if (isCategoryView && categoryName !== 'All') sp.set('category', categoryName);
    if (subcategory !== 'All') sp.set('subcategory', subcategory);
    if (selectedBrand !== 'All') sp.set('brand', selectedBrand);
    if (minPrice.trim()) sp.set('minPrice', minPrice.trim());
    if (maxPrice.trim()) sp.set('maxPrice', maxPrice.trim());
    if (typeof minRating === 'number') sp.set('minRating', String(minRating));
    if (inStockOnly) sp.set('inStockOnly', 'true');
    if (onSaleOnly) sp.set('onSale', 'true');
    if (flashSaleOnly) sp.set('flashSale', 'true');
    sp.set('sort', sortBy);
    sp.set('page', String(targetPage));
    sp.set('pageSize', String(PAGE_SIZE));
    return sp;
  };

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setIsLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const sp = buildParams(1);
        const res = await fetch(`/api/products?${sp.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('Failed to load catalog');
        const data = (await res.json()) as PaginatedProductsResponse;
        if (!active) return;
        setProducts(data.products);
        setTotal(data.total);
        setPage(data.page);
        setTotalPages(data.totalPages);
        setHasMore(data.hasMore);
        if (data.facets) setFacets(data.facets);
        cacheProducts(data.products);
      } catch {
        // Ignore aborted fetches
      } finally {
        if (active) setIsLoading(false);
      }
    }, 100);

    return () => {
      active = false;
      window.clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    catalogVersion,
    isCategoryView,
    categoryName,
    initialQuery,
    subcategory,
    selectedBrand,
    minPrice,
    maxPrice,
    minRating,
    inStockOnly,
    onSaleOnly,
    flashSaleOnly,
    sortBy,
  ]);

  const handleLoadMore = async () => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(`/api/products?${buildParams(nextPage).toString()}`);
      if (res.ok) {
        const data = (await res.json()) as PaginatedProductsResponse;
        cacheProducts(data.products);
        setProducts((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          return [...prev, ...data.products.filter((p) => !seen.has(p.id))];
        });
        setPage(data.page);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setHasMore(data.hasMore);
      }
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleJumpPage = async (targetPage: number) => {
    if (targetPage < 1 || targetPage > totalPages || isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/products?${buildParams(targetPage).toString()}`);
      if (res.ok) {
        const data = (await res.json()) as PaginatedProductsResponse;
        cacheProducts(data.products);
        setProducts(data.products);
        setPage(data.page);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setHasMore(data.hasMore);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const categoryDef = isCategoryView
    ? CATEGORY_DEFINITIONS.find((c) => c.name.toLowerCase() === categoryName.toLowerCase())
    : null;

  const paginationItems = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const items: Array<number | 'ellipsis'> = [1];
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    if (start > 2) items.push('ellipsis');
    for (let i = start; i <= end; i += 1) items.push(i);
    if (end < totalPages - 1) items.push('ellipsis');
    items.push(totalPages);
    return items;
  }, [page, totalPages]);

  const resetAllFilters = () => {
    setSubcategory('All');
    setSelectedBrand('All');
    setMinPrice('');
    setMaxPrice('');
    setMinRating(undefined);
    setInStockOnly(false);
    setOnSaleOnly(false);
    setFlashSaleOnly(false);
    setSortBy('featured');
    if (activeView.type === 'search' && activeView.query) {
      openSearch('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 lg:py-10">
      {/* Breadcrumb Bar */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-6">
        <button
          type="button"
          onClick={goHome}
          className="inline-flex items-center gap-1 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Marketplace</span>
        </button>
        <span>/</span>
        <span className="text-stone-900 dark:text-stone-100 font-medium">
          {isCategoryView
            ? categoryName
            : flashSaleOnly
              ? 'Flash Deals'
              : initialBrand !== 'All'
                ? `Brand: ${initialBrand}`
                : initialQuery
                  ? `Search: "${initialQuery}"`
                  : 'All Products'}
        </span>
      </nav>

      {/* Category Banner */}
      {isCategoryView && (
        <div className="relative rounded-xl overflow-hidden bg-stone-900 text-white mb-8 min-h-[170px] flex items-end">
          {categoryDef && (
            <ProductImage
              src={categoryDef.image}
              alt={categoryName}
              className="absolute inset-0 w-full h-full object-cover opacity-55"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/25" />
          <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 w-full">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-300 mb-1">
                Category Department · {total.toLocaleString()} Products
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-medium">
                {categoryName}
              </h1>
              {categoryDef && (
                <p className="text-sm text-stone-200 mt-1.5 max-w-2xl">
                  {categoryDef.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search Page Header */}
      {!isCategoryView && (
        <div className="pb-6 mb-6 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400 mb-1">
              Full Marketplace Catalog · {total.toLocaleString()} Matches
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-medium text-stone-900 dark:text-stone-100">
              {flashSaleOnly
                ? 'Flash Sale & Limited Markdowns'
                : initialBrand !== 'All'
                  ? `${initialBrand} Collection`
                  : initialQuery
                    ? `Results for “${initialQuery}”`
                    : 'All Marketplace Products'}
            </h1>
          </div>
        </div>
      )}

      {/* Subcategory Quick Chips (when inside Category Page or Search Results) */}
      {facets.subcategories.length > 0 && (isCategoryView || Boolean(initialQuery.trim())) && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => setSubcategory('All')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
              subcategory === 'All'
                ? 'bg-stone-900 text-stone-50 border-stone-900 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100'
                : 'bg-white dark:bg-[#191816] text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-stone-400'
            }`}
          >
            All Subcategories
          </button>
          {facets.subcategories.slice(0, isCategoryView ? 24 : 12).map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => setSubcategory(sub)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                subcategory === sub
                  ? 'bg-stone-900 text-stone-50 border-stone-900 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100'
                  : 'bg-white dark:bg-[#191816] text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-stone-400'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      {/* Main Content: Left Filter Sidebar + Right Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Facet Sidebar */}
        <aside className="lg:col-span-3 space-y-6 p-5 rounded-xl bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-900 dark:text-stone-100">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </span>
            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Categories Jump (when on global Search page) */}
          {!isCategoryView && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400 mb-2">
                Departments
              </p>
              <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                {CATEGORY_DEFINITIONS.map((cat) => (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => openCategory(cat.name)}
                    className="block w-full text-left px-2 py-1 text-xs text-stone-700 dark:text-stone-300 hover:bg-[#EFECE6] dark:hover:bg-stone-800 rounded cursor-pointer truncate"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Brand Filter */}
          {facets.brands.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400 mb-2">
                Brand
              </p>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                aria-label="Filter by brand"
                className="w-full px-3 py-2 text-xs bg-[#FAF9F6] dark:bg-[#121110] border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100 cursor-pointer"
              >
                <option value="All">All Brands</option>
                {facets.brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Price Range */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400 mb-2">
              Price Range (USD)
            </p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                type="number"
                min={0}
                placeholder="Min $"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-mono-tabular bg-[#FAF9F6] dark:bg-[#121110] border border-stone-300 dark:border-stone-700 rounded-md"
              />
              <input
                type="number"
                min={0}
                placeholder="Max $"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-mono-tabular bg-[#FAF9F6] dark:bg-[#121110] border border-stone-300 dark:border-stone-700 rounded-md"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                ['Under $100', '', '100'],
                ['$100–$500', '100', '500'],
                ['$500+', '500', ''],
              ].map(([label, minV, maxV]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setMinPrice(minV);
                    setMaxPrice(maxV);
                  }}
                  className="px-2 py-1 text-[11px] bg-[#EFECE6] dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700 rounded cursor-pointer"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Rating Filter */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400 mb-2">
              Customer Rating
            </p>
            <div className="space-y-1.5">
              {[
                [undefined, 'All Ratings'],
                [4.8, '4.8 ★ & Up'],
                [4.5, '4.5 ★ & Up'],
                [4.0, '4.0 ★ & Up'],
              ].map(([val, label]) => (
                <button
                  key={String(label)}
                  type="button"
                  onClick={() => setMinRating(val as number | undefined)}
                  className={`block w-full text-left px-2.5 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                    minRating === val
                      ? 'bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 font-medium'
                      : 'text-stone-700 dark:text-stone-300 hover:bg-[#EFECE6] dark:hover:bg-stone-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Availability & Deals Toggles */}
          <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-800">
            <label className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300 cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="accent-[#9A6B42]"
              />
              <span>In Stock Only</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300 cursor-pointer">
              <input
                type="checkbox"
                checked={onSaleOnly}
                onChange={(e) => setOnSaleOnly(e.target.checked)}
                className="accent-[#9A6B42]"
              />
              <span>On Sale / Discounted</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300 cursor-pointer">
              <input
                type="checkbox"
                checked={flashSaleOnly}
                onChange={(e) => setFlashSaleOnly(e.target.checked)}
                className="accent-[#9A6B42]"
              />
              <span>Flash Deals Only</span>
            </label>
          </div>
        </aside>

        {/* Right Product Results Column */}
        <div className="lg:col-span-9">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-stone-200 dark:border-stone-800">
            <div className="text-xs font-mono-tabular text-stone-500 dark:text-stone-400">
              {total === 0
                ? '0 matching products'
                : `Showing ${products.length} of ${total.toLocaleString()} products (Page ${page} of ${totalPages})`}
            </div>

            <div className="flex items-center gap-3">
              {compareIds.length > 0 && (
                <button
                  type="button"
                  disabled={compareIds.length < 2}
                  onClick={() => setIsCompareOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9A6B42] dark:text-[#C89B6E] hover:underline cursor-pointer"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Compare ({compareIds.length}/2)</span>
                </button>
              )}

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as ProductSortOption)}
                aria-label="Sort marketplace products"
                className="px-3 py-2 text-xs font-medium bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md text-stone-800 dark:text-stone-200 cursor-pointer"
              >
                <option value="featured">Sort: Featured</option>
                <option value="popular">Sort: Best Selling</option>
                <option value="rating">Sort: Highest Rated</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">Sort: Newest Arrivals</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#191816] overflow-hidden animate-pulse"
                >
                  <div className="aspect-[4/3] bg-stone-200 dark:bg-stone-800" />
                  <div className="p-4 space-y-2.5">
                    <div className="h-3 w-1/3 bg-stone-200 dark:bg-stone-800 rounded" />
                    <div className="h-4 w-3/4 bg-stone-200 dark:bg-stone-800 rounded" />
                    <div className="h-3 w-full bg-stone-200 dark:bg-stone-800 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#191816]">
              <p className="font-display text-2xl text-stone-900 dark:text-stone-100 mb-2">
                No matching products found
              </p>
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-5 max-w-md mx-auto">
                Adjust your price range, brand filter, or search keywords to explore all 1,500+ products.
              </p>
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-5 py-2.5 text-xs font-medium bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 rounded-md cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {products.map((product, idx) => (
                  <ProductCard key={product.id} product={product} index={idx % PAGE_SIZE} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-10 pt-6 border-t border-stone-200 dark:border-stone-800 flex flex-col items-center gap-5">
                  {hasMore && (
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="inline-flex items-center gap-2 px-7 py-2.5 text-xs font-medium bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 rounded-md cursor-pointer disabled:opacity-60"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Loading More...</span>
                        </>
                      ) : (
                        <span>
                          Load More ({Math.max(0, total - page * PAGE_SIZE)} remaining)
                        </span>
                      )}
                    </button>
                  )}

                  <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => void handleJumpPage(page - 1)}
                      disabled={page <= 1}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-stone-300 dark:border-stone-700 rounded-md disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev</span>
                    </button>

                    {paginationItems.map((item, idx) =>
                      item === 'ellipsis' ? (
                        <span key={`e-${idx}`} className="px-2 text-xs text-stone-400">
                          …
                        </span>
                      ) : (
                        <button
                          key={item}
                          type="button"
                          onClick={() => void handleJumpPage(item)}
                          className={`min-w-[34px] px-2.5 py-1.5 text-xs font-mono-tabular font-medium rounded-md border cursor-pointer ${
                            item === page
                              ? 'bg-stone-900 text-stone-50 border-stone-900 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100'
                              : 'border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-stone-500'
                          }`}
                        >
                          {item}
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      onClick={() => void handleJumpPage(page + 1)}
                      disabled={page >= totalPages}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-stone-300 dark:border-stone-700 rounded-md disabled:opacity-40 cursor-pointer"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
