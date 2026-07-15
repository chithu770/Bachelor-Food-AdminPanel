import { Users } from "lucide-react";
import { useMemo, useState } from "react";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Toast from "../components/common/Toast";
import UserCard from "../components/users/UserCard";
import { useUsers } from "../hooks/useUsers";
import { getFirebaseErrorMessage } from "../utils/helpers";

export default function CustomersPage() {
  const { users, loading, error, stats, updateUser, deleteUser } = useUsers();
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);

  const filteredUsers = useMemo(() => {
    const keyword = query.toLowerCase();
    return users.filter((user) => [user.displayName, user.email].join(" ").toLowerCase().includes(keyword));
  }, [users, query]);

  async function saveUser(values) {
    try {
      await updateUser(editingUser.id, values);
      setToast({ type: "success", message: "User updated" });
      setEditingUser(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  async function confirmDelete() {
    try {
      await deleteUser(deletingUser.id);
      setToast({ type: "success", message: "User deleted" });
      setDeletingUser(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <p className="eyebrow">Customer Management</p>
          <h1 className="page-title">Customers</h1>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="metric"><Users className="h-5 w-5 text-ember" /><span>Total users</span><strong>{stats.count}</strong></div>
        <div className="metric"><span>Admins</span><strong>{stats.adminCount}</strong></div>
        <div className="metric"><span>Regular users</span><strong>{stats.userCount}</strong></div>
      </div>

      {error ? <div className="alert">{error}</div> : null}

      <div className="panel">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-950">Registered customers</h2>
          <input className="input sm:max-w-xs" onChange={(event) => setQuery(event.target.value)} placeholder="Search customers" value={query} />
        </div>
        {loading ? (
          <div className="grid min-h-[240px] place-items-center text-slate-600">
            <div className="flex items-center gap-3">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-ember" />
              <span className="text-sm font-medium">Loading customers</span>
            </div>
          </div>
        ) : !filteredUsers.length ? (
          <div className="empty-state">No customers registered yet.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredUsers.map((user) => (
              <UserCard user={user} key={user.id} onDelete={setDeletingUser} onEdit={setEditingUser} />
            ))}
          </div>
        )}
      </div>

      {editingUser ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 px-4">
          <div className="w-full max-w-md rounded-md bg-white p-6 shadow-soft">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-950">Edit Customer</h3>
              <p className="mt-1 text-sm text-slate-500">Update display name and role.</p>
            </div>
            <div className="space-y-4">
              <label className="field-label">
                Display name
                <input
                  className="input"
                  value={editingUser.displayName || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })}
                />
              </label>
              <label className="field-label">
                Role
                <select
                  className="input"
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => setEditingUser(null)} type="button">
                Cancel
              </button>
              <button className="btn-primary" onClick={() => saveUser({ displayName: editingUser.displayName, role: editingUser.role })} type="button">
                Save changes
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        confirmLabel="Delete customer"
        message={`Delete ${deletingUser?.displayName || "this customer"}? This action cannot be undone.`}
        onCancel={() => setDeletingUser(null)}
        onConfirm={confirmDelete}
        open={Boolean(deletingUser)}
        title="Delete customer"
      />
      <Toast message={toast?.message} onClose={() => setToast(null)} type={toast?.type} />
    </div>
  );
}