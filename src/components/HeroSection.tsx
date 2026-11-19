import { ArrowRight, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { HERO_BANNER_IMAGE } from '../data/catalog.ts';
import { useStore } from '../context/StoreContext.tsx';
import { ProductImage } from './ProductImage.tsx';

interface HeroSectionProps {
  totalProducts?: number;
  totalCategories?: number;
}

export function HeroSection({
  totalProducts = 1500,
  totalCategories = 20,
}: HeroSectionProps) {
  const { setIsChatOpen, openSearch, storefrontConfig } = useStore();
  const hero = storefrontConfig?.cms.homepage;
  const aiEnabled = storefrontConfig?.ai.enabled ?? true;

  const eyebrow = hero?.heroEyebrow || 'Global Flagship Marketplace';
  const title =
    hero?.heroTitle ||
    'Every essential, flagship device, and wardrobe icon in one curated marketplace.';
  const subtitle =
    hero?.heroSubtitle ||
    'Explore smartphones, gaming laptops, Air Max footwear, home appliances, horology, and architectural fashion—backed by instant FTS search and our AI Shopping Concierge.';
  const heroImage = hero?.heroImage || HERO_BANNER_IMAGE;
  const primaryLabel = hero?.primaryCtaLabel || 'Shop Flash Deals';
  const secondaryLabel = hero?.secondaryCtaLabel || 'Ask AI Concierge';

  return (
    <section
      id="top"
      className="relative overflow-hidden border-b border-stone-200 dark:border-stone-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 lg:py-8">
        <div className="relative rounded-xl overflow-hidden bg-stone-900 min-h-[380px] lg:min-h-[440px] flex items-end">
          <ProductImage
            src={heroImage}
            alt="Marketplace flagship showcase"
            title={storefrontConfig?.cms.settings.websiteName || 'MAISON KOVA Marketplace'}
            priority
            className="absolute inset-0 w-full h-full object-cover object-center"
          />

          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20"
          />

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full p-6 sm:p-10 lg:p-12 max-w-3xl"
          >
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-300 mb-2.5">
              {eyebrow} · {totalProducts.toLocaleString()}+ Verified Products · {totalCategories} Categories
            </p>
            <h1 className="font-display text-3xl sm:text-5xl font-medium tracking-tight text-white leading-[1.06] text-balance mb-3.5">
              {title}
            </h1>
            <p className="text-sm sm:text-base text-stone-200 leading-relaxed max-w-xl mb-6">
              {subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => openSearch('', { flashSaleOnly: true, sortBy: 'popular' })}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-stone-50 text-stone-900 hover:bg-white rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>{primaryLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {aiEnabled && (
                <button
                  type="button"
                  onClick={() => setIsChatOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-stone-100 hover:text-white border border-white/30 hover:border-white/60 bg-black/25 backdrop-blur-sm rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{secondaryLabel}</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
