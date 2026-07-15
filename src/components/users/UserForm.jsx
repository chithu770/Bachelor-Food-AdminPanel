import { useEffect, useState } from "react";
import { USER_ROLES } from "../../utils/constants";

const initialValues = {
  displayName: "",
  email: "",
  role: USER_ROLES[0]
};

export default function UserForm({ editingUser, onCancel, onSubmit }) {
  const [values, setValues] = useState(initialValues);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setValues(editingUser ? { ...initialValues, ...editingUser } : initialValues);
  }, [editingUser]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    await onSubmit(values);
    setSubmitting(false);
    if (!editingUser) setValues(initialValues);
  }

  return (
    <form className="panel space-y-4" onSubmit={handleSubmit}>
      <div>
        <h2 className="text-lg font-bold text-slate-950">{editingUser ? "Edit user" : "Add user"}</h2>
        <p className="mt-1 text-sm text-slate-500">Manage registered users and their roles.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="field-label">
          Display name
          <input className="input" onChange={(event) => setValues({ ...values, displayName: event.target.value })} value={values.displayName} />
        </label>
        <label className="field-label">
          Email
          <input className="input" onChange={(event) => setValues({ ...values, email: event.target.value })} type="email" value={values.email} />
        </label>
        <label className="field-label">
          Role
          <select className="input" onChange={(event) => setValues({ ...values, role: event.target.value })} value={values.role}>
            {USER_ROLES.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap justify-end gap-3">
        {editingUser ? (
          <button className="btn-secondary" onClick={onCancel} type="button">
            Cancel
          </button>
        ) : null}
        <button className="btn-primary" disabled={submitting} type="submit">
          {submitting ? "Saving..." : editingUser ? "Update user" : "Add user"}
        </button>
      </div>
    </form>
  );
}
