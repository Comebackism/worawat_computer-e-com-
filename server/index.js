const express = require('express');
const cors = require('cors');

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

// Mock Data
let products = [
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
    name: 'AMD Radeon RX 7900 XTX',
    brand: 'AMD',
    price: 38900,
    category: 'GPU',
    memory: '24GB GDDR6',
    description: 'Experience unprecedented performance, visuals, and efficiency at 4K and beyond.',
    image: '/images/gpu.png',
    specs: ['24GB GDDR6', '6144 Stream Processors', '384-bit Memory Interface']
  },
  {
    id: 3,
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
    id: 4,
    name: 'Intel Core i9-14900K',
    brand: 'Intel',
    price: 23900,
    category: 'CPU',
    memory: 'N/A',
    description: '24 cores (8 P-cores + 16 E-cores) and 32 threads. Uncompromised gaming and multitasking.',
    image: '/images/cpu.png',
    specs: ['24 Cores / 32 Threads', '6.0 GHz Max Turbo', 'LGA 1700']
  },
  {
    id: 5,
    name: 'Corsair Dominator Titanium 64GB',
    brand: 'Corsair',
    price: 12500,
    category: 'RAM',
    memory: '64GB (2x32GB)',
    description: 'Push your system to the limit with cutting-edge DDR5 memory, unlocking even faster frequencies.',
    image: '/images/ram.png',
    specs: ['64GB (2x32GB)', 'DDR5 6000MHz', 'CL30']
  },
  {
    id: 6,
    name: 'G.Skill Trident Z5 RGB 32GB',
    brand: 'G.Skill',
    price: 5290,
    category: 'RAM',
    memory: '32GB (2x16GB)',
    description: 'High-performance DDR5 memory designed for gamers and enthusiasts.',
    image: '/images/ram.png',
    specs: ['32GB (2x16GB)', 'DDR5 6400MHz', 'CL32']
  },
  {
    id: 7,
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
    id: 8,
    name: 'MSI MAG B650 TOMAHAWK WIFI',
    brand: 'MSI',
    price: 7990,
    category: 'Motherboard',
    memory: 'N/A',
    description: 'Solid ATX motherboard for AMD Ryzen 7000 series with robust power and cooling.',
    image: '/images/motherboard.png',
    specs: ['Socket AM5', 'DDR5 Support', 'PCIe 4.0', 'Wi-Fi 6E']
  },
  {
    id: 9,
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
    id: 10,
    name: 'WD Black SN850X 1TB',
    brand: 'Western Digital',
    price: 3590,
    category: 'Storage',
    memory: '1TB',
    description: 'Insane speeds up to 7,300 MB/s deliver top-tier performance with ridiculously short load times.',
    image: '/images/storage.png',
    specs: ['1TB Capacity', 'Up to 7300 MB/s Read', 'PCIe 4.0 NVMe']
  },
  {
    id: 11,
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
    id: 12,
    name: 'Noctua NH-D15',
    brand: 'Noctua',
    price: 4290,
    category: 'Cooling',
    memory: 'N/A',
    description: 'State-of-the-art dual-tower CPU cooler with two 140mm fans for extreme performance.',
    image: '/images/cooling.png',
    specs: ['Dual Tower Air Cooler', '2x NF-A15 140mm Fans', 'Ultra-Quiet']
  },
  {
    id: 13,
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
    id: 14,
    name: 'Seasonic Focus GX-850',
    brand: 'Seasonic',
    price: 5290,
    category: 'Power Supply',
    memory: 'N/A',
    description: 'High performance, compact size, 80 PLUS Gold certified.',
    image: '/images/psu.png',
    specs: ['850W', '80 PLUS Gold', 'Fully Modular']
  },
  {
    id: 15,
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
    id: 16,
    name: 'Fractal Design North',
    brand: 'Fractal Design',
    price: 5990,
    category: 'Case',
    memory: 'N/A',
    description: 'Transforms the gaming space with natural materials and bespoke details, featuring real wood front panels.',
    image: '/images/case.png',
    specs: ['ATX Mid-Tower', 'Real Wood Front', 'Mesh Side Panel']
  },
  {
    id: 17,
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
    id: 18,
    name: 'LG 27GR95QE-B',
    brand: 'LG',
    price: 32900,
    category: 'Monitor',
    memory: 'N/A',
    description: '27-inch UltraGear OLED Gaming Monitor with 240Hz and 0.03ms response time.',
    image: '/images/monitor.png',
    specs: ['27" OLED', '2560x1440', '240Hz Refresh Rate']
  },
  {
    id: 19,
    name: 'Logitech G PRO X Superlight 2',
    brand: 'Logitech',
    price: 5290,
    category: 'Peripherals',
    memory: 'N/A',
    description: 'Ultra-lightweight wireless esports gaming mouse with LIGHTFORCE switches.',
    image: '/images/mouse.png',
    specs: ['60g Weight', 'HERO 2 Sensor', 'Wireless']
  },
  {
    id: 20,
    name: 'Razer Huntsman V3 Pro',
    brand: 'Razer',
    price: 8990,
    category: 'Peripherals',
    memory: 'N/A',
    description: 'Analog optical esports keyboard with adjustable actuation and rapid trigger mode.',
    image: '/images/mouse.png',
    specs: ['Analog Optical Switches', 'Rapid Trigger', 'Full Size']
  },
  {
    id: 21,
    name: 'Windows 11 Pro',
    brand: 'Microsoft',
    price: 5500,
    category: 'Software',
    memory: 'N/A',
    description: 'Designed for the hybrid workplace, Windows 11 Pro has the business and management features your team needs.',
    image: '/images/storage.png',
    specs: ['Digital License', '64-bit', 'Pro Features']
  },
  {
    id: 22,
    name: 'Microsoft 365 Personal',
    brand: 'Microsoft',
    price: 2090,
    category: 'Software',
    memory: 'N/A',
    description: '12-month subscription for 1 person. Includes premium Office apps, 1TB cloud storage, and advanced security.',
    image: '/images/storage.png',
    specs: ['1 Year Subscription', '1 User', '1TB OneDrive']
  }
];

let orders = [
  {
    id: 'ORD-2026-001',
    date: '2026-07-01',
    customer: 'john.doe@example.com',
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
    customer: 'alice.smith@example.com',
    status: 'Processing',
    total: 12500,
    items: [
      { name: 'Corsair Dominator Titanium 64GB', quantity: 1, price: 12500 }
    ]
  }
];

let customers = [
  { id: 1, name: 'John Doe', email: 'john.doe@example.com', date: '2025-11-20', spent: 150400 },
  { id: 2, name: 'Alice Smith', email: 'alice.smith@example.com', date: '2026-01-15', spent: 45000 },
  { id: 3, name: 'Bob Johnson', email: 'bob.johnson@example.com', date: '2026-03-02', spent: 12500 },
  { id: 4, name: 'Emma Wilson', email: 'emma.wilson@example.com', date: '2026-05-10', spent: 89000 },
  { id: 5, name: 'Sarah Connor', email: 'sarah.connor@example.com', date: '2026-06-25', spent: 7500 },
];

// Endpoints
app.get('/api/products', (req, res) => {
  res.json(products);
});

app.delete('/api/products/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const initialLength = products.length;
  products = products.filter(p => p.id !== id);
  if (products.length < initialLength) {
    res.status(200).json({ message: 'Product deleted' });
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
});

app.put('/api/products/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = products.findIndex(p => p.id === id);
  if (index !== -1) {
    products[index] = { ...products[index], ...req.body, id };
    res.status(200).json(products[index]);
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
});

app.post('/api/products', (req, res) => {
  const newProduct = {
    id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
    name: req.body.name,
    category: req.body.category,
    price: Number(req.body.price),
    stock: Number(req.body.stock),
    image: req.body.image || 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=800'
  };
  products.unshift(newProduct);
  res.status(201).json(newProduct);
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
    customer: 'current.user@example.com', // mock email for newly placed orders
    status: 'Processing',
    total: req.body.total,
    items: req.body.items
  };
  orders.unshift(newOrder); // Add to beginning
  res.status(201).json(newOrder);
});

app.put('/api/orders/:id', (req, res) => {
  const id = req.params.id;
  const index = orders.findIndex(o => o.id === id);
  if (index !== -1) {
    orders[index] = { ...orders[index], ...req.body, id };
    res.status(200).json(orders[index]);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
});

app.delete('/api/orders/:id', (req, res) => {
  const id = req.params.id;
  const initialLength = orders.length;
  orders = orders.filter(o => o.id !== id);
  if (orders.length < initialLength) {
    res.status(200).json({ message: 'Order deleted' });
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
});

app.get('/api/customers', (req, res) => {
  res.json(customers);
});

app.post('/api/customers', (req, res) => {
  const newCustomer = {
    id: customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1,
    name: req.body.name,
    email: req.body.email,
    date: req.body.date || new Date().toISOString().split('T')[0],
    spent: Number(req.body.spent) || 0
  };
  customers.unshift(newCustomer);
  res.status(201).json(newCustomer);
});

app.put('/api/customers/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = customers.findIndex(c => c.id === id);
  if (index !== -1) {
    customers[index] = { ...customers[index], ...req.body, id };
    res.status(200).json(customers[index]);
  } else {
    res.status(404).json({ message: 'Customer not found' });
  }
});

app.delete('/api/customers/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const initialLength = customers.length;
  customers = customers.filter(c => c.id !== id);
  if (customers.length < initialLength) {
    res.status(200).json({ message: 'Customer deleted' });
  } else {
    res.status(404).json({ message: 'Customer not found' });
  }
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
