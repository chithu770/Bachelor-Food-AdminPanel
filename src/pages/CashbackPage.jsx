import { DollarSign, Edit2, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Toast from "../components/common/Toast";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatCurrency, getFirebaseErrorMessage } from "../utils/helpers";
import { listenToCashbackOffers, createCashbackOffer, updateCashbackOffer, deleteCashbackOffer } from "../services/cashbackService";

const CASHBACK_TYPES = ["percentage", "flat"];
const APPLIES_TO = ["all_orders", "first_order", "min_order", "specific_restaurant", "specific_category"];

function formatDate(val) {
  if (!val) return "—";
  const d = val instanceof Date ? val : val.toDate ? val.toDate() : new Date(val);
  return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const defaultValues = {
  title: "",
  description: "",
  cashbackType: "percentage",
  cashbackValue: "",
  maxCashback: "",
  minOrderAmount: "",
  appliesTo: "all_orders",
  startDate: "",
  endDate: "",
  active: true,
};

function CashbackForm({ editing, onCancel, onSubmit }) {
  const [values, setValues] = useState(defaultValues);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editing) {
      setValues({
        ...defaultValues,
        ...editing,
        cashbackValue: editing.cashbackValue != null ? String(editing.cashbackValue) : "",
        maxCashback: editing.maxCashback != null ? String(editing.maxCashback) : "",
        minOrderAmount: editing.minOrderAmount != null ? String(editing.minOrderAmount) : "",
      });
    } else {
      setValues(defaultValues);
    }
    setErrors({});
  }, [editing]);

  function set(field, val) {
    setValues((v) => ({ ...v, [field]: val }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  function validate() {
    const errs = {};
    if (!values.title.trim()) errs.title = "Title is required.";
    if (!values.cashbackValue || Number(values.cashbackValue) <= 0) errs.cashbackValue = "A valid cashback value is required.";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    await onSubmit({
      ...values,
      cashbackValue: Number(values.cashbackValue),
      maxCashback: values.maxCashback ? Number(values.maxCashback) : null,
      minOrderAmount: values.minOrderAmount ? Number(values.minOrderAmount) : null,
    });
    setSubmitting(false);
  }

  return (
    <form className="panel space-y-4" id="cashback-form" onSubmit={handleSubmit}>
      <div>
        <h2 className="text-lg font-bold text-slate-950">{editing ? "Edit cashback offer" : "Create cashback offer"}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {editing ? "Update the cashback offer details." : "Set up a new cashback reward for customers."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="field-label md:col-span-2">
          Offer title
          <input className="input" onChange={(e) => set("title", e.target.value)} placeholder="e.g. Weekend Cashback Bonanza" value={values.title} />
          {errors.title ? <span className="field-error">{errors.title}</span> : null}
        </label>
        <label className="field-label">
          Cashback type
          <select className="input" onChange={(e) => set("cashbackType", e.target.value)} value={values.cashbackType}>
            <option value="percentage">Percentage (%)</option>
            <option value="flat">Flat amount (₹)</option>
          </select>
        </label>
        <label className="field-label">
          Cashback value
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm font-semibold">
              {values.cashbackType === "percentage" ? "%" : "₹"}
            </span>
            <input className="input pl-8" min="0" onChange={(e) => set("cashbackValue", e.target.value)} placeholder="0" step="0.01" type="number" value={values.cashbackValue} />
          </div>
          {errors.cashbackValue ? <span className="field-error">{errors.cashbackValue}</span> : null}
        </label>
        <label className="field-label">
          Max cashback (₹)
          <input className="input" min="0" onChange={(e) => set("maxCashback", e.target.value)} placeholder="e.g. 100 (leave blank for no limit)" type="number" value={values.maxCashback} />
        </label>
        <label className="field-label">
          Min order amount (₹)
          <input className="input" min="0" onChange={(e) => set("minOrderAmount", e.target.value)} placeholder="e.g. 200 (leave blank for any)" type="number" value={values.minOrderAmount} />
        </label>
        <label className="field-label">
          Applies to
          <select className="input" onChange={(e) => set("appliesTo", e.target.value)} value={values.appliesTo}>
            <option value="all_orders">All orders</option>
            <option value="first_order">First order only</option>
            <option value="min_order">Orders above minimum</option>
            <option value="specific_restaurant">Specific restaurant</option>
            <option value="specific_category">Specific category</option>
          </select>
        </label>
        <label className="field-label">
          Start date
          <input className="input" onChange={(e) => set("startDate", e.target.value)} type="date" value={values.startDate} />
        </label>
        <label className="field-label">
          End date
          <input className="input" onChange={(e) => set("endDate", e.target.value)} type="date" value={values.endDate} />
        </label>
        <label className="flex items-center gap-3 self-end pb-2 text-sm font-semibold text-slate-700">
          <input checked={values.active} className="h-4 w-4 accent-ember" onChange={(e) => set("active", e.target.checked)} type="checkbox" />
          Active — available to customers now
        </label>
      </div>

      <label className="field-label">
        Description
        <textarea className="input min-h-20 resize-y" onChange={(e) => set("description", e.target.value)} placeholder="Describe this cashback offer…" value={values.description} />
      </label>

      <div className="flex flex-wrap justify-end gap-3">
        {editing ? <button className="btn-secondary" onClick={onCancel} type="button">Cancel</button> : null}
        <button className="btn-primary" disabled={submitting} type="submit">
          {submitting ? "Saving…" : editing ? "Update offer" : "Create offer"}
        </button>
      </div>
    </form>
  );
}

function CashbackCard({ offer, onDelete, onEdit, onToggle }) {
  const isPercent = offer.cashbackType === "percentage";
  return (
    <article className="card p-4 flex flex-col h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-bold text-slate-950">{offer.title}</h3>
          {offer.description ? <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{offer.description}</p> : null}
        </div>
        <span className={`badge ${offer.active ? "c-leaf border border-leaf/20" : "c-rose border border-rose/20"}`}>
          {offer.active ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-gradient-to-br from-ember to-saffron text-white font-black text-lg shadow-sm shrink-0">
          {isPercent ? `${offer.cashbackValue}%` : `₹${offer.cashbackValue}`}
        </div>
        <div className="text-sm text-slate-600 space-y-0.5">
          <p><span className="font-semibold text-slate-700">Type:</span> {isPercent ? "Percentage" : "Flat amount"}</p>
          {offer.maxCashback ? <p><span className="font-semibold text-slate-700">Max:</span> {formatCurrency(offer.maxCashback)}</p> : null}
          {offer.minOrderAmount ? <p><span className="font-semibold text-slate-700">Min order:</span> {formatCurrency(offer.minOrderAmount)}</p> : null}
        </div>
      </div>

      <div className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600 space-y-1">
        <div className="flex justify-between">
          <span className="font-semibold text-slate-700">Applies to:</span>
          <span className="capitalize">{(offer.appliesTo || "all_orders").replace(/_/g, " ")}</span>
        </div>
        {offer.startDate || offer.endDate ? (
          <div className="flex justify-between">
            <span className="font-semibold text-slate-700">Period:</span>
            <span>{formatDate(offer.startDate)} – {formatDate(offer.endDate)}</span>
          </div>
        ) : null}
      </div>

      <div className="mt-auto flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
        <button
          className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${offer.active ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-leaf/10 text-leaf hover:bg-leaf/20"}`}
          onClick={() => onToggle(offer)}
          type="button"
        >
          {offer.active ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
          {offer.active ? "Deactivate" : "Activate"}
        </button>
        <button className="icon-action" onClick={() => onEdit(offer)} type="button"><Edit2 className="h-4 w-4" /></button>
        <button className="icon-danger" onClick={() => onDelete(offer)} type="button"><Trash2 className="h-4 w-4" /></button>
      </div>
    </article>
  );
}

export default function CashbackPage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsub = listenToCashbackOffers(
      (items) => { setOffers(items); setLoading(false); setError(""); },
      (err) => { setError(getFirebaseErrorMessage(err)); setLoading(false); }
    );
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    const kw = query.toLowerCase();
    return offers.filter((o) =>
      [o.title, o.description, o.appliesTo].filter(Boolean).join(" ").toLowerCase().includes(kw)
    );
  }, [offers, query]);

  const stats = useMemo(() => ({
    total: offers.length,
    active: offers.filter((o) => o.active).length,
    totalCashbackOffered: offers.filter((o) => o.active && o.cashbackType === "flat").reduce((s, o) => s + Number(o.cashbackValue || 0), 0),
  }), [offers]);

  async function handleSave(values) {
    try {
      if (editing?.id) {
        await updateCashbackOffer(editing.id, values);
        setToast({ type: "success", message: "Offer updated" });
      } else {
        await createCashbackOffer(values);
        setToast({ type: "success", message: "Offer created" });
      }
      setEditing(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  async function handleToggle(offer) {
    try {
      await updateCashbackOffer(offer.id, { active: !offer.active });
      setToast({ type: "success", message: `Offer ${offer.active ? "deactivated" : "activated"}` });
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  async function confirmDelete() {
    try {
      await deleteCashbackOffer(deleting.id);
      setToast({ type: "success", message: "Offer deleted" });
      setDeleting(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <p className="eyebrow">Marketing</p>
          <h1 className="page-title">Cashback Offers</h1>
        </div>
        <a className="btn-primary" href="#cashback-form">
          <Plus className="h-4 w-4" />
          Add offer
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="metric">
          <DollarSign className="h-5 w-5 text-ember" />
          <span>Total offers</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="metric">
          <span>Active offers</span>
          <strong className="text-leaf">{stats.active}</strong>
        </div>
        <div className="metric">
          <span>Inactive offers</span>
          <strong className="text-rose-600">{stats.total - stats.active}</strong>
        </div>
      </div>

      {error ? <div className="alert">{error}</div> : null}

      <div id="cashback-form">
        <CashbackForm editing={editing} onCancel={() => setEditing(null)} onSubmit={handleSave} />
      </div>

      <div className="panel">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-950">All cashback offers</h2>
          <input
            className="input sm:max-w-xs"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search offers…"
            value={query}
          />
        </div>

        {loading ? (
          <LoadingSpinner label="Loading cashback offers" />
        ) : filtered.length === 0 ? (
          <div className="empty-state">No cashback offers yet. Create your first offer above.</div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((offer) => (
              <CashbackCard key={offer.id} offer={offer} onDelete={setDeleting} onEdit={setEditing} onToggle={handleToggle} />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        confirmLabel="Delete offer"
        message={`Delete "${deleting?.title}"? This cannot be undone.`}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
        open={Boolean(deleting)}
        title="Delete cashback offer"
      />
      <Toast message={toast?.message} onClose={() => setToast(null)} type={toast?.type} />
    </div>
  );
}
