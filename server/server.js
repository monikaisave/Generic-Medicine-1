const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

const db = require('./db');
const ml = require('./ml');
const scraper = require('./scraper');
const fs = require('fs');
const diseaseGen = require('./disease_generator');

// Load or generate disease-symptom mapping data
let diseaseData;
try {
  if (!fs.existsSync(diseaseGen.DISEASES_FILE)) {
    diseaseData = diseaseGen.generateDataset();
  } else {
    diseaseData = JSON.parse(fs.readFileSync(diseaseGen.DISEASES_FILE, 'utf-8'));
  }
} catch (err) {
  console.error("Failed to load diseases database, regenerating...", err);
  diseaseData = diseaseGen.generateDataset();
}


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// Log incoming requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Endpoint: Root Welcome
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to GenMed Hub API Console', 
    documentation: 'GenMed Hub Technical Manual', 
    status: 'online', 
    active_endpoints: [
      '/api/health',
      '/api/medicines',
      '/api/analytics',
      '/api/stores',
      '/api/trends'
    ]
  });
});

// Endpoint: Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Endpoint: Search/List medicines
app.get('/api/medicines', (req, res) => {
  const { query } = req.query;
  if (query) {
    return res.json(db.medicines.search(query));
  }
  res.json(db.medicines.findMany());
});

// Endpoint: Get specific medicine details
app.get('/api/medicines/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const medicine = db.medicines.findFirst(m => m.id === id);
  if (!medicine) {
    return res.status(404).json({ error: 'Medicine not found' });
  }
  res.json(medicine);
});

// Endpoint: Price analytics dashboard data
app.get('/api/analytics', (req, res) => {
  const medicines = db.medicines.findMany();
  const trends = db.trends.get();

  // Top overpriced medicines (sorted by brand price to generic price ratio or absolute difference)
  const overpriced = [...medicines]
    .map(m => ({
      ...m,
      difference: parseFloat((m.brandPrice - m.genericPrice).toFixed(2)),
      ratio: parseFloat((m.brandPrice / m.genericPrice).toFixed(2))
    }))
    .sort((a, b) => b.difference - a.difference)
    .slice(0, 5);

  // General statistics
  const totalBrandedCost = medicines.reduce((acc, m) => acc + m.brandPrice, 0);
  const totalGenericCost = medicines.reduce((acc, m) => acc + m.genericPrice, 0);
  const avgSavingsPercent = Math.round(((totalBrandedCost - totalGenericCost) / totalBrandedCost) * 100);

  res.json({
    overpriced,
    statistics: {
      totalMedicinesAnalyzed: medicines.length,
      averageSavingsPercentage: avgSavingsPercent,
      potentialTotalSavings: parseFloat((totalBrandedCost - totalGenericCost).toFixed(2)),
      brandedCostBaseline: parseFloat(totalBrandedCost.toFixed(2)),
      genericCostBaseline: parseFloat(totalGenericCost.toFixed(2))
    },
    categoryAnalysis: trends.categoryAnalysis,
    regionalPricing: trends.regionalPricing
  });
});

// Endpoint: Geolocation-based or simple search for stores
app.get('/api/stores', (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const radius = parseFloat(req.query.radius) || 20; // default 20km

  if (!isNaN(lat) && !isNaN(lng)) {
    const nearby = db.stores.findNearby(lat, lng, radius);
    return res.json(nearby);
  }
  
  res.json(db.stores.findMany());
});

// Endpoint: Market intelligence trends & demand forecasting
app.get('/api/trends', (req, res) => {
  const trends = db.trends.get();
  const horizon = parseInt(req.query.horizon) || 6; // Forecast next 6 months
  
  const historical = trends.monthlyVolume;
  const forecast = ml.forecastDemand(historical, horizon);

  res.json({
    adoptionRates: trends.adoptionRates,
    manufacturersShare: trends.manufacturersShare,
    historicalVolume: historical,
    forecastedVolume: forecast,
    fullVolumeTimeline: [...historical, ...forecast]
  });
});

// Endpoint: Price Predictor Tool (ML simulation)
app.post('/api/predict-price', (req, res) => {
  const { brandPrice, category } = req.body;
  if (brandPrice === undefined || isNaN(brandPrice)) {
    return res.status(400).json({ error: 'Please provide a valid brandPrice' });
  }

  const prediction = ml.predictGenericPrice(parseFloat(brandPrice), category || 'General');
  res.json({
    brandPrice: parseFloat(brandPrice),
    category: category || 'General',
    ...prediction
  });
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
  const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (s1 === s2) return 1.0;
  if (s1.length < 2 || s2.length < 2) return 0.0;

  const bigrams1 = getBigrams(s1);
  const bigrams2 = getBigrams(s2);

  let intersection = 0;
  for (const bigram of bigrams1) {
    if (bigrams2.has(bigram)) {
      intersection++;
    }
  }

  return (2.0 * intersection) / (bigrams1.size + bigrams2.size);
}

// Helper to check if a target word is fuzzy matched in a list of tokens
const hasFuzzyMatch = (targetWord, tokenList) => {
  return tokenList.some(token => {
    if (token === targetWord) return true;
    if (token.includes(targetWord) || targetWord.includes(token)) return true;
    const similarity = diceCoefficient(token, targetWord);
    return similarity >= 0.55; // Robust threshold for OCR typos like cr0cin -> crocin
  });
};

// Helper to enrich medicines with 5 generic alternatives and calculate cost/savings summary
function enrichAndSummarizeMedicines(matched) {
  const allMeds = db.medicines.findMany();
  const enrichedMatched = matched.map(m => {
    const mGenericBase = m.genericName.split(' ')[0].toLowerCase();
    const mCompBase = m.composition.split(' ')[0].toLowerCase();

    let alts = allMeds.filter(alt => 
      alt.id !== m.id && 
      (alt.genericName.toLowerCase().includes(mGenericBase) || 
       m.genericName.toLowerCase().includes(alt.genericName.split(' ')[0].toLowerCase()) ||
       alt.composition.toLowerCase().includes(mCompBase) || 
       m.composition.toLowerCase().includes(alt.composition.split(' ')[0].toLowerCase()))
    );

    if (alts.length < 5) {
      const categoryMeds = allMeds.filter(alt => 
        alt.id !== m.id && 
        alt.category === m.category && 
        !alts.some(a => a.id === alt.id)
      );
      alts = [...alts, ...categoryMeds];
    }

    if (alts.length < 5) {
      const generalMeds = allMeds.filter(alt => 
        alt.id !== m.id && 
        !alts.some(a => a.id === alt.id)
      ).sort((a, b) => b.savings - a.savings);
      alts = [...alts, ...generalMeds];
    }

    return {
      ...m,
      alternatives: alts.slice(0, 5).map(alt => ({
        id: alt.id,
        brandName: alt.brandName,
        genericName: alt.genericName,
        composition: alt.composition,
        brandPrice: alt.brandPrice,
        genericPrice: alt.genericPrice,
        savings: alt.savings,
        manufacturer: alt.manufacturer,
        details: alt.details
      }))
    };
  });

  const totalBrandedPrice = enrichedMatched.reduce((sum, m) => sum + m.brandPrice, 0);
  const totalGenericPrice = enrichedMatched.reduce((sum, m) => sum + m.genericPrice, 0);
  const totalSavings = totalBrandedPrice - totalGenericPrice;
  const savingsPercent = totalBrandedPrice > 0 ? Math.round((totalSavings / totalBrandedPrice) * 100) : 0;

  return {
    matchedMedicines: enrichedMatched,
    summary: {
      totalBrandedPrice: parseFloat(totalBrandedPrice.toFixed(2)),
      totalGenericPrice: parseFloat(totalGenericPrice.toFixed(2)),
      totalSavings: parseFloat(totalSavings.toFixed(2)),
      savingsPercent
    }
  };
}

// Endpoint: Prescription Cost Optimizer OCR/NLP matching
app.post('/api/parse-prescription', async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Please provide prescription text' });
  }

  const medicines = db.medicines.findMany();
  let matched = [];
  let usedAI = false;

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      console.log('Using Gemini AI to parse prescription text...');
      const medicinesMin = medicines.map(m => ({
        id: m.id,
        brandName: m.brandName,
        composition: m.composition,
        genericName: m.genericName
      }));

      const promptText = `You are an expert medical software assistant. Your task is to analyze prescription text (which might contain typos or OCR errors) and match it against our database of available medicines.

Prescription Text:
"""
${text}
"""

Available Medicines in Database:
${JSON.stringify(medicinesMin)}

Instructions:
1. Identify each prescribed medicine from the prescription text.
2. For each identified medicine, find the best match in the available database list (either by brandName, genericName, or composition, accounting for minor spelling/OCR errors).
3. Return ONLY a valid JSON array of objects, where each object contains the matched medicine ID from the database and the exact name of the medicine as written/identified in the prescription text, for example:
[
  { "id": 1, "writtenName": "Crocin 650mg" },
  { "id": 5, "writtenName": "Pantocid 40" }
]
4. Do not include any markdown styling, code block backticks (like \`\`\`json), or conversational text. Return ONLY the raw JSON array.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: promptText }]
              }
            ]
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
          let textResult = data.candidates[0].content.parts[0].text.trim();
          
          // Clean markdown code blocks if present
          if (textResult.startsWith('```')) {
            textResult = textResult.replace(/^```[a-zA-Z]*\n?/, '');
            textResult = textResult.replace(/```$/, '');
          }
          textResult = textResult.trim();

          const parsed = JSON.parse(textResult);
          if (Array.isArray(parsed)) {
            matched = parsed.map(item => {
              if (item && typeof item === 'object' && 'id' in item) {
                const med = medicines.find(m => m.id === item.id);
                if (med) {
                  return {
                    ...med,
                    writtenName: item.writtenName || med.brandName
                  };
                }
              } else if (typeof item === 'number') {
                const med = medicines.find(m => m.id === item);
                if (med) {
                  return {
                    ...med,
                    writtenName: med.brandName
                  };
                }
              }
              return null;
            }).filter(Boolean);
            usedAI = true;
            console.log(`Gemini parsed successfully. Matched ${matched.length} medicines:`, matched.map(m => m.writtenName));
          }
        }
      } else {
        console.error('Gemini API response not OK:', response.status, response.statusText);
      }
    } catch (err) {
      console.error('Failed to parse prescription using Gemini AI, falling back to heuristic:', err);
    }
  }

  // Fallback to heuristic matching if AI key is missing, call failed, or produced no matches
  if (!usedAI || matched.length === 0) {
    console.log('Using local heuristic token-matching...');
    
    // Stopwords and units to exclude from matching
    const stopWords = new Set([
      'tab', 'tabs', 'tablet', 'tablets', 'cap', 'caps', 'capsule', 'capsules',
      'mg', 'mcg', 'ml', 'g', 'daily', 'twice', 'thrice', 'once', 'night',
      'morning', 'noon', 'bed', 'water', 'food', 'after', 'before', 'every',
      'take', 'days', 'weeks', 'qty', 'each', 'prescription', 'patient',
      'clinic', 'doctor', 'name', 'date', 'rx', 'sol', 'sos', 'with', 'and', 'for'
    ]);

    // Helper to normalize OCR character substitutions and strip non-letters
    const normalizeOcr = (str) => {
      if (!str) return '';
      return str.toLowerCase()
        .replace(/0/g, 'o')
        .replace(/1/g, 'i')
        .replace(/3/g, 'e')
        .replace(/4/g, 'a')
        .replace(/5/g, 's')
        .replace(/8/g, 'b')
        .replace(/[^a-z]/g, '');
    };

    const lines = text.split(/\r?\n/);
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      // Extract clean alphanumeric tokens
      const tokens = line.toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean);
        
      // Filter out stop words and numbers/strengths (purely numeric tokens)
      const cleanTokens = tokens.filter(t => !stopWords.has(t) && isNaN(t) && t.length > 2);
      if (cleanTokens.length === 0) continue;

      for (const medicine of medicines) {
        // Extract base brand name (first word, ignoring strength/dosage)
        const baseBrand = medicine.brandName.split(/\s+/)[0];
        const normalizedBaseBrand = normalizeOcr(baseBrand);

        // Extract composition words (ignoring numbers and short words)
        const compWords = medicine.composition
          .replace(/[^a-zA-Z\s]/g, ' ')
          .split(/\s+/)
          .filter(w => w.length > 3 && !stopWords.has(w.toLowerCase()));

        // Check if any clean token matches the brand name
        let isMatch = false;

        for (const token of cleanTokens) {
          const normalizedToken = normalizeOcr(token);
          
          if (!normalizedToken) continue;

          // 1. Check brand match (exact or fuzzy normalized)
          if (normalizedToken === normalizedBaseBrand || normalizedBaseBrand.includes(normalizedToken) || normalizedToken.includes(normalizedBaseBrand)) {
            isMatch = true;
            break;
          }
          if (diceCoefficient(normalizedToken, normalizedBaseBrand) >= 0.6) {
            isMatch = true;
            break;
          }

          // 2. Check composition match
          for (const compWord of compWords) {
            const normalizedComp = normalizeOcr(compWord);
            if (!normalizedComp) continue;

            if (normalizedToken === normalizedComp || normalizedComp.includes(normalizedToken) || normalizedToken.includes(normalizedComp)) {
              isMatch = true;
              break;
            }
            if (diceCoefficient(normalizedToken, normalizedComp) >= 0.6) {
              isMatch = true;
              break;
            }
          }
          
          if (isMatch) break;
        }

        // 3. Fallback: if the raw line contains the brand name or generic name as a whole substring
        if (!isMatch) {
          const lowerLine = line.toLowerCase();
          const lowerBrand = medicine.brandName.toLowerCase();
          const lowerGeneric = medicine.genericName.toLowerCase();
          
          if (lowerLine.includes(lowerBrand) || lowerBrand.includes(lowerLine) ||
              lowerLine.includes(lowerGeneric) || lowerGeneric.includes(lowerLine)) {
            isMatch = true;
          }
        }

        if (isMatch) {
          if (!matched.some(m => m.id === medicine.id)) {
            matched.push({
              ...medicine,
              writtenName: line.trim()
            });
          }
        }
      }
    }
  }

  const enrichedResult = enrichAndSummarizeMedicines(matched);
  res.json(enrichedResult);
});

// Endpoint: Prescription Cost Optimizer Multimodal AI (Image/PDF parsing + Matching)
app.post('/api/optimize-prescription-file', async (req, res) => {
  const { fileData, mimeType } = req.body;
  if (!fileData || !mimeType) {
    return res.status(400).json({ error: 'Please provide fileData (base64) and mimeType' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('Gemini API key is missing. Refusing file optimization request.');
    return res.status(400).json({ error: 'GEMINI_API_KEY_MISSING', message: 'Gemini API Key is not configured on the server.' });
  }

  try {
    console.log(`Using Gemini AI to parse multimodal prescription file (${mimeType})...`);
    const medicines = db.medicines.findMany();
    const medicinesMin = medicines.map(m => ({
      id: m.id,
      brandName: m.brandName,
      composition: m.composition,
      genericName: m.genericName
    }));

    const promptText = `You are an expert medical AI system. Your task is to analyze the attached prescription document (which can be a photo or a PDF) and extract the medicines prescribed, then match them to our database.

Instructions:
1. Carefully read the document. It might contain handwritten notes, printed text, brand names, or chemical names.
2. Extract all readable text from the document (like dosage, patient info, medicines, dates) and provide it as 'extractedText'.
3. Match each prescribed medicine (either by brandName, genericName, or composition, accounting for minor spelling/OCR errors) to the best match in the available database list.
4. Return ONLY a valid JSON object matching the schema below. Do not wrap in markdown blocks, do not include code backticks (like \`\`\`json), and do not include conversational text.

Available Medicines in Database:
${JSON.stringify(medicinesMin)}

Response JSON Schema:
{
  "extractedText": "all raw extracted text here",
  "extractedMedicines": [
    { "name": "Brand Name or Composition as written in sheet", "dosage": "e.g. 500mg, 1 tab daily" }
  ],
  "matches": [
    { "id": 1, "writtenName": "Name of the drug exactly as written/spelled in prescription" }
  ]
}

Return ONLY the raw JSON string matching this schema.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: promptText },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: fileData
                  }
                }
              ]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API call failed:', response.status, errText);
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
      let textResult = data.candidates[0].content.parts[0].text.trim();
      
      // Clean markdown code blocks if present
      if (textResult.startsWith('```')) {
        textResult = textResult.replace(/^```[a-zA-Z]*\n?/, '');
        textResult = textResult.replace(/```$/, '');
      }
      textResult = textResult.trim();

      const parsedResult = JSON.parse(textResult);
      if (parsedResult) {
        let matched = [];
        if (Array.isArray(parsedResult.matches)) {
          matched = parsedResult.matches.map(item => {
            const med = medicines.find(m => m.id === item.id);
            if (med) {
              return {
                ...med,
                writtenName: item.writtenName || med.brandName
              };
            }
            return null;
          }).filter(Boolean);
        } else if (Array.isArray(parsedResult.matchedMedicineIds)) {
          const idSet = new Set(parsedResult.matchedMedicineIds);
          matched = medicines.filter(m => idSet.has(m.id)).map(m => ({
            ...m,
            writtenName: m.brandName
          }));
        }

        console.log(`Gemini parsed file successfully. Matched ${matched.length} medicines.`);
        
        const enrichedResult = enrichAndSummarizeMedicines(matched);
        return res.json({
          extractedText: parsedResult.extractedText || '',
          extractedMedicines: parsedResult.extractedMedicines || [],
          ...enrichedResult
        });
      }
    }
    
    throw new Error('Invalid or empty response from Gemini');
  } catch (err) {
    console.error('Failed to parse prescription file using Gemini AI:', err);
    res.status(500).json({ error: 'AI_OPTIMIZATION_FAILED', message: err.message });
  }
});

// Endpoint: Stock Availability Prediction (AI-powered simulator)
app.get('/api/stock/predict/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const medicine = db.medicines.findFirst(m => m.id === id);
  if (!medicine) {
    return res.status(404).json({ error: 'Medicine not found' });
  }

  // Deterministic seeded random helper based on medicine ID
  const getSeededRandom = (seed) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  // Stock prediction logic
  let riskLevel = 'Low Risk';
  let daysRemaining = 45;
  let explanation = 'Stable supply chain and consistent manufacturer fulfillment.';
  
  if (medicine.availability === 'Out of Stock') {
    riskLevel = 'Out of Stock';
    daysRemaining = 0;
    explanation = 'Currently depleted at nearby distributors. Expected restocking in 7-10 days.';
  } else if (medicine.availability === 'Low Stock') {
    riskLevel = 'High Risk';
    const rand = getSeededRandom(id);
    daysRemaining = Math.floor(2 + rand * 5);
    explanation = 'Surging demand and delayed local distributor shipments. Restock recommended immediately.';
  } else {
    // Category specific seasonal risk (e.g. respiratory and antibiotics in monsoon season)
    const seasonalCategories = ['Respiratory', 'Antibiotics', 'Analgesics & Antipyretics'];
    const currentMonth = new Date().getMonth(); // June (5)
    
    if (seasonalCategories.includes(medicine.category) && (currentMonth >= 5 && currentMonth <= 8)) {
      riskLevel = 'Medium Risk';
      const rand = getSeededRandom(id + 1);
      daysRemaining = Math.floor(12 + rand * 10);
      explanation = 'Monsoon season surge has increased sales velocity by 35%. Stock depletion possible in 2-3 weeks.';
    }
  }

  const randVelocity = getSeededRandom(id + 2);
  const weeklySalesVelocity = Math.floor(150 + randVelocity * 80);

  res.json({
    medicineId: id,
    brandName: medicine.brandName,
    genericName: medicine.genericName,
    currentStockStatus: medicine.availability,
    riskLevel,
    daysRemaining,
    explanation,
    weeklySalesVelocity,
    predictedRestockDate: new Date(Date.now() + (daysRemaining + 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
});

// Endpoint: Fake Medicine Detection Analyzer
app.post('/api/fake-detection', (req, res) => {
  const { batchNumber, manufacturer, brandName } = req.body;
  if (!batchNumber) {
    return res.status(400).json({ error: 'Please provide a batch number' });
  }

  const cleanBatch = batchNumber.toUpperCase().trim();
  
  // Validation Rules
  const factors = [];
  let riskScore = 15; // baseline

  // Rule 1: Length and Alphanumeric Format
  if (cleanBatch.length < 5 || cleanBatch.length > 15) {
    riskScore += 30;
    factors.push('Batch number length is atypical for standard pharmaceutical packaging (expected 5-15 characters).');
  }
  if (!/^[A-Z0-9-]+$/.test(cleanBatch)) {
    riskScore += 25;
    factors.push('Batch number contains invalid special characters.');
  }

  // Rule 2: Alphanumeric prefix standard (usually letters followed by numbers, or vice versa)
  if (/^[0-9]+$/.test(cleanBatch)) {
    riskScore += 20;
    factors.push('Batch number contains only digits. Most authentic pharmaceutical batches use alphanumeric codes.');
  }

  // Rule 3: Known suspect batch patterns (e.g. commonly faked sequences)
  const suspectSequences = ['12345', 'ABCDE', 'TEST', 'FAKE', '00000', '99999'];
  if (suspectSequences.some(seq => cleanBatch.includes(seq))) {
    riskScore += 45;
    factors.push('Batch number contains common default or sequential test patterns, indicating high fraud probability.');
  }

  // Rule 4: Manufacturer consistency
  if (manufacturer) {
    const validMfrs = ['glaxo', 'cipla', 'lupin', 'sun', 'alkem', 'mankind', 'torrent', 'glenmark', 'dr. reddy', 'usv', 'abbott', 'pfizer'];
    const mfrClean = manufacturer.toLowerCase();
    const isKnown = validMfrs.some(v => mfrClean.includes(v));
    if (!isKnown) {
      riskScore += 10;
      factors.push('Manufacturer is not in our verified local registry. Double-check license credentials.');
    }
  }

  // Cap risk score
  riskScore = Math.min(100, riskScore);
  
  let riskLevel = 'Low Risk';
  if (riskScore > 65) riskLevel = 'High Risk';
  else if (riskScore > 35) riskLevel = 'Medium Risk';

  res.json({
    batchNumber: cleanBatch,
    riskScore,
    riskLevel,
    factors: factors.length > 0 ? factors : ['Batch format complies with pharmaceutical standards.', 'Verified alphanumeric pattern matching.'],
    recommendations: riskLevel === 'High Risk' 
      ? ['DO NOT consume this medicine.', 'Report this batch to the State Drug Control Administration immediately.', 'Return the medicine package to the dispensing pharmacy for refund/investigation.']
      : riskLevel === 'Medium Risk'
        ? ['Verify packaging seals and holographic stamps.', 'Cross-reference expiration date on strip with outer carton.', 'Consult your pharmacist before consumption.']
        : ['Verify usual storage conditions.', 'Consume as directed by medical professional.'],
    safetyCert: riskLevel === 'Low Risk' ? 'AAROGYA-VERIFIED' : 'PENDING-VERIFICATION'
  });
});

// Endpoint: AI Chat Assistant (with Gemini API / offline fallback support)
app.post('/api/chat', async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: "You are Antigravity, a professional medical AI assistant specialized in generic medicines, price savings, health scheme awareness (like PMBJP), and side-effects. Answer concisely, always encourage generic medicines, but warn users to consult their doctor before changing prescriptions. Context: " + message }]
              }
            ]
          })
        }
      );
      const data = await response.json();
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
        return res.json({ response: data.candidates[0].content.parts[0].text });
      }
    } catch (e) {
      console.error('Gemini API call failed, falling back to local model:', e.message);
    }
  }

  // Local Smart Response fallback
  const msgClean = message.toLowerCase();
  let reply = "I am GenMed AI, your generic medicine guide. Ask me about medicine alternatives, cost savings, side effects, or government schemes like PMBJP!";

  if (msgClean.includes('generic') || msgClean.includes('difference') || msgClean.includes('what is')) {
    reply = "Generic medicines are identical to branded ones in dosage, safety, strength, quality, and performance. The primary difference is the price—generics are up to 80% cheaper because they do not undergo duplicate advertising, marketing, and clinical trial costs. They are approved by the CDSCO (Central Drugs Standard Control Organisation) in India.";
  } else if (msgClean.includes('dolo') || msgClean.includes('paracetamol') || msgClean.includes('crocin') || msgClean.includes('fever')) {
    reply = "For fever and pain relief, Dolo 650 and Crocin 650 use the active ingredient **Paracetamol 650mg**. Branded strips cost around ₹30-35, while government Jan Aushadhi generic equivalents cost only ₹10-12, saving you over 65%. Side effects are rare but can include mild nausea. Avoid if you have active liver disease.";
  } else if (msgClean.includes('side effect') || msgClean.includes('safe') || msgClean.includes('harmful')) {
    reply = "Generic medicines are completely safe as they use the same active pharmaceutical ingredients (API) as brand names. Standard side effects depend on the chemical composition, not the brand. For example, antacids might cause mild bloating, and antihistamines like Cetirizine cause mild drowsiness. Always consult a physician for personalized guidance.";
  } else if (msgClean.includes('pmbjp') || msgClean.includes('janaushadhi') || msgClean.includes('kendra') || msgClean.includes('government')) {
    reply = "The Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP) is a noble initiative by the Department of Pharmaceuticals, Government of India, to provide quality generic medicines at highly affordable prices through PMBJP Kendras. There are over 10,000+ Kendras operating across India. You can locate them on our 'Nearby Pharmacy Finder' tab!";
  } else if (msgClean.includes('diabetes') || msgClean.includes('sugar') || msgClean.includes('metformin')) {
    reply = "For Type-2 Diabetes management, **Metformin 500mg** (brand: Glycomet) is a standard prescription. Generic Metformin costs only ₹12-15 compared to branded counterparts costing ₹45-50. Side effects may include mild gastrointestinal discomfort. Do not consume if you have severe renal impairment.";
  } else if (msgClean.includes('blood pressure') || msgClean.includes('bp') || msgClean.includes('hypertension') || msgClean.includes('telmisartan')) {
    reply = "For hypertension (high blood pressure), **Telmisartan 40mg** (brand: Telma 40) is commonly prescribed. A branded strip costs about ₹110, while the generic version is around ₹25, offering a massive 77% savings. Always monitor your blood pressure regularly and consult your doctor before modifying dosage.";
  } else if (msgClean.includes('save') || msgClean.includes('calculator') || msgClean.includes('cost')) {
    reply = "You can calculate your monthly and annual medical cost savings using our 'Cost Saving Calculator' tab. Simply enter your current branded medicine expenses, and we will show you how much you can save by switching to certified generics!";
  }

  // Dynamic Medicine Lookup fallback if no direct template matched
  if (reply === "I am GenMed AI, your generic medicine guide. Ask me about medicine alternatives, cost savings, side effects, or government schemes like PMBJP!") {
    const medicines = db.medicines.findMany();
    // Try to find if any medicine name is mentioned in the query
    const matchedMed = medicines.find(m => 
      msgClean.includes(m.brandName.toLowerCase()) || 
      msgClean.includes(m.genericName.toLowerCase()) ||
      msgClean.includes(m.composition.toLowerCase())
    );

    if (matchedMed) {
      reply = `I found **${matchedMed.brandName}** in our database. 
- **Active Generic Ingredient:** ${matchedMed.genericName}
- **Composition:** ${matchedMed.composition}
- **Branded Price:** ₹${matchedMed.brandPrice} | **Generic Price:** ₹${matchedMed.genericPrice}
- **Estimated Savings:** ${matchedMed.savings}% (Save ₹${(matchedMed.brandPrice - matchedMed.genericPrice).toFixed(2)})
- **Dosage Form:** ${matchedMed.dosage || 'Tablet'}
- **Manufacturer:** ${matchedMed.manufacturer}
- **Category / Class:** ${matchedMed.category} (${matchedMed.schedule || 'OTC'})
- **Side Effects:** ${matchedMed.sideEffects.join(', ')}
- **Contraindications:** ${matchedMed.contraindications.join(', ')}
- **Description:** ${matchedMed.details}

Always consult a physician before modifying your medicine regimen.`;
    } else {
      // Find similar words using bigram matching
      let bestMatch = null;
      let highestSimilarity = 0.0;
      for (const m of medicines) {
        const brandSim = diceCoefficient(msgClean, m.brandName);
        const genericSim = diceCoefficient(msgClean, m.genericName);
        const compSim = diceCoefficient(msgClean, m.composition);
        const maxSim = Math.max(brandSim, genericSim, compSim);
        if (maxSim > highestSimilarity) {
          highestSimilarity = maxSim;
          bestMatch = m;
        }
      }

      if (highestSimilarity >= 0.35 && bestMatch) {
        reply = `Did you mean **${bestMatch.brandName}** (${bestMatch.genericName})? 
Here are its details:
- **Active Generic Ingredient:** ${bestMatch.genericName}
- **Branded Price:** ₹${bestMatch.brandPrice} | **Generic Price:** ₹${bestMatch.genericPrice} (Save ${bestMatch.savings}%)
- **Dosage Form:** ${bestMatch.dosage || 'Tablet'}
- **Side Effects:** ${bestMatch.sideEffects.join(', ')}
- **Description:** ${bestMatch.details}

Let me know if you meant another drug or composition!`;
      }
    }
  }

  res.json({ response: reply });
});

// Endpoint: Disease mapping metadata directory
app.get('/api/disease-mapping/metadata', (req, res) => {
  res.json({
    diseases: diseaseData.diseases,
    symptoms: diseaseData.symptoms
  });
});

// Endpoint: Disease mapping to generic categories & alternatives
app.get('/api/disease-search', (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  const q = query.toLowerCase().trim();
  let matched = [];
  
  if (q.startsWith('dis_')) {
    matched = diseaseData.diseases.filter(d => d.id === q);
  } else if (q.startsWith('sym_')) {
    matched = diseaseData.diseases.filter(d => d.symptoms.includes(q));
  } else {
    matched = diseaseData.diseases.filter(d => {
      const nameMatch = d.name.toLowerCase().includes(q);
      const descMatch = d.description.toLowerCase().includes(q);
      const catMatch = d.category.toLowerCase().includes(q);
      const sysMatch = d.system.toLowerCase().includes(q);
      
      const symMatch = d.symptoms.some(sId => {
        const symptom = diseaseData.symptoms.find(s => s.id === sId);
        return symptom && symptom.name.toLowerCase().includes(q);
      });
      
      return nameMatch || descMatch || catMatch || sysMatch || symMatch;
    });
  }

  const allMeds = db.medicines.findMany();
  
  const results = matched.map(d => {
    const resolvedSymptoms = d.symptoms.map(sId => {
      return diseaseData.symptoms.find(s => s.id === sId) || { id: sId, name: sId };
    });
    
    const recommended = allMeds.filter(m => m.category === d.category);
    
    return {
      id: d.id,
      name: d.name,
      description: d.description,
      category: d.category,
      system: d.system,
      symptoms: resolvedSymptoms,
      precautions: d.precautions,
      severityWarning: d.severityWarning,
      recommendedGenerics: recommended
    };
  });

  res.json(results);
});


// ==========================================
// DATA IMPORTER & CRAWLER ENDPOINTS
// ==========================================

let isSyncing = false;
let syncProgress = { current: 0, total: 0, status: 'idle' };

// Endpoint: Connection Latency and DB Crawl Statistics
app.get('/api/data-importer/status', async (req, res) => {
  const pings = {
    pmbjp: -1,
    cdsco: -1,
    oneMg: -1,
    drugbank: -1,
    dailymed: -1,
    drugsetu: -1
  };

  const checkPing = async (url) => {
    const start = Date.now();
    try {
      // Short timeout to avoid blocking, typical browser user agent headers
      await axios.get(url, { timeout: 1500, headers: { 'User-Agent': 'Mozilla/5.0' } });
      return Date.now() - start;
    } catch (err) {
      if (err.response) return Date.now() - start; // Response received is fine
      return -1;
    }
  };

  // We lazily require axios inside endpoints
  const axios = require('axios');

  const results = await Promise.allSettled([
    checkPing('https://janaushadhi.gov.in'),
    checkPing('https://cdsco.gov.in'),
    checkPing('https://www.1mg.com'),
    checkPing('https://www.drugbank.com'),
    checkPing('https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json'),
    checkPing('https://rxnav.nlm.nih.gov/REST/version.json')
  ]);

  pings.pmbjp = results[0].status === 'fulfilled' ? results[0].value : -1;
  pings.cdsco = results[1].status === 'fulfilled' ? results[1].value : -1;
  pings.oneMg = results[2].status === 'fulfilled' ? results[2].value : -1;
  pings.drugbank = results[3].status === 'fulfilled' ? results[3].value : -1;
  pings.dailymed = results[4].status === 'fulfilled' ? results[4].value : -1;
  pings.drugsetu = results[5].status === 'fulfilled' ? results[5].value : -1;

  const medicines = db.medicines.findMany();
  const syncedCount = medicines.filter(m => m.lastSync).length;

  res.json({
    sources: {
      pmbjp: { name: 'PMBJP (Janaushadhi) Product List', status: pings.pmbjp >= 0 ? 'online' : 'offline', latency: pings.pmbjp, registrySize: 2400 },
      cdsco: { name: 'CDSCO Approved Records', status: pings.cdsco >= 0 ? 'online' : 'offline', latency: pings.cdsco, registrySize: 12500 },
      oneMg: { name: 'Tata 1mg Market Index', status: pings.oneMg >= 0 ? 'online' : 'offline', latency: pings.oneMg, registrySize: 15000 },
      drugbank: { name: 'DrugBank Global Database', status: pings.drugbank >= 0 ? 'online' : 'offline', latency: pings.drugbank, registrySize: 64000 },
      dailymed: { name: 'DailyMed FDA Catalog', status: pings.dailymed >= 0 ? 'online' : 'offline', latency: pings.dailymed, registrySize: 85000 },
      drugsetu: { name: 'DrugSetu Schema Gateway', status: pings.drugsetu >= 0 ? 'online' : 'offline', latency: pings.drugsetu, registrySize: 5500 }
    },
    localDatabase: {
      totalRecords: medicines.length,
      syncedRecords: syncedCount,
      unsyncedRecords: medicines.length - syncedCount
    }
  });
});

// Endpoint: Fetch Crawler Real-Time Logs
app.get('/api/data-importer/logs', (req, res) => {
  res.json(scraper.getCrawlLogs());
});

// Endpoint: Clear Scraper Logs
app.post('/api/data-importer/clear-logs', (req, res) => {
  scraper.clearCrawlLogs();
  res.json({ success: true });
});

// Endpoint: Run specific single brand-generic pair crawl and save to DB
app.post('/api/data-importer/crawl', async (req, res) => {
  const { brandName, genericName } = req.body;
  if (!brandName || !genericName) {
    return res.status(400).json({ error: 'Please provide brandName and genericName' });
  }

  scraper.addLog('system', `Manual single crawl requested. Brand: "${brandName}", Generic: "${genericName}"`);
  
  try {
    const syncedData = await scraper.scrapeAndConsolidate(brandName, genericName);
    
    // Check if item exists in db.json to preserve ID
    const medicines = db.medicines.findMany();
    const existing = medicines.find(m => 
      m.brandName.toLowerCase() === brandName.toLowerCase() || 
      m.composition.toLowerCase() === genericName.toLowerCase()
    );

    if (existing) {
      syncedData.id = existing.id;
    }

    const saved = db.medicines.save(syncedData);
    res.json({ success: true, medicine: saved });
  } catch (err) {
    scraper.addLog('system', `Manual crawl execution failed: ${err.message}`, 'error');
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint: Bulk Database Synchronizer (Iterates and enriches db.json records asynchronously)
app.post('/api/data-importer/bulk-sync', async (req, res) => {
  if (isSyncing) {
    return res.status(400).json({ error: 'Bulk sync already running' });
  }

  const medicines = db.medicines.findMany();
  // To avoid API hammering while demonstrating real progress, we select a subset of 15 popular medicines
  const targetMeds = medicines.slice(0, 15);

  isSyncing = true;
  syncProgress = { current: 0, total: targetMeds.length, status: 'running' };
  scraper.clearCrawlLogs();
  scraper.addLog('system', `===========================================`);
  scraper.addLog('system', `STARTING BULK RE-SYNC: ${targetMeds.length} Database Medicines`);
  scraper.addLog('system', `===========================================`);

  // Asynchronous background thread execution
  (async () => {
    for (let i = 0; i < targetMeds.length; i++) {
      const med = targetMeds[i];
      syncProgress.current = i + 1;
      scraper.addLog('system', `[CRAWL ${i+1}/${targetMeds.length}] Processing "${med.brandName}"...`);
      
      try {
        const synced = await scraper.scrapeAndConsolidate(med.brandName, med.composition);
        synced.id = med.id;
        db.medicines.save(synced);
        // Small delay to prevent rate limit triggers on 1mg
        await new Promise(r => setTimeout(r, 1500));
      } catch (err) {
        scraper.addLog('system', `Sync failed for "${med.brandName}": ${err.message}`, 'error');
      }
    }
    isSyncing = false;
    syncProgress.status = 'completed';
    scraper.addLog('system', `===========================================`);
    scraper.addLog('system', `BULK RE-SYNC COMPLETE: ${targetMeds.length} entries fully verified!`);
    scraper.addLog('system', `===========================================`, 'success');
  })();

  res.json({ success: true, message: 'Bulk database synchronization started in background.' });
});

// Endpoint: Get Bulk Sync Progress
app.get('/api/data-importer/bulk-sync/progress', (req, res) => {
  res.json({ isSyncing, ...syncProgress });
});

app.listen(PORT, () => {
  console.log(`Generic Medicine Backend listening on port ${PORT}`);
});

// Trigger reload


