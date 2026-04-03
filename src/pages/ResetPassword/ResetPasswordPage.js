import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import PasswordInput from "../../components/PasswordInput";
import { useToast } from "../../components/ToastProvider";
import makeApiCall, { API_CALL_TYPE, USER_API } from "../../services/api";
import {
  getDashboardRoute,
  getForgotPasswordRoute,
  getLoginRoute,
  getStoredToken,
  getStoredUser,
} from "../../utils/session";
import "./ResetPassword.css";

export default function CustomerResetPasswordPage() {
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
    if (getStoredToken() && getStoredUser()?.role === "customer") {
      navigate(getDashboardRoute(), { replace: true });
    }
  }, [navigate]);

  const handleSubmit = (event) => {
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

    makeApiCall(
      API_CALL_TYPE.POST_CALL,
      USER_API.resetPassword,
      (response) => {
        toast.success(response?.message || "Password reset successful");
        setIsSubmitting(false);
        window.setTimeout(() => navigate(getLoginRoute()), 900);
      },
      (error) => {
        toast.error(error.response?.data?.message || "Failed to reset password");
        setIsSubmitting(false);
      },
      "",
      null,
      {
        email,
        token,
        newPassword: password,
      }
    ).catch(() => undefined);
  };

  return (
    <AuthLayout
      pageClassName="reset-password-page"
      hero={{
        badge: "Password Reset",
        title: "Create a stronger password and step back into the workspace.",
        description:
          "This reset flow keeps the account intact while giving you a clean, secure credential refresh.",
        metrics: [
          {
            label: "Verified link",
            value: "Reset only works with the signed token and registered customer email.",
          },
          {
            label: "No data loss",
            value: "Vehicles, chats, records, and notifications remain exactly where you left them.",
          },
          {
            label: "Immediate return",
            value: "Update the password now and sign in again as soon as the change is confirmed.",
          },
        ],
      }}
      card={{
        eyebrow: "Reset Password",
        title: "Create a new password",
        description: "Set a fresh password for your account and continue securely.",
      }}
    >
      <form onSubmit={handleSubmit}>
        <label className="auth-card__field" htmlFor="reset-email">
          <span>Email</span>
          <input id="reset-email" type="email" value={email} disabled autoComplete="email" />
        </label>

        <label className="auth-card__field" htmlFor="reset-password">
          <span>New Password</span>
          <PasswordInput
            id="reset-password"
            placeholder="Enter new password"
            value={password}
            disabled={isSubmitting || !hasValidResetParams}
            autoComplete="new-password"
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        <label className="auth-card__field" htmlFor="reset-confirm-password">
          <span>Confirm Password</span>
          <PasswordInput
            id="reset-confirm-password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            disabled={isSubmitting || !hasValidResetParams}
            autoComplete="new-password"
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </label>

        {!hasValidResetParams && (
          <p className="auth-card__notice">
            This recovery link is incomplete. Request a fresh password reset email to continue.
          </p>
        )}

        <button
          className="auth-card__button"
          type="submit"
          disabled={isSubmitting || !hasValidResetParams}
        >
          {isSubmitting ? "Updating..." : "Update Password"}
        </button>

        <p className="auth-card__footer">
          Need a new reset link? <Link className="auth-card__link" to={getForgotPasswordRoute()}>Forgot password</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
