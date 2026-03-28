import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../../../components/ToastProvider";
import API from "../services/api";
import {
  clearSession,
  getAddServiceRoute,
  getAddVehicleRoute,
  getLoginRoute,
  getProfileRoute,
  getStoredToken,
} from "../utils/session";
import { formatCurrencyInr, formatDisplayDate, formatStatusLabel } from "../../../utils/formatters";
import "../../../pages/Dashboard.css";

export default function MechanicDashboardPage() {
  const [vehicles, setVehicles] = useState([]);
  const [serviceRecords, setServiceRecords] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (!getStoredToken()) {
      navigate(getLoginRoute(), { replace: true });
      return;
    }

    const loadDashboard = async () => {
      try {
        const [vehiclesResponse, recordsResponse, profileResponse] = await Promise.all([
          API.get("/vehicles"),
          API.get("/service-records"),
          API.get("/users/me"),
        ]);

        setVehicles(vehiclesResponse.data);
        setServiceRecords(recordsResponse.data);
        setUser(profileResponse.data);
      } catch (error) {
        toast.error(error.response?.data?.error || "Please login again.");
        clearSession();
        navigate(getLoginRoute(), { replace: true });
      }
    };

    loadDashboard();
  }, [navigate, toast]);

  const totalRevenue = serviceRecords.reduce((sum, record) => sum + Number(record.amount || 0), 0);
  const pendingJobs = serviceRecords.filter(
    (record) => record.status === "pending" || record.status === "in_progress"
  ).length;
  const completedJobs = serviceRecords.filter(
    (record) => record.status === "completed" || record.status === "delivered"
  ).length;

  const logoutUser = async () => {
    try {
      await API.post("/users/logout");
    } catch (error) {
      toast.error(error.response?.data?.error || "Logout failed.");
    } finally {
      clearSession();
      navigate(getLoginRoute(), { replace: true });
    }
  };

  return (
    <section className="dashboard-page">
      <div className="dashboard-page__backdrop"></div>

      <div className="dashboard-container">
        <header className="dashboard-hero">
          <div className="dashboard-hero__content">
            <p className="dashboard-hero__eyebrow">Mechanic workspace</p>
            <h1>Manage vehicle repairs and service history in one place.</h1>
            <p className="dashboard-hero__description">
              Mechanics can add vehicles and save service records while keeping
              every job update organized by vehicle.
            </p>

            <div className="dashboard-hero__highlights">
              <article className="dashboard-highlight">
                <span>Registered vehicles</span>
                <strong>{vehicles.length}</strong>
              </article>
              <article className="dashboard-highlight">
                <span>Pending jobs</span>
                <strong>{pendingJobs}</strong>
              </article>
              <article className="dashboard-highlight">
                <span>Completed jobs</span>
                <strong>{completedJobs}</strong>
              </article>
            </div>

            <div className="dashboard-hero__actions">
              <div className="dashboard-hero__buttons">
                <Link className="dashboard-hero__button" to={getAddVehicleRoute()}>
                  Add Vehicle
                </Link>
                <Link className="dashboard-hero__secondary dashboard-hero__secondary-link" to={getAddServiceRoute()}>
                  Add Service
                </Link>
                <Link className="dashboard-hero__secondary dashboard-hero__secondary-link" to={getProfileRoute()}>
                  Profile
                </Link>
                <button className="dashboard-hero__secondary" type="button" onClick={logoutUser}>
                  Logout
                </button>
              </div>
            </div>
          </div>

          <div className="dashboard-hero__panel">
            <div className="dashboard-hero__panel-label">Service Snapshot</div>
            <div className="dashboard-hero__stats">
              <article className="dashboard-stat">
                <span>Registered Vehicles</span>
                <strong>{vehicles.length}</strong>
              </article>
              <article className="dashboard-stat">
                <span>Total Service Value</span>
                <strong>{formatCurrencyInr(totalRevenue)}</strong>
              </article>
              <article className="dashboard-stat">
                <span>Pending Jobs</span>
                <strong>{pendingJobs}</strong>
              </article>
            </div>
            <div className="dashboard-hero__foot">
              <span>Logged in as</span>
              <strong>{user?.name || "Mechanic"}</strong>
            </div>
          </div>
        </header>

        <section className="dashboard-section dashboard-section--vehicles">
          <div className="dashboard-section__header">
            <div>
              <p className="dashboard-section__eyebrow">Vehicle Registry</p>
              <h2>Vehicles created from this mechanic portal</h2>
              <span>Use these records to open service jobs and keep owner details organized.</span>
            </div>
            <Link className="dashboard-section__link" to={getAddVehicleRoute()}>
              Register Another Vehicle
            </Link>
          </div>

          <div className="dashboard-grid">
            {vehicles.length > 0 ? (
              vehicles.map((vehicle) => (
                <article className="dashboard-card" key={vehicle.id}>
                  <div className="dashboard-card__top">
                    <div className="dashboard-card__icon">
                      {vehicle.model?.charAt(0)?.toUpperCase() || ""}
                    </div>
                    <span className="dashboard-card__pill">{vehicle.vehicle_type}</span>
                  </div>

                  <div className="dashboard-card__content">
                    <h3>{vehicle.brand} {vehicle.model}</h3>
                    <p>{vehicle.registration_number}</p>
                  </div>

                  <div className="dashboard-card__meta">
                    <div>
                      <span>Owner</span>
                      <strong>{vehicle.owner_name}</strong>
                    </div>
                    <div>
                      <span>Phone</span>
                      <strong>{vehicle.owner_phone || "Not available"}</strong>
                    </div>
                  </div>

                  <div className="dashboard-card__footer">
                    <div>
                      <span>Year</span>
                      <strong>{vehicle.manufacture_year || "Not set"}</strong>
                    </div>
                    <div>
                      <span>Registered on</span>
                      <strong>{formatDisplayDate(vehicle.created_at)}</strong>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="dashboard-empty">
                <div className="dashboard-empty__badge">No vehicles yet</div>
                <h3>Add your first vehicle to start workshop operations.</h3>
                <p>Once a vehicle is registered, it will appear here with owner and service context.</p>
                <Link className="dashboard-empty__button" to={getAddVehicleRoute()}>
                  Add First Vehicle
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="dashboard-section">
          <div className="dashboard-section__header">
            <div>
              <p className="dashboard-section__eyebrow">Service History</p>
              <h2>Recent vehicle records</h2>
              <span>Review recent vehicle records and edit service details directly from each card.</span>
            </div>
            <Link className="dashboard-section__link" to={getAddServiceRoute()}>
              Add New Service
            </Link>
          </div>

          <div className="dashboard-grid">
            {serviceRecords.length > 0 ? (
              serviceRecords.map((record) => (
                <article className="dashboard-card" key={record.id}>
                  <div className="dashboard-card__top">
                    <div className="dashboard-card__icon">
                      {record.model?.charAt(0)?.toUpperCase() || ""}
                    </div>
                    <span className="dashboard-card__pill">
                      {formatStatusLabel(record.status, "Pending")}
                    </span>
                  </div>

                  <div className="dashboard-card__content">
                    <h3>{record.brand} {record.model}</h3>
                    <p>
                      {record.service_type} for {record.registration_number}.
                      {record.complaint ? ` Complaint: ${record.complaint}` : ""}
                    </p>
                  </div>

                  <div className="dashboard-card__meta">
                    <div>
                      <span>Owner</span>
                      <strong>{record.owner_name}</strong>
                    </div>
                    <div>
                      <span>Mechanic</span>
                      <strong>{record.mechanic_name || "Mechanic entry"}</strong>
                    </div>
                  </div>

                  <div className="dashboard-card__footer">
                    <div>
                      <span>Bill amount</span>
                      <strong>{formatCurrencyInr(record.amount)}</strong>
                    </div>
                    <div>
                      <span>Next service</span>
                      <strong>{formatDisplayDate(record.next_service_date)}</strong>
                    </div>
                  </div>

                  <div className="dashboard-card__actions">
                    <Link className="dashboard-card__edit" to={getAddServiceRoute(record.id)}>
                      Edit Service
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <div className="dashboard-empty">
                <div className="dashboard-empty__badge">No records yet</div>
                <h3>Start by adding a vehicle and then creating its first service record.</h3>
                <p>Service records will appear here with billing details, owner information, and upcoming service dates.</p>
                <Link className="dashboard-empty__button" to={getAddServiceRoute()}>
                  Add First Service
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
