import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { STORE_POLICIES } from '../data/catalog.ts';
import { useStore } from '../context/StoreContext.tsx';
import { ProductImage } from './ProductImage.tsx';

export function CartDrawer() {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    cartCount,
    subtotal,
    shippingFee,
    taxAmount,
    orderTotal,
    freeShippingRemaining,
    updateCartQuantity,
    removeFromCart,
    setIsCheckoutOpen,
  } = useStore();

  if (!isCartOpen) return null;

  const freeShippingProgress = Math.min(
    100,
    Math.round((subtotal / STORE_POLICIES.freeShippingThreshold) * 100)
  );

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping Bag"
      >
        <div className="flex-1" onClick={() => setIsCartOpen(false)} />

        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md h-full bg-[#FAF9F6] dark:bg-[#141312] border-l border-stone-200 dark:border-stone-800 flex flex-col shadow-2xl"
        >
          {/* Drawer Header */}
          <div className="px-6 py-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-4 h-4 text-stone-900 dark:text-stone-100" />
              <h2 className="font-display text-2xl font-medium text-stone-900 dark:text-stone-100">
                Shopping Bag
              </h2>
              <span className="text-xs font-mono-tabular text-stone-500 dark:text-stone-400">
                ({cartCount})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              aria-label="Close shopping bag"
              className="p-2 rounded-md text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress */}
          {cart.length > 0 && (
            <div className="px-6 py-3.5 bg-[#EFECE6]/70 dark:bg-[#1D1C19] border-b border-stone-200 dark:border-stone-800">
              <p className="text-xs text-stone-700 dark:text-stone-300 mb-2">
                {freeShippingRemaining === 0
                  ? 'Complimentary insured express shipping unlocked.'
                  : `Add $${freeShippingRemaining.toLocaleString()} more for complimentary express shipping.`}
              </p>
              <div className="h-1 w-full bg-stone-300 dark:bg-stone-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#9A6B42] dark:bg-[#C89B6E] transition-all duration-300"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <ShoppingBag className="w-10 h-10 text-stone-300 dark:text-stone-700 mb-3" strokeWidth={1.25} />
                <p className="font-display text-2xl text-stone-900 dark:text-stone-100 mb-1">
                  Your bag is empty
                </p>
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-6 max-w-xs">
                  Explore our curated archive or ask the AI Concierge to find pieces tailored to your needs.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="px-5 py-2.5 text-xs font-medium bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 rounded-md cursor-pointer"
                >
                  Continue Browsing
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={`${item.productId}-${item.selectedColor}-${item.selectedSize}`}
                  className="flex gap-4 pb-5 border-b border-stone-200 dark:border-stone-800 last:border-0"
                >
                  <div className="w-24 aspect-[4/3] rounded-md overflow-hidden bg-[#EFECE6] dark:bg-[#22211E] shrink-0">
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                      title={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                          {item.selectedColor} · {item.selectedSize}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          removeFromCart(item.productId, item.selectedColor, item.selectedSize)
                        }
                        aria-label={`Remove ${item.name}`}
                        className="p-1 text-stone-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="inline-flex items-center border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-[#191816]">
                        <button
                          type="button"
                          onClick={() =>
                            updateCartQuantity(
                              item.productId,
                              item.selectedColor,
                              item.selectedSize,
                              item.quantity - 1
                            )
                          }
                          aria-label="Decrease item quantity"
                          className="p-1.5 text-stone-600 dark:text-stone-300 hover:text-stone-900 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-mono-tabular text-stone-900 dark:text-stone-100">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateCartQuantity(
                              item.productId,
                              item.selectedColor,
                              item.selectedSize,
                              item.quantity + 1
                            )
                          }
                          aria-label="Increase item quantity"
                          className="p-1.5 text-stone-600 dark:text-stone-300 hover:text-stone-900 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-sm font-mono-tabular font-semibold text-stone-900 dark:text-stone-100">
                        ${(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Summary & Checkout CTA */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-[#191816] space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span>Subtotal</span>
                  <span className="font-mono-tabular text-stone-900 dark:text-stone-100">
                    ${subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span>Express Shipping</span>
                  <span className="font-mono-tabular text-stone-900 dark:text-stone-100">
                    {shippingFee === 0 ? 'Complimentary' : `$${shippingFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span>Estimated Tax (8%)</span>
                  <span className="font-mono-tabular text-stone-900 dark:text-stone-100">
                    ${taxAmount.toFixed(2)}
                  </span>
                </div>
                <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex justify-between font-semibold text-stone-900 dark:text-stone-100">
                  <span>Total</span>
                  <span className="font-mono-tabular text-base">
                    ${orderTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsCartOpen(false);
                  setIsCheckoutOpen(true);
                }}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 text-sm font-medium bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 rounded-md transition-colors cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.aside>
      </div>
    </AnimatePresence>
  );
}
