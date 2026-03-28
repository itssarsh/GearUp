import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { useToast } from "../../../components/ToastProvider";
import {
  clearSession,
  getDashboardRoute,
  getLoginRoute,
  getStoredToken,
  getStoredUser,
} from "../utils/session";
import {
  normalizePhoneNumber,
  normalizeRegistrationNumber,
  normalizeWhitespace,
  toTitleCase,
} from "../../../utils/normalize";
import "../../../pages/AddProduct.css";

export default function CustomerAddVehiclePage() {
  const [profile, setProfile] = useState(() => getStoredUser());
  const [form, setForm] = useState({
    registrationNumber: "",
    vehicleType: "Car",
    brand: "",
    model: "",
    manufactureYear: "",
    notes: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const basicFieldsCompleted = [
    form.registrationNumber,
    form.brand,
    form.model,
  ].filter((value) => value.trim()).length;

  useEffect(() => {
    if (!getStoredToken()) {
      navigate(getLoginRoute(), { replace: true });
      return;
    }

    const loadProfile = async () => {
      try {
        const response = await API.get("/users/me");
        setProfile(response.data);
      } catch (error) {
        toast.error(error.response?.data?.error || "Please login again.");
        clearSession();
        navigate(getLoginRoute(), { replace: true });
      }
    };

    loadProfile();
  }, [navigate, toast]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previousForm) => ({
      ...previousForm,
      [name]: name === "registrationNumber" ? value.toUpperCase() : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.registrationNumber.trim() || !form.brand.trim() || !form.model.trim()) {
      toast.error("Vehicle registration, brand, and model are required.");
      return;
    }

    setIsSaving(true);

    try {
      await API.post("/vehicles", {
        ...form,
        registrationNumber: normalizeRegistrationNumber(form.registrationNumber),
        brand: toTitleCase(form.brand),
        model: toTitleCase(form.model),
        manufactureYear: form.manufactureYear ? Number(form.manufactureYear) : null,
        ownerName: profile?.name ? toTitleCase(profile.name) : "",
        ownerPhone: normalizePhoneNumber(profile?.phone || ""),
        ownerUserId: profile?.id || null,
        notes: normalizeWhitespace(form.notes),
      });

      toast.success("Vehicle saved successfully");
      navigate(getDashboardRoute(), { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to save vehicle");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="add-product-page">
      <div className="add-product-page__backdrop"></div>

      <div className="add-product-layout">
        <div className="add-product-hero">
          <div className="add-product-hero__top">
            <Link className="add-product-hero__back" to={getDashboardRoute()}>
              Back to dashboard
            </Link>
            <span className="add-product-hero__badge">Vehicle Entry</span>
          </div>

          <div className="add-product-hero__heading">
            <h1>Add a vehicle</h1>
            <p>Save vehicle details once, then use the same record for future service history.</p>
          </div>

          <div className="add-product-hero__meta">
            <article className="add-product-hero__meta-card add-product-hero__meta-card--wide">
              <span>Current registration</span>
              <strong>{form.registrationNumber.trim() || "Registration not added yet"}</strong>
            </article>
            <article className="add-product-hero__meta-card">
              <span>Progress</span>
              <strong>{basicFieldsCompleted}/3 filled</strong>
            </article>
            <article className="add-product-hero__meta-card">
              <span>Owner details</span>
              <strong>
                {profile?.name && profile?.phone
                  ? `${profile.name} • ${profile.phone}`
                  : "Auto from profile"}
              </strong>
            </article>
            <article className="add-product-hero__meta-card">
              <span>Vehicle type</span>
              <strong>{form.vehicleType || "Not selected"}</strong>
            </article>
            <article className="add-product-hero__meta-card">
              <span>Entry mode</span>
              <strong>Customer self entry</strong>
            </article>
          </div>
        </div>

        <form className="add-product-card" onSubmit={handleSubmit}>
          <div className="add-product-card__header">
            <p className="add-product-card__eyebrow">New Vehicle</p>
            <h2>Add vehicle</h2>
            <span>Save the basic details now. Service records can be created for this vehicle afterward.</span>
          </div>

          <div className="add-product-card__section">
            <div className="add-product-card__section-head">
              <div>
                <h3>Vehicle basics</h3>
                <p>Add the core details first so this record is easy to search and reuse.</p>
              </div>
              <span className="add-product-card__section-tag">Required</span>
            </div>

            <div className="add-product-card__grid">
              <label className="add-product-card__field">
                <span>Registration Number</span>
                <input
                  name="registrationNumber"
                  placeholder="GJ01AB1234"
                  value={form.registrationNumber}
                  onChange={handleChange}
                />
              </label>

              <label className="add-product-card__field">
                <span>Vehicle Type</span>
                <select name="vehicleType" value={form.vehicleType} onChange={handleChange}>
                  <option value="Car">Car</option>
                  <option value="Tractor">Tractor</option>
                  <option value="Bike">Bike</option>
                  <option value="Truck">Truck</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label className="add-product-card__field">
                <span>Brand</span>
                <input name="brand" placeholder="Toyota" value={form.brand} onChange={handleChange} />
              </label>

              <label className="add-product-card__field">
                <span>Model</span>
                <input name="model" placeholder="Innova" value={form.model} onChange={handleChange} />
              </label>

              <label className="add-product-card__field">
                <span>Manufacture Year</span>
                <input
                  name="manufactureYear"
                  type="number"
                  placeholder="2022"
                  value={form.manufactureYear}
                  onChange={handleChange}
                />
              </label>

              <label className="add-product-card__field add-product-card__field--span-2">
                <div className="add-product-card__field-label">
                  <span className="add-product-card__field-label-title">Notes</span>
                  <span className="add-product-card__field-badge">Optional</span>
                </div>
                <textarea
                  name="notes"
                  placeholder="Add any useful details about the vehicle"
                  value={form.notes}
                  onChange={handleChange}
                />
              </label>
            </div>
          </div>

          <button className="add-product-card__button" type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save vehicle"}
          </button>
        </form>
      </div>
    </section>
  );
}
