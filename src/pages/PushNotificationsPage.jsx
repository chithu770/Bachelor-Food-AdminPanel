import { Bell, Send, Trash2, Users, Smartphone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Toast from "../components/common/Toast";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { getFirebaseErrorMessage } from "../utils/helpers";
import { listenToPushNotifications, createPushNotification, deletePushNotification } from "../services/pushNotificationService";

const AUDIENCE_OPTIONS = [
  { value: "all_users", label: "All users" },
  { value: "all_customers", label: "All customers" },
  { value: "all_delivery_partners", label: "All delivery partners" },
  { value: "all_restaurants", label: "All restaurants" },
  { value: "active_users", label: "Active users (last 7 days)" },
  { value: "inactive_users", label: "Inactive users (30+ days)" },
];

function formatDateTime(val) {
  if (!val) return "—";
  const d = val instanceof Date ? val : val.toDate ? val.toDate() : new Date(val);
  return isNaN(d.getTime()) ? String(val) : d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const defaultValues = {
  title: "",
  body: "",
  imageUrl: "",
  audience: "all_users",
  actionUrl: "",
};

export default function PushNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [values, setValues] = useState(defaultValues);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [deleting, setDeleting] = useState(null);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    setLoading(true);
    const unsub = listenToPushNotifications(
      (items) => { setNotifications(items); setLoading(false); setError(""); },
      (err) => { setError(getFirebaseErrorMessage(err)); setLoading(false); }
    );
    return unsub;
  }, []);

  function set(field, val) {
    setValues((v) => ({ ...v, [field]: val }));
    setFormErrors((e) => ({ ...e, [field]: "" }));
    if (field === "body") setCharCount(val.length);
  }

  function validate() {
    const errs = {};
    if (!values.title.trim()) errs.title = "Title is required.";
    if (!values.body.trim()) errs.body = "Message body is required.";
    if (values.body.length > 200) errs.body = "Body must be 200 characters or less.";
    return errs;
  }

  async function handleSend(e) {
    e.preventDefault();
    const errs = validate();
    setFormErrors(errs);
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    try {
      await createPushNotification(values);
      setToast({ type: "success", message: `Notification sent to "${values.audience.replace(/_/g, " ")}"` });
      setValues(defaultValues);
      setCharCount(0);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    try {
      await deletePushNotification(deleting.id);
      setToast({ type: "success", message: "Notification record deleted" });
      setDeleting(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  const filtered = useMemo(() => {
    const kw = query.toLowerCase();
    return notifications.filter((n) =>
      [n.title, n.body, n.audience].filter(Boolean).join(" ").toLowerCase().includes(kw)
    );
  }, [notifications, query]);

  const stats = useMemo(() => ({
    total: notifications.length,
    today: notifications.filter((n) => {
      if (!n.createdAt) return false;
      const d = n.createdAt.toDate ? n.createdAt.toDate() : new Date(n.createdAt);
      const now = new Date();
      return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
  }), [notifications]);

  const audienceLabel = AUDIENCE_OPTIONS.find((a) => a.value === values.audience)?.label || values.audience;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <p className="eyebrow">Marketing</p>
          <h1 className="page-title">Push Notifications</h1>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="metric">
          <Bell className="h-5 w-5 text-ember" />
          <span>Total sent</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="metric">
          <Smartphone className="h-5 w-5 text-saffron" />
          <span>Sent today</span>
          <strong>{stats.today}</strong>
        </div>
        <div className="metric">
          <Users className="h-5 w-5 text-sky-500" />
          <span>Audience segments</span>
          <strong>{AUDIENCE_OPTIONS.length}</strong>
        </div>
      </div>

      {error ? <div className="alert">{error}</div> : null}

      {/* Compose Form */}
      <form className="panel space-y-4" onSubmit={handleSend}>
        <div>
          <h2 className="text-lg font-bold text-slate-950">Compose notification</h2>
          <p className="mt-1 text-sm text-slate-500">Send a push notification to your app users via Firebase Cloud Messaging.</p>
        </div>

        {/* Live Preview */}
        <div className="rounded-xl bg-slate-800 p-4 shadow-lg max-w-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-md bg-ember flex items-center justify-center">
              <Bell className="h-4 w-4 text-white" />
            </div>
            <span className="text-xs text-slate-400 font-semibold">Bachelor Foods · now</span>
          </div>
          <p className="text-sm font-bold text-white">{values.title || "Notification title"}</p>
          <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">{values.body || "Your notification message will appear here…"}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="field-label">
            Title
            <input className="input" maxLength={60} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Lunch Special Today!" value={values.title} />
            {formErrors.title ? <span className="field-error">{formErrors.title}</span> : null}
          </label>
          <label className="field-label">
            Target audience
            <select className="input" onChange={(e) => set("audience", e.target.value)} value={values.audience}>
              {AUDIENCE_OPTIONS.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </label>
          <label className="field-label md:col-span-2">
            Message body
            <textarea
              className="input min-h-24 resize-y"
              maxLength={200}
              onChange={(e) => set("body", e.target.value)}
              placeholder="Write your notification message here…"
              value={values.body}
            />
            <span className={`mt-1 text-right text-xs ${charCount > 180 ? "text-rose-500" : "text-slate-400"}`}>
              {charCount}/200 characters
            </span>
            {formErrors.body ? <span className="field-error">{formErrors.body}</span> : null}
          </label>
          <label className="field-label">
            Image URL (optional)
            <input className="input" onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://example.com/image.jpg" value={values.imageUrl} />
          </label>
          <label className="field-label">
            Deep link / action URL
            <input className="input" onChange={(e) => set("actionUrl", e.target.value)} placeholder="e.g. /orders or https://…" value={values.actionUrl} />
          </label>
        </div>

        <div className="flex justify-end">
          <button className="btn-primary gap-2" disabled={submitting} type="submit">
            <Send className="h-4 w-4" />
            {submitting ? "Sending…" : `Send to ${audienceLabel}`}
          </button>
        </div>
      </form>

      {/* History */}
      <div className="panel">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-950">Notification history</h2>
          <input
            className="input sm:max-w-xs"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notifications…"
            value={query}
          />
        </div>

        {loading ? (
          <LoadingSpinner label="Loading notification history" />
        ) : filtered.length === 0 ? (
          <div className="empty-state">No notifications sent yet. Compose your first one above.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((n) => (
              <div className="flex items-start gap-4 py-4" key={n.id}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ember/10">
                  <Bell className="h-4 w-4 text-ember" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-950">{n.title}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {(n.audience || "all_users").replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500 line-clamp-2">{n.body}</p>
                  <p className="mt-1 text-xs text-slate-400">{formatDateTime(n.createdAt)}</p>
                </div>
                <button className="icon-danger shrink-0" onClick={() => setDeleting(n)} title="Delete record" type="button">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        confirmLabel="Delete record"
        message="Delete this notification record from history? This does not retract the notification."
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
        open={Boolean(deleting)}
        title="Delete notification record"
      />
      <Toast message={toast?.message} onClose={() => setToast(null)} type={toast?.type} />
    </div>
  );
}
