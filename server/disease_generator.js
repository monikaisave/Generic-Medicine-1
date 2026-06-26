const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, 'data');
const DISEASES_FILE = path.join(DB_DIR, 'diseases.json');

const baseDiseases = [
  { name: "Hypertension", category: "Cardiovascular", system: "Cardiovascular System", baseSymptoms: ["high blood pressure", "dizziness", "chest tightness"] },
  { name: "Diabetes Mellitus", category: "Antidiabetics", system: "Endocrine System", baseSymptoms: ["high blood sugar", "increased thirst", "frequent urination", "fatigue"] },
  { name: "Gastritis", category: "Gastrointestinal", system: "Digestive System", baseSymptoms: ["stomach burn", "bloating", "nausea", "heartburn"] },
  { name: "Bronchitis", category: "Respiratory", system: "Respiratory System", baseSymptoms: ["cough", "shortness of breath", "chest congestion", "wheezing"] },
  { name: "Dermatitis", category: "Dermatology", system: "Integumentary System", baseSymptoms: ["skin rash", "itching", "redness", "dry skin"] },
  { name: "Arthritis", category: "NSAIDs", system: "Musculoskeletal System", baseSymptoms: ["joint pain", "stiffness", "swelling", "reduced mobility"] },
  { name: "Migraine", category: "Analgesics & Antipyretics", system: "Nervous System", baseSymptoms: ["severe headache", "nausea", "sensitivity to light", "throbbing head"] },
  { name: "Otitis", category: "Antibiotics", system: "Auditory System", baseSymptoms: ["ear pain", "ear discharge", "hearing loss"] },
  { name: "Pharyngitis", category: "Antibiotics", system: "Respiratory System", baseSymptoms: ["sore throat", "difficulty swallowing", "fever"] },
  { name: "Urinary Tract Infection", category: "Antibiotics", system: "Urinary System", baseSymptoms: ["burning urination", "frequent urination", "pelvic pain"] },
  { name: "Colitis", category: "Gastrointestinal", system: "Digestive System", baseSymptoms: ["abdominal pain", "diarrhea", "cramps", "bloating"] },
  { name: "Anemia", category: "Vitamins & Supplements", system: "Hematological System", baseSymptoms: ["fatigue", "pale skin", "weakness", "cold hands"] },
  { name: "Insomnia", category: "Neurology & Psychiatry", system: "Nervous System", baseSymptoms: ["sleeplessness", "daytime fatigue", "irritability"] },
  { name: "Thyroiditis", category: "Thyroid", system: "Endocrine System", baseSymptoms: ["fatigue", "weight gain", "cold sensitivity", "dry skin"] },
  { name: "Conjunctivitis", category: "Antibiotics", system: "Ocular System", baseSymptoms: ["red eyes", "eye discharge", "itching", "watering eyes"] },
  { name: "Sinusitis", category: "Respiratory", system: "Respiratory System", baseSymptoms: ["nasal congestion", "facial pressure", "headache", "runny nose"] },
  { name: "Gingivitis", category: "Antibiotics", system: "Digestive System", baseSymptoms: ["bleeding gums", "bad breath", "gum swelling"] },
  { name: "Myalgia", category: "NSAIDs", system: "Musculoskeletal System", baseSymptoms: ["muscle ache", "fatigue", "stiffness", "muscle spasms"] },
  { name: "Flu", category: "Analgesics & Antipyretics", system: "Systemic", baseSymptoms: ["fever", "body ache", "cough", "fatigue", "runny nose"] },
  { name: "GERD", category: "Gastrointestinal", system: "Digestive System", baseSymptoms: ["acid reflux", "heartburn", "difficulty swallowing", "chest pain"] },
  { name: "Asthma", category: "Respiratory", system: "Respiratory System", baseSymptoms: ["wheezing", "shortness of breath", "cough", "chest tightness"] },
  { name: "Allergic Rhinitis", category: "Antihistamines", system: "Immune System", baseSymptoms: ["sneezing", "runny nose", "itchy nose", "watery eyes"] },
  { name: "Neuropathy", category: "Neurology & Psychiatry", system: "Nervous System", baseSymptoms: ["numbness", "tingling", "sharp nerve pain", "weakness"] },
  { name: "Eczema", category: "Dermatology", system: "Integumentary System", baseSymptoms: ["dry skin", "intense itching", "skin redness", "rough patches"] },
  { name: "Gout", category: "NSAIDs", system: "Musculoskeletal System", baseSymptoms: ["severe joint pain", "joint redness", "swelling", "warm joint"] },
  { name: "Depression", category: "Neurology & Psychiatry", system: "Nervous System", baseSymptoms: ["low mood", "loss of interest", "fatigue", "sleep disturbance"] },
  { name: "Osteoporosis", category: "Vitamins & Supplements", system: "Musculoskeletal System", baseSymptoms: ["weak bones", "back pain", "height loss"] },
  { name: "Pneumonia", category: "Antibiotics", system: "Respiratory System", baseSymptoms: ["productive cough", "fever", "chills", "shortness of breath"] },
  { name: "Gastroenteritis", category: "Gastrointestinal", system: "Digestive System", baseSymptoms: ["watery diarrhea", "vomiting", "stomach cramps", "fever"] }
];

const diseaseModifiers = [
  "Acute", "Chronic", "Mild", "Severe", "Primary", "Secondary", "Recurrent", "Localized", "Generalized", "Bacterial", 
  "Viral", "Fungal", "Allergic", "Idiopathic", "Subacute", "Systemic", "Seasonal", "Progressive", "Refractory", "Intermittent",
  "Early-onset", "Late-stage", "Post-infectious", "Drug-induced", "Occupational", "Geriatric", "Pediatric", "Familial"
];

const anatomicRegions = [
  "Pulmonary", "Gastric", "Cardiac", "Renal", "Cerebral", "Hepatic", "Dermal", "Ocular", "Aural", "Nasal", 
  "Oral", "Spinal", "Joint", "Muscular", "Vascular", "Intestinal", "Esophageal", "Thyroid", "Neurological", "Systemic",
  "Peripheral", "Central", "Lobar", "Cutaneous", "Abdominal", "Thoracic", "Biliary", "Lumbar", "Cervical", "Pelvic"
];

const baseSymptoms = [
  "fever", "cough", "pain", "swelling", "itching", "redness", "weakness", "fatigue", "dizziness", "nausea", 
  "vomiting", "burning", "stiffness", "spasm", "numbness", "congestion", "shortness of breath", "bloating", "diarrhea", "constipation", 
  "insomnia", "anxiety", "dryness", "discharge", "headache", "tingling", "tremor", "soreness", "cramps", "chills"
];

const symptomModifiers = [
  "Mild", "Severe", "Persistent", "Intermittent", "Acute", "Chronic", "Localized", "Generalized", "Sharp", "Dull", 
  "Throbbing", "Burning", "Morning", "Night", "Post-prandial", "Sudden", "Gradual", "Recurrent", "Spasmodic", "Migratory", 
  "Shooting", "Aching", "Constant", "Frequent", "Occasional", "Exertional", "Positional", "Nocturnal", "Paroxysmal", "Subtle"
];

const symptomLocations = [
  "Chest", "Abdominal", "Head", "Joint", "Muscle", "Throat", "Nasal", "Ear", "Eye", "Skin", 
  "Back", "Neck", "Stomach", "Limb", "Foot", "Hand", "Shoulder", "Knee", "Pelvic", "Spinal", 
  "Gastric", "Cardiac", "Pulmonary", "Hepatic", "Renal", "Cerebral", "Gum", "Nerve", "Bone", "Intestinal"
];

function generateDataset() {
  console.log("Generating disease-symptom mapping dataset...");

  // 1. Generate 510 unique symptoms
  const symptomSet = new Set();
  const symptomsList = [];
  
  while (symptomsList.length < 510) {
    const symBase = baseSymptoms[Math.floor(Math.random() * baseSymptoms.length)];
    const symMod = symptomModifiers[Math.floor(Math.random() * symptomModifiers.length)];
    const symLoc = symptomLocations[Math.floor(Math.random() * symptomLocations.length)];
    
    const symptomName = `${symMod} ${symLoc} ${symBase.charAt(0).toUpperCase() + symBase.slice(1)}`;
    
    if (!symptomSet.has(symptomName)) {
      symptomSet.add(symptomName);
      symptomsList.push({
        id: `sym_${100 + symptomsList.length}`,
        name: symptomName,
        base: symBase,
        modifier: symMod,
        location: symLoc
      });
    }
  }

  // 2. Generate 515 unique diseases
  const diseaseSet = new Set();
  const diseasesList = [];
  
  // Custom helpers for realistic precautions and warnings
  const getPrecautions = (cat) => {
    switch (cat) {
      case "Cardiovascular":
        return ["Monitor blood pressure daily.", "Follow a low-sodium diet.", "Engage in moderate physical exercise.", "Avoid smoking and alcohol."];
      case "Antidiabetics":
        return ["Check blood sugar levels regularly.", "Maintain a strict diabetic diet.", "Exercise regularly.", "Carry glucose candies for hypoglycemia emergencies."];
      case "Gastrointestinal":
        return ["Eat smaller, frequent meals.", "Avoid spicy and greasy foods.", "Do not lie down immediately after eating.", "Stay hydrated."];
      case "Respiratory":
      case "Antihistamines":
        return ["Avoid dust, pollen, and smoke triggers.", "Use a humidifier.", "Practice deep breathing exercises.", "Keep rescue inhalers close by."];
      case "Antibiotics":
        return ["Complete the full course of medicines as prescribed.", "Take with food if gastric irritation occurs.", "Do not self-medicate.", "Report severe skin rash immediately."];
      case "Vitamins & Supplements":
        return ["Take with water after meals.", "Include dairy or green leafy vegetables in your diet.", "Get adequate morning sunlight exposure.", "Do not exceed the daily recommended allowance."];
      case "Neurology & Psychiatry":
        return ["Maintain a consistent sleep schedule.", "Avoid caffeine and screens before bedtime.", "Practice meditation or relaxation techniques.", "Do not discontinue psychiatric medications abruptly."];
      default:
        return ["Take adequate rest.", "Stay well-hydrated.", "Avoid strenuous activities.", "Monitor symptoms closely."];
    }
  };

  const getWarning = (cat) => {
    switch (cat) {
      case "Cardiovascular":
        return "Severe chest pain, sudden numbness in face/limbs, or extreme breathing difficulty requires emergency cardiovascular care.";
      case "Antidiabetics":
        return "Loss of consciousness, extreme confusion, or fruity breath odor are signs of severe diabetic complications. Seek immediate hospitalization.";
      case "Gastrointestinal":
        return "Blood in vomit or black tarry stools indicate gastrointestinal bleeding. Seek emergency medical attention.";
      case "Respiratory":
        return "Inability to catch breath, blue tint on lips/nails, or severe chest pain requires immediate emergency oxygen therapy.";
      case "Antibiotics":
        return "High-grade fever accompanied by breathing difficulty or throat swelling could indicate a severe drug allergy. Seek emergency care.";
      case "Neurology & Psychiatry":
        return "Sudden changes in vision, loss of motor control, or suicidal thoughts require immediate emergency psychiatric/neurological consult.";
      default:
        return "If symptoms worsen, high fever persists for over 3 days, or severe pain develops, consult a doctor immediately.";
    }
  };

  while (diseasesList.length < 515) {
    const baseObj = baseDiseases[Math.floor(Math.random() * baseDiseases.length)];
    const disMod = diseaseModifiers[Math.floor(Math.random() * diseaseModifiers.length)];
    
    // Sometimes add an anatomical region, sometimes just modifier + name
    let diseaseName = "";
    if (Math.random() > 0.5) {
      const disReg = anatomicRegions[Math.floor(Math.random() * anatomicRegions.length)];
      diseaseName = `${disMod} ${disReg} ${baseObj.name}`;
    } else {
      diseaseName = `${disMod} ${baseObj.name}`;
    }

    if (!diseaseSet.has(diseaseName)) {
      diseaseSet.add(diseaseName);

      // Select symptoms that are relevant. Bias them towards matching categories
      const matchedSymptoms = [];
      
      // Filter symptoms that match the base condition keywords to make it realistic
      const categoryKeywords = {
        "Cardiovascular": ["cardiac", "chest", "head", "headache", "bp", "blood pressure", "dizziness", "heart"],
        "Antidiabetics": ["sugar", "fatigue", "urination", "weakness", "thirst", "blood sugar"],
        "Gastrointestinal": ["abdominal", "stomach", "gastric", "intestinal", "bloating", "burn", "nausea", "vomiting", "diarrhea", "constipation"],
        "Respiratory": ["chest", "throat", "nasal", "cough", "congestion", "breath", "wheezing", "pulmonary"],
        "Antihistamines": ["nasal", "eye", "sneezing", "runny nose", "itching", "rash", "dermal", "watery"],
        "Antibiotics": ["throat", "ear", "fever", "pain", "urinary", "gum", "redness", "discharge", "burn"],
        "Vitamins & Supplements": ["bone", "joint", "muscle", "weakness", "fatigue", "pale", "limbs"],
        "Neurology & Psychiatry": ["head", "nerve", "anxiety", "insomnia", "sleeplessness", "tremor", "tingling", "numbness", "mood"],
        "NSAIDs": ["joint", "muscle", "back", "knee", "shoulder", "pain", "stiffness", "swelling", "spasm"],
        "Dermatology": ["skin", "cutaneous", "dermal", "itching", "rash", "redness", "dryness"]
      };

      const keywords = categoryKeywords[baseObj.category] || ["fever", "pain", "weakness"];
      
      // Filter a candidate pool of symptoms that contain any keyword
      const candidateSymptoms = symptomsList.filter(sym => {
        const symText = sym.name.toLowerCase();
        return keywords.some(kw => symText.includes(kw));
      });

      // Pick 3-5 candidates. If pool is too small, fill from general list
      const numSymptoms = 3 + Math.floor(Math.random() * 3); // 3 to 5 symptoms
      const selectedIds = new Set();
      
      while (selectedIds.size < numSymptoms) {
        if (candidateSymptoms.length > 0 && Math.random() > 0.3) {
          const randomSym = candidateSymptoms[Math.floor(Math.random() * candidateSymptoms.length)];
          selectedIds.add(randomSym.id);
        } else {
          const randomSym = symptomsList[Math.floor(Math.random() * symptomsList.length)];
          selectedIds.add(randomSym.id);
        }
      }

      const diseaseSymptoms = Array.from(selectedIds);

      diseasesList.push({
        id: `dis_${100 + diseasesList.length}`,
        name: diseaseName,
        baseCondition: baseObj.name,
        category: baseObj.category,
        system: baseObj.system,
        symptoms: diseaseSymptoms,
        description: `A pathological variant of ${baseObj.name} primarily affecting the ${baseObj.system}. Classified as a ${disMod.toLowerCase()} clinical presentation.`,
        precautions: getPrecautions(baseObj.category),
        severityWarning: getWarning(baseObj.category)
      });
    }
  }

  // Write JSON
  const outputData = {
    diseases: diseasesList,
    symptoms: symptomsList
  };

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  fs.writeFileSync(DISEASES_FILE, JSON.stringify(outputData, null, 2), 'utf-8');
  console.log(`Generated successfully: ${diseasesList.length} diseases, ${symptomsList.length} symptoms mapped.`);
  return outputData;
}

module.exports = {
  generateDataset,
  DISEASES_FILE
};

// Auto-run if executed directly
if (require.main === module) {
  generateDataset();
}
