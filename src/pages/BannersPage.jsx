import { Image, Plus, Trash2, ToggleLeft, ToggleRight, Edit2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Toast from "../components/common/Toast";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { getFirebaseErrorMessage } from "../utils/helpers";
import { listenToBanners, createBanner, updateBanner, deleteBanner } from "../services/bannerService";

const BANNER_TYPES = ["home_top", "home_middle", "restaurant", "category", "popup"];

const bannerTypeMeta = {
  home_top:    { label: "Home Top",    color: "bg-ember/10 text-ember" },
  home_middle: { label: "Home Middle", color: "bg-sky-100 text-sky-700" },
  restaurant:  { label: "Restaurant",  color: "bg-violet-100 text-violet-700" },
  category:    { label: "Category",    color: "bg-amber-100 text-amber-700" },
  popup:       { label: "Popup",       color: "bg-rose-100 text-rose-700" },
};

const defaultValues = {
  title: "",
  subtitle: "",
  imageUrl: "",
  targetUrl: "",
  type: "home_top",
  active: true,
  sortOrder: 0,
};

function BannerForm({ editing, onCancel, onSubmit }) {
  const [values, setValues] = useState(defaultValues);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setValues(editing ? { ...defaultValues, ...editing, sortOrder: editing.sortOrder ?? 0 } : defaultValues);
    setErrors({});
  }, [editing]);

  function set(field, val) {
    setValues((v) => ({ ...v, [field]: val }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  function validate() {
    const errs = {};
    if (!values.title.trim()) errs.title = "Title is required.";
    if (!values.imageUrl.trim()) errs.imageUrl = "Image URL is required.";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    await onSubmit({ ...values, sortOrder: Number(values.sortOrder) });
    setSubmitting(false);
  }

  return (
    <form className="panel space-y-4" id="banner-form" onSubmit={handleSubmit}>
      <div>
        <h2 className="text-lg font-bold text-slate-950">{editing ? "Edit banner" : "Add banner"}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {editing ? "Update this promotional banner." : "Create a new promotional banner for your apps."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="field-label md:col-span-2">
          Banner title
          <input className="input" onChange={(e) => set("title", e.target.value)} placeholder="e.g. Weekend Special" value={values.title} />
          {errors.title ? <span className="field-error">{errors.title}</span> : null}
        </label>
        <label className="field-label md:col-span-2">
          Subtitle / tagline
          <input className="input" onChange={(e) => set("subtitle", e.target.value)} placeholder="e.g. Up to 50% off today only!" value={values.subtitle} />
        </label>
        <label className="field-label md:col-span-2">
          Banner image URL
          <input className="input" onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://example.com/banner.jpg" value={values.imageUrl} />
          {errors.imageUrl ? <span className="field-error">{errors.imageUrl}</span> : null}
        </label>
        {values.imageUrl && (
          <div className="md:col-span-2">
            <img alt="Banner preview" className="h-36 w-full rounded-lg object-cover border border-slate-200" src={values.imageUrl} onError={(e) => { e.target.style.display = "none"; }} />
          </div>
        )}
        <label className="field-label">
          Target URL (on tap)
          <input className="input" onChange={(e) => set("targetUrl", e.target.value)} placeholder="https://…" value={values.targetUrl} />
        </label>
        <label className="field-label">
          Placement
          <select className="input" onChange={(e) => set("type", e.target.value)} value={values.type}>
            {BANNER_TYPES.map((t) => (
              <option key={t} value={t}>{bannerTypeMeta[t]?.label || t}</option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Sort order (lower = first)
          <input className="input" max="100" min="0" onChange={(e) => set("sortOrder", e.target.value)} type="number" value={values.sortOrder} />
        </label>
        <label className="flex items-center gap-3 self-end pb-2 text-sm font-semibold text-slate-700">
          <input checked={values.active} className="h-4 w-4 accent-ember" onChange={(e) => set("active", e.target.checked)} type="checkbox" />
          Active — visible to customers
        </label>
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        {editing ? (
          <button className="btn-secondary" onClick={onCancel} type="button">Cancel</button>
        ) : null}
        <button className="btn-primary" disabled={submitting} type="submit">
          {submitting ? "Saving…" : editing ? "Update banner" : "Create banner"}
        </button>
      </div>
    </form>
  );
}

function BannerCard({ banner, onDelete, onEdit, onToggle }) {
  const meta = bannerTypeMeta[banner.type] || { label: banner.type, color: "bg-slate-100 text-slate-600" };
  return (
    <article className="card overflow-hidden flex flex-col h-full">
      <div className="relative">
        {banner.imageUrl ? (
          <img alt={banner.title} className="h-36 w-full object-cover" src={banner.imageUrl} onError={(e) => { e.target.style.display = "none"; }} />
        ) : (
          <div className="flex h-36 items-center justify-center bg-slate-100">
            <Image className="h-10 w-10 text-slate-300" />
          </div>
        )}
        <div className="absolute left-2 top-2 flex gap-1">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.color}`}>{meta.label}</span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${banner.active ? "bg-leaf/10 text-leaf" : "bg-rose-100 text-rose-600"}`}>
            {banner.active ? "Live" : "Hidden"}
          </span>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-slate-950 truncate">{banner.title}</h3>
        {banner.subtitle ? <p className="mt-0.5 text-sm text-slate-500 truncate">{banner.subtitle}</p> : null}
        {banner.targetUrl ? (
          <p className="mt-1 truncate text-xs text-sky-600">{banner.targetUrl}</p>
        ) : null}
        <p className="mt-1 text-xs text-slate-400">Sort #{banner.sortOrder ?? 0}</p>
        <div className="mt-auto flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
          <button
            className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${banner.active ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-leaf/10 text-leaf hover:bg-leaf/20"}`}
            onClick={() => onToggle(banner)}
            type="button"
          >
            {banner.active ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
            {banner.active ? "Deactivate" : "Activate"}
          </button>
          <button className="icon-action" onClick={() => onEdit(banner)} title="Edit" type="button">
            <Edit2 className="h-4 w-4" />
          </button>
          <button className="icon-danger" onClick={() => onDelete(banner)} title="Delete" type="button">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

export default function BannersPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    setLoading(true);
    const unsub = listenToBanners(
      (items) => { setBanners(items); setLoading(false); setError(""); },
      (err) => { setError(getFirebaseErrorMessage(err)); setLoading(false); }
    );
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    const kw = query.toLowerCase();
    return banners.filter((b) => {
      const matchType = typeFilter === "all" || b.type === typeFilter;
      const matchQuery = [b.title, b.subtitle, b.targetUrl].filter(Boolean).join(" ").toLowerCase().includes(kw);
      return matchType && matchQuery;
    });
  }, [banners, query, typeFilter]);

  const stats = useMemo(() => ({
    total: banners.length,
    active: banners.filter((b) => b.active).length,
    hidden: banners.filter((b) => !b.active).length,
  }), [banners]);

  async function handleSave(values) {
    try {
      if (editing?.id) {
        await updateBanner(editing.id, values);
        setToast({ type: "success", message: "Banner updated" });
      } else {
        await createBanner(values);
        setToast({ type: "success", message: "Banner created" });
      }
      setEditing(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  async function handleToggle(banner) {
    try {
      await updateBanner(banner.id, { active: !banner.active });
      setToast({ type: "success", message: `Banner ${banner.active ? "deactivated" : "activated"}` });
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  async function confirmDelete() {
    try {
      await deleteBanner(deleting.id);
      setToast({ type: "success", message: "Banner deleted" });
      setDeleting(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  const typeTabs = [
    { key: "all", label: `All (${stats.total})` },
    ...BANNER_TYPES.map((t) => ({ key: t, label: bannerTypeMeta[t]?.label || t })),
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <p className="eyebrow">Marketing</p>
          <h1 className="page-title">Banners</h1>
        </div>
        <a className="btn-primary" href="#banner-form">
          <Plus className="h-4 w-4" />
          Add banner
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="metric">
          <Image className="h-5 w-5 text-ember" />
          <span>Total banners</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="metric">
          <span>Live</span>
          <strong className="text-leaf">{stats.active}</strong>
        </div>
        <div className="metric">
          <span>Hidden</span>
          <strong className="text-rose-600">{stats.hidden}</strong>
        </div>
      </div>

      {error ? <div className="alert">{error}</div> : null}

      <div id="banner-form">
        <BannerForm
          editing={editing}
          onCancel={() => setEditing(null)}
          onSubmit={handleSave}
        />
      </div>

      <div className="panel">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {typeTabs.map((tab) => (
              <button
                key={tab.key}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${typeFilter === tab.key ? "bg-ember text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                onClick={() => setTypeFilter(tab.key)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
          <input
            className="input sm:max-w-xs"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search banners…"
            value={query}
          />
        </div>

        {loading ? (
          <LoadingSpinner label="Loading banners" />
        ) : filtered.length === 0 ? (
          <div className="empty-state">No banners found. Create your first promotional banner above.</div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((banner) => (
              <BannerCard
                banner={banner}
                key={banner.id}
                onDelete={setDeleting}
                onEdit={setEditing}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        confirmLabel="Delete banner"
        message={`Delete "${deleting?.title}"? This cannot be undone.`}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
        open={Boolean(deleting)}
        title="Delete banner"
      />
      <Toast message={toast?.message} onClose={() => setToast(null)} type={toast?.type} />
    </div>
  );
}
