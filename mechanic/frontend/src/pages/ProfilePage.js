import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../../../components/ToastProvider";
import API from "../services/api";
import {
  clearSession,
  getAddVehicleRoute,
  getDashboardRoute,
  getLoginRoute,
  getStoredToken,
  getStoredUser,
} from "../utils/session";
import { formatDisplayDate } from "../../../utils/formatters";
import "../../../pages/Profile.css";

export default function MechanicProfilePage() {
  const [profile, setProfile] = useState(() => getStoredUser());
  const [vehicles, setVehicles] = useState([]);
  const [serviceRecords, setServiceRecords] = useState([]);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (!getStoredToken()) {
      navigate(getLoginRoute(), { replace: true });
      return;
    }

    const loadProfile = async () => {
      try {
        const [profileResponse, vehiclesResponse, recordsResponse] = await Promise.all([
          API.get("/users/me"),
          API.get("/vehicles"),
          API.get("/service-records"),
        ]);

        setProfile(profileResponse.data);
        setVehicles(vehiclesResponse.data);
        setServiceRecords(recordsResponse.data);
      } catch (error) {
        toast.error(error.response?.data?.error || "Please login again.");
        clearSession();
        navigate(getLoginRoute(), { replace: true });
      }
    };

    loadProfile();
  }, [navigate, toast]);

  const profileStats = [
    {
      label: "Vehicles linked",
      value: String(profile?.stats?.vehicles_count ?? vehicles.length ?? 0),
    },
    {
      label: "Service records",
      value: String(profile?.stats?.service_records_count ?? serviceRecords.length ?? 0),
    },
    {
      label: "Current role",
      value: profile?.role || "mechanic",
    },
  ];

  return (
    <section className="profile-page">
      <div className="profile-page__backdrop"></div>

      <div className="profile-container">
        <header className="profile-hero">
          <div className="profile-hero__content">
            <p className="profile-hero__eyebrow">Mechanic Workspace</p>
            <h1>Review your account, service activity, and workshop access in one place.</h1>
            <p className="profile-hero__description">
              View your account details, access level, and service activity from
              one centralized mechanic profile workspace.
            </p>

            <div className="profile-hero__actions">
              <Link className="profile-hero__button" to={getDashboardRoute()}>
                Back to dashboard
              </Link>
              <Link className="profile-hero__secondary" to={getAddVehicleRoute()}>
                Add vehicle
              </Link>
            </div>
          </div>

          <aside className="profile-summary">
            <div className="profile-summary__avatar">
              {profile?.name?.charAt(0)?.toUpperCase() || "M"}
            </div>
            <div className="profile-summary__identity">
              <h2>{profile?.name || "Mechanic user"}</h2>
              <span>{profile?.role || "mechanic"}</span>
            </div>
            <p className="profile-summary__bio">
              Mechanic accounts can register vehicles and manage repair and service records.
            </p>
            <div className="profile-summary__status">
              <span>Current status</span>
              <strong>Active</strong>
            </div>
          </aside>
        </header>

        <section className="profile-grid">
          <article className="profile-card">
            <div className="profile-card__header">
              <p className="profile-card__eyebrow">Profile Overview</p>
              <h3>Account details</h3>
              <span>Your latest workshop account information is shown here.</span>
            </div>

            <div className="profile-details">
              {[
                { label: "Full name", value: profile?.name || "Mechanic user" },
                { label: "Email address", value: profile?.email || "Not available" },
                { label: "Phone number", value: profile?.phone || "Not available" },
                { label: "Role", value: profile?.role || "mechanic" },
                { label: "Address", value: profile?.address || "Not available" },
                { label: "Joined on", value: formatDisplayDate(profile?.created_at, "Not available") },
                { label: "Primary access", value: "Manage vehicles, jobs, and service records" },
                { label: "Account status", value: "Active" },
              ].map((item) => (
                <div className="profile-detail" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </article>

          <div className="profile-side">
            <article className="profile-card profile-card--dark">
              <div className="profile-card__header">
                <p className="profile-card__eyebrow profile-card__eyebrow--dark">Performance Snapshot</p>
                <h3>Quick stats</h3>
              </div>

              <div className="profile-stats">
                {profileStats.map((stat) => (
                  <div className="profile-stat" key={stat.label}>
                    <span>{stat.label}</span>
                    <strong>{stat.value}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="profile-card">
              <div className="profile-card__header">
                <p className="profile-card__eyebrow">Account Summary</p>
                <h3>Workspace guidance</h3>
              </div>

              <div className="profile-note">
                <p>Use this profile to confirm your role, contact details, and service activity.</p>
                <p>Your mechanic portal is focused on vehicle registration and service record management.</p>
              </div>
            </article>
          </div>
        </section>
      </div>
    </section>
  );
}
