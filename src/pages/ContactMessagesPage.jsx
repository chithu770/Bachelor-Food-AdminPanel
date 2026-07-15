import { Mail, Trash2, CheckCircle, Clock, Eye } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Toast from "../components/common/Toast";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { getFirebaseErrorMessage } from "../utils/helpers";
import { listenToContactMessages, updateContactMessageStatus, deleteContactMessage } from "../services/contactService";

function formatDateTime(val) {
  if (!val) return "—";
  const d = val instanceof Date ? val : val.toDate ? val.toDate() : new Date(val);
  return isNaN(d.getTime()) ? String(val) : d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const statusMeta = {
  new:      { label: "New",      cls: "bg-ember/10 text-ember font-bold" },
  read:     { label: "Read",     cls: "bg-blue-100 text-blue-700" },
  replied:  { label: "Replied",  cls: "bg-leaf/10 text-leaf" },
  archived: { label: "Archived", cls: "bg-slate-100 text-slate-500" },
};

function ContactCard({ msg, onDelete, onStatusChange, onView }) {
  const meta = statusMeta[msg.status || "new"] || statusMeta.new;
  return (
    <article className={`card p-4 flex flex-col h-full ${!msg.status || msg.status === "new" ? "border-l-4 border-l-ember" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-950 truncate">{msg.name || msg.senderName || "Unknown sender"}</p>
          <p className="text-xs text-slate-500 truncate">{msg.email || msg.senderEmail || "—"}</p>
          {msg.phone ? <p className="text-xs text-slate-500">{msg.phone}</p> : null}
        </div>
        <span className={`badge shrink-0 ${meta.cls}`}>{meta.label}</span>
      </div>

      {msg.subject ? (
        <p className="mt-2 text-sm font-semibold text-slate-700 truncate">{msg.subject}</p>
      ) : null}

      <p className="mt-1 text-sm text-slate-600 line-clamp-3">{msg.message || msg.body || "No message content."}</p>

      <div className="mt-2 text-xs text-slate-400">{formatDateTime(msg.createdAt)}</div>

      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        <button
          className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          onClick={() => onView(msg)}
          type="button"
        >
          <Eye className="h-3.5 w-3.5" />
          View full
        </button>
        {["read", "replied", "archived"].filter((s) => s !== msg.status).map((s) => (
          <button
            key={s}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${s === "replied" ? "bg-leaf/10 text-leaf hover:bg-leaf/20" : s === "archived" ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-blue-50 text-blue-700 hover:bg-blue-100"}`}
            onClick={() => onStatusChange(msg, s)}
            type="button"
          >
            Mark {s}
          </button>
        ))}
        <button className="icon-danger ml-auto" onClick={() => onDelete(msg)} type="button">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

function ViewModal({ msg, onClose }) {
  if (!msg) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="card w-full max-w-lg p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-950">Contact message</h2>
          <button className="icon-action" onClick={onClose} type="button">✕</button>
        </div>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</p>
              <p className="mt-0.5 font-medium text-slate-900">{msg.name || msg.senderName || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</p>
              <p className="mt-0.5 font-medium text-slate-900 break-all">{msg.email || msg.senderEmail || "—"}</p>
            </div>
            {msg.phone ? (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Phone</p>
                <p className="mt-0.5 font-medium text-slate-900">{msg.phone}</p>
              </div>
            ) : null}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Received</p>
              <p className="mt-0.5 font-medium text-slate-900">{formatDateTime(msg.createdAt)}</p>
            </div>
          </div>
          {msg.subject ? (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Subject</p>
              <p className="mt-0.5 font-semibold text-slate-900">{msg.subject}</p>
            </div>
          ) : null}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Message</p>
            <p className="mt-1 rounded-md bg-slate-50 p-3 text-slate-700 leading-relaxed whitespace-pre-wrap">{msg.message || msg.body || "No content."}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <button className="btn-secondary" onClick={onClose} type="button">Close</button>
        </div>
      </div>
    </div>
  );
}

export default function ContactMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsub = listenToContactMessages(
      (items) => { setMessages(items); setLoading(false); setError(""); },
      (err) => { setError(getFirebaseErrorMessage(err)); setLoading(false); }
    );
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    const kw = query.toLowerCase();
    return messages.filter((m) => {
      const matchStatus = statusFilter === "all" || (m.status || "new") === statusFilter;
      const matchQuery = [m.name, m.senderName, m.email, m.senderEmail, m.subject, m.message, m.body]
        .filter(Boolean).join(" ").toLowerCase().includes(kw);
      return matchStatus && matchQuery;
    });
  }, [messages, query, statusFilter]);

  const stats = useMemo(() => ({
    total: messages.length,
    new: messages.filter((m) => !m.status || m.status === "new").length,
    replied: messages.filter((m) => m.status === "replied").length,
  }), [messages]);

  async function handleStatusChange(msg, newStatus) {
    try {
      await updateContactMessageStatus(msg.id, newStatus);
      setToast({ type: "success", message: `Marked as ${newStatus}` });
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  async function confirmDelete() {
    try {
      await deleteContactMessage(deleting.id);
      setToast({ type: "success", message: "Message deleted" });
      setDeleting(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  const tabs = [
    { key: "all",      label: `All (${stats.total})` },
    { key: "new",      label: `New (${stats.new})` },
    { key: "read",     label: "Read" },
    { key: "replied",  label: `Replied (${stats.replied})` },
    { key: "archived", label: "Archived" },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <p className="eyebrow">Help &amp; Support</p>
          <h1 className="page-title">Contact Inquiries</h1>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="metric">
          <Mail className="h-5 w-5 text-ember" />
          <span>Total messages</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="metric">
          <Clock className="h-5 w-5 text-amber-500" />
          <span>Unread / new</span>
          <strong className="text-ember">{stats.new}</strong>
        </div>
        <div className="metric">
          <CheckCircle className="h-5 w-5 text-leaf" />
          <span>Replied</span>
          <strong className="text-leaf">{stats.replied}</strong>
        </div>
      </div>

      {error ? <div className="alert">{error}</div> : null}

      <div className="panel">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${statusFilter === tab.key ? "bg-ember text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                onClick={() => setStatusFilter(tab.key)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
          <input
            className="input sm:max-w-xs"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages…"
            value={query}
          />
        </div>

        {loading ? (
          <LoadingSpinner label="Loading contact messages" />
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            {messages.length === 0
              ? "No contact inquiries yet. Messages from the customer app will appear here."
              : "No messages match your current filter."}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((msg) => (
              <ContactCard
                key={msg.id}
                msg={msg}
                onDelete={setDeleting}
                onStatusChange={handleStatusChange}
                onView={setViewing}
              />
            ))}
          </div>
        )}
      </div>

      <ViewModal msg={viewing} onClose={() => setViewing(null)} />

      <ConfirmDialog
        confirmLabel="Delete message"
        message="Delete this contact message permanently?"
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
        open={Boolean(deleting)}
        title="Delete message"
      />
      <Toast message={toast?.message} onClose={() => setToast(null)} type={toast?.type} />
    </div>
  );
}
