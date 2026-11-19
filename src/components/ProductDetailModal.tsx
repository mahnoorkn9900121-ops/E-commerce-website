import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Heart,
  Minus,
  Plus,
  Scale,
  ShoppingBag,
  Star,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../context/StoreContext.tsx';
import { getDiscountPercentage } from '../lib/searchProducts.ts';
import type { Product } from '../types/store.ts';
import { ProductImage } from './ProductImage.tsx';

export function ProductDetailModal() {
  const {
    activeProduct,
    closeProductDetail,
    addToCart,
    toggleWishlist,
    isWishlisted,
    toggleCompare,
    isCompared,
    openProductDetail,
    openCategory,
    openSearch,
    setIsCartOpen,
    profile,
    showToast,
  } = useStore();

  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [related, setRelated] = useState<Product[]>([]);
  const [hydratedProduct, setHydratedProduct] = useState<Product | null>(null);
  const [reviewAuthor, setReviewAuthor] = useState(profile.fullName || '');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmittedNotice, setReviewSubmittedNotice] = useState(false);

  useEffect(() => {
    if (!activeProduct) {
      setHydratedProduct(null);
      setRelated([]);
      return;
    }

    setHydratedProduct(activeProduct);
    setSelectedColor(activeProduct.colors[0]?.name || 'Standard');
    setSelectedSize(activeProduct.sizes[0] || 'One Size');
    setQuantity(1);
    setSelectedImageIdx(0);

    const controller = new AbortController();
    fetch(`/api/products/${encodeURIComponent(activeProduct.slug || activeProduct.id)}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { product?: Product; related?: Product[] } | null) => {
        if (data?.product) setHydratedProduct(data.product);
        if (Array.isArray(data?.related)) setRelated(data.related.slice(0, 3));
      })
      .catch(() => {
        // Ignore network errors / aborts
      });

    return () => controller.abort();
  }, [activeProduct]);

  useEffect(() => {
    if (!activeProduct) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeProductDetail();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeProduct, closeProductDetail]);

  const product = hydratedProduct || activeProduct;
  if (!product) return null;

  const galleryImages =
    product.images && product.images.length > 0 ? product.images : [product.image];
  const currentHeroImage = galleryImages[selectedImageIdx] || product.image;
  const discount = getDiscountPercentage(product);
  const wishlisted = isWishlisted(product.id);
  const compared = isCompared(product.id);

  const handleAddToBag = () => {
    addToCart(product, selectedColor, selectedSize, quantity);
    closeProductDetail();
    setIsCartOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    setIsSubmittingReview(true);
    try {
      const res = await fetch(
        `/api/products/${encodeURIComponent(product.slug || product.id)}/reviews`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            author: reviewAuthor.trim() || 'Marketplace Client',
            rating: reviewRating,
            comment: reviewComment.trim(),
          }),
        }
      );
      if (!res.ok) throw new Error('Unable to submit review.');
      setReviewComment('');
      setReviewSubmittedNotice(true);
      showToast('Review submitted for moderation.');
    } catch {
      showToast('Unable to submit review right now.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-xs"
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
      >
        <div className="absolute inset-0" onClick={closeProductDetail} />

        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 w-full max-w-5xl max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto bg-[#FAF9F6] dark:bg-[#141312] sm:rounded-xl border border-stone-200 dark:border-stone-800 shadow-2xl"
        >
          {/* Sticky Modal Header with Breadcrumbs */}
          <div className="sticky top-0 z-20 flex items-center justify-between gap-4 px-6 py-4 bg-[#FAF9F6]/95 dark:bg-[#141312]/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400 truncate">
              <button
                type="button"
                onClick={() => {
                  closeProductDetail();
                  openCategory(product.category);
                }}
                className="hover:text-stone-900 dark:hover:text-stone-100 underline-offset-4 hover:underline cursor-pointer"
              >
                {product.category}
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => {
                  closeProductDetail();
                  openCategory(product.category, product.subcategory);
                }}
                className="hover:text-stone-900 dark:hover:text-stone-100 underline-offset-4 hover:underline cursor-pointer"
              >
                {product.subcategory}
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => {
                  closeProductDetail();
                  openSearch('', { brand: product.brand });
                }}
                className="font-semibold text-stone-800 dark:text-stone-200 hover:underline cursor-pointer"
              >
                {product.brand}
              </button>
            </div>
            <button
              type="button"
              onClick={closeProductDetail}
              aria-label="Close product details"
              className="p-2 rounded-md text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-100 hover:bg-stone-200/70 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              {/* Left: Multi-Image Gallery */}
              <div className="lg:col-span-7 space-y-3">
                <div className="aspect-[4/3] w-full rounded-lg overflow-hidden bg-[#EFECE6] dark:bg-[#22211E] border border-stone-200/80 dark:border-stone-800">
                  <ProductImage
                    src={currentHeroImage}
                    alt={product.name}
                    title={product.name}
                    priority
                    className="w-full h-full object-cover object-center"
                  />
                </div>

                {galleryImages.length > 1 && (
                  <div className="flex gap-2.5 overflow-x-auto pb-1">
                    {galleryImages.map((imgUrl, idx) => (
                      <button
                        key={`${imgUrl}-${idx}`}
                        type="button"
                        onClick={() => setSelectedImageIdx(idx)}
                        aria-label={`View image ${idx + 1} of ${product.name}`}
                        className={`w-20 aspect-[4/3] rounded-md overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                          selectedImageIdx === idx
                            ? 'border-[#9A6B42] dark:border-[#C89B6E]'
                            : 'border-stone-200 dark:border-stone-800 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <ProductImage
                          src={imgUrl}
                          alt={`${product.name} view ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Purchase Module */}
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      closeProductDetail();
                      openSearch('', { brand: product.brand });
                    }}
                    className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9A6B42] dark:text-[#C89B6E] hover:underline cursor-pointer mb-1.5 block"
                  >
                    {product.brand} Official Store
                  </button>
                  <h2 className="font-display text-3xl font-medium text-stone-900 dark:text-stone-100 leading-tight mb-2">
                    {product.name}
                  </h2>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 dark:text-stone-400 mb-4">
                    <span className="inline-flex items-center gap-1 font-mono-tabular text-stone-900 dark:text-stone-100 font-medium">
                      <Star className="w-3.5 h-3.5 fill-[#9A6B42] text-[#9A6B42] dark:fill-[#C89B6E] dark:text-[#C89B6E]" />
                      {product.rating.toFixed(1)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{product.reviewCount} verified reviews</span>
                    {typeof product.soldCount === 'number' && product.soldCount > 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-tabular">
                          {product.soldCount.toLocaleString()} sold
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-baseline gap-3 font-mono-tabular">
                    <span className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
                      ${product.price.toLocaleString()}
                    </span>
                    {product.compareAtPrice && (
                      <>
                        <span className="text-base text-stone-400 line-through">
                          ${product.compareAtPrice.toLocaleString()}
                        </span>
                        <span className="text-xs font-medium text-[#9A6B42] dark:text-[#C89B6E]">
                          Save {discount}%
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                  {product.description}
                </p>

                <div className="flex items-center gap-2 text-xs font-medium">
                  {product.inStock ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                      <span className="text-emerald-800 dark:text-emerald-300">
                        In Stock — {product.stockCount} available for immediate dispatch
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                      <span className="text-amber-800 dark:text-amber-300">
                        Currently Out of Stock — Next Restock Scheduled
                      </span>
                    </>
                  )}
                </div>

                {product.colors.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-stone-700 dark:text-stone-300 mb-2">
                      Color / Finish:{' '}
                      <span className="text-stone-900 dark:text-stone-100">{selectedColor}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map((color) => {
                        const active = selectedColor === color.name;
                        return (
                          <button
                            key={color.name}
                            type="button"
                            onClick={() => setSelectedColor(color.name)}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-md border transition-colors cursor-pointer ${
                              active
                                ? 'border-stone-900 dark:border-stone-100 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium'
                                : 'border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-500'
                            }`}
                          >
                            <span
                              className="w-3 h-3 rounded-full border border-black/15"
                              style={{ backgroundColor: color.hex }}
                            />
                            <span>{color.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {product.sizes.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-stone-700 dark:text-stone-300 mb-2">
                      Size / Variant
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((size) => {
                        const active = selectedSize === size;
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setSelectedSize(size)}
                            className={`px-3.5 py-2 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                              active
                                ? 'bg-stone-900 text-stone-50 border-stone-900 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100'
                                : 'border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-stone-500'
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <div className="inline-flex items-center border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-[#191816]">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      aria-label="Decrease quantity"
                      className="p-3 text-stone-700 dark:text-stone-300 hover:text-stone-900 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-sm font-mono-tabular font-medium text-stone-900 dark:text-stone-100">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity((q) => Math.min(Math.max(1, product.stockCount), q + 1))
                      }
                      aria-label="Increase quantity"
                      className="p-3 text-stone-700 dark:text-stone-300 hover:text-stone-900 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={!product.inStock}
                    onClick={handleAddToBag}
                    className={`flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                      product.inStock
                        ? 'bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 cursor-pointer'
                        : 'bg-stone-200 text-stone-500 dark:bg-stone-800 dark:text-stone-500 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{product.inStock ? 'Add to Bag' : 'Out of Stock'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleCompare(product.id, product)}
                    aria-pressed={compared}
                    aria-label={compared ? 'Remove from comparison' : 'Add to comparison'}
                    className={`p-3 rounded-md border transition-colors cursor-pointer ${
                      compared
                        ? 'border-stone-900 bg-stone-900 text-stone-50 dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900'
                        : 'border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:border-stone-500'
                    }`}
                  >
                    <Scale className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleWishlist(product.id, product)}
                    aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                    className="p-3 rounded-md border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:border-stone-500 transition-colors cursor-pointer"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        wishlisted
                          ? 'fill-[#9A6B42] text-[#9A6B42] dark:fill-[#C89B6E] dark:text-[#C89B6E]'
                          : ''
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Specifications & Reviews */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12 pt-10 border-t border-stone-200 dark:border-stone-800">
              <div className="lg:col-span-6">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-stone-900 dark:text-stone-100 mb-4">
                  Technical Specifications
                </h3>
                <dl className="divide-y divide-stone-200 dark:divide-stone-800 border-y border-stone-200 dark:border-stone-800">
                  {Object.entries(product.specs).map(([key, val]) => (
                    <div key={key} className="py-3 flex justify-between gap-4 text-sm">
                      <dt className="text-stone-500 dark:text-stone-400 shrink-0">{key}</dt>
                      <dd className="text-stone-900 dark:text-stone-100 text-right font-medium">
                        {val}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="lg:col-span-6 space-y-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-stone-900 dark:text-stone-100">
                  Customer Reviews ({product.reviewCount})
                </h3>
                <div className="space-y-3">
                  {product.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-4 rounded-lg bg-white dark:bg-[#191816] border border-stone-200/80 dark:border-stone-800"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs text-stone-500 dark:text-stone-400 mb-2">
                        <span>
                          <strong className="text-stone-900 dark:text-stone-100 font-medium">
                            {review.author}
                          </strong>{' '}
                          · {review.role}
                        </span>
                        <span className="font-mono-tabular">
                          {review.rating}.0 ★ · {review.date}
                        </span>
                      </div>
                      <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                        {review.comment}
                      </p>
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={handleSubmitReview}
                  className="p-4 rounded-lg bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 space-y-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-900 dark:text-stone-100">
                    Write a Verified Review
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      value={reviewAuthor}
                      onChange={(e) => setReviewAuthor(e.target.value)}
                      placeholder="Your name"
                      className="px-3 py-2 text-xs bg-[#FAF9F6] dark:bg-[#121110] border border-stone-300 dark:border-stone-700 rounded-md"
                    />
                    <select
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      aria-label="Rating"
                      className="px-3 py-2 text-xs bg-[#FAF9F6] dark:bg-[#121110] border border-stone-300 dark:border-stone-700 rounded-md cursor-pointer"
                    >
                      {[5, 4, 3, 2, 1].map((r) => (
                        <option key={r} value={r}>
                          {r} Stars
                        </option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    rows={2}
                    required
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience with fit, materials, or performance..."
                    className="w-full px-3 py-2 text-xs bg-[#FAF9F6] dark:bg-[#121110] border border-stone-300 dark:border-stone-700 rounded-md"
                  />
                  <div className="flex items-center justify-between gap-3">
                    {reviewSubmittedNotice ? (
                      <span className="text-xs text-emerald-700 dark:text-emerald-400">
                        Submitted — awaiting admin approval.
                      </span>
                    ) : (
                      <span className="text-[11px] text-stone-500 dark:text-stone-400">
                        Moderated before publication
                      </span>
                    )}
                    <button
                      type="submit"
                      disabled={isSubmittingReview || !reviewComment.trim()}
                      className="px-4 py-1.5 text-xs font-medium bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 rounded-md disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {related.length > 0 && (
              <div className="mt-12 pt-10 border-t border-stone-200 dark:border-stone-800">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-stone-900 dark:text-stone-100 mb-5">
                  Related Products in {product.category}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {related.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openProductDetail(item)}
                      className="group text-left bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 rounded-lg overflow-hidden hover:border-stone-400 dark:hover:border-stone-600 transition-colors cursor-pointer"
                    >
                      <div className="aspect-[4/3] bg-[#EFECE6] dark:bg-[#22211E] overflow-hidden">
                        <ProductImage
                          src={item.image}
                          alt={item.name}
                          title={item.name}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
                        />
                      </div>
                      <div className="p-3.5">
                        <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                          {item.brand}
                        </p>
                        <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                          {item.name}
                        </p>
                        <p className="text-xs font-mono-tabular text-stone-600 dark:text-stone-400 mt-1">
                          ${item.price.toLocaleString()}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
