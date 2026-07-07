const { diceCoefficient } = require('./server/server.js'); // wait, server.js doesn't export functions directly.
// Let's copy the function implementation here to unit-test it.

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

const testCases = [
  "Tab Crocin 650mg 1-0-1 x 5 days",
  "Cap. Amoxicillin 500 mg BD for 7 days after food",
  "Metformin 1000mg OD",
  "Paracetamol (Crocin) 1-0-0",
  "Tab. Atorvastatin 10mg once daily at bedtime",
  "Vicks Action 500 TDS with warm water",
  "Pantocid 40mg AC",
  "Glycomet GP2 (Metformin 500mg) before breakfast",
  "Unknown tablet name"
];

console.log("=== Testing cleanPrescriptionLineToTabletName ===");
testCases.forEach((tc) => {
  console.log(`Original: "${tc}"`);
  console.log(`Cleaned:  "${cleanPrescriptionLineToTabletName(tc)}"\n`);
});
