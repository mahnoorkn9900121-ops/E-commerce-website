import React, { useState } from 'react';
import { CheckCircle2, CreditCard, Lock, Truck, X } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import type { CustomerProfile } from '../types/store.ts';
import { ProductImage } from './ProductImage.tsx';

export function CheckoutModal() {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    cart,
    subtotal,
    shippingFee,
    taxAmount,
    orderTotal,
    profile,
    placeOrder,
    lastPlacedOrder,
    setLastPlacedOrder,
  } = useStore();

  const [form, setForm] = useState<CustomerProfile>(profile);
  const [paymentMethod, setPaymentMethod] = useState<'Card' | 'Apple Pay' | 'Cash on Delivery'>('Card');
  const [formError, setFormError] = useState<string | null>(null);

  if (!isCheckoutOpen) return null;

  const handleClose = () => {
    setIsCheckoutOpen(false);
    setLastPlacedOrder(null);
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim() || !form.address.trim() || !form.postalCode.trim()) {
      setFormError('Please complete all required shipping and verification fields.');
      return;
    }
    setFormError(null);
    placeOrder(form, paymentMethod);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Checkout"
    >
      <div className="absolute inset-0" onClick={handleClose} />

      <div className="relative z-10 w-full max-w-4xl max-h-[100dvh] sm:max-h-[92vh] overflow-y-auto bg-[#FAF9F6] dark:bg-[#141312] sm:rounded-xl border border-stone-200 dark:border-stone-800 shadow-2xl">
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-[#FAF9F6]/95 dark:bg-[#141312]/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100">
            <Lock className="w-4 h-4 text-[#9A6B42] dark:text-[#C89B6E]" />
            <h2 className="font-display text-2xl font-medium">
              {lastPlacedOrder ? 'Order Confirmation' : 'Checkout & Delivery'}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close checkout"
            className="p-2 rounded-md text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {lastPlacedOrder ? (
          <div className="p-6 sm:p-10 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-stone-200 dark:border-stone-800">
              <CheckCircle2 className="w-10 h-10 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400">
                  Order #{lastPlacedOrder.orderNumber} · Status: {lastPlacedOrder.status}
                </p>
                <h3 className="font-display text-3xl text-stone-900 dark:text-stone-100 mt-1">
                  Thank you, {lastPlacedOrder.customer.fullName}
                </h3>
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                  Confirmation dispatched to {lastPlacedOrder.customer.email} · Payment: {lastPlacedOrder.paymentMethod}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-lg bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 space-y-2 text-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400 mb-2">
                  Shipping Destination
                </p>
                <p className="font-medium text-stone-900 dark:text-stone-100">
                  {lastPlacedOrder.customer.fullName}
                </p>
                <p className="text-stone-600 dark:text-stone-400">
                  {lastPlacedOrder.customer.address}
                </p>
                <p className="text-stone-600 dark:text-stone-400">
                  {lastPlacedOrder.customer.city}, {lastPlacedOrder.customer.postalCode}
                </p>
                <p className="text-stone-600 dark:text-stone-400">
                  {lastPlacedOrder.customer.phone}
                </p>
              </div>

              <div className="p-5 rounded-lg bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 space-y-2 text-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400 mb-2">
                  Receipt Summary
                </p>
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span>Subtotal</span>
                  <span className="font-mono-tabular">${lastPlacedOrder.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span>Express Shipping</span>
                  <span className="font-mono-tabular">
                    {lastPlacedOrder.shipping === 0 ? 'Complimentary' : `$${lastPlacedOrder.shipping}`}
                  </span>
                </div>
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span>Tax</span>
                  <span className="font-mono-tabular">${lastPlacedOrder.tax.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex justify-between font-semibold text-stone-900 dark:text-stone-100">
                  <span>Total Paid</span>
                  <span className="font-mono-tabular">${lastPlacedOrder.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {lastPlacedOrder.items.map((item) => (
                <div
                  key={`${item.productId}-${item.selectedColor}-${item.selectedSize}`}
                  className="flex items-center justify-between gap-4 p-3 rounded-lg bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-16 aspect-[4/3] rounded overflow-hidden bg-stone-100 dark:bg-stone-800">
                      <ProductImage src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                        {item.name}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {item.selectedColor} · {item.selectedSize} · Qty {item.quantity}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-mono-tabular font-semibold text-stone-900 dark:text-stone-100">
                    ${(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 text-sm font-medium bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 rounded-md cursor-pointer"
            >
              Return to Storefront
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-stone-900 dark:text-stone-100 mb-4">
                  Customer &amp; Shipping Verification
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#9A6B42]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#9A6B42]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#9A6B42]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      required
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#9A6B42]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                      City &amp; State
                    </label>
                    <input
                      type="text"
                      required
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#9A6B42]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      required
                      value={form.postalCode}
                      onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#9A6B42]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-stone-900 dark:text-stone-100 mb-3">
                  Payment Method
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['Card', 'Apple Pay', 'Cash on Delivery'] as const).map((method) => {
                    const active = paymentMethod === method;
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`flex items-center justify-center gap-2 px-3 py-3 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                          active
                            ? 'border-stone-900 dark:border-stone-100 bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900'
                            : 'border-stone-300 dark:border-stone-700 bg-white dark:bg-[#191816] text-stone-700 dark:text-stone-300 hover:border-stone-500'
                        }`}
                      >
                        {method === 'Cash on Delivery' ? (
                          <Truck className="w-3.5 h-3.5" />
                        ) : (
                          <CreditCard className="w-3.5 h-3.5" />
                        )}
                        <span>{method}</span>
                      </button>
                    );
                  })}
                </div>
                {paymentMethod === 'Cash on Delivery' && (
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-2">
                    Pay on courier arrival. Orders over $150 qualify for complimentary express courier delivery.
                  </p>
                )}
              </div>

              {formError && (
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">{formError}</p>
              )}
            </div>

            {/* Order Summary Column */}
            <div className="lg:col-span-5">
              <div className="p-6 rounded-lg bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 space-y-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-stone-900 dark:text-stone-100">
                  Order Summary
                </h3>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={`${item.productId}-${item.selectedColor}-${item.selectedSize}`}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-stone-900 dark:text-stone-100 truncate">
                          {item.name} × {item.quantity}
                        </p>
                        <p className="text-stone-500 dark:text-stone-400">
                          {item.selectedColor} · {item.selectedSize}
                        </p>
                      </div>
                      <span className="font-mono-tabular text-stone-900 dark:text-stone-100 shrink-0">
                        ${(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-2 text-sm">
                  <div className="flex justify-between text-stone-600 dark:text-stone-400">
                    <span>Subtotal</span>
                    <span className="font-mono-tabular">${subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-stone-600 dark:text-stone-400">
                    <span>Shipping</span>
                    <span className="font-mono-tabular">
                      {shippingFee === 0 ? 'Complimentary' : `$${shippingFee}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-stone-600 dark:text-stone-400">
                    <span>Tax (8%)</span>
                    <span className="font-mono-tabular">${taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex justify-between font-semibold text-stone-900 dark:text-stone-100">
                    <span>Total Due</span>
                    <span className="font-mono-tabular text-base">${orderTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={cart.length === 0}
                  className="w-full py-3.5 px-6 text-sm font-medium bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  Confirm Order · ${orderTotal.toFixed(2)}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
