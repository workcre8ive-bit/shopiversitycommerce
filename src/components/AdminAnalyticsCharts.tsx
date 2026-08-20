import React from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag, 
  DollarSign, 
  Package, 
  BarChart2, 
  PieChart as PieIcon,
  Sparkles,
  Award,
  Layers,
  ArrowUpRight
} from "lucide-react";
import { Order, Product } from "../types";

interface AdminAnalyticsChartsProps {
  orders: Order[];
  products: Product[];
}

const BAR_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#f43f5e", // rose
  "#f59e0b", // amber
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#3b82f6"  // blue
];

const PIE_COLORS = [
  "#4f46e5", "#7c3aed", "#db2777", "#ea580c", "#ca8a04", 
  "#16a34a", "#0891b2", "#2563eb", "#9333ea", "#059669"
];

export default function AdminAnalyticsCharts({ orders, products }: AdminAnalyticsChartsProps) {
  // Aggregate sales per product
  const productSalesMap: Record<string, {
    id: string;
    name: string;
    category: string;
    imageUrl?: string;
    sellerName?: string;
    price: number;
    unitsSold: number;
    revenue: number;
  }> = {};

  // Initialize with active products
  products.forEach(p => {
    productSalesMap[p.id] = {
      id: p.id,
      name: p.name,
      category: p.category || "General",
      imageUrl: p.imageUrl,
      sellerName: p.sellerName || "Campus Seller",
      price: p.price || 0,
      unitsSold: 0,
      revenue: 0
    };
  });

  // Calculate units and revenue from real orders
  orders.forEach(o => {
    if (o.productId && productSalesMap[o.productId]) {
      productSalesMap[o.productId].unitsSold += o.quantity || 1;
      productSalesMap[o.productId].revenue += o.totalPrice || 0;
    } else if (o.productName) {
      // If product might not be in currently active list
      const key = o.productId || o.productName;
      if (!productSalesMap[key]) {
        productSalesMap[key] = {
          id: key,
          name: o.productName,
          category: "General",
          imageUrl: o.productImageUrl,
          sellerName: o.sellerName || "Campus Seller",
          price: o.totalPrice || 0,
          unitsSold: 0,
          revenue: 0
        };
      }
      productSalesMap[key].unitsSold += o.quantity || 1;
      productSalesMap[key].revenue += o.totalPrice || 0;
    }
  });

  const allProductStats = Object.values(productSalesMap);

  // Most Sold Product (highest units sold, or fallback)
  const sortedBySalesDesc = [...allProductStats].sort((a, b) => b.unitsSold - a.unitsSold);
  const mostSoldProduct = sortedBySalesDesc.length > 0 && sortedBySalesDesc[0].unitsSold > 0 
    ? sortedBySalesDesc[0] 
    : (sortedBySalesDesc.length > 0 ? sortedBySalesDesc[0] : null);

  // Least Sold Product (lowest units sold)
  const sortedBySalesAsc = [...allProductStats].sort((a, b) => a.unitsSold - b.unitsSold);
  const leastSoldProduct = sortedBySalesAsc.length > 0 
    ? sortedBySalesAsc[0] 
    : null;

  // Chart data: Top 6 products
  const topProductsChartData = sortedBySalesDesc.slice(0, 6).map(item => ({
    name: item.name.length > 18 ? item.name.substring(0, 16) + "..." : item.name,
    fullName: item.name,
    unitsSold: item.unitsSold,
    revenue: item.revenue,
    category: item.category
  }));

  // Category distribution
  const categoryMap: Record<string, { count: number; revenue: number; ordersCount: number }> = {};
  orders.forEach(o => {
    const matchedProd = products.find(p => p.id === o.productId);
    const cat = matchedProd?.category || "General";
    if (!categoryMap[cat]) {
      categoryMap[cat] = { count: 0, revenue: 0, ordersCount: 0 };
    }
    categoryMap[cat].ordersCount += 1;
    categoryMap[cat].revenue += o.totalPrice || 0;
  });

  const categoryChartData = Object.entries(categoryMap).map(([name, data]) => ({
    name,
    revenue: data.revenue,
    orders: data.ordersCount
  })).sort((a, b) => b.revenue - a.revenue);

  const totalGrossVolume = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const totalUnitsMoved = orders.reduce((sum, o) => sum + (o.quantity || 1), 0);

  return (
    <div className="space-y-6">
      {/* Top Spotlight Cards: Most Sold & Least Sold */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Sold Product in the Website */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 dark:border-emerald-500/30 p-6 sm:p-8 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  Platform Top Performer
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Most Sold Product in Website
                </h3>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full text-[10px] font-black uppercase tracking-widest">
              Top #1 Seller
            </span>
          </div>

          {mostSoldProduct ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 bg-white/80 dark:bg-slate-900/80 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 shadow-inner">
                {mostSoldProduct.imageUrl ? (
                  <img src={mostSoldProduct.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Package className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                  {mostSoldProduct.category}
                </span>
                <h4 className="text-base font-black text-slate-900 dark:text-white truncate">
                  {mostSoldProduct.name}
                </h4>
                <p className="text-xs text-slate-500">
                  Seller: <span className="font-bold text-slate-700 dark:text-slate-300">{mostSoldProduct.sellerName}</span>
                </p>
                <div className="flex items-center gap-4 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Volume</span>
                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                      {mostSoldProduct.unitsSold} Unit{mostSoldProduct.unitsSold === 1 ? "" : "s"} Sold
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Revenue</span>
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                      ₦{mostSoldProduct.revenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white/60 dark:bg-slate-900/60 rounded-2xl text-xs font-bold text-slate-400">
              No orders recorded yet to calculate best seller.
            </div>
          )}
        </div>

        {/* Least Sold Product in the Website */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border border-rose-500/20 dark:border-rose-500/30 p-6 sm:p-8 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-500/20">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">
                  Inventory Opportunity
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Least Sold Product in Website
                </h3>
              </div>
            </div>
            <span className="px-3 py-1 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded-full text-[10px] font-black uppercase tracking-widest">
              Lowest Volume
            </span>
          </div>

          {leastSoldProduct ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 bg-white/80 dark:bg-slate-900/80 p-5 rounded-2xl border border-rose-100 dark:border-rose-900/30">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 shadow-inner">
                {leastSoldProduct.imageUrl ? (
                  <img src={leastSoldProduct.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Package className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                  {leastSoldProduct.category}
                </span>
                <h4 className="text-base font-black text-slate-900 dark:text-white truncate">
                  {leastSoldProduct.name}
                </h4>
                <p className="text-xs text-slate-500">
                  Seller: <span className="font-bold text-slate-700 dark:text-slate-300">{leastSoldProduct.sellerName}</span>
                </p>
                <div className="flex items-center gap-4 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Volume</span>
                    <p className="text-sm font-black text-rose-600 dark:text-rose-400">
                      {leastSoldProduct.unitsSold} Unit{leastSoldProduct.unitsSold === 1 ? "" : "s"} Sold
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Price</span>
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                      ₦{leastSoldProduct.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white/60 dark:bg-slate-900/60 rounded-2xl text-xs font-bold text-slate-400">
              No products listed yet in catalog.
            </div>
          )}
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Sold Products Bar Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Top Best-Selling Products by Units Sold
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Real-time checkout volume aggregated from confirmed platform orders.
              </p>
            </div>
            <div className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-xl self-start sm:self-auto">
              Total {totalUnitsMoved} Units Moved
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            {topProductsChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    angle={-20}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: "#94a3b8" }} 
                    allowDecimals={false}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl text-xs border border-slate-800 space-y-1">
                            <p className="font-black text-sm">{data.fullName}</p>
                            <p className="text-slate-400">Category: <span className="text-white">{data.category}</span></p>
                            <p className="text-emerald-400 font-bold">Units Sold: {data.unitsSold}</p>
                            <p className="text-indigo-400 font-bold">Gross Revenue: ₦{data.revenue.toLocaleString()}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="unitsSold" radius={[8, 8, 0, 0]}>
                    {topProductsChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-bold">
                No checkout data available to generate chart.
              </div>
            )}
          </div>
        </div>

        {/* Category Revenue Breakdown */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PieIcon className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Category Sales
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Gross revenue generated per category.
            </p>
          </div>

          <div className="space-y-3.5 my-auto">
            {categoryChartData.slice(0, 5).map((cat, idx) => {
              const percentage = totalGrossVolume > 0 ? Math.round((cat.revenue / totalGrossVolume) * 100) : 0;
              return (
                <div key={`cat-stat-${cat.name}-${idx}`} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">{cat.name}</span>
                    <span className="text-slate-900 dark:text-white font-mono">₦{cat.revenue.toLocaleString()} ({percentage}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.max(percentage, 5)}%`,
                        backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] 
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {categoryChartData.length === 0 && (
              <p className="text-xs text-center text-slate-400 font-bold py-8">
                No category transactions yet.
              </p>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Gross Sales Volume</span>
            <span className="text-sm font-black text-slate-900 dark:text-white font-mono">₦{totalGrossVolume.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
