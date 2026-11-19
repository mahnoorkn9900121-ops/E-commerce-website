import React, { useEffect, useState } from 'react';
import { Edit3, Eye, EyeOff, FolderPlus, Save, Trash2, Upload, X } from 'lucide-react';
import { AVAILABLE_STUDIO_ASSETS } from '../../data/catalog.ts';
import type { CategorySummary } from '../../types/store.ts';
import { ProductImage } from '../ProductImage.tsx';
import { ConfirmDialog } from './ConfirmDialog.tsx';
import { adminFetch, uploadAdminImage } from './adminApi.ts';

interface AdminCategoriesSectionProps {
  onCatalogMutated: () => void;
  showToast: (msg: string) => void;
  catalogVersion: number;
}

export function AdminCategoriesSection({
  onCatalogMutated,
  showToast,
  catalogVersion,
}: AdminCategoriesSectionProps) {
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Create form
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newImage, setNewImage] = useState(AVAILABLE_STUDIO_ASSETS[0]);
  const [newSortOrder, setNewSortOrder] = useState('25');
  const [isCreating, setIsCreating] = useState(false);

  // Edit modal
  const [editing, setEditing] = useState<CategorySummary | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editSortOrder, setEditSortOrder] = useState('0');
  const [editVisible, setEditVisible] = useState(true);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete modal
  const [deletingCat, setDeletingCat] = useState<CategorySummary | null>(null);
  const [reassignTarget, setReassignTarget] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await adminFetch<{ categories: CategorySummary[] }>('/api/admin/categories');
      setCategories(res.categories);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogVersion]);

  const handleUploadCover = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'new' | 'edit'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadAdminImage(file);
      if (target === 'new') setNewImage(url);
      else setEditImage(url);
      showToast('Category cover uploaded.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      e.target.value = '';
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      await adminFetch('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: newName.trim(),
          description: newDesc.trim(),
          image: newImage.trim() || AVAILABLE_STUDIO_ASSETS[0],
          sortOrder: Number(newSortOrder) || 99,
          isVisible: true,
        }),
      });
      setNewName('');
      setNewDesc('');
      onCatalogMutated();
      showToast('Category created.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to create category.');
    } finally {
      setIsCreating(false);
    }
  };

  const openEditModal = (cat: CategorySummary) => {
    setEditing(cat);
    setEditName(cat.name);
    setEditDesc(cat.description);
    setEditImage(cat.image);
    setEditSortOrder(String(cat.sortOrder ?? 0));
    setEditVisible(cat.isVisible !== false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editName.trim()) return;
    setIsSavingEdit(true);
    try {
      await adminFetch(`/api/admin/categories/${encodeURIComponent(editing.slug)}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editName.trim(),
          description: editDesc.trim(),
          image: editImage.trim(),
          sortOrder: Number(editSortOrder) || 0,
          isVisible: editVisible,
        }),
      });
      setEditing(null);
      onCatalogMutated();
      showToast('Category updated across storefront.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to update category.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleToggleVisibility = async (cat: CategorySummary) => {
    const nextVisible = cat.isVisible === false;
    try {
      await adminFetch(`/api/admin/categories/${encodeURIComponent(cat.slug)}`, {
        method: 'PUT',
        body: JSON.stringify({ isVisible: nextVisible }),
      });
      onCatalogMutated();
      showToast(`${cat.name} ${nextVisible ? 'shown on storefront' : 'hidden from storefront'}.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to toggle visibility.');
    }
  };

  const startDelete = (cat: CategorySummary) => {
    setDeletingCat(cat);
    const fallback = categories.find((c) => c.slug !== cat.slug)?.name || '';
    setReassignTarget(fallback);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCat) return;
    setIsDeleting(true);
    try {
      const qs =
        deletingCat.productCount > 0 && reassignTarget
          ? `?reassignTo=${encodeURIComponent(reassignTarget)}`
          : '';
      await adminFetch(`/api/admin/categories/${encodeURIComponent(deletingCat.slug)}${qs}`, {
        method: 'DELETE',
      });
      setDeletingCat(null);
      onCatalogMutated();
      showToast(`Deleted category "${deletingCat.name}".`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to delete category.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-medium text-stone-900 dark:text-stone-100">
          Categories Management
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Rename departments, reorder display priority, upload cover artwork, toggle storefront visibility, or reassign products.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleCreate}
          className="lg:col-span-4 p-5 rounded-xl bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 space-y-4"
        >
          <h3 className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-900 dark:text-stone-100">
            <FolderPlus className="w-4 h-4 text-[#9A6B42]" />
            <span>Add Category</span>
          </h3>

          <div className="space-y-1 text-xs">
            <label className="block font-medium">Category Name</label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g., Musical Instruments"
              className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
            />
          </div>

          <div className="space-y-1 text-xs">
            <label className="block font-medium">Description</label>
            <textarea
              rows={3}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Curated editorial summary..."
              className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
            />
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="block font-medium">Cover Image URL or Upload</label>
            <input
              type="text"
              value={newImage}
              onChange={(e) => setNewImage(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
            />
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-stone-300 dark:border-stone-700 rounded-md cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Cover</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => void handleUploadCover(e, 'new')}
                className="hidden"
              />
            </label>
          </div>

          <div className="space-y-1 text-xs">
            <label className="block font-medium">Display Order</label>
            <input
              type="number"
              value={newSortOrder}
              onChange={(e) => setNewSortOrder(e.target.value)}
              className="w-28 px-3 py-2 font-mono-tabular bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md"
            />
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className="w-full py-2.5 text-xs font-medium bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 rounded-md cursor-pointer disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Create Category'}
          </button>
        </form>

        <div className="lg:col-span-8 space-y-3">
          {loading && categories.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-500">Loading categories...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map((cat) => {
                const visible = cat.isVisible !== false;
                return (
                  <div
                    key={cat.slug}
                    className={`flex items-center justify-between gap-3 p-3.5 rounded-xl bg-white dark:bg-[#191816] border ${
                      visible
                        ? 'border-stone-200 dark:border-stone-800'
                        : 'border-dashed border-stone-300 dark:border-stone-700 opacity-75'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded overflow-hidden bg-stone-100 dark:bg-stone-800 shrink-0">
                        <ProductImage
                          src={cat.image}
                          alt={cat.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
                          {cat.name}
                        </p>
                        <p className="text-[11px] font-mono-tabular text-stone-500 dark:text-stone-400">
                          {cat.productCount} SKUs · Order #{cat.sortOrder ?? 0}
                        </p>
                        <p className="text-[10px] text-stone-400">
                          {visible ? 'Visible on storefront' : 'Hidden from storefront'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => void handleToggleVisibility(cat)}
                        title={visible ? 'Hide category' : 'Show category'}
                        className="p-1.5 rounded border border-stone-200 dark:border-stone-700 hover:border-stone-500 cursor-pointer"
                      >
                        {visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(cat)}
                        title="Edit category"
                        className="p-1.5 rounded border border-stone-200 dark:border-stone-700 hover:border-stone-500 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => startDelete(cat)}
                        title="Delete category"
                        className="p-1.5 rounded border border-stone-200 dark:border-stone-700 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Category Modal */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0" onClick={() => setEditing(null)} />
          <form
            onSubmit={handleSaveEdit}
            className="relative z-10 w-full max-w-lg rounded-xl bg-[#FAF9F6] dark:bg-[#141312] border border-stone-200 dark:border-stone-800 p-6 space-y-4 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h3 className="font-display text-2xl font-medium">Edit Category</h3>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="p-1 text-stone-400 hover:text-stone-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block font-medium mb-1">Category Name</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md"
              />
              <p className="text-[11px] text-stone-400 mt-1">
                Renaming automatically updates all {editing.productCount} assigned products.
              </p>
            </div>

            <div>
              <label className="block font-medium mb-1">Description</label>
              <textarea
                rows={3}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-medium">Cover Artwork</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editImage}
                  onChange={(e) => setEditImage(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md"
                />
                <label className="inline-flex items-center gap-1.5 px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-[#191816] cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(e) => void handleUploadCover(e, 'edit')}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="block font-medium mb-1">Sort Priority</label>
                <input
                  type="number"
                  value={editSortOrder}
                  onChange={(e) => setEditSortOrder(e.target.value)}
                  className="w-full px-3 py-2 font-mono-tabular bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md"
                />
              </div>
              <label className="inline-flex items-center gap-2 pt-5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editVisible}
                  onChange={(e) => setEditVisible(e.target.checked)}
                />
                <span>Visible on Storefront</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 border border-stone-300 dark:border-stone-700 rounded-md cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingEdit}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 rounded-md cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingEdit ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deletingCat)}
        title={`Delete "${deletingCat?.name || ''}"`}
        description={
          deletingCat && deletingCat.productCount > 0
            ? `This category currently holds ${deletingCat.productCount} products. Choose a destination category to reassign those products before deletion.`
            : 'Remove this category from the marketplace directory?'
        }
        confirmLabel="Delete Category"
        isBusy={isDeleting}
        onCancel={() => setDeletingCat(null)}
        onConfirm={() => void handleConfirmDelete()}
      >
        {deletingCat && deletingCat.productCount > 0 && (
          <div className="space-y-1 text-xs">
            <label className="block font-medium text-stone-700 dark:text-stone-300">
              Reassign products to:
            </label>
            <select
              value={reassignTarget}
              onChange={(e) => setReassignTarget(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md"
            >
              {categories
                .filter((c) => c.slug !== deletingCat.slug)
                .map((c) => (
                  <option key={c.slug} value={c.name}>
                    {c.name} ({c.productCount})
                  </option>
                ))}
            </select>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
