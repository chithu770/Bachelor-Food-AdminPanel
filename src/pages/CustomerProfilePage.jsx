import { ArrowLeft, Mail, MapPin, Phone, Shield, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Toast from "../components/common/Toast";
import { getFirebaseErrorMessage } from "../utils/helpers";

export default function CustomerProfilePage() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!customerId) {
        setError("No customer ID provided.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const docRef = doc(db, "users", customerId);
        const snap = await getDoc(docRef);
        if (!snap.exists()) throw new Error("Customer not found.");
        const data = snap.data();

        if (!cancelled) {
          setProfile({
            id:       snap.id,
            uid:      snap.id,
            name:     data.displayName           || "—",
            email:    data.email                 || "—",
            phone:    data.phone                 || data.phoneNumber || "—",
            role:     data.role                  || "user",
            photoURL: data.photoURL              || null,
            address:  data.address               || data.deliveryAddress || "—",
            createdAt: data.createdAt,
            lastLogin: data.lastLogin,
          });
        }
      } catch (err) {
        if (!cancelled) setError(getFirebaseErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [customerId]);

  function formatDate(val) {
    if (!val) return "—";
    const d = val instanceof Date ? val : val?.toDate ? val.toDate() : new Date(val);
    return isNaN(d.getTime())
      ? String(val)
      : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

  if (loading) return <LoadingSpinner label="Loading customer profile" />;

  // Show full-page error with a back button
  if (error) {
    return (
      <div className="space-y-6">
        <div className="page-header">
          <button
            className="btn-secondary"
            onClick={() => navigate(-1)}
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
        <div className="panel empty-state">
          <p className="text-lg font-semibold text-ember">{error}</p>
          <p className="mt-1 text-sm text-slate-500">
            No customer found with the supplied ID. Check the order details and try again.
          </p>
        </div>
        <Toast message={toast?.message} onClose={() => setToast(null)} type={toast?.type} />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-6">
      {/* ── Back + page header ─────────────────────────────────────────────── */}
      <div className="page-header">
        <button
          className="btn-secondary"
          onClick={() => navigate(-1)}
          type="button"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div>
          <p className="eyebrow">Customer at a glance</p>
          <h1 className="page-title">{profile.name}</h1>
        </div>
      </div>

      {/* ── Profile summary card ───────────────────────────────────────────── */}
      <div className="panel">
        <div className="flex flex-col gap-6 sm:flex-row">
          {/* Avatar */}
          <div className="grid place-items-center">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-slate-100">
              {profile.photoURL ? (
                <img
                  alt={profile.name}
                  className="h-20 w-20 rounded-full object-cover"
                  src={profile.photoURL}
                />
              ) : (
                <User className="h-9 w-9 text-slate-400" />
              )}
            </div>
          </div>

          {/* Name + role */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-950">{profile.name}</h2>
              <span className={`badge ${
                profile.role === "admin"
                  ? "c-rose border border-rose/20"
                  : "c-leaf border border-leaf/20"
              }`}>
                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400">UID · {String(profile.uid || profile.id)}</p>
          </div>
        </div>
      </div>

      {/* ── Detail fields ──────────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        <DetailField icon={<Mail className="h-4 w-4" />} label="Email address" value={profile.email} />
        <DetailField icon={<Phone className="h-4 w-4" />} label="Phone number"  value={profile.phone} />
        <DetailField icon={<MapPin className="h-4 w-4" />} label="Delivery address" value={profile.address} />
        <DetailField icon={<Shield className="h-4 w-4" />} label="Role"           value={profile.role} />
        <DetailField icon={<User className="h-4 w-4" />}  label="Member since"   value={formatDate(profile.createdAt)} />
        <DetailField icon={<Phone className="h-4 w-4" />} label="Last login"      value={formatDate(profile.lastLogin)} />
      </div>

      <Toast message={toast?.message} onClose={() => setToast(null)} type={toast?.type} />
    </div>
  );
}

function DetailField({ icon, label, value }) {
  return (
    <div className="panel flex items-start gap-3 p-4">
      <div className="grid h-8 w-8 place-items-center rounded-md bg-slate-100 shrink-0">
        <span className="h-4 w-4 text-slate-500">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-1 truncate text-sm font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}
