import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AuthWrapper from "./AuthWrapper";
import { useAuth } from "../../hooks/useAuth";
import { ROUTES } from "../../routes";
import { getFirebaseErrorMessage } from "../../utils/helpers";
import { validateAuth } from "../../utils/validators";

export default function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate replace to={ROUTES.dashboard} />;

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateAuth(values, "register");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    setServerError("");
    try {
      await register(values);
      navigate(ROUTES.dashboard, { replace: true });
    } catch (error) {
      setServerError(getFirebaseErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthWrapper subtitle="Create a Firebase authenticated admin profile." title="Create account">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="field-label">
          Name
          <input className="input" onChange={(event) => setValues({ ...values, name: event.target.value })} value={values.name} />
          {errors.name ? <span className="field-error">{errors.name}</span> : null}
        </label>
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
          {submitting ? "Creating..." : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Already registered?{" "}
        <Link className="font-semibold text-ember hover:text-red-600" to={ROUTES.login}>
          Sign in
        </Link>
      </p>
    </AuthWrapper>
  );
}
