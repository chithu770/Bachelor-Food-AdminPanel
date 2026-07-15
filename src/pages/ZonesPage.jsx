import { Plus, MapPin, Edit2, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Toast from "../components/common/Toast";
import { useZones } from "../hooks/useZones";
import { getFirebaseErrorMessage } from "../utils/helpers";

const ZONE_COLORS = [
  "c-ember",
  "c-saffron",
  "c-sky",
  "c-violet",
  "c-rose",
  "c-lime",
  "c-leaf"
];

const defaultValues = {
  name: "",
  pincodes: "",
  deliveryFee: "",
  estimatedTime: ""
};

function hashZone(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getZoneColor(name) {
  return ZONE_COLORS[hashZone(name || "") % ZONE_COLORS.length];
}

const FEE_LABEL = (n) =>
  n === null || n === undefined || n === ""
    ? "—"
    : `₹ ${Number(n).toFixed(2)}`;

const TIME_LABEL = (t) => t || "—";

export default function ZonesPage() {
  const { zones, loading, error, stats, createZone, updateZone, deleteZone } = useZones();
  const [editingZone, setEditingZone] = useState(null);
  const [deletingZone, setDeletingZone] = useState(null);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);
  const [values, setValues] = useState(defaultValues);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setValues(editingZone ? { ...defaultValues, ...editingZone } : defaultValues);
    setErrors({});
  }, [editingZone]);

  const filtered = useMemo(() => {
    const kw = query.toLowerCase();
    return zones.filter((z) =>
      [z.name, (z.pincodes || []).join(" "), z.estimatedTime || ""]
        .join(" ")
        .toLowerCase()
        .includes(kw)
    );
  }, [zones, query]);

  async function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = {};
    if (!values.name.trim()) nextErrors.name = "Name is required.";
    if (!values.pincodes.trim()) nextErrors.pincodes = "At least one pincode is required.";
    if (values.deliveryFee === "" || isNaN(Number(values.deliveryFee)))
      nextErrors.deliveryFee = "A valid delivery fee is required.";
    if (!values.estimatedTime.trim()) nextErrors.estimatedTime = "Estimated time is required.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const pincodeList = values.pincodes
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    const payload = {
      name: values.name.trim(),
      description: values.description?.trim() || "",
      pincodes: pincodeList,
      deliveryFee: Number(values.deliveryFee),
      estimatedTime: values.estimatedTime.trim()
    };

    setSubmitting(true);
    try {
      if (editingZone) {
        await updateZone(editingZone.id, payload);
        setToast({ type: "success", message: "Zone updated" });
      } else {
        await createZone(payload);
        setToast({ type: "success", message: "Zone added" });
      }
      setEditingZone(null);
      if (!editingZone) setValues(defaultValues);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    try {
      await deleteZone(deletingZone.id);
      setToast({ type: "success", message: "Zone deleted" });
      setDeletingZone(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
      setDeletingZone(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <p className="eyebrow">Delivery configuration</p>
          <h1 className="page-title">Zones</h1>
        </div>
        <a className="btn-primary" href="#zone-form">
          <Plus className="h-4 w-4" />
          Add zone
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="metric">
          <MapPin className="h-5 w-5 text-ember" />
          <span>Total zones</span>
          <strong>{stats.count}</strong>
        </div>
      </div>

      {error ? <div className="alert">{error}</div> : null}
      <div id="zone-form">
        <form className="panel space-y-4" onSubmit={handleSubmit}>
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              {editingZone ? "Edit zone" : "Add zone"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Define a delivery zone with pincodes, fee, and estimated delivery time.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="field-label">
              Zone name
              <input
                className="input"
                onChange={(e) => setValues({ ...values, name: e.target.value })}
                placeholder="e.g. Koramangala"
                value={values.name}
              />
              {errors.name ? <span className="field-error">{errors.name}</span> : null}
            </label>

            <label className="field-label">
              Estimated time
              <input
                className="input"
                onChange={(e) => setValues({ ...values, estimatedTime: e.target.value })}
                placeholder="30-45 mins"
                value={values.estimatedTime}
              />
              {errors.estimatedTime ? (
                <span className="field-error">{errors.estimatedTime}</span>
              ) : null}
            </label>

            <label className="field-label">
              Pincodes
              <input
                className="input"
                onChange={(e) => setValues({ ...values, pincodes: e.target.value })}
                placeholder="560034, 560035, 560036"
                value={values.pincodes}
              />
              {errors.pincodes ? (
                <span className="field-error">{errors.pincodes}</span>
              ) : (
                <span className="field-error">Separate multiple pincodes with commas.</span>
              )}
            </label>

            <label className="field-label">
              Delivery fee (INR)
              <input
                className="input"
                min="0"
                onChange={(e) => setValues({ ...values, deliveryFee: e.target.value })}
                placeholder="0.00"
                step="0.01"
                type="number"
                value={values.deliveryFee}
              />
              {errors.deliveryFee ? (
                <span className="field-error">{errors.deliveryFee}</span>
              ) : null}
            </label>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            {editingZone ? (
              <button className="btn-secondary" onClick={() => setEditingZone(null)} type="button">
                Cancel
              </button>
            ) : null}
            <button className="btn-primary" disabled={submitting} type="submit">
              {submitting
                ? "Saving…"
                : editingZone
                ? "Update zone"
                : "Add zone"}
            </button>
          </div>
        </form>
      </div>

      <div className="panel">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-950">All zones</h2>
          <input
            className="input sm:max-w-xs"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search zones"
            value={query}
          />
        </div>

        {loading ? (
          <div className="grid min-h-[240px] place-items-center text-slate-600">
            <div className="flex items-center gap-3">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-ember" />
              <span className="text-sm font-medium">Loading zones</span>
            </div>
          </div>
        ) : !filtered.length ? (
          <div className="empty-state">No zones yet. Add your first zone above.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((zone) => {
              const colorClass = getZoneColor(zone.name);
              const pincodesDisplay = (zone.pincodes || []).slice(0, 4).join(", ");
              const pincodesExtra = Math.max(0, (zone.pincodes || []).length - 4);
              return (
                <div key={zone.id} className="card p-5 flex flex-col h-full">
                  <div className="flex items-start justify-between gap-3 flex-1">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-bold text-slate-950">{zone.name}</h3>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Delivery fee:
                      </p>
                      <p className="text-base font-black text-ember">
                        {FEE_LABEL(zone.deliveryFee)}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        Est. time:
                      </p>
                      <p className="text-sm font-bold text-slate-700">
                        {TIME_LABEL(zone.estimatedTime)}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        Pincodes ({zone.pincodes?.length || 0}):
                      </p>
                      <p className="line-clamp-1 text-sm text-slate-600">
                        {pincodesDisplay}
                        {pincodesExtra > 0 && (
                          <span className="font-semibold"> +{pincodesExtra} more</span>
                        )}
                      </p>
                    </div>

                    <span className={`badge ${colorClass}`}>{zone.name}</span>
                  </div>

                  <div className="mt-auto pt-4 border-t border-slate-100 flex justify-end gap-2">
                    <button
                      className="icon-action"
                      onClick={() => setEditingZone(zone)}
                      title="Edit"
                      type="button"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      className="icon-danger"
                      onClick={() => setDeletingZone(zone)}
                      title="Delete"
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        confirmLabel="Delete zone"
        message={`Delete "${deletingZone?.name}"? The removal cannot be undone.`}
        onCancel={() => setDeletingZone(null)}
        onConfirm={confirmDelete}
        open={Boolean(deletingZone)}
        title="Delete zone"
      />
      <Toast message={toast?.message} onClose={() => setToast(null)} type={toast?.type} />
    </div>
  );
}
