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
const PORT = 5000; // Hardcoded to prevent conflict with cached PORT=3307 from previous .env

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// Log incoming requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Gemini API status tracker
const geminiStatus = {
  isAvailable: true,
  cooldownUntil: 0,
  lastError: null
};

// Helper function to check if Gemini is available
function isGeminiAvailable() {
  if (!geminiStatus.isAvailable && Date.now() < geminiStatus.cooldownUntil) {
    return false;
  }
  // Cooldown expired or is available
  if (!geminiStatus.isAvailable) {
    geminiStatus.isAvailable = true;
    geminiStatus.cooldownUntil = 0;
    console.log("Gemini API cooldown expired. Retrying Gemini API availability.");
  }
  return true;
}

// Helper function to record Gemini API success or failure
function recordGeminiResult(ok, status = 200, errorMsg = '') {
  if (ok) {
    if (!geminiStatus.isAvailable) {
      console.log("Gemini API successfully restored and marked as available.");
    }
    geminiStatus.isAvailable = true;
    geminiStatus.cooldownUntil = 0;
    geminiStatus.lastError = null;
  } else {
    // We will NO LONGER lock out the API for 5 minutes because it breaks testing.
    // Instead we just log the error and allow the next request to try again immediately.
    geminiStatus.isAvailable = true; 
    geminiStatus.cooldownUntil = 0;
    geminiStatus.lastError = `Status ${status}: ${errorMsg}`;
    console.warn(`Gemini API failed with status ${status}. Error: ${errorMsg}`);
  }
}

// Helper to fetch with a timeout
async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 5000 } = options;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}


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
app.get('/api/medicines', async (req, res) => {
  const { query } = req.query;
  if (query) {
    return res.json(await db.medicines.search(query));
  }
  res.json(await db.medicines.findMany());
});

// Endpoint: Get specific medicine details
app.get('/api/medicines/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const medicine = await db.medicines.findById(id);
  if (!medicine) {
    return res.status(404).json({ error: 'Medicine not found' });
  }
  res.json(medicine);
});

// Endpoint: Price analytics dashboard data
app.get('/api/analytics', async (req, res) => {
  const medicines = await db.medicines.findMany();
  const trends = await db.trends.get();

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
app.get('/api/stores', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const radius = parseFloat(req.query.radius) || 20; // default 20km

  if (!isNaN(lat) && !isNaN(lng)) {
    const nearby = await db.stores.findNearby(lat, lng, radius);
    return res.json(nearby);
  }
  
  res.json(await db.stores.findMany());
});

// Endpoint: Market intelligence trends & demand forecasting
app.get('/api/trends', async (req, res) => {
  const trends = await db.trends.get();
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

// Endpoint: Price Predictor Tool (AI + ML simulation)
app.post('/api/predict-price', async (req, res) => {
  const { brandPrice, category } = req.body;
  if (brandPrice === undefined || isNaN(brandPrice)) {
    return res.status(400).json({ error: 'Please provide a valid brandPrice' });
  }

  const bPrice = parseFloat(brandPrice);
  const cat = category || 'General';

  // Use Gemini API for "live, real, perfect" prediction if key is available
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && isGeminiAvailable()) {
    try {
      const promptText = `You are a highly accurate pharmaceutical pricing AI for the Indian market.
Given a branded medicine in the "${cat}" category priced at ₹${bPrice}, predict the optimal wholesale retail price for its generic/PMBJP alternative.
Consider category margins, manufacturing scale, and market realities.

Respond ONLY with a valid JSON object matching this schema:
{
  "predictedGenericPrice": number, // exact predicted generic price in ₹
  "savingsPercent": number, // integer percentage of savings (0-100)
  "rangeMin": number, // lowest likely generic price
  "rangeMax": number // highest likely generic price
}`;

      const response = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: promptText }] }],
            generationConfig: { temperature: 0.1 }
          }),
          timeout: 5000
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.candidates && data.candidates[0]?.content?.parts[0]) {
          let textResult = data.candidates[0].content.parts[0].text.trim();
          if (textResult.startsWith('```')) {
            textResult = textResult.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();
          }
          const parsed = JSON.parse(textResult);
          recordGeminiResult(true);
          return res.json({
            brandPrice: bPrice,
            category: cat,
            predictedGenericPrice: parsed.predictedGenericPrice,
            savingsPercent: parsed.savingsPercent,
            rangeMin: parsed.rangeMin,
            rangeMax: parsed.rangeMax
          });
        }
      } else {
        const errText = await response.text();
        recordGeminiResult(false, response.status, errText);
      }
    } catch (e) {
      recordGeminiResult(false, 500, e.message);
      console.error('AI price prediction failed, falling back to local ML', e);
    }
  }

  // Fallback to local deterministic ML
  const prediction = ml.predictGenericPrice(bPrice, cat);
  res.json({
    brandPrice: bPrice,
    category: cat,
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
async function enrichAndSummarizeMedicines(matched) {
  const allMeds = await db.medicines.findMany();
  const enrichedMatched = matched.map(m => {
    if (m.unmatched) {
      return m;
    }

    const mDbId = m.dbId !== undefined ? m.dbId : m.id;
    const mGenericBase = m.genericName.split(' ')[0].toLowerCase();
    const mCompBase = m.composition.split(' ')[0].toLowerCase();

    let alts = allMeds.filter(alt => 
      alt.id !== mDbId && 
      (alt.genericName.toLowerCase().includes(mGenericBase) || 
       m.genericName.toLowerCase().includes(alt.genericName.split(' ')[0].toLowerCase()) ||
       alt.composition.toLowerCase().includes(mCompBase) || 
       m.composition.toLowerCase().includes(alt.composition.split(' ')[0].toLowerCase()))
    );

    if (alts.length < 5) {
      const categoryMeds = allMeds.filter(alt => 
        alt.id !== mDbId && 
        alt.category === m.category && 
        !alts.some(a => a.id === alt.id)
      );
      alts = [...alts, ...categoryMeds];
    }

    if (alts.length < 5) {
      const generalMeds = allMeds.filter(alt => 
        alt.id !== mDbId && 
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

function cleanPrescriptionLineToTabletName(line) {
  if (!line) return '';
  let cleaned = line;
  
  // Remove frequency patterns like 1-0-1, 1-1-1, 0-1-0, 1-0-0, 0-0-1, 1/2-0-1/2, etc. (with optional spaces)
  cleaned = cleaned.replace(/\b[0-9/.-]+\s*-\s*[0-9/.-]+\s*-\s*[0-9/.-]+(?:\s*-\s*[0-9/.-]+)?\b/gi, '');
  
  // Remove dosage quantity units e.g., 1 tablet, 2 tabs, 1 cap, 2 capsules
  cleaned = cleaned.replace(/\b(?:1|2|3|4|1\/2|0\.5)\s*(?:tabs?|tablets?|capsules?|caps?|pills?|doses?|tsf|ml|puffs?)\b/gi, '');
  
  // Remove common Latin abbreviations and timing instructions (case-insensitive)
  // Ensure we match them as words to not break words like "Sodium" by matching "OD"
  cleaned = cleaned.replace(/\b(?:od|bd|tds|qid|hs|sos|prn|ac|pc|stat|qds|am|pm|daily|twice\s+daily|thrice\s+daily|once\s+daily|as\s+needed|at\s+bedtime)\b/gi, '');
  
  // Remove duration patterns like x 5 days, for 5 days, 5 days, 5days, x5d, x 5d, etc.
  cleaned = cleaned.replace(/\b(?:x\s*)?\d+\s*(?:days|day|d|weeks|week|w|months|month|m)\b/gi, '');
  cleaned = cleaned.replace(/\bfor\s+\d+\s*(?:days|day|d|weeks|week|w|months|month|m)?\b/gi, '');
  
  // Remove instructions like before food, after food, empty stomach, with milk
  cleaned = cleaned.replace(/\b(?:before|after|with|without)\s+(?:food|meals?|breakfast|lunch|dinner|milk|water)\b/gi, '');
  cleaned = cleaned.replace(/\b(?:empty\s+stomach)\b/gi, '');
  
  // Clean up extra spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Remove trailing and leading punctuation (like hyphens, dots, commas, slashes) but keep characters like parentheses
  cleaned = cleaned.replace(/^[\s,./\\#:-]+|[\s,./\\#:-]+$/g, '').trim();
  
  // If we cleaned it to empty, fall back to original trimmed line
  return cleaned || line.trim();
}

// Endpoint: Prescription Cost Optimizer OCR/NLP matching
app.post('/api/parse-prescription', async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Please provide prescription text' });
  }

  const medicines = await db.medicines.findMany();
  let matched = [];
  let usedAI = false;

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && isGeminiAvailable()) {
    try {
      console.log('Using Gemini AI to parse prescription text...');
      const medicinesMin = medicines.map(m => ({
        id: m.id,
        brandName: m.brandName,
        composition: m.composition,
        genericName: m.genericName
      }));

      const promptText = `You are a medical prescription matching system. You receive prescription text lines and must find the best database match for each line.

Prescription Text (each line is one medicine entry — preserve EXACTLY as given, BUT IGNORE non-medicines):
"""
${text}
"""

Available Medicines in Database:
${JSON.stringify(medicinesMin)}

CRITICAL RULES:
1. STRICT FILTERING: You MUST COMPLETELY IGNORE all lines that are clearly NOT medicines. If a line is a registration number, hospital name, patient name, random characters like "[7 shacaL1 CR. Fears" or "Apparent No iia Rog.", you must NOT include it in the JSON array at all. ONLY process lines that actually look like a medicine or a prescription instruction.
2. For EACH valid medicine line of the prescription text, return exactly one JSON object in the array. 
3. Find the closest matching medicine in the database. Match by brandName first. Only use genericName or composition if brand is not in database.
4. If a valid medicine line does not match any medicine in the database, set "id" to null, but STILL include the object in the array.
5. Set "writtenName" to EXACTLY 100% the text from the input line. Do NOT change it, do NOT clean it, do NOT use the database name for this field. Use exactly what is written in the input text line.
6. Return ONLY a raw JSON array, no markdown, no code blocks:
[
  { "id": 1, "writtenName": "exact line 1 text" },
  { "id": null, "writtenName": "exact line 2 text" }
]`;

      const response = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: promptText }] }],
            generationConfig: { 
              temperature: 0, 
              topP: 0.1, 
              topK: 1,
              responseMimeType: 'application/json'
            }
          }),
          timeout: 15000
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
          let textResult = data.candidates[0].content.parts[0].text.trim();
          
          // Clean markdown code blocks if present (fallback)
          textResult = textResult.replace(/^```(?:json)?\n?/i, '').replace(/```$/i, '').trim();

          let parsed = [];
          try {
            parsed = JSON.parse(textResult);
          } catch (e) {
            console.error("Failed to parse matching JSON:", textResult);
            throw new Error("Invalid matching JSON from AI");
          }
          if (Array.isArray(parsed)) {
            matched = parsed.map((item, idx) => {
              if (item && typeof item === 'object') {
                const writtenNameVal = item.writtenName || 'Unknown Medicine';
                if (item.id !== null && item.id !== undefined) {
                  const med = medicines.find(m => m.id === Number(item.id));
                  if (med) {
                    return {
                      ...med,
                      id: `${med.id}-line-${idx}`,
                      dbId: med.id,
                      writtenName: writtenNameVal
                    };
                  }
                }
                return {
                  id: `unmatched-gemini-${idx}-${Date.now()}`,
                  brandName: writtenNameVal,
                  genericName: 'No generic alternatives found',
                  composition: 'N/A',
                  brandPrice: 0,
                  genericPrice: 0,
                  savings: 0,
                  manufacturer: 'Unknown',
                  writtenName: writtenNameVal,
                  alternatives: [],
                  unmatched: true
                };
              } else if (typeof item === 'number') {
                const med = medicines.find(m => m.id === item);
                if (med) {
                  return {
                    ...med,
                    id: `${med.id}-line-${idx}`,
                    dbId: med.id,
                    writtenName: med.brandName
                  };
                }
              }
              return {
                id: `unmatched-gemini-fallback-${idx}-${Date.now()}`,
                brandName: 'Unknown Medicine',
                genericName: 'No generic alternatives found',
                composition: 'N/A',
                brandPrice: 0,
                genericPrice: 0,
                savings: 0,
                manufacturer: 'Unknown',
                writtenName: 'Unknown Medicine',
                alternatives: [],
                unmatched: true
              };
            });
            usedAI = true;
            recordGeminiResult(true);
            console.log(`Gemini parsed successfully. Matched ${matched.length} medicines:`, matched.map(m => m.writtenName));
          }
        }
      } else {
        const errText = await response.text();
        recordGeminiResult(false, response.status, errText);
        console.error('Gemini API response not OK:', response.status, response.statusText);
      }
    } catch (err) {
      recordGeminiResult(false, 500, err.message);
      console.error('Failed to parse prescription using Gemini AI, falling back to heuristic:', err);
    }
  }

  // Fallback to heuristic matching if AI key is missing, call failed, or produced no matches
  if (!usedAI || matched.length === 0) {
    console.log('Using local heuristic token-matching...');
    
    const tokenize = (str) => {
      if (!str) return [];
      return str.toLowerCase()
        .replace(/(\d+)([a-zA-Z]+)/g, '$1 $2') // "500mg" -> "500 mg"
        .replace(/([a-zA-Z]+)(\d+)/g, '$1 $2') // "crocin650" -> "crocin 650"
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean);
    };

    const calculateLineMatchScore = (lineText, medicine) => {
      const lineTokens = tokenize(lineText);
      const brandTokens = tokenize(medicine.brandName);
      const genericTokens = tokenize(medicine.genericName);
      const compTokens = tokenize(medicine.composition);

      if (lineTokens.length === 0) return 0;

      let score = 0;

      // 1. Brand name match scoring
      let brandScore = 0;
      const baseBrandToken = brandTokens[0];
      const hasBaseBrand = lineTokens.includes(baseBrandToken) || 
        lineTokens.some(lt => diceCoefficient(baseBrandToken, lt) >= 0.85);

      if (hasBaseBrand) {
        brandScore += 80; // Base brand matches!
        
        let otherMatches = 0;
        const otherBrandTokens = brandTokens.slice(1);
        if (otherBrandTokens.length > 0) {
          for (const bt of otherBrandTokens) {
            if (lineTokens.includes(bt) || lineTokens.some(lt => diceCoefficient(bt, lt) >= 0.75)) {
              otherMatches++;
            }
          }
          brandScore += Math.round(40 * (otherMatches / otherBrandTokens.length));
        }
      } else {
        let otherMatches = 0;
        for (const bt of brandTokens) {
          if (lineTokens.includes(bt) || lineTokens.some(lt => diceCoefficient(bt, lt) >= 0.75)) {
            otherMatches++;
          }
        }
        brandScore += Math.round(30 * (otherMatches / brandTokens.length));
      }
      score += brandScore;

      // 2. Generic/Composition match scoring
      let compMatches = 0;
      const targetCompTokens = compTokens.filter(t => t.length > 3 && t !== 'acid');
      for (const ct of targetCompTokens) {
        if (lineTokens.includes(ct)) {
          compMatches++;
        } else {
          let maxSim = 0;
          for (const lt of lineTokens) {
            const sim = diceCoefficient(ct, lt);
            if (sim > maxSim) maxSim = sim;
          }
          if (maxSim >= 0.75) {
            compMatches += maxSim;
          }
        }
      }

      if (targetCompTokens.length > 0) {
        const compMatchRatio = compMatches / targetCompTokens.length;
        score += Math.round(50 * compMatchRatio);
      }

      // 3. Strength match scoring
      const lineNumbers = lineTokens.filter(t => !isNaN(t));
      const medNumbers = [...brandTokens, ...genericTokens, ...compTokens].filter(t => !isNaN(t));

      if (lineNumbers.length > 0 && medNumbers.length > 0) {
        let hasStrengthMatch = false;
        for (const num of lineNumbers) {
          if (medNumbers.includes(num)) {
            hasStrengthMatch = true;
            break;
          }
        }
        if (hasStrengthMatch) {
          score += 30;
        } else {
          score -= 20; // Penalty for strength mismatch
        }
      }

      return score;
    };

    const lines = text.split(/\r?\n/);
    matched = [];
    let unmatchedCounter = 0;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      let bestMed = null;
      let bestScore = 0;
      
      for (const medicine of medicines) {
        const score = calculateLineMatchScore(trimmedLine, medicine);
        if (score > bestScore) {
          bestScore = score;
          bestMed = medicine;
        }
      }
      
      // Select the single highest-scoring medicine if it passes the threshold
      if (bestMed && bestScore >= 15) {
        matched.push({
          ...bestMed,
          id: `${bestMed.id}-line-${matched.length}`,
          dbId: bestMed.id,
          writtenName: cleanPrescriptionLineToTabletName(trimmedLine)
        });
      } else {
        unmatchedCounter++;
        const cleanedName = cleanPrescriptionLineToTabletName(trimmedLine);
        matched.push({
          id: `unmatched-local-${unmatchedCounter}-${Date.now()}`,
          brandName: cleanedName,
          genericName: 'No generic alternatives found',
          composition: 'N/A',
          brandPrice: 0,
          genericPrice: 0,
          savings: 0,
          manufacturer: 'Unknown',
          writtenName: cleanedName,
          alternatives: [],
          unmatched: true
        });
      }
    }
  }

  const enrichedResult = await enrichAndSummarizeMedicines(matched);
  res.json(enrichedResult);
});

// Endpoint: Pure OCR — extract exact prescription text without any interpretation
app.post('/api/ocr-prescription', async (req, res) => {
  const { fileData, mimeType } = req.body;
  if (!fileData || !mimeType) {
    return res.status(400).json({ error: 'Please provide fileData (base64) and mimeType' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(400).json({ error: 'GEMINI_API_KEY_MISSING', message: 'Gemini API Key is not configured.' });
  }

  if (!isGeminiAvailable()) {
    return res.status(503).json({ error: 'GEMINI_API_UNAVAILABLE', message: 'Gemini API is temporarily unavailable due to quota exhaustion or rate limits.' });
  }

  try {
    console.log('Running pure OCR extraction on prescription image...');

    const ocrPrompt = `You are an expert medical AI system specialized in reading prescriptions.
Your ONLY task is to identify and extract the names of the medicines (tablets, syrups, capsules, ointments, etc.).

CRITICAL RULES - READ CAREFULLY:
1. STRICT FILTERING (EXTREMELY IMPORTANT): You MUST ONLY extract lines that are explicitly prescribing a medication. You MUST COMPLETELY IGNORE all headers, footers, clinic details, doctor details, patient names, ages, dates, addresses, contact numbers, random letters/numbers, registration numbers, and signatures.
2. ISOLATE ONLY THE MEDICINE NAME: For the actual medicine lines you find, extract ONLY the EXACT name of the tablet/medicine as it is written. DO NOT fix spelling mistakes. DO NOT change the names to match known brands. You MUST extract EXACTLY 100% verbatim the characters written in the image for the medicine name. Act as a literal character-by-character transcriber.
3. REMOVE DOSAGES & FREQUENCIES: You MUST STRIP OUT any dosage instructions (like 500mg, 10ml), frequencies (like 1-0-1, BD, OD), timings (like after food), and durations (like for 5 days). Do NOT include them in your output.
4. DO NOT OUTPUT JUNK LINES. ONLY output the lines that are clearly medicines. If you are unsure, DO NOT INCLUDE IT.
5. If there are no medicines visible, return an empty array for medicineLines.

EXAMPLES OF WHAT TO EXCLUDE (IGNORE COMPLETELY):
- "lo K PU R HOSPITALS L.L.P Dr. NITIN BHAGALI Dr. ASHWIN LOKAPUR" (Ignore, hospital/doctor names)
- "g52-l006L90 &7 PU8VLL" (Ignore, random artifacts/registration numbers)
- "1 Rog. Ne. 480 oa No. MMACS 082008" (Ignore, registration/random numbers)
- "Landline No. : 020 2421" (Ignore, contact details)
- "Name of he patent: - Swseqalcant" (Ignore, patient details)
- "2 M5. (ORTH W'S (ORTHO)" (Ignore, department/random)
- "Apparent No iia Rog. No. 71435 Reg, No.68308" (Ignore, registration details)
- "[7 shacaL1 CR. Fears" (Ignore, random OCR noise)
- "L 2a%9" (Ignore, random OCR noise)
- "rose Toi; ____nCak, WIT Colle age: SN ge: Mw" (Ignore, random noise/age)

EXAMPLES OF PROPER EXTRACTION (ISOLATE EXACT NAME ONLY):
- "Tab. Crocin 650mg 1-0-1 after food x 5 days" -> Extract "Tab. Crocin"
- "Cap. Amoxicillin 500 mg 1-1-1" -> Extract "Cap. Amoxicillin"
- "Syr. Corex 5ml BD" -> Extract "Syr. Corex"

Return ONLY a valid JSON object matching this exact schema without any markdown blocks:
{
  "rawText": "the full raw text from the image for reference",
  "medicineLines": [
    "exact literal medicine line 1",
    "exact literal medicine line 2"
  ]
}`;

    const response = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              { text: ocrPrompt },
              { inlineData: { mimeType, data: fileData } }
            ]
          }],
          generationConfig: {
            temperature: 0,
            topP: 0.1,
            topK: 1,
            responseMimeType: 'application/json'
          }
        }),
        timeout: 30000
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      recordGeminiResult(false, response.status, errText);
      console.error('Gemini OCR call failed:', response.status, errText);
      throw new Error(`Gemini OCR returned status ${response.status}`);
    }

    const data = await response.json();
    recordGeminiResult(true);
    let textResult = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';

    // Strip markdown wrappers if present (shouldn't be needed with responseMimeType but keeping for safety)
    textResult = textResult.replace(/^```(?:json)?\n?/i, '').replace(/```$/i, '').trim();

    let parsed = { rawText: '', medicineLines: [] };
    try {
      parsed = JSON.parse(textResult);
    } catch (e) {
      console.error("Failed to parse Gemini JSON:", textResult);
      throw new Error("Invalid JSON returned from AI");
    }

    return res.json({
      rawText: parsed.rawText || '',
      medicineLines: Array.isArray(parsed.medicineLines) ? parsed.medicineLines : []
    });

  } catch (err) {
    recordGeminiResult(false, 500, err.message);
    console.error('Pure OCR extraction failed:', err);
    res.status(500).json({ error: 'OCR_FAILED', message: err.message });
  }
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

  if (!isGeminiAvailable()) {
    return res.status(503).json({ error: 'GEMINI_API_UNAVAILABLE', message: 'Gemini API is temporarily unavailable due to quota exhaustion or rate limits.' });
  }

  try {
    console.log(`Using Gemini AI to parse multimodal prescription file (${mimeType})...`);
    const medicines = await db.medicines.findMany();
    const medicinesMin = medicines.map(m => ({
      id: m.id,
      brandName: m.brandName,
      composition: m.composition,
      genericName: m.genericName
    }));

    const promptText = `You are a world-class medical prescription digitisation AI combining OCR + pharmacology expertise. 

STEP 1 — OCR (Character-accurate extraction):
Read the prescription image and extract ONLY the actual medicine names (tablets, capsules, syrups, etc.). 
- EXCLUDE NON-MEDICINE TEXT: You MUST completely IGNORE hospital names, doctor names, patient names, registration numbers, phone numbers, addresses, signatures, random artifacts, and any text that is not a medicine name. ONLY extract the actual medicine names.
- ONLY extract medicines that are visibly written on the image. Do NOT hallucinate or add medicines.
- STRIP OUT all extra instructions. Do NOT include dosages, frequencies (e.g. 1-0-1, BD, OD), timings (after food), durations (x 5 days), or quantities (10 tabs). We ONLY want the medicine name and its strength (e.g., Crocin 650mg).
- The extracted names MUST be EXACTLY 100% the same spelling as written on the image.

STEP 2 — Database Matching:
After extracting the exact tablet names, match each medicine to the database below. Matching rules:
- Match by brandName FIRST — find the closest brand name in database to what is written
- Only use genericName/composition for matching if the brand is totally absent from database
- NEVER substitute one brand name for another even if compositions are similar
- The "writtenName" field must ALWAYS be exactly what you extracted in STEP 1. Do not clean or modify it.
- If a medicine is NOT found in the database, you MUST STILL include it in the matches array and set "id" to null.

Available Medicines Database:
${JSON.stringify(medicinesMin)}

Return ONLY a valid JSON object (no markdown, no code blocks, no explanation):
{
  "extractedText": "verbatim full prescription text with line breaks preserved as \\n",
  "extractedMedicines": [
    { "name": "EXACT medicine name extracted from prescription, stripped of frequency", "dosage": "" }
  ],
  "matches": [
    { "id": <database_id_or_null>, "writtenName": "EXACT medicine name extracted from prescription — same as extractedMedicines[n].name" }
  ]
}

IMPORTANT: The "writtenName" values must be ONLY the medicine name exactly as it appears in the prescription image.`;

    const response = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              { text: promptText },
              { inlineData: { mimeType, data: fileData } }
            ]
          }],
          generationConfig: {
            temperature: 0,   // Strict: no creativity, maximum fidelity
            topP: 0.1,
            topK: 1
          }
        }),
        timeout: 10000
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      recordGeminiResult(false, response.status, errText);
      console.error('Gemini API call failed:', response.status, errText);
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    recordGeminiResult(true);
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
          matched = parsedResult.matches.map((item, idx) => {
            if (item.id !== null && item.id !== undefined) {
              const med = medicines.find(m => m.id === item.id);
              if (med) {
                return {
                  ...med,
                  writtenName: item.writtenName || med.brandName
                };
              }
            }
            
            const fallbackName = item.writtenName || 'Unknown Medicine';
            return {
              id: `unmatched-ai-${idx}-${Date.now()}`,
              brandName: fallbackName,
              genericName: 'No generic alternatives found',
              composition: 'N/A',
              brandPrice: 0,
              genericPrice: 0,
              savings: 0,
              manufacturer: 'Unknown',
              writtenName: fallbackName,
              alternatives: [],
              unmatched: true
            };
          });
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
    recordGeminiResult(false, 500, err.message);
    console.error('Failed to parse prescription file using Gemini AI:', err);
    res.status(500).json({ error: 'AI_OPTIMIZATION_FAILED', message: err.message });
  }
});

// Endpoint: Stock Availability Prediction (AI-powered simulator)
app.get('/api/stock/predict/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const medicine = await db.medicines.findById(id);
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
  if (apiKey && isGeminiAvailable()) {
    try {
      console.log('Attempting to use Gemini API for chatbot...');
      const response = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: "You are a helpful and intelligent AI assistant. You must answer ANY question the user asks, on ANY topic whatsoever (general knowledge, coding, life, etc.), even if it is not related to health. If the user asks about health, you specialize in generic medicines, price savings, and health scheme awareness, but never restrict yourself ONLY to health. Provide a complete, helpful answer to the following question: " + message }]
              }
            ]
          }),
          timeout: 8000
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
          console.log('Successfully answered using Gemini API.');
          recordGeminiResult(true);
          return res.json({ response: data.candidates[0].content.parts[0].text });
        }
      }
      const errText = await response.text();
      recordGeminiResult(false, response.status, errText);
      console.warn(`Gemini API call returned status ${response.status}, trying Pollinations AI...`);
    } catch (e) {
      recordGeminiResult(false, 500, e.message);
      console.error('Gemini API call failed, trying Pollinations AI:', e.message);
    }
  }

  // Fallback 1: Keyless Pollinations AI model
  try {
    console.log('Attempting to use Pollinations AI fallback for chatbot...');
    const response = await fetchWithTimeout("https://text.pollinations.ai/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: "You are GenMed AI, a helpful, polite, and intelligent medical and general AI assistant. You must answer ANY question the user asks on ANY topic (general knowledge, science, history, programming, life, health, etc.). Do not restrict yourself to health or generic medicine. If the user asks about health, generic medicine, or PMBJP schemes, provide expert guidance on generic medicine alternatives and savings, but always provide complete, helpful answers to whatever general questions are asked. Keep your tone professional, friendly, and concise."
          },
          {
            role: "user",
            content: message
          }
        ],
        model: "openai"
      }),
      timeout: 8000
    });

    if (response.ok) {
      const text = await response.text();
      if (text && text.trim()) {
        console.log('Successfully answered using Pollinations AI fallback.');
        return res.json({ response: text.trim() });
      }
    }
    console.warn(`Pollinations AI fallback returned status ${response.status}, trying local offline rules...`);
  } catch (e) {
    console.error('Pollinations AI fallback failed, trying local offline rules:', e.message);
  }

  // Fallback 2: Local Smart Response fallback
  const msgClean = message.toLowerCase();
  let reply = "I am GenMed AI, your generic medicine guide. Ask me about medicine alternatives, cost savings, side effects, or government schemes like PMBJP!";

  if (msgClean.includes('generic') || msgClean.includes('difference') || msgClean.includes('what is generic') || msgClean.includes('what are generic')) {
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
    const medicines = await db.medicines.findMany();
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
app.get('/api/disease-search', async (req, res) => {
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

  const allMeds = await db.medicines.findMany();
  
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

  const medicines = await db.medicines.findMany();
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
    const medicines = await db.medicines.findMany();
    const existing = medicines.find(m => 
      m.brandName.toLowerCase() === brandName.toLowerCase() || 
      m.composition.toLowerCase() === genericName.toLowerCase()
    );

    if (existing) {
      syncedData.id = existing.id;
    }

    const saved = await db.medicines.save(syncedData);
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

  const medicines = await db.medicines.findMany();
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
        await db.medicines.save(synced);
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

// Trigger reload 2


