import { Calendar, Plus, Tag, Trash2, Edit2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Toast from "../components/common/Toast";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { getFirebaseErrorMessage } from "../utils/helpers";
import { useCoupons } from "../hooks/useCoupons";

function formatDate(val) {
  if (!val) return "—";
  const d = val instanceof Date ? val : val.toDate ? val.toDate() : new Date(val);
  return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const DISCOUNT_TYPES = ["percentage", "fixed"];

const couponBadge = (code, starting) => {
  const base = "badge ";
  if (!starting) return base + "bg-red-50 text-red-600 border border-red-100";
  if (code.startsWith("EMB")) return base + "c-ember";
  if (code.startsWith("SAF")) return base + "c-saffron";
  if (code.startsWith("LEA")) return base + "c-leaf";
  if (code.startsWith("SKY")) return base + "c-sky";
  if (code.startsWith("VIO")) return base + "c-violet";
  if (code.startsWith("ROS")) return base + "c-rose";
  return base + "c-lime";
};

const defaultValues = {
  code: "",
  discountType: "percentage",
  discountValue: "",
  minOrderAmount: "",
  maxDiscount: "",
  usageLimit: "",
  startDate: "",
  endDate: "",
  active: true
};

function CouponForm({ editingCoupon, onCancel, onSubmit }) {
  const [values, setValues] = useState(defaultValues);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setValues(
      editingCoupon
        ? {
            ...defaultValues,
            code: editingCoupon.code || "",
            discountType: editingCoupon.discountType || "percentage",
            discountValue: editingCoupon.discountValue?.toString() || "",
            minOrderAmount: editingCoupon.minOrderAmount?.toString() || "",
            maxDiscount: editingCoupon.maxDiscount?.toString() || "",
            usageLimit: editingCoupon.usageLimit?.toString() || "",
            startDate: editingCoupon.startDate || "",
            endDate: editingCoupon.endDate || "",
            active: Boolean(editingCoupon.active)
          }
        : defaultValues
    );
    setErrors({});
  }, [editingCoupon]);

  function validate(values) {
    const errs = {};
    if (!values.code.trim()) errs.code = "Code is required.";
    if (values.discountValue === "" || Number(values.discountValue) <= 0)
      errs.discountValue = "A valid discount value is required.";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const payload = {
      code: values.code.trim().toUpperCase(),
      discountType: values.discountType,
      discountValue: Number(values.discountValue),
      minOrderAmount: values.minOrderAmount ? Number(values.minOrderAmount) : 0,
      maxDiscount: values.maxDiscount ? Number(values.maxDiscount) : null,
      usageLimit: values.usageLimit ? Number(values.usageLimit) : null,
      startDate: values.startDate,
      endDate: values.endDate,
      active: Boolean(values.active),
      usedCount: editingCoupon?.usedCount || 0
    };

    setSubmitting(true);
    await onSubmit(payload);
    setSubmitting(false);
  }

  return (
    <form className="panel space-y-4" onSubmit={handleSubmit}>
      <div>
        <h2 className="text-lg font-bold text-slate-950">{editingCoupon ? "Edit coupon" : "Add coupon"}</h2>
        <p className="mt-1 text-sm text-slate-500">Configure coupon code, discount rules, and validity period.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="field-label">
          Coupon code
          <input
            className="input uppercase"
            onChange={(e) => setValues({ ...values, code: e.target.value })}
            placeholder="e.g. BACHELOR20"
            value={values.code}
          />
          {errors.code ? <span className="field-error">{errors.code}</span> : null}
        </label>
        <label className="field-label">
          Discount type
          <select
            className="input"
            onChange={(e) => setValues({ ...values, discountType: e.target.value })}
            value={values.discountType}
          >
            {DISCOUNT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t === "percentage" ? "Percentage (%)" : "Fixed (₹)"}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Discount value
          <input
            className="input"
            min="0"
            onChange={(e) => setValues({ ...values, discountValue: e.target.value })}
            placeholder={values.discountType === "percentage" ? "20" : "50"}
            type="number"
            value={values.discountValue}
          />
          {errors.discountValue ? <span className="field-error">{errors.discountValue}</span> : null}
        </label>
        <label className="field-label">
          Min order amount
          <input
            className="input"
            min="0"
            onChange={(e) => setValues({ ...values, minOrderAmount: e.target.value })}
            placeholder="0"
            type="number"
            value={values.minOrderAmount}
          />
        </label>
        <label className="field-label">
          Max discount cap
          <input
            className="input"
            min="0"
            onChange={(e) => setValues({ ...values, maxDiscount: e.target.value })}
            placeholder="No limit"
            type="number"
            value={values.maxDiscount}
          />
        </label>
        <label className="field-label">
          Usage limit
          <input
            className="input"
            min="1"
            onChange={(e) => setValues({ ...values, usageLimit: e.target.value })}
            placeholder="Unlimited"
            type="number"
            value={values.usageLimit}
          />
        </label>
        <label className="field-label">
          Valid from
          <input
            className="input"
            onChange={(e) => setValues({ ...values, startDate: e.target.value })}
            type="date"
            value={values.startDate}
          />
        </label>
        <label className="field-label">
          Expires on
          <input
            className="input"
            onChange={(e) => setValues({ ...values, endDate: e.target.value })}
            type="date"
            value={values.endDate}
          />
        </label>
      </div>
      <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
        <input
          checked={values.active}
          className="h-4 w-4 accent-ember"
          onChange={(e) => setValues({ ...values, active: e.target.checked })}
          type="checkbox"
        />
        Active — coupon is currently usable
      </label>
      <div className="flex flex-wrap justify-end gap-3">
        {editingCoupon ? (
          <button className="btn-secondary" onClick={onCancel} type="button">
            Cancel
          </button>
        ) : null}
        <button className="btn-primary" disabled={submitting} type="submit">
          {submitting ? "Saving…" : editingCoupon ? "Update coupon" : "Add coupon"}
        </button>
      </div>
    </form>
  );
}

function CouponCard({ coupon, onDelete, onEdit }) {
  const now = new Date();
  const valid =
    coupon.active &&
    (!coupon.endDate || new Date(coupon.endDate) >= now);
  const remaining =
    coupon.usageLimit && coupon.usedCount != null
      ? coupon.usageLimit - coupon.usedCount
      : null;

  return (
    <div className="card p-5 flex flex-col h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-ember/10">
            <Tag className="h-5 w-5 text-ember" />
          </div>
          <div>
            <h3 className="font-bold text-ember text-lg tracking-wide">{coupon.code}</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {coupon.discountType === "percentage"
                ? `${coupon.discountValue}% off`
                : `₹ ${coupon.discountValue} off`}
              {coupon.minOrderAmount > 0
                ? ` · min ₹ ${coupon.minOrderAmount}`
                : ""}
            </p>
          </div>
        </div>
        <span
          className={`badge ${
            valid ? "c-leaf border border-leaf/20" : "c-rose border border-rose/20"
          }`}
        >
          {valid ? "Active" : "Expired"}
        </span>
      </div>

      <div className="mt-3 space-y-1 text-sm text-slate-500">
        <p>
          <span className="font-semibold text-slate-700">Valid:</span>{" "}
          {formatDate(coupon.startDate)} – {formatDate(coupon.endDate)}
        </p>
        <p>
          <span className="font-semibold text-slate-700">Used:</span>{" "}
          {coupon.usedCount ?? 0}
          {remaining !== null
            ? ` / ${coupon.usageLimit}  (${remaining} left)`
            : " / unlimited"}
        </p>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-100 flex justify-end gap-2">
        <button className="icon-action" onClick={() => onEdit(coupon)} title="Edit" type="button">
          <Edit2 className="h-4 w-4" />
        </button>
        <button className="icon-danger" onClick={() => onDelete(coupon)} title="Delete" type="button">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function CouponList({ coupons, loading, onDelete, onEdit }) {
  if (loading)
    return <LoadingSpinner label="Loading coupons" />;
  if (!coupons.length)
    return <div className="empty-state">No coupons found. Create your first one above.</div>;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {coupons.map((coupon) => (
        <CouponCard
          coupon={coupon}
          key={coupon.id}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}

export default function CouponsPage() {
  const { coupons, loading, error, stats, createCoupon, updateCoupon, deleteCoupon } = useCoupons();
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [deletingCoupon, setDeletingCoupon] = useState(null);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);

  const filteredCoupons = useMemo(() => {
    const keyword = query.toLowerCase();
    return coupons.filter((c) => c.code.toLowerCase().includes(keyword));
  }, [coupons, query]);

  async function saveCoupon(values) {
    try {
      if (editingCoupon) {
        await updateCoupon(editingCoupon.id, values);
        setToast({ type: "success", message: "Coupon updated" });
      } else {
        await createCoupon(values);
        setToast({ type: "success", message: "Coupon added" });
      }
      setEditingCoupon(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  async function confirmDelete() {
    try {
      await deleteCoupon(deletingCoupon.id);
      setToast({ type: "success", message: "Coupon deleted" });
      setDeletingCoupon(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <p className="eyebrow">Promotions</p>
          <h1 className="page-title">Coupons</h1>
        </div>
        <a className="btn-primary" href="#coupon-form">
          <Plus className="h-4 w-4" />
          Add coupon
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="metric">
          <Calendar className="h-5 w-5 text-ember" />
          <span>Total coupons</span>
          <strong>{stats.count}</strong>
        </div>
        <div className="metric">
          <span>Active coupons</span>
          <strong>{stats.activeCount}</strong>
        </div>
      </div>

      {error ? <div className="alert">{error}</div> : null}
      <div id="coupon-form">
        <CouponForm
          editingCoupon={editingCoupon}
          onCancel={() => setEditingCoupon(null)}
          onSubmit={saveCoupon}
        />
      </div>

      <div className="panel">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-950">Active promotions</h2>
          <input
            className="input sm:max-w-xs"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by code"
            value={query}
          />
        </div>
        <CouponList
          coupons={filteredCoupons}
          loading={loading}
          onDelete={setDeletingCoupon}
          onEdit={setEditingCoupon}
        />
      </div>

      <ConfirmDialog
        confirmLabel="Delete coupon"
        message={`Delete coupon "${deletingCoupon?.code}"? This cannot be undone.`}
        onCancel={() => setDeletingCoupon(null)}
        onConfirm={confirmDelete}
        open={Boolean(deletingCoupon)}
        title="Delete coupon"
      />
      <Toast
        message={toast?.message}
        onClose={() => setToast(null)}
        type={toast?.type}
      />
    </div>
  );
}
