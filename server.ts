import 'dotenv/config';
import crypto from 'crypto';
import express, { type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { STORE_POLICIES } from './src/data/catalog.ts';
import type {
  AiChatbotConfig,
  OrderRecord,
  OrderStatus,
  PaymentStatus,
  ProductSortOption,
  ReviewModerationStatus,
} from './src/types/store.ts';
import {
  changeAdminPassword,
  clearAdminSessionCookie,
  ensureInitialAdminUser,
  extractAdminToken,
  getAdminSession,
  loginAdmin,
  logoutAdminSession,
  requireAdminAuth,
  setAdminSessionCookie,
  type AuthenticatedAdminRequest,
} from './server/adminAuth.ts';
import {
  clearConciergeCache,
  runAIConcierge,
  streamAIConcierge,
  type IncomingChatTurn,
} from './server/aiConcierge.ts';
import {
  adjustProductStockInDb,
  bulkDeleteProductsInDb,
  bulkImportProductsFromCsv,
  createProductInDb,
  deleteCategoryInDb,
  deleteCustomerInDb,
  deleteProductInDb,
  deleteReviewInDb,
  getAdminAnalyticsFromDb,
  getAdminStatsFromDb,
  getAiSettingsFromDb,
  getCatalogStats,
  getCustomerDetailFromDb,
  getDb,
  getFullCmsPayload,
  getMarketplaceHomePayload,
  getProductBySlugOrId,
  getProductsByIds,
  listCategories,
  listChatLogsFromDb,
  listCustomersFromDb,
  listInventoryFromDb,
  listOrdersFromDb,
  listReviewsFromDb,
  listStockAdjustmentsFromDb,
  queryProducts,
  saveOrderToDb,
  submitProductReviewInDb,
  suggestProducts,
  updateAiSettingsInDb,
  updateCategoryInDb,
  updateCmsSectionInDb,
  updateCustomerStatusInDb,
  updateOrderStatusInDb,
  updateProductInDb,
  updateReviewStatusInDb,
  upsertCategoryInDb,
  type AdminProductInput,
  type CmsSectionKey,
} from './server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Initialize SQLite database, seed catalog, and ensure default admin user exists
  getDb();
  ensureInitialAdminUser();

  const uploadsDir = path.resolve(process.cwd(), 'data', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const app = express();
  const port = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '8mb' }));
  app.use('/uploads', express.static(uploadsDir));

  // ============================================================
  // Public Storefront & Catalog Endpoints
  // ============================================================

  app.get('/api/health', (_req: Request, res: Response) => {
    const stats = getCatalogStats();
    res.json({
      status: 'ok',
      store: STORE_POLICIES.brandName,
      totalProducts: stats.totalProducts,
      totalCategories: stats.totalCategories,
    });
  });

  app.get('/api/storefront/bootstrap', (_req: Request, res: Response) => {
    const cms = getFullCmsPayload();
    const categories = listCategories(false);
    const aiFull = getAiSettingsFromDb();
    res.json({
      cms,
      categories,
      ai: {
        enabled: aiFull.enabled,
        welcomeMessage: aiFull.welcomeMessage,
        suggestedPrompts: aiFull.suggestedPrompts,
      },
    });
  });

  app.get('/api/store-info', (_req: Request, res: Response) => {
    const stats = getCatalogStats();
    const categories = listCategories(false);
    res.json({
      categories,
      policies: STORE_POLICIES,
      ...stats,
    });
  });

  app.get('/api/marketplace/home', (_req: Request, res: Response) => {
    res.json(getMarketplaceHomePayload());
  });

  app.get('/api/categories', (_req: Request, res: Response) => {
    res.json({ categories: listCategories(false) });
  });

  app.get('/api/products/suggest', (req: Request, res: Response) => {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    res.json(suggestProducts(q));
  });

  app.post('/api/products/batch', (req: Request, res: Response) => {
    const body = req.body as { ids?: string[] };
    const ids = Array.isArray(body?.ids) ? body.ids.filter((id) => typeof id === 'string') : [];
    res.json({ products: getProductsByIds(ids) });
  });

  app.get('/api/products', (req: Request, res: Response) => {
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const subcategory =
      typeof req.query.subcategory === 'string' ? req.query.subcategory : undefined;
    const brand = typeof req.query.brand === 'string' ? req.query.brand : undefined;
    const color = typeof req.query.color === 'string' ? req.query.color : undefined;
    const minPrice =
      typeof req.query.minPrice === 'string' && req.query.minPrice !== ''
        ? Number(req.query.minPrice)
        : undefined;
    const maxPrice =
      typeof req.query.maxPrice === 'string' && req.query.maxPrice !== ''
        ? Number(req.query.maxPrice)
        : undefined;
    const minRating =
      typeof req.query.minRating === 'string' && req.query.minRating !== ''
        ? Number(req.query.minRating)
        : undefined;
    const onSaleOnly = req.query.onSale === 'true';
    const flashSaleOnly = req.query.flashSale === 'true';
    const inStockOnly = req.query.inStockOnly === 'true';
    const sortBy =
      typeof req.query.sort === 'string'
        ? (req.query.sort as ProductSortOption)
        : 'featured';
    const page =
      typeof req.query.page === 'string' && req.query.page !== ''
        ? Number(req.query.page)
        : 1;
    const pageSize =
      typeof req.query.pageSize === 'string' && req.query.pageSize !== ''
        ? Number(req.query.pageSize)
        : 24;

    const paginated = queryProducts({
      q,
      category,
      subcategory,
      brand,
      color,
      minPrice,
      maxPrice,
      minRating,
      onSaleOnly,
      flashSaleOnly,
      inStockOnly,
      sortBy,
      page,
      pageSize,
    });

    res.json(paginated);
  });

  app.get('/api/products/:slug', (req: Request, res: Response) => {
    const slug = String(req.params.slug || '');
    const result = getProductBySlugOrId(slug);
    if (!result) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    res.json(result);
  });

  app.post('/api/products/:slug/reviews', (req: Request, res: Response) => {
    const slug = String(req.params.slug || '');
    const body = req.body as { author?: string; rating?: number; comment?: string };
    if (!body?.comment?.trim() || typeof body.rating !== 'number') {
      res.status(400).json({ error: 'Review rating and comment are required.' });
      return;
    }
    const created = submitProductReviewInDb(slug, {
      author: body.author?.trim() || 'Marketplace Client',
      rating: body.rating,
      comment: body.comment.trim(),
    });
    if (!created) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    res.status(201).json({ review: created });
  });

  // Persistent Order Checkout API (POST open for customers; GET protected for admin)
  app.post('/api/orders', (req: Request, res: Response) => {
    try {
      const order = req.body as OrderRecord;
      if (!order?.orderNumber || !Array.isArray(order.items) || order.items.length === 0) {
        res.status(400).json({ error: 'Invalid order payload.' });
        return;
      }
      const saved = saveOrderToDb(order);
      clearConciergeCache();
      res.status(201).json({ order: saved });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Unable to save order.' });
    }
  });

  app.get('/api/orders', requireAdminAuth, (_req: Request, res: Response) => {
    res.json({ orders: listOrdersFromDb() });
  });

  // ============================================================
  // Admin Authentication Endpoints
  // ============================================================

  app.post('/api/admin/auth/login', (req: Request, res: Response) => {
    const body = req.body as { email?: string; password?: string };
    if (!body?.email?.trim() || !body?.password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }
    const result = loginAdmin(body.email, body.password);
    if (!result) {
      res.status(401).json({ error: 'Invalid administrator email or password.' });
      return;
    }
    setAdminSessionCookie(req, res, result.token);
    res.json({ authenticated: true, user: result.user, sessionToken: result.token });
  });

  app.post('/api/admin/auth/logout', (req: Request, res: Response) => {
    logoutAdminSession(extractAdminToken(req));
    clearAdminSessionCookie(req, res);
    res.json({ authenticated: false });
  });

  app.get('/api/admin/auth/me', (req: Request, res: Response) => {
    const user = getAdminSession(extractAdminToken(req));
    if (!user) {
      res.status(401).json({ authenticated: false, error: 'Not authenticated.' });
      return;
    }
    res.json({ authenticated: true, user });
  });

  app.post(
    '/api/admin/auth/password',
    requireAdminAuth,
    (req: AuthenticatedAdminRequest, res: Response) => {
      const body = req.body as { currentPassword?: string; newPassword?: string };
      if (!body?.currentPassword || !body?.newPassword) {
        res.status(400).json({ error: 'Current password and new password are required.' });
        return;
      }
      if (!req.adminUser) {
        res.status(401).json({ error: 'Admin authentication required.' });
        return;
      }
      const result = changeAdminPassword(
        req.adminUser.id,
        body.currentPassword,
        body.newPassword,
        req.adminSessionToken
      );
      if (!result.ok) {
        res.status(400).json({ error: result.error });
        return;
      }
      res.json({ updated: true });
    }
  );

  // ============================================================
  // Protected Admin Dashboard Endpoints (/api/admin/*)
  // ============================================================

  app.get('/api/admin/stats', requireAdminAuth, (_req: Request, res: Response) => {
    res.json(getAdminStatsFromDb());
  });

  app.get('/api/admin/overview', requireAdminAuth, (_req: Request, res: Response) => {
    res.json(getAdminAnalyticsFromDb());
  });

  app.post('/api/admin/upload', requireAdminAuth, (req: Request, res: Response) => {
    try {
      const body = req.body as { filename?: string; dataUrl?: string };
      if (!body?.dataUrl || typeof body.dataUrl !== 'string') {
        res.status(400).json({ error: 'Image dataUrl is required.' });
        return;
      }
      const match = body.dataUrl.match(/^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,(.+)$/i);
      if (!match) {
        res.status(400).json({ error: 'Unsupported image format. Use PNG, JPEG, WebP, or GIF.' });
        return;
      }
      const mime = match[1].toLowerCase();
      const buffer = Buffer.from(match[2], 'base64');
      if (buffer.byteLength > 3 * 1024 * 1024) {
        res.status(400).json({ error: 'Image size must be 3 MB or less.' });
        return;
      }
      const extMap: Record<string, string> = {
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/webp': 'webp',
        'image/gif': 'gif',
      };
      const ext = extMap[mime] || 'jpg';
      const fileName = `mk-${crypto.randomUUID()}.${ext}`;
      const fullPath = path.join(uploadsDir, fileName);
      fs.writeFileSync(fullPath, buffer);
      res.status(201).json({ url: `/uploads/${fileName}` });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Upload failed.' });
    }
  });

  // Admin Products CRUD & Bulk Operations
  app.get('/api/admin/products', requireAdminAuth, (req: Request, res: Response) => {
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const sortBy =
      typeof req.query.sort === 'string'
        ? (req.query.sort as ProductSortOption)
        : 'newest';
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    res.json(queryProducts({ q, category, sortBy, page, pageSize }));
  });

  app.post('/api/admin/products', requireAdminAuth, (req: Request, res: Response) => {
    try {
      const input = req.body as AdminProductInput;
      if (!input?.name || typeof input.price !== 'number' || !input.category) {
        res.status(400).json({ error: 'Product name, category, and valid price are required.' });
        return;
      }
      const product = createProductInDb(input);
      clearConciergeCache();
      res.status(201).json({ product });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Unable to create product.' });
    }
  });

  app.put('/api/admin/products/:id', requireAdminAuth, (req: Request, res: Response) => {
    try {
      const id = String(req.params.id || '');
      const updated = updateProductInDb(id, req.body as Partial<AdminProductInput>);
      if (!updated) {
        res.status(404).json({ error: 'Product not found.' });
        return;
      }
      clearConciergeCache();
      res.json({ product: updated });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Unable to update product.' });
    }
  });

  app.delete('/api/admin/products/:id', requireAdminAuth, (req: Request, res: Response) => {
    const id = String(req.params.id || '');
    const deleted = deleteProductInDb(id);
    if (!deleted) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    clearConciergeCache();
    res.json({ deleted: true, id });
  });

  app.post('/api/admin/products/bulk-delete', requireAdminAuth, (req: Request, res: Response) => {
    const body = req.body as { ids?: string[] };
    if (!Array.isArray(body?.ids) || body.ids.length === 0) {
      res.status(400).json({ error: 'Product IDs array is required.' });
      return;
    }
    const deletedCount = bulkDeleteProductsInDb(body.ids);
    clearConciergeCache();
    res.json({ deletedCount });
  });

  app.post('/api/admin/products/import-csv', requireAdminAuth, (req: Request, res: Response) => {
    try {
      const body = req.body as { csv?: string };
      if (!body?.csv || typeof body.csv !== 'string') {
        res.status(400).json({ error: 'CSV text payload is required.' });
        return;
      }
      const result = bulkImportProductsFromCsv(body.csv);
      clearConciergeCache();
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Unable to parse CSV.' });
    }
  });

  // Admin Categories Management
  app.get('/api/admin/categories', requireAdminAuth, (_req: Request, res: Response) => {
    res.json({ categories: listCategories(true) });
  });

  app.post('/api/admin/categories', requireAdminAuth, (req: Request, res: Response) => {
    const body = req.body as {
      name?: string;
      description?: string;
      image?: string;
      sortOrder?: number;
      isVisible?: boolean;
    };
    if (!body?.name?.trim()) {
      res.status(400).json({ error: 'Category name is required.' });
      return;
    }
    const category = upsertCategoryInDb({
      name: body.name,
      description: body.description,
      image: body.image,
      sortOrder: body.sortOrder,
      isVisible: body.isVisible,
    });
    clearConciergeCache();
    res.status(201).json({ category });
  });

  app.put('/api/admin/categories/:slug', requireAdminAuth, (req: Request, res: Response) => {
    const slug = String(req.params.slug || '');
    const body = req.body as {
      name?: string;
      description?: string;
      image?: string;
      sortOrder?: number;
      isVisible?: boolean;
    };
    const category = updateCategoryInDb(slug, body);
    if (!category) {
      res.status(404).json({ error: 'Category not found.' });
      return;
    }
    clearConciergeCache();
    res.json({ category });
  });

  app.delete('/api/admin/categories/:slug', requireAdminAuth, (req: Request, res: Response) => {
    try {
      const slug = String(req.params.slug || '');
      const reassignTo =
        typeof req.query.reassignTo === 'string' ? req.query.reassignTo : undefined;
      const deleted = deleteCategoryInDb(slug, reassignTo);
      clearConciergeCache();
      res.json({ deleted });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Unable to delete category.' });
    }
  });

  // Admin Orders Management
  app.get('/api/admin/orders', requireAdminAuth, (_req: Request, res: Response) => {
    res.json({ orders: listOrdersFromDb() });
  });

  app.patch('/api/admin/orders/:orderNumber', requireAdminAuth, (req: Request, res: Response) => {
    const orderNumber = String(req.params.orderNumber || '');
    const body = req.body as {
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      refundNote?: string;
      restockOnCancel?: boolean;
    };
    if (!body?.status && !body?.paymentStatus && body?.refundNote === undefined) {
      res.status(400).json({ error: 'Order update payload is required.' });
      return;
    }
    const updated = updateOrderStatusInDb(orderNumber, body);
    if (!updated) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    clearConciergeCache();
    res.json({ updated: true, order: updated });
  });

  // Admin Customers Management
  app.get('/api/admin/customers', requireAdminAuth, (req: Request, res: Response) => {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    res.json({ customers: listCustomersFromDb(q) });
  });

  app.get('/api/admin/customers/:id', requireAdminAuth, (req: Request, res: Response) => {
    const id = String(req.params.id || '');
    const detail = getCustomerDetailFromDb(id);
    if (!detail) {
      res.status(404).json({ error: 'Customer not found.' });
      return;
    }
    res.json(detail);
  });

  app.patch('/api/admin/customers/:id', requireAdminAuth, (req: Request, res: Response) => {
    const id = String(req.params.id || '');
    const body = req.body as { status?: 'Active' | 'Suspended' };
    if (body?.status !== 'Active' && body?.status !== 'Suspended') {
      res.status(400).json({ error: 'Valid account status (Active or Suspended) is required.' });
      return;
    }
    const ok = updateCustomerStatusInDb(id, body.status);
    if (!ok) {
      res.status(404).json({ error: 'Customer not found.' });
      return;
    }
    res.json({ updated: true, status: body.status });
  });

  app.delete('/api/admin/customers/:id', requireAdminAuth, (req: Request, res: Response) => {
    const id = String(req.params.id || '');
    const deleted = deleteCustomerInDb(id);
    if (!deleted) {
      res.status(404).json({ error: 'Customer not found.' });
      return;
    }
    res.json({ deleted: true });
  });

  // Admin Website Content Management (CMS) & Settings
  app.get('/api/admin/cms', requireAdminAuth, (_req: Request, res: Response) => {
    res.json(getFullCmsPayload());
  });

  app.put('/api/admin/cms/:section', requireAdminAuth, (req: Request, res: Response) => {
    try {
      const section = String(req.params.section || '') as CmsSectionKey;
      const validSections: CmsSectionKey[] = [
        'homepage',
        'navigation',
        'footer',
        'about',
        'contact',
        'faqs',
        'banners',
        'settings',
      ];
      if (!validSections.includes(section)) {
        res.status(400).json({ error: 'Invalid CMS section.' });
        return;
      }
      const updated = updateCmsSectionInDb(section, req.body);
      clearConciergeCache();
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Unable to save CMS section.' });
    }
  });

  // Admin AI Chatbot Management
  app.get('/api/admin/ai', requireAdminAuth, (_req: Request, res: Response) => {
    res.json({
      config: getAiSettingsFromDb(),
      logs: listChatLogsFromDb(80),
    });
  });

  app.put('/api/admin/ai', requireAdminAuth, (req: Request, res: Response) => {
    const config = updateAiSettingsInDb(req.body as Partial<AiChatbotConfig>);
    clearConciergeCache();
    res.json({ config });
  });

  app.get('/api/admin/ai/logs', requireAdminAuth, (_req: Request, res: Response) => {
    res.json({ logs: listChatLogsFromDb(100) });
  });

  app.post('/api/admin/ai/sync', requireAdminAuth, (_req: Request, res: Response) => {
    clearConciergeCache();
    const stats = getCatalogStats();
    res.json({
      synced: true,
      totalProducts: stats.totalProducts,
      totalCategories: stats.totalCategories,
      syncedAt: new Date().toISOString(),
    });
  });

  // Admin Inventory & Stock Adjustment History
  app.get('/api/admin/inventory', requireAdminAuth, (req: Request, res: Response) => {
    const filter =
      req.query.filter === 'low' || req.query.filter === 'out' ? req.query.filter : 'all';
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    res.json({
      ...listInventoryFromDb({ filter, q, page, pageSize }),
      history: listStockAdjustmentsFromDb(60),
    });
  });

  app.post('/api/admin/inventory/adjust', requireAdminAuth, (req: AuthenticatedAdminRequest, res: Response) => {
    const body = req.body as { productId?: string; newStock?: number; reason?: string };
    if (!body?.productId || typeof body.newStock !== 'number' || Number.isNaN(body.newStock)) {
      res.status(400).json({ error: 'productId and valid newStock number are required.' });
      return;
    }
    const result = adjustProductStockInDb(
      body.productId,
      body.newStock,
      body.reason || 'Manual Stock Adjustment',
      req.adminUser?.email || 'Admin'
    );
    if (!result) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    clearConciergeCache();
    res.json(result);
  });

  app.get('/api/admin/inventory/history', requireAdminAuth, (_req: Request, res: Response) => {
    res.json({ history: listStockAdjustmentsFromDb(150) });
  });

  // Admin Reviews & Ratings Moderation
  app.get('/api/admin/reviews', requireAdminAuth, (req: Request, res: Response) => {
    const status =
      req.query.status === 'approved' ||
      req.query.status === 'pending' ||
      req.query.status === 'rejected'
        ? req.query.status
        : 'all';
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    res.json({ reviews: listReviewsFromDb({ status, q }) });
  });

  app.patch('/api/admin/reviews/:id', requireAdminAuth, (req: Request, res: Response) => {
    const id = String(req.params.id || '');
    const body = req.body as { status?: ReviewModerationStatus };
    if (
      body?.status !== 'approved' &&
      body?.status !== 'pending' &&
      body?.status !== 'rejected'
    ) {
      res.status(400).json({ error: 'Valid review status (approved, pending, rejected) is required.' });
      return;
    }
    const updated = updateReviewStatusInDb(id, body.status);
    if (!updated) {
      res.status(404).json({ error: 'Review not found.' });
      return;
    }
    res.json({ review: updated });
  });

  app.delete('/api/admin/reviews/:id', requireAdminAuth, (req: Request, res: Response) => {
    const id = String(req.params.id || '');
    const deleted = deleteReviewInDb(id);
    if (!deleted) {
      res.status(404).json({ error: 'Review not found.' });
      return;
    }
    res.json({ deleted: true });
  });

  // ============================================================
  // Server-Side Streaming Gemini AI Shopping Assistant API (SSE)
  // ============================================================

  app.post('/api/chat/stream', async (req: Request, res: Response) => {
    const aiSettings = getAiSettingsFromDb();
    if (!aiSettings.enabled) {
      res.status(403).json({
        error: 'The AI Shopping Assistant is currently disabled by the store administrator.',
      });
      return;
    }

    const body = req.body as {
      messages?: IncomingChatTurn[];
      cartItemCount?: number;
    };

    if (!Array.isArray(body?.messages) || body.messages.length === 0) {
      res.status(400).json({ error: 'Conversation messages array is required.' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const abortController = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded) {
        abortController.abort();
      }
    });

    const writeEvent = (event: string, payload: unknown) => {
      if (res.writableEnded || abortController.signal.aborted) return;
      res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
    };

    try {
      await streamAIConcierge(body.messages, body.cartItemCount ?? 0, {
        signal: abortController.signal,
        onDelta: (text) => writeEvent('delta', { text }),
        onProducts: (products, isFinal) => writeEvent('products', { products, isFinal }),
        onDone: (suggestedFollowUps) => {
          writeEvent('done', { suggestedFollowUps });
          if (!res.writableEnded) res.end();
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to reach the AI shopping assistant.';
      console.error('AI Concierge stream error:', error);
      writeEvent('error', { error: message });
    } finally {
      if (!res.writableEnded) res.end();
    }
  });

  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const aiSettings = getAiSettingsFromDb();
      if (!aiSettings.enabled) {
        res.status(403).json({
          error: 'The AI Shopping Assistant is currently disabled by the store administrator.',
        });
        return;
      }

      const body = req.body as {
        messages?: IncomingChatTurn[];
        cartItemCount?: number;
      };

      if (!Array.isArray(body?.messages) || body.messages.length === 0) {
        res.status(400).json({ error: 'Conversation messages array is required.' });
        return;
      }

      const result = await runAIConcierge(body.messages, body.cartItemCount ?? 0);
      res.json(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to reach the AI shopping assistant.';
      console.error('AI Concierge error:', error);
      res.status(500).json({ error: message });
    }
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`MAISON KOVA Marketplace listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

