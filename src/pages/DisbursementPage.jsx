import { CreditCard, Plus, Trash2, Edit2, CheckCircle, Clock, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Toast from "../components/common/Toast";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatCurrency, getFirebaseErrorMessage } from "../utils/helpers";
import { listenToDisbursements, createDisbursement, updateDisbursement, deleteDisbursement } from "../services/disbursementService";

function formatDate(val) {
  if (!val) return "—";
  const d = val instanceof Date ? val : val.toDate ? val.toDate() : new Date(val);
  return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const RECIPIENT_TYPES = ["restaurant", "delivery_partner"];
const PAYMENT_METHODS = ["bank_transfer", "upi", "cash", "cheque"];

const statusMeta = {
  pending:   { label: "Pending",   cls: "bg-amber-100 text-amber-800",  icon: Clock },
  processed: { label: "Processed", cls: "bg-blue-100 text-blue-700",    icon: CheckCircle },
  paid:      { label: "Paid",      cls: "bg-leaf/10 text-leaf",         icon: CheckCircle },
  failed:    { label: "Failed",    cls: "bg-rose-100 text-rose-700",    icon: XCircle },
};

const defaultValues = {
  recipientName: "",
  recipientType: "restaurant",
  recipientId: "",
  amount: "",
  paymentMethod: "bank_transfer",
  accountDetails: "",
  periodStart: "",
  periodEnd: "",
  notes: "",
  status: "pending",
};

export default function DisbursementPage() {
  const [disbursements, setDisbursements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState(defaultValues);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [deleting, setDeleting] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsub = listenToDisbursements(
      (items) => { setDisbursements(items); setLoading(false); setError(""); },
      (err) => { setError(getFirebaseErrorMessage(err)); setLoading(false); }
    );
    return unsub;
  }, []);

  useEffect(() => {
    if (editing) {
      setValues({ ...defaultValues, ...editing, amount: editing.amount != null ? String(editing.amount) : "" });
    } else {
      setValues(defaultValues);
    }
    setFormErrors({});
  }, [editing]);

  function set(field, val) {
    setValues((v) => ({ ...v, [field]: val }));
    setFormErrors((e) => ({ ...e, [field]: "" }));
  }

  function validate() {
    const errs = {};
    if (!values.recipientName.trim()) errs.recipientName = "Recipient name is required.";
    if (!values.amount || Number(values.amount) <= 0) errs.amount = "A valid amount is required.";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setFormErrors(errs);
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    try {
      const payload = { ...values, amount: Number(values.amount) };
      if (editing?.id) {
        await updateDisbursement(editing.id, payload);
        setToast({ type: "success", message: "Disbursement updated" });
      } else {
        await createDisbursement(payload);
        setToast({ type: "success", message: "Disbursement created" });
      }
      setEditing(null);
      setValues(defaultValues);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusUpdate(d, newStatus) {
    try {
      await updateDisbursement(d.id, { status: newStatus });
      setToast({ type: "success", message: `Marked as ${newStatus}` });
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  const filtered = useMemo(() => {
    const kw = query.toLowerCase();
    return disbursements.filter((d) => {
      const matchStatus = statusFilter === "all" || d.status === statusFilter;
      const matchQuery = [d.recipientName, d.recipientType, d.paymentMethod, d.notes]
        .filter(Boolean).join(" ").toLowerCase().includes(kw);
      return matchStatus && matchQuery;
    });
  }, [disbursements, query, statusFilter]);

  const stats = useMemo(() => ({
    total: disbursements.length,
    pending: disbursements.filter((d) => d.status === "pending").length,
    paid: disbursements.filter((d) => d.status === "paid").length,
    totalPaid: disbursements.filter((d) => d.status === "paid").reduce((s, d) => s + Number(d.amount || 0), 0),
    totalPending: disbursements.filter((d) => d.status === "pending").reduce((s, d) => s + Number(d.amount || 0), 0),
  }), [disbursements]);

  async function confirmDelete() {
    try {
      await deleteDisbursement(deleting.id);
      setToast({ type: "success", message: "Disbursement deleted" });
      setDeleting(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  const tabs = [
    { key: "all", label: `All (${stats.total})` },
    { key: "pending", label: `Pending (${stats.pending})` },
    { key: "processed", label: "Processed" },
    { key: "paid", label: `Paid (${stats.paid})` },
    { key: "failed", label: "Failed" },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <p className="eyebrow">Finance</p>
          <h1 className="page-title">Disbursements</h1>
        </div>
        <button className="btn-primary" onClick={() => setEditing({})} type="button">
          <Plus className="h-4 w-4" />
          New disbursement
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="metric">
          <CreditCard className="h-5 w-5 text-ember" />
          <span>Total records</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="metric">
          <Clock className="h-5 w-5 text-amber-500" />
          <span>Pending payout</span>
          <strong className="text-amber-600">{formatCurrency(stats.totalPending)}</strong>
        </div>
        <div className="metric">
          <CheckCircle className="h-5 w-5 text-leaf" />
          <span>Total paid out</span>
          <strong className="text-leaf">{formatCurrency(stats.totalPaid)}</strong>
        </div>
        <div className="metric">
          <span>Paid disbursements</span>
          <strong>{stats.paid}</strong>
        </div>
      </div>

      {error ? <div className="alert">{error}</div> : null}

      {/* Form */}
      {editing !== null && (
        <form className="panel space-y-4" onSubmit={handleSubmit}>
          <div>
            <h2 className="text-lg font-bold text-slate-950">{editing?.id ? "Edit disbursement" : "New disbursement"}</h2>
            <p className="mt-1 text-sm text-slate-500">Record a payout to a restaurant partner or delivery driver.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="field-label">
              Recipient name
              <input className="input" onChange={(e) => set("recipientName", e.target.value)} placeholder="Restaurant or partner name" value={values.recipientName} />
              {formErrors.recipientName ? <span className="field-error">{formErrors.recipientName}</span> : null}
            </label>
            <label className="field-label">
              Recipient type
              <select className="input" onChange={(e) => set("recipientType", e.target.value)} value={values.recipientType}>
                <option value="restaurant">Restaurant</option>
                <option value="delivery_partner">Delivery Partner</option>
              </select>
            </label>
            <label className="field-label">
              Amount (₹)
              <input className="input" min="0" onChange={(e) => set("amount", e.target.value)} placeholder="0" step="0.01" type="number" value={values.amount} />
              {formErrors.amount ? <span className="field-error">{formErrors.amount}</span> : null}
            </label>
            <label className="field-label">
              Payment method
              <select className="input" onChange={(e) => set("paymentMethod", e.target.value)} value={values.paymentMethod}>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
              </select>
            </label>
            <label className="field-label">
              Account / UPI details
              <input className="input" onChange={(e) => set("accountDetails", e.target.value)} placeholder="Account number, UPI ID, etc." value={values.accountDetails} />
            </label>
            <label className="field-label">
              Status
              <select className="input" onChange={(e) => set("status", e.target.value)} value={values.status}>
                {Object.entries(statusMeta).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Period start
              <input className="input" onChange={(e) => set("periodStart", e.target.value)} type="date" value={values.periodStart} />
            </label>
            <label className="field-label">
              Period end
              <input className="input" onChange={(e) => set("periodEnd", e.target.value)} type="date" value={values.periodEnd} />
            </label>
            <label className="field-label md:col-span-2">
              Notes
              <textarea className="input min-h-16 resize-y" onChange={(e) => set("notes", e.target.value)} placeholder="Any additional notes…" value={values.notes} />
            </label>
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <button className="btn-secondary" onClick={() => setEditing(null)} type="button">Cancel</button>
            <button className="btn-primary" disabled={submitting} type="submit">
              {submitting ? "Saving…" : editing?.id ? "Update disbursement" : "Create disbursement"}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="panel">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${statusFilter === tab.key ? "bg-ember text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                onClick={() => setStatusFilter(tab.key)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
          <input className="input sm:max-w-xs" onChange={(e) => setQuery(e.target.value)} placeholder="Search disbursements…" value={query} />
        </div>

        {loading ? (
          <LoadingSpinner label="Loading disbursements" />
        ) : filtered.length === 0 ? (
          <div className="empty-state">No disbursements yet. Create the first one above.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="pb-3 pr-4">Recipient</th>
                  <th className="pb-3 pr-4">Amount</th>
                  <th className="pb-3 pr-4">Method</th>
                  <th className="pb-3 pr-4">Period</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((d) => {
                  const meta = statusMeta[d.status] || statusMeta.pending;
                  const StatusIcon = meta.icon;
                  return (
                    <tr key={d.id}>
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-slate-950">{d.recipientName}</p>
                        <p className="text-xs capitalize text-slate-500">{(d.recipientType || "").replace(/_/g, " ")}</p>
                      </td>
                      <td className="py-3 pr-4 font-bold text-slate-950">{formatCurrency(d.amount)}</td>
                      <td className="py-3 pr-4 capitalize text-slate-600">{(d.paymentMethod || "").replace(/_/g, " ")}</td>
                      <td className="py-3 pr-4 text-slate-500">
                        {d.periodStart ? `${formatDate(d.periodStart)} – ${formatDate(d.periodEnd)}` : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`badge flex w-fit items-center gap-1 ${meta.cls}`}>
                          <StatusIcon className="h-3 w-3" />
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-1">
                          {d.status === "pending" && (
                            <button
                              className="rounded-md bg-leaf/10 px-2.5 py-1 text-xs font-semibold text-leaf hover:bg-leaf/20 transition-colors"
                              onClick={() => handleStatusUpdate(d, "paid")}
                              type="button"
                            >
                              Mark Paid
                            </button>
                          )}
                          <button className="icon-action" onClick={() => setEditing(d)} type="button"><Edit2 className="h-4 w-4" /></button>
                          <button className="icon-danger" onClick={() => setDeleting(d)} type="button"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        confirmLabel="Delete disbursement"
        message={`Delete disbursement for "${deleting?.recipientName}"? This cannot be undone.`}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
        open={Boolean(deleting)}
        title="Delete disbursement"
      />
      <Toast message={toast?.message} onClose={() => setToast(null)} type={toast?.type} />
    </div>
  );
}
