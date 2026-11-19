import { Heart, Plus, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../context/StoreContext.tsx';
import { ProductImage } from './ProductImage.tsx';

export function WishlistDrawer() {
  const {
    isWishlistOpen,
    setIsWishlistOpen,
    wishlistProducts,
    toggleWishlist,
    addToCart,
    openProductDetail,
  } = useStore();

  if (!isWishlistOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs"
        role="dialog"
        aria-modal="true"
        aria-label="Wishlist"
      >
        <div className="flex-1" onClick={() => setIsWishlistOpen(false)} />

        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md h-full bg-[#FAF9F6] dark:bg-[#141312] border-l border-stone-200 dark:border-stone-800 flex flex-col shadow-2xl"
        >
          <div className="px-6 py-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Heart className="w-4 h-4 text-[#9A6B42] dark:text-[#C89B6E]" />
              <h2 className="font-display text-2xl font-medium text-stone-900 dark:text-stone-100">
                Saved Wishlist
              </h2>
              <span className="text-xs font-mono-tabular text-stone-500 dark:text-stone-400">
                ({wishlistProducts.length})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsWishlistOpen(false)}
              aria-label="Close wishlist"
              className="p-2 rounded-md text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {wishlistProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <Heart className="w-10 h-10 text-stone-300 dark:text-stone-700 mb-3" strokeWidth={1.25} />
                <p className="font-display text-2xl text-stone-900 dark:text-stone-100 mb-1">
                  No saved items yet
                </p>
                <p className="text-sm text-stone-500 dark:text-stone-400 max-w-xs">
                  Select the heart icon on any product to bookmark pieces for later comparison.
                </p>
              </div>
            ) : (
              wishlistProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex gap-4 pb-5 border-b border-stone-200 dark:border-stone-800 last:border-0"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsWishlistOpen(false);
                      openProductDetail(product);
                    }}
                    className="w-24 aspect-[4/3] rounded-md overflow-hidden bg-[#EFECE6] dark:bg-[#22211E] shrink-0 cursor-pointer"
                  >
                    <ProductImage
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </button>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsWishlistOpen(false);
                          openProductDetail(product);
                        }}
                        className="text-left min-w-0 cursor-pointer"
                      >
                        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                          {product.name}
                        </p>
                        <p className="text-xs font-mono-tabular text-stone-600 dark:text-stone-400 mt-0.5">
                          ${product.price.toLocaleString()} · {product.inStock ? 'In Stock' : 'Out of Stock'}
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleWishlist(product.id)}
                        aria-label={`Remove ${product.name} from wishlist`}
                        className="p-1 text-stone-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-3">
                      <button
                        type="button"
                        disabled={!product.inStock}
                        onClick={() => addToCart(product)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          product.inStock
                            ? 'bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 cursor-pointer'
                            : 'bg-stone-200 text-stone-500 dark:bg-stone-800 cursor-not-allowed'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{product.inStock ? 'Move to Bag' : 'Out of Stock'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.aside>
      </div>
    </AnimatePresence>
  );
}
