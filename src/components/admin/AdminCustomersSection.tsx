import { useEffect, useState } from 'react';
import { Eye, Search, Trash2, UserCheck, UserX, Users, X } from 'lucide-react';
import type { CustomerRecord, OrderRecord } from '../../types/store.ts';
import { ConfirmDialog } from './ConfirmDialog.tsx';
import { adminFetch, formatCurrency, formatShortDate } from './adminApi.ts';

interface AdminCustomersSectionProps {
  showToast: (msg: string) => void;
  catalogVersion: number;
}

export function AdminCustomersSection({ showToast, catalogVersion }: AdminCustomersSectionProps) {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [detail, setDetail] = useState<{ customer: CustomerRecord; orders: OrderRecord[] } | null>(
    null
  );
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<CustomerRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCustomers = async (query: string) => {
    setLoading(true);
    try {
      const qs = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : '';
      const res = await adminFetch<{ customers: CustomerRecord[] }>(`/api/admin/customers${qs}`);
      setCustomers(res.customers);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to load customers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCustomers(search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, catalogVersion]);

  const openProfile = async (customer: CustomerRecord) => {
    setLoadingDetail(true);
    setDetail({ customer, orders: [] });
    try {
      const res = await adminFetch<{ customer: CustomerRecord; orders: OrderRecord[] }>(
        `/api/admin/customers/${encodeURIComponent(customer.id)}`
      );
      setDetail(res);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to fetch customer history.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleToggleStatus = async (customer: CustomerRecord) => {
    const nextStatus = customer.status === 'Active' ? 'Suspended' : 'Active';
    try {
      await adminFetch(`/api/admin/customers/${encodeURIComponent(customer.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      setCustomers((prev) =>
        prev.map((c) => (c.id === customer.id ? { ...c, status: nextStatus } : c))
      );
      if (detail?.customer.id === customer.id) {
        setDetail({ ...detail, customer: { ...detail.customer, status: nextStatus } });
      }
      showToast(`${customer.fullName} marked ${nextStatus}.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Status update failed.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await adminFetch(`/api/admin/customers/${encodeURIComponent(deleteTarget.id)}`, {
        method: 'DELETE',
      });
      setCustomers((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      if (detail?.customer.id === deleteTarget.id) setDetail(null);
      showToast(`Deleted customer profile for ${deleteTarget.fullName}.`);
      setDeleteTarget(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalSpentAll = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const activeCount = customers.filter((c) => c.status === 'Active').length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-medium text-stone-900 dark:text-stone-100">
            Customers Directory
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Automatically synced from storefront checkouts. Inspect lifetime spend, order history, and account status.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, or city..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md"
          />
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800">
          <p className="text-[11px] uppercase tracking-wider text-stone-500">Registered Profiles</p>
          <p className="font-mono-tabular text-xl font-semibold mt-1">{customers.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800">
          <p className="text-[11px] uppercase tracking-wider text-stone-500">Active Accounts</p>
          <p className="font-mono-tabular text-xl font-semibold mt-1">{activeCount}</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800">
          <p className="text-[11px] uppercase tracking-wider text-stone-500">Lifetime Spend</p>
          <p className="font-mono-tabular text-xl font-semibold mt-1">
            {formatCurrency(totalSpentAll)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#191816] overflow-x-auto">
        {loading && customers.length === 0 ? (
          <div className="py-12 text-center text-xs text-stone-500">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Users className="w-8 h-8 mx-auto text-stone-300 dark:text-stone-700" />
            <p className="text-xs text-stone-500 dark:text-stone-400">
              No customer records yet. Customer profiles are created automatically when orders are placed.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3">Orders</th>
                <th className="py-3 px-3">Total Spent</th>
                <th className="py-3 px-3">Last Order</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-[#FAF9F6] dark:hover:bg-stone-900/40">
                  <td className="py-3 px-4">
                    <p className="font-semibold text-stone-900 dark:text-stone-100">{c.fullName}</p>
                    <p className="text-[11px] text-stone-500">{c.email}</p>
                  </td>
                  <td className="py-3 px-3 text-stone-600 dark:text-stone-300">
                    {c.city || '—'}, {c.country || 'US'}
                  </td>
                  <td className="py-3 px-3 font-mono-tabular">{c.ordersCount}</td>
                  <td className="py-3 px-3 font-mono-tabular font-semibold">
                    {formatCurrency(c.totalSpent)}
                  </td>
                  <td className="py-3 px-3 text-stone-500">{formatShortDate(c.lastOrderAt)}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-medium ${
                        c.status === 'Active'
                          ? 'border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200'
                          : 'border-red-500/30 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => void openProfile(c)}
                        title="View customer profile & orders"
                        className="p-1.5 rounded border border-stone-300 dark:border-stone-700 hover:border-stone-500 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleToggleStatus(c)}
                        title={c.status === 'Active' ? 'Suspend account' : 'Reactivate account'}
                        className="p-1.5 rounded border border-stone-300 dark:border-stone-700 hover:border-stone-500 cursor-pointer"
                      >
                        {c.status === 'Active' ? (
                          <UserX className="w-3.5 h-3.5" />
                        ) : (
                          <UserCheck className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(c)}
                        title="Delete customer"
                        className="p-1.5 rounded border border-stone-300 dark:border-stone-700 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Customer Detail Modal */}
      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0" onClick={() => setDetail(null)} />
          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#FAF9F6] dark:bg-[#141312] rounded-xl border border-stone-200 dark:border-stone-800 p-6 space-y-5 shadow-2xl text-xs">
            <div className="flex items-start justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#9A6B42] dark:text-[#C89B6E] font-semibold">
                  Customer Profile
                </p>
                <h3 className="font-display text-2xl font-medium">{detail.customer.fullName}</h3>
                <p className="text-stone-500 mt-0.5">
                  {detail.customer.email} · {detail.customer.phone}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="p-1.5 text-stone-400 hover:text-stone-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-lg bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800">
                <p className="text-stone-400 text-[11px] uppercase">Status</p>
                <p className="font-semibold mt-1">{detail.customer.status}</p>
              </div>
              <div className="p-3.5 rounded-lg bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800">
                <p className="text-stone-400 text-[11px] uppercase">Orders</p>
                <p className="font-mono-tabular font-semibold mt-1">{detail.customer.ordersCount}</p>
              </div>
              <div className="p-3.5 rounded-lg bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800">
                <p className="text-stone-400 text-[11px] uppercase">Lifetime Spend</p>
                <p className="font-mono-tabular font-semibold mt-1">
                  {formatCurrency(detail.customer.totalSpent)}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800">
              <p className="text-stone-400 text-[11px] uppercase mb-1">Shipping Address</p>
              <p className="text-stone-800 dark:text-stone-200">
                {detail.customer.address}, {detail.customer.city} {detail.customer.postalCode},{' '}
                {detail.customer.country}
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-semibold uppercase tracking-wider text-[11px] text-stone-500">
                Order History
              </p>
              {loadingDetail ? (
                <p className="text-stone-400 py-4">Loading order history...</p>
              ) : detail.orders.length === 0 ? (
                <p className="text-stone-500 py-4">No orders matched to this email.</p>
              ) : (
                <div className="divide-y divide-stone-200 dark:divide-stone-800 rounded-lg bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800">
                  {detail.orders.map((o) => (
                    <div key={o.orderNumber} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-mono-tabular font-semibold">#{o.orderNumber}</p>
                        <p className="text-[11px] text-stone-500">
                          {formatShortDate(o.createdAt)} · {o.items.length} line item(s) · {o.status}
                        </p>
                      </div>
                      <span className="font-mono-tabular font-semibold">
                        {formatCurrency(o.total)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Customer Profile"
        description={
          deleteTarget
            ? `Permanently delete the customer record for "${deleteTarget.fullName}" (${deleteTarget.email})? Historical order receipts remain intact.`
            : ''
        }
        confirmLabel="Delete Customer"
        isBusy={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  );
}
