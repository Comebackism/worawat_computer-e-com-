const pool = require('./db');

async function addProducts() {
  console.log("Adding comprehensive mock products to the database...");

  try {
    const moreProducts = [
      // CPUs
      { name: 'Intel Core i7-14700K', brand: 'Intel', price: 16500, category: 'CPU', memory: 'N/A', description: '20 cores (8 P-cores + 12 E-cores) and 28 threads.', image: '/images/cpu.png', stock: 40, specs: ['20 Cores / 28 Threads', '5.6 GHz Max Turbo', 'LGA 1700'] },
      { name: 'AMD Ryzen 7 7800X3D', brand: 'AMD', price: 15900, category: 'CPU', memory: 'N/A', description: 'The ultimate gaming processor with 3D V-Cache.', image: '/images/cpu.png', stock: 35, specs: ['8 Cores / 16 Threads', '5.0 GHz Max Boost', '96MB L3 Cache', 'Socket AM5'] },
      { name: 'Intel Core i5-13400F', brand: 'Intel', price: 7900, category: 'CPU', memory: 'N/A', description: 'Great value 10-core processor for gaming and work.', image: '/images/cpu.png', stock: 50, specs: ['10 Cores / 16 Threads', '4.6 GHz Max Turbo', 'LGA 1700'] },

      // GPUs
      { name: 'NVIDIA GeForce RTX 4070 Ti SUPER', brand: 'NVIDIA', price: 34900, category: 'GPU', memory: '16GB GDDR6X', description: 'Supercharged performance for 1440p and 4K gaming.', image: '/images/gpu.png', stock: 25, specs: ['16GB GDDR6X', '8448 CUDA Cores', '256-bit Memory Interface'] },
      { name: 'NVIDIA GeForce RTX 4060', brand: 'NVIDIA', price: 11900, category: 'GPU', memory: '8GB GDDR6', description: 'Excellent 1080p gaming performance with DLSS 3.', image: '/images/gpu.png', stock: 40, specs: ['8GB GDDR6', '3072 CUDA Cores', '128-bit Memory Interface'] },
      { name: 'AMD Radeon RX 7800 XT', brand: 'AMD', price: 19900, category: 'GPU', memory: '16GB GDDR6', description: 'Incredible 1440p gaming with plenty of VRAM.', image: '/images/gpu.png', stock: 20, specs: ['16GB GDDR6', '3840 Stream Processors', '256-bit Memory Interface'] },

      // Motherboards
      { name: 'ASUS ROG STRIX Z790-E GAMING WIFI', brand: 'ASUS', price: 18900, category: 'Motherboard', memory: 'N/A', description: 'Top-tier motherboard for Intel 14th Gen processors.', image: '/images/case.png', stock: 15, specs: ['LGA 1700', 'Z790 Chipset', 'DDR5 Support', 'PCIe 5.0'] },
      { name: 'MSI MAG B650 TOMAHAWK WIFI', brand: 'MSI', price: 7900, category: 'Motherboard', memory: 'N/A', description: 'Solid and reliable AM5 motherboard for Ryzen 7000 series.', image: '/images/case.png', stock: 25, specs: ['Socket AM5', 'B650 Chipset', 'DDR5 Support', 'PCIe 4.0'] },
      { name: 'GIGABYTE B760M AORUS ELITE AX', brand: 'GIGABYTE', price: 6500, category: 'Motherboard', memory: 'N/A', description: 'Feature-packed Micro-ATX board for budget Intel builds.', image: '/images/case.png', stock: 30, specs: ['LGA 1700', 'B760 Chipset', 'DDR5 Support', 'Micro-ATX'] },

      // RAM
      { name: 'G.Skill Trident Z5 RGB 32GB', brand: 'G.Skill', price: 4900, category: 'RAM', memory: '32GB (2x16GB)', description: 'High-speed DDR5 memory with stunning RGB.', image: '/images/ram.png', stock: 45, specs: ['32GB (2x16GB)', 'DDR5 6400MHz', 'CL32'] },
      { name: 'Kingston FURY Beast 16GB', brand: 'Kingston', price: 1900, category: 'RAM', memory: '16GB (1x16GB)', description: 'Affordable and reliable DDR4 memory.', image: '/images/ram.png', stock: 60, specs: ['16GB (1x16GB)', 'DDR4 3200MHz', 'CL16'] },

      // Storage
      { name: 'Samsung 990 PRO 2TB', brand: 'Samsung', price: 7500, category: 'Storage', memory: '2TB', description: 'Ultra-fast PCIe 4.0 NVMe SSD.', image: '/images/case.png', stock: 35, specs: ['2TB Capacity', 'PCIe 4.0 NVMe', 'Read 7450 MB/s', 'Write 6900 MB/s'] },
      { name: 'WD Blue SN580 1TB', brand: 'Western Digital', price: 2500, category: 'Storage', memory: '1TB', description: 'Great value NVMe storage for everyday use.', image: '/images/case.png', stock: 50, specs: ['1TB Capacity', 'PCIe 4.0 NVMe', 'Read 4150 MB/s', 'Write 4150 MB/s'] },
      
      // Power Supply
      { name: 'Corsair RM850x (2021)', brand: 'Corsair', price: 5500, category: 'Power Supply', memory: 'N/A', description: 'Fully modular 80 PLUS Gold ATX power supply.', image: '/images/case.png', stock: 20, specs: ['850W', '80 PLUS Gold', 'Fully Modular', 'Zero RPM Fan Mode'] },
      { name: 'Seasonic Focus GX-750', brand: 'Seasonic', price: 4500, category: 'Power Supply', memory: 'N/A', description: 'Reliable and quiet 750W power supply.', image: '/images/case.png', stock: 30, specs: ['750W', '80 PLUS Gold', 'Fully Modular'] },

      // Case
      { name: 'Lian Li O11 Dynamic EVO', brand: 'Lian Li', price: 5900, category: 'Case', memory: 'N/A', description: 'Beautiful dual-chamber mid-tower case.', image: '/images/case.png', stock: 15, specs: ['Mid-Tower', 'Dual Chamber', 'Tempered Glass', 'Reversible'] },
      { name: 'NZXT H5 Flow', brand: 'NZXT', price: 3500, category: 'Case', memory: 'N/A', description: 'Compact mid-tower with excellent airflow.', image: '/images/case.png', stock: 25, specs: ['Mid-Tower', 'High Airflow', 'Tempered Glass'] },

      // Cooling
      { name: 'NZXT Kraken Elite 360 RGB', brand: 'NZXT', price: 10900, category: 'Cooling', memory: 'N/A', description: 'Premium 360mm AIO liquid cooler with LCD display.', image: '/images/case.png', stock: 10, specs: ['360mm Radiator', '3x 120mm RGB Fans', 'LCD Display'] },
      { name: 'Thermalright Peerless Assassin 120 SE', brand: 'Thermalright', price: 1500, category: 'Cooling', memory: 'N/A', description: 'Incredible value dual-tower air cooler.', image: '/images/case.png', stock: 40, specs: ['Air Cooler', 'Dual Tower', '2x 120mm Fans'] }
    ];

    for (const p of moreProducts) {
      await pool.query(
        'INSERT INTO products (name, brand, price, category, memory, description, image, stock, specs) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [p.name, p.brand, p.price, p.category, p.memory, p.description, p.image, p.stock, p.specs]
      );
    }

    console.log(`Successfully added ${moreProducts.length} new products!`);
  } catch (err) {
    console.error("Error adding products:", err);
  } finally {
    pool.end();
  }
}

addProducts();
