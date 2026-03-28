import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import API from "../services/api";
import { useToast } from "../../../components/ToastProvider";
import {
  getAddServiceRoute,
  getDashboardRoute,
  getLoginRoute,
  getStoredToken,
} from "../utils/session";
import { formatStatusLabel } from "../../../utils/formatters";
import "../../../pages/AddProduct.css";

export default function MechanicAddServiceRecordPage() {
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState({
    vehicleId: "",
    serviceType: "",
    complaint: "",
    workSummary: "",
    status: "pending",
    amount: "",
    kmReading: "",
    serviceDate: "",
    nextServiceDate: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingRecord, setIsLoadingRecord] = useState(false);
  const navigate = useNavigate();
  const { recordId } = useParams();
  const isEditing = Boolean(recordId);
  const toast = useToast();
  const isBillingRequired = form.status === "completed" || form.status === "delivered";
  const selectedVehicle =
    vehicles.find((vehicle) => String(vehicle.id) === form.vehicleId) || null;
  const requiredFieldTarget = isBillingRequired ? 7 : 3;
  const serviceFieldsCompleted = [
    form.vehicleId,
    form.serviceType,
    form.status,
    ...(isBillingRequired
      ? [form.amount, form.kmReading, form.serviceDate, form.nextServiceDate]
      : []),
  ].filter((value) => String(value).trim()).length;

  useEffect(() => {
    if (!getStoredToken()) {
      navigate(getLoginRoute(), { replace: true });
      return;
    }

    const loadForm = async () => {
      setIsLoadingRecord(isEditing);

      try {
        const requests = [API.get("/vehicles")];

        if (isEditing) {
          requests.push(API.get(`/service-records/${recordId}`));
        }

        const [vehiclesResponse, recordResponse] = await Promise.all(requests);
        setVehicles(vehiclesResponse.data);

        if (recordResponse) {
          const record = recordResponse.data;
          setForm({
            vehicleId: String(record.vehicle_id ?? ""),
            serviceType: record.service_type ?? "",
            complaint: record.complaint ?? "",
            workSummary: record.work_summary ?? "",
            status: record.status ?? "pending",
            amount: record.amount !== null && record.amount !== undefined ? String(record.amount) : "",
            kmReading:
              record.km_reading !== null && record.km_reading !== undefined
                ? String(record.km_reading)
                : "",
            serviceDate: record.service_date ? String(record.service_date).slice(0, 10) : "",
            nextServiceDate:
              record.next_service_date ? String(record.next_service_date).slice(0, 10) : "",
          });
        }
      } catch (error) {
        toast.error(
          error.response?.data?.error ||
            (isEditing ? "Failed to load service record" : "Failed to load vehicles")
        );

        if (isEditing) {
          navigate(getDashboardRoute(), { replace: true });
        }
      } finally {
        setIsLoadingRecord(false);
      }
    };

    loadForm();
  }, [isEditing, navigate, recordId, toast]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previousForm) => ({ ...previousForm, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.vehicleId || !form.serviceType.trim() || !form.status.trim()) {
      toast.error("Vehicle, service type, and status are required.");
      return;
    }

    if (
      isBillingRequired &&
      (!String(form.amount).trim() ||
        !String(form.kmReading).trim() ||
        !form.serviceDate ||
        !form.nextServiceDate)
    ) {
      toast.error("Completed or delivered records require billing and schedule details.");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        ...form,
        vehicleId: Number(form.vehicleId),
        amount: form.amount ? Number(form.amount) : 0,
        kmReading: form.kmReading ? Number(form.kmReading) : null,
      };

      if (isEditing) {
        await API.put(`/service-records/${recordId}`, payload);
      } else {
        await API.post("/service-records", payload);
      }

      toast.success(
        isEditing
          ? "Service record updated successfully"
          : "Service record saved successfully"
      );
      navigate(getDashboardRoute(), { replace: true });
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
          (isEditing ? "Failed to update service record" : "Failed to save service record")
      );
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
            <span className="add-product-hero__badge">
              {isEditing ? "Service Update" : "Service Entry"}
            </span>
          </div>

          <div className="add-product-hero__heading">
            <h1>{isEditing ? "Edit service record" : "Add a service record"}</h1>
            <p>
              {isEditing
                ? "Update service details, billing, and next due schedule from one clean screen."
                : "Capture billing, scheduling, and complaint details in one clean entry."}
            </p>
          </div>

          <div className="add-product-hero__meta">
            <article className="add-product-hero__meta-card add-product-hero__meta-card--wide">
              <span>Current service context</span>
              <strong>
                {selectedVehicle
                  ? `${selectedVehicle.registration_number} · ${selectedVehicle.brand} ${selectedVehicle.model}`
                  : "Select a vehicle to see live context"}
              </strong>
            </article>
            <article className="add-product-hero__meta-card">
              <span>Vehicles available</span>
              <strong>{vehicles.length}</strong>
            </article>
            <article className="add-product-hero__meta-card">
              <span>Core fields</span>
              <strong>{serviceFieldsCompleted}/{requiredFieldTarget} completed</strong>
            </article>
            <article className="add-product-hero__meta-card">
              <span>Status</span>
              <strong>{formatStatusLabel(form.status, "Not set")}</strong>
            </article>
            <article className="add-product-hero__meta-card">
              <span>Bill estimate</span>
              <strong>{form.amount ? `Rs. ${form.amount}` : "Not added"}</strong>
            </article>
          </div>

          <div className="add-product-hero__highlights">
            <div>
              <strong>Service flow</strong>
              <span>Completed and delivered records need billing and schedule details.</span>
            </div>
            <div>
              <strong>Edit route</strong>
              <span>{isEditing ? getAddServiceRoute(recordId) : getAddServiceRoute()}</span>
            </div>
          </div>
        </div>

        <form className="add-product-card" onSubmit={handleSubmit}>
          <div className="add-product-card__header">
            <p className="add-product-card__eyebrow">
              {isEditing ? "Edit Service Record" : "New Service Record"}
            </p>
            <h2>{isEditing ? "Update service entry" : "Add service entry"}</h2>
            <span>
              {isEditing
                ? "Review the current record and update its service details."
                : "Select a vehicle and store its service details."}
            </span>
          </div>

          {isLoadingRecord ? (
            <div className="dashboard-empty">
              <div className="dashboard-empty__badge">Loading record</div>
              <h3>Preparing service form...</h3>
            </div>
          ) : (
            <div className="add-product-card__section">
              <div className="add-product-card__grid">
                <label className="add-product-card__field add-product-card__field--span-2">
                  <span>Select Vehicle</span>
                  <select name="vehicleId" value={form.vehicleId} onChange={handleChange} required>
                    <option value="">Choose a vehicle</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.registration_number} - {vehicle.brand} {vehicle.model}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="add-product-card__field">
                  <span>Service Type</span>
                  <input
                    name="serviceType"
                    placeholder="General service / Engine repair / Oil change"
                    value={form.serviceType}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label className="add-product-card__field">
                  <span>Status</span>
                  <select name="status" value={form.status} onChange={handleChange} required>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </label>

                <label className="add-product-card__field add-product-card__field--span-2">
                  <div className="add-product-card__field-label">
                    <span className="add-product-card__field-label-title">Complaint</span>
                    <span className="add-product-card__field-badge">Optional</span>
                  </div>
                  <textarea
                    name="complaint"
                    placeholder="Describe the customer complaint"
                    value={form.complaint}
                    onChange={handleChange}
                  />
                </label>

                <label className="add-product-card__field add-product-card__field--span-2">
                  <div className="add-product-card__field-label">
                    <span className="add-product-card__field-label-title">Work Summary</span>
                    <span className="add-product-card__field-badge">Optional</span>
                  </div>
                  <textarea
                    name="workSummary"
                    placeholder="Describe the work completed"
                    value={form.workSummary}
                    onChange={handleChange}
                  />
                </label>

                <label className="add-product-card__field">
                  <span>Bill Amount</span>
                  <input name="amount" type="number" value={form.amount} onChange={handleChange} />
                </label>

                <label className="add-product-card__field">
                  <span>KM Reading</span>
                  <input name="kmReading" type="number" value={form.kmReading} onChange={handleChange} />
                </label>

                <label className="add-product-card__field">
                  <span>Service Date</span>
                  <input name="serviceDate" type="date" value={form.serviceDate} onChange={handleChange} />
                </label>

                <label className="add-product-card__field">
                  <span>Next Service Date</span>
                  <input
                    name="nextServiceDate"
                    type="date"
                    value={form.nextServiceDate}
                    onChange={handleChange}
                  />
                </label>
              </div>
            </div>
          )}

          <button className="add-product-card__button" type="submit" disabled={isSaving || isLoadingRecord}>
            {isSaving ? "Saving..." : isEditing ? "Update service record" : "Save service record"}
          </button>
        </form>
      </div>
    </section>
  );
}
