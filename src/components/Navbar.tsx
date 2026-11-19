import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  Heart,
  LayoutGrid,
  Menu,
  Moon,
  Search,
  Settings,
  ShoppingBag,
  Sun,
  Tag,
  TrendingUp,
  User,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { CATEGORY_DEFINITIONS } from '../data/catalog.ts';
import type { SearchSuggestionPayload } from '../types/store.ts';
import { ProductImage } from './ProductImage.tsx';

export function Navbar() {
  const {
    theme,
    toggleTheme,
    activeView,
    goHome,
    openCategory,
    openSearch,
    openAdmin,
    catalogVersion,
    openProductDetail,
    cartCount,
    wishlistIds,
    setIsCartOpen,
    setIsWishlistOpen,
    setIsAccountOpen,
    setActivePolicy,
    storefrontConfig,
  } = useStore();

  const cms = storefrontConfig?.cms;
  const visibleCategories =
    storefrontConfig?.categories && storefrontConfig.categories.length > 0
      ? storefrontConfig.categories
      : CATEGORY_DEFINITIONS.map((c) => ({ ...c, productCount: 0, subcategories: [] }));
  const brandName = cms?.settings.logoText || cms?.settings.websiteName || 'MAISON KOVA';
  const brandLogoUrl = cms?.settings.logoUrl || '';
  const navItems = (cms?.navigation || [
    { id: 'nav-home', label: 'Marketplace', actionType: 'home' as const, visible: true },
    { id: 'nav-cats', label: 'Categories', actionType: 'categories' as const, visible: true },
    { id: 'nav-flash', label: 'Flash Deals', actionType: 'flashDeals' as const, visible: true },
    { id: 'nav-all', label: 'All Products', actionType: 'allProducts' as const, visible: true },
    { id: 'nav-admin', label: 'Admin', actionType: 'admin' as const, visible: true },
  ]).filter((item) => item.visible);

  const [query, setQuery] = useState(
    activeView.type === 'search' ? activeView.query : ''
  );
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [trendingBaseline, setTrendingBaseline] = useState<SearchSuggestionPayload | null>(null);
  const [suggestions, setSuggestions] = useState<SearchSuggestionPayload | null>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeView.type === 'search') {
      setQuery(activeView.query);
    }
  }, [activeView]);

  // Preload live Trending Searches & Popular Categories from current product catalog
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/products/suggest?q=', { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: SearchSuggestionPayload | null) => {
        if (data) {
          setTrendingBaseline(data);
          setSuggestions((prev) => prev ?? data);
        }
      })
      .catch(() => {
        // Ignore aborted fetches
      });
    return () => controller.abort();
  }, [catalogVersion]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSuggestOpen(false);
      }
      if (
        categoryMenuRef.current &&
        !categoryMenuRef.current.contains(e.target as Node)
      ) {
        setIsCategoriesOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSuggestOpen(false);
        setIsCategoriesOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!isSuggestOpen) return;
    const trimmed = query.trim();
    if (!trimmed && trendingBaseline) {
      setSuggestions(trendingBaseline);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/products/suggest?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = (await res.json()) as SearchSuggestionPayload;
          setSuggestions(data);
          if (!trimmed) setTrendingBaseline(data);
        }
      } catch {
        // Ignore aborted fetches
      }
    }, 100);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, isSuggestOpen, trendingBaseline]);

  const handleSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuggestOpen(false);
    openSearch(query.trim());
  };

  const handleSelectSuggestion = (text: string) => {
    setQuery(text);
    setIsSuggestOpen(false);
    openSearch(text);
  };

  const activeDropdownData = query.trim() ? suggestions : trendingBaseline ?? suggestions;

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 dark:bg-[#111110]/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors duration-200">
      {cms?.homepage.promoBannerActive && cms.homepage.promoBannerText && (
        <div className="bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 text-[11px] font-medium tracking-wide text-center py-1.5 px-4">
          {cms.homepage.promoBannerText}
        </div>
      )}

      {/* Row 1: Clean 3-Zone Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-14 flex items-center justify-between gap-4">
        {/* Zone 1: Wordmark / Custom Logo */}
        <a
          href="#/"
          onClick={(e) => {
            e.preventDefault();
            goHome();
          }}
          className="inline-flex items-center gap-2 font-display text-xl sm:text-2xl font-semibold tracking-[0.06em] text-stone-900 dark:text-stone-100 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A6B42] rounded-sm"
        >
          {brandLogoUrl && (
            <img src={brandLogoUrl} alt={brandName} className="w-6 h-6 object-contain rounded-sm" />
          )}
          <span>{brandName}</span>
        </a>

        {/* Zone 2: Single-Line Marketplace Nav Links (CMS Managed) */}
        <nav
          aria-label="Marketplace navigation"
          className="hidden lg:flex items-center gap-6 text-xs font-medium uppercase tracking-[0.1em]"
        >
          {navItems.map((item) => {
            if (item.actionType === 'categories') {
              return (
                <div key={item.id} ref={categoryMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCategoriesOpen((v) => !v)}
                    aria-expanded={isCategoriesOpen}
                    className={`inline-flex items-center gap-1 py-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                      activeView.type === 'category'
                        ? 'text-stone-900 dark:text-stone-100 underline underline-offset-4 decoration-[#9A6B42]'
                        : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {isCategoriesOpen && (
                    <div className="absolute left-0 top-full mt-2 w-[680px] p-4 rounded-xl bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 shadow-2xl grid grid-cols-3 gap-1.5 z-50">
                      {visibleCategories.map((cat) => (
                        <button
                          key={cat.slug}
                          type="button"
                          onClick={() => {
                            setIsCategoriesOpen(false);
                            openCategory(cat.name);
                          }}
                          className="flex items-center gap-2.5 p-2 rounded-md text-left hover:bg-[#EFECE6] dark:hover:bg-stone-800 transition-colors cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded overflow-hidden bg-stone-100 dark:bg-stone-800 shrink-0">
                            <ProductImage
                              src={cat.image}
                              alt={cat.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-xs font-medium normal-case tracking-normal text-stone-800 dark:text-stone-200 truncate">
                            {cat.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            if (item.actionType === 'home') {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={goHome}
                  className={`py-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    activeView.type === 'home'
                      ? 'text-stone-900 dark:text-stone-100 underline underline-offset-4 decoration-[#9A6B42]'
                      : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
                  }`}
                >
                  {item.label}
                </button>
              );
            }

            if (item.actionType === 'flashDeals') {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openSearch('', { flashSaleOnly: true, sortBy: 'popular' })}
                  className="inline-flex items-center gap-1 py-1 whitespace-nowrap shrink-0 cursor-pointer text-stone-500 hover:text-[#9A6B42] dark:text-stone-400 dark:hover:text-[#C89B6E] transition-colors"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            }

            if (item.actionType === 'admin') {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={openAdmin}
                  className={`inline-flex items-center gap-1 py-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    activeView.type === 'admin'
                      ? 'text-stone-900 dark:text-stone-100 underline underline-offset-4 decoration-[#9A6B42]'
                      : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.actionType === 'category' && item.targetValue) {
                    openCategory(item.targetValue);
                  } else if (item.actionType === 'policy' && item.targetValue) {
                    setActivePolicy(item.targetValue as 'about' | 'contact' | 'shipping' | 'returns' | 'privacy' | 'terms');
                  } else if (item.actionType === 'search') {
                    openSearch(item.targetValue || '');
                  } else {
                    openSearch('', { sortBy: 'featured' });
                  }
                }}
                className="py-1 whitespace-nowrap shrink-0 cursor-pointer text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors"
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Utility Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="p-2 text-stone-700 hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-100 rounded-md hover:bg-stone-200/60 dark:hover:bg-stone-800/70 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setIsWishlistOpen(true)}
            aria-label={`Open wishlist (${wishlistIds.length} items)`}
            className="relative p-2 text-stone-700 hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-100 rounded-md hover:bg-stone-200/60 dark:hover:bg-stone-800/70 transition-colors cursor-pointer"
          >
            <Heart className="w-4 h-4" />
            {wishlistIds.length > 0 && (
              <span className="absolute top-1 right-1 text-[10px] font-mono-tabular font-semibold leading-none text-[#9A6B42] dark:text-[#C89B6E]">
                {wishlistIds.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsAccountOpen(true)}
            aria-label="Open customer account"
            className="hidden sm:inline-flex p-2 text-stone-700 hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-100 rounded-md hover:bg-stone-200/60 dark:hover:bg-stone-800/70 transition-colors cursor-pointer"
          >
            <User className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            aria-label={`Open shopping bag (${cartCount} items)`}
            className="inline-flex items-center gap-1.5 ml-1 px-3.5 py-1.5 text-xs font-medium tracking-wide bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Bag</span>
            <span className="font-mono-tabular">({cartCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
            className="lg:hidden p-2 text-stone-700 hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-100 rounded-md hover:bg-stone-200/60 dark:hover:bg-stone-800/70 transition-colors cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Row 2: Global Marketplace Search Bar with Instant Autocomplete */}
      <div className="border-t border-stone-200/70 dark:border-stone-800/80 bg-[#F4F1EA]/85 dark:bg-[#151413]/90">
        <div
          ref={searchContainerRef}
          className="relative max-w-7xl mx-auto px-4 sm:px-8 py-2 flex items-center gap-3"
        >
          <form onSubmit={handleSubmitSearch} className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
            <input
              type="search"
              value={query}
              onFocus={() => setIsSuggestOpen(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsSuggestOpen(true);
              }}
              placeholder="Search 1,500+ products: Perfume, iPhone 17, Samsung, Nike shoes, Laptop, Smartwatch, Makeup..."
              aria-label="Global marketplace search"
              className="w-full pl-10 pr-24 py-2 text-sm bg-white dark:bg-[#1B1A18] border border-stone-300/90 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#9A6B42]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search query"
                className="absolute right-20 p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1.5 px-3 py-1 text-xs font-medium bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 rounded transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Live Trending Searches & Autocomplete Dropdown (opens immediately on focus) */}
          {isSuggestOpen && activeDropdownData && (
            <div
              role="region"
              aria-label={query.trim() ? 'Search suggestions' : 'Trending searches'}
              className="absolute left-4 right-4 sm:left-8 sm:right-8 top-full mt-1 bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl overflow-hidden z-50 max-h-[75vh] overflow-y-auto"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-stone-200 dark:divide-stone-800">
                {/* Left: Trending Searches, Popular Keywords, Categories & Brands */}
                <div className="md:col-span-5 p-4 space-y-4">
                  {activeDropdownData.queries.length > 0 && (
                    <div>
                      <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9A6B42] dark:text-[#C89B6E] mb-2">
                        {query.trim() ? (
                          <Search className="w-3 h-3" />
                        ) : (
                          <TrendingUp className="w-3 h-3" />
                        )}
                        <span>{query.trim() ? 'Suggested Searches' : 'Trending Searches'}</span>
                      </p>
                      <div className="space-y-1">
                        {activeDropdownData.queries.map((qText) => (
                          <button
                            key={qText}
                            type="button"
                            onClick={() => handleSelectSuggestion(qText)}
                            className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs text-left text-stone-800 dark:text-stone-200 hover:bg-[#EFECE6] dark:hover:bg-stone-800 rounded-md cursor-pointer"
                          >
                            {query.trim() ? (
                              <Search className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            ) : (
                              <TrendingUp className="w-3.5 h-3.5 text-[#9A6B42] dark:text-[#C89B6E] shrink-0" />
                            )}
                            <span className="truncate">{qText}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {!query.trim() &&
                    activeDropdownData.popularKeywords &&
                    activeDropdownData.popularKeywords.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400 mb-2">
                          Popular Keywords
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {activeDropdownData.popularKeywords.map((kw) => (
                            <button
                              key={kw}
                              type="button"
                              onClick={() => handleSelectSuggestion(kw)}
                              className="px-2.5 py-1 text-xs font-medium bg-[#FAF9F6] dark:bg-[#121110] border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-[#9A6B42] dark:hover:border-[#C89B6E] rounded-md transition-colors cursor-pointer"
                            >
                              {kw}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  {activeDropdownData.categories.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400 mb-2">
                        {query.trim() ? 'Matching Categories' : 'Popular Categories'}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {activeDropdownData.categories.map((c) => (
                          <button
                            key={c.slug}
                            type="button"
                            onClick={() => {
                              setIsSuggestOpen(false);
                              openCategory(c.name);
                            }}
                            className="px-2.5 py-1 text-xs font-medium bg-[#EFECE6] dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-300 dark:hover:bg-stone-700 rounded-md cursor-pointer"
                          >
                            {c.name} ({c.productCount})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeDropdownData.brands.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400 mb-2">
                        Top Brands
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {activeDropdownData.brands.map((b) => (
                          <button
                            key={b.name}
                            type="button"
                            onClick={() => {
                              setIsSuggestOpen(false);
                              openSearch('', { brand: b.name });
                            }}
                            className="px-2.5 py-1 text-xs font-medium border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-stone-500 rounded-md cursor-pointer"
                          >
                            {b.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Trending or Matching Product Previews */}
                <div className="md:col-span-7 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                      {query.trim() ? 'Matching Products' : 'Trending in Catalog'}
                    </p>
                    {query.trim() && (
                      <button
                        type="button"
                        onClick={() => handleSelectSuggestion(query)}
                        className="text-xs font-medium text-[#9A6B42] dark:text-[#C89B6E] hover:underline cursor-pointer"
                      >
                        View all results →
                      </button>
                    )}
                  </div>

                  {activeDropdownData.products.length === 0 ? (
                    <p className="py-6 text-xs text-stone-500 dark:text-stone-400">
                      No direct matches yet—press Search or ask our AI Shopping Assistant.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {activeDropdownData.products.map((prod) => (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => {
                            setIsSuggestOpen(false);
                            openProductDetail(prod);
                          }}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#EFECE6] dark:hover:bg-stone-800 text-left transition-colors cursor-pointer"
                        >
                          <div className="w-14 aspect-[4/3] rounded overflow-hidden bg-stone-100 dark:bg-stone-800 shrink-0">
                            <ProductImage
                              src={prod.image}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
                              {prod.name}
                            </p>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                              {prod.brand} · {prod.category}
                            </p>
                            <p className="text-xs font-mono-tabular font-semibold text-stone-900 dark:text-stone-100 mt-0.5">
                              ${prod.price.toLocaleString()}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200 dark:border-stone-800 bg-[#FAF9F6] dark:bg-[#111110] px-5 py-4 space-y-2 max-h-[75vh] overflow-y-auto">
          <div className="flex flex-wrap gap-2 pb-3 border-b border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                goHome();
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 cursor-pointer"
            >
              Marketplace Home
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                openSearch('', { flashSaleOnly: true });
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-stone-300 dark:border-stone-700 cursor-pointer"
            >
              Flash Deals
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                openAdmin();
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-stone-300 dark:border-stone-700 cursor-pointer"
            >
              Admin Dashboard
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsAccountOpen(true);
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-stone-300 dark:border-stone-700 cursor-pointer"
            >
              Account &amp; Orders
            </button>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500 pt-2">
            All {visibleCategories.length} Categories
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {visibleCategories.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openCategory(cat.name);
                }}
                className="text-left py-2 px-2.5 text-xs font-medium rounded-md bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 truncate cursor-pointer"
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
