import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import AuthWrapper from "./AuthWrapper";
import { useAuth } from "../../hooks/useAuth";
import { ROUTES } from "../../routes";
import { getFirebaseErrorMessage } from "../../utils/helpers";
import { validateAuth } from "../../utils/validators";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate replace to={ROUTES.dashboard} />;

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateAuth(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    setServerError("");
    try {
      await login(values);
      navigate(location.state?.from?.pathname || ROUTES.dashboard, { replace: true });
    } catch (error) {
      setServerError(getFirebaseErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthWrapper subtitle="Sign in with the Firebase email and password provider." title="Welcome back">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="field-label">
          Email
          <input className="input" onChange={(event) => setValues({ ...values, email: event.target.value })} type="email" value={values.email} />
          {errors.email ? <span className="field-error">{errors.email}</span> : null}
        </label>
        <label className="field-label">
          Password
          <input className="input" onChange={(event) => setValues({ ...values, password: event.target.value })} type="password" value={values.password} />
          {errors.password ? <span className="field-error">{errors.password}</span> : null}
        </label>
        {serverError ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p> : null}
        <button className="btn-primary w-full" disabled={submitting} type="submit">
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        New admin?{" "}
        <Link className="font-semibold text-ember hover:text-red-600" to={ROUTES.register}>
          Create an account
        </Link>
      </p>
    </AuthWrapper>
  );
}
