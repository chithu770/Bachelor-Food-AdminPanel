import { Truck } from "lucide-react";
import { useMemo, useState } from "react";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Toast from "../components/common/Toast";
import { useVehicles } from "../hooks/useVehicles";
import { useDeliveryPartners } from "../hooks/useDeliveryPartners";
import { getFirebaseErrorMessage } from "../utils/helpers";

export default function VehiclesPage() {
  const { vehicles, loading, error, updateVehicle, deleteVehicle, createVehicle } = useVehicles();
  const { partners } = useDeliveryPartners();
  
  const activePartners = useMemo(() => {
    return partners.filter((p) => p.status === "active");
  }, [partners]);

  const [editingVehicle, setEditingVehicle] = useState(null);
  const [deletingVehicle, setDeletingVehicle] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);

  const filteredVehicles = useMemo(() => {
    const keyword = query.toLowerCase();
    return vehicles.filter((v) => [v.type, v.licensePlate, v.model].join(" ").toLowerCase().includes(keyword));
  }, [vehicles, query]);

  async function saveVehicle(values) {
    try {
      if (isCreating) {
        await createVehicle(values);
        setToast({ type: "success", message: "Vehicle added" });
      } else {
        await updateVehicle(editingVehicle.id, values);
        setToast({ type: "success", message: "Vehicle updated" });
      }
      setEditingVehicle(null);
      setIsCreating(false);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  async function confirmDelete() {
    try {
      await deleteVehicle(deletingVehicle.id);
      setToast({ type: "success", message: "Vehicle deleted" });
      setDeletingVehicle(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header flex justify-between items-center">
        <div>
          <p className="eyebrow">Fleet Management</p>
          <h1 className="page-title">Vehicles</h1>
        </div>
        <button className="btn-primary" onClick={() => { setIsCreating(true); setEditingVehicle({ type: "bike", status: "active" }); }}>
          Add Vehicle
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="metric"><Truck className="h-5 w-5 text-ember" /><span>Total Vehicles</span><strong>{vehicles.length}</strong></div>
        <div className="metric"><span>Active</span><strong>{vehicles.filter(v => v.status === "active").length}</strong></div>
      </div>

      {error ? <div className="alert">{error}</div> : null}

      <div className="panel">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-950">Fleet Directory</h2>
          <input className="input sm:max-w-xs" onChange={(event) => setQuery(event.target.value)} placeholder="Search license plate, type..." value={query} />
        </div>
        {loading ? (
          <div className="grid min-h-[240px] place-items-center text-slate-600">
            <div className="flex items-center gap-3">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-ember" />
              <span className="text-sm font-medium">Loading vehicles</span>
            </div>
          </div>
        ) : !filteredVehicles.length ? (
          <div className="empty-state">No vehicles found.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredVehicles.map((vehicle) => (
              <div className="flex flex-col rounded-md border border-slate-200 p-4" key={vehicle.id}>
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold text-slate-900">{vehicle.licensePlate || "No Plate"}</div>
                  <span className={`text-xs px-2 py-1 rounded-full ${vehicle.status === "active" ? "bg-leaf/20 text-leaf-800" : "bg-amber-100 text-amber-800"}`}>
                    {vehicle.status}
                  </span>
                </div>
                <div className="text-sm text-slate-500 capitalize">{vehicle.type} • {vehicle.model || "Unknown Model"}</div>
                {vehicle.assignedUserId && (
                  <div className="text-sm text-slate-500 mt-1">
                    Assigned to: <span className="font-medium text-slate-700">{partners.find(p => p.id === vehicle.assignedUserId)?.displayName || "Unknown"}</span>
                  </div>
                )}
                <div className="mt-4 flex gap-2 pt-2 border-t border-slate-100">
                  <button className="text-sm text-ember font-medium hover:underline flex-1 text-center" onClick={() => setEditingVehicle(vehicle)}>Edit</button>
                  <button className="text-sm text-red-600 font-medium hover:underline flex-1 text-center" onClick={() => setDeletingVehicle(vehicle)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingVehicle ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 px-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-md bg-white p-6 shadow-soft my-8">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-950">{isCreating ? "Add Vehicle" : "Edit Vehicle"}</h3>
              <p className="mt-1 text-sm text-slate-500">Update vehicle information.</p>
            </div>
            <div className="space-y-4">
              <label className="field-label">
                License Plate
                <input
                  className="input"
                  value={editingVehicle.licensePlate || ""}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, licensePlate: e.target.value })}
                />
              </label>
              <label className="field-label">
                Type
                <select
                  className="input"
                  value={editingVehicle.type || "bike"}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, type: e.target.value })}
                >
                  <option value="bike">Bike</option>
                  <option value="car">Car</option>
                  <option value="van">Van</option>
                  <option value="scooter">Scooter</option>
                </select>
              </label>
              <label className="field-label">
                Model / Make
                <input
                  className="input"
                  value={editingVehicle.model || ""}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, model: e.target.value })}
                />
              </label>
              <label className="field-label">
                Status
                <select
                  className="input"
                  value={editingVehicle.status || "active"}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="retired">Retired</option>
                </select>
              </label>
              <label className="field-label">
                Assign to Delivery User (Optional)
                <select
                  className="input"
                  value={editingVehicle.assignedUserId || ""}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, assignedUserId: e.target.value })}
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
              <button className="btn-secondary" onClick={() => { setEditingVehicle(null); setIsCreating(false); }} type="button">
                Cancel
              </button>
              <button className="btn-primary" onClick={() => saveVehicle(editingVehicle)} type="button">
                {isCreating ? "Add Vehicle" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        confirmLabel="Delete vehicle"
        message={`Delete ${deletingVehicle?.licensePlate || "this vehicle"}? This action cannot be undone.`}
        onCancel={() => setDeletingVehicle(null)}
        onConfirm={confirmDelete}
        open={Boolean(deletingVehicle)}
        title="Delete Vehicle"
      />
      <Toast message={toast?.message} onClose={() => setToast(null)} type={toast?.type} />
    </div>
  );
}
