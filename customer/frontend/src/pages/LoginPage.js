import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../../../components/ToastProvider";
import API from "../services/api";
import { getDashboardRoute, getForgotPasswordRoute, getStoredToken, getStoredUser, storeSession } from "../utils/session";
import "../../../pages/Login.css";

export default function CustomerLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const token = getStoredToken();
    const user = getStoredUser();

    if (token && user?.role === "customer") {
      navigate(getDashboardRoute(), { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("All fields are required");
      return;
    }

    try {
      const response = await API.post("/users/login", { email, password });

      if (String(response.data?.user?.role || "").trim().toLowerCase() !== "customer") {
        toast.error("Please use the staff login page for this account.");
        return;
      }

      storeSession(response.data.token, response.data.user);
      toast.success("Login successful");
      navigate(getDashboardRoute(), { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.error || "Login failed");
    }
  };

  return (
    <section className="login-page">
      <div className="login-page__backdrop"></div>
      <div className="login-layout">
        <div className="login-hero">
          <span className="login-hero__badge">Customer Service Access</span>
          <h1>Track service history for your vehicles in one app.</h1>
          <p>
            Customer accounts can monitor vehicle records, recent service
            updates, and upcoming maintenance dates from one place.
          </p>

          <div className="login-hero__highlights">
            <div className="login-hero__item">
              <strong>Vehicle-based records</strong>
              <span>Every entry stays linked to a specific vehicle history.</span>
            </div>
            <div className="login-hero__item">
              <strong>Customer-only access</strong>
              <span>Review your own vehicles, updates, and upcoming service dates.</span>
            </div>
          </div>
        </div>

        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-card__header">
            <p className="login-card__eyebrow">Customer Login</p>
            <h2>Sign in</h2>
            <span>Enter your credentials to open your vehicle service workspace.</span>
          </div>

          <label className="login-card__field">
            <span>Email</span>
            <input
              placeholder="Enter your email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="login-card__field">
            <span>Password</span>
            <input
              placeholder="Enter your password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <div className="login-card__meta">
            <Link className="login-card__forgot-link" to={getForgotPasswordRoute()}>
              Forgot password?
            </Link>
          </div>

          <button className="login-card__button" type="submit">
            Login
          </button>

          <p className="login-card__footer">
            Need an account? <Link to="/signup">Create</Link>
          </p>
        </form>
      </div>
    </section>
  );
}
