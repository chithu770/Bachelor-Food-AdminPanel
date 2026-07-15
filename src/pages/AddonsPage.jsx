import { PlusCircle, Search } from "lucide-react";
import { useMemo, useState } from "react";
import Toast from "../components/common/Toast";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { useAddons } from "../hooks/useAddons";
import { formatCurrency, getFirebaseErrorMessage } from "../utils/helpers";

export default function AddonsPage() {
  const { addons, loading, error, createAddon, updateAddon, deleteAddon } = useAddons();
  const [editingAddon, setEditingAddon] = useState(null);
  const [deletingAddon, setDeletingAddon] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);

  const filteredAddons = useMemo(() => {
    const keyword = query.toLowerCase();
    return addons.filter((a) => a.name.toLowerCase().includes(keyword));
  }, [addons, query]);

  async function saveAddon(values) {
    try {
      if (isCreating) {
        await createAddon(values);
        setToast({ type: "success", message: "Add-on created" });
      } else {
        await updateAddon(editingAddon.id, values);
        setToast({ type: "success", message: "Add-on updated" });
      }
      setEditingAddon(null);
      setIsCreating(false);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  async function confirmDelete() {
    try {
      await deleteAddon(deletingAddon.id);
      setToast({ type: "success", message: "Add-on deleted" });
      setDeletingAddon(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header flex justify-between items-center">
        <div>
          <p className="eyebrow">Menu Configurations</p>
          <h1 className="page-title">Food Add-ons</h1>
        </div>
        <button className="btn-primary" onClick={() => { setIsCreating(true); setEditingAddon({ name: "", price: 0 }); }}>
          Add Add-on
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="metric"><PlusCircle className="h-5 w-5 text-ember" /><span>Total Add-ons</span><strong>{addons.length}</strong></div>
      </div>

      {error ? <div className="alert">{error}</div> : null}

      <div className="panel">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-950">Add-ons Directory</h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              className="input pl-9 sm:max-w-xs text-sm" 
              placeholder="Search add-on name..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="grid min-h-[240px] place-items-center text-slate-600">
             <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-ember" />
          </div>
        ) : !filteredAddons.length ? (
          <div className="empty-state">No add-ons found.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
            {filteredAddons.map((addon) => (
              <div className="flex flex-col rounded-md border border-slate-200 p-4" key={addon.id}>
                <div className="font-semibold text-slate-900 truncate">{addon.name}</div>
                <div className="text-sm font-bold text-ember mt-1">{formatCurrency(addon.price)}</div>
                <div className="mt-4 flex gap-2 pt-2 border-t border-slate-100">
                  <button className="text-sm text-ember font-medium hover:underline flex-1 text-center" onClick={() => setEditingAddon(addon)}>Edit</button>
                  <button className="text-sm text-red-600 font-medium hover:underline flex-1 text-center" onClick={() => setDeletingAddon(addon)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingAddon ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 px-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-md bg-white p-6 shadow-soft my-8">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-950">{isCreating ? "Create Add-on" : "Edit Add-on"}</h3>
              <p className="mt-1 text-sm text-slate-500">Update add-on details and pricing.</p>
            </div>
            <div className="space-y-4">
              <label className="field-label">
                Add-on Name
                <input
                  className="input"
                  placeholder="Extra Cheese"
                  value={editingAddon.name || ""}
                  onChange={(e) => setEditingAddon({ ...editingAddon, name: e.target.value })}
                />
              </label>
              <label className="field-label">
                Price
                <input
                  type="number"
                  className="input"
                  min="0"
                  step="0.01"
                  value={editingAddon.price || 0}
                  onChange={(e) => setEditingAddon({ ...editingAddon, price: Number(e.target.value) })}
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => { setEditingAddon(null); setIsCreating(false); }} type="button">
                Cancel
              </button>
              <button className="btn-primary" onClick={() => saveAddon(editingAddon)} type="button">
                {isCreating ? "Create Add-on" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        confirmLabel="Delete Add-on"
        message={`Delete ${deletingAddon?.name || "this add-on"}? This action cannot be undone.`}
        onCancel={() => setDeletingAddon(null)}
        onConfirm={confirmDelete}
        open={Boolean(deletingAddon)}
        title="Delete Add-on"
      />

      <Toast message={toast?.message} onClose={() => setToast(null)} type={toast?.type} />
    </div>
  );
}
