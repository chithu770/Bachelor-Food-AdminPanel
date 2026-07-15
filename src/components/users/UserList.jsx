import LoadingSpinner from "../common/LoadingSpinner";
import UserCard from "./UserCard";

export default function UserList({ users, loading, onDelete, onEdit }) {
  if (loading) return <LoadingSpinner label="Loading users" />;
  if (!users.length) return <div className="empty-state">No users registered yet.</div>;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {users.map((user) => (
        <UserCard user={user} key={user.id} onDelete={onDelete} onEdit={onEdit} />
      ))}
    </div>
  );
}
