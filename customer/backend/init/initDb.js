const pool = require("../config/db");

async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone VARCHAR(15) UNIQUE NOT NULL,
        address TEXT,
        password TEXT NOT NULL,
        confirmPassword TEXT NOT NULL,
        role TEXT DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS address TEXT,
      ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer',
      ADD COLUMN IF NOT EXISTS confirmPassword TEXT
    `);

    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS reset_token TEXT,
      ADD COLUMN IF NOT EXISTS token_expiry BIGINT
    `);

    await pool.query(`
      ALTER TABLE users
      DROP CONSTRAINT IF EXISTS users_role_check
    `);

    await pool.query(`
      UPDATE users
      SET role = 'customer'
      WHERE role IS NULL OR role = 'user'
    `);

    await pool.query(`
      ALTER TABLE users
      ADD CONSTRAINT users_role_check
      CHECK (role IN ('customer', 'mechanic', 'admin'))
    `).catch(() => null);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        registration_number VARCHAR(30) UNIQUE NOT NULL,
        vehicle_type TEXT NOT NULL,
        brand VARCHAR(80) NOT NULL,
        model VARCHAR(80) NOT NULL,
        manufacture_year INT,
        owner_name VARCHAR(120) NOT NULL,
        owner_phone VARCHAR(15) NOT NULL,
        owner_user_id INT REFERENCES users(id) ON DELETE SET NULL,
        created_by INT REFERENCES users(id) ON DELETE SET NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      ALTER TABLE vehicles
      ADD COLUMN IF NOT EXISTS registration_number VARCHAR(30),
      ADD COLUMN IF NOT EXISTS vehicle_type TEXT,
      ADD COLUMN IF NOT EXISTS brand VARCHAR(80),
      ADD COLUMN IF NOT EXISTS model VARCHAR(80),
      ADD COLUMN IF NOT EXISTS manufacture_year INT,
      ADD COLUMN IF NOT EXISTS owner_name VARCHAR(120),
      ADD COLUMN IF NOT EXISTS owner_phone VARCHAR(15),
      ADD COLUMN IF NOT EXISTS owner_user_id INT REFERENCES users(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS created_by INT REFERENCES users(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS notes TEXT,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS service_records (
        id SERIAL PRIMARY KEY,
        vehicle_id INT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        mechanic_id INT REFERENCES users(id) ON DELETE SET NULL,
        service_type VARCHAR(120) NOT NULL,
        complaint TEXT,
        work_summary TEXT,
        status TEXT DEFAULT 'pending',
        amount NUMERIC(10, 2) DEFAULT 0,
        km_reading INT,
        service_date DATE DEFAULT CURRENT_DATE,
        next_service_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      ALTER TABLE service_records
      ADD COLUMN IF NOT EXISTS vehicle_id INT REFERENCES vehicles(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS mechanic_id INT REFERENCES users(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS service_type VARCHAR(120),
      ADD COLUMN IF NOT EXISTS complaint TEXT,
      ADD COLUMN IF NOT EXISTS work_summary TEXT,
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS amount NUMERIC(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS km_reading INT,
      ADD COLUMN IF NOT EXISTS service_date DATE DEFAULT CURRENT_DATE,
      ADD COLUMN IF NOT EXISTS next_service_date DATE,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);

    await pool.query(`
      ALTER TABLE service_records
      ALTER COLUMN complaint DROP NOT NULL
    `).catch(() => null);

    await pool.query(`
      ALTER TABLE service_records
      DROP CONSTRAINT IF EXISTS service_records_status_check
    `);

    await pool.query(`
      ALTER TABLE service_records
      ADD CONSTRAINT service_records_status_check
      CHECK (status IN ('pending', 'in_progress', 'completed', 'delivered'))
    `).catch(() => null);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_vehicles_owner_phone
      ON vehicles(owner_phone)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_service_records_vehicle_id
      ON service_records(vehicle_id)
    `);

    console.log("Vehicle service database initialized");
  } catch (err) {
    console.error("DB Init Error:", err.message);
  }
}

module.exports = initializeDatabase;
