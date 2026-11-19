import { useState } from 'react';
import { Check, Heart, Plus, Scale, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../context/StoreContext.tsx';
import { getDiscountPercentage } from '../lib/searchProducts.ts';
import type { Product } from '../types/store.ts';
import { ProductImage } from './ProductImage.tsx';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const {
    addToCart,
    openProductDetail,
    toggleWishlist,
    isWishlisted,
    toggleCompare,
    isCompared,
  } = useStore();
  const [justAdded, setJustAdded] = useState(false);

  const discount = getDiscountPercentage(product);
  const wishlisted = isWishlisted(product.id);
  const compared = isCompared(product.id);

  const handleQuickAdd = () => {
    addToCart(product);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1400);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.24, delay: Math.min(index * 0.025, 0.14), ease: [0.16, 1, 0.3, 1] }}
      className={`group flex flex-col bg-white dark:bg-[#191816] border rounded-lg overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/50 ${
        compared
          ? 'border-[#9A6B42] dark:border-[#C89B6E]'
          : 'border-stone-200/85 dark:border-stone-800/90'
      }`}
    >
      <div className="relative aspect-[4/3] w-full bg-[#EFECE6] dark:bg-[#22211E] overflow-hidden">
        <button
          type="button"
          onClick={() => openProductDetail(product)}
          aria-label={`View details for ${product.name}`}
          className="block w-full h-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#9A6B42]"
        >
          <ProductImage
            src={product.image}
            alt={product.name}
            title={product.name}
            className="w-full h-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          />
        </button>

        {/* Single subtle unboxed badge */}
        {(!product.inStock || discount) && (
          <span className="absolute top-2.5 left-2.5 text-[11px] font-medium tracking-wide uppercase text-stone-800 dark:text-stone-100 bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm px-2 py-0.5 rounded-sm">
            {!product.inStock
              ? 'Sold Out'
              : product.isFlashSale
                ? `Flash -${discount}%`
                : `-${discount}%`}
          </span>
        )}

        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => toggleCompare(product.id, product)}
            aria-pressed={compared}
            aria-label={compared ? `Remove ${product.name} from comparison` : `Compare ${product.name}`}
            title={compared ? 'Selected for comparison' : 'Compare item'}
            className={`p-1.5 rounded-md backdrop-blur-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A6B42] ${
              compared
                ? 'bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900'
                : 'bg-white/85 dark:bg-stone-900/85 text-stone-700 dark:text-stone-200 hover:text-[#9A6B42] dark:hover:text-[#C89B6E]'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => toggleWishlist(product.id, product)}
            aria-label={
              wishlisted
                ? `Remove ${product.name} from wishlist`
                : `Save ${product.name} to wishlist`
            }
            className="p-1.5 rounded-md bg-white/85 dark:bg-stone-900/85 backdrop-blur-sm text-stone-700 dark:text-stone-200 hover:text-[#9A6B42] dark:hover:text-[#C89B6E] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A6B42]"
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                wishlisted
                  ? 'fill-[#9A6B42] text-[#9A6B42] dark:fill-[#C89B6E] dark:text-[#C89B6E]'
                  : ''
              }`}
            />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between p-4">
        <div>
          <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.1em] text-stone-500 dark:text-stone-400 mb-1">
            <span className="truncate">
              {product.brand} · {product.subcategory}
            </span>
            <span className="inline-flex items-center gap-1 font-mono-tabular text-stone-700 dark:text-stone-300 shrink-0">
              <Star className="w-3 h-3 fill-[#9A6B42] text-[#9A6B42] dark:fill-[#C89B6E] dark:text-[#C89B6E]" />
              {product.rating.toFixed(1)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => openProductDetail(product)}
            className="text-left w-full cursor-pointer focus-visible:outline-none focus-visible:underline"
          >
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 leading-snug line-clamp-2 mb-1.5 group-hover:text-[#9A6B42] dark:group-hover:text-[#C89B6E] transition-colors">
              {product.name}
            </h3>
          </button>

          <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed mb-3">
            {product.shortDescription}
          </p>
        </div>

        <div className="pt-3 border-t border-stone-200/70 dark:border-stone-800 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5 font-mono-tabular">
              <span className="text-[15px] font-semibold text-stone-900 dark:text-stone-100">
                ${product.price.toLocaleString()}
              </span>
              {product.compareAtPrice && (
                <span className="text-xs text-stone-400 dark:text-stone-500 line-through">
                  ${product.compareAtPrice.toLocaleString()}
                </span>
              )}
            </div>
            {typeof product.soldCount === 'number' && product.soldCount > 0 && (
              <p className="text-[11px] text-stone-400 dark:text-stone-500 font-mono-tabular">
                {product.soldCount.toLocaleString()} sold
              </p>
            )}
          </div>

          <motion.button
            type="button"
            whileTap={product.inStock ? { scale: 0.96 } : undefined}
            disabled={!product.inStock}
            onClick={handleQuickAdd}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A6B42] ${
              !product.inStock
                ? 'bg-stone-200 text-stone-500 dark:bg-stone-800 dark:text-stone-500 cursor-not-allowed'
                : justAdded
                  ? 'bg-emerald-700 text-white cursor-pointer'
                  : 'bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 cursor-pointer'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>{product.inStock ? 'Add' : 'Sold Out'}</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
