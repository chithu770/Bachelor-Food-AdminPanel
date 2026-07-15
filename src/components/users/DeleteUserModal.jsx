import ConfirmDialog from "../common/ConfirmDialog";

export default function DeleteUserModal({ user, onCancel, onConfirm }) {
  return (
    <ConfirmDialog
      confirmLabel="Delete user"
      message={`Delete ${user?.displayName || user?.email || "this user"}? This cannot be undone.`}
      onCancel={onCancel}
      onConfirm={onConfirm}
      open={Boolean(user)}
      title="Delete user"
    />
  );
}
