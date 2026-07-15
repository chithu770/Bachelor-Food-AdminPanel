import { Plus, UtensilsCrossed, Edit2, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Toast from "../components/common/Toast";
import { useCuisines } from "../hooks/useCuisines";
import { getFirebaseErrorMessage } from "../utils/helpers";

const CUISINE_COLORS = [
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
  description: "",
  imageUrl: ""
};

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getCuisineColor(name) {
  return CUISINE_COLORS[hashCode(name || "") % CUISINE_COLORS.length];
}

export default function CuisinesPage() {
  const { cuisines, loading, error, stats, createCuisine, updateCuisine, deleteCuisine } = useCuisines();
  const [editingCuisine, setEditingCuisine] = useState(null);
  const [deletingCuisine, setDeletingCuisine] = useState(null);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);
  const [values, setValues] = useState(defaultValues);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setValues(editingCuisine ? { ...defaultValues, ...editingCuisine } : defaultValues);
    setErrors({});
  }, [editingCuisine]);

  const filtered = useMemo(() => {
    const kw = query.toLowerCase();
    return cuisines.filter((c) =>
      [c.name, c.description, ""].join(" ").toLowerCase().includes(kw)
    );
  }, [cuisines, query]);

  async function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = {};
    if (!values.name.trim()) nextErrors.name = "Name is required.";
    if (!values.description.trim()) nextErrors.description = "Description is required.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      if (editingCuisine) {
        await updateCuisine(editingCuisine.id, values);
        setToast({ type: "success", message: "Cuisine updated" });
      } else {
        await createCuisine(values);
        setToast({ type: "success", message: "Cuisine added" });
      }
      setEditingCuisine(null);
      if (!editingCuisine) setValues(defaultValues);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    try {
      await deleteCuisine(deletingCuisine.id);
      setToast({ type: "success", message: "Cuisine deleted" });
      setDeletingCuisine(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <p className="eyebrow">Menu taxonomy</p>
          <h1 className="page-title">Cuisines</h1>
        </div>
        <a className="btn-primary" href="#cuisine-form">
          <Plus className="h-4 w-4" />
          Add cuisine
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="metric">
          <UtensilsCrossed className="h-5 w-5 text-ember" />
          <span>Total cuisines</span>
          <strong>{stats.count}</strong>
        </div>
      </div>

      {error ? <div className="alert">{error}</div> : null}
      <div id="cuisine-form">
        <form className="panel space-y-4" onSubmit={handleSubmit}>
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              {editingCuisine ? "Edit cuisine" : "Add cuisine"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Define a cuisine type — displayed as a coloured badge on product cards.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="field-label">
              Cuisine name
              <input
                className="input"
                onChange={(e) => setValues({ ...values, name: e.target.value })}
                placeholder="e.g. Italian"
                value={values.name}
              />
              {errors.name ? <span className="field-error">{errors.name}</span> : null}
            </label>

            <label className="field-label">
              Image URL
              <input
                className="input"
                onChange={(e) => setValues({ ...values, imageUrl: e.target.value })}
                placeholder="https://…"
                value={values.imageUrl}
              />
            </label>
          </div>

          <label className="field-label">
            Description
            <textarea
              className="input min-h-24 resize-y"
              onChange={(e) => setValues({ ...values, description: e.target.value })}
              placeholder="Short description of the cuisine"
              value={values.description}
            />
            {errors.description ? <span className="field-error">{errors.description}</span> : null}
          </label>

          <div className="flex flex-wrap justify-end gap-3">
            {editingCuisine ? (
              <button className="btn-secondary" onClick={() => setEditingCuisine(null)} type="button">
                Cancel
              </button>
            ) : null}
            <button className="btn-primary" disabled={submitting} type="submit">
              {submitting
                ? "Saving…"
                : editingCuisine
                ? "Update cuisine"
                : "Add cuisine"}
            </button>
          </div>
        </form>
      </div>

      <div className="panel">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-950">All cuisines</h2>
          <input
            className="input sm:max-w-xs"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cuisines"
            value={query}
          />
        </div>

        {loading ? (
          <div className="grid min-h-[240px] place-items-center text-slate-600">
            <div className="flex items-center gap-3">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-ember" />
              <span className="text-sm font-medium">Loading cuisines</span>
            </div>
          </div>
        ) : !filtered.length ? (
          <div className="empty-state">No cuisines yet. Add your first cuisine above.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((cuisine) => {
              const colorClass = getCuisineColor(cuisine.name);
              return (
                <div key={cuisine.id} className="card p-5 flex flex-col h-full">
                  <div className="flex items-start justify-between gap-3 flex-1">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-bold text-slate-950">{cuisine.name}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                        {cuisine.description || "No description"}
                      </p>
                      {cuisine.imageUrl ? (
                        <img
                          alt={cuisine.name}
                          className="mt-3 h-32 w-full rounded-md object-cover"
                          src={cuisine.imageUrl}
                        />
                      ) : null}
                    </div>

                    <span
                      className={`badge ${colorClass}`}
                    >
                      {cuisine.name}
                    </span>
                  </div>

                  <div className="mt-4 flex justify-end gap-2 pt-4 border-t border-slate-100">
                    <button
                      className="icon-action"
                      onClick={() => setEditingCuisine(cuisine)}
                      title="Edit"
                      type="button"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      className="icon-danger"
                      onClick={() => setDeletingCuisine(cuisine)}
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
        confirmLabel="Delete cuisine"
        message={`Delete "${deletingCuisine?.name}"? This cannot be undone.`}
        onCancel={() => setDeletingCuisine(null)}
        onConfirm={confirmDelete}
        open={Boolean(deletingCuisine)}
        title="Delete cuisine"
      />
      <Toast message={toast?.message} onClose={() => setToast(null)} type={toast?.type} />
    </div>
  );
}
