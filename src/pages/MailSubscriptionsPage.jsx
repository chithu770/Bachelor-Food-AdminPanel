import { Mail, Trash2, Download, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Toast from "../components/common/Toast";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { getFirebaseErrorMessage } from "../utils/helpers";
import { listenToMailSubscriptions, deleteMailSubscription } from "../services/mailSubscriptionService";

function formatDateTime(val) {
  if (!val) return "—";
  const d = val instanceof Date ? val : val.toDate ? val.toDate() : new Date(val);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function MailSubscriptionsPage() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsub = listenToMailSubscriptions(
      (items) => { setSubscribers(items); setLoading(false); setError(""); },
      (err) => { setError(getFirebaseErrorMessage(err)); setLoading(false); }
    );
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    const kw = query.toLowerCase();
    return subscribers.filter((s) =>
      [s.email, s.name, s.source].filter(Boolean).join(" ").toLowerCase().includes(kw)
    );
  }, [subscribers, query]);

  const stats = useMemo(() => {
    const today = new Date();
    const thisMonth = subscribers.filter((s) => {
      if (!s.subscribedAt) return false;
      const d = s.subscribedAt.toDate ? s.subscribedAt.toDate() : new Date(s.subscribedAt);
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    }).length;
    return { total: subscribers.length, thisMonth };
  }, [subscribers]);

  async function confirmDelete() {
    try {
      await deleteMailSubscription(deleting.id);
      setToast({ type: "success", message: "Subscriber removed" });
      setDeleting(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  function exportCSV() {
    const rows = [["Email", "Name", "Source", "Subscribed At"]];
    filtered.forEach((s) => {
      rows.push([
        s.email || "",
        s.name || "",
        s.source || "",
        formatDateTime(s.subscribedAt),
      ]);
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mail_subscribers_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setToast({ type: "success", message: `Exported ${filtered.length} subscribers` });
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <p className="eyebrow">Marketing</p>
          <h1 className="page-title">Mail Subscriptions</h1>
        </div>
        <button className="btn-secondary gap-2" onClick={exportCSV} type="button">
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="metric">
          <Users className="h-5 w-5 text-ember" />
          <span>Total subscribers</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="metric">
          <Mail className="h-5 w-5 text-saffron" />
          <span>New this month</span>
          <strong>{stats.thisMonth}</strong>
        </div>
        <div className="metric">
          <span>Shown (filtered)</span>
          <strong>{filtered.length}</strong>
        </div>
      </div>

      {error ? <div className="alert">{error}</div> : null}

      <div className="panel">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-bold text-slate-950">Subscriber list</h2>
          <input
            className="input sm:max-w-xs"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by email, name…"
            value={query}
          />
        </div>

        {loading ? (
          <LoadingSpinner label="Loading subscribers" />
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            {subscribers.length === 0
              ? "No email subscribers yet. They will appear here when users subscribe via the customer app."
              : "No subscribers match your search."}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="pb-3 pr-4">#</th>
                    <th className="pb-3 pr-4">Email</th>
                    <th className="pb-3 pr-4">Name</th>
                    <th className="pb-3 pr-4">Source</th>
                    <th className="pb-3 pr-4">Subscribed</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((sub, i) => (
                    <tr className="hover:bg-slate-50 transition-colors" key={sub.id}>
                      <td className="py-3 pr-4 text-slate-400">{i + 1}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ember/10 text-xs font-bold text-ember">
                            {(sub.email || "?")[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-950">{sub.email || "—"}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{sub.name || "—"}</td>
                      <td className="py-3 pr-4">
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600 capitalize">
                          {sub.source || "app"}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-xs text-slate-500 whitespace-nowrap">
                        {formatDateTime(sub.subscribedAt || sub.createdAt)}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          className="icon-danger"
                          onClick={() => setDeleting(sub)}
                          title="Remove subscriber"
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400">
              Showing {filtered.length} of {subscribers.length} subscribers
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        confirmLabel="Remove subscriber"
        message={`Remove ${deleting?.email || "this subscriber"} from the mailing list?`}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
        open={Boolean(deleting)}
        title="Remove subscriber"
      />
      <Toast message={toast?.message} onClose={() => setToast(null)} type={toast?.type} />
    </div>
  );
}
