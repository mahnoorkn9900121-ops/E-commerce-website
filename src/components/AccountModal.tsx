import React, { useState } from 'react';
import { Package, User, X } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { ProductImage } from './ProductImage.tsx';

export function AccountModal() {
  const {
    isAccountOpen,
    setIsAccountOpen,
    profile,
    setProfile,
    orders,
    recentlyViewedProducts,
    openProductDetail,
    showToast,
  } = useStore();

  const [tab, setTab] = useState<'profile' | 'orders' | 'recent'>('profile');
  const [draft, setDraft] = useState(profile);

  if (!isAccountOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile(draft);
    showToast('Client profile updated.');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Customer Account"
    >
      <div className="absolute inset-0" onClick={() => setIsAccountOpen(false)} />

      <div className="relative z-10 w-full max-w-3xl max-h-[100dvh] sm:max-h-[88vh] overflow-y-auto bg-[#FAF9F6] dark:bg-[#141312] sm:rounded-xl border border-stone-200 dark:border-stone-800 shadow-2xl">
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-[#FAF9F6]/95 dark:bg-[#141312]/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2.5 text-stone-900 dark:text-stone-100">
            <User className="w-4 h-4 text-[#9A6B42] dark:text-[#C89B6E]" />
            <h2 className="font-display text-2xl font-medium">Client Account</h2>
          </div>
          <button
            type="button"
            onClick={() => setIsAccountOpen(false)}
            aria-label="Close account modal"
            className="p-2 rounded-md text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-5 border-b border-stone-200 dark:border-stone-800 flex gap-6">
          {([
            ['profile', 'Profile & Address'],
            ['orders', `Order History (${orders.length})`],
            ['recent', `Recently Viewed (${recentlyViewedProducts.length})`],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`pb-3 text-xs font-medium uppercase tracking-[0.12em] border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                tab === key
                  ? 'border-stone-900 dark:border-stone-100 text-stone-900 dark:text-stone-100'
                  : 'border-transparent text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-6 sm:p-8">
          {tab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={draft.fullName}
                  onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={draft.email}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={draft.phone}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Default Shipping Address
                </label>
                <input
                  type="text"
                  value={draft.address}
                  onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  City &amp; State
                </label>
                <input
                  type="text"
                  value={draft.city}
                  onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={draft.postalCode}
                  onChange={(e) => setDraft({ ...draft, postalCode: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100"
                />
              </div>
              <div className="sm:col-span-2 pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-medium bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 rounded-md cursor-pointer"
                >
                  Save Preferences
                </button>
              </div>
            </form>
          )}

          {tab === 'orders' && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="py-12 text-center">
                  <Package className="w-9 h-9 mx-auto text-stone-300 dark:text-stone-700 mb-3" />
                  <p className="text-sm text-stone-600 dark:text-stone-400">
                    You have not placed any orders yet.
                  </p>
                </div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.orderNumber}
                    className="p-5 rounded-lg bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-mono-tabular font-semibold text-stone-900 dark:text-stone-100">
                        Order #{order.orderNumber}
                      </span>
                      <span className="text-stone-500 dark:text-stone-400">
                        {new Date(order.createdAt).toLocaleDateString()} · {order.status} · {order.paymentMethod}
                      </span>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      {order.items.map((item) => (
                        <div
                          key={`${item.productId}-${item.selectedColor}-${item.selectedSize}`}
                          className="flex justify-between text-stone-700 dark:text-stone-300"
                        >
                          <span>
                            {item.name} ({item.selectedColor}, {item.selectedSize}) × {item.quantity}
                          </span>
                          <span className="font-mono-tabular">
                            ${(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex justify-between text-sm font-semibold text-stone-900 dark:text-stone-100">
                      <span>Total</span>
                      <span className="font-mono-tabular">${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'recent' && (
            <div>
              {recentlyViewedProducts.length === 0 ? (
                <p className="py-10 text-center text-sm text-stone-500 dark:text-stone-400">
                  Products you inspect will appear here for quick access.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {recentlyViewedProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => {
                        setIsAccountOpen(false);
                        openProductDetail(product);
                      }}
                      className="text-left bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 rounded-lg overflow-hidden hover:border-stone-400 cursor-pointer"
                    >
                      <div className="aspect-[4/3] bg-stone-100 dark:bg-stone-800">
                        <ProductImage
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-medium text-stone-900 dark:text-stone-100 truncate">
                          {product.name}
                        </p>
                        <p className="text-xs font-mono-tabular text-stone-500 dark:text-stone-400 mt-0.5">
                          ${product.price.toLocaleString()}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
