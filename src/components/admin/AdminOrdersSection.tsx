import { useEffect, useMemo, useState } from 'react';
import { Eye, Search, ShoppingBag, X } from 'lucide-react';
import type { OrderRecord, OrderStatus, PaymentStatus } from '../../types/store.ts';
import { ProductImage } from '../ProductImage.tsx';
import { adminFetch, formatCurrency, formatDateTime } from './adminApi.ts';

interface AdminOrdersSectionProps {
  onCatalogMutated: () => void;
  showToast: (msg: string) => void;
  catalogVersion: number;
}

const ORDER_STATUSES: OrderStatus[] = [
  'Pending',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

const PAYMENT_STATUSES: PaymentStatus[] = ['Paid', 'Pending', 'Refunded', 'Failed'];

export function AdminOrdersSection({
  onCatalogMutated,
  showToast,
  catalogVersion,
}: AdminOrdersSectionProps) {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'All' | OrderStatus>('All');
  const [search, setSearch] = useState('');

  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [draftStatus, setDraftStatus] = useState<OrderStatus>('Pending');
  const [draftPaymentStatus, setDraftPaymentStatus] = useState<PaymentStatus>('Paid');
  const [draftRefundNote, setDraftRefundNote] = useState('');
  const [restockOnCancel, setRestockOnCancel] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await adminFetch<{ orders: OrderRecord[] }>('/api/admin/orders');
      setOrders(res.orders);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogVersion]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((ord) => {
      if (statusFilter !== 'All' && ord.status !== statusFilter) return false;
      if (!q) return true;
      return (
        ord.orderNumber.toLowerCase().includes(q) ||
        ord.customer.fullName.toLowerCase().includes(q) ||
        ord.customer.email.toLowerCase().includes(q)
      );
    });
  }, [orders, statusFilter, search]);

  const openOrderDrawer = (order: OrderRecord) => {
    setSelectedOrder(order);
    setDraftStatus(order.status);
    setDraftPaymentStatus(order.paymentStatus ?? 'Paid');
    setDraftRefundNote(order.refundNote ?? '');
    setRestockOnCancel(true);
  };

  const handleSaveOrder = async () => {
    if (!selectedOrder) return;
    setIsSaving(true);
    try {
      const res = await adminFetch<{ updated: boolean; order: OrderRecord }>(
        `/api/admin/orders/${encodeURIComponent(selectedOrder.orderNumber)}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: draftStatus,
            paymentStatus: draftPaymentStatus,
            refundNote: draftRefundNote.trim(),
            restockOnCancel,
          }),
        }
      );
      setOrders((prev) =>
        prev.map((o) => (o.orderNumber === res.order.orderNumber ? res.order : o))
      );
      setSelectedOrder(res.order);
      onCatalogMutated();
      showToast(`Order #${res.order.orderNumber} updated.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update order.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-medium text-stone-900 dark:text-stone-100">
          Orders & Fulfillment
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Track checkout orders, manage shipping fulfillment, update payment statuses, and process refunds with optional restocking.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(['All', ...ORDER_STATUSES] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                statusFilter === tab
                  ? 'bg-stone-900 text-stone-50 border-stone-900 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100'
                  : 'bg-white dark:bg-[#191816] text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-stone-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, customer, email..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#191816] overflow-x-auto">
        {loading && orders.length === 0 ? (
          <div className="py-12 text-center text-xs text-stone-500">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <ShoppingBag className="w-8 h-8 mx-auto text-stone-300 dark:text-stone-700" />
            <p className="text-xs text-stone-500 dark:text-stone-400">
              No orders found matching the selected filter.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Items</th>
                <th className="py-3 px-3">Fulfillment</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3 text-right">Total</th>
                <th className="py-3 px-4 text-right">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
              {filteredOrders.map((ord) => (
                <tr key={ord.orderNumber} className="hover:bg-[#FAF9F6] dark:hover:bg-stone-900/40">
                  <td className="py-3 px-4">
                    <p className="font-mono-tabular font-semibold text-stone-900 dark:text-stone-100">
                      #{ord.orderNumber}
                    </p>
                    <p className="text-[11px] text-stone-400">{formatDateTime(ord.createdAt)}</p>
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-medium text-stone-900 dark:text-stone-100">
                      {ord.customer.fullName}
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      {ord.customer.email}
                    </p>
                  </td>
                  <td className="py-3 px-3 font-mono-tabular text-stone-600 dark:text-stone-300">
                    {ord.items.reduce((sum, item) => sum + item.quantity, 0)} units
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded border border-stone-200 dark:border-stone-700 text-[11px] font-medium">
                      {ord.status}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-medium">{ord.paymentStatus ?? 'Paid'}</p>
                    <p className="text-[11px] text-stone-400">{ord.paymentMethod}</p>
                  </td>
                  <td className="py-3 px-3 text-right font-mono-tabular font-semibold text-stone-900 dark:text-stone-100">
                    {formatCurrency(ord.total)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => openOrderDrawer(ord)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-stone-300 dark:border-stone-700 rounded-md hover:border-stone-500 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Order Detail & Fulfillment Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0" onClick={() => setSelectedOrder(null)} />
          <div className="relative z-10 w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-[#FAF9F6] dark:bg-[#141312] rounded-xl border border-stone-200 dark:border-stone-800 p-6 space-y-5 shadow-2xl text-xs">
            <div className="flex items-start justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#9A6B42] dark:text-[#C89B6E] font-semibold">
                  Order Management
                </p>
                <h3 className="font-display text-2xl font-medium text-stone-900 dark:text-stone-100">
                  Order #{selectedOrder.orderNumber}
                </h3>
                <p className="text-stone-500 dark:text-stone-400 mt-0.5">
                  Placed {formatDateTime(selectedOrder.createdAt)} · {selectedOrder.paymentMethod}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-stone-400 hover:text-stone-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Shipping */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800">
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-wider text-stone-400">Customer</p>
                <p className="font-semibold text-stone-900 dark:text-stone-100">
                  {selectedOrder.customer.fullName}
                </p>
                <p className="text-stone-600 dark:text-stone-300">{selectedOrder.customer.email}</p>
                <p className="text-stone-500 font-mono-tabular">{selectedOrder.customer.phone}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-wider text-stone-400">
                  Shipping Address
                </p>
                <p className="text-stone-700 dark:text-stone-300">
                  {selectedOrder.customer.address}
                </p>
                <p className="text-stone-600 dark:text-stone-400">
                  {selectedOrder.customer.city} {selectedOrder.customer.postalCode}
                </p>
                <p className="text-stone-500">{selectedOrder.customer.country}</p>
              </div>
            </div>

            {/* Ordered Items */}
            <div className="space-y-2">
              <p className="font-semibold uppercase tracking-wider text-[11px] text-stone-500">
                Order Items
              </p>
              <div className="divide-y divide-stone-200 dark:divide-stone-800 rounded-lg bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800">
                {selectedOrder.items.map((item) => (
                  <div
                    key={`${item.productId}-${item.selectedColor}-${item.selectedSize}`}
                    className="flex items-center justify-between gap-3 p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded overflow-hidden bg-stone-100 dark:bg-stone-800 shrink-0">
                        <ProductImage
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-stone-900 dark:text-stone-100 truncate">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-stone-500">
                          {item.selectedColor} · {item.selectedSize} · Qty {item.quantity}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono-tabular font-semibold shrink-0">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap justify-end gap-6 pt-2 font-mono-tabular text-stone-600 dark:text-stone-300">
                <span>Subtotal: {formatCurrency(selectedOrder.subtotal)}</span>
                <span>Shipping: {formatCurrency(selectedOrder.shipping)}</span>
                <span>Tax: {formatCurrency(selectedOrder.tax)}</span>
                <span className="font-semibold text-stone-900 dark:text-stone-100">
                  Total: {formatCurrency(selectedOrder.total)}
                </span>
              </div>
            </div>

            {/* Fulfillment & Payment Controls */}
            <div className="p-4 rounded-lg bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Fulfillment Status</label>
                  <select
                    value={draftStatus}
                    onChange={(e) => setDraftStatus(e.target.value as OrderStatus)}
                    className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-1">Payment Status</label>
                  <select
                    value={draftPaymentStatus}
                    onChange={(e) => setDraftPaymentStatus(e.target.value as PaymentStatus)}
                    className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
                  >
                    {PAYMENT_STATUSES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">Refund / Fulfillment Note</label>
                <input
                  type="text"
                  value={draftRefundNote}
                  onChange={(e) => setDraftRefundNote(e.target.value)}
                  placeholder="Optional tracking or refund reference note..."
                  className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
                />
              </div>

              {(draftStatus === 'Cancelled' || draftPaymentStatus === 'Refunded') &&
                selectedOrder.status !== 'Cancelled' && (
                  <label className="inline-flex items-center gap-2 cursor-pointer text-stone-700 dark:text-stone-300">
                    <input
                      type="checkbox"
                      checked={restockOnCancel}
                      onChange={(e) => setRestockOnCancel(e.target.checked)}
                    />
                    <span>Automatically restock ordered item quantities into inventory</span>
                  </label>
                )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 border border-stone-300 dark:border-stone-700 rounded-md cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => void handleSaveOrder()}
                className="px-5 py-2 bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 rounded-md cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Updating...' : 'Save Order Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
