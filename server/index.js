const express = require('express');
const cors = require('cors');

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

// Mock Data
const products = [
  {
    id: 1,
    name: 'NVIDIA GeForce RTX 4090',
    brand: 'NVIDIA',
    price: 65900,
    category: 'GPU',
    memory: '24GB GDDR6X',
    description: 'The ultimate GeForce GPU. It brings an enormous leap in performance, efficiency, and AI-powered graphics.',
    image: '/images/gpu.png',
    specs: ['24GB GDDR6X', '16384 CUDA Cores', '384-bit Memory Interface']
  },
  {
    id: 2,
    name: 'AMD Ryzen 9 7950X',
    brand: 'AMD',
    price: 24900,
    category: 'CPU',
    memory: 'N/A',
    description: 'The ultimate processor for gaming and creating. 16 cores, 32 threads, and boost clocks up to 5.7GHz.',
    image: '/images/cpu.png',
    specs: ['16 Cores / 32 Threads', '5.7 GHz Max Boost', 'Socket AM5']
  },
  {
    id: 3,
    name: 'Corsair Dominator Titanium 64GB',
    brand: 'Corsair',
    price: 12500,
    category: 'Memory',
    memory: '64GB (2x32GB)',
    description: 'Push your system to the limit with cutting-edge DDR5 memory, unlocking even faster frequencies.',
    image: '/images/ram.png',
    specs: ['64GB (2x32GB)', 'DDR5 6000MHz', 'CL30']
  },
  {
    id: 4,
    name: 'ASUS ROG Maximus Z790 Hero',
    brand: 'ASUS',
    price: 21500,
    category: 'Motherboard',
    memory: 'N/A',
    description: 'Fully loaded for Intel 13th Gen Core processors. Robust power delivery and comprehensive cooling.',
    image: '/images/motherboard.png',
    specs: ['LGA 1700', 'DDR5 Support', 'PCIe 5.0', 'Wi-Fi 6E']
  },
  {
    id: 5,
    name: 'Samsung 990 Pro 2TB',
    brand: 'Samsung',
    price: 6990,
    category: 'Storage',
    memory: '2TB',
    description: 'Blistering fast PCIe 4.0 NVMe SSD. Perfect for OS, gaming, and heavy workloads.',
    image: '/images/storage.png',
    specs: ['2TB Capacity', 'Up to 7450 MB/s Read', 'PCIe 4.0 NVMe']
  },
  {
    id: 6,
    name: 'NZXT Kraken Elite 360',
    brand: 'NZXT',
    price: 9900,
    category: 'Cooling',
    memory: 'N/A',
    description: 'High-performance AIO liquid cooler with a stunning customizable LCD display.',
    image: '/images/cooling.png',
    specs: ['360mm Radiator', 'LCD Display', '3x 120mm RGB Fans']
  },
  {
    id: 7,
    name: 'Corsair RM1000x',
    brand: 'Corsair',
    price: 7500,
    category: 'Power Supply',
    memory: 'N/A',
    description: 'Fully modular, 80 PLUS Gold certified ATX power supply. Reliable and quiet.',
    image: '/images/psu.png',
    specs: ['1000W', '80 PLUS Gold', 'Fully Modular']
  },
  {
    id: 8,
    name: 'Lian Li O11 Dynamic EVO',
    brand: 'Lian Li',
    price: 5500,
    category: 'Case',
    memory: 'N/A',
    description: 'Modern, reversible dual-chamber ATX mid-tower case with excellent airflow and aesthetics.',
    image: '/images/case.png',
    specs: ['ATX Mid-Tower', 'Dual-Chamber', 'Tempered Glass']
  },
  {
    id: 9,
    name: 'ASUS ROG Swift OLED PG27AQDM',
    brand: 'ASUS',
    price: 35900,
    category: 'Monitor',
    memory: 'N/A',
    description: '27-inch 1440p OLED gaming monitor with 240Hz refresh rate and 0.03ms response time.',
    image: '/images/monitor.png',
    specs: ['27" OLED', '2560x1440', '240Hz Refresh Rate']
  },
  {
    id: 10,
    name: 'Logitech G PRO X Superlight 2',
    brand: 'Logitech',
    price: 5290,
    category: 'Peripherals',
    memory: 'N/A',
    description: 'Ultra-lightweight wireless esports gaming mouse with LIGHTFORCE switches.',
    image: '/images/mouse.png',
    specs: ['60g Weight', 'HERO 2 Sensor', 'Wireless']
  }
];

const orders = [
  {
    id: 'ORD-2026-001',
    date: '2026-07-01',
    status: 'Delivered',
    total: 90800,
    items: [
      { name: 'NVIDIA GeForce RTX 4090', quantity: 1, price: 65900 },
      { name: 'AMD Ryzen 9 7950X', quantity: 1, price: 24900 }
    ]
  },
  {
    id: 'ORD-2026-002',
    date: '2026-07-05',
    status: 'Processing',
    total: 12500,
    items: [
      { name: 'Corsair Dominator Titanium 64GB', quantity: 1, price: 12500 }
    ]
  }
];

// Endpoints
app.get('/api/products', (req, res) => {
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
});

app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const newOrder = {
    id: `ORD-2026-${String(orders.length + 1).padStart(3, '0')}`,
    date: new Date().toISOString().split('T')[0],
    status: 'Processing',
    total: req.body.total,
    items: req.body.items
  };
  orders.unshift(newOrder); // Add to beginning
  res.status(201).json(newOrder);
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (email && password) {
    // Mock user
    res.json({
      user: {
        id: 1,
        name: email.split('@')[0],
        email: email
      },
      token: 'mock-jwt-token-123'
    });
  } else {
    res.status(400).json({ message: 'Email and password are required' });
  }
});

app.post('/api/register', (req, res) => {
  const { firstName, lastName, email, password, phone, dob } = req.body;

  if (!email || !password || !firstName) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Mock successful registration
  res.status(201).json({
    user: {
      id: Math.floor(Math.random() * 1000) + 2,
      name: `${firstName} ${lastName}`,
      email: email,
      phone: phone,
      dob: dob
    },
    token: 'mock-jwt-token-register-456'
  });
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
