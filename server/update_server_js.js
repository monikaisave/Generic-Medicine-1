const fs = require('fs');

let content = fs.readFileSync('server.js', 'utf8');

// 1. /api/medicines
content = content.replace(
  `app.get('/api/medicines', (req, res) => {`,
  `app.get('/api/medicines', async (req, res) => {`
);
content = content.replace(
  `return res.json(db.medicines.search(query));`,
  `return res.json(await db.medicines.search(query));`
);
content = content.replace(
  `res.json(db.medicines.findMany());`,
  `res.json(await db.medicines.findMany());`
);

// 2. /api/medicines/:id
content = content.replace(
  `app.get('/api/medicines/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const medicine = db.medicines.findFirst(m => m.id === id);`,
  `app.get('/api/medicines/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const medicine = await db.medicines.findById(id);`
);

// 3. /api/analytics
content = content.replace(
  `app.get('/api/analytics', (req, res) => {
  const medicines = db.medicines.findMany();
  const trends = db.trends.get();`,
  `app.get('/api/analytics', async (req, res) => {
  const medicines = await db.medicines.findMany();
  const trends = await db.trends.get();`
);

// 4. /api/stores
content = content.replace(
  `app.get('/api/stores', (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const radius = parseFloat(req.query.radius) || 20; // default 20km

  if (!isNaN(lat) && !isNaN(lng)) {
    const nearby = db.stores.findNearby(lat, lng, radius);
    return res.json(nearby);
  }
  
  res.json(db.stores.findMany());`,
  `app.get('/api/stores', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const radius = parseFloat(req.query.radius) || 20; // default 20km

  if (!isNaN(lat) && !isNaN(lng)) {
    const nearby = await db.stores.findNearby(lat, lng, radius);
    return res.json(nearby);
  }
  
  res.json(await db.stores.findMany());`
);

// 5. /api/trends
content = content.replace(
  `app.get('/api/trends', (req, res) => {
  const trends = db.trends.get();`,
  `app.get('/api/trends', async (req, res) => {
  const trends = await db.trends.get();`
);

// 6. enrichAndSummarizeMedicines
content = content.replace(
  `function enrichAndSummarizeMedicines(matched) {
  const allMeds = db.medicines.findMany();`,
  `async function enrichAndSummarizeMedicines(matched) {
  const allMeds = await db.medicines.findMany();`
);
content = content.replace(
  `const enrichedResult = enrichAndSummarizeMedicines(matched);`,
  `const enrichedResult = await enrichAndSummarizeMedicines(matched);`
); // Will replace in both /api/parse-prescription and /api/optimize-prescription-file

// 7. /api/parse-prescription db calls
content = content.replace(
  `const medicines = db.medicines.findMany();`,
  `const medicines = await db.medicines.findMany();`
); // This will replace all instances of this exact string! Let's check how many there are.
// Actually, it's safer to use replaceAll for `db.medicines.findMany()`
content = content.replaceAll(
  `const medicines = db.medicines.findMany();`,
  `const medicines = await db.medicines.findMany();`
);
content = content.replaceAll(
  `const allMeds = db.medicines.findMany();`,
  `const allMeds = await db.medicines.findMany();`
);

// 9. /api/stock/predict/:id
content = content.replace(
  `app.get('/api/stock/predict/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const medicine = db.medicines.findFirst(m => m.id === id);`,
  `app.get('/api/stock/predict/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const medicine = await db.medicines.findById(id);`
);

// 11. /api/disease-search db calls
content = content.replace(
  `app.get('/api/disease-search', (req, res) => {`,
  `app.get('/api/disease-search', async (req, res) => {`
);

// 13. /api/data-importer/crawl db calls
content = content.replace(
  `const saved = db.medicines.save(syncedData);`,
  `const saved = await db.medicines.save(syncedData);`
);

// 14. /api/data-importer/bulk-sync db calls
content = content.replace(
  `db.medicines.save(synced);`,
  `await db.medicines.save(synced);`
);

fs.writeFileSync('server.js', content, 'utf8');
console.log('server.js updated successfully!');
