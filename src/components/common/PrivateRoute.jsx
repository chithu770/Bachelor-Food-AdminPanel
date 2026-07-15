import { ShieldAlert } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import LoadingSpinner from "./LoadingSpinner";
import { useAuth } from "../../hooks/useAuth";
import { ROUTES } from "../../routes";

export default function PrivateRoute() {
  const { adminUid, isAdmin, isAuthenticated, loading, logout, user } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner label="Checking session" />;
  if (!isAuthenticated) return <Navigate replace state={{ from: location }} to={ROUTES.login} />;
  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
        <div className="w-full max-w-lg rounded-md border border-slate-200 bg-white p-7 text-center shadow-soft">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-md bg-red-50 text-ember">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-black text-slate-950">Access denied</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            This Firebase account is authenticated, but it is not the configured admin user.
          </p>
          <div className="mt-5 rounded-md bg-slate-50 p-4 text-left text-xs text-slate-600">
            <p><strong className="text-slate-800">Signed-in UID:</strong> {user?.uid}</p>
            <p className="mt-2"><strong className="text-slate-800">Required UID:</strong> {adminUid}</p>
          </div>
          <button className="btn-primary mt-6 w-full" onClick={logout} type="button">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
