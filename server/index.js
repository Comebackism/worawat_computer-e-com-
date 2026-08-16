const express = require('express');
const cors = require('cors');
const pool = require('./db');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

const { swaggerUi, swaggerSpec } = require('./Config/swaggerConfig');
// Swagger page
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// Docs in JSON format
app.get('/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, 'slip-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Endpoints for Products
/**
 * @openapi
 * /api/products:
 *   get:
 *     tags: [Product]
 *     summary: Get all products
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       500:
 *         description: Internal server error
 */
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @openapi
 * /api/products/{id}:
 *   get:
 *     tags: [Product]
 *     summary: Get product by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @openapi
 * /api/products:
 *   post:
 *     tags: [Product]
 *     summary: Create a product
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Created
 *       500:
 *         description: Internal server error
 */
app.post('/api/products', async (req, res) => {
  try {
    const { name, brand, price, category, memory, description, image, stock, specs } = req.body;
    const result = await pool.query(
      'INSERT INTO products (name, brand, price, category, memory, description, image, stock, specs) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [name, brand, price, category, memory, description, image, stock, specs]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @openapi
 * /api/products/{id}:
 *   put:
 *     tags: [Product]
 *     summary: Update a product
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Updated
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, brand, price, category, memory, description, image, stock, specs } = req.body;
    const result = await pool.query(
      'UPDATE products SET name=$1, brand=$2, price=$3, category=$4, memory=$5, description=$6, image=$7, stock=$8, specs=$9 WHERE id=$10 RETURNING *',
      [name, brand, price, category, memory, description, image, stock, specs, id]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @openapi
 * /api/products/{id}:
 *   delete:
 *     tags: [Product]
 *     summary: Delete a product
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Deleted
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length > 0) {
      res.json({ message: 'Product deleted' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoints for Orders
app.get('/api/orders', async (req, res) => {
  try {
    const { user_id } = req.query;
    
    let query = `
      SELECT 
        o.id, 
        o.order_date as date, 
        u.email as customer, 
        o.status, 
        o.total,
        o.shipping_address,
        o.payment_method,
        o.payment_slip,
        COALESCE(
          json_agg(
            json_build_object(
              'product_id', oi.product_id,
              'name', p.name,
              'quantity', oi.quantity,
              'price', oi.price
            )
          ) FILTER (WHERE oi.id IS NOT NULL), 
          '[]'
        ) as items
      FROM orders o
      LEFT JOIN users u ON o.customer_id = u.id
      LEFT JOIN orders_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
    `;
    
    const params = [];
    if (user_id) {
      query += ` WHERE o.customer_id = $1 `;
      params.push(user_id);
    }
    
    query += ` GROUP BY o.id, u.email, o.order_date, o.status, o.total, o.shipping_address, o.payment_method, o.payment_slip ORDER BY o.order_date DESC`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/orders', upload.single('payment_slip'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { customer_id, total, payment_method, shipping_address } = req.body; 
    let items = [];
    if (req.body.items) {
      items = typeof req.body.items === 'string' ? JSON.parse(req.body.items) : req.body.items;
    }
    const payment_slip = req.file ? `/uploads/${req.file.filename}` : null;

    // Generate Order ID (Readable & Unique: ORD-YYYYMMDD-XXXX)
    const dateObj = new Date();
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newId = `ORD-${yyyy}${mm}${dd}-${randomStr}`;
    const date = dateObj.toISOString().split('T')[0];

    const orderRes = await client.query(
      'INSERT INTO orders (id, customer_id, order_date, status, total, shipping_address, payment_method, payment_slip) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [newId, customer_id || null, date, 'Processing', total, shipping_address || null, payment_method || null, payment_slip]
    );

    if (items && items.length > 0) {
      for (const item of items) {
        // Insert order item
        await client.query(
          'INSERT INTO orders_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
          [newId, item.product_id, item.quantity, item.price]
        );
        // Deduct stock
        await client.query(
          'UPDATE products SET stock = stock - $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }
    }

    await client.query(
      'INSERT INTO order_history (order_id, status) VALUES ($1, $2)',
      [newId, 'Processing']
    );

    await client.query('COMMIT');
    res.status(201).json(orderRes.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

app.put('/api/orders/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { status, shipping_address } = req.body;
    
    let updateQuery = 'UPDATE orders SET ';
    const updateParams = [];
    let idx = 1;

    if (status !== undefined) {
      updateQuery += `status = $${idx++}, `;
      updateParams.push(status);
    }
    if (shipping_address !== undefined) {
      updateQuery += `shipping_address = $${idx++}, `;
      updateParams.push(shipping_address);
    }

    if (updateParams.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'No valid fields provided for update' });
    }

    // remove trailing comma and space
    updateQuery = updateQuery.slice(0, -2);
    updateQuery += ` WHERE id = $${idx} RETURNING *`;
    updateParams.push(id);
    
    const result = await client.query(updateQuery, updateParams);
    
    if (result.rows.length > 0) {
      if (status !== undefined) {
        await client.query('INSERT INTO order_history (order_id, status) VALUES ($1, $2)', [id, status]);
      }
      await client.query('COMMIT');
      res.json(result.rows[0]);
    } else {
      await client.query('ROLLBACK');
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length > 0) {
      res.json({ message: 'Order deleted' });
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoints for Customers
app.get('/api/customers', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        u.email,
        u.role,
        u.phone,
        TO_CHAR(u.dob, 'YYYY-MM-DD') as dob,
        TO_CHAR(u.created_at, 'YYYY-MM-DD') as date,
        COALESCE(u.total_spent, 0) + COALESCE(SUM(o.total), 0) as spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.customer_id
      GROUP BY u.id
      ORDER BY u.id ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const { firstName, lastName, email, role, phone, dob, password } = req.body;

    const result = await pool.query(
      'INSERT INTO users (first_name, last_name, email, password, role, phone, dob) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [firstName, lastName, email, password || 'default123', role || 'customer', phone || null, dob || null]
    );
    const user = result.rows[0];
    res.status(201).json({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      role: user.role,
      phone: user.phone,
      dob: user.dob,
      date: new Date().toISOString().split('T')[0],
      spent: 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, role, phone, dob, password, spent } = req.body;

    let updateResult;
    if (password) {
      updateResult = await pool.query(
        'UPDATE users SET first_name=$1, last_name=$2, email=$3, role=$4, phone=$5, dob=$6, password=$7, total_spent=$8 WHERE id=$9 RETURNING *',
        [firstName, lastName, email, role || 'customer', phone || null, dob || null, password, spent || 0, id]
      );
    } else {
      updateResult = await pool.query(
        'UPDATE users SET first_name=$1, last_name=$2, email=$3, role=$4, phone=$5, dob=$6, total_spent=$7 WHERE id=$8 RETURNING *',
        [firstName, lastName, email, role || 'customer', phone || null, dob || null, spent || 0, id]
      );
    }
    
    if (updateResult.rows.length > 0) {
      const userRes = await pool.query(`
        SELECT 
          u.id,
          u.first_name,
          u.last_name,
          CONCAT(u.first_name, ' ', u.last_name) as name,
          u.email,
          u.role,
          u.phone,
          TO_CHAR(u.dob, 'YYYY-MM-DD') as dob,
          TO_CHAR(u.created_at, 'YYYY-MM-DD') as date,
          COALESCE(u.total_spent, 0) + COALESCE(SUM(o.total), 0) as spent
        FROM users u
        LEFT JOIN orders o ON u.id = o.customer_id
        WHERE u.id = $1
        GROUP BY u.id
      `, [id]);
      res.json(userRes.rows[0]);
    } else {
      res.status(404).json({ message: 'Customer not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Delete related data first to avoid foreign key constraint violations
    await pool.query('DELETE FROM order_history WHERE order_id IN (SELECT id FROM orders WHERE customer_id = $1)', [id]);
    await pool.query('DELETE FROM orders_items WHERE order_id IN (SELECT id FROM orders WHERE customer_id = $1)', [id]);
    await pool.query('DELETE FROM orders WHERE customer_id = $1', [id]);
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length > 0) {
      res.json({ message: 'Customer deleted' });
    } else {
      res.status(404).json({ message: 'Customer not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Authentication Endpoints
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      user: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        phone: user.phone,
        dob: user.dob,
        role: user.role
      },
      token: 'mock-jwt-token-123'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, dob } = req.body;
    if (!email || !password || !firstName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existRes.rows.length > 0) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const result = await pool.query(
      'INSERT INTO users (first_name, last_name, email, password, phone, dob) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [firstName, lastName, email, password, phone, dob]
    );

    const user = result.rows[0];

    res.status(201).json({
      user: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        phone: user.phone,
        dob: user.dob,
        role: user.role
      },
      token: 'mock-jwt-token-register-456'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/auth/google', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;
    const givenName = payload.given_name || '';
    const familyName = payload.family_name || '';

    // Check if user exists
    let userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userRes.rows.length === 0) {
      // Create user if not exists
      userRes = await pool.query(
        'INSERT INTO users (first_name, last_name, email, password, phone, dob) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [givenName, familyName, email, '', '', null]
      );
    }

    const user = userRes.rows[0];

    res.json({
      user: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        phone: user.phone,
        dob: user.dob,
        role: user.role
      },
      token: 'mock-jwt-token-google-789'
    });
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(401).json({ message: 'Invalid Google Token' });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
