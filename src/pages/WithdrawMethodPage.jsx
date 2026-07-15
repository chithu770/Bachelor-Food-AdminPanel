import { Scale, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { useEffect, useState } from "react";
import Toast from "../components/common/Toast";
import ConfirmDialog from "../components/common/ConfirmDialog";
import {
  listenToWithdrawMethods,
  createWithdrawMethod,
  updateWithdrawMethod,
  deleteWithdrawMethod,
} from "../services/financeService";
import { getFirebaseErrorMessage } from "../utils/helpers";

const METHOD_TYPES = ["Bank Transfer", "UPI", "Paytm", "Google Pay", "PhonePe", "Cash", "Other"];

const defaultForm = { name: "", type: "Bank Transfer", minimumAmount: "", maximumAmount: "", instructions: "", active: true };

export default function WithdrawMethodPage() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [editingMethod, setEditingMethod] = useState(null);
  const [deletingMethod, setDeletingMethod] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const unsub = listenToWithdrawMethods(
      (data) => { setMethods(data); setLoading(false); },
      (err) => { console.error(err); setLoading(false); }
    );
    return () => unsub && unsub();
  }, []);

  function openCreate() {
    setForm(defaultForm);
    setEditingMethod(null);
    setIsCreating(true);
  }

  function openEdit(method) {
    setForm({
      name: method.name || "",
      type: method.type || "Bank Transfer",
      minimumAmount: method.minimumAmount?.toString() || "",
      maximumAmount: method.maximumAmount?.toString() || "",
      instructions: method.instructions || "",
      active: Boolean(method.active),
    });
    setEditingMethod(method);
    setIsCreating(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name) return;
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        type: form.type,
        minimumAmount: Number(form.minimumAmount) || 0,
        maximumAmount: Number(form.maximumAmount) || 0,
        instructions: form.instructions,
        active: form.active,
      };
      if (editingMethod) {
        await updateWithdrawMethod(editingMethod.id, payload);
        setToast({ type: "success", message: "Method updated." });
      } else {
        await createWithdrawMethod(payload);
        setToast({ type: "success", message: "Method created." });
      }
      setIsCreating(false);
      setEditingMethod(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(method) {
    try {
      await updateWithdrawMethod(method.id, { active: !method.active });
      setToast({ type: "success", message: `Method ${!method.active ? "activated" : "deactivated"}.` });
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  async function handleDelete() {
    try {
      await deleteWithdrawMethod(deletingMethod.id);
      setToast({ type: "success", message: "Method deleted." });
      setDeletingMethod(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header flex items-center justify-between">
        <div>
          <p className="eyebrow">Transaction Management</p>
          <h1 className="page-title">Withdraw Methods</h1>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Method
        </button>
      </div>

      {/* Method Form */}
      {isCreating && (
        <div className="panel">
          <h2 className="text-lg font-bold text-slate-950 mb-5">{editingMethod ? "Edit Method" : "Add New Method"}</h2>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <label className="field-label md:col-span-2">Method Name
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Bank Transfer" required />
            </label>
            <label className="field-label">Type
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {METHOD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="field-label">Minimum Amount (₹)
              <input className="input" type="number" min="0" value={form.minimumAmount} onChange={(e) => setForm({ ...form, minimumAmount: e.target.value })} placeholder="0" />
            </label>
            <label className="field-label">Maximum Amount (₹)
              <input className="input" type="number" min="0" value={form.maximumAmount} onChange={(e) => setForm({ ...form, maximumAmount: e.target.value })} placeholder="No limit" />
            </label>
            <label className="field-label md:col-span-2">Instructions / Details
              <textarea className="input" rows={3} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} placeholder="e.g. Account details format, required fields..." />
            </label>
            <label className="flex items-center gap-3 text-sm font-semibold text-slate-700 md:col-span-2">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 accent-ember" />
              Active — method is available for use
            </label>
            <div className="flex justify-end gap-3 md:col-span-2">
              <button type="button" className="btn-secondary" onClick={() => { setIsCreating(false); setEditingMethod(null); }}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? "Saving…" : editingMethod ? "Update" : "Create"}</button>
            </div>
          </form>
        </div>
      )}

      {/* Methods List */}
      <div className="panel space-y-4">
        <h2 className="text-lg font-bold text-slate-950">Available Withdraw Methods</h2>
        {loading ? (
          <div className="grid min-h-[200px] place-items-center">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-ember" />
          </div>
        ) : !methods.length ? (
          <div className="empty-state">No withdraw methods configured yet. Add your first method above.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {methods.map((method) => (
              <div key={method.id} className={`rounded-md border p-4 transition-colors ${method.active ? "border-slate-200" : "border-slate-100 bg-slate-50 opacity-70"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-md bg-ember/10">
                      <Scale className="h-5 w-5 text-ember" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{method.name}</h3>
                      <p className="text-xs text-slate-500">{method.type}</p>
                    </div>
                  </div>
                  <button onClick={() => handleToggle(method)} className="shrink-0 text-slate-400 hover:text-slate-600">
                    {method.active ? <ToggleRight className="h-6 w-6 text-green-500" /> : <ToggleLeft className="h-6 w-6" />}
                  </button>
                </div>
                {(method.minimumAmount > 0 || method.maximumAmount > 0) && (
                  <p className="mt-2 text-xs text-slate-500">
                    Min: ₹{method.minimumAmount || 0} · Max: {method.maximumAmount > 0 ? `₹${method.maximumAmount}` : "No limit"}
                  </p>
                )}
                {method.instructions && <p className="mt-2 text-xs text-slate-400 line-clamp-2">{method.instructions}</p>}
                <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
                  <button className="text-xs text-ember font-semibold hover:underline" onClick={() => openEdit(method)}>Edit</button>
                  <button className="text-xs text-red-500 font-semibold hover:underline" onClick={() => setDeletingMethod(method)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        confirmLabel="Delete Method"
        message={`Delete "${deletingMethod?.name}" method? This cannot be undone.`}
        onCancel={() => setDeletingMethod(null)}
        onConfirm={handleDelete}
        open={Boolean(deletingMethod)}
        title="Delete Withdraw Method"
      />
      <Toast message={toast?.message} onClose={() => setToast(null)} type={toast?.type} />
    </div>
  );
}
