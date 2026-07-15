import { BarChart3, TrendingUp, TrendingDown, ShoppingBag, Users, Star, Package } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatCurrency, getFirebaseErrorMessage } from "../utils/helpers";
import { listenToOrders } from "../services/orderService";

function formatDate(val) {
  if (!val) return "";
  const d = val instanceof Date ? val : val.toDate ? val.toDate() : new Date(val);
  return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
}

function getMonthLabel(date) {
  return date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

function StatCard({ icon: Icon, label, value, sub, color = "text-ember" }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-0.5 text-2xl font-black text-slate-950">{value}</p>
          {sub ? <p className="mt-0.5 text-xs text-slate-500">{sub}</p> : null}
        </div>
      </div>
    </div>
  );
}

function MiniBar({ label, value, max, color = "bg-ember" }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 truncate text-xs text-slate-600">{label}</span>
      <div className="flex-1 overflow-hidden rounded-full bg-slate-100 h-2">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 shrink-0 text-right text-xs font-semibold text-slate-700">{value}</span>
    </div>
  );
}

export default function ReportsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 2);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => {
    setLoading(true);
    const unsub = listenToOrders(
      (items) => { setOrders(items); setLoading(false); setError(""); },
      (err) => { setError(getFirebaseErrorMessage(err)); setLoading(false); }
    );
    return unsub;
  }, []);

  const rangeOrders = useMemo(() => {
    if (!dateFrom && !dateTo) return orders;
    return orders.filter((o) => {
      const ds = formatDate(o.createdAt);
      if (!ds) return false;
      if (dateFrom && ds < dateFrom) return false;
      if (dateTo && ds > dateTo) return false;
      return true;
    });
  }, [orders, dateFrom, dateTo]);

  const analytics = useMemo(() => {
    const totalRevenue = rangeOrders.reduce((s, o) => s + Number(o.total || 0), 0);
    const delivered = rangeOrders.filter((o) => o.status === "delivered");
    const cancelled = rangeOrders.filter((o) => o.status === "cancelled");
    const avgOrder = rangeOrders.length ? totalRevenue / rangeOrders.length : 0;

    // Monthly breakdown (last 6 months from rangeOrders)
    const monthlyMap = {};
    rangeOrders.forEach((o) => {
      const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt || 0);
      const key = getMonthLabel(d);
      if (!monthlyMap[key]) monthlyMap[key] = { revenue: 0, count: 0 };
      monthlyMap[key].revenue += Number(o.total || 0);
      monthlyMap[key].count += 1;
    });
    const monthly = Object.entries(monthlyMap).slice(-6).map(([label, v]) => ({ label, ...v }));

    // Status breakdown
    const statusMap = {};
    rangeOrders.forEach((o) => {
      const s = o.status || "unknown";
      statusMap[s] = (statusMap[s] || 0) + 1;
    });

    // Top restaurants
    const restMap = {};
    rangeOrders.forEach((o) => {
      const r = o.restaurantName || o.hotelName || "Unknown";
      if (!restMap[r]) restMap[r] = { count: 0, revenue: 0 };
      restMap[r].count += 1;
      restMap[r].revenue += Number(o.total || 0);
    });
    const topRestaurants = Object.entries(restMap)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([name, v]) => ({ name, ...v }));

    return { totalRevenue, avgOrder, delivered: delivered.length, cancelled: cancelled.length, monthly, statusMap, topRestaurants };
  }, [rangeOrders]);

  const maxMonthlyRevenue = useMemo(() => Math.max(...analytics.monthly.map((m) => m.revenue), 1), [analytics.monthly]);
  const maxRestCount = useMemo(() => Math.max(...analytics.topRestaurants.map((r) => r.count), 1), [analytics.topRestaurants]);
  const maxStatus = useMemo(() => Math.max(...Object.values(analytics.statusMap), 1), [analytics.statusMap]);

  const deliveryRate = rangeOrders.length ? Math.round((analytics.delivered / rangeOrders.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <p className="eyebrow">Finance</p>
          <h1 className="page-title">Reports &amp; Analytics</h1>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <label className="field-label flex-row items-center gap-2 text-xs">
            From
            <input className="input py-1.5 text-sm" onChange={(e) => setDateFrom(e.target.value)} type="date" value={dateFrom} />
          </label>
          <label className="field-label flex-row items-center gap-2 text-xs">
            To
            <input className="input py-1.5 text-sm" onChange={(e) => setDateTo(e.target.value)} type="date" value={dateTo} />
          </label>
        </div>
      </div>

      {error ? <div className="alert">{error}</div> : null}

      {loading ? (
        <LoadingSpinner label="Loading reports" />
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={TrendingUp} label="Total revenue" value={formatCurrency(analytics.totalRevenue)} sub={`from ${rangeOrders.length} orders`} color="text-ember" />
            <StatCard icon={ShoppingBag} label="Orders in range" value={rangeOrders.length} sub={`${deliveryRate}% delivery rate`} color="text-saffron" />
            <StatCard icon={BarChart3} label="Avg. order value" value={formatCurrency(analytics.avgOrder)} color="text-violet-600" />
            <StatCard icon={TrendingDown} label="Cancelled" value={analytics.cancelled} sub={`${rangeOrders.length ? Math.round((analytics.cancelled / rangeOrders.length) * 100) : 0}% of orders`} color="text-rose-500" />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            {/* Monthly revenue bars */}
            <div className="panel">
              <h2 className="mb-4 text-base font-bold text-slate-950">Monthly revenue trend</h2>
              {analytics.monthly.length === 0 ? (
                <div className="empty-state text-sm">No data in selected range.</div>
              ) : (
                <div className="space-y-3">
                  {analytics.monthly.map((m) => (
                    <MiniBar key={m.label} label={m.label} value={m.count} max={Math.max(...analytics.monthly.map((x) => x.count), 1)} color="bg-ember" />
                  ))}
                </div>
              )}
              <div className="mt-4 border-t border-slate-100 pt-4 space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Revenue by month</p>
                {analytics.monthly.map((m) => (
                  <div className="flex justify-between text-sm" key={m.label}>
                    <span className="text-slate-600">{m.label}</span>
                    <span className="font-bold text-slate-900">{formatCurrency(m.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Order status breakdown */}
            <div className="panel">
              <h2 className="mb-4 text-base font-bold text-slate-950">Order status breakdown</h2>
              {Object.keys(analytics.statusMap).length === 0 ? (
                <div className="empty-state text-sm">No data in selected range.</div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(analytics.statusMap)
                    .sort((a, b) => b[1] - a[1])
                    .map(([status, count]) => (
                      <MiniBar
                        key={status}
                        label={status.charAt(0).toUpperCase() + status.slice(1)}
                        value={count}
                        max={maxStatus}
                        color={
                          status === "delivered" ? "bg-leaf" :
                          status === "cancelled" ? "bg-rose-400" :
                          status === "pending" ? "bg-amber-400" :
                          status === "preparing" ? "bg-saffron" :
                          "bg-slate-400"
                        }
                      />
                    ))
                  }
                </div>
              )}
            </div>
          </div>

          {/* Top restaurants */}
          <div className="panel">
            <h2 className="mb-4 text-base font-bold text-slate-950">Top restaurants by orders</h2>
            {analytics.topRestaurants.length === 0 ? (
              <div className="empty-state text-sm">No restaurant data in selected range.</div>
            ) : (
              <div className="space-y-3">
                {analytics.topRestaurants.map((r, i) => (
                  <div className="flex items-center gap-4" key={r.name}>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ember/10 text-xs font-black text-ember">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate font-semibold text-slate-950">{r.name}</p>
                        <span className="ml-4 shrink-0 text-sm font-bold text-slate-700">{r.count} orders</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full bg-gradient-to-r from-ember to-saffron rounded-full transition-all duration-500"
                          style={{ width: `${(r.count / maxRestCount) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-slate-500">{formatCurrency(r.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
