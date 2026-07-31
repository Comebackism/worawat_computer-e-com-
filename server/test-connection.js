const pool = require('./db');

async function testConnection() {
  try {
    const res = await pool.query('SELECT 1 AS ok');
    console.log('Connection successful:', res.rows[0]);
  } catch (err) {
    console.error('Connection failed:', err);
  } finally {
    pool.end();
  }
}

testConnection();
