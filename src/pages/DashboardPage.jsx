import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import {
  ShoppingBag, Store, Users, Bike, TrendingUp, DollarSign,
  Clock, CheckCircle, ArrowUp, ArrowDown
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { listenToOrders } from "../services/orderService";
import { listenToDeliveryPartners } from "../services/deliveryService";
import { formatCurrency } from "../utils/helpers";
import { useProducts } from "../hooks/useProducts";
import { useHotels } from "../hooks/useHotels";
import { useUsers } from "../hooks/useUsers";

// ── Helpers ───────────────────────────────────────────────────────────────────
const DATE_FILTERS = ["today", "week", "month", "year"];

function getDateRange(filter) {
  const now = new Date();
  const start = new Date();
  if (filter === "today") { start.setHours(0, 0, 0, 0); }
  else if (filter === "week") { start.setDate(now.getDate() - 6); start.setHours(0, 0, 0, 0); }
  else if (filter === "month") { start.setDate(1); start.setHours(0, 0, 0, 0); }
  else { start.setMonth(0); start.setDate(1); start.setHours(0, 0, 0, 0); }
  return start;
}

function toDate(val) {
  if (!val) return null;
  if (val?.toDate) return val.toDate();
  if (val?.seconds) return new Date(val.seconds * 1000);
  return new Date(val);
}

function filterByDate(items, filter) {
  const start = getDateRange(filter);
  return items.filter((o) => {
    const d = toDate(o.createdAt);
    return d && d >= start;
  });
}

// Build daily revenue data for bar chart
function buildRevenueChart(orders, filter) {
  const now = new Date();
  const labels = [];
  const map = {};

  if (filter === "today") {
    for (let h = 0; h < 24; h++) {
      const key = `${h}:00`;
      labels.push(key);
      map[key] = 0;
    }
    orders.forEach((o) => {
      const d = toDate(o.createdAt);
      if (d) {
        const key = `${d.getHours()}:00`;
        if (map[key] !== undefined) map[key] += Number(o.total || 0);
      }
    });
  } else if (filter === "week") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(now.getDate() - i);
      const key = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
      labels.push(key);
      map[key] = 0;
    }
    orders.forEach((o) => {
      const d = toDate(o.createdAt);
      if (d) {
        const key = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
        if (map[key] !== undefined) map[key] += Number(o.total || 0);
      }
    });
  } else if (filter === "month") {
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= days; i++) { labels.push(String(i)); map[String(i)] = 0; }
    orders.forEach((o) => {
      const d = toDate(o.createdAt);
      if (d && d.getMonth() === now.getMonth()) {
        const key = String(d.getDate());
        if (map[key] !== undefined) map[key] += Number(o.total || 0);
      }
    });
  } else {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    months.forEach((m) => { labels.push(m); map[m] = 0; });
    orders.forEach((o) => {
      const d = toDate(o.createdAt);
      if (d) {
        const key = months[d.getMonth()];
        if (map[key] !== undefined) map[key] += Number(o.total || 0);
      }
    });
  }

  return labels.map((l) => ({ name: l, revenue: Math.round(map[l] || 0) }));
}

// ── Components ────────────────────────────────────────────────────────────────
const PIE_COLORS = { 
  delivered: "#22c55e", 
  pending: "#f59e0b",
  accepted: "#0ea5e9",
  confirmed: "#0ea5e9",
  preparing: "#6366f1",
  processing: "#6366f1",
  handover: "#818cf8",
  picked_up: "#3b82f6",
  out_for_delivery: "#3b82f6", 
  canceled: "#ef4444",
  cancelled: "#ef4444",
  failed: "#f43f5e",
  refunded: "#8b5cf6" 
};

function KPICard({ icon: Icon, label, value, sub, color = "text-ember", trend }) {
  return (
    <div className="metric items-start gap-3">
      <div className={`grid h-10 w-10 place-items-center rounded-lg ${color === "text-ember" ? "bg-ember/10" : color === "text-green-600" ? "bg-green-100" : color === "text-blue-600" ? "bg-blue-100" : color === "text-purple-600" ? "bg-purple-100" : "bg-amber-100"}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-0.5 text-2xl font-black text-slate-950">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      {trend != null && (
        <div className={`flex items-center gap-1 text-xs font-semibold ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>
          {trend >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          {Math.abs(trend)}% vs last period
        </div>
      )}
    </div>
  );
}

function RecentOrdersTable({ orders }) {
  const STATUS_COLORS = {
    delivered: "bg-green-100 text-green-700",
    pending: "bg-amber-100 text-amber-700",
    accepted: "bg-teal-100 text-teal-700",
    confirmed: "bg-teal-100 text-teal-700",
    preparing: "bg-indigo-100 text-indigo-700",
    processing: "bg-indigo-100 text-indigo-700",
    handover: "bg-indigo-100 text-indigo-700",
    picked_up: "bg-blue-100 text-blue-700",
    out_for_delivery: "bg-blue-100 text-blue-700",
    canceled: "bg-red-100 text-red-700",
    cancelled: "bg-red-100 text-red-700",
    failed: "bg-rose-100 text-rose-700",
    refunded: "bg-purple-100 text-purple-700",
  };
  return (
    <div className="panel space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-950">Recent Orders</h2>
        <span className="text-xs text-slate-400">Live</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <tr>
              <th className="pb-2 pr-4">Order</th>
              <th className="pb-2 pr-4">Customer</th>
              <th className="pb-2 pr-4">Amount</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {orders.slice(0, 8).map((o) => (
              <tr key={o.id} className="hover:bg-slate-50/50">
                <td className="py-2 pr-4 font-medium text-slate-800">#{o.id.slice(0, 8)}</td>
                <td className="py-2 pr-4 text-slate-600">{o.customerName || o.customer?.name || "Guest"}</td>
                <td className="py-2 pr-4 font-semibold text-ember">{formatCurrency(o.total)}</td>
                <td className="py-2">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_COLORS[o.status] || "bg-slate-100 text-slate-600"}`}>
                    {String(o.status || "pending").replaceAll("_", " ")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!orders.length && <p className="text-center text-sm text-slate-400 py-6">No orders yet.</p>}
      </div>
    </div>
  );
}

function TopFoodsTable({ orders }) {
  const topFoods = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      (o.items || []).forEach((item) => {
        if (!item?.name) return;
        if (!map[item.name]) map[item.name] = { name: item.name, quantity: 0, revenue: 0 };
        map[item.name].quantity += Number(item.quantity || 1);
        map[item.name].revenue += Number(item.price || 0) * Number(item.quantity || 1);
      });
    });
    return Object.values(map).sort((a, b) => b.quantity - a.quantity).slice(0, 6);
  }, [orders]);

  return (
    <div className="panel space-y-4">
      <h2 className="text-lg font-bold text-slate-950">Top Selling Foods</h2>
      {!topFoods.length ? (
        <p className="text-sm text-slate-400 py-4 text-center">No food data available.</p>
      ) : (
        <div className="space-y-3">
          {topFoods.map((food, i) => (
            <div key={food.name} className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 w-5">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">{food.name}</p>
                <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-ember" style={{ width: `${Math.min(100, (food.quantity / topFoods[0].quantity) * 100)}%` }} />
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-slate-700">{food.quantity} sold</p>
                <p className="text-xs text-slate-400">{formatCurrency(food.revenue)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [dateFilter, setDateFilter] = useState("week");
  const [allOrders, setAllOrders] = useState([]);
  const [deliverymen, setDeliverymen] = useState([]);
  const { products } = useProducts();
  const { hotels } = useHotels();
  const { users } = useUsers();

  useEffect(() => {
    const u1 = listenToOrders((data) => setAllOrders(data), (err) => console.error(err));
    const u2 = listenToDeliveryPartners((data) => setDeliverymen(data), (err) => console.error(err));
    return () => { u1 && u1(); u2 && u2(); };
  }, []);

  const filtered = useMemo(() => filterByDate(allOrders, dateFilter), [allOrders, dateFilter]);

  const stats = useMemo(() => {
    const revenue = filtered.reduce((s, o) => s + Number(o.total || 0), 0);
    const delivered = filtered.filter((o) => o.status === "delivered").length;
    const pending = filtered.filter((o) => {
      const s = String(o.status || "pending").toLowerCase();
      return ["pending", "accepted", "confirmed", "processing", "handover"].includes(s);
    }).length;
    const commission = revenue * 0.10; // 10% admin commission
    return { revenue, delivered, pending, total: filtered.length, commission };
  }, [filtered]);

  // Order status for pie chart
  const pieData = useMemo(() => {
    const statusCount = {};
    filtered.forEach((o) => {
      const s = o.status || "pending";
      statusCount[s] = (statusCount[s] || 0) + 1;
    });
    return Object.entries(statusCount).map(([name, value]) => ({ name: String(name).replaceAll("_", " "), value, key: name }));
  }, [filtered]);

  const revenueChartData = useMemo(() => buildRevenueChart(filtered, dateFilter), [filtered, dateFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <p className="eyebrow">Operations Dashboard</p>
          <h1 className="page-title">Bachelor Foods</h1>
        </div>
        <div className="flex gap-2">
          {DATE_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setDateFilter(f)}
              className={`rounded-xl px-4 py-2 text-xs font-bold capitalize transition-all duration-300 hover:-translate-y-0.5 ${
                dateFilter === f ? "bg-ember text-white shadow-soft" : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:shadow-sm"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KPICard icon={ShoppingBag} label="Total Orders" value={stats.total} sub={`${stats.pending} pending`} color="text-ember" />
        <KPICard icon={DollarSign} label="Revenue" value={formatCurrency(stats.revenue)} sub="Gross income" color="text-green-600" />
        <KPICard icon={TrendingUp} label="Commission" value={formatCurrency(stats.commission)} sub="10% of revenue" color="text-purple-600" />
        <KPICard icon={Store} label="Restaurants" value={hotels.length} sub={`${hotels.filter((h) => h.open || h.active).length} active`} color="text-blue-600" />
        <KPICard icon={Users} label="Customers" value={users.filter((u) => u.role === "user" || !u.role).length} sub="Registered users" color="text-amber-600" />
        <KPICard icon={Bike} label="Delivery Men" value={deliverymen.length} sub={`${deliverymen.filter((d) => d.status === "active").length} active`} color="text-text-ember" />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        {/* Revenue Bar Chart */}
        <div className="panel">
          <h2 className="text-lg font-bold text-slate-950 mb-5">Revenue Overview</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={revenueChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} />
              <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
              <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Pie Chart */}
        <div className="panel">
          <h2 className="text-lg font-bold text-slate-950 mb-5">Order Status</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  {pieData.map((entry) => (
                    <Cell key={entry.key} fill={PIE_COLORS[entry.key] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid min-h-[240px] place-items-center text-slate-400 text-sm">No order data for this period.</div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <RecentOrdersTable orders={allOrders} />
        <TopFoodsTable orders={filtered} />
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="panel flex items-center gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Delivered</p>
            <p className="text-2xl font-black text-slate-950">{stats.delivered}</p>
          </div>
        </div>
        <div className="panel flex items-center gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-100">
            <Clock className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Pending</p>
            <p className="text-2xl font-black text-slate-950">{stats.pending}</p>
          </div>
        </div>
        <div className="panel flex items-center gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-100">
            <Store className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Products</p>
            <p className="text-2xl font-black text-slate-950">{products.length}</p>
          </div>
        </div>
        <div className="panel flex items-center gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-purple-100">
            <Bike className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Active Riders</p>
            <p className="text-2xl font-black text-slate-950">{deliverymen.filter((d) => d.status === "active").length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
