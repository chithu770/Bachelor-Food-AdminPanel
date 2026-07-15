import { MessageSquare, Trash2, CheckCircle, Clock, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Toast from "../components/common/Toast";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { getFirebaseErrorMessage } from "../utils/helpers";
import { listenToChats, updateChatStatus, deleteChat } from "../services/chatService";

function formatDateTime(val) {
  if (!val) return "—";
  const d = val instanceof Date ? val : val.toDate ? val.toDate() : new Date(val);
  return isNaN(d.getTime()) ? String(val) : d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

const statusMeta = {
  open:     { label: "Open",     cls: "bg-amber-100 text-amber-800",   icon: Clock },
  resolved: { label: "Resolved", cls: "bg-leaf/10 text-leaf",          icon: CheckCircle },
  closed:   { label: "Closed",   cls: "bg-slate-100 text-slate-600",   icon: XCircle },
};

function ChatCard({ chat, onDelete, onStatusChange }) {
  const meta = statusMeta[chat.status] || statusMeta.open;
  const Icon = meta.icon;

  return (
    <article className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-ember to-saffron flex items-center justify-center text-white font-bold text-sm">
              {(chat.customerName || chat.userName || "?")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-950 truncate">{chat.customerName || chat.userName || "Unknown user"}</p>
              <p className="text-xs text-slate-500 truncate">{chat.customerEmail || chat.userEmail || "—"}</p>
            </div>
          </div>
        </div>
        <span className={`badge shrink-0 flex items-center gap-1 ${meta.cls}`}>
          <Icon className="h-3 w-3" />
          {meta.label}
        </span>
      </div>

      <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
        <p className="line-clamp-3">{chat.lastMessage || chat.message || "No message preview."}</p>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
        <span>{chat.subject || "Support request"}</span>
        <span>{formatDateTime(chat.createdAt)}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        {["open", "resolved", "closed"].filter((s) => s !== chat.status).map((s) => (
          <button
            key={s}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${s === "resolved" ? "bg-leaf/10 text-leaf hover:bg-leaf/20" : s === "closed" ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-amber-50 text-amber-700 hover:bg-amber-100"}`}
            onClick={() => onStatusChange(chat, s)}
            type="button"
          >
            Mark {s}
          </button>
        ))}
        <button className="icon-danger ml-auto" onClick={() => onDelete(chat)} title="Delete chat" type="button">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

export default function LiveChatPage() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsub = listenToChats(
      (items) => { setChats(items); setLoading(false); setError(""); },
      (err) => { setError(getFirebaseErrorMessage(err)); setLoading(false); }
    );
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    const kw = query.toLowerCase();
    return chats.filter((c) => {
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      const matchQuery = [c.customerName, c.userName, c.customerEmail, c.subject, c.lastMessage, c.message]
        .filter(Boolean).join(" ").toLowerCase().includes(kw);
      return matchStatus && matchQuery;
    });
  }, [chats, query, statusFilter]);

  const stats = useMemo(() => ({
    total: chats.length,
    open: chats.filter((c) => !c.status || c.status === "open").length,
    resolved: chats.filter((c) => c.status === "resolved").length,
    closed: chats.filter((c) => c.status === "closed").length,
  }), [chats]);

  async function handleStatusChange(chat, newStatus) {
    try {
      await updateChatStatus(chat.id, newStatus);
      setToast({ type: "success", message: `Chat marked as ${newStatus}` });
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  async function confirmDelete() {
    try {
      await deleteChat(deleting.id);
      setToast({ type: "success", message: "Chat deleted" });
      setDeleting(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  const tabs = [
    { key: "all",      label: `All (${stats.total})` },
    { key: "open",     label: `Open (${stats.open})` },
    { key: "resolved", label: `Resolved (${stats.resolved})` },
    { key: "closed",   label: `Closed (${stats.closed})` },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <p className="eyebrow">Help &amp; Support</p>
          <h1 className="page-title">Live Chat</h1>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="metric">
          <MessageSquare className="h-5 w-5 text-ember" />
          <span>Total chats</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="metric">
          <Clock className="h-5 w-5 text-amber-500" />
          <span>Open</span>
          <strong className="text-amber-600">{stats.open}</strong>
        </div>
        <div className="metric">
          <CheckCircle className="h-5 w-5 text-leaf" />
          <span>Resolved</span>
          <strong className="text-leaf">{stats.resolved}</strong>
        </div>
        <div className="metric">
          <XCircle className="h-5 w-5 text-slate-400" />
          <span>Closed</span>
          <strong>{stats.closed}</strong>
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
            placeholder="Search chats…"
            value={query}
          />
        </div>

        {loading ? (
          <LoadingSpinner label="Loading chats" />
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            {chats.length === 0
              ? "No customer chats yet. Chats from the customer app will appear here."
              : "No chats match your search or filter."}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((chat) => (
              <ChatCard chat={chat} key={chat.id} onDelete={setDeleting} onStatusChange={handleStatusChange} />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        confirmLabel="Delete chat"
        message="Delete this chat record permanently?"
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
        open={Boolean(deleting)}
        title="Delete chat"
      />
      <Toast message={toast?.message} onClose={() => setToast(null)} type={toast?.type} />
    </div>
  );
}
