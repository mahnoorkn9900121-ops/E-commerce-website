import { useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  Plus,
  Scale,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../context/StoreContext.tsx';
import { getDiscountPercentage } from '../lib/searchProducts.ts';
import { ProductImage } from './ProductImage.tsx';

export function CompareModal() {
  const {
    compareProducts,
    isCompareOpen,
    setIsCompareOpen,
    toggleCompare,
    clearCompare,
    addToCart,
    openProductDetail,
    setIsChatOpen,
  } = useStore();

  useEffect(() => {
    if (!isCompareOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsCompareOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isCompareOpen, setIsCompareOpen]);

  if (!isCompareOpen || compareProducts.length < 2) return null;

  const [left, right] = compareProducts;
  const allSpecKeys = Array.from(
    new Set([...Object.keys(left.specs), ...Object.keys(right.specs)])
  );

  const leftDiscount = getDiscountPercentage(left);
  const rightDiscount = getDiscountPercentage(right);

  const lowerPriceId =
    left.price !== right.price ? (left.price < right.price ? left.id : right.id) : null;
  const higherRatingId =
    left.rating !== right.rating ? (left.rating > right.rating ? left.id : right.id) : null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-xs"
        role="dialog"
        aria-modal="true"
        aria-label="Side-by-Side Product Comparison"
      >
        <div className="absolute inset-0" onClick={() => setIsCompareOpen(false)} />

        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-5xl max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto bg-[#FAF9F6] dark:bg-[#141312] sm:rounded-xl border border-stone-200 dark:border-stone-800 shadow-2xl"
        >
          {/* Sticky Header */}
          <div className="sticky top-0 z-20 flex items-center justify-between gap-4 px-6 py-4 bg-[#FAF9F6]/95 dark:bg-[#141312]/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-2.5 text-stone-900 dark:text-stone-100">
              <Scale className="w-4 h-4 text-[#9A6B42] dark:text-[#C89B6E]" />
              <h2 className="font-display text-2xl font-medium">
                Side-by-Side Comparison
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearCompare}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 rounded-md hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCompareOpen(false)}
                aria-label="Close comparison modal"
                className="p-2 rounded-md text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* Two-Product Top Showcase Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { product: left, discount: leftDiscount },
                { product: right, discount: rightDiscount },
              ].map(({ product, discount }) => (
                <div
                  key={product.id}
                  className="p-5 rounded-lg bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
                        {product.brand} · {product.category}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          toggleCompare(product.id);
                          setIsCompareOpen(false);
                        }}
                        className="text-xs text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsCompareOpen(false);
                        openProductDetail(product);
                      }}
                      className="block w-full aspect-[4/3] rounded-md overflow-hidden bg-[#EFECE6] dark:bg-[#22211E] mb-4 cursor-pointer"
                    >
                      <ProductImage
                        src={product.image}
                        alt={product.name}
                        title={product.name}
                        className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-200"
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsCompareOpen(false);
                        openProductDetail(product);
                      }}
                      className="text-left cursor-pointer hover:text-[#9A6B42] dark:hover:text-[#C89B6E] transition-colors"
                    >
                      <h3 className="font-display text-2xl font-medium text-stone-900 dark:text-stone-100">
                        {product.name}
                      </h3>
                    </button>

                    <p className="text-xs text-stone-600 dark:text-stone-400 mt-1.5 leading-relaxed">
                      {product.shortDescription}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3">
                    <div className="font-mono-tabular">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                          ${product.price.toLocaleString()}
                        </span>
                        {product.compareAtPrice && (
                          <span className="text-xs text-stone-400 line-through">
                            ${product.compareAtPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                      {discount && (
                        <span className="text-[11px] font-medium text-[#9A6B42] dark:text-[#C89B6E]">
                          Save {discount}%
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={!product.inStock}
                      onClick={() => addToCart(product)}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        product.inStock
                          ? 'bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200'
                          : 'bg-stone-200 text-stone-500 dark:bg-stone-800 cursor-not-allowed'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{product.inStock ? 'Add to Bag' : 'Out of Stock'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Unified Comparison Matrix */}
            <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#191816] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-4">
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-900 dark:text-stone-100">
                  Overview &amp; Specifications
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsCompareOpen(false);
                    setIsChatOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9A6B42] dark:text-[#C89B6E] hover:underline cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Ask AI Concierge</span>
                </button>
              </div>

              <div className="divide-y divide-stone-200 dark:divide-stone-800 text-sm">
                {/* Price Row */}
                <div className="grid grid-cols-3 gap-4 px-5 py-3.5 items-center">
                  <div className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Price
                  </div>
                  {[left, right].map((p) => (
                    <div key={p.id} className="font-mono-tabular text-stone-900 dark:text-stone-100">
                      <span className="font-semibold">${p.price.toLocaleString()}</span>
                      {lowerPriceId === p.id && (
                        <span className="ml-2 text-[11px] font-sans font-medium text-emerald-700 dark:text-emerald-400">
                          Lower Price
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Rating Row */}
                <div className="grid grid-cols-3 gap-4 px-5 py-3.5 items-center">
                  <div className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Client Rating
                  </div>
                  {[left, right].map((p) => (
                    <div key={p.id} className="flex items-center gap-1.5 font-mono-tabular text-stone-900 dark:text-stone-100">
                      <Star className="w-3.5 h-3.5 fill-[#9A6B42] text-[#9A6B42] dark:fill-[#C89B6E] dark:text-[#C89B6E]" />
                      <span className="font-semibold">{p.rating.toFixed(1)}</span>
                      <span className="text-xs text-stone-500 dark:text-stone-400">
                        ({p.reviewCount})
                      </span>
                      {higherRatingId === p.id && (
                        <span className="ml-1 text-[11px] font-sans font-medium text-[#9A6B42] dark:text-[#C89B6E]">
                          Top Rated
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Availability Row */}
                <div className="grid grid-cols-3 gap-4 px-5 py-3.5 items-center">
                  <div className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Availability
                  </div>
                  {[left, right].map((p) => (
                    <div key={p.id} className="flex items-center gap-1.5 text-xs font-medium">
                      {p.inStock ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                          <span className="text-emerald-800 dark:text-emerald-300">
                            In Stock ({p.stockCount})
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                          <span className="text-amber-800 dark:text-amber-300">Out of Stock</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Colors Row */}
                <div className="grid grid-cols-3 gap-4 px-5 py-3.5 items-start">
                  <div className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Finishes
                  </div>
                  {[left, right].map((p) => (
                    <div key={p.id} className="flex flex-wrap gap-2 text-xs text-stone-700 dark:text-stone-300">
                      {p.colors.map((c) => (
                        <span key={c.name} className="inline-flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/20"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span>{c.name}</span>
                        </span>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Sizes Row */}
                <div className="grid grid-cols-3 gap-4 px-5 py-3.5 items-start">
                  <div className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Sizes / Editions
                  </div>
                  {[left, right].map((p) => (
                    <div key={p.id} className="text-xs text-stone-700 dark:text-stone-300">
                      {p.sizes.join(' · ')}
                    </div>
                  ))}
                </div>

                {/* Technical Specs Matrix */}
                {allSpecKeys.map((specKey) => (
                  <div key={specKey} className="grid grid-cols-3 gap-4 px-5 py-3.5 items-start">
                    <div className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
                      {specKey}
                    </div>
                    <div className="text-xs sm:text-sm text-stone-800 dark:text-stone-200">
                      {left.specs[specKey] || '—'}
                    </div>
                    <div className="text-xs sm:text-sm text-stone-800 dark:text-stone-200">
                      {right.specs[specKey] || '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
