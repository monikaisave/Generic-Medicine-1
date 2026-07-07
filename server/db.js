const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'generic_medicine',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper for bigram similarity (Sorensen-Dice Coefficient)
function getBigrams(str) {
  const bigrams = new Set();
  for (let i = 0; i < str.length - 1; i++) {
    bigrams.add(str.substring(i, i + 2));
  }
  return bigrams;
}

function diceCoefficient(str1, str2) {
  if (!str1 || !str2) return 0;
  const s1 = str1.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = str2.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (s1 === s2) return 1.0;
  if (s1.length < 2 || s2.length < 2) return 0.0;

  const bigrams1 = getBigrams(s1);
  const bigrams2 = getBigrams(s2);
  
  let intersection = 0;
  for (const val of bigrams1) {
    if (bigrams2.has(val)) {
      intersection++;
    }
  }
  
  return (2.0 * intersection) / (bigrams1.size + bigrams2.size);
}

// Convert JSON fields from MySQL back to objects/arrays
const parseJSONFields = (row, fields) => {
  if (!row) return row;
  fields.forEach(f => {
    if (row[f] && typeof row[f] === 'string') {
      try {
        row[f] = JSON.parse(row[f]);
      } catch(e) {}
    }
  });
  
  // Ensure numeric fields from MySQL DECIMAL are converted to floats
  // because mysql2 returns DECIMAL as strings by default
  const numericFields = ['brandPrice', 'genericPrice', 'savings', 'rating', 'lat', 'lng'];
  numericFields.forEach(f => {
    if (row[f] !== undefined && typeof row[f] === 'string') {
      row[f] = parseFloat(row[f]);
    }
  });

  return row;
}

const db = {
  medicines: {
    findMany: async () => {
      const [rows] = await pool.query('SELECT * FROM medicines');
      return rows.map(r => parseJSONFields(r, ['sideEffects', 'contraindications']));
    },
    findFirst: async (filterFn) => {
      // In JS, it was passed a function. For MySQL, it's easier to fetch all and run the function
      // if we want to preserve exact semantics, but ideally we'd pass IDs.
      // Since `filterFn` is a JS function, we fetch all and apply it.
      const [rows] = await pool.query('SELECT * FROM medicines');
      const all = rows.map(r => parseJSONFields(r, ['sideEffects', 'contraindications']));
      return all.find(filterFn);
    },
    filter: async (filterFn) => {
      const [rows] = await pool.query('SELECT * FROM medicines');
      const all = rows.map(r => parseJSONFields(r, ['sideEffects', 'contraindications']));
      return all.filter(filterFn);
    },
    findById: async (id) => {
      const [rows] = await pool.query('SELECT * FROM medicines WHERE id = ?', [id]);
      if (rows.length > 0) return parseJSONFields(rows[0], ['sideEffects', 'contraindications']);
      return null;
    },
    save: async (med) => {
      if (med.id) {
        const [existing] = await pool.query('SELECT id FROM medicines WHERE id = ?', [med.id]);
        if (existing.length > 0) {
          await pool.query(
            'UPDATE medicines SET brandName=?, genericName=?, composition=?, brandPrice=?, genericPrice=?, savings=?, manufacturer=?, category=?, details=?, availability=?, barcode=?, dosage=?, schedule=?, sideEffects=?, contraindications=?, lastSync=? WHERE id=?',
            [med.brandName, med.genericName, med.composition, med.brandPrice, med.genericPrice, med.savings, med.manufacturer, med.category, med.details, med.availability, med.barcode, med.dosage, med.schedule, JSON.stringify(med.sideEffects || []), JSON.stringify(med.contraindications || []), med.lastSync, med.id]
          );
          return med;
        }
      }
      const [result] = await pool.query(
        'INSERT INTO medicines (brandName, genericName, composition, brandPrice, genericPrice, savings, manufacturer, category, details, availability, barcode, dosage, schedule, sideEffects, contraindications, lastSync) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [med.brandName, med.genericName, med.composition, med.brandPrice, med.genericPrice, med.savings, med.manufacturer, med.category, med.details, med.availability, med.barcode, med.dosage, med.schedule, JSON.stringify(med.sideEffects || []), JSON.stringify(med.contraindications || []), med.lastSync]
      );
      med.id = result.insertId;
      return med;
    },
    saveMany: async (meds) => {
      for (const med of meds) {
        await db.medicines.save(med);
      }
    },
    search: async (query) => {
      const q = query.toLowerCase().trim();
      if (!q) return [];
      
      const [rows] = await pool.query('SELECT * FROM medicines');
      const all = rows.map(r => parseJSONFields(r, ['sideEffects', 'contraindications']));

      const exactMatches = all.filter(m => 
        (m.brandName && m.brandName.toLowerCase().includes(q)) || 
        (m.genericName && m.genericName.toLowerCase().includes(q)) ||
        (m.composition && m.composition.toLowerCase().includes(q)) ||
        (m.barcode && m.barcode.includes(q))
      );

      if (exactMatches.length > 0) {
        return exactMatches;
      }

      return all.map(m => {
        const brandSim = diceCoefficient(q, m.brandName);
        const genericSim = diceCoefficient(q, m.genericName);
        const compSim = diceCoefficient(q, m.composition);
        const maxSim = Math.max(brandSim, genericSim, compSim);
        return { medicine: m, similarity: maxSim };
      })
      .filter(item => item.similarity >= 0.4)
      .sort((a, b) => b.similarity - a.similarity)
      .map(item => item.medicine);
    }
  },
  stores: {
    findMany: async () => {
      const [rows] = await pool.query('SELECT * FROM stores');
      return rows.map(r => parseJSONFields(r, ['stock']));
    },
    filter: async (filterFn) => {
      const [rows] = await pool.query('SELECT * FROM stores');
      const all = rows.map(r => parseJSONFields(r, ['stock']));
      return all.filter(filterFn);
    },
    findNearby: async (lat, lng, radiusKm = 15) => {
      const toRad = (value) => (value * Math.PI) / 180;
      const [rows] = await pool.query('SELECT * FROM stores');
      const stores = rows.map(r => parseJSONFields(r, ['stock']));
      
      return stores.map(store => {
        const dLat = toRad(store.lat - lat);
        const dLng = toRad(store.lng - lng);
        const a = 
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRad(lat)) * Math.cos(toRad(store.lat)) * 
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const R = 6371; // Earth's radius in km
        const distance = R * c;
        return { ...store, distance: parseFloat(distance.toFixed(2)) };
      })
      .filter(store => store.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);
    }
  },
  trends: {
    get: async () => {
      const [rows] = await pool.query('SELECT * FROM market_trends LIMIT 1');
      if (rows.length > 0) {
        return parseJSONFields(rows[0], ['adoptionRates', 'categoryAnalysis', 'regionalPricing', 'monthlyVolume', 'manufacturersShare']);
      }
      return null;
    }
  }
};

module.exports = db;
