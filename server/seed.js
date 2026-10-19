const crypto = require('node:crypto');
const pool = require('./db');

// Passwords are stored as scrypt hashes (salt:hash), never as plain text.
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `${salt}:${crypto.scryptSync(String(password), salt, 32).toString('hex')}`;
}

async function seedDatabase() {
  console.log("Seeding database...");

  try {
    // Drop existing tables if they exist to start fresh during seeding
    await pool.query(`
      DROP TABLE IF EXISTS order_history CASCADE;
      DROP TABLE IF EXISTS orders_items CASCADE;
      DROP TABLE IF EXISTS orders CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    // Create Users Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'customer',
        phone VARCHAR(50),
        dob DATE,
        total_spent NUMERIC(10, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Products Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        brand VARCHAR(100),
        price NUMERIC(10, 2),
        category VARCHAR(100),
        memory VARCHAR(100),
        description TEXT,
        image VARCHAR(255),
        stock INT,
        specs TEXT[]
      );
    `);

    // Create Orders Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        customer_id INT REFERENCES users(id),
        order_date DATE,
        status VARCHAR(50),
        total NUMERIC(10, 2)
      );
    `);

    // Create Orders Items Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders_items (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
        product_id INT REFERENCES products(id),
        quantity INT,
        price NUMERIC(10, 2)
      );
    `);

    // Create Order History Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_history (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert Users (merged with Customers)
    const adminPassword = String(process.env.ADMIN_PASSWORD || '').trim() || crypto.randomBytes(12).toString('base64url');
    const adminEmail = String(process.env.ADMIN_EMAIL || 'admin@worawat.com').trim().toLowerCase();
    const mockUsers = [
      { first_name: 'Admin', last_name: 'User', email: adminEmail, password: adminPassword, phone: '0812345678', dob: '1990-01-01', role: 'admin' },
      { first_name: 'John', last_name: 'Doe', email: 'john.doe@example.com', password: 'password123', phone: '0899999991', dob: '1992-05-15', role: 'customer' },
      { first_name: 'Alice', last_name: 'Smith', email: 'alice.smith@example.com', password: 'password123', phone: '0899999992', dob: '1988-11-20', role: 'customer' },
      { first_name: 'Bob', last_name: 'Johnson', email: 'bob.johnson@example.com', password: 'password123', phone: '0899999993', dob: '1995-02-10', role: 'customer' },
      { first_name: 'Emma', last_name: 'Wilson', email: 'emma.wilson@example.com', password: 'password123', phone: '0899999994', dob: '1991-08-05', role: 'customer' },
      { first_name: 'Sarah', last_name: 'Connor', email: 'sarah.connor@example.com', password: 'password123', phone: '0899999995', dob: '1985-12-30', role: 'customer' }
    ];
    for (const u of mockUsers) {
      await pool.query(
        'INSERT INTO users (first_name, last_name, email, password, phone, dob, role) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [u.first_name, u.last_name, u.email, hashPassword(u.password), u.phone, u.dob, u.role]
      );
    }

    // Insert Products
    const products = [
      { name: 'NVIDIA GeForce RTX 4090', brand: 'NVIDIA', price: 65900, category: 'GPU', memory: '24GB GDDR6X', description: 'The ultimate GeForce GPU.', image: '/images/gpu.png', stock: 20, specs: ['24GB GDDR6X', '16384 CUDA Cores', '384-bit Memory Interface'] },
      { name: 'AMD Radeon RX 7900 XTX', brand: 'AMD', price: 38900, category: 'GPU', memory: '24GB GDDR6', description: 'Experience unprecedented performance.', image: '/images/gpu.png', stock: 15, specs: ['24GB GDDR6', '6144 Stream Processors', '384-bit Memory Interface'] },
      { name: 'AMD Ryzen 9 7950X', brand: 'AMD', price: 24900, category: 'CPU', memory: 'N/A', description: 'The ultimate processor for gaming and creating.', image: '/images/cpu.png', stock: 30, specs: ['16 Cores / 32 Threads', '5.7 GHz Max Boost', 'Socket AM5'] },
      { name: 'Intel Core i9-14900K', brand: 'Intel', price: 23900, category: 'CPU', memory: 'N/A', description: '24 cores and 32 threads.', image: '/images/cpu.png', stock: 25, specs: ['24 Cores / 32 Threads', '6.0 GHz Max Turbo', 'LGA 1700'] },
      { name: 'Corsair Dominator Titanium 64GB', brand: 'Corsair', price: 12500, category: 'RAM', memory: '64GB (2x32GB)', description: 'Push your system to the limit.', image: '/images/ram.png', stock: 10, specs: ['64GB (2x32GB)', 'DDR5 6000MHz', 'CL30'] }
    ];
    for (const p of products) {
      await pool.query(
        'INSERT INTO products (name, brand, price, category, memory, description, image, stock, specs) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [p.name, p.brand, p.price, p.category, p.memory, p.description, p.image, p.stock, p.specs]
      );
    }

    // Insert Orders and Order Items
    const orders = [
      { id: 'ORD-2026-001', customer_email: 'john.doe@example.com', order_date: '2026-07-01', status: 'Delivered', total: 90800, items: [{ product_id: 1, quantity: 1, price: 65900 }, { product_id: 3, quantity: 1, price: 24900 }] },
      { id: 'ORD-2026-002', customer_email: 'alice.smith@example.com', order_date: '2026-07-05', status: 'Processing', total: 12500, items: [{ product_id: 5, quantity: 1, price: 12500 }] }
    ];

    for (const o of orders) {
      // Find customer_id by email from users
      const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [o.customer_email]);
      const customerId = userRes.rows[0].id;

      await pool.query(
        'INSERT INTO orders (id, customer_id, order_date, status, total) VALUES ($1, $2, $3, $4, $5)',
        [o.id, customerId, o.order_date, o.status, o.total]
      );

      for (const item of o.items) {
        await pool.query(
          'INSERT INTO orders_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
          [o.id, item.product_id, item.quantity, item.price]
        );
      }

      // Add to order history
      await pool.query(
        'INSERT INTO order_history (order_id, status) VALUES ($1, $2)',
        [o.id, o.status]
      );
    }

    console.log("Database seeded successfully!");
  } catch (err) {
    console.error("Error seeding database:", err);
  } finally {
    pool.end();
  }
}

seedDatabase();
