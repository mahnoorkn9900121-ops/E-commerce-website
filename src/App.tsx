import { AnimatePresence, motion } from 'motion/react';
import { StoreProvider, useStore } from './context/StoreContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { MarketplaceHome } from './components/MarketplaceHome.tsx';
import { MarketplaceBrowsePage } from './components/MarketplaceBrowsePage.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { AtelierStandardsStrip } from './components/AtelierStandardsStrip.tsx';
import { Footer } from './components/Footer.tsx';
import { ProductDetailModal } from './components/ProductDetailModal.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { WishlistDrawer } from './components/WishlistDrawer.tsx';
import { CheckoutModal } from './components/CheckoutModal.tsx';
import { AccountModal } from './components/AccountModal.tsx';
import { PolicyModal } from './components/PolicyModal.tsx';
import { CompareModal } from './components/CompareModal.tsx';
import { CompareTray } from './components/CompareTray.tsx';
import { AIChatWidget } from './components/AIChatWidget.tsx';

function StorefrontShell() {
  const { activeView, toast, storefrontConfig, openAdmin } = useStore();
  const isMaintenance =
    activeView.type !== 'admin' && Boolean(storefrontConfig?.cms.settings.maintenanceMode);

  if (activeView.type === 'admin') {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-stone-900 dark:bg-[#111110] dark:text-stone-100 transition-colors duration-200">
        <AdminDashboard />

        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.18 }}
              role="status"
              aria-live="polite"
              className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-md bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 text-xs font-medium shadow-lg pointer-events-none whitespace-nowrap"
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (isMaintenance && storefrontConfig) {
    const { settings, contact } = storefrontConfig.cms;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-[#FAF9F6] text-stone-900 dark:bg-[#111110] dark:text-stone-100 text-center">
        <div className="max-w-lg w-full p-8 sm:p-10 rounded-xl bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 space-y-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9A6B42] dark:text-[#C89B6E]">
            Scheduled Storefront Maintenance
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-medium">
            {settings.websiteName}
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
            {settings.maintenanceMessage ||
              'Our storefront is undergoing scheduled updates. We will reopen shortly.'}
          </p>
          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 text-xs text-stone-500 dark:text-stone-400 space-y-1">
            <p>{contact.email}</p>
            <p className="font-mono-tabular">{contact.phone}</p>
          </div>
          <button
            type="button"
            onClick={openAdmin}
            className="mt-2 inline-flex items-center justify-center px-4 py-2 text-xs font-medium border border-stone-300 dark:border-stone-700 rounded-md hover:border-stone-500 transition-colors cursor-pointer"
          >
            Administrator Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-stone-900 dark:bg-[#111110] dark:text-stone-100 transition-colors duration-200">
      <Navbar />

      <main className="flex-1">
        {activeView.type === 'home' && <MarketplaceHome />}
        {(activeView.type === 'category' || activeView.type === 'search') && (
          <MarketplaceBrowsePage />
        )}
        <AtelierStandardsStrip />
      </main>

      <Footer />

      {/* Storefront Modals, Drawers & Intelligent AI Concierge */}
      <ProductDetailModal />
      <CartDrawer />
      <WishlistDrawer />
      <CheckoutModal />
      <AccountModal />
      <PolicyModal />
      <CompareModal />
      <CompareTray />
      <AIChatWidget />

      {/* Subtle Action Feedback Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.18 }}
            role="status"
            aria-live="polite"
            className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-md bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 text-xs font-medium shadow-lg pointer-events-none whitespace-nowrap"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <StorefrontShell />
    </StoreProvider>
  );
}
