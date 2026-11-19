import type { Product } from '../types/store.ts';

export function getDiscountPercentage(product: Pick<Product, 'price' | 'compareAtPrice'>): number | null {
  if (!product.compareAtPrice || product.compareAtPrice <= product.price) {
    return null;
  }
  return Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100);
}

export function slugifyCategory(categoryName: string): string {
  return categoryName
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
