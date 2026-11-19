import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Bot,
  Box,
  CheckCircle2,
  Clock,
  DollarSign,
  FileEdit,
  Package,
  Plus,
  RefreshCw,
  ShoppingBag,
  Users,
} from 'lucide-react';
import type { AdminAnalyticsPayload } from '../../types/store.ts';
import { ProductImage } from '../ProductImage.tsx';
import { adminFetch, formatCurrency, formatShortDate } from './adminApi.ts';

export type AdminSectionId =
  | 'overview'
  | 'products'
  | 'categories'
  | 'orders'
  | 'customers'
  | 'cms'
  | 'ai'
  | 'inventory'
  | 'reviews'
  | 'settings';

interface AdminOverviewSectionProps {
  onNavigate: (section: AdminSectionId) => void;
  onQuickAddProduct: () => void;
  catalogVersion: number;
}

export function AdminOverviewSection({
  onNavigate,
  onQuickAddProduct,
  catalogVersion,
}: AdminOverviewSectionProps) {
  const [data, setData] = useState<AdminAnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await adminFetch<AdminAnalyticsPayload>('/api/admin/overview');
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load overview analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOverview();
  }, [catalogVersion]);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 animate-pulse"
            />
          ))}
        </div>
        <div className="h-72 rounded-xl bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 rounded-xl bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 text-center space-y-3">
        <p className="text-sm text-red-600 dark:text-red-400">{error || 'Unable to load analytics.'}</p>
        <button
          type="button"
          onClick={() => void loadOverview()}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium border border-stone-300 dark:border-stone-700 rounded-md cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const { summary, monthlySeries, categoryPerformance, recentOrders, bestSellingProducts, recentCustomers } =
    data;

  const kpis = [
    {
      label: 'Total Revenue',
      value: formatCurrency(summary.totalRevenue),
      sub: `${summary.onSaleCount} active sale items`,
      icon: DollarSign,
      target: 'orders' as AdminSectionId,
    },
    {
      label: 'Total Orders',
      value: summary.totalOrders.toLocaleString(),
      sub: `${summary.pendingOrders} awaiting fulfillment`,
      icon: ShoppingBag,
      target: 'orders' as AdminSectionId,
    },
    {
      label: 'Total Products',
      value: summary.totalProducts.toLocaleString(),
      sub: `${summary.totalCategories} active categories`,
      icon: Package,
      target: 'products' as AdminSectionId,
    },
    {
      label: 'Total Customers',
      value: summary.totalCustomers.toLocaleString(),
      sub: `${recentCustomers.length} recent profiles`,
      icon: Users,
      target: 'customers' as AdminSectionId,
    },
    {
      label: 'Pending Orders',
      value: summary.pendingOrders.toLocaleString(),
      sub: 'Pending & processing queue',
      icon: Clock,
      target: 'orders' as AdminSectionId,
    },
    {
      label: 'Completed Orders',
      value: summary.completedOrders.toLocaleString(),
      sub: 'Shipped & delivered',
      icon: CheckCircle2,
      target: 'orders' as AdminSectionId,
    },
    {
      label: 'Low Stock Alerts',
      value: summary.lowStockProducts.toLocaleString(),
      sub: `${summary.outOfStockProducts} out of stock`,
      icon: AlertTriangle,
      target: 'inventory' as AdminSectionId,
    },
    {
      label: 'Total Units Sold',
      value: summary.totalSalesUnits.toLocaleString(),
      sub: `${summary.pendingReviewsCount} reviews pending`,
      icon: Box,
      target: 'products' as AdminSectionId,
    },
  ];

  // SVG Monthly Revenue Chart scaling
  const maxMonthRev = Math.max(1, ...monthlySeries.map((m) => m.revenue));
  const maxMonthOrders = Math.max(1, ...monthlySeries.map((m) => m.orders));
  const maxCatUnits = Math.max(1, ...categoryPerformance.map((c) => c.unitsSold));

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-medium text-stone-900 dark:text-stone-100">
            Store Overview & Analytics
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Live database metrics synchronized across your catalog, orders, customers, and AI concierge.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onQuickAddProduct}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 rounded-md cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('cms')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#191816] rounded-md hover:border-stone-500 cursor-pointer"
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>Edit Storefront</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('ai')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#191816] rounded-md hover:border-stone-500 cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Assistant</span>
          </button>
        </div>
      </div>

      {/* 8 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <button
              key={kpi.label}
              type="button"
              onClick={() => onNavigate(kpi.target)}
              className="text-left p-4 rounded-xl bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 transition-colors group cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                  {kpi.label}
                </span>
                <Icon className="w-4 h-4 text-[#9A6B42] dark:text-[#C89B6E]" />
              </div>
              <p className="mt-2 font-mono-tabular text-2xl font-semibold text-stone-900 dark:text-stone-100">
                {kpi.value}
              </p>
              <div className="mt-1 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                <span>{kpi.sub}</span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Monthly Revenue & Order Volume SVG Chart */}
        <div className="lg:col-span-7 p-5 rounded-xl bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Monthly Order Revenue & Volume
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Computed directly from non-cancelled checkout orders over the last 6 months.
              </p>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-stone-500 dark:text-stone-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#9A6B42] dark:bg-[#C89B6E]" />
                Revenue
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-stone-400 dark:bg-stone-500" />
                Orders
              </span>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <svg viewBox="0 0 600 220" className="w-full min-w-[420px] h-52">
              {[0, 0.25, 0.5, 0.75, 1].map((step) => {
                const y = 180 - step * 145;
                return (
                  <g key={step}>
                    <line
                      x1="44"
                      y1={y}
                      x2="584"
                      y2={y}
                      stroke="currentColor"
                      className="text-stone-200 dark:text-stone-800"
                      strokeDasharray="3 3"
                    />
                    <text
                      x="38"
                      y={y + 4}
                      textAnchor="end"
                      className="fill-stone-400 text-[10px] font-mono"
                    >
                      ${Math.round(maxMonthRev * step)}
                    </text>
                  </g>
                );
              })}

              {monthlySeries.map((pt, idx) => {
                const slotWidth = 530 / Math.max(1, monthlySeries.length);
                const barWidth = Math.min(34, slotWidth * 0.42);
                const xCenter = 56 + idx * slotWidth + slotWidth / 2;
                const revHeight = Math.max(pt.revenue > 0 ? 6 : 2, (pt.revenue / maxMonthRev) * 145);
                const ordHeight = Math.max(pt.orders > 0 ? 6 : 2, (pt.orders / maxMonthOrders) * 145);
                return (
                  <g key={pt.month}>
                    <rect
                      x={xCenter - barWidth - 2}
                      y={180 - revHeight}
                      width={barWidth}
                      height={revHeight}
                      rx={3}
                      className="fill-[#9A6B42] dark:fill-[#C89B6E]"
                    >
                      <title>{`${pt.month}: ${formatCurrency(pt.revenue)}`}</title>
                    </rect>
                    <rect
                      x={xCenter + 2}
                      y={180 - ordHeight}
                      width={Math.max(12, barWidth * 0.65)}
                      height={ordHeight}
                      rx={3}
                      className="fill-stone-300 dark:fill-stone-600"
                    >
                      <title>{`${pt.month}: ${pt.orders} orders`}</title>
                    </rect>
                    <text
                      x={xCenter}
                      y={202}
                      textAnchor="middle"
                      className="fill-stone-500 dark:fill-stone-400 text-[11px]"
                    >
                      {pt.month}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Category Performance Horizontal Bars */}
        <div className="lg:col-span-5 p-5 rounded-xl bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Top Categories by Units Sold
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Across {summary.totalCategories} departments
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('categories')}
              className="text-xs font-medium text-[#9A6B42] dark:text-[#C89B6E] hover:underline cursor-pointer"
            >
              Manage
            </button>
          </div>

          <div className="space-y-3">
            {categoryPerformance.slice(0, 7).map((cat) => {
              const pct = Math.max(6, Math.round((cat.unitsSold / maxCatUnits) * 100));
              return (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-stone-800 dark:text-stone-200 truncate pr-2">
                      {cat.category}
                    </span>
                    <span className="font-mono-tabular text-stone-500 dark:text-stone-400 shrink-0">
                      {cat.unitsSold.toLocaleString()} sold · {cat.productCount} SKUs
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-stone-900 dark:bg-[#C89B6E]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Operational Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Recent Orders */}
        <div className="lg:col-span-7 p-5 rounded-xl bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Recent Orders
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('orders')}
              className="text-xs font-medium text-[#9A6B42] dark:text-[#C89B6E] hover:underline cursor-pointer"
            >
              View All Orders
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <p className="py-8 text-center text-xs text-stone-500 dark:text-stone-400">
              No checkout orders placed yet. New storefront orders will appear here automatically.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-800 text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    <th className="py-2 pr-3">Order</th>
                    <th className="py-2 px-3">Customer</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 pl-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                  {recentOrders.slice(0, 6).map((ord) => (
                    <tr key={ord.orderNumber}>
                      <td className="py-2.5 pr-3 font-mono-tabular font-medium text-stone-900 dark:text-stone-100">
                        #{ord.orderNumber}
                      </td>
                      <td className="py-2.5 px-3 text-stone-600 dark:text-stone-300">
                        <p className="truncate max-w-[160px]">{ord.customer.fullName}</p>
                        <p className="text-[11px] text-stone-400">{formatShortDate(ord.createdAt)}</p>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 px-2 py-0.5 rounded">
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-2.5 pl-3 text-right font-mono-tabular font-medium text-stone-900 dark:text-stone-100">
                        {formatCurrency(ord.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Best-Selling Products & Recent Customer Activity */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 rounded-xl bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Best-Selling Products
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('products')}
                className="text-xs font-medium text-[#9A6B42] dark:text-[#C89B6E] hover:underline cursor-pointer"
              >
                Catalog
              </button>
            </div>
            <div className="space-y-2.5">
              {bestSellingProducts.slice(0, 4).map((prod) => (
                <div key={prod.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded overflow-hidden bg-stone-100 dark:bg-stone-800 shrink-0">
                      <ProductImage src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-stone-900 dark:text-stone-100 truncate">
                        {prod.name}
                      </p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">
                        {(prod.soldCount ?? 0).toLocaleString()} sold · {prod.stockCount} left
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono-tabular font-medium text-stone-900 dark:text-stone-100 shrink-0">
                    {formatCurrency(prod.price)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-[#191816] border border-stone-200 dark:border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Recent Customer Activity
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('customers')}
                className="text-xs font-medium text-[#9A6B42] dark:text-[#C89B6E] hover:underline cursor-pointer"
              >
                Directory
              </button>
            </div>
            {recentCustomers.length === 0 ? (
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Customer records appear automatically upon checkout.
              </p>
            ) : (
              <div className="space-y-2">
                {recentCustomers.slice(0, 4).map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-2 text-xs py-1 border-b last:border-b-0 border-stone-100 dark:border-stone-800/70"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-stone-900 dark:text-stone-100 truncate">
                        {c.fullName}
                      </p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                        {c.email}
                      </p>
                    </div>
                    <div className="text-right font-mono-tabular shrink-0">
                      <p className="font-medium text-stone-900 dark:text-stone-100">
                        {formatCurrency(c.totalSpent)}
                      </p>
                      <p className="text-[11px] text-stone-400">{c.ordersCount} orders</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
