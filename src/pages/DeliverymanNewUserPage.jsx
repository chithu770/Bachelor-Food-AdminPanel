import { useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Toast from "../components/common/Toast";
import { fetchAllDeliveryPartners, updateDeliveryPartner } from "../services/deliveryService";
import { getFirebaseErrorMessage } from "../utils/helpers";

export default function DeliverymanNewUserPage() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);
  const [deletingPartner, setDeletingPartner] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");
    fetchAllDeliveryPartners()
      .then((data) => {
        if (isMounted) {
          setPartners(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(getFirebaseErrorMessage(err));
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredPartners = useMemo(() => {
    const keyword = query.toLowerCase();
    return partners
      .filter((p) => p.status === "pending" || !p.status)
      .filter((p) =>
        [p.displayName, p.email, p.phone].join(" ").toLowerCase().includes(keyword)
      );
  }, [partners, query]);

  async function confirmDelete() {
    try {
      const { deleteDeliveryPartner } = await import("../services/deliveryService");
      await deleteDeliveryPartner(deletingPartner.id);
      setPartners((prev) => prev.filter((p) => p.id !== deletingPartner.id));
      setToast({ type: "success", message: "Delivery user removed" });
      setDeletingPartner(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  async function handleApprove(partner) {
    try {
      await updateDeliveryPartner(partner.id, { status: "active" });
      setPartners((prev) =>
        prev.map((p) => (p.id === partner.id ? { ...p, status: "active" } : p))
      );
      setToast({ type: "success", message: "Delivery user approved" });
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header flex justify-between items-center">
        <div>
          <p className="eyebrow">Delivery Management</p>
          <h1 className="page-title">New Delivery Users</h1>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="metric"><Users className="h-5 w-5 text-ember" /><span>Total Users</span><strong>{partners.length}</strong></div>
        <div className="metric"><span>Active</span><strong>{partners.filter((d) => d.status === "active").length}</strong></div>
        <div className="metric"><span>Pending</span><strong>{partners.filter((d) => d.status === "pending" || !d.status).length}</strong></div>
      </div>

      {error ? <div className="alert">{error}</div> : null}

      <div className="panel">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-950">New Users Directory</h2>
          <input
            className="input sm:max-w-xs"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search new users"
            value={query}
          />
        </div>
        {loading ? (
          <div className="grid min-h-[240px] place-items-center text-slate-600">
            <div className="flex items-center gap-3">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-ember" />
              <span className="text-sm font-medium">Loading new users</span>
            </div>
          </div>
        ) : !filteredPartners.length ? (
          <div className="empty-state">No new delivery users found.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredPartners.map((partner) => (
              <div
                className="flex flex-col rounded-2xl border border-white/40 bg-white/60 p-5 shadow-sm backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-slate-800/50"
                key={partner.id}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold text-slate-900">{partner.displayName || "Unknown User"}</div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      partner.status === "active"
                        ? "bg-leaf/20 text-leaf-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {partner.status || "pending"}
                  </span>
                </div>
                <div className="text-sm text-slate-500 mb-4">{partner.email}</div>
                <div className="text-sm text-slate-500 mb-4">{partner.phone || "No phone"}</div>
                <div className="mt-auto flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    className="text-sm text-leaf-600 font-medium hover:underline flex-1 text-center border-r border-slate-100"
                    onClick={() => handleApprove(partner)}
                    type="button"
                  >
                    Approve
                  </button>
                  <button
                    className="text-sm text-red-600 font-medium hover:underline flex-1 text-center"
                    onClick={() => setDeletingPartner(partner)}
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
        confirmLabel="Remove user"
        message={`Remove ${deletingPartner?.displayName || "this delivery user"}? This action cannot be undone.`}
        onCancel={() => setDeletingPartner(null)}
        onConfirm={confirmDelete}
        open={Boolean(deletingPartner)}
        title="Remove Delivery User"
      />
      <Toast message={toast?.message} onClose={() => setToast(null)} type={toast?.type} />
    </div>
  );
}
