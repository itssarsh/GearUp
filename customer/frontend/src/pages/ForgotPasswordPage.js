import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../../../components/ToastProvider";
import API from "../services/api";
import { getDashboardRoute, getLoginRoute, getStoredToken, getStoredUser } from "../utils/session";
import "../../../pages/ForgotPassword.css";

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

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await API.post("/users/forgot-password", { email: email.trim() });
      toast.success(response.data?.message || "Reset instructions sent");
      setEmail("");
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data?.message || "Failed to send forgot password request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="forgot-password-page">
      <div className="forgot-password-page__backdrop"></div>

      <div className="forgot-password-layout">
        <div className="forgot-password-hero">
          <span className="forgot-password-hero__badge">Customer Recovery</span>
          <h1>Recover customer access without leaving the service portal.</h1>
          <p>
            Request a secure reset link for your customer account and continue
            access to your vehicle service workspace.
          </p>

          <div className="forgot-password-hero__panel">
            <strong>What happens next?</strong>
            <span>
              If the email is registered, password reset instructions will be
              sent so you can create a new password safely.
            </span>
          </div>
        </div>

        <form className="forgot-password-card" onSubmit={handleSubmit}>
          <div className="forgot-password-card__header">
            <p className="forgot-password-card__eyebrow">Forgot Password</p>
            <h2>Reset your password</h2>
            <span>Enter your registered email to continue with password reset.</span>
          </div>

          <label className="forgot-password-card__field">
            <span>Email</span>
            <input
              placeholder="Enter your registered email"
              type="email"
              value={email}
              disabled={isSubmitting}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <button className="forgot-password-card__button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send reset request"}
          </button>

          <p className="forgot-password-card__footer">
            Remember your password? <Link to={getLoginRoute()}>Back to login</Link>
          </p>
        </form>
      </div>
    </section>
  );
}
