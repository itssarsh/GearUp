import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../../../components/ToastProvider";
import API from "../services/api";
import {
  clearSession,
  getAddVehicleRoute,
  getLoginRoute,
  getProfileRoute,
  getStoredToken,
} from "../utils/session";
import {
  formatCurrencyInr,
  formatDisplayDate,
  formatStatusLabel,
  formatVehicleTypeLabel,
  getDateValue,
} from "../../../utils/formatters";
import "../../../pages/Dashboard.css";

export default function CustomerDashboardPage() {
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

  const totalRevenue = serviceRecords.reduce(
    (sum, record) => sum + Number(record.amount || 0),
    0
  );
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueSoonThreshold = new Date(today);
  dueSoonThreshold.setDate(dueSoonThreshold.getDate() + 7);

  const vehicleSummaries = vehicles.map((vehicle) => {
    const relatedRecords = serviceRecords.filter(
      (record) => String(record.vehicle_id) === String(vehicle.id)
    );
    const latestRecord = relatedRecords[0];
    const nextServiceDateValue = getDateValue(latestRecord?.next_service_date);
    const latestStatus = latestRecord?.status || "not_started";

    let healthTone = "attention";
    let healthLabel = "Needs first service";
    let healthDescription = "No service history yet";
    let healthPriority = 4;

    if (latestStatus === "pending" || latestStatus === "in_progress") {
      healthTone = "active";
      healthLabel = latestStatus === "in_progress" ? "In service" : "Service pending";
      healthDescription = "Workshop update is still in progress";
      healthPriority = 3;
    } else if (nextServiceDateValue && nextServiceDateValue < today) {
      healthTone = "overdue";
      healthLabel = "Overdue";
      healthDescription = "Next scheduled service date has passed";
      healthPriority = 1;
    } else if (nextServiceDateValue && nextServiceDateValue <= dueSoonThreshold) {
      healthTone = "due-soon";
      healthLabel = "Due soon";
      healthDescription = "Service is due within the next 7 days";
      healthPriority = 2;
    } else if (latestRecord) {
      healthTone = "healthy";
      healthLabel = "Healthy";
      healthDescription = nextServiceDateValue
        ? "No immediate service due right now"
        : "Latest service update looks clear";
      healthPriority = 5;
    }

    return {
      ...vehicle,
      serviceCount: relatedRecords.length,
      lastServiceDate: latestRecord?.service_date || null,
      nextServiceDate: latestRecord?.next_service_date || null,
      latestStatus,
      latestServiceType: latestRecord?.service_type || "No service yet",
      latestComplaint: latestRecord?.complaint || null,
      latestAmount: latestRecord?.amount || 0,
      healthTone,
      healthLabel,
      healthDescription,
      healthPriority,
    };
  }).sort((firstVehicle, secondVehicle) => {
    if (firstVehicle.healthPriority !== secondVehicle.healthPriority) {
      return firstVehicle.healthPriority - secondVehicle.healthPriority;
    }

    return new Date(secondVehicle.created_at) - new Date(firstVehicle.created_at);
  });

  const healthyVehicles = vehicleSummaries.filter((vehicle) => vehicle.healthTone === "healthy").length;
  const dueSoonVehicles = vehicleSummaries.filter((vehicle) => vehicle.healthTone === "due-soon").length;
  const overdueVehicles = vehicleSummaries.filter((vehicle) => vehicle.healthTone === "overdue").length;
  const activeServiceVehicles = vehicleSummaries.filter((vehicle) => vehicle.healthTone === "active").length;
  const vehiclesWithoutHistory = vehicleSummaries.filter((vehicle) => vehicle.serviceCount === 0).length;
  const nextDueVehicle =
    vehicleSummaries
      .filter((vehicle) => vehicle.nextServiceDate)
      .sort(
        (firstVehicle, secondVehicle) =>
          getDateValue(firstVehicle.nextServiceDate) - getDateValue(secondVehicle.nextServiceDate)
      )[0] || null;
  const latestServicedVehicle =
    vehicleSummaries
      .filter((vehicle) => vehicle.lastServiceDate)
      .sort(
        (firstVehicle, secondVehicle) =>
          getDateValue(secondVehicle.lastServiceDate) - getDateValue(firstVehicle.lastServiceDate)
      )[0] || null;
  const fleetHealthScore = vehicles.length
    ? Math.round(
        ((healthyVehicles * 100) +
          (dueSoonVehicles * 75) +
          (activeServiceVehicles * 65) +
          (vehiclesWithoutHistory * 55) +
          (overdueVehicles * 30)) /
          vehicles.length
      )
    : 0;

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
            <p className="dashboard-hero__eyebrow">Customer service view</p>
            <h1>Track your vehicles, service updates, and next maintenance at a glance.</h1>
            <p className="dashboard-hero__description">
              Keep an eye on your registered vehicles, recent service activity,
              and upcoming service dates from one clean dashboard.
            </p>

            <div className="dashboard-hero__highlights">
              <article className="dashboard-highlight">
                <span>My vehicles</span>
                <strong>{vehicles.length}</strong>
              </article>
              <article className="dashboard-highlight">
                <span>Service updates</span>
                <strong>{serviceRecords.length}</strong>
              </article>
              <article className="dashboard-highlight">
                <span>Next services due</span>
                <strong>{vehicleSummaries.filter((vehicle) => vehicle.nextServiceDate).length}</strong>
              </article>
            </div>

            <div className="dashboard-hero__actions">
              <div className="dashboard-hero__buttons">
                <Link className="dashboard-hero__button" to={getAddVehicleRoute()}>
                  Add Vehicle
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
            <div className="dashboard-hero__panel-label">Vehicle Health Snapshot</div>
            <div className="dashboard-hero__stats">
              <article className="dashboard-stat">
                <span>Fleet health score</span>
                <strong>{`${fleetHealthScore}%`}</strong>
              </article>
              <article className="dashboard-stat">
                <span>Total service value</span>
                <strong>{formatCurrencyInr(totalRevenue)}</strong>
              </article>
              <article className="dashboard-stat">
                <span>Vehicles due next</span>
                <strong>{nextDueVehicle ? nextDueVehicle.registration_number : "No due date"}</strong>
              </article>
            </div>
            <div className="dashboard-hero__foot">
              <span>Welcome</span>
              <strong>{user?.name || "Customer"}</strong>
            </div>
          </div>
        </header>

        <section className="dashboard-section dashboard-section--summary">
          <div className="dashboard-section__header">
            <div>
              <p className="dashboard-section__eyebrow">Vehicle Health</p>
              <h2>Overall vehicle health summary</h2>
              <span>See overdue services, due-soon reminders, and vehicles waiting for their first service record.</span>
            </div>
          </div>

          <div className="dashboard-health-grid">
            {[
              { label: "Healthy vehicles", value: healthyVehicles, tone: "healthy" },
              { label: "Due soon", value: dueSoonVehicles, tone: "due-soon" },
              { label: "Overdue", value: overdueVehicles, tone: "overdue" },
              { label: "In service", value: activeServiceVehicles, tone: "active" },
              { label: "No history", value: vehiclesWithoutHistory, tone: "attention" },
            ].map((item) => (
              <article
                className={`dashboard-health-card dashboard-health-card--${item.tone}`}
                key={item.label}
              >
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>

          <div className="dashboard-customer-overview">
            <article className="dashboard-overview-card">
              <p className="dashboard-card__tag">Latest Service</p>
              <h3>
                {latestServicedVehicle
                  ? `${latestServicedVehicle.brand} ${latestServicedVehicle.model}`
                  : "No recent service yet"}
              </h3>
              <p>
                {latestServicedVehicle
                  ? `${latestServicedVehicle.registration_number} was last serviced on ${formatDisplayDate(
                      latestServicedVehicle.lastServiceDate
                    )}.`
                  : "Once a service record is added, the latest service update will appear here."}
              </p>
            </article>

            <article className="dashboard-overview-card">
              <p className="dashboard-card__tag">Next Due Service</p>
              <h3>
                {nextDueVehicle
                  ? `${nextDueVehicle.brand} ${nextDueVehicle.model}`
                  : "No next due service scheduled"}
              </h3>
              <p>
                {nextDueVehicle
                  ? `${nextDueVehicle.registration_number} is due on ${formatDisplayDate(
                      nextDueVehicle.nextServiceDate
                    )}.`
                  : "Upcoming service dates will show here after the latest service record includes a next due date."}
              </p>
            </article>
          </div>
        </section>

        <section className="dashboard-section dashboard-section--vehicles">
          <div className="dashboard-section__header">
            <div>
              <p className="dashboard-section__eyebrow">My Vehicles</p>
              <h2>Apni sab vehicles list + details</h2>
              <span>Har vehicle ke saath registration, service status, last service, next due service, aur overall health dekh sakte ho.</span>
            </div>
          </div>

          <div className="dashboard-grid">
            {vehicleSummaries.length > 0 ? (
              vehicleSummaries.map((vehicle) => (
                <article className="dashboard-card dashboard-card--vehicle" key={vehicle.id}>
                  <div className="dashboard-card__top">
                    <div className="dashboard-card__icon">
                      {vehicle.model?.charAt(0)?.toUpperCase() || ""}
                    </div>
                    <span className={`dashboard-card__pill dashboard-card__pill--${vehicle.healthTone}`}>
                      {vehicle.healthLabel}
                    </span>
                  </div>

                  <div className="dashboard-card__top dashboard-card__top--compact">
                    <span className="dashboard-card__pill">
                      {formatVehicleTypeLabel(vehicle.vehicle_type)}
                    </span>
                    <span className="dashboard-card__subpill">
                      {vehicle.manufacture_year || "Year not set"}
                    </span>
                  </div>

                  <div className="dashboard-card__content">
                    <h3>{vehicle.brand} {vehicle.model}</h3>
                    <p>{vehicle.registration_number}</p>
                    <p>{vehicle.healthDescription}</p>
                  </div>

                  <div className="dashboard-vehicle-card__stats">
                    <div className="dashboard-vehicle-card__stat">
                      <span>Last service</span>
                      <strong>{formatDisplayDate(vehicle.lastServiceDate)}</strong>
                    </div>
                    <div className="dashboard-vehicle-card__stat">
                      <span>Next due service</span>
                      <strong>{formatDisplayDate(vehicle.nextServiceDate)}</strong>
                    </div>
                  </div>

                  <div className="dashboard-card__meta">
                    <div>
                      <span>Current status</span>
                      <strong>{formatStatusLabel(vehicle.latestStatus)}</strong>
                    </div>
                    <div>
                      <span>Last service type</span>
                      <strong>{vehicle.latestServiceType}</strong>
                    </div>
                  </div>

                  <div className="dashboard-card__footer">
                    <div>
                      <span>Last bill amount</span>
                      <strong>{formatCurrencyInr(vehicle.latestAmount)}</strong>
                    </div>
                    <div>
                      <span>Latest complaint</span>
                      <strong>{vehicle.latestComplaint || "No complaint noted"}</strong>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="dashboard-empty">
                <div className="dashboard-empty__badge">No vehicles registered</div>
                <h3>Add your first vehicle to start tracking service history.</h3>
                <p>Once a vehicle is registered, you will see it here with its full service summary.</p>
                <Link className="dashboard-empty__button" to={getAddVehicleRoute()}>
                  Register first vehicle
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="dashboard-section">
          <div className="dashboard-section__header">
            <div>
              <p className="dashboard-section__eyebrow">Service History</p>
              <h2>Recent updates for your vehicles</h2>
              <span>Review the latest service updates linked to your vehicles.</span>
            </div>
            <Link className="dashboard-section__link" to={getAddVehicleRoute()}>
              Register Another Vehicle
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
                      <span>Last service date</span>
                      <strong>{formatDisplayDate(record.service_date)}</strong>
                    </div>
                    <div>
                      <span>Current status</span>
                      <strong>{formatStatusLabel(record.status)}</strong>
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
                </article>
              ))
            ) : (
              <div className="dashboard-empty">
                <div className="dashboard-empty__badge">No records yet</div>
                <h3>Start by adding a vehicle and then wait for its first service update.</h3>
                <p>Service records will appear here with billing details, job status, and upcoming service dates.</p>
                <Link className="dashboard-empty__button" to={getAddVehicleRoute()}>
                  Add First Vehicle
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
