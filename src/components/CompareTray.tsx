import { ArrowRight, Scale, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../context/StoreContext.tsx';
import { ProductImage } from './ProductImage.tsx';

export function CompareTray() {
  const {
    compareProducts,
    toggleCompare,
    clearCompare,
    setIsCompareOpen,
  } = useStore();

  if (compareProducts.length === 0) return null;

  const canCompare = compareProducts.length === 2;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        role="region"
        aria-label="Product comparison tray"
        className="fixed bottom-20 sm:bottom-5 left-4 sm:left-5 z-40 max-w-[calc(100vw-2rem)] sm:max-w-lg bg-white/95 dark:bg-[#191816]/95 backdrop-blur-md border border-stone-300 dark:border-stone-700 rounded-xl shadow-xl px-3.5 py-2.5 flex flex-wrap items-center gap-3"
      >
        <div className="flex items-center gap-2 text-xs font-medium text-stone-700 dark:text-stone-300">
          <Scale className="w-4 h-4 text-[#9A6B42] dark:text-[#C89B6E] shrink-0" />
          <span className="font-mono-tabular whitespace-nowrap">
            {compareProducts.length}/2
          </span>
        </div>

        <div className="flex items-center gap-2">
          {compareProducts.map((product) => (
            <div
              key={product.id}
              className="inline-flex items-center gap-2 pr-1.5 pl-1 py-1 rounded-md bg-[#FAF9F6] dark:bg-[#111110] border border-stone-200 dark:border-stone-800 max-w-[140px]"
            >
              <div className="w-7 h-5 rounded-sm overflow-hidden bg-stone-200 dark:bg-stone-800 shrink-0">
                <ProductImage
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[11px] font-medium text-stone-800 dark:text-stone-200 truncate">
                {product.name}
              </span>
              <button
                type="button"
                onClick={() => toggleCompare(product.id)}
                aria-label={`Remove ${product.name} from comparison`}
                className="text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            disabled={!canCompare}
            onClick={() => setIsCompareOpen(true)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              canCompare
                ? 'bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 cursor-pointer'
                : 'bg-stone-200 text-stone-500 dark:bg-stone-800 dark:text-stone-400 cursor-not-allowed'
            }`}
          >
            <span>{canCompare ? 'Compare' : 'Pick 1 more'}</span>
            {canCompare && <ArrowRight className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={clearCompare}
            aria-label="Clear comparison selection"
            className="text-[11px] text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 px-1.5 py-1 cursor-pointer"
          >
            Clear
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
