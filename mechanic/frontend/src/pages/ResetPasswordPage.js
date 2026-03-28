import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "../../../components/ToastProvider";
import API from "../services/api";
import {
  getDashboardRoute,
  getForgotPasswordRoute,
  getLoginRoute,
  getStoredToken,
  getStoredUser,
  isMechanicRole,
} from "../utils/session";
import "../../../pages/ResetPassword.css";

export default function MechanicResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const email = useMemo(() => searchParams.get("email")?.trim() || "", [searchParams]);
  const token = useMemo(() => searchParams.get("token")?.trim() || "", [searchParams]);
  const hasValidResetParams = Boolean(email && token);

  useEffect(() => {
    if (getStoredToken() && isMechanicRole(getStoredUser()?.role)) {
      navigate(getDashboardRoute(), { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!hasValidResetParams) {
      toast.error("Reset link is invalid. Please request a new link.");
      return;
    }

    if (!password.trim() || !confirmPassword.trim()) {
      toast.error("All fields are required");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await API.post("/users/reset-password", {
        email,
        token,
        newPassword: password,
      });

      toast.success(response.data?.message || "Password reset successful");
      window.setTimeout(() => navigate(getLoginRoute()), 900);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="reset-password-page">
      <div className="reset-password-page__backdrop"></div>

      <div className="reset-password-layout">
        <div className="reset-password-hero">
          <span className="reset-password-hero__badge">Password Recovery</span>
          <h1>Finish password recovery and get back to your work quickly.</h1>
          <p>
            Use the reset link from your email to open this page, then choose a
            secure new password for your account.
          </p>

          <div className="reset-password-hero__panel">
            <strong>Need a valid link</strong>
            <span>
              This page expects a reset token and email in the URL. If they are
              missing or expired, request a fresh reset link.
            </span>
          </div>
        </div>

        <form className="reset-password-card" onSubmit={handleSubmit}>
          <div className="reset-password-card__header">
            <p className="reset-password-card__eyebrow">Reset Password</p>
            <h2>Set a new password</h2>
            <span>Create a new password for your account.</span>
          </div>

          <label className="reset-password-card__field">
            <span>Email</span>
            <input type="email" value={email} disabled />
          </label>

          <label className="reset-password-card__field">
            <span>New Password</span>
            <input
              placeholder="Enter new password"
              type="password"
              value={password}
              disabled={isSubmitting || !hasValidResetParams}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <label className="reset-password-card__field">
            <span>Confirm Password</span>
            <input
              placeholder="Re-enter new password"
              type="password"
              value={confirmPassword}
              disabled={isSubmitting || !hasValidResetParams}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>

          {!hasValidResetParams && (
            <p className="reset-password-card__notice">
              Reset token ya email URL mein missing hai. Pehle forgot password se
              naya link generate kijiye.
            </p>
          )}

          <button
            className="reset-password-card__button"
            type="submit"
            disabled={isSubmitting || !hasValidResetParams}
          >
            {isSubmitting ? "Updating..." : "Reset password"}
          </button>

          <p className="reset-password-card__footer">
            Need a new reset link? <Link to={getForgotPasswordRoute()}>Forgot password</Link>
          </p>
        </form>
      </div>
    </section>
  );
}
