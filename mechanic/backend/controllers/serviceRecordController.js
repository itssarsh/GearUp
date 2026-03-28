const pool = require("../config/db");
const { isWorkshopRole, normalizeRole } = require("../utils/roles");

const allowedStatuses = new Set(["pending", "in_progress", "completed", "delivered"]);

async function getCurrentUser(userId) {
  const result = await pool.query(
    "SELECT id, name, phone, role FROM users WHERE id = $1",
    [userId]
  );

  return result.rows[0] || null;
}

function parseServiceRecordInput(body) {
  const {
    vehicleId,
    serviceType,
    complaint,
    workSummary,
    status,
    amount,
    kmReading,
    serviceDate,
    nextServiceDate,
  } = body;

  const trimmedServiceType = serviceType?.trim();
  const trimmedComplaint = complaint?.trim();
  const trimmedWorkSummary = workSummary?.trim();
  const normalizedStatus = status?.trim().toLowerCase();
  const normalizedAmount = Number(amount);
  const normalizedKmReading = Number(kmReading);
  const isBillingRequired = normalizedStatus === "completed" || normalizedStatus === "delivered";
  const hasAmount = amount !== undefined && amount !== null && String(amount).trim() !== "";
  const hasKmReading =
    kmReading !== undefined && kmReading !== null && String(kmReading).trim() !== "";

  return {
    vehicleId,
    trimmedServiceType,
    trimmedComplaint,
    trimmedWorkSummary,
    normalizedStatus,
    normalizedAmount,
    normalizedKmReading,
    serviceDate,
    nextServiceDate,
    hasAmount,
    hasKmReading,
    isBillingRequired,
  };
}

function validateServiceRecordInput(input) {
  if (!input.vehicleId || !input.trimmedServiceType || !input.normalizedStatus) {
    return "Required fields are missing";
  }

  if (!allowedStatuses.has(input.normalizedStatus)) {
    return "Invalid status";
  }

  if (
    input.isBillingRequired &&
    (!input.hasAmount || !input.hasKmReading || !input.serviceDate || !input.nextServiceDate)
  ) {
    return "Completed or delivered records require billing and schedule details";
  }

  if (
    (input.hasAmount && Number.isNaN(input.normalizedAmount)) ||
    (input.hasKmReading && Number.isNaN(input.normalizedKmReading))
  ) {
    return "Amount and KM reading must be valid numbers";
  }

  return null;
}

exports.createServiceRecord = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req.user.id);

    if (!currentUser || !isWorkshopRole(currentUser.role)) {
      return res.status(403).json({ error: "Mechanic portal access is required" });
    }

    const parsedInput = parseServiceRecordInput(req.body);
    const validationError = validateServiceRecordInput(parsedInput);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const vehicleResult = await pool.query(
      "SELECT id, created_by FROM vehicles WHERE id = $1",
      [parsedInput.vehicleId]
    );

    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    if (
      normalizeRole(currentUser.role) === "mechanic" &&
      vehicleResult.rows[0].created_by !== req.user.id
    ) {
      return res.status(403).json({ error: "You can add records only for your vehicles" });
    }

    const recordResult = await pool.query(
      `
        INSERT INTO service_records (
          vehicle_id,
          mechanic_id,
          service_type,
          complaint,
          work_summary,
          status,
          amount,
          km_reading,
          service_date,
          next_service_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, CURRENT_DATE), $10)
        RETURNING *
      `,
      [
        parsedInput.vehicleId,
        req.user.id,
        parsedInput.trimmedServiceType,
        parsedInput.trimmedComplaint || null,
        parsedInput.trimmedWorkSummary || null,
        parsedInput.normalizedStatus,
        parsedInput.hasAmount ? parsedInput.normalizedAmount : 0,
        parsedInput.hasKmReading ? parsedInput.normalizedKmReading : null,
        parsedInput.serviceDate || null,
        parsedInput.nextServiceDate || null,
      ]
    );

    res.status(201).json(recordResult.rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to create service record" });
  }
};

exports.getServiceRecordById = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req.user.id);

    if (!currentUser || !isWorkshopRole(currentUser.role)) {
      return res.status(403).json({ error: "Mechanic portal access is required" });
    }

    const result = await pool.query(
      `
        SELECT
          sr.*,
          v.registration_number,
          v.vehicle_type,
          v.brand,
          v.model,
          v.owner_name,
          v.owner_phone,
          mechanic.name AS mechanic_name
        FROM service_records sr
        JOIN vehicles v ON v.id = sr.vehicle_id
        LEFT JOIN users mechanic ON mechanic.id = sr.mechanic_id
        WHERE
          sr.id = $1
          AND (
            ($2 = 'admin')
            OR ($2 = 'mechanic' AND (sr.mechanic_id = $3 OR v.created_by = $3))
          )
      `,
      [req.params.id, currentUser.role, currentUser.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Service record not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to fetch service record" });
  }
};

exports.updateServiceRecord = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req.user.id);

    if (!currentUser || !isWorkshopRole(currentUser.role)) {
      return res.status(403).json({ error: "Mechanic portal access is required" });
    }

    const parsedInput = parseServiceRecordInput(req.body);
    const validationError = validateServiceRecordInput(parsedInput);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const existingResult = await pool.query(
      `
        SELECT sr.*, v.created_by
        FROM service_records sr
        JOIN vehicles v ON v.id = sr.vehicle_id
        WHERE
          sr.id = $1
          AND (
            ($2 = 'admin')
            OR ($2 = 'mechanic' AND (sr.mechanic_id = $3 OR v.created_by = $3))
          )
      `,
      [req.params.id, currentUser.role, currentUser.id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: "Service record not found" });
    }

    const vehicleResult = await pool.query(
      "SELECT id, created_by FROM vehicles WHERE id = $1",
      [parsedInput.vehicleId]
    );

    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    if (
      normalizeRole(currentUser.role) === "mechanic" &&
      vehicleResult.rows[0].created_by !== req.user.id
    ) {
      return res.status(403).json({ error: "You can update records only for your vehicles" });
    }

    const updatedRecord = await pool.query(
      `
        UPDATE service_records
        SET
          vehicle_id = $1,
          mechanic_id = $2,
          service_type = $3,
          complaint = $4,
          work_summary = $5,
          status = $6,
          amount = $7,
          km_reading = $8,
          service_date = $9,
          next_service_date = $10
        WHERE id = $11
        RETURNING *
      `,
      [
        parsedInput.vehicleId,
        existingResult.rows[0].mechanic_id,
        parsedInput.trimmedServiceType,
        parsedInput.trimmedComplaint || null,
        parsedInput.trimmedWorkSummary || null,
        parsedInput.normalizedStatus,
        parsedInput.hasAmount ? parsedInput.normalizedAmount : 0,
        parsedInput.hasKmReading ? parsedInput.normalizedKmReading : null,
        parsedInput.serviceDate || null,
        parsedInput.nextServiceDate || null,
        req.params.id,
      ]
    );

    res.json(updatedRecord.rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to update service record" });
  }
};

exports.listServiceRecords = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req.user.id);

    if (!currentUser || !isWorkshopRole(currentUser.role)) {
      return res.status(403).json({ error: "Mechanic portal access is required" });
    }

    const records = await pool.query(
      `
        SELECT
          sr.*,
          v.registration_number,
          v.vehicle_type,
          v.brand,
          v.model,
          v.owner_name,
          v.owner_phone,
          mechanic.name AS mechanic_name
        FROM service_records sr
        JOIN vehicles v ON v.id = sr.vehicle_id
        LEFT JOIN users mechanic ON mechanic.id = sr.mechanic_id
        WHERE
          ($2 = 'admin')
          OR ($2 = 'mechanic' AND (sr.mechanic_id = $1 OR v.created_by = $1))
        ORDER BY sr.service_date DESC NULLS LAST, sr.id DESC
      `,
      [currentUser.id, currentUser.role]
    );

    res.json(records.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to fetch service records" });
  }
};
