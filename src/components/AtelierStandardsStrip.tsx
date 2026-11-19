import { RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { ProductImage } from './ProductImage.tsx';

export function AtelierStandardsStrip() {
  const { recentlyViewedProducts, openProductDetail, setActivePolicy } = useStore();

  return (
    <section className="border-t border-stone-200 dark:border-stone-800 bg-[#F5F2EC]/60 dark:bg-[#151412]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 space-y-14">
        {/* Craftsmanship & Service Standards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <Truck className="w-5 h-5 text-[#9A6B42] dark:text-[#C89B6E]" strokeWidth={1.6} />
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
              Complimentary Express Delivery
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              Insured 1–3 business day courier shipping on all orders over $150 in plastic-free FSC-certified packaging.
            </p>
            <button
              type="button"
              onClick={() => setActivePolicy('shipping')}
              className="text-xs font-medium text-stone-900 dark:text-stone-100 underline underline-offset-4 hover:text-[#9A6B42] cursor-pointer"
            >
              Read shipping terms
            </button>
          </div>

          <div className="space-y-2">
            <RotateCcw className="w-5 h-5 text-[#9A6B42] dark:text-[#C89B6E]" strokeWidth={1.6} />
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
              30-Day Atelier Returns
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              Effortless size exchanges and full refunds within 30 days of delivery, processed within 48 hours.
            </p>
            <button
              type="button"
              onClick={() => setActivePolicy('returns')}
              className="text-xs font-medium text-stone-900 dark:text-stone-100 underline underline-offset-4 hover:text-[#9A6B42] cursor-pointer"
            >
              View return policy
            </button>
          </div>

          <div className="space-y-2">
            <ShieldCheck className="w-5 h-5 text-[#9A6B42] dark:text-[#C89B6E]" strokeWidth={1.6} />
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
              2-Year Hardware &amp; Craft Warranty
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              Every laptop, smartphone, timepiece, and Italian leather piece is backed by direct atelier servicing.
            </p>
            <button
              type="button"
              onClick={() => setActivePolicy('about')}
              className="text-xs font-medium text-stone-900 dark:text-stone-100 underline underline-offset-4 hover:text-[#9A6B42] cursor-pointer"
            >
              Our craftsmanship
            </button>
          </div>
        </div>

        {/* Recently Viewed Shelf (Rendered only when user has inspected items) */}
        {recentlyViewedProducts.length > 0 && (
          <div className="pt-10 border-t border-stone-200 dark:border-stone-800">
            <div className="flex items-baseline justify-between mb-5">
              <h3 className="font-display text-2xl font-medium text-stone-900 dark:text-stone-100">
                Recently Viewed
              </h3>
              <span className="text-xs font-mono-tabular text-stone-500 dark:text-stone-400">
                {recentlyViewedProducts.length} saved in session
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {recentlyViewedProducts.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openProductDetail(item)}
                  className="group text-left bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 rounded-lg overflow-hidden hover:border-stone-400 dark:hover:border-stone-600 transition-colors cursor-pointer"
                >
                  <div className="aspect-[4/3] bg-[#EFECE6] dark:bg-[#22211E] overflow-hidden">
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
                    />
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-medium text-stone-900 dark:text-stone-100 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs font-mono-tabular text-stone-500 dark:text-stone-400 mt-0.5">
                      ${item.price.toLocaleString()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
