const pool = require('./db');

async function migrate() {
  console.log("Migrating orders table...");
  try {
    await pool.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS shipping_address TEXT,
      ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
      ADD COLUMN IF NOT EXISTS payment_slip VARCHAR(255);
    `);
    console.log("Migration successful: Added shipping_address, payment_method, payment_slip to orders table.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    pool.end();
  }
}

migrate();
