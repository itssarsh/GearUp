import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../../../components/ToastProvider";
import API from "../services/api";
import { getLoginRoute } from "../utils/session";
import "../../../pages/Signup.css";

export default function MechanicSignupPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (Object.values(form).some((value) => value.trim() === "")) {
      toast.error("All fields are required");
      return;
    }

    if (!/^\d{10}$/.test(form.phone)) {
      toast.error("Phone number must be 10 digits");
      return;
    }

    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      await API.post("/users/signup", form);
      toast.success("Mechanic account created successfully");
      window.setTimeout(() => navigate(getLoginRoute()), 900);
    } catch (error) {
      toast.error(error.response?.data?.error || "Signup failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="signup-page">
      <div className="signup-page__backdrop"></div>

      <div className="signup-layout">
        <form className="signup-card" onSubmit={handleSubmit}>
          <div className="signup-card__header">
            <p className="signup-card__eyebrow">Create Mechanic Account</p>
            <h2>Create your account</h2>
            <span>Create your account to start managing workshop operations.</span>
          </div>

          <label className="signup-card__field">
            <span>Name</span>
            <input
              placeholder="Enter your full name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </label>

          <label className="signup-card__field">
            <span>Email</span>
            <input
              placeholder="Enter your email"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </label>

          <label className="signup-card__field">
            <span>Address</span>
            <input
              placeholder="Enter your address"
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
            />
          </label>

          <label className="signup-card__field">
            <span>Phone Number</span>
            <input
              placeholder="Enter your phone number"
              type="tel"
              maxLength={10}
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </label>

          <label className="signup-card__field">
            <span>Password</span>
            <input
              placeholder="Create a password"
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
          </label>

          <label className="signup-card__field">
            <span>Confirm Password</span>
            <input
              placeholder="Confirm your password"
              type="password"
              value={form.confirmPassword}
              onChange={(event) =>
                setForm({ ...form, confirmPassword: event.target.value })
              }
            />
          </label>

          <button className="signup-card__button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create mechanic account"}
          </button>

          <p className="signup-card__footer">
            Already have access? <Link to={getLoginRoute()}>Login here</Link>
          </p>
        </form>

        <div className="signup-hero">
          <span className="signup-hero__badge">Service Access</span>
          <h1>Create your workshop account and start handling service operations.</h1>
          <p>
            Create your account to manage vehicles, service records, and repair
            progress from one place.
          </p>

          <div className="signup-hero__stats">
            <div className="signup-hero__stat">
              <strong>Service actions</strong>
              <span>Add vehicles, service records, and update repair progress.</span>
            </div>
            <div className="signup-hero__stat">
              <strong>Workshop access</strong>
              <span>Sign in after signup to continue managing workshop activity.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
