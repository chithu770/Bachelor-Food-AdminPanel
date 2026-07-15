import { Clock } from "lucide-react";
import { useMemo, useState } from "react";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Toast from "../components/common/Toast";
import { useShifts } from "../hooks/useShifts";
import { useDeliveryPartners } from "../hooks/useDeliveryPartners";
import { getFirebaseErrorMessage } from "../utils/helpers";

export default function ShiftsPage() {
  const { shifts, loading, error, updateShift, deleteShift, createShift } = useShifts();
  const { partners } = useDeliveryPartners();

  const activePartners = useMemo(() => {
    return partners.filter((p) => p.status === "active");
  }, [partners]);

  const [editingShift, setEditingShift] = useState(null);
  const [deletingShift, setDeletingShift] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);

  const filteredShifts = useMemo(() => {
    const keyword = query.toLowerCase();
    return shifts.filter((s) => [s.name, s.startTime, s.endTime].join(" ").toLowerCase().includes(keyword));
  }, [shifts, query]);

  async function saveShift(values) {
    try {
      if (isCreating) {
        await createShift(values);
        setToast({ type: "success", message: "Shift created" });
      } else {
        await updateShift(editingShift.id, values);
        setToast({ type: "success", message: "Shift updated" });
      }
      setEditingShift(null);
      setIsCreating(false);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  async function confirmDelete() {
    try {
      await deleteShift(deletingShift.id);
      setToast({ type: "success", message: "Shift deleted" });
      setDeletingShift(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header flex justify-between items-center">
        <div>
          <p className="eyebrow">Fleet Management</p>
          <h1 className="page-title">Driver Shifts</h1>
        </div>
        <button className="btn-primary" onClick={() => { setIsCreating(true); setEditingShift({ name: "", startTime: "09:00", endTime: "17:00", status: "active" }); }}>
          Create Shift
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="metric"><Clock className="h-5 w-5 text-ember" /><span>Total Shifts</span><strong>{shifts.length}</strong></div>
        <div className="metric"><span>Active Shifts</span><strong>{shifts.filter(s => s.status === "active").length}</strong></div>
      </div>

      {error ? <div className="alert">{error}</div> : null}

      <div className="panel">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-950">Shift Directory</h2>
          <input className="input sm:max-w-xs" onChange={(event) => setQuery(event.target.value)} placeholder="Search shift name..." value={query} />
        </div>
        {loading ? (
          <div className="grid min-h-[240px] place-items-center text-slate-600">
            <div className="flex items-center gap-3">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-ember" />
              <span className="text-sm font-medium">Loading shifts</span>
            </div>
          </div>
        ) : !filteredShifts.length ? (
          <div className="empty-state">No driver shifts found.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredShifts.map((shift) => (
              <div className="flex flex-col rounded-md border border-slate-200 p-4" key={shift.id}>
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold text-slate-900">{shift.name || "Unnamed Shift"}</div>
                  <span className={`text-xs px-2 py-1 rounded-full ${shift.status === "active" ? "bg-leaf/20 text-leaf-800" : "bg-amber-100 text-amber-800"}`}>
                    {shift.status}
                  </span>
                </div>
                <div className="text-sm text-slate-500">{shift.startTime} - {shift.endTime}</div>
                {shift.assignedUserId && (
                  <div className="text-sm text-slate-500 mt-1">
                    Assigned to: <span className="font-medium text-slate-700">{partners.find(p => p.id === shift.assignedUserId)?.displayName || "Unknown"}</span>
                  </div>
                )}
                <div className="mt-4 flex gap-2 pt-2 border-t border-slate-100">
                  <button className="text-sm text-ember font-medium hover:underline flex-1 text-center" onClick={() => setEditingShift(shift)}>Edit</button>
                  <button className="text-sm text-red-600 font-medium hover:underline flex-1 text-center" onClick={() => setDeletingShift(shift)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingShift ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 px-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-md bg-white p-6 shadow-soft my-8">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-950">{isCreating ? "Create Shift" : "Edit Shift"}</h3>
              <p className="mt-1 text-sm text-slate-500">Update shift timings and details.</p>
            </div>
            <div className="space-y-4">
              <label className="field-label">
                Shift Name
                <input
                  className="input"
                  placeholder="Morning Shift"
                  value={editingShift.name || ""}
                  onChange={(e) => setEditingShift({ ...editingShift, name: e.target.value })}
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="field-label">
                  Start Time
                  <input
                    type="time"
                    className="input"
                    value={editingShift.startTime || ""}
                    onChange={(e) => setEditingShift({ ...editingShift, startTime: e.target.value })}
                  />
                </label>
                <label className="field-label">
                  End Time
                  <input
                    type="time"
                    className="input"
                    value={editingShift.endTime || ""}
                    onChange={(e) => setEditingShift({ ...editingShift, endTime: e.target.value })}
                  />
                </label>
              </div>
              <label className="field-label">
                Status
                <select
                  className="input"
                  value={editingShift.status || "active"}
                  onChange={(e) => setEditingShift({ ...editingShift, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
              <label className="field-label">
                Assign to Delivery User (Optional)
                <select
                  className="input"
                  value={editingShift.assignedUserId || ""}
                  onChange={(e) => setEditingShift({ ...editingShift, assignedUserId: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {activePartners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.displayName || p.name || p.email}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => { setEditingShift(null); setIsCreating(false); }} type="button">
                Cancel
              </button>
              <button className="btn-primary" onClick={() => saveShift(editingShift)} type="button">
                {isCreating ? "Create Shift" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        confirmLabel="Delete shift"
        message={`Delete ${deletingShift?.name || "this shift"}? This action cannot be undone.`}
        onCancel={() => setDeletingShift(null)}
        onConfirm={confirmDelete}
        open={Boolean(deletingShift)}
        title="Delete Shift"
      />
      <Toast message={toast?.message} onClose={() => setToast(null)} type={toast?.type} />
    </div>
  );
}
