import { Bike } from "lucide-react";
import { useMemo, useState } from "react";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Toast from "../components/common/Toast";
import { useDeliveryPartners } from "../hooks/useDeliveryPartners";
import { getFirebaseErrorMessage } from "../utils/helpers";

export default function DeliveryPartnersPage() {
  const { partners, loading, error, stats, updatePartner, deletePartner, createPartner } = useDeliveryPartners();
  const [editingPartner, setEditingPartner] = useState(null);
  const [deletingPartner, setDeletingPartner] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);

  const filteredPartners = useMemo(() => {
    const keyword = query.toLowerCase();
    return partners.filter((p) => [p.displayName, p.email, p.phone].join(" ").toLowerCase().includes(keyword));
  }, [partners, query]);

  async function savePartner(values) {
    try {
      if (isCreating) {
        await createPartner(values);
        setToast({ type: "success", message: "Delivery partner added" });
      } else {
        await updatePartner(editingPartner.id, values);
        setToast({ type: "success", message: "Delivery partner updated" });
      }
      setEditingPartner(null);
      setIsCreating(false);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  async function confirmDelete() {
    try {
      await deletePartner(deletingPartner.id);
      setToast({ type: "success", message: "Partner deleted" });
      setDeletingPartner(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header flex justify-between items-center">
        <div>
          <p className="eyebrow">Delivery Management</p>
          <h1 className="page-title">Delivery Partners</h1>
        </div>
        <button className="btn-primary" onClick={() => { setIsCreating(true); setEditingPartner({}); }}>
          Add Delivery Partner
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="metric"><Bike className="h-5 w-5 text-ember" /><span>Total Partners</span><strong>{stats.count}</strong></div>
        <div className="metric"><span>Active</span><strong>{stats.activeCount}</strong></div>
        <div className="metric"><span>Pending Approval</span><strong>{stats.pendingCount}</strong></div>
      </div>

      {error ? <div className="alert">{error}</div> : null}

      <div className="panel">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-950">Partners Directory</h2>
          <input className="input sm:max-w-xs" onChange={(event) => setQuery(event.target.value)} placeholder="Search partners" value={query} />
        </div>
        {loading ? (
          <div className="grid min-h-[240px] place-items-center text-slate-600">
            <div className="flex items-center gap-3">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-ember" />
              <span className="text-sm font-medium">Loading partners</span>
            </div>
          </div>
        ) : !filteredPartners.length ? (
          <div className="empty-state">No delivery partners found.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredPartners.map((partner) => (
              <div className="flex flex-col rounded-2xl border border-white/40 bg-white/60 p-5 shadow-sm backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-slate-800/50" key={partner.id}>
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold text-slate-900">{partner.displayName || "Unknown Partner"}</div>
                  <span className={`text-xs px-2 py-1 rounded-full ${partner.status === "active" ? "bg-leaf/20 text-leaf-800" : "bg-amber-100 text-amber-800"}`}>
                    {partner.status || "pending"}
                  </span>
                </div>
                <div className="text-sm text-slate-500 mb-4">{partner.email}</div>
                <div className="text-sm text-slate-500 mb-4">{partner.phone || "No phone"}</div>
                <div className="mt-auto flex gap-2 pt-2 border-t border-slate-100">
                  <button className="text-sm text-ember font-medium hover:underline flex-1 text-center" onClick={() => setEditingPartner(partner)}>Edit</button>
                  <button className="text-sm text-red-600 font-medium hover:underline flex-1 text-center" onClick={() => setDeletingPartner(partner)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingPartner ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 backdrop-blur-md px-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white/90 p-8 shadow-2xl backdrop-blur-2xl my-8 dark:border-white/10 dark:bg-slate-900/90">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-950">{isCreating ? "Add Partner" : "Edit Partner"}</h3>
              <p className="mt-1 text-sm text-slate-500">Update delivery partner profile.</p>
            </div>
            <div className="space-y-4">
              <label className="field-label">
                Display Name
                <input
                  className="input"
                  value={editingPartner.displayName || ""}
                  onChange={(e) => setEditingPartner({ ...editingPartner, displayName: e.target.value })}
                />
              </label>
              <label className="field-label">
                Email
                <input
                  type="email"
                  className="input"
                  value={editingPartner.email || ""}
                  onChange={(e) => setEditingPartner({ ...editingPartner, email: e.target.value })}
                />
              </label>
              <label className="field-label">
                Phone
                <input
                  className="input"
                  value={editingPartner.phone || ""}
                  onChange={(e) => setEditingPartner({ ...editingPartner, phone: e.target.value })}
                />
              </label>
              <label className="field-label">
                Status
                <select
                  className="input"
                  value={editingPartner.status || "pending"}
                  onChange={(e) => setEditingPartner({ ...editingPartner, status: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => { setEditingPartner(null); setIsCreating(false); }} type="button">
                Cancel
              </button>
              <button className="btn-primary" onClick={() => savePartner(editingPartner)} type="button">
                {isCreating ? "Add Partner" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        confirmLabel="Delete partner"
        message={`Delete ${deletingPartner?.displayName || "this partner"}? This action cannot be undone.`}
        onCancel={() => setDeletingPartner(null)}
        onConfirm={confirmDelete}
        open={Boolean(deletingPartner)}
        title="Delete Partner"
      />
      <Toast message={toast?.message} onClose={() => setToast(null)} type={toast?.type} />
    </div>
  );
}
