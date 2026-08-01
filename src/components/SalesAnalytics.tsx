import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Calendar, 
  ShoppingBag, 
  DollarSign, 
  Award, 
  Package, 
  ArrowUpRight, 
  Filter, 
  Clock, 
  ChevronRight,
  ChevronDown,
  Check,
  BarChart2,
  Search,
  Download,
  FileSpreadsheet,
  Printer,
  FileText,
  Sparkles,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Order, Product } from '../types';
import { cn } from '../lib/utils';

export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

interface SalesAnalyticsProps {
  orders: Order[];
  products?: Product[];
  currencySymbol?: string;
  className?: string;
}

interface DropdownOption<T extends string> {
  value: T;
  label: string;
  badge?: string | number;
  icon?: React.ReactNode;
  colorDot?: string;
}

// Beautiful Custom Animated Dropdown Component
function BeautifulDropdown<T extends string>({
  value,
  options,
  onChange,
  label,
  icon: HeaderIcon,
  align = 'right'
}: {
  value: T;
  options: DropdownOption<T>[];
  onChange: (val: T) => void;
  label?: string;
  icon?: React.ReactNode;
  align?: 'left' | 'right';
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2.5 transition-all shadow-sm cursor-pointer"
      >
        {HeaderIcon && <span className="text-purple-600 dark:text-purple-400">{HeaderIcon}</span>}
        {label && <span className="text-slate-400 font-medium">{label}:</span>}
        <span className="flex items-center gap-1.5 font-bold">
          {selectedOption.colorDot && (
            <span className={cn("w-2 h-2 rounded-full", selectedOption.colorDot)} />
          )}
          {selectedOption.icon}
          {selectedOption.label}
        </span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "absolute top-full mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-1.5 space-y-0.5 overflow-hidden",
                align === 'right' ? "right-0" : "left-0"
              )}
            >
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer border-none",
                      isSelected
                        ? "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-extrabold"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {option.colorDot && (
                        <span className={cn("w-2 h-2 rounded-full shrink-0", option.colorDot)} />
                      )}
                      {option.icon}
                      {option.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {option.badge !== undefined && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                          {option.badge}
                        </span>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SalesAnalytics({
  orders = [],
  products = [],
  currencySymbol = '₦',
  className
}: SalesAnalyticsProps) {
  const [period, setPeriod] = useState<TimePeriod>('monthly');
  const [selectedQuarter, setSelectedQuarter] = useState<number>(() => Math.floor(new Date().getMonth() / 3));
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Derive date bounds and period label based on selected period
  const periodInfo = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    switch (period) {
      case 'daily': {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        const formattedDate = now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        return {
          label: 'Daily Sales',
          dateRangeText: `Today (${formattedDate})`,
          subText: 'Hourly revenue breakdown for today',
          startDate: start,
          endDate: end
        };
      }
      case 'weekly': {
        const end = new Date(now);
        const start = new Date(now);
        start.setDate(now.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return {
          label: 'Weekly Sales',
          dateRangeText: `${startStr} – ${endStr}`,
          subText: 'Past 7 days performance',
          startDate: start,
          endDate: end
        };
      }
      case 'monthly': {
        const start = new Date(currentYear, currentMonth, 1);
        const end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
        const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        return {
          label: 'Monthly Sales',
          dateRangeText: `${monthName}`,
          subText: 'Daily breakdown across current month',
          startDate: start,
          endDate: end
        };
      }
      case 'quarterly': {
        const startMonth = selectedQuarter * 3;
        const start = new Date(currentYear, startMonth, 1);
        const end = new Date(currentYear, startMonth + 3, 0, 23, 59, 59, 999);
        const qNames = ['Q1 (Jan - Mar)', 'Q2 (Apr - Jun)', 'Q3 (Jul - Sep)', 'Q4 (Oct - Dec)'];
        return {
          label: `Quarterly Sales (${qNames[selectedQuarter]})`,
          dateRangeText: `${qNames[selectedQuarter]} ${currentYear}`,
          subText: `Monthly aggregation for ${qNames[selectedQuarter]}`,
          startDate: start,
          endDate: end
        };
      }
      case 'yearly': {
        const start = new Date(currentYear, 0, 1);
        const end = new Date(currentYear, 11, 31, 23, 59, 59, 999);
        return {
          label: 'Yearly Sales',
          dateRangeText: `Year ${currentYear}`,
          subText: 'Full 12-month performance breakdown',
          startDate: start,
          endDate: end
        };
      }
    }
  }, [period, selectedQuarter]);

  // Valid orders filter (excluding cancelled if required or keeping non-cancelled)
  const validOrders = useMemo(() => {
    return orders.filter(o => o.status !== 'cancelled');
  }, [orders]);

  // Filter orders within period
  const periodOrders = useMemo(() => {
    return validOrders.filter(order => {
      if (!order.createdAt) return false;
      const oDate = new Date(order.createdAt);
      return oDate >= periodInfo.startDate && oDate <= periodInfo.endDate;
    });
  }, [validOrders, periodInfo]);

  // Status Counts for Beautiful Status Dropdown
  const statusCounts = useMemo(() => {
    const source = periodOrders.length > 0 ? periodOrders : validOrders;
    return {
      all: source.length,
      completed: source.filter(o => o.status === 'completed').length,
      delivered: source.filter(o => o.status === 'delivered').length,
      accepted: source.filter(o => o.status === 'accepted').length,
      out_for_delivery: source.filter(o => o.status === 'out_for_delivery').length,
      pending: source.filter(o => o.status === 'pending').length,
    };
  }, [periodOrders, validOrders]);

  // Status Dropdown Options
  const statusOptions: DropdownOption<string>[] = useMemo(() => [
    { value: 'all', label: 'All Statuses', badge: statusCounts.all, colorDot: 'bg-slate-400' },
    { value: 'completed', label: 'Completed', badge: statusCounts.completed, colorDot: 'bg-emerald-500' },
    { value: 'delivered', label: 'Delivered', badge: statusCounts.delivered, colorDot: 'bg-teal-500' },
    { value: 'accepted', label: 'Accepted', badge: statusCounts.accepted, colorDot: 'bg-blue-500' },
    { value: 'out_for_delivery', label: 'Out for Delivery', badge: statusCounts.out_for_delivery, colorDot: 'bg-indigo-500' },
    { value: 'pending', label: 'Pending', badge: statusCounts.pending, colorDot: 'bg-amber-500' },
  ], [statusCounts]);

  // Aggregate Chart Data based on selected period
  const chartData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (period === 'daily') {
      const blocks = [
        { label: '00:00 - 04:00', startHour: 0, endHour: 4, sales: 0, ordersCount: 0 },
        { label: '04:00 - 08:00', startHour: 4, endHour: 8, sales: 0, ordersCount: 0 },
        { label: '08:00 - 12:00', startHour: 8, endHour: 12, sales: 0, ordersCount: 0 },
        { label: '12:00 - 16:00', startHour: 12, endHour: 16, sales: 0, ordersCount: 0 },
        { label: '16:00 - 20:00', startHour: 16, endHour: 20, sales: 0, ordersCount: 0 },
        { label: '20:00 - 00:00', startHour: 20, endHour: 24, sales: 0, ordersCount: 0 },
      ];

      periodOrders.forEach(o => {
        const hour = new Date(o.createdAt).getHours();
        const block = blocks.find(b => hour >= b.startHour && hour < b.endHour);
        if (block) {
          block.sales += (o.totalPrice || 0);
          block.ordersCount += 1;
        }
      });

      return blocks.map(b => ({
        name: b.label.split(' - ')[0],
        sales: b.sales,
        orders: b.ordersCount,
        fullName: b.label
      }));
    }

    if (period === 'weekly') {
      const days: { date: Date; name: string; sales: number; ordersCount: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const name = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
        days.push({ date: d, name, sales: 0, ordersCount: 0 });
      }

      periodOrders.forEach(o => {
        const oDate = new Date(o.createdAt);
        oDate.setHours(0, 0, 0, 0);
        const dayMatch = days.find(d => d.date.getTime() === oDate.getTime());
        if (dayMatch) {
          dayMatch.sales += (o.totalPrice || 0);
          dayMatch.ordersCount += 1;
        }
      });

      return days.map(d => ({
        name: d.name,
        sales: d.sales,
        orders: d.ordersCount,
        fullName: d.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
      }));
    }

    if (period === 'monthly') {
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const daysList: { dayNum: number; name: string; sales: number; ordersCount: number }[] = [];
      
      for (let i = 1; i <= daysInMonth; i++) {
        daysList.push({
          dayNum: i,
          name: `${i}`,
          sales: 0,
          ordersCount: 0
        });
      }

      periodOrders.forEach(o => {
        const oDay = new Date(o.createdAt).getDate();
        const item = daysList.find(d => d.dayNum === oDay);
        if (item) {
          item.sales += (o.totalPrice || 0);
          item.ordersCount += 1;
        }
      });

      return daysList.map(d => ({
        name: `Day ${d.dayNum}`,
        sales: d.sales,
        orders: d.ordersCount,
        fullName: `Day ${d.dayNum}`
      }));
    }

    if (period === 'quarterly') {
      const monthNames = [
        ['Jan', 'Feb', 'Mar'],
        ['Apr', 'May', 'Jun'],
        ['Jul', 'Aug', 'Sep'],
        ['Oct', 'Nov', 'Dec']
      ][selectedQuarter];

      const months = monthNames.map((mName, idx) => ({
        mIndex: selectedQuarter * 3 + idx,
        name: mName,
        sales: 0,
        ordersCount: 0
      }));

      periodOrders.forEach(o => {
        const m = new Date(o.createdAt).getMonth();
        const item = months.find(x => x.mIndex === m);
        if (item) {
          item.sales += (o.totalPrice || 0);
          item.ordersCount += 1;
        }
      });

      return months.map(m => ({
        name: m.name,
        sales: m.sales,
        orders: m.ordersCount,
        fullName: m.name
      }));
    }

    // Yearly
    const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsData = allMonths.map((mName, idx) => ({
      mIndex: idx,
      name: mName,
      sales: 0,
      ordersCount: 0
    }));

    periodOrders.forEach(o => {
      const m = new Date(o.createdAt).getMonth();
      const item = monthsData.find(x => x.mIndex === m);
      if (item) {
        item.sales += (o.totalPrice || 0);
        item.ordersCount += 1;
      }
    });

    return monthsData.map(m => ({
      name: m.name,
      sales: m.sales,
      orders: m.ordersCount,
      fullName: m.name
    }));
  }, [periodOrders, period, selectedQuarter]);

  // Statistics
  const totalSalesAmount = useMemo(() => {
    return periodOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  }, [periodOrders]);

  const avgOrderValue = useMemo(() => {
    if (periodOrders.length === 0) return 0;
    return Math.round(totalSalesAmount / periodOrders.length);
  }, [totalSalesAmount, periodOrders]);

  // Most sold product
  const mostSoldProduct = useMemo(() => {
    const targetOrders = periodOrders.length > 0 ? periodOrders : validOrders;
    if (targetOrders.length === 0) return null;

    const tally: Record<string, { name: string; qty: number; revenue: number; imageUrl?: string; id?: string }> = {};

    targetOrders.forEach(o => {
      const key = o.productId || o.productName || 'Unknown';
      if (!tally[key]) {
        const matchedProd = products.find(p => p.id === o.productId || p.name === o.productName);
        tally[key] = {
          id: o.productId,
          name: o.productName || matchedProd?.name || 'Item',
          qty: 0,
          revenue: 0,
          imageUrl: o.productImageUrl || matchedProd?.imageUrl
        };
      }
      tally[key].qty += (o.quantity || 1);
      tally[key].revenue += (o.totalPrice || 0);
    });

    const sorted = Object.values(tally).sort((a, b) => b.qty - a.qty || b.revenue - a.revenue);
    return sorted[0] || null;
  }, [periodOrders, validOrders, products]);

  // Table recent sales filtered
  const filteredRecentSales = useMemo(() => {
    let source = periodOrders.length > 0 ? periodOrders : validOrders;

    if (statusFilter !== 'all') {
      source = source.filter(o => o.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      source = source.filter(o => 
        (o.productName && o.productName.toLowerCase().includes(q)) ||
        (o.buyerName && o.buyerName.toLowerCase().includes(q)) ||
        (o.id && o.id.toLowerCase().includes(q))
      );
    }

    return source.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [periodOrders, validOrders, statusFilter, searchQuery]);

  // CSV Export Handler
  const handleExportCSV = () => {
    const dataToExport = filteredRecentSales.length > 0 ? filteredRecentSales : (periodOrders.length > 0 ? periodOrders : validOrders);
    if (dataToExport.length === 0) {
      alert("No sales orders available to export for this selection.");
      return;
    }

    const headers = ["Order ID", "Date", "Product Name", "Buyer Name", "Quantity", "Total Price (NGN)", "Status"];
    const rows = dataToExport.map(order => [
      `"${order.id || ''}"`,
      `"${order.createdAt ? new Date(order.createdAt).toISOString() : ''}"`,
      `"${(order.productName || '').replace(/"/g, '""')}"`,
      `"${(order.buyerName || '').replace(/"/g, '""')}"`,
      order.quantity || 1,
      order.totalPrice || 0,
      `"${order.status || 'pending'}"`
    ]);

    const csvString = [headers.join(","), ...rows.map(e => e.join(","))].join("\r\n");
    // UTF-8 BOM (\uFEFF) ensures Excel, Google Sheets, Apple Numbers & CSV readers open cleanly without corruption
    const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `CampusMarket_SalesReport_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsExportMenuOpen(false);
  };

  // PDF / Printable Report Handler
  const handleExportPDF = () => {
    const dataToExport = filteredRecentSales.length > 0 ? filteredRecentSales : (periodOrders.length > 0 ? periodOrders : validOrders);
    if (dataToExport.length === 0) {
      alert("No sales orders available to export for this selection.");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sales Report - ${periodInfo.label}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 32px; color: #0f172a; line-height: 1.5; background: #ffffff; }
            .header { border-bottom: 2px solid #cbd5e1; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
            .title { font-size: 24px; font-weight: 800; color: #6b21a8; margin: 0; }
            .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
            .badge { background: #f3e8ff; color: #6b21a8; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 11px; }
            .stats-grid { display: flex; gap: 16px; margin-bottom: 28px; }
            .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px 18px; border-radius: 12px; flex: 1; }
            .stat-label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
            .stat-val { font-size: 20px; font-weight: 900; font-family: monospace; color: #0f172a; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
            th { text-align: left; background: #f1f5f9; padding: 10px 12px; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; border-bottom: 2px solid #cbd5e1; }
            td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
            .amount { text-align: right; font-weight: bold; font-family: monospace; font-size: 13px; }
            .status { text-transform: capitalize; font-weight: bold; font-size: 10px; padding: 3px 8px; border-radius: 12px; display: inline-block; background: #f1f5f9; color: #334155; }
            .footer { margin-top: 40px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">Campus Market • Sales Report</h1>
              <p class="subtitle">Period: <strong>${periodInfo.dateRangeText}</strong> | Generated: ${new Date().toLocaleString()}</p>
            </div>
            <div class="badge">${period.toUpperCase()} REPORT</div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Total Revenue</div>
              <div class="stat-val">${currencySymbol}${totalSalesAmount.toLocaleString()}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Total Orders</div>
              <div class="stat-val">${dataToExport.length}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Average Order Value</div>
              <div class="stat-val">${currencySymbol}${avgOrderValue.toLocaleString()}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Order ID</th>
                <th>Product Name</th>
                <th>Buyer</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Total Amount</th>
                <th style="text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${dataToExport.map(o => `
                <tr>
                  <td>${o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'N/A'}</td>
                  <td><code style="font-size:10px; background:#f1f5f9; padding:2px 6px; border-radius:4px;">${o.id || ''}</code></td>
                  <td><strong>${o.productName || 'Order Item'}</strong></td>
                  <td>${o.buyerName || 'Student Buyer'}</td>
                  <td style="text-align: center;">${o.quantity || 1}</td>
                  <td class="amount">${currencySymbol}${(o.totalPrice || 0).toLocaleString()}</td>
                  <td style="text-align: center;"><span class="status">${(o.status || 'pending').replace(/_/g, ' ')}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            Official Campus Marketplace Store Analytics • Export Record
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setIsExportMenuOpen(false);
  };

  return (
    <div className={cn("space-y-6 text-slate-900 dark:text-white", className)}>
      {/* Top Header & Period Selector Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 lg:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-purple-600/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">
                Performance Intelligence
              </span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-black font-display tracking-tight text-slate-900 dark:text-white">
              Sales Analytics
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
              Real-time store revenue metrics, sales velocity, and product performance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Time Period Selector Tabs */}
            <div className="bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center gap-1">
              {(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] as TimePeriod[]).map((p) => {
                const isActive = period === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    className={cn(
                      "px-3.5 py-2 rounded-xl text-xs font-black capitalize transition-all cursor-pointer border-none relative",
                      isActive
                        ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50"
                    )}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            {/* Quarter Selector Option Tabs (Q1, Q2, Q3, Q4) */}
            {period === 'quarterly' && (
              <div className="bg-purple-50 dark:bg-purple-950/50 p-1.5 rounded-2xl border border-purple-200 dark:border-purple-800/80 flex items-center gap-1 animate-in fade-in duration-200">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300 px-2 hidden sm:inline">
                  Select Quarter:
                </span>
                {[
                  { id: 0, label: 'Quarter 1', shortLabel: 'Q1', range: 'Jan - Mar' },
                  { id: 1, label: 'Quarter 2', shortLabel: 'Q2', range: 'Apr - Jun' },
                  { id: 2, label: 'Quarter 3', shortLabel: 'Q3', range: 'Jul - Sep' },
                  { id: 3, label: 'Quarter 4', shortLabel: 'Q4', range: 'Oct - Dec' },
                ].map((q) => {
                  const isSelected = selectedQuarter === q.id;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setSelectedQuarter(q.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border-none flex items-center gap-1",
                        isSelected
                          ? "bg-purple-600 text-white shadow-md shadow-purple-600/30 font-extrabold"
                          : "text-purple-900 dark:text-purple-200 hover:bg-purple-100/80 dark:hover:bg-purple-900/60"
                      )}
                      title={`${q.label} (${q.range})`}
                    >
                      <span className="sm:hidden">{q.shortLabel}</span>
                      <span className="hidden sm:inline">{q.label}</span>
                      <span className="text-[9px] font-medium opacity-80 hidden lg:inline">({q.range})</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Export Sales Report Button with Beautiful Menu */}
            <div className="relative inline-block">
              <button
                type="button"
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-purple-600/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95 border-none"
              >
                <Download className="w-4 h-4" />
                <span>Export Report</span>
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isExportMenuOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isExportMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsExportMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full right-0 mt-2 w-60 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-2 space-y-1 overflow-hidden"
                    >
                      <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                        Export Sales Records
                      </div>

                      <button
                        type="button"
                        onClick={handleExportCSV}
                        className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-3 transition-colors cursor-pointer border-none group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 dark:text-white">Export as CSV</p>
                          <p className="text-[10px] text-slate-400 font-normal">Excel & Spreadsheet compatible</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={handleExportPDF}
                        className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-3 transition-colors cursor-pointer border-none group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Printer className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 dark:text-white">Print / PDF Report</p>
                          <p className="text-[10px] text-slate-400 font-normal">Formatted printable document</p>
                        </div>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Date Window Display Ribbon */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>Active Period Window:</span>
            <span className="px-3 py-1 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 rounded-xl font-bold font-mono">
              {periodInfo.dateRangeText}
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
            <Clock className="w-3.5 h-3.5" />
            <span>{periodInfo.subText}</span>
          </div>
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-lg relative overflow-hidden group"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Revenue ({period})
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
            {currencySymbol}{totalSalesAmount.toLocaleString()}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
            <ArrowUpRight className="w-4 h-4" />
            <span>{periodOrders.length} order{periodOrders.length === 1 ? '' : 's'} placed</span>
          </div>
        </motion.div>

        {/* Date(s) of Sale Window */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-lg relative overflow-hidden group"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Date(s) of Sale
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-base lg:text-lg font-black text-slate-900 dark:text-white truncate" title={periodInfo.dateRangeText}>
            {periodInfo.dateRangeText}
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
            {periodInfo.label} Breakdown
          </div>
        </motion.div>

        {/* Most Sold Product */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-lg relative overflow-hidden group col-span-1 sm:col-span-2 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              Most Sold Product
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 uppercase tracking-widest">
              Top Performer
            </span>
          </div>

          {mostSoldProduct ? (
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center relative">
                {mostSoldProduct.imageUrl ? (
                  <img 
                    src={mostSoldProduct.imageUrl} 
                    alt={mostSoldProduct.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Package className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate" title={mostSoldProduct.name}>
                  {mostSoldProduct.name}
                </h4>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs">
                  <span className="font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-lg border border-purple-200 dark:border-purple-800/60">
                    {mostSoldProduct.qty} unit{mostSoldProduct.qty === 1 ? '' : 's'} sold
                  </span>
                  <span className="font-black font-mono text-slate-900 dark:text-slate-100">
                    {currencySymbol}{mostSoldProduct.revenue.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-2 text-xs text-slate-400 italic">
              No product sales recorded in this period yet.
            </div>
          )}
        </motion.div>
      </div>

      {/* Visual Chart Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 lg:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white font-display flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Sales Trend Chart ({period.toUpperCase()})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Revenue movement visualization across selected time intervals
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {period === 'quarterly' && (
              <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-200/80 dark:border-slate-700/80 mr-1 sm:mr-2">
                {[
                  { id: 0, label: 'Q1', range: 'Jan-Mar' },
                  { id: 1, label: 'Q2', range: 'Apr-Jun' },
                  { id: 2, label: 'Q3', range: 'Jul-Sep' },
                  { id: 3, label: 'Q4', range: 'Oct-Dec' },
                ].map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setSelectedQuarter(q.id)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer border-none",
                      selectedQuarter === q.id
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    )}
                    title={`Quarter ${q.id + 1} (${q.range})`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setChartType('area')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border-none cursor-pointer",
                chartType === 'area'
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Area Trend
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border-none cursor-pointer",
                chartType === 'bar'
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Bar Comparison
            </button>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} 
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${currencySymbol}${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl border border-slate-700/80 text-xs font-sans">
                          <p className="font-bold text-purple-300 mb-1">{data.fullName || data.name}</p>
                          <p className="font-black text-sm text-emerald-400 font-mono">
                            Revenue: {currencySymbol}{data.sales.toLocaleString()}
                          </p>
                          <p className="text-[11px] text-slate-300 mt-1">
                            Orders: <strong className="text-white">{data.orders}</strong>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#9333ea" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
              </AreaChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} 
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${currencySymbol}${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl border border-slate-700/80 text-xs font-sans">
                          <p className="font-bold text-purple-300 mb-1">{data.fullName || data.name}</p>
                          <p className="font-black text-sm text-emerald-400 font-mono">
                            Revenue: {currencySymbol}{data.sales.toLocaleString()}
                          </p>
                          <p className="text-[11px] text-slate-300 mt-1">
                            Orders: <strong className="text-white">{data.orders}</strong>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="sales" radius={[8, 8, 0, 0]} fill="#9333ea">
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.sales > 0 ? '#9333ea' : '#cbd5e1'} 
                      opacity={entry.sales > 0 ? 0.9 : 0.4}
                    />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table of Recent Sales */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 lg:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white font-display flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Recent Sales Orders Table
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Breakdown of individual transactions including date, product, quantity, and total amount
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search orders or buyers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs focus:outline-none focus:border-purple-500 text-slate-900 dark:text-white font-medium"
              />
            </div>

            {/* Beautiful Custom Status Dropdown */}
            <BeautifulDropdown
              value={statusFilter}
              options={statusOptions}
              onChange={(val) => setStatusFilter(val)}
              label="Filter"
              icon={<Filter className="w-3.5 h-3.5" />}
              align="right"
            />
          </div>
        </div>

        {/* Sales Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black text-[10px]">
                <th className="pb-3 px-3">Date</th>
                <th className="pb-3 px-3">Product</th>
                <th className="pb-3 px-3 text-center">Quantity</th>
                <th className="pb-3 px-3 text-right">Amount</th>
                <th className="pb-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredRecentSales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="font-bold text-slate-600 dark:text-slate-300 text-sm">No sales recorded</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery ? "No sales match your search criteria." : "No orders found for the selected time period or status filter."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecentSales.map((order, oIdx) => {
                  const dateFormatted = order.createdAt 
                    ? new Date(order.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'N/A';

                  return (
                    <tr 
                      key={`sale-${order.id || oIdx}-${oIdx}`} 
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Date */}
                      <td className="py-4 px-3 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {dateFormatted}
                      </td>

                      {/* Product */}
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                            {order.productImageUrl ? (
                              <img 
                                src={order.productImageUrl} 
                                alt={order.productName} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <Package className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white line-clamp-1">
                              {order.productName || 'Order Item'}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              Buyer: {order.buyerName || 'Student Buyer'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="py-4 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
                        {order.quantity || 1}
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-3 text-right font-black font-mono text-slate-900 dark:text-white text-sm">
                        {currencySymbol}{(order.totalPrice || 0).toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-3 text-center">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold capitalize inline-block",
                          order.status === 'completed' || order.status === 'delivered'
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60"
                            : order.status === 'accepted' || order.status === 'out_for_delivery'
                            ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60"
                            : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60"
                        )}>
                          {order.status?.replace(/_/g, ' ') || 'pending'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
