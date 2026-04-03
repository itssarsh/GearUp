import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import PasswordInput from "../../components/PasswordInput";
import { useToast } from "../../components/ToastProvider";
import makeApiCall, { API_CALL_TYPE, USER_API } from "../../services/api";
import { getDashboardRoute, getForgotPasswordRoute, hasCustomerSession, storeSession } from "../../utils/session";
import "./Login.css";

export default function CustomerLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (hasCustomerSession()) {
      navigate(getDashboardRoute(), { replace: true });
    }
  }, [navigate]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("All fields are required");
      return;
    }

    makeApiCall(
      API_CALL_TYPE.POST_CALL,
      USER_API.login,
      (response) => {
        if (String(response?.user?.role || "").trim().toLowerCase() !== "customer") {
          toast.error("Please use the staff login page for this account.");
          return;
        }

        storeSession(response.token, response.user, response.expiresAt);
        toast.success("Login successful");
        navigate(getDashboardRoute(), { replace: true });
      },
      (error) => {
        toast.error(error.response?.data?.error || "Login failed");
      },
      "",
      null,
      { email, password }
    ).catch(() => undefined);
  };

  return (
    <AuthLayout
      pageClassName="login-page"
      hero={{
        badge: "Customer Access",
        title: "A customer workspace with the clarity of a service control room.",
        description:
          "Track vehicles, bookings, workshop updates, and support requests from one fast, structured command surface.",
        metrics: [
          {
            label: "Linked records",
            value: "Every registered vehicle stays connected to maintenance history and invoices.",
          },
          {
            label: "Live visibility",
            value: "Follow service progress, alert status, and workshop communication without context switching.",
          },
          {
            label: "Rapid help",
            value: "Emergency, feedback, complaints, and chat are all reachable from the same operating flow.",
          },
        ],
        panel: {
          title: "Built for repeat use, not one-time visits",
          description:
            "The portal now behaves like a real customer operations product with clear hierarchy, strong focus states, and responsive ergonomics.",
        },
      }}
      card={{
        eyebrow: "Secure Sign In",
        title: "Welcome back",
        description: "Enter your credentials to reopen your customer workspace.",
      }}
    >
      <form onSubmit={handleSubmit}>
        <label className="auth-card__field" htmlFor="login-email">
          <span>Email</span>
          <input
            id="login-email"
            placeholder="Enter your email"
            type="email"
            value={email}
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="auth-card__field" htmlFor="login-password">
          <span>Password</span>
          <PasswordInput
            id="login-password"
            placeholder="Enter your password"
            value={password}
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        <div className="auth-card__meta">
          <Link className="auth-card__link" to={getForgotPasswordRoute()}>
            Forgot password?
          </Link>
        </div>

        <button className="auth-card__button" type="submit">
          Sign In
        </button>

        <p className="auth-card__footer">
          Don't have an account?{" "}
          <Link className="auth-card__link" to="/signup">Create one</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
