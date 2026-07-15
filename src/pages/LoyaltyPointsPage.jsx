import { Star, Plus, Trash2, Edit2, Gift } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Toast from "../components/common/Toast";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatCurrency, getFirebaseErrorMessage } from "../utils/helpers";
import { listenToLoyaltyPoints, createLoyaltyEntry, updateLoyaltyEntry, deleteLoyaltyEntry } from "../services/loyaltyService";

function formatDateTime(val) {
  if (!val) return "—";
  const d = val instanceof Date ? val : val.toDate ? val.toDate() : new Date(val);
  return isNaN(d.getTime()) ? String(val) : d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const POINT_TYPES = ["earn", "redeem", "expire", "bonus", "adjust"];

const pointTypeMeta = {
  earn:   { label: "Earned",    cls: "bg-leaf/10 text-leaf",          sign: "+" },
  bonus:  { label: "Bonus",     cls: "bg-violet-100 text-violet-700", sign: "+" },
  adjust: { label: "Adjusted",  cls: "bg-blue-100 text-blue-700",     sign: "±" },
  redeem: { label: "Redeemed",  cls: "bg-amber-100 text-amber-700",   sign: "-" },
  expire: { label: "Expired",   cls: "bg-slate-100 text-slate-500",   sign: "-" },
};

const defaultValues = {
  customerName: "",
  customerPhone: "",
  customerId: "",
  type: "earn",
  points: "",
  reason: "",
  orderId: "",
};

export default function LoyaltyPointsPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState(defaultValues);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [deleting, setDeleting] = useState(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsub = listenToLoyaltyPoints(
      (items) => { setEntries(items); setLoading(false); setError(""); },
      (err) => { setError(getFirebaseErrorMessage(err)); setLoading(false); }
    );
    return unsub;
  }, []);

  useEffect(() => {
    if (editing) {
      setValues({ ...defaultValues, ...editing, points: editing.points != null ? String(editing.points) : "" });
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
    if (!values.customerName.trim()) errs.customerName = "Customer name is required.";
    if (!values.points || Number(values.points) <= 0) errs.points = "Points must be greater than 0.";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setFormErrors(errs);
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    try {
      const payload = { ...values, points: Number(values.points) };
      if (editing?.id) {
        await updateLoyaltyEntry(editing.id, payload);
        setToast({ type: "success", message: "Entry updated" });
      } else {
        await createLoyaltyEntry(payload);
        setToast({ type: "success", message: "Points recorded" });
      }
      setEditing(null);
      setValues(defaultValues);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = useMemo(() => {
    const kw = query.toLowerCase();
    return entries.filter((e) => {
      const matchType = typeFilter === "all" || e.type === typeFilter;
      const matchQuery = [e.customerName, e.customerPhone, e.reason, e.orderId]
        .filter(Boolean).join(" ").toLowerCase().includes(kw);
      return matchType && matchQuery;
    });
  }, [entries, query, typeFilter]);

  const stats = useMemo(() => {
    const earned = entries.filter((e) => ["earn", "bonus", "adjust"].includes(e.type)).reduce((s, e) => s + Number(e.points || 0), 0);
    const redeemed = entries.filter((e) => ["redeem", "expire"].includes(e.type)).reduce((s, e) => s + Number(e.points || 0), 0);
    return { total: entries.length, earned, redeemed, net: earned - redeemed };
  }, [entries]);

  async function confirmDelete() {
    try {
      await deleteLoyaltyEntry(deleting.id);
      setToast({ type: "success", message: "Entry deleted" });
      setDeleting(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <p className="eyebrow">Finance</p>
          <h1 className="page-title">Loyalty &amp; Rewards</h1>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="metric">
          <Star className="h-5 w-5 text-saffron" />
          <span>Total entries</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="metric">
          <span>Points earned</span>
          <strong className="text-leaf">+{stats.earned.toLocaleString()}</strong>
        </div>
        <div className="metric">
          <span>Points redeemed</span>
          <strong className="text-rose-600">-{stats.redeemed.toLocaleString()}</strong>
        </div>
        <div className="metric">
          <Gift className="h-5 w-5 text-violet-500" />
          <span>Net points in circulation</span>
          <strong>{stats.net.toLocaleString()}</strong>
        </div>
      </div>

      {error ? <div className="alert">{error}</div> : null}

      {/* Form */}
      <form className="panel space-y-4" onSubmit={handleSubmit}>
        <div>
          <h2 className="text-lg font-bold text-slate-950">{editing ? "Edit entry" : "Add loyalty points"}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {editing ? "Update the loyalty points entry." : "Manually award, redeem, or adjust a customer's loyalty points."}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="field-label">
            Customer name
            <input className="input" onChange={(e) => set("customerName", e.target.value)} placeholder="Full name" value={values.customerName} />
            {formErrors.customerName ? <span className="field-error">{formErrors.customerName}</span> : null}
          </label>
          <label className="field-label">
            Customer phone
            <input className="input" onChange={(e) => set("customerPhone", e.target.value)} placeholder="+91 98765 43210" value={values.customerPhone} />
          </label>
          <label className="field-label">
            Transaction type
            <select className="input" onChange={(e) => set("type", e.target.value)} value={values.type}>
              {POINT_TYPES.map((t) => (
                <option key={t} value={t}>{pointTypeMeta[t]?.label || t}</option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Points
            <input className="input" min="1" onChange={(e) => set("points", e.target.value)} placeholder="e.g. 50" type="number" value={values.points} />
            {formErrors.points ? <span className="field-error">{formErrors.points}</span> : null}
          </label>
          <label className="field-label">
            Order ID (optional)
            <input className="input" onChange={(e) => set("orderId", e.target.value)} placeholder="Related order ID" value={values.orderId} />
          </label>
          <label className="field-label">
            Reason / note
            <input className="input" onChange={(e) => set("reason", e.target.value)} placeholder="e.g. Birthday bonus, first order reward" value={values.reason} />
          </label>
        </div>
        <div className="flex flex-wrap justify-end gap-3">
          {editing ? <button className="btn-secondary" onClick={() => setEditing(null)} type="button">Cancel</button> : null}
          <button className="btn-primary" disabled={submitting} type="submit">
            {submitting ? "Saving…" : editing ? "Update entry" : "Add points"}
          </button>
        </div>
      </form>

      {/* History */}
      <div className="panel">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {["all", ...POINT_TYPES].map((t) => (
              <button
                key={t}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${typeFilter === t ? "bg-ember text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                onClick={() => setTypeFilter(t)}
                type="button"
              >
                {t === "all" ? `All (${entries.length})` : (pointTypeMeta[t]?.label || t)}
              </button>
            ))}
          </div>
          <input className="input sm:max-w-xs" onChange={(e) => setQuery(e.target.value)} placeholder="Search…" value={query} />
        </div>

        {loading ? (
          <LoadingSpinner label="Loading loyalty points" />
        ) : filtered.length === 0 ? (
          <div className="empty-state">No loyalty points entries yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((entry) => {
              const meta = pointTypeMeta[entry.type] || pointTypeMeta.earn;
              const isPositive = ["earn", "bonus", "adjust"].includes(entry.type);
              return (
                <div className="flex items-center gap-4 py-4" key={entry.id}>
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.cls}`}>
                    <Star className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-950">{entry.customerName}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${meta.cls}`}>{meta.label}</span>
                    </div>
                    <p className="text-sm text-slate-500">{entry.reason || "—"}</p>
                    <p className="text-xs text-slate-400">{entry.customerPhone} · {formatDateTime(entry.createdAt)}</p>
                  </div>
                  <p className={`shrink-0 text-sm font-bold ${isPositive ? "text-leaf" : "text-rose-600"}`}>
                    {meta.sign}{entry.points} pts
                  </p>
                  <div className="shrink-0 flex gap-1">
                    <button className="icon-action" onClick={() => setEditing(entry)} type="button"><Edit2 className="h-4 w-4" /></button>
                    <button className="icon-danger" onClick={() => setDeleting(entry)} type="button"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        confirmLabel="Delete entry"
        message="Delete this loyalty points entry permanently?"
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
        open={Boolean(deleting)}
        title="Delete entry"
      />
      <Toast message={toast?.message} onClose={() => setToast(null)} type={toast?.type} />
    </div>
  );
}
