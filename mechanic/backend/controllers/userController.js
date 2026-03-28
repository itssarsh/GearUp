const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { isWorkshopRole } = require("../utils/roles");

function getFrontendBaseUrl() {
  return process.env.FRONTEND_URL?.trim() || "http://localhost:3000";
}

function buildResetLink(user, token) {
  return `${getFrontendBaseUrl()}/workshop/reset-password?token=${token}&email=${encodeURIComponent(
    user.email
  )}`;
}

async function sendEmail(user, token) {
  const resetLink = buildResetLink(user, token);
  const mailUser = process.env.MAIL_USER?.trim();
  const mailPass = process.env.MAIL_PASS?.trim();
  const mailFrom = process.env.MAIL_FROM?.trim() || mailUser;

  console.log("Mechanic password reset link:", resetLink);

  if (!mailUser || !mailPass) {
    console.log("Email config missing. Reset link was logged above.");
    return;
  }

  let nodemailer;

  try {
    nodemailer = require("nodemailer");
  } catch (error) {
    console.log("nodemailer is not installed. Reset link was logged above.");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: mailUser,
      pass: mailPass,
    },
  });

  await transporter.sendMail({
    from: `Vehicle Service App <${mailFrom}>`,
    to: user.email,
    subject: "Reset your mechanic portal password",
    text: `Reset link: ${resetLink}`,
    html: `<p><a href="${resetLink}">Click here to reset your password</a></p>`,
  });
}

function capitalize(str) {
  if (!str) return str;

  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function getCurrentUser(userId) {
  const result = await pool.query(
    "SELECT id, name, email, phone, address, role, created_at FROM users WHERE id = $1",
    [userId]
  );

  return result.rows[0] || null;
}

exports.listUsers = async (req, res) => {
  try {
    const users = await pool.query(
      `
        SELECT id, name, email, phone, address, role, created_at
        FROM users
        WHERE role IN ('mechanic', 'admin')
        ORDER BY id
      `
    );

    res.json(users.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

exports.signup = async (req, res) => {
  try {
    const { name, email, phone, address, password, confirmPassword } = req.body;

    if (!name || !email || !phone || !address || !password || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const userExists = await pool.query(
      "SELECT id FROM users WHERE email = $1 OR phone = $2",
      [email, phone]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedConfirmPassword = await bcrypt.hash(confirmPassword, 10);

    const createdUser = await pool.query(
      `
        INSERT INTO users (name, email, phone, address, password, confirmPassword, role)
        VALUES ($1, $2, $3, $4, $5, $6, 'mechanic')
        RETURNING id, name, email, phone, address, role
      `,
      [name, email, phone, address, hashedPassword, hashedConfirmPassword]
    );

    res.status(201).json(createdUser.rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Signup failed" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const user = result.rows[0];

    if (!isWorkshopRole(user.role)) {
      return res.status(403).json({ error: "Please use the customer login page for this account." });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Login failed" });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await getCurrentUser(req.user.id);

    if (!user || !isWorkshopRole(user.role)) {
      return res.status(403).json({ error: "Mechanic portal access is required" });
    }

    user.name = capitalize(user.name);
    user.address = capitalize(user.address);
    user.role = capitalize(user.role);

    const statsResult = await pool.query(
      `
        SELECT
          (
            SELECT COUNT(*)
            FROM vehicles v
            WHERE
              ($2 = 'admin')
              OR ($2 = 'mechanic' AND v.created_by = $1)
          )::INT AS vehicles_count,
          (
            SELECT COUNT(*)
            FROM service_records sr
            JOIN vehicles v ON v.id = sr.vehicle_id
            WHERE
              ($2 = 'admin')
              OR ($2 = 'mechanic' AND (sr.mechanic_id = $1 OR v.created_by = $1))
          )::INT AS service_records_count
      `,
      [req.user.id, user.role]
    );

    res.json({
      ...user,
      stats: statsResult.rows[0],
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND role IN ('mechanic', 'admin')",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Mechanic account not found" });
    }

    const user = result.rows[0];
    const token = crypto.randomBytes(32).toString("hex");

    await pool.query(
      "UPDATE users SET reset_token = $1, token_expiry = $2 WHERE id = $3",
      [token, Date.now() + 15 * 60 * 1000, user.id]
    );

    await sendEmail(user, token);
    res.json({ message: "Reset link sent" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to send reset link" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND role IN ('mechanic', 'admin')",
      [email]
    );

    if (result.rows.length === 0 || result.rows[0].reset_token !== token) {
      return res.status(400).json({ message: "Invalid token" });
    }

    if (Date.now() > result.rows[0].token_expiry) {
      return res.status(400).json({ message: "Token expired" });
    }

    if (typeof newPassword !== "string" || newPassword.trim() === "") {
      return res.status(400).json({ message: "New password is required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      "UPDATE users SET password = $1, reset_token = NULL, token_expiry = NULL WHERE id = $2",
      [hashedPassword, result.rows[0].id]
    );

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to reset password" });
  }
};

exports.logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
