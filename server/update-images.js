const pool = require('./db');

async function updateImages() {
  console.log("Updating product images in database...");

  try {
    const updates = [
      // GPUs - unique generated images
      { id: 1, image: '/images/rtx4090.png' },         // NVIDIA GeForce RTX 4090
      { id: 2, image: '/images/rx7900xtx.png' },        // AMD Radeon RX 7900 XTX
      { id: 9, image: '/images/rtx4070ti.png' },         // NVIDIA GeForce RTX 4070 Ti SUPER
      { id: 10, image: '/images/rtx4060.png' },          // NVIDIA GeForce RTX 4060
      { id: 11, image: '/images/rx7800xt.png' },         // AMD Radeon RX 7800 XT

      // CPUs - unique generated images
      { id: 3, image: '/images/ryzen9_7950x.png' },     // AMD Ryzen 9 7950X
      { id: 4, image: '/images/i9_14900k.png' },        // Intel Core i9-14900K
      { id: 6, image: '/images/i7_14700k.png' },        // Intel Core i7-14700K
      { id: 7, image: '/images/ryzen7_7800x3d.png' },   // AMD Ryzen 7 7800X3D
      { id: 8, image: '/images/i5_13400f.png' },        // Intel Core i5-13400F

      // RAM - unique generated images
      { id: 5, image: '/images/corsair_dominator.png' }, // Corsair Dominator Titanium 64GB
      { id: 15, image: '/images/gskill_trident_z5.png' },// G.Skill Trident Z5 RGB 32GB
      { id: 16, image: '/images/kingston_fury.png' },    // Kingston FURY Beast 16GB

      // Motherboards - use existing motherboard.png
      { id: 12, image: '/images/motherboard.png' },     // ASUS ROG STRIX Z790-E
      { id: 13, image: '/images/motherboard.png' },     // MSI MAG B650 TOMAHAWK
      { id: 14, image: '/images/motherboard.png' },     // GIGABYTE B760M AORUS ELITE

      // Storage - use existing storage.png
      { id: 17, image: '/images/storage.png' },          // Samsung 990 PRO 2TB
      { id: 18, image: '/images/storage.png' },          // WD Blue SN580 1TB

      // Power Supply - use existing psu.png
      { id: 19, image: '/images/psu.png' },              // Corsair RM850x
      { id: 20, image: '/images/psu.png' },              // Seasonic Focus GX-750

      // Case - keep case.png
      { id: 21, image: '/images/case.png' },             // Lian Li O11 Dynamic EVO
      { id: 22, image: '/images/case.png' },             // NZXT H5 Flow

      // Cooling - use existing cooling.png
      { id: 23, image: '/images/cooling.png' },          // NZXT Kraken Elite 360 RGB
      { id: 24, image: '/images/cooling.png' },          // Thermalright Peerless Assassin
    ];

    for (const u of updates) {
      await pool.query('UPDATE products SET image = $1 WHERE id = $2', [u.image, u.id]);
      console.log(`Updated product #${u.id} -> ${u.image}`);
    }

    console.log(`\nSuccessfully updated ${updates.length} product images!`);
  } catch (err) {
    console.error("Error updating images:", err);
  } finally {
    pool.end();
  }
}

updateImages();
