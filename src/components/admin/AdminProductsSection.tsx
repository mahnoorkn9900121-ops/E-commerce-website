import React, { useEffect, useState } from 'react';
import {
  Check,
  Download,
  Edit3,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { AVAILABLE_STUDIO_ASSETS, CATEGORY_DEFINITIONS } from '../../data/catalog.ts';
import type {
  CategorySummary,
  PaginatedProductsResponse,
  Product,
  ProductColorVariant,
  ProductSortOption,
} from '../../types/store.ts';
import { ProductImage } from '../ProductImage.tsx';
import { ConfirmDialog } from './ConfirmDialog.tsx';
import { adminFetch, formatCurrency, uploadAdminImage } from './adminApi.ts';

interface AdminProductsSectionProps {
  onCatalogMutated: () => void;
  showToast: (msg: string) => void;
  catalogVersion: number;
  externalAddTrigger?: number;
}

const SAMPLE_CSV = `name,brand,category,subcategory,price,compareAtPrice,stockCount,shortDescription,image
Sony Alpha A7C II Compact Full-Frame Camera,Sony,Cameras,Mirrorless Cameras,2198,2398,14,"Compact 33MP full-frame mirrorless camera with AI autofocus and 4K60 video.",/src/assets/images/product_mirrorless_camera_1794935886115.jpg
Nike Air Max 1 '86 OG Big Bubble,Nike,Shoes & Sneakers,Air Max & Lifestyle Sneakers,150,175,32,"Classic heritage Air Max runner with visible four-window Air unit.",/src/assets/images/product_carbon_runner_1794934149798.jpg`;

interface ProductFormState {
  id?: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  price: string;
  compareAtPrice: string;
  stockCount: string;
  shortDescription: string;
  description: string;
  image: string;
  imagesText: string;
  sizesText: string;
  colors: ProductColorVariant[];
  specsRows: Array<{ key: string; value: string }>;
  featured: boolean;
  isFlashSale: boolean;
  isTrending: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
}

const EMPTY_FORM: ProductFormState = {
  name: '',
  brand: 'MAISON KOVA',
  category: CATEGORY_DEFINITIONS[0].name,
  subcategory: 'Featured',
  price: '149',
  compareAtPrice: '',
  stockCount: '25',
  shortDescription: '',
  description: '',
  image: AVAILABLE_STUDIO_ASSETS[0],
  imagesText: AVAILABLE_STUDIO_ASSETS[0],
  sizesText: 'Standard',
  colors: [{ name: 'Obsidian', hex: '#1B1B1D' }],
  specsRows: [
    { key: 'Material', value: 'Studio Grade' },
    { key: 'Warranty', value: '2 Years' },
  ],
  featured: true,
  isFlashSale: false,
  isTrending: false,
  isBestSeller: false,
  isNewArrival: true,
};

export function AdminProductsSection({
  onCatalogMutated,
  showToast,
  catalogVersion,
  externalAddTrigger = 0,
}: AdminProductsSectionProps) {
  const [subMode, setSubMode] = useState<'list' | 'csv'>('list');
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState<ProductSortOption>('newest');
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [inlineDrafts, setInlineDrafts] = useState<
    Record<string, { price: string; stockCount: string }>
  >({});

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImg, setIsUploadingImg] = useState(false);

  // Confirm delete dialog
  const [deleteTarget, setDeleteTarget] = useState<{ mode: 'single'; product: Product } | { mode: 'bulk'; ids: string[] } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // CSV Import
  const [csvInput, setCsvInput] = useState(SAMPLE_CSV);
  const [isImportingCsv, setIsImportingCsv] = useState(false);

  useEffect(() => {
    adminFetch<{ categories: CategorySummary[] }>('/api/admin/categories')
      .then((res) => setCategories(res.categories))
      .catch(() => {
        // Handled globally if 401
      });
  }, [catalogVersion]);

  useEffect(() => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (search.trim()) sp.set('q', search.trim());
    if (categoryFilter !== 'All') sp.set('category', categoryFilter);
    sp.set('sort', sortBy);
    sp.set('page', String(page));
    sp.set('pageSize', '15');

    adminFetch<PaginatedProductsResponse>(`/api/admin/products?${sp.toString()}`)
      .then((data) => {
        setProducts(data.products);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setSelectedIds([]);
      })
      .catch((err) => {
        showToast(err instanceof Error ? err.message : 'Failed to load products.');
      })
      .finally(() => setLoading(false));
  }, [search, categoryFilter, sortBy, page, catalogVersion, showToast]);

  const openAddModal = () => {
    setForm({
      ...EMPTY_FORM,
      category: categories[0]?.name || CATEGORY_DEFINITIONS[0].name,
    });
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (externalAddTrigger > 0) {
      openAddModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalAddTrigger]);

  const openEditModal = (product: Product) => {
    const specsEntries = Object.entries(product.specs || {}).map(([key, value]) => ({
      key,
      value,
    }));
    setForm({
      id: product.id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      subcategory: product.subcategory,
      price: String(product.price),
      compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : '',
      stockCount: String(product.stockCount),
      shortDescription: product.shortDescription,
      description: product.description,
      image: product.image,
      imagesText: (product.images?.length ? product.images : [product.image]).join('\n'),
      sizesText: (product.sizes?.length ? product.sizes : ['Standard']).join(', '),
      colors:
        product.colors && product.colors.length > 0
          ? product.colors
          : [{ name: 'Obsidian', hex: '#1B1B1D' }],
      specsRows: specsEntries.length > 0 ? specsEntries : [{ key: 'Brand', value: product.brand }],
      featured: Boolean(product.featured),
      isFlashSale: Boolean(product.isFlashSale),
      isTrending: Boolean(product.isTrending),
      isBestSeller: Boolean(product.isBestSeller),
      isNewArrival: Boolean(product.isNewArrival),
    });
    setIsModalOpen(true);
  };

  const handleUploadImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImg(true);
    try {
      const url = await uploadAdminImage(file);
      setForm((prev) => ({
        ...prev,
        image: url,
        imagesText: [url, ...prev.imagesText.split(/\r?\n/).map((s) => s.trim()).filter((s) => s && s !== url)]
          .slice(0, 6)
          .join('\n'),
      }));
      showToast('Image uploaded to /uploads.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to upload image.');
    } finally {
      setIsUploadingImg(false);
      e.target.value = '';
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(form.price);
    const stockCount = Number(form.stockCount);
    const compareAtPrice = form.compareAtPrice.trim() ? Number(form.compareAtPrice) : undefined;
    if (!form.name.trim() || Number.isNaN(price) || price <= 0) {
      showToast('Enter a valid product name and price.');
      return;
    }

    const images = form.imagesText
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    const primaryImage = form.image.trim() || images[0] || AVAILABLE_STUDIO_ASSETS[0];
    const sizes = form.sizesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const specs: Record<string, string> = {};
    for (const row of form.specsRows) {
      if (row.key.trim() && row.value.trim()) {
        specs[row.key.trim()] = row.value.trim();
      }
    }
    const colors = form.colors.filter((c) => c.name.trim());

    setIsSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        brand: form.brand.trim() || 'MAISON KOVA',
        category: form.category.trim(),
        subcategory: form.subcategory.trim() || 'Featured',
        price,
        compareAtPrice,
        stockCount: Number.isNaN(stockCount) ? 10 : stockCount,
        shortDescription: form.shortDescription.trim() || `${form.brand} ${form.name}`,
        description: form.description.trim() || form.shortDescription.trim(),
        image: primaryImage,
        images: images.length ? images : [primaryImage],
        sizes: sizes.length ? sizes : ['Standard'],
        colors: colors.length ? colors : [{ name: 'Obsidian', hex: '#1B1B1D' }],
        specs,
        featured: form.featured,
        isFlashSale: form.isFlashSale,
        isTrending: form.isTrending,
        isBestSeller: form.isBestSeller,
        isNewArrival: form.isNewArrival,
      };

      const url = form.id
        ? `/api/admin/products/${encodeURIComponent(form.id)}`
        : '/api/admin/products';
      const method = form.id ? 'PUT' : 'POST';

      await adminFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      setIsModalOpen(false);
      onCatalogMutated();
      showToast(form.id ? 'Product updated in live catalog.' : 'New product created.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to save product.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInlineSave = async (product: Product) => {
    const draft = inlineDrafts[product.id];
    if (!draft) return;
    const price = Number(draft.price);
    const stockCount = Number(draft.stockCount);
    if (Number.isNaN(price) || price <= 0 || Number.isNaN(stockCount) || stockCount < 0) {
      showToast('Invalid price or stock count.');
      return;
    }

    try {
      await adminFetch(`/api/admin/products/${encodeURIComponent(product.id)}`, {
        method: 'PUT',
        body: JSON.stringify({ price, stockCount }),
      });
      setInlineDrafts((prev) => {
        const next = { ...prev };
        delete next[product.id];
        return next;
      });
      onCatalogMutated();
      showToast(`Updated ${product.name}.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save inline edits.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.mode === 'single') {
        await adminFetch(`/api/admin/products/${encodeURIComponent(deleteTarget.product.id)}`, {
          method: 'DELETE',
        });
        showToast(`Deleted ${deleteTarget.product.name}.`);
      } else {
        const res = await adminFetch<{ deletedCount: number }>('/api/admin/products/bulk-delete', {
          method: 'POST',
          body: JSON.stringify({ ids: deleteTarget.ids }),
        });
        showToast(`Deleted ${res.deletedCount} selected products.`);
        setSelectedIds([]);
      }
      setDeleteTarget(null);
      onCatalogMutated();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === products.length && products.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleImportCsv = async () => {
    if (!csvInput.trim()) return;
    setIsImportingCsv(true);
    try {
      const res = await adminFetch<{ importedCount: number; skippedCount: number }>(
        '/api/admin/products/import-csv',
        {
          method: 'POST',
          body: JSON.stringify({ csv: csvInput }),
        }
      );
      onCatalogMutated();
      showToast(`Imported ${res.importedCount} products into catalog.`);
      setSubMode('list');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'CSV import failed.');
    } finally {
      setIsImportingCsv(false);
    }
  };

  const handleUploadCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setCsvInput(reader.result);
    };
    reader.readAsText(file);
  };

  const handleDownloadCsvTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'maison-kova-products-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-medium text-stone-900 dark:text-stone-100">
            Product Management
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Create, edit, bulk delete, upload product media, manage variants, or import via CSV.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSubMode(subMode === 'list' ? 'csv' : 'list')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#191816] rounded-md hover:border-stone-500 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{subMode === 'csv' ? 'Back to Product Table' : 'Bulk CSV Import'}</span>
          </button>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 rounded-md cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {subMode === 'csv' ? (
        <div className="p-6 rounded-xl bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-xl font-medium text-stone-900 dark:text-stone-100">
                Bulk CSV Catalog Import
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Columns: name, brand, category, subcategory, price, compareAtPrice, stockCount, shortDescription, image
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownloadCsvTemplate}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-stone-300 dark:border-stone-700 rounded-md cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Template</span>
              </button>
              <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-stone-300 dark:border-stone-700 rounded-md cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Choose .CSV File</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleUploadCsvFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <textarea
            rows={10}
            value={csvInput}
            onChange={(e) => setCsvInput(e.target.value)}
            className="w-full p-3.5 font-mono text-xs bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A6B42]"
          />

          <button
            type="button"
            disabled={isImportingCsv}
            onClick={() => void handleImportCsv()}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 rounded-md cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isImportingCsv ? 'Importing...' : 'Import Products to SQLite'}</span>
          </button>
        </div>
      ) : (
        <>
          {/* Filter & Bulk Action Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search products by name, brand, SKU..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDeleteTarget({ mode: 'bulk', ids: selectedIds })}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-red-700 text-white hover:bg-red-800 rounded-md cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected ({selectedIds.length})</span>
                </button>
              )}

              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md cursor-pointer"
              >
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.name}>
                    {c.name} ({c.productCount})
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as ProductSortOption);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="popular">Best Selling</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>

              <span className="text-xs font-mono-tabular text-stone-500 dark:text-stone-400">
                {total.toLocaleString()} items
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#191816] overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  <th className="py-3 pl-4 pr-2 w-8">
                    <input
                      type="checkbox"
                      checked={products.length > 0 && selectedIds.length === products.length}
                      onChange={toggleSelectAll}
                      aria-label="Select all products on page"
                    />
                  </th>
                  <th className="py-3 px-3">Product</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Price ($)</th>
                  <th className="py-3 px-3">Stock</th>
                  <th className="py-3 px-3">Merchandising</th>
                  <th className="py-3 pr-4 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                {loading && products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-stone-500">
                      Loading catalog...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-stone-500">
                      No products matched your filter.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const draft = inlineDrafts[product.id];
                    const checked = selectedIds.includes(product.id);
                    return (
                      <tr
                        key={product.id}
                        className="hover:bg-[#FAF9F6] dark:hover:bg-stone-900/40"
                      >
                        <td className="py-3 pl-4 pr-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSelectOne(product.id)}
                            aria-label={`Select ${product.name}`}
                          />
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded overflow-hidden bg-stone-100 dark:bg-stone-800 shrink-0">
                              <ProductImage
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-stone-900 dark:text-stone-100 truncate max-w-[230px]">
                                {product.name}
                              </p>
                              <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate max-w-[230px]">
                                {product.brand} · {product.id}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-stone-600 dark:text-stone-300">
                          <p>{product.category}</p>
                          <p className="text-[11px] text-stone-400">{product.subcategory}</p>
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            min={1}
                            step="0.01"
                            value={draft ? draft.price : String(product.price)}
                            onChange={(e) =>
                              setInlineDrafts((prev) => ({
                                ...prev,
                                [product.id]: {
                                  price: e.target.value,
                                  stockCount:
                                    prev[product.id]?.stockCount ?? String(product.stockCount),
                                },
                              }))
                            }
                            aria-label={`Price for ${product.name}`}
                            className="w-20 px-2 py-1 font-mono-tabular bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded"
                          />
                          {product.compareAtPrice && (
                            <p className="text-[10px] font-mono-tabular line-through text-stone-400 mt-0.5">
                              {formatCurrency(product.compareAtPrice)}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            min={0}
                            value={draft ? draft.stockCount : String(product.stockCount)}
                            onChange={(e) =>
                              setInlineDrafts((prev) => ({
                                ...prev,
                                [product.id]: {
                                  price: prev[product.id]?.price ?? String(product.price),
                                  stockCount: e.target.value,
                                },
                              }))
                            }
                            aria-label={`Stock for ${product.name}`}
                            className="w-16 px-2 py-1 font-mono-tabular bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded"
                          />
                        </td>
                        <td className="py-3 px-3 text-[11px] text-stone-500 dark:text-stone-400">
                          {[
                            product.featured && 'Featured',
                            product.isFlashSale && 'Flash',
                            product.isTrending && 'Trending',
                            product.isBestSeller && 'Best',
                          ]
                            .filter(Boolean)
                            .join(' · ') || 'Standard'}
                        </td>
                        <td className="py-3 pr-4 pl-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {draft && (
                              <button
                                type="button"
                                onClick={() => void handleInlineSave(product)}
                                title="Save inline changes"
                                className="p-1.5 rounded bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openEditModal(product)}
                              aria-label={`Edit ${product.name}`}
                              className="p-1.5 rounded border border-stone-300 dark:border-stone-700 hover:border-stone-500 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget({ mode: 'single', product })}
                              aria-label={`Delete ${product.name}`}
                              className="p-1.5 rounded border border-stone-300 dark:border-stone-700 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-xs font-mono-tabular text-stone-500">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-stone-300 dark:border-stone-700 rounded disabled:opacity-40 cursor-pointer"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 border border-stone-300 dark:border-stone-700 rounded disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />
          <form
            onSubmit={handleSaveProduct}
            className="relative z-10 w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-[#FAF9F6] dark:bg-[#141312] rounded-xl border border-stone-200 dark:border-stone-800 p-6 space-y-5 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h3 className="font-display text-2xl font-medium">
                {form.id ? 'Edit Product' : 'Create New Product'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-medium mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Brand</label>
                <input
                  type="text"
                  required
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md"
                >
                  {categories.map((c) => (
                    <option key={c.slug} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Subcategory</label>
                <input
                  type="text"
                  value={form.subcategory}
                  onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Stock Count</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={form.stockCount}
                  onChange={(e) => setForm({ ...form, stockCount: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md font-mono-tabular"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Price (USD)</label>
                <input
                  type="number"
                  min={1}
                  step="0.01"
                  required
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md font-mono-tabular"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Compare-At / Original Price</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.compareAtPrice}
                  onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })}
                  placeholder="Optional markdown anchor"
                  className="w-full px-3 py-2 bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md font-mono-tabular"
                />
              </div>

              {/* Primary Image + Upload */}
              <div className="sm:col-span-2 space-y-2">
                <label className="block font-medium">Primary Image URL & Server Upload</label>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="w-10 h-10 rounded overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shrink-0">
                    <ProductImage src={form.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <input
                    type="text"
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    className="flex-1 min-w-[200px] px-3 py-2 bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md"
                  />
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-[#191816] hover:border-stone-500 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingImg ? 'Uploading...' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={(e) => void handleUploadImageFile(e)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium mb-1">Gallery Image URLs (one per line)</label>
                <textarea
                  rows={2}
                  value={form.imagesText}
                  onChange={(e) => setForm({ ...form, imagesText: e.target.value })}
                  className="w-full px-3 py-2 font-mono text-[11px] bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Sizes / Editions (comma-separated)</label>
                <input
                  type="text"
                  value={form.sizesText}
                  onChange={(e) => setForm({ ...form, sizesText: e.target.value })}
                  placeholder="S, M, L or 256GB, 512GB"
                  className="w-full px-3 py-2 bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Short Summary</label>
                <input
                  type="text"
                  required
                  value={form.shortDescription}
                  onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium mb-1">Full Editorial Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-[#191816] border border-stone-300 dark:border-stone-700 rounded-md"
                />
              </div>

              {/* Color Variants */}
              <div className="sm:col-span-2 p-3.5 rounded-lg bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Color Variants</span>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        colors: [...prev.colors, { name: 'Stone', hex: '#A8A29E' }],
                      }))
                    }
                    className="text-[11px] font-medium text-[#9A6B42] dark:text-[#C89B6E] hover:underline cursor-pointer"
                  >
                    + Add Color
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {form.colors.map((col, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="color"
                        value={col.hex}
                        onChange={(e) => {
                          const next = [...form.colors];
                          next[idx] = { ...next[idx], hex: e.target.value };
                          setForm({ ...form, colors: next });
                        }}
                        className="w-8 h-8 rounded border border-stone-300 dark:border-stone-700 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={col.name}
                        onChange={(e) => {
                          const next = [...form.colors];
                          next[idx] = { ...next[idx], name: e.target.value };
                          setForm({ ...form, colors: next });
                        }}
                        placeholder="Color name"
                        className="flex-1 px-2.5 py-1.5 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded"
                      />
                      {form.colors.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setForm({
                              ...form,
                              colors: form.colors.filter((_, i) => i !== idx),
                            })
                          }
                          className="p-1 text-stone-400 hover:text-red-600 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="sm:col-span-2 p-3.5 rounded-lg bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Technical Specifications</span>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        specsRows: [...prev.specsRows, { key: '', value: '' }],
                      }))
                    }
                    className="text-[11px] font-medium text-[#9A6B42] dark:text-[#C89B6E] hover:underline cursor-pointer"
                  >
                    + Add Spec
                  </button>
                </div>
                <div className="space-y-2">
                  {form.specsRows.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={row.key}
                        onChange={(e) => {
                          const next = [...form.specsRows];
                          next[idx] = { ...next[idx], key: e.target.value };
                          setForm({ ...form, specsRows: next });
                        }}
                        placeholder="Attribute (e.g. Weight)"
                        className="w-1/3 px-2.5 py-1.5 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded"
                      />
                      <input
                        type="text"
                        value={row.value}
                        onChange={(e) => {
                          const next = [...form.specsRows];
                          next[idx] = { ...next[idx], value: e.target.value };
                          setForm({ ...form, specsRows: next });
                        }}
                        placeholder="Value (e.g. 240g)"
                        className="flex-1 px-2.5 py-1.5 bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            specsRows: form.specsRows.filter((_, i) => i !== idx),
                          })
                        }
                        className="p-1 text-stone-400 hover:text-red-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Merchandising Flags */}
              <div className="sm:col-span-2 flex flex-wrap gap-4 pt-1">
                {(
                  [
                    ['featured', 'Featured Product'],
                    ['isFlashSale', 'Flash Sale'],
                    ['isTrending', 'Trending'],
                    ['isBestSeller', 'Best Seller'],
                    ['isNewArrival', 'New Arrival'],
                  ] as const
                ).map(([field, label]) => (
                  <label key={field} className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form[field]}
                      onChange={(e) => setForm({ ...form, [field]: e.target.checked })}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-medium border border-stone-300 dark:border-stone-700 rounded-md cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 text-xs font-medium bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 rounded-md cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : form.id ? 'Save Product Changes' : 'Publish Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={
          deleteTarget?.mode === 'bulk'
            ? `Delete ${deleteTarget.ids.length} Products`
            : 'Delete Product'
        }
        description={
          deleteTarget?.mode === 'bulk'
            ? `Are you sure you want to permanently remove ${deleteTarget.ids.length} selected products from the catalog and search index?`
            : deleteTarget?.mode === 'single'
              ? `Permanently delete "${deleteTarget.product.name}" from the catalog? This action cannot be undone.`
              : ''
        }
        confirmLabel="Delete"
        isBusy={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  );
}
