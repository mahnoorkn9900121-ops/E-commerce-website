import { useCallback, useEffect, useState } from 'react';
import {
  Bot,
  Boxes,
  ExternalLink,
  FileEdit,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShoppingBag,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import type { AdminUser } from '../types/store.ts';
import { AdminAiSection } from './admin/AdminAiSection.tsx';
import { AdminCategoriesSection } from './admin/AdminCategoriesSection.tsx';
import { AdminCmsSection } from './admin/AdminCmsSection.tsx';
import { AdminCustomersSection } from './admin/AdminCustomersSection.tsx';
import { AdminInventorySection } from './admin/AdminInventorySection.tsx';
import { AdminLoginScreen } from './admin/AdminLoginScreen.tsx';
import { AdminOrdersSection } from './admin/AdminOrdersSection.tsx';
import { AdminOverviewSection, type AdminSectionId } from './admin/AdminOverviewSection.tsx';
import { AdminProductsSection } from './admin/AdminProductsSection.tsx';
import { AdminReviewsSection } from './admin/AdminReviewsSection.tsx';
import { AdminSettingsSection } from './admin/AdminSettingsSection.tsx';
import {
  adminFetch,
  getStoredAdminToken,
  registerUnauthorizedHandler,
  setStoredAdminToken,
} from './admin/adminApi.ts';

const NAV_ITEMS: Array<{
  id: AdminSectionId;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'categories', label: 'Categories', icon: Layers },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'cms', label: 'Website CMS', icon: FileEdit },
  { id: 'ai', label: 'AI Concierge', icon: Bot },
  { id: 'inventory', label: 'Inventory', icon: Boxes },
  { id: 'reviews', label: 'Reviews', icon: MessageSquare },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function AdminDashboard() {
  const {
    goHome,
    theme,
    toggleTheme,
    showToast,
    catalogVersion,
    bumpCatalogVersion,
    refreshStorefrontConfig,
    storefrontConfig,
  } = useStore();

  const [authChecked, setAuthChecked] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  const [activeSection, setActiveSection] = useState<AdminSectionId>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [quickAddTrigger, setQuickAddTrigger] = useState(0);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      setAdminUser(null);
    });
    return () => registerUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    const token = getStoredAdminToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    fetch('/api/admin/auth/me', { credentials: 'include', headers })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { authenticated?: boolean; user?: AdminUser } | null) => {
        if (data?.authenticated && data.user) {
          setAdminUser(data.user);
        } else {
          setStoredAdminToken(null);
          setAdminUser(null);
        }
      })
      .catch(() => {
        setAdminUser(null);
      })
      .finally(() => {
        setAuthChecked(true);
      });
  }, []);

  const handleCatalogMutated = useCallback(() => {
    bumpCatalogVersion();
    void refreshStorefrontConfig();
  }, [bumpCatalogVersion, refreshStorefrontConfig]);

  const handleStorefrontMutated = useCallback(() => {
    void refreshStorefrontConfig();
    bumpCatalogVersion();
  }, [bumpCatalogVersion, refreshStorefrontConfig]);

  const handleLogout = async () => {
    try {
      await adminFetch('/api/admin/auth/logout', { method: 'POST' });
    } catch {
      // Clear local session regardless
    }
    setStoredAdminToken(null);
    setAdminUser(null);
    showToast('Signed out of Administrator Console.');
  };

  const handleQuickAddProduct = () => {
    setActiveSection('products');
    setQuickAddTrigger((n) => n + 1);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] dark:bg-[#111110]">
        <div className="w-72 p-6 rounded-xl bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 space-y-3 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#9A6B42] dark:text-[#C89B6E]">
            Verifying Session
          </p>
          <div className="h-1.5 w-full rounded bg-stone-200 dark:bg-stone-800 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return (
      <AdminLoginScreen
        onSuccess={(user) => {
          setAdminUser(user);
          showToast(`Signed in as ${user.email}`);
        }}
      />
    );
  }

  const brandName = storefrontConfig?.cms.settings.websiteName || 'MAISON KOVA';
  const currentNav = NAV_ITEMS.find((item) => item.id === activeSection) || NAV_ITEMS[0];

  const renderSidebarLinks = (isMobile = false) => (
    <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = activeSection === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setActiveSection(item.id);
              if (isMobile) setMobileNavOpen(false);
            }}
            title={sidebarCollapsed && !isMobile ? item.label : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              active
                ? 'bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900'
                : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/70'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {(!sidebarCollapsed || isMobile) && <span className="truncate">{item.label}</span>}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen flex bg-[#FAF9F6] dark:bg-[#111110] text-stone-900 dark:text-stone-100">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 border-r border-stone-200 dark:border-stone-800 bg-white dark:bg-[#171614] transition-all duration-200 sticky top-0 h-screen ${
          sidebarCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className="h-14 px-3.5 flex items-center justify-between border-b border-stone-200 dark:border-stone-800">
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="font-display text-base font-semibold tracking-wide truncate">
                {brandName}
              </p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#9A6B42] dark:text-[#C89B6E]">
                Admin Console
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setSidebarCollapsed((c) => !c)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-md text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {renderSidebarLinks(false)}

        <div className="p-2.5 border-t border-stone-200 dark:border-stone-800 space-y-1">
          <button
            type="button"
            onClick={goHome}
            title={sidebarCollapsed ? 'View Storefront' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/70 cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Storefront Preview</span>}
          </button>
          <button
            type="button"
            onClick={() => void handleLogout()}
            title={sidebarCollapsed ? 'Sign Out' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileNavOpen(false)} />
          <div className="relative z-10 w-64 max-w-[80vw] bg-white dark:bg-[#171614] border-r border-stone-200 dark:border-stone-800 flex flex-col h-full">
            <div className="h-14 px-4 flex items-center justify-between border-b border-stone-200 dark:border-stone-800">
              <div>
                <p className="font-display text-base font-semibold">{brandName}</p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#9A6B42]">
                  Admin Console
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="p-1.5 text-stone-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {renderSidebarLinks(true)}
            <div className="p-3 border-t border-stone-200 dark:border-stone-800 space-y-1">
              <button
                type="button"
                onClick={goHome}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-300 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Storefront Preview</span>
              </button>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-red-600 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="h-14 px-4 sm:px-6 border-b border-stone-200 dark:border-stone-800 bg-white/90 dark:bg-[#171614]/90 backdrop-blur-xs sticky top-0 z-30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open admin navigation"
              className="lg:hidden p-1.5 rounded-md border border-stone-200 dark:border-stone-700 cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 truncate">
              <span className="hidden sm:inline font-medium text-stone-800 dark:text-stone-200">
                {brandName}
              </span>
              <span className="hidden sm:inline">/</span>
              <span className="font-medium text-stone-900 dark:text-stone-100">
                {currentNav.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="hidden md:inline text-xs text-stone-500 dark:text-stone-400">
              {adminUser.email}
            </span>
            <button
              type="button"
              onClick={goHome}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-stone-200 dark:border-stone-700 rounded-md hover:border-stone-400 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View Store</span>
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle color theme"
              className="p-1.5 rounded-md border border-stone-200 dark:border-stone-700 hover:border-stone-400 cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => void handleLogout()}
              aria-label="Sign out"
              className="lg:hidden p-1.5 rounded-md border border-stone-200 dark:border-stone-700 text-red-600 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Active Section Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeSection === 'overview' && (
            <AdminOverviewSection
              onNavigate={setActiveSection}
              onQuickAddProduct={handleQuickAddProduct}
              catalogVersion={catalogVersion}
            />
          )}
          {activeSection === 'products' && (
            <AdminProductsSection
              onCatalogMutated={handleCatalogMutated}
              showToast={showToast}
              catalogVersion={catalogVersion}
              externalAddTrigger={quickAddTrigger}
            />
          )}
          {activeSection === 'categories' && (
            <AdminCategoriesSection
              onCatalogMutated={handleCatalogMutated}
              showToast={showToast}
              catalogVersion={catalogVersion}
            />
          )}
          {activeSection === 'orders' && (
            <AdminOrdersSection
              onCatalogMutated={handleCatalogMutated}
              showToast={showToast}
              catalogVersion={catalogVersion}
            />
          )}
          {activeSection === 'customers' && (
            <AdminCustomersSection
              showToast={showToast}
              catalogVersion={catalogVersion}
            />
          )}
          {activeSection === 'cms' && (
            <AdminCmsSection
              onStorefrontMutated={handleStorefrontMutated}
              showToast={showToast}
            />
          )}
          {activeSection === 'ai' && (
            <AdminAiSection
              onStorefrontMutated={handleStorefrontMutated}
              showToast={showToast}
            />
          )}
          {activeSection === 'inventory' && (
            <AdminInventorySection
              onCatalogMutated={handleCatalogMutated}
              showToast={showToast}
              catalogVersion={catalogVersion}
            />
          )}
          {activeSection === 'reviews' && (
            <AdminReviewsSection
              onCatalogMutated={handleCatalogMutated}
              showToast={showToast}
              catalogVersion={catalogVersion}
            />
          )}
          {activeSection === 'settings' && (
            <AdminSettingsSection
              onStorefrontMutated={handleStorefrontMutated}
              showToast={showToast}
              adminEmail={adminUser.email}
            />
          )}
        </main>
      </div>
    </div>
  );
}
