import { useEffect, useState } from 'react';
import { Check, MessageSquare, Search, Star, Trash2, X } from 'lucide-react';
import type { ProductReviewRecord, ReviewModerationStatus } from '../../types/store.ts';
import { ConfirmDialog } from './ConfirmDialog.tsx';
import { adminFetch, formatDateTime } from './adminApi.ts';

interface AdminReviewsSectionProps {
  onCatalogMutated: () => void;
  showToast: (msg: string) => void;
  catalogVersion: number;
}

export function AdminReviewsSection({
  onCatalogMutated,
  showToast,
  catalogVersion,
}: AdminReviewsSectionProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | ReviewModerationStatus>('all');
  const [search, setSearch] = useState('');
  const [reviews, setReviews] = useState<ProductReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [deleteTarget, setDeleteTarget] = useState<ProductReviewRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      sp.set('status', statusFilter);
      if (search.trim()) sp.set('q', search.trim());
      const res = await adminFetch<{ reviews: ProductReviewRecord[] }>(
        `/api/admin/reviews?${sp.toString()}`
      );
      setReviews(res.reviews);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to load reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, search, catalogVersion]);

  const handleModerate = async (review: ProductReviewRecord, status: ReviewModerationStatus) => {
    try {
      const res = await adminFetch<{ review: ProductReviewRecord }>(
        `/api/admin/reviews/${encodeURIComponent(review.id)}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        }
      );
      setReviews((prev) => prev.map((r) => (r.id === review.id ? res.review : r)));
      onCatalogMutated();
      showToast(`Review marked ${status}. Product rating synced.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to update review.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await adminFetch(`/api/admin/reviews/${encodeURIComponent(deleteTarget.id)}`, {
        method: 'DELETE',
      });
      setReviews((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
      onCatalogMutated();
      showToast('Review deleted and product score recalculated.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-medium text-stone-900 dark:text-stone-100">
          Reviews & Ratings Moderation
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Approve, reject, or delete customer reviews. Changes automatically recalculate live product ratings across the storefront.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3.5 py-1.5 text-xs font-medium capitalize rounded-md border transition-colors cursor-pointer ${
                statusFilter === tab
                  ? 'bg-stone-900 text-stone-50 border-stone-900 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100'
                  : 'bg-white dark:bg-[#191816] text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-stone-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product, author, or text..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md"
          />
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {loading && reviews.length === 0 ? (
          <div className="p-10 text-center text-xs text-stone-500 rounded-xl bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800">
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-14 text-center rounded-xl bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto text-stone-300 dark:text-stone-700" />
            <p className="text-xs text-stone-500">No reviews match this moderation filter.</p>
          </div>
        ) : (
          reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-4 rounded-xl bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-stone-900 dark:text-stone-100">
                    {rev.productName}
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-[#9A6B42] dark:text-[#C89B6E] font-mono-tabular">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {rev.rating.toFixed(1)}
                  </span>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded border text-[10px] font-medium uppercase tracking-wider ${
                      rev.status === 'approved'
                        ? 'border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200'
                        : rev.status === 'pending'
                          ? 'border-[#9A6B42]/40 text-[#9A6B42] dark:text-[#C89B6E]'
                          : 'border-red-500/30 text-red-600 dark:text-red-400'
                    }`}
                  >
                    {rev.status}
                  </span>
                </div>
                <p className="text-stone-700 dark:text-stone-300 leading-relaxed">{rev.comment}</p>
                <p className="text-[11px] text-stone-400">
                  {rev.author} ({rev.role}) · {formatDateTime(rev.createdAt)}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {rev.status !== 'approved' && (
                  <button
                    type="button"
                    onClick={() => void handleModerate(rev, 'approved')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                )}
                {rev.status !== 'rejected' && (
                  <button
                    type="button"
                    onClick={() => void handleModerate(rev, 'rejected')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-stone-300 dark:border-stone-700 hover:border-stone-500 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDeleteTarget(rev)}
                  aria-label="Delete review"
                  className="p-1.5 rounded-md border border-stone-300 dark:border-stone-700 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Customer Review"
        description="Permanently delete this review and recalculate the product's star average?"
        confirmLabel="Delete Review"
        isBusy={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  );
}
