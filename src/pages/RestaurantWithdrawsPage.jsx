import { DollarSign, Search, CheckCircle, XCircle, Eye } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Toast from "../components/common/Toast";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { listenToRestaurantWithdrawals, updateRestaurantWithdrawal } from "../services/financeService";
import { formatCurrency, getFirebaseErrorMessage } from "../utils/helpers";

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function RestaurantWithdrawsPage() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toast, setToast] = useState(null);
  const [processingItem, setProcessingItem] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [viewItem, setViewItem] = useState(null);

  useEffect(() => {
    const unsub = listenToRestaurantWithdrawals(
      (data) => { setWithdrawals(data); setLoading(false); },
      (err) => { console.error(err); setLoading(false); }
    );
    return () => unsub && unsub();
  }, []);

  const filtered = useMemo(() => {
    const kw = query.toLowerCase();
    return withdrawals.filter((w) => {
      if (statusFilter !== "all" && w.status !== statusFilter) return false;
      return (w.restaurantName || "").toLowerCase().includes(kw) || (w.id || "").toLowerCase().includes(kw);
    });
  }, [withdrawals, query, statusFilter]);

  const stats = useMemo(() => ({
    total: withdrawals.length,
    pending: withdrawals.filter((w) => w.status === "pending").length,
    approved: withdrawals.filter((w) => w.status === "approved").length,
    totalAmount: withdrawals.reduce((s, w) => s + Number(w.amount || 0), 0),
  }), [withdrawals]);

  async function handleAction() {
    if (!processingItem || !actionType) return;
    try {
      await updateRestaurantWithdrawal(processingItem.id, {
        status: actionType === "approve" ? "approved" : "rejected",
        processedAt: new Date().toISOString(),
      });
      setToast({ type: "success", message: `Withdrawal ${actionType === "approve" ? "approved" : "rejected"} successfully.` });
      setProcessingItem(null);
      setActionType(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <p className="eyebrow">Transaction Management</p>
        <h1 className="page-title">Restaurant Withdrawals</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="metric"><DollarSign className="h-5 w-5 text-ember" /><span>Total Requests</span><strong>{stats.total}</strong></div>
        <div className="metric"><span>Pending</span><strong className="text-amber-600">{stats.pending}</strong></div>
        <div className="metric"><span>Approved</span><strong className="text-green-600">{stats.approved}</strong></div>
        <div className="metric"><span>Total Amount</span><strong>{formatCurrency(stats.totalAmount)}</strong></div>
      </div>

      <div className="panel space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-950">Withdrawal Requests</h2>
          <div className="flex flex-wrap gap-3">
            <select className="input text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input className="input pl-9 text-sm" placeholder="Search restaurant..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid min-h-[200px] place-items-center">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-ember" />
          </div>
        ) : !filtered.length ? (
          <div className="empty-state">No withdrawal requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-900">
                <tr>
                  <th className="p-3 font-semibold">Sl</th>
                  <th className="p-3 font-semibold">Restaurant</th>
                  <th className="p-3 font-semibold">Method</th>
                  <th className="p-3 font-semibold">Amount</th>
                  <th className="p-3 font-semibold">Requested At</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((w, i) => (
                  <tr key={w.id} className="hover:bg-slate-50/50">
                    <td className="p-3 text-slate-500">{i + 1}</td>
                    <td className="p-3 font-medium text-slate-900">{w.restaurantName || "—"}</td>
                    <td className="p-3">{w.method || "Bank Transfer"}</td>
                    <td className="p-3 font-bold text-ember">{formatCurrency(w.amount)}</td>
                    <td className="p-3 text-slate-500">{w.createdAt?.toDate ? w.createdAt.toDate().toLocaleDateString() : "—"}</td>
                    <td className="p-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold uppercase ${STATUS_COLORS[w.status] || STATUS_COLORS.pending}`}>
                        {w.status || "pending"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button title="View Details" onClick={() => setViewItem(w)} className="p-1.5 rounded text-slate-500 hover:bg-slate-100">
                          <Eye className="h-4 w-4" />
                        </button>
                        {w.status === "pending" && (
                          <>
                            <button title="Approve" onClick={() => { setProcessingItem(w); setActionType("approve"); }} className="p-1.5 rounded text-green-600 hover:bg-green-50">
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button title="Reject" onClick={() => { setProcessingItem(w); setActionType("reject"); }} className="p-1.5 rounded text-red-600 hover:bg-red-50">
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Modal */}
      {viewItem && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 px-4">
          <div className="w-full max-w-md rounded-md bg-white p-6 shadow-soft">
            <h3 className="text-lg font-semibold text-slate-950 mb-4">Withdrawal Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Restaurant</span><strong>{viewItem.restaurantName || "—"}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Amount</span><strong className="text-ember">{formatCurrency(viewItem.amount)}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Method</span><strong>{viewItem.method || "Bank Transfer"}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Account No.</span><strong>{viewItem.accountNumber || "—"}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Status</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${STATUS_COLORS[viewItem.status] || STATUS_COLORS.pending}`}>{viewItem.status}</span>
              </div>
              {viewItem.note && <div><p className="text-slate-500 mb-1">Note</p><p className="rounded bg-slate-50 p-2">{viewItem.note}</p></div>}
            </div>
            <div className="mt-6 flex justify-end">
              <button className="btn-secondary" onClick={() => setViewItem(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        confirmLabel={actionType === "approve" ? "Approve" : "Reject"}
        message={`Are you sure you want to ${actionType} this withdrawal request of ${formatCurrency(processingItem?.amount)}?`}
        onCancel={() => { setProcessingItem(null); setActionType(null); }}
        onConfirm={handleAction}
        open={Boolean(processingItem)}
        title={actionType === "approve" ? "Approve Withdrawal" : "Reject Withdrawal"}
      />
      <Toast message={toast?.message} onClose={() => setToast(null)} type={toast?.type} />
    </div>
  );
}
