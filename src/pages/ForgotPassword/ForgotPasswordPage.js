import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import { useToast } from "../../components/ToastProvider";
import makeApiCall, { API_CALL_TYPE, USER_API } from "../../services/api";
import { getDashboardRoute, getLoginRoute, getStoredToken, getStoredUser } from "../../utils/session";
import "./ForgotPassword.css";

export default function CustomerForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (getStoredToken() && getStoredUser()?.role === "customer") {
      navigate(getDashboardRoute(), { replace: true });
    }
  }, [navigate]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    setIsSubmitting(true);

    makeApiCall(
      API_CALL_TYPE.POST_CALL,
      USER_API.forgotPassword,
      (response) => {
        toast.success(response?.message || "Reset instructions sent");
        setEmail("");
        setIsSubmitting(false);
      },
      (error) => {
        toast.error(error.response?.data?.error || error.response?.data?.message || "Failed to send forgot password request");
        setIsSubmitting(false);
      },
      "",
      null,
      { email: email.trim() }
    ).catch(() => undefined);
  };

  return (
    <AuthLayout
      pageClassName="forgot-password-page"
      hero={{
        badge: "Account Recovery",
        title: "Recover access without losing service context.",
        description:
          "Use your registered email to receive a secure reset link and return to the same vehicle history, bookings, and support activity.",
        metrics: [
          {
            label: "Protected recovery",
            value: "Reset instructions are sent only to the registered email on the account.",
          },
          {
            label: "Service continuity",
            value: "Vehicles, bookings, invoices, and workshop communication remain untouched.",
          },
          {
            label: "Fast path back",
            value: "Open the email, set a new password, and sign in again without re-onboarding.",
          },
        ],
      }}
      card={{
        eyebrow: "Password Recovery",
        title: "Request reset link",
        description: "Enter your registered email and we will send reset instructions.",
      }}
    >
      <form onSubmit={handleSubmit}>
        <label className="auth-card__field" htmlFor="forgot-password-email">
          <span>Email</span>
          <input
            id="forgot-password-email"
            placeholder="Enter your registered email"
            type="email"
            value={email}
            disabled={isSubmitting}
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <button className="auth-card__button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send Reset Link"}
        </button>

        <p className="auth-card__footer">
          Remember your password? <Link className="auth-card__link" to={getLoginRoute()}>Back to login</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
