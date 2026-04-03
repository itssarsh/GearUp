import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import PasswordInput from "../../components/PasswordInput";
import { useToast } from "../../components/ToastProvider";
import makeApiCall, { API_CALL_TYPE, USER_API } from "../../services/api";
import { getLoginRoute } from "../../utils/session";
import "./Signup.css";

export default function CustomerSignupPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    state: "",
    city: "",
    locality: "",
    pincode: "",
    password: "",
    confirmPassword: "",
    vehicleType: "",
    vehicleModel: "",
    vehicleNumber: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const updateFormField = (field) => (event) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const requiredFields = [
      form.name,
      form.email,
      form.phone,
      form.address,
      form.state,
      form.city,
      form.locality,
      form.pincode,
      form.password,
      form.confirmPassword,
    ];

    if (requiredFields.some((value) => value.trim() === "")) {
      toast.error("Complete the required registration fields");
      return;
    }

    if (!/^\d{10}$/.test(form.phone)) {
      toast.error("Phone number must be 10 digits");
      return;
    }

    if (!/^\d{6}$/.test(form.pincode)) {
      toast.error("Pincode must be 6 digits");
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

    const hasAnyVehicleDetail = Boolean(
      form.vehicleType.trim() || form.vehicleModel.trim() || form.vehicleNumber.trim()
    );
    const hasAllVehicleDetails = Boolean(
      form.vehicleType.trim() && form.vehicleModel.trim() && form.vehicleNumber.trim()
    );

    if (hasAnyVehicleDetail && !hasAllVehicleDetails) {
      toast.error("Complete vehicle type, model, and number together or leave them blank");
      return;
    }

    setIsSubmitting(true);

    makeApiCall(
      API_CALL_TYPE.POST_CALL,
      USER_API.signup,
      () => {
        toast.success("Account created successfully");
        setIsSubmitting(false);
        window.setTimeout(() => navigate(getLoginRoute()), 900);
      },
      (error) => {
        toast.error(error.response?.data?.error || "Signup failed");
        setIsSubmitting(false);
      },
      "",
      null,
      {
        ...form,
        email: form.email.trim().toLowerCase(),
      }
    ).catch(() => undefined);
  };

  return (
    <AuthLayout
      pageClassName="signup-page"
      variant="stacked"
      hero={{
        badge: "Customer Onboarding",
        title: "Create a customer account that is ready for actual service operations.",
        description:
          "Set up your identity, address, and optional vehicle snapshot once so bookings, support, and reminders start with cleaner customer data.",
        metrics: [
          {
            label: "Verified contact flow",
            value: "Name, email, and phone become the operational identity for future updates and reminders.",
          },
          {
            label: "Location ready",
            value: "Address, city, locality, and pincode help workshops plan pickup, drop, and support coverage.",
          },
          {
            label: "Vehicle optional",
            value: "Add one vehicle now for a smoother first booking, or complete it later from the dashboard.",
          },
        ],
        panel: {
          title: "Responsive by default",
          description:
            "This form now behaves like a dense but readable mobile-first registration flow instead of a stretched desktop-only sheet.",
        },
      }}
      card={{
        eyebrow: "Customer Onboarding",
        title: "Create customer access",
        description: "Enter your account details first. Vehicle information is optional.",
      }}
    >
      <form onSubmit={handleSubmit}>
        <div className="auth-card__grid">
          <div className="signup-form-section auth-card__field--span-2">
            <span className="signup-form-section__label">Account details</span>
          </div>

          <label className="auth-card__field" htmlFor="signup-name">
            <span>Full name</span>
            <input
              id="signup-name"
              placeholder="Enter your full name"
              value={form.name}
              autoComplete="name"
              onChange={updateFormField("name")}
            />
          </label>

          <label className="auth-card__field" htmlFor="signup-email">
            <span>Email</span>
            <input
              id="signup-email"
              placeholder="Enter your email"
              type="email"
              value={form.email}
              autoComplete="email"
              onChange={updateFormField("email")}
            />
          </label>

          <label className="auth-card__field" htmlFor="signup-phone">
            <span>Mobile number</span>
            <input
              id="signup-phone"
              placeholder="Enter 10-digit mobile number"
              type="tel"
              maxLength={10}
              value={form.phone}
              autoComplete="tel"
              onChange={updateFormField("phone")}
            />
          </label>

          <label className="auth-card__field" htmlFor="signup-password">
            <span>Password</span>
            <PasswordInput
              id="signup-password"
              placeholder="Create a password"
              value={form.password}
              autoComplete="new-password"
              onChange={updateFormField("password")}
            />
          </label>

          <label className="auth-card__field auth-card__field--span-2" htmlFor="signup-confirm-password">
            <span>Confirm password</span>
            <PasswordInput
              id="signup-confirm-password"
              placeholder="Confirm your password"
              value={form.confirmPassword}
              autoComplete="new-password"
              onChange={updateFormField("confirmPassword")}
            />
          </label>

          <div className="signup-form-section auth-card__field--span-2">
            <span className="signup-form-section__label">Location details</span>
          </div>

          <label className="auth-card__field auth-card__field--span-2" htmlFor="signup-address">
            <span>Address</span>
            <textarea
              id="signup-address"
              placeholder="House number, building, street, landmark"
              value={form.address}
              autoComplete="street-address"
              onChange={updateFormField("address")}
            />
          </label>

          <label className="auth-card__field" htmlFor="signup-state">
            <span>State</span>
            <input
              id="signup-state"
              placeholder="Enter state"
              value={form.state}
              autoComplete="address-level1"
              onChange={updateFormField("state")}
            />
          </label>

          <label className="auth-card__field" htmlFor="signup-city">
            <span>City</span>
            <input
              id="signup-city"
              placeholder="Enter city"
              value={form.city}
              autoComplete="address-level2"
              onChange={updateFormField("city")}
            />
          </label>

          <label className="auth-card__field" htmlFor="signup-locality">
            <span>Locality / area</span>
            <input
              id="signup-locality"
              placeholder="Enter locality or area"
              value={form.locality}
              onChange={updateFormField("locality")}
            />
          </label>

          <label className="auth-card__field" htmlFor="signup-pincode">
            <span>Pincode</span>
            <input
              id="signup-pincode"
              placeholder="Enter 6-digit pincode"
              type="tel"
              maxLength={6}
              value={form.pincode}
              autoComplete="postal-code"
              onChange={(event) => {
                const numericValue = event.target.value.replace(/\D/g, "").slice(0, 6);
                setForm((currentForm) => ({
                  ...currentForm,
                  pincode: numericValue,
                }));
              }}
            />
          </label>

          <div className="signup-form-section auth-card__field--span-2">
            <span className="signup-form-section__label">Optional vehicle details</span>
          </div>

          <label className="auth-card__field" htmlFor="signup-vehicle-type">
            <span>Vehicle type</span>
            <input
              id="signup-vehicle-type"
              placeholder="Car, bike, scooter"
              value={form.vehicleType}
              onChange={updateFormField("vehicleType")}
            />
          </label>

          <label className="auth-card__field" htmlFor="signup-vehicle-model">
            <span>Vehicle model</span>
            <input
              id="signup-vehicle-model"
              placeholder="Enter vehicle model"
              value={form.vehicleModel}
              onChange={updateFormField("vehicleModel")}
            />
          </label>

          <label className="auth-card__field auth-card__field--span-2" htmlFor="signup-vehicle-number">
            <span>Vehicle number</span>
            <input
              id="signup-vehicle-number"
              placeholder="Enter registration number"
              value={form.vehicleNumber}
              onChange={updateFormField("vehicleNumber")}
            />
          </label>
        </div>

        <button className="auth-card__button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create Account"}
        </button>

        <p className="auth-card__footer">
          Already onboarded? <Link className="auth-card__link" to={getLoginRoute()}>Sign in here</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
