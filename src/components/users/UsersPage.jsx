import { Plus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import DeleteUserModal from "./DeleteUserModal";
import UserForm from "./UserForm";
import UserList from "./UserList";
import Toast from "../common/Toast";
import { useUsers } from "../../hooks/useUsers";
import { getFirebaseErrorMessage } from "../../utils/helpers";

export default function UsersPage() {
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
      if (editingUser) {
        await updateUser(editingUser.id, values);
        setToast({ type: "success", message: "User updated" });
        setEditingUser(null);
      }
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
          <p className="eyebrow">User Management</p>
          <h1 className="page-title">Users</h1>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="metric"><Users className="h-5 w-5 text-ember" /><span>Total users</span><strong>{stats.count}</strong></div>
        <div className="metric"><span>Admins</span><strong>{stats.adminCount}</strong></div>
        <div className="metric"><span>Regular users</span><strong>{stats.userCount}</strong></div>
      </div>

      {error ? <div className="alert">{error}</div> : null}
      
      <div id="user-form">
        <UserForm editingUser={editingUser} onCancel={() => setEditingUser(null)} onSubmit={saveUser} />
      </div>

      <div className="panel">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-950">Registered users</h2>
          <input className="input sm:max-w-xs" onChange={(event) => setQuery(event.target.value)} placeholder="Search users" value={query} />
        </div>
        <UserList loading={loading} onDelete={setDeletingUser} onEdit={setEditingUser} users={filteredUsers} />
      </div>

      <DeleteUserModal onCancel={() => setDeletingUser(null)} onConfirm={confirmDelete} user={deletingUser} />
      <Toast message={toast?.message} onClose={() => setToast(null)} type={toast?.type} />
    </div>
  );
}
