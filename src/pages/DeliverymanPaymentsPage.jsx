import { Send, Search, CheckCircle, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Toast from "../components/common/Toast";
import {
  listenToDeliverymanPayments,
  createDeliverymanPayment,
  updateDeliverymanPayment,
} from "../services/financeService";
import { formatCurrency, getFirebaseErrorMessage } from "../utils/helpers";

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function DeliverymanPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toast, setToast] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ deliverymanName: "", amount: "", method: "cash", note: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = listenToDeliverymanPayments(
      (data) => { setPayments(data); setLoading(false); },
      (err) => { console.error(err); setLoading(false); }
    );
    return () => unsub && unsub();
  }, []);

  const filtered = useMemo(() => {
    const kw = query.toLowerCase();
    return payments.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      return (p.deliverymanName || "").toLowerCase().includes(kw);
    });
  }, [payments, query, statusFilter]);

  const stats = useMemo(() => ({
    total: payments.length,
    pending: payments.filter((p) => p.status === "pending").length,
    paid: payments.filter((p) => p.status === "paid").length,
    totalPaid: payments.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount || 0), 0),
  }), [payments]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.deliverymanName || !form.amount) return;
    setSubmitting(true);
    try {
      await createDeliverymanPayment({
        deliverymanName: form.deliverymanName,
        amount: Number(form.amount),
        method: form.method,
        note: form.note,
      });
      setToast({ type: "success", message: "Payment record created." });
      setForm({ deliverymanName: "", amount: "", method: "cash", note: "" });
      setShowCreate(false);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMarkPaid(payment) {
    try {
      await updateDeliverymanPayment(payment.id, { status: "paid", paidAt: new Date().toISOString() });
      setToast({ type: "success", message: "Marked as paid." });
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header flex items-center justify-between">
        <div>
          <p className="eyebrow">Transaction Management</p>
          <h1 className="page-title">Delivery Man Payments</h1>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Add Payment
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="metric"><Send className="h-5 w-5 text-ember" /><span>Total Records</span><strong>{stats.total}</strong></div>
        <div className="metric"><span>Pending</span><strong className="text-amber-600">{stats.pending}</strong></div>
        <div className="metric"><span>Paid</span><strong className="text-green-600">{stats.paid}</strong></div>
        <div className="metric"><span>Total Paid Out</span><strong>{formatCurrency(stats.totalPaid)}</strong></div>
      </div>

      <div className="panel space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-950">Payment Records</h2>
          <div className="flex flex-wrap gap-3">
            <select className="input text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input className="input pl-9 text-sm" placeholder="Search deliveryman..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid min-h-[200px] place-items-center">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-ember" />
          </div>
        ) : !filtered.length ? (
          <div className="empty-state">No payment records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-900">
                <tr>
                  <th className="p-3 font-semibold">Sl</th>
                  <th className="p-3 font-semibold">Delivery Man</th>
                  <th className="p-3 font-semibold">Method</th>
                  <th className="p-3 font-semibold">Amount</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Date</th>
                  <th className="p-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((p, i) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="p-3 text-slate-500">{i + 1}</td>
                    <td className="p-3 font-medium text-slate-900">{p.deliverymanName || "—"}</td>
                    <td className="p-3 capitalize">{p.method || "cash"}</td>
                    <td className="p-3 font-bold text-ember">{formatCurrency(p.amount)}</td>
                    <td className="p-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold uppercase ${STATUS_COLORS[p.status] || STATUS_COLORS.pending}`}>
                        {p.status || "pending"}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString() : "—"}</td>
                    <td className="p-3 text-right">
                      {p.status === "pending" && (
                        <button onClick={() => handleMarkPaid(p)} className="flex items-center gap-1 ml-auto text-xs text-green-600 hover:text-green-800 font-semibold">
                          <CheckCircle className="h-4 w-4" /> Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 px-4">
          <div className="w-full max-w-md rounded-md bg-white p-6 shadow-soft">
            <h3 className="text-lg font-semibold text-slate-950 mb-4">Add Payment Record</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <label className="field-label">Delivery Man Name
                <input className="input" value={form.deliverymanName} onChange={(e) => setForm({ ...form, deliverymanName: e.target.value })} placeholder="Enter name" required />
              </label>
              <label className="field-label">Amount (₹)
                <input className="input" type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" required />
              </label>
              <label className="field-label">Payment Method
                <select className="input" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="upi">UPI</option>
                </select>
              </label>
              <label className="field-label">Note (optional)
                <textarea className="input" rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optional note..." />
              </label>
              <div className="flex justify-end gap-3">
                <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? "Saving…" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast message={toast?.message} onClose={() => setToast(null)} type={toast?.type} />
    </div>
  );
}
