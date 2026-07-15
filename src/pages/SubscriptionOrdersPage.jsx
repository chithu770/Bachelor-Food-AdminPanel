import { Calendar, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Toast from "../components/common/Toast";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatCurrency, getFirebaseErrorMessage } from "../utils/helpers";
import { useSubscriptions } from "../hooks/useSubscriptions";

function formatDate(val) {
  if (!val) return "—";
  const d = val instanceof Date ? val : val.toDate ? val.toDate() : new Date(val);
  return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(val) {
  if (!val) return "—";
  return String(val).slice(0, 5);
}

const STATUSES = ["active", "paused", "cancelled", "completed"];

const PLAN_FREQUENCIES = ["daily", "weekly", "monthly"];

const MEAL_TYPES = ["veg", "non-veg", "mixed"];

const DAY_MAP = {
  mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday",
  fri: "Friday", sat: "Saturday", sun: "Sunday"
};

function formatFrequencyDetail(frequency, deliveryDay) {
  if (!frequency) return "—";
  const day = String(deliveryDay || "").trim().toLowerCase();
  switch (frequency) {
    case "daily":
      return "Every day";
    case "weekly":
      if (day && DAY_MAP[day]) return `Every ${DAY_MAP[day]}`;
      if (day) return `Weekly on ${day.charAt(0).toUpperCase() + day.slice(1)}`;
      return "Weekly";
    case "monthly":
      if (day && /^\d+$/.test(day)) {
        const n = parseInt(day, 10);
        const suffix = n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th";
        return `${n}${suffix} of every month`;
      }
      if (day) return `Monthly on ${day}`;
      return "Monthly";
    default:
      return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  }
}

const initialValues = {
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  deliveryAddress: "",
  planName: "",
  frequency: "daily",
  mealType: "veg",
  pricePerMeal: "",
  deliveryDay: "",
  deliveryTime: "12:00",
  startDate: "",
  nextDeliveryDate: "",
  status: "active",
  notes: ""
};

function SubscriptionForm({ editingSub, onCancel, onSubmit, collectionType }) {
  const [values, setValues] = useState(initialValues);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setValues({
      ...initialValues,
      frequency: collectionType || "weekly",
      ...editingSub,
      pricePerMeal: editingSub?.pricePerMeal != null ? String(editingSub.pricePerMeal) : "",
      deliveryDay: editingSub?.deliveryDay || "",
      startDate: editingSub?.startDate || "",
      nextDeliveryDate: editingSub?.nextDeliveryDate || "",
      deliveryTime: editingSub?.deliveryTime || "12:00",
      status: editingSub?.status || "active"
    });
    setErrors({});
  }, [editingSub, collectionType]);

  function updateField(field, value) {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  function validate() {
    const errs = {};
    if (!values.customerName.trim()) errs.customerName = "Customer name is required.";
    if (!values.customerPhone.trim()) errs.customerPhone = "Phone is required.";
    if (!values.planName.trim()) errs.planName = "Plan name is required.";
    if (!values.pricePerMeal || Number(values.pricePerMeal) <= 0) errs.pricePerMeal = "A valid price is required.";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const payload = {
      ...values,
      pricePerMeal: Number(values.pricePerMeal)
    };

    setSubmitting(true);
    await onSubmit(payload);
    setSubmitting(false);
  }

  return (
    <form className="panel space-y-4" onSubmit={handleSubmit}>
      <div>
        <h2 className="text-lg font-bold text-slate-950">
          {editingSub ? "Edit subscription" : "Create subscription"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {editingSub
            ? "Update subscription details and delivery plan."
            : "Add a new recurring food subscription for a customer."}
        </p>
      </div>

      {/* Customer Details */}
      <div>
        <p className="text-sm font-semibold text-slate-700">Customer details</p>
        <div className="mt-2 grid gap-4 md:grid-cols-2">
          <label className="field-label">
            Customer name
            <input
              className="input"
              onChange={(e) => updateField("customerName", e.target.value)}
              placeholder="Full name"
              value={values.customerName}
            />
            {errors.customerName ? <span className="field-error">{errors.customerName}</span> : null}
          </label>
          <label className="field-label">
            Phone
            <input
              className="input"
              onChange={(e) => updateField("customerPhone", e.target.value)}
              placeholder="+91 98765 43210"
              value={values.customerPhone}
            />
            {errors.customerPhone ? <span className="field-error">{errors.customerPhone}</span> : null}
          </label>
          <label className="field-label">
            Email
            <input
              className="input"
              onChange={(e) => updateField("customerEmail", e.target.value)}
              placeholder="customer@email.com"
              type="email"
              value={values.customerEmail}
            />
          </label>
          <label className="field-label md:col-span-2">
            Delivery address
            <input
              className="input"
              onChange={(e) => updateField("deliveryAddress", e.target.value)}
              placeholder="Street, locality, city"
              value={values.deliveryAddress}
            />
          </label>
        </div>
      </div>

      {/* Plan Details */}
      <div>
        <p className="text-sm font-semibold text-slate-700">Plan details</p>
        <div className="mt-2 grid gap-4 md:grid-cols-2">
          <label className="field-label md:col-span-2">
            Plan name
            <input
              className="input"
              onChange={(e) => updateField("planName", e.target.value)}
              placeholder="e.g. Weekly Lunch Plan"
              value={values.planName}
            />
            {errors.planName ? <span className="field-error">{errors.planName}</span> : null}
          </label>
          <label className="field-label">
            Frequency
            <select
              className="input"
              onChange={(e) => updateField("frequency", e.target.value)}
              value={values.frequency}
            >
              {PLAN_FREQUENCIES.map((f) => (
                <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Meal type
            <select
              className="input"
              onChange={(e) => updateField("mealType", e.target.value)}
              value={values.mealType}
            >
              {MEAL_TYPES.map((m) => (
                <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Price per meal
            <input
              className="input"
              onChange={(e) => updateField("pricePerMeal", e.target.value)}
              placeholder="0"
              min="0"
              step="1"
              type="number"
              value={values.pricePerMeal}
            />
            {errors.pricePerMeal ? <span className="field-error">{errors.pricePerMeal}</span> : null}
          </label>
          <label className="field-label">
            Delivery day
            <input
              className="input"
              onChange={(e) => updateField("deliveryDay", e.target.value)}
              placeholder="e.g. Mon / 15 / All"
              value={values.deliveryDay}
            />
          </label>
          <label className="field-label">
            Delivery time
            <input
              className="input"
              onChange={(e) => updateField("deliveryTime", e.target.value)}
              type="time"
              value={values.deliveryTime}
            />
          </label>
          <label className="field-label">
            Start date
            <input
              className="input"
              onChange={(e) => updateField("startDate", e.target.value)}
              type="date"
              value={values.startDate}
            />
          </label>
          <label className="field-label">
            Next delivery date
            <input
              className="input"
              onChange={(e) => updateField("nextDeliveryDate", e.target.value)}
              type="date"
              value={values.nextDeliveryDate}
            />
          </label>
          <label className="field-label">
            Status
            <select
              className="input"
              onChange={(e) => updateField("status", e.target.value)}
              value={values.status}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <label className="field-label">
        Notes
        <textarea
          className="input min-h-20 resize-y"
          onChange={(e) => updateField("notes", e.target.value)}
          placeholder="Any special instructions for this subscription…"
          value={values.notes}
        />
      </label>

      <div className="flex flex-wrap justify-end gap-3">
        {editingSub ? (
          <button className="btn-secondary" onClick={onCancel} type="button">
            Cancel
          </button>
        ) : null}
        <button
          className="btn-primary"
          disabled={submitting}
          type="submit"
        >
          {submitting
            ? "Saving…"
            : editingSub
              ? "Update subscription"
              : "Create subscription"}
        </button>
      </div>
    </form>
  );
}

const statusMeta = {
  active:   { label: "Active",   cls: "c-leaf border border-leaf/20" },
  paused:   { label: "Paused",   cls: "bg-amber-50 text-amber-700" },
  cancelled:{ label: "Cancelled", cls: "c-rose border border-rose/20" },
  completed:{ label: "Completed", cls: "bg-blue-50 text-blue-700" }
};

function StatusBadge({ status }) {
  const meta = statusMeta[status] || statusMeta.active;
  return <span className={`badge ${meta.cls}`}>{meta.label}</span>;
}

function FrequencyBadge({ frequency }) {
  const freqStr = (frequency || "").toLowerCase();
  const isDaily = freqStr.includes("daily");
  const isWeekly = freqStr.includes("weekly");
  const isMonthly = freqStr.includes("monthly");
  
  const cls =
    isDaily   ? "bg-amber-100 text-amber-800 ring-1 ring-amber-200" :
    isWeekly  ? "bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200 font-bold" :
    isMonthly ? "bg-purple-100 text-purple-800 ring-1 ring-purple-200 font-bold" :
                "bg-slate-100 text-slate-800 font-bold";
  return <span className={`badge px-3 py-1 text-sm ${cls}`}>{frequency || "Unknown Frequency"}</span>;
}

function SubscriptionCard({ subscription, onDelete, onEdit }) {
  const freqDetail = formatFrequencyDetail(subscription.frequency, subscription.deliveryDay);

  return (
    <article className="card p-4 flex flex-col h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-bold text-slate-950">{subscription.planName || "Unnamed plan"}</h3>
          <p className="mt-0.5 truncate text-sm text-slate-600">{subscription.customerName}</p>
        </div>
        <StatusBadge status={subscription.status} />
      </div>

      <div className="mt-3 space-y-1 text-sm text-slate-500">
        <p className="flex items-center gap-2">
          <PhoneIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="truncate">{subscription.customerPhone || "—"}</span>
        </p>
        {subscription.deliveryAddress ? (
          <p className="flex items-center gap-2">
            <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{subscription.deliveryAddress}</span>
          </p>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <FrequencyBadge frequency={subscription.frequency} />
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 capitalize">
          {subscription.mealType || "—"}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 rounded-md bg-slate-50 p-3 text-xs text-slate-600">
        <div>
          <span className="font-semibold text-slate-700">Schedule</span>
          <p className="mt-0.5 font-medium text-slate-900">{freqDetail}</p>
          {subscription.deliveryTime ? (
            <p className="mt-0.5 text-slate-500">at {formatTime(subscription.deliveryTime)}</p>
          ) : null}
        </div>
        <div>
          <span className="font-semibold text-slate-700">Price / meal</span>
          <p className="mt-0.5 font-bold text-slate-900">{formatCurrency(subscription.pricePerMeal)}</p>
        </div>
        <div>
          <span className="font-semibold text-slate-700">Started</span>
          <p className="mt-0.5">{formatDate(subscription.startDate)}</p>
        </div>
        <div>
          <span className="font-semibold text-slate-700">Next delivery</span>
          <p className="mt-0.5">{formatDate(subscription.nextDeliveryDate)}</p>
        </div>
      </div>

      <div className="mt-auto pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
        <button
          className="icon-action"
          onClick={() => onEdit(subscription)}
          title="Edit subscription"
          type="button"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
        <button
          className="icon-danger"
          onClick={() => onDelete(subscription)}
          title="Delete subscription"
          type="button"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

function SubscriptionList({ subs, loading, onDelete, onEdit, filterStatus }) {
  const filtered = filterStatus
    ? subs.filter((s) => s.status === filterStatus)
    : subs;

  if (loading)
    return <LoadingSpinner label="Loading subscriptions" />;
  if (!subs.length)
    return <div className="empty-state">No subscriptions yet. Create the first one above.</div>;
  if (!filtered.length)
    return (
      <div className="empty-state">
        No subscriptions with status &ldquo;{filterStatus}&rdquo;.
      </div>
    );

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {filtered.map((sub) => (
        <SubscriptionCard
          key={sub.id}
          onDelete={onDelete}
          onEdit={onEdit}
          subscription={sub}
        />
      ))}
    </div>
  );
}

export default function SubscriptionOrdersPage() {
  const [collectionType, setCollectionType] = useState("all");
  const { subscriptions, loading, error, stats, updateSubscription, deleteSubscription, createSubscription } = useSubscriptions(collectionType);
  const [editingSub, setEditingSub] = useState(null);
  const [deletingSub, setDeletingSub] = useState(null);
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState(null);
  const [toast, setToast] = useState(null);

  const filtered = useMemo(() => {
    const kw = query.toLowerCase();
    return subscriptions.filter((s) =>
      [s.customerName, s.customerPhone, s.planName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(kw)
    );
  }, [subscriptions, query]);

  async function saveSub(values) {
    try {
      if (editingSub) {
        await updateSubscription(editingSub.id, values);
        setToast({ type: "success", message: "Subscription updated" });
      } else {
        await createSubscription(values);
        setToast({ type: "success", message: "Subscription created" });
      }
      setEditingSub(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  async function confirmDelete() {
    try {
      await deleteSubscription(deletingSub.id);
      setToast({ type: "success", message: "Subscription deleted" });
      setDeletingSub(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  const statusTabs = [
    { key: null,    label: "All" },
    { key: "active",       label: `Active (${stats.active})` },
    { key: "paused",       label: `Paused (${stats.paused})` },
    { key: "cancelled",    label: `Cancelled (${stats.cancelled})` },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header flex flex-wrap justify-between items-start gap-4">
        <div>
          <p className="eyebrow">Order management</p>
          <h1 className="page-title">Subscriptions</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
          <div className="flex bg-slate-100 rounded-md p-1">
            <button
              className={`px-4 py-1.5 text-sm font-semibold rounded-sm transition-colors ${collectionType === "all" ? "bg-white text-ember shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              onClick={() => setCollectionType("all")}
            >
              All
            </button>
            <button
              className={`px-4 py-1.5 text-sm font-semibold rounded-sm transition-colors ${collectionType === "weekly" ? "bg-white text-ember shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              onClick={() => setCollectionType("weekly")}
            >
              Weekly
            </button>
            <button
              className={`px-4 py-1.5 text-sm font-semibold rounded-sm transition-colors ${collectionType === "monthly" ? "bg-white text-ember shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              onClick={() => setCollectionType("monthly")}
            >
              Monthly
            </button>
          </div>
          <a className="btn-primary" href="#subscription-form">
            <Plus className="h-4 w-4" />
            New subscription
          </a>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="metric">
          <Calendar className="h-5 w-5 text-ember" />
          <span>Total subscriptions</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="metric">
          <span>Active</span>
          <strong>{stats.active}</strong>
        </div>
        <div className="metric">
          <span>Paused</span>
          <strong>{stats.paused}</strong>
        </div>
        <div className="metric">
          <span>Cancelled</span>
          <strong>{stats.cancelled}</strong>
        </div>
      </div>

      {error ? <div className="alert">{error}</div> : null}

      <div id="subscription-form">
        <SubscriptionForm
          collectionType={collectionType}
          editingSub={editingSub}
          onCancel={() => setEditingSub(null)}
          onSubmit={saveSub}
        />
      </div>

      <div className="panel">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {statusTabs.map((tab) => (
              <button
                key={tab.key ?? "all"}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  filterStatus === tab.key
                    ? "bg-ember text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
                onClick={() => setFilterStatus(tab.key)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
          <input
            className="input sm:max-w-xs"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, phone, plan…"
            value={query}
          />
        </div>
        <SubscriptionList
          filterStatus={filterStatus}
          loading={loading}
          onDelete={setDeletingSub}
          onEdit={setEditingSub}
          subs={filtered}
        />
      </div>

      <ConfirmDialog
        confirmLabel="Delete subscription"
        message={`Delete subscription for ${
          deletingSub?.customerName || "this customer"
        }? This action cannot be undone.`}
        onCancel={() => setDeletingSub(null)}
        onConfirm={confirmDelete}
        open={Boolean(deletingSub)}
        title="Delete subscription"
      />
      <Toast
        message={toast?.message}
        onClose={() => setToast(null)}
        type={toast?.type}
      />
    </div>
  );
}

/* ── tiny inline icons ─────────────────────────────────────────────────── */
function PhoneIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function MapPinIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
