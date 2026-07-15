import {
  Bell,
  Globe,
  ImageIcon,
  Link2,
  Plus,
  Trash2,
  Zap,
  Edit2
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Toast from "../components/common/Toast";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useCampaigns } from "../hooks/useCampaigns";
import { getFirebaseErrorMessage } from "../utils/helpers";

const CAMPAIGN_TYPES = ["banner", "push", "popup", "both"];

function formatDate(val) {
  if (!val) return "—";
  const d = val instanceof Date ? val : val.toDate ? val.toDate() : new Date(val);
  return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const defaultValues = {
  title: "",
  description: "",
  type: "banner",
  imageUrl: "",
  targetUrl: "",
  startDate: "",
  endDate: "",
  active: true
};

const typeMeta = {
  banner:  { label: "Banner",   color: "c-ember" },
  push:    { label: "Push Notif.", color: "c-saffron" },
  popup:   { label: "Popup",    color: "c-sky" },
  both:    { label: "Omnichannel", color: "c-violet" },
};

function CampaignForm({ editingCampaign, onCancel, onSubmit }) {
  const [values, setValues] = useState(defaultValues);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setValues(
      editingCampaign
        ? {
            ...defaultValues,
            title: editingCampaign.title || "",
            description: editingCampaign.description || "",
            type: editingCampaign.type || "banner",
            imageUrl: editingCampaign.imageUrl || "",
            targetUrl: editingCampaign.targetUrl || "",
            startDate: editingCampaign.startDate || "",
            endDate: editingCampaign.endDate || "",
            active: Boolean(editingCampaign.active)
          }
        : defaultValues
    );
    setErrors({});
  }, [editingCampaign]);

  function validate(v) {
    const errs = {};
    if (!v.title.trim()) errs.title = "Title is required.";
    if (!v.startDate) errs.startDate = "Start date is required.";
    if (!v.endDate) errs.endDate = "End date is required.";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    await onSubmit(values);
    setSubmitting(false);
  }

  return (
    <form className="panel space-y-4" onSubmit={handleSubmit}>
      <div>
        <h2 className="text-lg font-bold text-slate-950">{editingCampaign ? "Edit campaign" : "Add campaign"}</h2>
        <p className="mt-1 text-sm text-slate-500">Plan marketing campaigns and push engagement promotions.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="field-label">
          Campaign title
          <input className="input" onChange={(e) => setValues({ ...values, title: e.target.value })} placeholder="e.g. Summer feast promo" value={values.title} />
          {errors.title ? <span className="field-error">{errors.title}</span> : null}
        </label>
        <label className="field-label">
          Campaign type
          <select className="input" onChange={(e) => setValues({ ...values, type: e.target.value })} value={values.type}>
            {CAMPAIGN_TYPES.map((t) => (
              <option key={t} value={t}>
                {typeMeta[t]?.label || t}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Banner image URL
          <input className="input" onChange={(e) => setValues({ ...values, imageUrl: e.target.value })} placeholder="https://…" value={values.imageUrl} />
        </label>
        <label className="field-label">
          Target URL
          <input className="input" onChange={(e) => setValues({ ...values, targetUrl: e.target.value })} placeholder="https://…" value={values.targetUrl} />
        </label>
        <label className="field-label">
          Start date
          <input className="input" onChange={(e) => setValues({ ...values, startDate: e.target.value })} type="date" value={values.startDate} />
          {errors.startDate ? <span className="field-error">{errors.startDate}</span> : null}
        </label>
        <label className="field-label">
          End date
          <input className="input" onChange={(e) => setValues({ ...values, endDate: e.target.value })} type="date" value={values.endDate} />
          {errors.endDate ? <span className="field-error">{errors.endDate}</span> : null}
        </label>
      </div>
      <label className="field-label">
        Description
        <textarea className="input min-h-24 resize-y" onChange={(e) => setValues({ ...values, description: e.target.value })} placeholder="What's this campaign about?" value={values.description} />
      </label>
      <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
        <input checked={values.active} className="h-4 w-4 accent-ember" onChange={(e) => setValues({ ...values, active: e.target.checked })} type="checkbox" />
        Active — live to customers now
      </label>
      <div className="flex flex-wrap justify-end gap-3">
        {editingCampaign ? (
          <button className="btn-secondary" onClick={onCancel} type="button">
            Cancel
          </button>
        ) : null}
        <button className="btn-primary" disabled={submitting} type="submit">
          {submitting ? "Saving…" : editingCampaign ? "Update campaign" : "Create campaign"}
        </button>
      </div>
    </form>
  );
}

function CampaignCard({ campaign, onDelete, onEdit }) {
  const now = new Date();
  const tm = typeMeta[campaign.type] || typeMeta.banner;
  const running =
    campaign.active &&
    (!campaign.endDate || new Date(campaign.endDate) >= now);

  return (
    <div className="card p-5 flex flex-col h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-bold text-slate-950">{campaign.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-slate-500">
            {campaign.description || "No description"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`badge ${tm.color}`}>{tm.label}</span>
          <span className={`badge ${running ? "c-leaf border border-leaf/20" : "c-rose border border-rose/20"}`}>
            {running ? "Live" : "Ended"}
          </span>
        </div>
      </div>

      {campaign.imageUrl ? (
        <img
          alt={campaign.title}
          className="mt-3 h-32 w-full rounded-md object-cover"
          src={campaign.imageUrl}
        />
      ) : null}

      <div className="mt-3 space-y-1 text-sm text-slate-500">
        <p>
          <span className="font-semibold text-slate-700">Duration:</span>{" "}
          {formatDate(campaign.startDate)} – {formatDate(campaign.endDate)}
        </p>
        {campaign.targetUrl ? (
          <p>
            <span className="font-semibold text-slate-700">Target:</span>{" "}
            <span className="truncate text-sky-600">{campaign.targetUrl}</span>
          </p>
        ) : null}
      </div>

      <div className="mt-auto pt-4 border-t border-slate-100 flex justify-end gap-2">
        <button className="icon-action" onClick={() => onEdit(campaign)} title="Edit" type="button">
          <Edit2 className="h-4 w-4" />
        </button>
        <button className="icon-danger" onClick={() => onDelete(campaign)} title="Delete" type="button">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function CampaignList({ campaigns, loading, onDelete, onEdit }) {
  if (loading)
    return <LoadingSpinner label="Loading campaigns" />;
  if (!campaigns.length)
    return <div className="empty-state">No campaigns yet. Create your first promotion above.</div>;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {campaigns.map((campaign) => (
        <CampaignCard
          campaign={campaign}
          key={campaign.id}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}

export default function CampaignsPage() {
  const { campaigns, loading, error, stats, createCampaign, updateCampaign, deleteCampaign } =
    useCampaigns();
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [deletingCampaign, setDeletingCampaign] = useState(null);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);

  const filteredCampaigns = useMemo(() => {
    const kw = query.toLowerCase();
    return campaigns.filter((c) =>
      [c.title, c.description, c.type, ""].join(" ").toLowerCase().includes(kw)
    );
  }, [campaigns, query]);

  async function saveCampaign(values) {
    try {
      if (editingCampaign) {
        await updateCampaign(editingCampaign.id, values);
        setToast({ type: "success", message: "Campaign updated" });
      } else {
        await createCampaign(values);
        setToast({ type: "success", message: "Campaign created" });
      }
      setEditingCampaign(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  async function confirmDelete() {
    try {
      await deleteCampaign(deletingCampaign.id);
      setToast({ type: "success", message: "Campaign deleted" });
      setDeletingCampaign(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <p className="eyebrow">Marketing</p>
          <h1 className="page-title">Campaigns</h1>
        </div>
        <a className="btn-primary" href="#campaign-form">
          <Plus className="h-4 w-4" />
          Add campaign
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="metric">
          <Zap className="h-5 w-5 text-ember" />
          <span>Total campaigns</span>
          <strong>{stats.count}</strong>
        </div>
        <div className="metric">
          <span>Active campaigns</span>
          <strong>{stats.activeCount}</strong>
        </div>
      </div>

      {error ? <div className="alert">{error}</div> : null}
      <div id="campaign-form">
        <CampaignForm
          editingCampaign={editingCampaign}
          onCancel={() => setEditingCampaign(null)}
          onSubmit={saveCampaign}
        />
      </div>

      <div className="panel">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-950">All campaigns</h2>
          <input
            className="input sm:max-w-xs"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search campaigns"
            value={query}
          />
        </div>
        <CampaignList
          campaigns={filteredCampaigns}
          loading={loading}
          onDelete={setDeletingCampaign}
          onEdit={setEditingCampaign}
        />
      </div>

      <ConfirmDialog
        confirmLabel="Delete campaign"
        message={`Delete "${deletingCampaign?.title}"? This cannot be undone.`}
        onCancel={() => setDeletingCampaign(null)}
        onConfirm={confirmDelete}
        open={Boolean(deletingCampaign)}
        title="Delete campaign"
      />
      <Toast
        message={toast?.message}
        onClose={() => setToast(null)}
        type={toast?.type}
      />
    </div>
  );
}
