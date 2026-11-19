import { useEffect, useState } from 'react';
import { Check, Search } from 'lucide-react';
import type { InventoryAdjustment, PaginatedProductsResponse } from '../../types/store.ts';
import { ProductImage } from '../ProductImage.tsx';
import { adminFetch, formatDateTime } from './adminApi.ts';

interface AdminInventorySectionProps {
  onCatalogMutated: () => void;
  showToast: (msg: string) => void;
  catalogVersion: number;
}

interface InventoryResponse extends PaginatedProductsResponse {
  history: InventoryAdjustment[];
}

export function AdminInventorySection({
  onCatalogMutated,
  showToast,
  catalogVersion,
}: AdminInventorySectionProps) {
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<InventoryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [drafts, setDrafts] = useState<
    Record<string, { newStock: string; reason: string }>
  >({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      sp.set('filter', filter);
      if (search.trim()) sp.set('q', search.trim());
      sp.set('page', String(page));
      sp.set('pageSize', '15');
      const res = await adminFetch<InventoryResponse>(`/api/admin/inventory?${sp.toString()}`);
      setData(res);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to load inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search, page, catalogVersion]);

  const handleAdjustStock = async (productId: string) => {
    const draft = drafts[productId];
    if (!draft) return;
    const newStock = Number(draft.newStock);
    if (Number.isNaN(newStock) || newStock < 0) {
      showToast('Enter a valid non-negative stock quantity.');
      return;
    }

    setSavingId(productId);
    try {
      await adminFetch('/api/admin/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify({
          productId,
          newStock,
          reason: draft.reason.trim() || 'Manual Stock Count Update',
        }),
      });
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      onCatalogMutated();
      showToast('Inventory updated and logged.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to adjust stock.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-medium text-stone-900 dark:text-stone-100">
          Inventory & Stock Audit
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Monitor low-stock alerts, replenish out-of-stock SKUs, and review every stock movement in the audit ledger.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ['all', 'All SKUs'],
              ['low', 'Low Stock (1–5)'],
              ['out', 'Out of Stock (0)'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setFilter(key);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                filter === key
                  ? 'bg-stone-900 text-stone-50 border-stone-900 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100'
                  : 'bg-white dark:bg-[#191816] text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-stone-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search SKU, product, brand..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#191816] overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-stone-200 dark:border-stone-800 text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400">
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Current Stock</th>
              <th className="py-3 px-3">New Stock</th>
              <th className="py-3 px-3">Adjustment Reason</th>
              <th className="py-3 px-4 text-right">Apply</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
            {loading && !data ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-stone-500">
                  Loading inventory...
                </td>
              </tr>
            ) : !data || data.products.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-stone-500">
                  No products found in this inventory view.
                </td>
              </tr>
            ) : (
              data.products.map((prod) => {
                const draft = drafts[prod.id];
                const stockLabel =
                  prod.stockCount <= 0
                    ? 'Out of Stock'
                    : prod.stockCount <= 5
                      ? 'Low Stock'
                      : 'Healthy';
                return (
                  <tr key={prod.id} className="hover:bg-[#FAF9F6] dark:hover:bg-stone-900/40">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded overflow-hidden bg-stone-100 dark:bg-stone-800 shrink-0">
                          <ProductImage
                            src={prod.image}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-stone-900 dark:text-stone-100 truncate max-w-[230px]">
                            {prod.name}
                          </p>
                          <p className="text-[11px] text-stone-500">
                            {prod.category} · {prod.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded border text-[11px] font-medium ${
                          prod.stockCount <= 0
                            ? 'border-red-500/30 text-red-600 dark:text-red-400'
                            : prod.stockCount <= 5
                              ? 'border-[#9A6B42]/40 text-[#9A6B42] dark:text-[#C89B6E]'
                              : 'border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        {stockLabel}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono-tabular font-semibold">
                      {prod.stockCount}
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        min={0}
                        value={draft ? draft.newStock : String(prod.stockCount)}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [prod.id]: {
                              newStock: e.target.value,
                              reason: prev[prod.id]?.reason ?? 'Warehouse Restock',
                            },
                          }))
                        }
                        aria-label={`New stock for ${prod.name}`}
                        className="w-20 px-2.5 py-1.5 font-mono-tabular bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={draft ? draft.reason : ''}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [prod.id]: {
                              newStock: prev[prod.id]?.newStock ?? String(prod.stockCount),
                              reason: e.target.value,
                            },
                          }))
                        }
                        placeholder="Reason (e.g. Restock PO #402)"
                        className="w-full min-w-[160px] px-2.5 py-1.5 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded"
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        disabled={!draft || savingId === prod.id}
                        onClick={() => void handleAdjustStock(prod.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 rounded-md disabled:opacity-35 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {data && (
        <div className="flex items-center justify-between text-xs font-mono-tabular text-stone-500">
          <span>
            Page {data.page} of {data.totalPages} ({data.total.toLocaleString()} items)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={data.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 border border-stone-300 dark:border-stone-700 rounded disabled:opacity-40 cursor-pointer"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={data.page >= data.totalPages}
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              className="px-3 py-1.5 border border-stone-300 dark:border-stone-700 rounded disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Stock Adjustment Audit History */}
      <div className="p-5 rounded-xl bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 space-y-3">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
          Stock Adjustment Ledger
        </h3>
        {!data || data.history.length === 0 ? (
          <p className="text-xs text-stone-500 py-4">
            No stock adjustments recorded yet. Adjustments from orders or manual restocks appear here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 text-[11px] uppercase tracking-wider text-stone-500">
                  <th className="py-2 pr-3">Product</th>
                  <th className="py-2 px-3">Change</th>
                  <th className="py-2 px-3">Reason</th>
                  <th className="py-2 px-3">Actor</th>
                  <th className="py-2 pl-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                {data.history.slice(0, 25).map((entry) => (
                  <tr key={entry.id}>
                    <td className="py-2 pr-3 font-medium text-stone-900 dark:text-stone-100">
                      {entry.productName}
                    </td>
                    <td className="py-2 px-3 font-mono-tabular">
                      {entry.previousStock} → {entry.newStock} (
                      {entry.delta >= 0 ? `+${entry.delta}` : entry.delta})
                    </td>
                    <td className="py-2 px-3 text-stone-600 dark:text-stone-300">
                      {entry.reason}
                    </td>
                    <td className="py-2 px-3 text-stone-500">{entry.adjustedBy}</td>
                    <td className="py-2 pl-3 text-right text-stone-400">
                      {formatDateTime(entry.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
