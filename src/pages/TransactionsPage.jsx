import { Receipt, TrendingUp, TrendingDown, Filter } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatCurrency, getFirebaseErrorMessage } from "../utils/helpers";
import { listenToOrders } from "../services/orderService";

function formatDateTime(val) {
  if (!val) return "—";
  const d = val instanceof Date ? val : val.toDate ? val.toDate() : new Date(val);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatDateStr(val) {
  if (!val) return "";
  const d = val instanceof Date ? val : val.toDate ? val.toDate() : new Date(val);
  return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
}

const statusMeta = {
  pending:   { label: "Pending",   cls: "bg-amber-100 text-amber-800" },
  confirmed: { label: "Confirmed", cls: "bg-blue-100 text-blue-700" },
  preparing: { label: "Preparing", cls: "bg-saffron/20 text-amber-700" },
  on_the_way: { label: "On the way", cls: "bg-violet-100 text-violet-700" },
  delivered: { label: "Delivered", cls: "bg-leaf/10 text-leaf" },
  cancelled: { label: "Cancelled", cls: "bg-rose-100 text-rose-700" },
};

export default function TransactionsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  useEffect(() => {
    setLoading(true);
    const unsub = listenToOrders(
      (items) => { setOrders(items); setLoading(false); setError(""); },
      (err) => { setError(getFirebaseErrorMessage(err)); setLoading(false); }
    );
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    const kw = query.toLowerCase();
    return orders.filter((o) => {
      const matchStatus = statusFilter === "all" || o.status === statusFilter;
      const ds = formatDateStr(o.createdAt);
      const matchFrom = !dateFrom || ds >= dateFrom;
      const matchTo = !dateTo || ds <= dateTo;
      const matchQuery = [o.id, o.customerName, o.restaurantName, o.hotelName]
        .filter(Boolean).join(" ").toLowerCase().includes(kw);
      return matchStatus && matchFrom && matchTo && matchQuery;
    });
  }, [orders, query, statusFilter, dateFrom, dateTo]);

  const stats = useMemo(() => ({
    total: filtered.length,
    revenue: filtered.filter((o) => o.status === "delivered").reduce((s, o) => s + Number(o.total || 0), 0),
    refunded: filtered.filter((o) => o.status === "cancelled").reduce((s, o) => s + Number(o.total || 0), 0),
    avgValue: filtered.length ? filtered.reduce((s, o) => s + Number(o.total || 0), 0) / filtered.length : 0,
  }), [filtered]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  // Reset to page 1 when filter changes
  useEffect(() => { setPage(1); }, [query, statusFilter, dateFrom, dateTo]);

  const statusKeys = Object.keys(statusMeta);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <p className="eyebrow">Finance</p>
          <h1 className="page-title">Transactions</h1>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="metric">
          <Receipt className="h-5 w-5 text-ember" />
          <span>Shown transactions</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="metric">
          <TrendingUp className="h-5 w-5 text-leaf" />
          <span>Revenue (delivered)</span>
          <strong className="text-leaf">{formatCurrency(stats.revenue)}</strong>
        </div>
        <div className="metric">
          <TrendingDown className="h-5 w-5 text-rose-500" />
          <span>Lost (cancelled)</span>
          <strong className="text-rose-600">{formatCurrency(stats.refunded)}</strong>
        </div>
        <div className="metric">
          <span>Avg. order value</span>
          <strong>{formatCurrency(stats.avgValue)}</strong>
        </div>
      </div>

      {error ? <div className="alert">{error}</div> : null}

      {/* Filters */}
      <div className="panel">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${statusFilter === "all" ? "bg-ember text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              onClick={() => setStatusFilter("all")}
              type="button"
            >
              All
            </button>
            {statusKeys.map((s) => (
              <button
                key={s}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${statusFilter === s ? "bg-ember text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                onClick={() => setStatusFilter(s)}
                type="button"
              >
                {statusMeta[s].label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <input className="input py-1.5 text-sm" onChange={(e) => setDateFrom(e.target.value)} placeholder="From date" type="date" value={dateFrom} />
            <input className="input py-1.5 text-sm" onChange={(e) => setDateTo(e.target.value)} placeholder="To date" type="date" value={dateTo} />
            <input className="input py-1.5 text-sm sm:max-w-xs" onChange={(e) => setQuery(e.target.value)} placeholder="Search by order, name…" value={query} />
          </div>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading transactions" />
        ) : filtered.length === 0 ? (
          <div className="empty-state">No transactions match your filters.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="pb-3 pr-4">Order ID</th>
                    <th className="pb-3 pr-4">Customer</th>
                    <th className="pb-3 pr-4">Restaurant</th>
                    <th className="pb-3 pr-4">Amount</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3">Date &amp; time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginated.map((o) => {
                    const meta = statusMeta[o.status] || statusMeta.pending;
                    return (
                      <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 pr-4">
                          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-700">
                            {o.id.slice(0, 8)}…
                          </code>
                        </td>
                        <td className="py-3 pr-4">
                          <p className="font-semibold text-slate-950">{o.customerName || "—"}</p>
                          <p className="text-xs text-slate-500">{o.customerPhone || ""}</p>
                        </td>
                        <td className="py-3 pr-4 text-slate-600">{o.restaurantName || o.hotelName || "—"}</td>
                        <td className="py-3 pr-4 font-bold text-slate-950">{formatCurrency(o.total)}</td>
                        <td className="py-3 pr-4">
                          <span className={`badge ${meta.cls}`}>{meta.label}</span>
                        </td>
                        <td className="py-3 text-xs text-slate-500 whitespace-nowrap">{formatDateTime(o.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                <p className="text-sm text-slate-500">
                  Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex gap-1">
                  <button
                    className="rounded-md px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    type="button"
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                    const pageNum = start + i;
                    if (pageNum > totalPages) return null;
                    return (
                      <button
                        key={pageNum}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${page === pageNum ? "bg-ember text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                        onClick={() => setPage(pageNum)}
                        type="button"
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    className="rounded-md px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    type="button"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
