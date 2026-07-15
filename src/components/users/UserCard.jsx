import { Edit3, Shield, Trash2, User } from "lucide-react";

export default function UserCard({ user, onDelete, onEdit }) {
  return (
    <article className="card">
      <div className="flex items-start justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100">
            <User className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-950">{user.displayName || "Unnamed User"}</h3>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${user.role === "admin" ? "bg-ember/10 text-ember" : "bg-slate-100 text-slate-600"}`}>
          {user.role === "admin" && <Shield className="mr-1 inline h-3 w-3" />}
          {user.role}
        </span>
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
        <div className="text-xs text-slate-500">
          Joined: {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : "-"}
        </div>
        <div className="flex gap-2">
          <button className="icon-action" onClick={() => onEdit(user)} title="Edit user" type="button">
            <Edit3 className="h-4 w-4" />
          </button>
          <button className="icon-danger" onClick={() => onDelete(user)} title="Delete user" type="button">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
