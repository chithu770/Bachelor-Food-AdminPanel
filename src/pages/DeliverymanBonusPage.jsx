import { Gift, Plus, Trash2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Toast from "../components/common/Toast";
import ConfirmDialog from "../components/common/ConfirmDialog";
import {
  listenToDeliverymanBonus,
  createDeliverymanBonus,
  deleteDeliverymanBonus,
} from "../services/financeService";
import { listenToDeliveryPartners } from "../services/deliveryService";
import { formatCurrency, getFirebaseErrorMessage } from "../utils/helpers";

export default function DeliverymanBonusPage() {
  const [bonuses, setBonuses] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);
  const [deletingBonus, setDeletingBonus] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ deliverymanId: "", deliverymanName: "", bonusAmount: "", reason: "", bonusType: "cash" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub1 = listenToDeliverymanBonus(
      (data) => { setBonuses(data); setLoading(false); },
      (err) => { console.error(err); setLoading(false); }
    );
    const unsub2 = listenToDeliveryPartners(
      (data) => setPartners(data),
      (err) => console.error(err)
    );
    return () => { unsub1 && unsub1(); unsub2 && unsub2(); };
  }, []);

  const filtered = useMemo(() => {
    const kw = query.toLowerCase();
    return bonuses.filter((b) => (b.deliverymanName || "").toLowerCase().includes(kw));
  }, [bonuses, query]);

  const totalBonus = bonuses.reduce((s, b) => s + Number(b.bonusAmount || 0), 0);

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.deliverymanName || !form.bonusAmount) return;
    setSubmitting(true);
    try {
      await createDeliverymanBonus({
        deliverymanId: form.deliverymanId,
        deliverymanName: form.deliverymanName,
        bonusAmount: Number(form.bonusAmount),
        reason: form.reason,
        bonusType: form.bonusType,
      });
      setToast({ type: "success", message: "Bonus added successfully." });
      setForm({ deliverymanId: "", deliverymanName: "", bonusAmount: "", reason: "", bonusType: "cash" });
      setShowCreate(false);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteDeliverymanBonus(deletingBonus.id);
      setToast({ type: "success", message: "Bonus deleted." });
      setDeletingBonus(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header flex items-center justify-between">
        <div>
          <p className="eyebrow">Delivery Man Management</p>
          <h1 className="page-title">Delivery Man Bonus</h1>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Add Bonus
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="metric"><Gift className="h-5 w-5 text-ember" /><span>Total Bonuses Given</span><strong>{bonuses.length}</strong></div>
        <div className="metric"><span>Total Amount</span><strong>{formatCurrency(totalBonus)}</strong></div>
        <div className="metric"><span>Active Partners</span><strong>{partners.filter((p) => p.status === "active").length}</strong></div>
      </div>

      <div className="panel space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-950">Bonus History</h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input className="input pl-9 text-sm" placeholder="Search delivery man..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="grid min-h-[200px] place-items-center">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-ember" />
          </div>
        ) : !filtered.length ? (
          <div className="empty-state">No bonus records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-900">
                <tr>
                  <th className="p-3 font-semibold">Sl</th>
                  <th className="p-3 font-semibold">Delivery Man</th>
                  <th className="p-3 font-semibold">Bonus Type</th>
                  <th className="p-3 font-semibold">Amount</th>
                  <th className="p-3 font-semibold">Reason</th>
                  <th className="p-3 font-semibold">Date</th>
                  <th className="p-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((b, i) => (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="p-3 text-slate-500">{i + 1}</td>
                    <td className="p-3 font-medium text-slate-900">{b.deliverymanName}</td>
                    <td className="p-3 capitalize">{b.bonusType || "cash"}</td>
                    <td className="p-3 font-bold text-green-600">{formatCurrency(b.bonusAmount)}</td>
                    <td className="p-3 text-slate-500">{b.reason || "—"}</td>
                    <td className="p-3 text-slate-500">{b.createdAt?.toDate ? b.createdAt.toDate().toLocaleDateString() : "—"}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => setDeletingBonus(b)} className="p-1.5 rounded text-red-500 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
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
            <h3 className="text-lg font-semibold text-slate-950 mb-4">Add Bonus</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <label className="field-label">Select Delivery Man
                <select className="input" value={form.deliverymanId} onChange={(e) => {
                  const p = partners.find((p) => p.id === e.target.value);
                  setForm({ ...form, deliverymanId: e.target.value, deliverymanName: p?.displayName || "" });
                }}>
                  <option value="">Choose a delivery man...</option>
                  {partners.map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
                </select>
              </label>
              <label className="field-label">Bonus Type
                <select className="input" value={form.bonusType} onChange={(e) => setForm({ ...form, bonusType: e.target.value })}>
                  <option value="cash">Cash</option>
                  <option value="performance">Performance</option>
                  <option value="festival">Festival</option>
                  <option value="referral">Referral</option>
                </select>
              </label>
              <label className="field-label">Bonus Amount (₹)
                <input className="input" type="number" min="0" value={form.bonusAmount} onChange={(e) => setForm({ ...form, bonusAmount: e.target.value })} placeholder="0.00" required />
              </label>
              <label className="field-label">Reason
                <input className="input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Reason for bonus" />
              </label>
              <div className="flex justify-end gap-3">
                <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? "Saving…" : "Add Bonus"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        confirmLabel="Delete Bonus"
        message={`Remove this bonus of ${formatCurrency(deletingBonus?.bonusAmount)} for ${deletingBonus?.deliverymanName}?`}
        onCancel={() => setDeletingBonus(null)}
        onConfirm={handleDelete}
        open={Boolean(deletingBonus)}
        title="Delete Bonus"
      />
      <Toast message={toast?.message} onClose={() => setToast(null)} type={toast?.type} />
    </div>
  );
}
