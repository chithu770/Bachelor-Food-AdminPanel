import { Plus, FolderOpen } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Toast from "../components/common/Toast";
import { useFoodCategories } from "../hooks/useFoodCategories";
import { getFirebaseErrorMessage } from "../utils/helpers";

const defaultValues = {
  name: "",
  description: "",
  image: ""
};

export default function FoodCategoriesPage() {
  const { categories, loading, error, stats, createFoodCategory, updateFoodCategory, deleteFoodCategory } = useFoodCategories();
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);
  const [values, setValues] = useState(defaultValues);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    setValues(editingCategory ? { ...defaultValues, ...editingCategory } : defaultValues);
    setErrors({});
    setImageFile(null);
    setUploadError("");
  }, [editingCategory]);

  const filtered = useMemo(() => {
    const kw = query.toLowerCase();
    return categories.filter((c) =>
      [c.name, c.description, ""].join(" ").toLowerCase().includes(kw)
    );
  }, [categories, query]);

  async function uploadImage(file) {
    const formData = new FormData();
    formData.append("image", file);
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData
    });
    if (!response.ok) throw new Error("Upload failed");
    const data = await response.json();
    return data.url;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = {};
    if (!values.name.trim()) nextErrors.name = "Name is required.";
    if (!values.description.trim()) nextErrors.description = "Description is required.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    setUploadError("");

    const nextValues = { ...values };
    if (imageFile) {
      try {
        nextValues.image = await uploadImage(imageFile);
      } catch (err) {
        setUploadError("Failed to upload image. Please try again.");
        setSubmitting(false);
        return;
      }
    }

    try {
      if (editingCategory) {
        await updateFoodCategory(editingCategory.id, nextValues);
        setToast({ type: "success", message: "Category updated" });
      } else {
        await createFoodCategory(nextValues);
        setToast({ type: "success", message: "Category added" });
      }
      setEditingCategory(null);
      if (!editingCategory) setValues(defaultValues);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    try {
      await deleteFoodCategory(deletingCategory.id);
      setToast({ type: "success", message: "Category deleted" });
      setDeletingCategory(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <p className="eyebrow">Menu taxonomy</p>
          <h1 className="page-title">Food Categories</h1>
        </div>
        <a className="btn-primary" href="#category-form">
          <Plus className="h-4 w-4" />
          Add category
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="metric">
          <FolderOpen className="h-5 w-5 text-ember" />
          <span>Total categories</span>
          <strong>{stats.count}</strong>
        </div>
      </div>

      {error ? <div className="alert">{error}</div> : null}
      <div id="category-form">
        <form className="panel space-y-4" onSubmit={handleSubmit}>
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              {editingCategory ? "Edit category" : "Add category"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Define food categories for menu organization.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="field-label md:col-span-2">
              Category name
              <input
                className="input"
                onChange={(e) => setValues({ ...values, name: e.target.value })}
                placeholder="e.g. Vegetarian"
                value={values.name}
              />
              {errors.name ? <span className="field-error">{errors.name}</span> : null}
            </label>

            <label className="field-label">
              Category image
              <input
                className="input"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                type="file"
                accept="image/*"
              />
              <p className="text-xs text-slate-500">Upload an image file to store in Firebase Storage.</p>
            </label>

            <label className="field-label">
              Or enter image path
              <input
                className="input"
                onChange={(e) => setValues({ ...values, image: e.target.value })}
                placeholder="/images/category.jpg"
                value={values.image}
              />
            </label>
          </div>

          <label className="field-label">
            Description
            <textarea
              className="input min-h-24 resize-y"
              onChange={(e) => setValues({ ...values, description: e.target.value })}
              placeholder="Short description of the category"
              value={values.description}
            />
            {errors.description ? <span className="field-error">{errors.description}</span> : null}
          </label>

          {uploadError ? <div className="field-error">{uploadError}</div> : null}

          <div className="flex flex-wrap justify-end gap-3">
            {editingCategory ? (
              <button className="btn-secondary" onClick={() => setEditingCategory(null)} type="button">
                Cancel
              </button>
            ) : null}
            <button className="btn-primary" disabled={submitting} type="submit">
              {submitting
                ? "Saving…"
                : editingCategory
                ? "Update category"
                : "Add category"}
            </button>
          </div>
        </form>
      </div>

      <div className="panel">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-950">All categories</h2>
          <input
            className="input sm:max-w-xs"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search categories"
            value={query}
          />
        </div>

        {loading ? (
          <div className="grid min-h-[240px] place-items-center text-slate-600">
            <div className="flex items-center gap-3">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-ember" />
              <span className="text-sm font-medium">Loading categories</span>
            </div>
          </div>
        ) : !filtered.length ? (
          <div className="empty-state">No categories yet. Add your first category above.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((category) => (
              <div key={category.id} className="card p-5 flex flex-col h-full">
                <div className="flex items-start justify-between gap-3 flex-1">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold text-slate-950">{category.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                      {category.description || "No description"}
                    </p>
                    {category.image ? (
                      <img
                        alt={category.name}
                        className="mt-3 h-32 w-full rounded-md object-cover"
                        src={category.image}
                      />
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    className="icon-action"
                    onClick={() => setEditingCategory(category)}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="icon-danger"
                    onClick={() => setDeletingCategory(category)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        confirmLabel="Delete category"
        message={`Delete "${deletingCategory?.name}"? This cannot be undone.`}
        onCancel={() => setDeletingCategory(null)}
        onConfirm={confirmDelete}
        open={Boolean(deletingCategory)}
        title="Delete category"
      />
      <Toast message={toast?.message} onClose={() => setToast(null)} type={toast?.type} />
    </div>
  );
}