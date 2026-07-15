import { ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Toast from "../components/common/Toast";
import { useUsers } from "../hooks/useUsers";
import { getFirebaseErrorMessage } from "../utils/helpers";
import { createUser } from "../services/userService";

export default function EmployeesPage() {
  const { users, loading, error, updateUser, deleteUser } = useUsers();
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [deletingEmployee, setDeletingEmployee] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);

  // Filter only staff/admin roles
  const employees = useMemo(() => {
    return users.filter(u => ["admin", "super_admin", "manager"].includes(u.role));
  }, [users]);

  const filteredEmployees = useMemo(() => {
    const keyword = query.toLowerCase();
    return employees.filter((e) => [e.displayName, e.email].join(" ").toLowerCase().includes(keyword));
  }, [employees, query]);

  async function saveEmployee(values) {
    try {
      if (isCreating) {
        // Mock ID creation, or we assume they sign up via Firebase Auth first and we assign role.
        // For now, we simulate user creation via the service
        const mockUid = "emp_" + Math.random().toString(36).substr(2, 9);
        await createUser({ uid: mockUid, email: values.email, displayName: values.displayName, role: values.role });
        setToast({ type: "success", message: "Employee role assigned" });
      } else {
        await updateUser(editingEmployee.id, values);
        setToast({ type: "success", message: "Employee updated" });
      }
      setEditingEmployee(null);
      setIsCreating(false);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  async function confirmDelete() {
    try {
      await deleteUser(deletingEmployee.id);
      setToast({ type: "success", message: "Employee deleted" });
      setDeletingEmployee(null);
    } catch (err) {
      setToast({ type: "error", message: getFirebaseErrorMessage(err) });
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header flex justify-between items-center">
        <div>
          <p className="eyebrow">Team Management</p>
          <h1 className="page-title">Staff & Roles</h1>
        </div>
        <button className="btn-primary" onClick={() => { setIsCreating(true); setEditingEmployee({ displayName: "", email: "", role: "admin" }); }}>
          Add Staff
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="metric"><ShieldCheck className="h-5 w-5 text-ember" /><span>Total Staff</span><strong>{employees.length}</strong></div>
        <div className="metric"><span>Super Admins</span><strong>{employees.filter(e => e.role === "super_admin").length}</strong></div>
      </div>

      {error ? <div className="alert">{error}</div> : null}

      <div className="panel">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-950">Employee Directory</h2>
          <input className="input sm:max-w-xs" onChange={(event) => setQuery(event.target.value)} placeholder="Search employees..." value={query} />
        </div>
        {loading ? (
          <div className="grid min-h-[240px] place-items-center text-slate-600">
            <div className="flex items-center gap-3">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-ember" />
              <span className="text-sm font-medium">Loading staff members</span>
            </div>
          </div>
        ) : !filteredEmployees.length ? (
          <div className="empty-state">No staff members found.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredEmployees.map((emp) => (
              <div className="flex flex-col rounded-md border border-slate-200 p-4" key={emp.id}>
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold text-slate-900">{emp.displayName || "Unknown Employee"}</div>
                  <span className={`text-xs px-2 py-1 rounded-full ${emp.role === "super_admin" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>
                    {emp.role.replaceAll("_", " ")}
                  </span>
                </div>
                <div className="text-sm text-slate-500 mb-4">{emp.email}</div>
                <div className="mt-auto flex gap-2 pt-2 border-t border-slate-100">
                  <button className="text-sm text-ember font-medium hover:underline flex-1 text-center" onClick={() => setEditingEmployee(emp)}>Edit</button>
                  <button className="text-sm text-red-600 font-medium hover:underline flex-1 text-center" onClick={() => setDeletingEmployee(emp)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingEmployee ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 px-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-md bg-white p-6 shadow-soft my-8">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-950">{isCreating ? "Add Staff" : "Edit Staff Role"}</h3>
              <p className="mt-1 text-sm text-slate-500">Update staff details and access level.</p>
            </div>
            <div className="space-y-4">
              <label className="field-label">
                Display Name
                <input
                  className="input"
                  value={editingEmployee.displayName || ""}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, displayName: e.target.value })}
                />
              </label>
              <label className="field-label">
                Email
                <input
                  type="email"
                  className="input"
                  value={editingEmployee.email || ""}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
                />
              </label>
              <label className="field-label">
                Role
                <select
                  className="input"
                  value={editingEmployee.role || "admin"}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, role: e.target.value })}
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="manager">Manager</option>
                </select>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => { setEditingEmployee(null); setIsCreating(false); }} type="button">
                Cancel
              </button>
              <button className="btn-primary" onClick={() => saveEmployee(editingEmployee)} type="button">
                {isCreating ? "Add Staff" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        confirmLabel="Remove staff"
        message={`Remove ${deletingEmployee?.displayName || "this staff member"}? This revokes their access.`}
        onCancel={() => setDeletingEmployee(null)}
        onConfirm={confirmDelete}
        open={Boolean(deletingEmployee)}
        title="Remove Staff"
      />
      <Toast message={toast?.message} onClose={() => setToast(null)} type={toast?.type} />
    </div>
  );
}
