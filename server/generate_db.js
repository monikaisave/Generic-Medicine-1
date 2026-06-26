const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Base medicine data templates to expand
const templates = [
  // Analgesics & Antipyretics
  { brand: "Crocin", generic: "Paracetamol", comp: "Paracetamol", cat: "Analgesics & Antipyretics", dosage: "Tablet", mfr: "GlaxoSmithKline", details: "Used for treatment of fever, mild-to-moderate pain.", sideEffects: ["Nausea", "Allergic reaction", "Liver damage at high dose"], contraindications: ["Severe liver disease", "Alcoholism"], schedule: "OTC", basePrice: 20 },
  { brand: "Calpol", generic: "Paracetamol", comp: "Paracetamol", cat: "Analgesics & Antipyretics", dosage: "Tablet", mfr: "GlaxoSmithKline", details: "Fever reducer and pain reliever.", sideEffects: ["Nausea", "Skin rash"], contraindications: ["Liver impairment"], schedule: "OTC", basePrice: 15 },
  { brand: "Dolo", generic: "Paracetamol", comp: "Paracetamol", cat: "Analgesics & Antipyretics", dosage: "Tablet", mfr: "Micro Labs Ltd", details: "Commonly prescribed antipyretic for high fever.", sideEffects: ["Nausea", "Gastric discomfort"], contraindications: ["Liver failure"], schedule: "OTC", basePrice: 30 },
  { brand: "Pacimol", generic: "Paracetamol", comp: "Paracetamol", cat: "Analgesics & Antipyretics", dosage: "Tablet", mfr: "Ipca Laboratories", details: "Pain reliever and fever reducer.", sideEffects: ["Nausea", "Headache"], contraindications: ["Liver disease"], schedule: "OTC", basePrice: 18 },
  
  // Antibiotics & Antivirals & Antifungals
  { brand: "Augmentin", generic: "Amoxicillin + Clavulanic Acid", comp: "Amoxicillin & Clavulanate Potassium", cat: "Antibiotics", dosage: "Tablet", mfr: "GlaxoSmithKline", details: "Penicillin-class antibiotic used to treat bacterial infections.", sideEffects: ["Diarrhea", "Nausea", "Vaginal yeast infection"], contraindications: ["Penicillin allergy", "Jaundice history"], schedule: "Schedule H", basePrice: 200 },
  { brand: "Clavam", generic: "Amoxicillin + Clavulanic Acid", comp: "Amoxicillin & Clavulanate Potassium", cat: "Antibiotics", dosage: "Tablet", mfr: "Alkem Laboratories Ltd", details: "Bacterial infections treatment.", sideEffects: ["Diarrhea", "Vomiting"], contraindications: ["Penicillin allergy"], schedule: "Schedule H", basePrice: 190 },
  { brand: "Moxikind-CV", generic: "Amoxicillin + Clavulanic Acid", comp: "Amoxicillin & Clavulanate Potassium", cat: "Antibiotics", dosage: "Tablet", mfr: "Mankind Pharma Ltd", details: "Antibiotic for chest, skin, and ear infections.", sideEffects: ["Loose stools", "Nausea"], contraindications: ["Allergy to penicillin"], schedule: "Schedule H", basePrice: 175 },
  { brand: "Azithral", generic: "Azithromycin", comp: "Azithromycin", cat: "Antibiotics", dosage: "Tablet", mfr: "Alembic Pharmaceuticals", details: "Macrolide antibiotic used for bacterial infections of ears, throat, lungs.", sideEffects: ["Diarrhea", "Abdominal pain", "Vomiting"], contraindications: ["Liver disease", "QT prolongation"], schedule: "Schedule H", basePrice: 120 },
  { brand: "Azee", generic: "Azithromycin", comp: "Azithromycin", cat: "Antibiotics", dosage: "Tablet", mfr: "Cipla Ltd", details: "Broad spectrum macrolide antibiotic.", sideEffects: ["Nausea", "Headache", "Dizziness"], contraindications: ["Cardiac arrhythmia"], schedule: "Schedule H", basePrice: 115 },
  { brand: "Cifran", generic: "Ciprofloxacin", comp: "Ciprofloxacin", cat: "Antibiotics", dosage: "Tablet", mfr: "Sun Pharmaceutical Industries", details: "Fluoroquinolone antibiotic for treating various bacterial infections.", sideEffects: ["Nausea", "Tendinitis", "Joint pain"], contraindications: ["Tendon disorders", "Myasthenia gravis"], schedule: "Schedule H", basePrice: 90 },
  { brand: "Oflox", generic: "Ofloxacin", comp: "Ofloxacin", cat: "Antibiotics", dosage: "Tablet", mfr: "Cipla Ltd", details: "Used for typhoid fever, urinary tract, and respiratory tract infections.", sideEffects: ["Dizziness", "Nausea", "Insomnia"], contraindications: ["Epilepsy", "Tendon rupture history"], schedule: "Schedule H", basePrice: 80 },
  { brand: "Monocef", generic: "Ceftriaxone", comp: "Ceftriaxone", cat: "Antibiotics", dosage: "Injection", mfr: "Aristo Pharmaceuticals", details: "Broad-spectrum cephalosporin antibiotic injection.", sideEffects: ["Pain at injection site", "Diarrhea", "Rash"], contraindications: ["Calcium-containing IV infusions in newborns"], schedule: "Schedule H", basePrice: 70 },
  { brand: "Zifi", generic: "Cefixime", comp: "Cefixime", cat: "Antibiotics", dosage: "Tablet", mfr: "FDC Ltd", details: "Cephalosporin antibiotic used to treat middle ear, throat, and UTI infections.", sideEffects: ["Diarrhea", "Stomach pain", "Dyspepsia"], contraindications: ["Cephalosporin allergy"], schedule: "Schedule H", basePrice: 110 },
  { brand: "Taxim-O", generic: "Cefixime", comp: "Cefixime", cat: "Antibiotics", dosage: "Tablet", mfr: "Alkem Laboratories Ltd", details: "Oral antibiotic for respiratory and urinary tract infections.", sideEffects: ["Diarrhea", "Nausea", "Flatulence"], contraindications: ["Cephalosporin hypersensitivity"], schedule: "Schedule H", basePrice: 105 },

  // Cardiovascular
  { brand: "Lipitor", generic: "Atorvastatin", comp: "Atorvastatin", cat: "Cardiovascular", dosage: "Tablet", mfr: "Pfizer India Ltd", details: "HMG-CoA reductase inhibitor to reduce bad cholesterol and triglycerides.", sideEffects: ["Muscle pain", "Diarrhea", "Joint pain"], contraindications: ["Active liver disease", "Pregnancy"], schedule: "Schedule H", basePrice: 90 },
  { brand: "Atorva", generic: "Atorvastatin", comp: "Atorvastatin", cat: "Cardiovascular", dosage: "Tablet", mfr: "Zydus Cadila", details: "Cholesterol lowering medication.", sideEffects: ["Muscle aches", "Headache"], contraindications: ["Liver dysfunction"], schedule: "Schedule H", basePrice: 85 },
  { brand: "Storvas", generic: "Atorvastatin", comp: "Atorvastatin", cat: "Cardiovascular", dosage: "Tablet", mfr: "Sun Pharmaceutical Industries", details: "Lowers blood cholesterol and prevents cardiac events.", sideEffects: ["Constipation", "Nausea"], contraindications: ["Liver disease", "Pregnancy"], schedule: "Schedule H", basePrice: 80 },
  { brand: "Telma", generic: "Telmisartan", comp: "Telmisartan", cat: "Cardiovascular", dosage: "Tablet", mfr: "Glenmark Pharmaceuticals", details: "Angiotensin II receptor antagonist used for high blood pressure.", sideEffects: ["Dizziness", "Back pain", "Sinus pain"], contraindications: ["Bilateral renal artery stenosis", "Pregnancy"], schedule: "Schedule H", basePrice: 100 },
  { brand: "Telmikind", generic: "Telmisartan", comp: "Telmisartan", cat: "Cardiovascular", dosage: "Tablet", mfr: "Mankind Pharma Ltd", details: "Antihypertensive medication.", sideEffects: ["Fatigue", "Dizziness"], contraindications: ["Pregnancy", "Severe kidney disease"], schedule: "Schedule H", basePrice: 85 },
  { brand: "Amlopin", generic: "Amlodipine", comp: "Amlodipine", cat: "Cardiovascular", dosage: "Tablet", mfr: "Unique Pharmaceuticals", details: "Calcium channel blocker used to treat high blood pressure and chest pain.", sideEffects: ["Swelling of ankles", "Headache", "Fatigue"], contraindications: ["Severe hypotension", "Aortic stenosis"], schedule: "Schedule H", basePrice: 45 },
  { brand: "Stamlo", generic: "Amlodipine", comp: "Amlodipine", cat: "Cardiovascular", dosage: "Tablet", mfr: "Dr. Reddy's Laboratories", details: "Treatment for hypertension and chronic stable angina.", sideEffects: ["Edema", "Flushing", "Palpitations"], contraindications: ["Hypotension"], schedule: "Schedule H", basePrice: 42 },
  { brand: "Cardace", generic: "Ramipril", comp: "Ramipril", cat: "Cardiovascular", dosage: "Tablet", mfr: "Sanofi India Ltd", details: "ACE inhibitor used to treat high blood pressure and heart failure.", sideEffects: ["Dry cough", "Dizziness", "Hyperkalemia"], contraindications: ["Angioedema history", "Pregnancy"], schedule: "Schedule H", basePrice: 130 },
  { brand: "Rosuvas", generic: "Rosuvastatin", comp: "Rosuvastatin", cat: "Cardiovascular", dosage: "Tablet", mfr: "Sun Pharmaceutical Industries", details: "Statin medication for cholesterol reduction.", sideEffects: ["Muscle pain", "Weakness", "Nausea"], contraindications: ["Liver disease", "Severe kidney impairment"], schedule: "Schedule H", basePrice: 160 },
  { brand: "Rozavel", generic: "Rosuvastatin", comp: "Rosuvastatin", cat: "Cardiovascular", dosage: "Tablet", mfr: "Sun Pharmaceutical Industries", details: "Lipid-lowering drug.", sideEffects: ["Headache", "Myalgia"], contraindications: ["Active liver disease"], schedule: "Schedule H", basePrice: 150 },
  { brand: "Concor", generic: "Bisoprolol", comp: "Bisoprolol Fumarate", cat: "Cardiovascular", dosage: "Tablet", mfr: "Merck Ltd", details: "Beta-blocker used to treat high blood pressure and heart failure.", sideEffects: ["Slow heart rate", "Fatigue", "Cold extremities"], contraindications: ["Bradycardia", "Heart block", "Asthma"], schedule: "Schedule H", basePrice: 90 },

  // Antidiabetics
  { brand: "Glycomet", generic: "Metformin", comp: "Metformin Hydrochloride", cat: "Antidiabetics", dosage: "Tablet", mfr: "USV Private Ltd", details: "First-line medication for the treatment of type 2 diabetes.", sideEffects: ["Diarrhea", "Nausea", "Metallic taste in mouth"], contraindications: ["Severe renal impairment", "Metabolic acidosis"], schedule: "Schedule H", basePrice: 40 },
  { brand: "Metformin ER", generic: "Metformin", comp: "Metformin Extended Release", cat: "Antidiabetics", dosage: "Tablet", mfr: "Abbott India Ltd", details: "Sustained release antidiabetic agent.", sideEffects: ["Abdominal pain", "Bloating"], contraindications: ["Kidney failure"], schedule: "Schedule H", basePrice: 48 },
  { brand: "Amaryl", generic: "Glimepiride", comp: "Glimepiride", cat: "Antidiabetics", dosage: "Tablet", mfr: "Sanofi India Ltd", details: "Sulfonylurea medication to lower blood sugar in type 2 diabetes.", sideEffects: ["Hypoglycemia (low blood sugar)", "Weight gain", "Dizziness"], contraindications: ["Diabetic ketoacidosis", "Severe liver/kidney disease"], schedule: "Schedule H", basePrice: 120 },
  { brand: "Glimy", generic: "Glimepiride", comp: "Glimepiride", cat: "Antidiabetics", dosage: "Tablet", mfr: "Dr. Reddy's Laboratories", details: "Oral blood glucose lowering drug.", sideEffects: ["Headache", "Hypoglycemia"], contraindications: ["Type 1 diabetes"], schedule: "Schedule H", basePrice: 110 },
  { brand: "Galvus Met", generic: "Vildagliptin + Metformin", comp: "Vildagliptin & Metformin Hydrochloride", cat: "Antidiabetics", dosage: "Tablet", mfr: "Novartis India Ltd", details: "Combination oral antidiabetic drug.", sideEffects: ["Hypoglycemia", "Headache", "Tremor"], contraindications: ["Renal failure", "Diabetic ketoacidosis"], schedule: "Schedule H", basePrice: 260 },
  { brand: "Jalra M", generic: "Vildagliptin + Metformin", comp: "Vildagliptin & Metformin Hydrochloride", cat: "Antidiabetics", dosage: "Tablet", mfr: "USV Private Ltd", details: "Combination therapy for glycemic control.", sideEffects: ["Nausea", "Metallic taste"], contraindications: ["Renal dysfunction"], schedule: "Schedule H", basePrice: 245 },
  { brand: "Januvia", generic: "Sitagliptin", comp: "Sitagliptin Phosphate", cat: "Antidiabetics", dosage: "Tablet", mfr: "MSD India", details: "DPP-4 inhibitor used for type 2 diabetes management.", sideEffects: ["Upper respiratory tract infection", "Headache", "Hypoglycemia"], contraindications: ["Type 1 diabetes", "Diabetic ketoacidosis"], schedule: "Schedule H", basePrice: 380 },
  { brand: "Istavel", generic: "Sitagliptin", comp: "Sitagliptin", cat: "Antidiabetics", dosage: "Tablet", mfr: "Sun Pharmaceutical Industries", details: "Oral hypoglycemic agent.", sideEffects: ["Nasopharyngitis", "Hypoglycemia"], contraindications: ["Hypersensitivity"], schedule: "Schedule H", basePrice: 350 },

  // Gastrointestinal
  { brand: "Pantocid", generic: "Pantoprazole", comp: "Pantoprazole Sodium", cat: "Gastrointestinal", dosage: "Tablet", mfr: "Alkem Laboratories Ltd", details: "Proton pump inhibitor that decreases the amount of acid produced in the stomach.", sideEffects: ["Headache", "Diarrhea", "Flatulence"], contraindications: ["Hypersensitivity"], schedule: "Schedule H", basePrice: 140 },
  { brand: "Pan", generic: "Pantoprazole", comp: "Pantoprazole Sodium", cat: "Gastrointestinal", dosage: "Tablet", mfr: "Alkem Laboratories Ltd", details: "Used for gastroesophageal reflux disease and peptic ulcer disease.", sideEffects: ["Dizziness", "Stomach ache"], contraindications: ["Allergy to PPIs"], schedule: "Schedule H", basePrice: 135 },
  { brand: "Pantodac", generic: "Pantoprazole", comp: "Pantoprazole", cat: "Gastrointestinal", dosage: "Tablet", mfr: "Zydus Cadila", details: "Relieves acidity, heartburn and acid reflux.", sideEffects: ["Nausea", "Headache"], contraindications: ["Hypersensitivity"], schedule: "Schedule H", basePrice: 125 },
  { brand: "Omez", generic: "Omeprazole", comp: "Omeprazole", cat: "Gastrointestinal", dosage: "Capsule", mfr: "Dr. Reddy's Laboratories", details: "Proton pump inhibitor used to treat acid reflux and ulcers.", sideEffects: ["Headache", "Nausea", "Diarrhea"], contraindications: ["Allergy to omeprazole"], schedule: "Schedule H", basePrice: 60 },
  { brand: "Omee", generic: "Omeprazole", comp: "Omeprazole", cat: "Gastrointestinal", dosage: "Capsule", mfr: "Alkem Laboratories Ltd", details: "Acid reducer capsule.", sideEffects: ["Dizziness", "Joint pain"], contraindications: ["Hypersensitivity"], schedule: "Schedule H", basePrice: 55 },
  { brand: "Rantac", generic: "Ranitidine", comp: "Ranitidine Hydrochloride", cat: "Gastrointestinal", dosage: "Tablet", mfr: "J.B. Chemicals & Pharmaceuticals", details: "H2-receptor antagonist used to reduce stomach acid production.", sideEffects: ["Headache", "Dizziness", "Constipation"], contraindications: ["Porphyria history"], schedule: "OTC", basePrice: 40 },
  { brand: "Aciloc", generic: "Ranitidine", comp: "Ranitidine", cat: "Gastrointestinal", dosage: "Tablet", mfr: "Cadila Pharmaceuticals", details: "Relieves acid indigestion and sour stomach.", sideEffects: ["Fatigue", "Muscle pain"], contraindications: ["Hypersensitivity"], schedule: "OTC", basePrice: 35 },
  { brand: "Veloz", generic: "Rabeprazole", comp: "Rabeprazole Sodium", cat: "Gastrointestinal", dosage: "Tablet", mfr: "Torrent Pharmaceuticals", details: "Fast-acting proton pump inhibitor for acidity and gastrointestinal reflux.", sideEffects: ["Headache", "Nausea", "Sore throat"], contraindications: ["Pregnancy", "Lactation"], schedule: "Schedule H", basePrice: 150 },
  { brand: "Razo", generic: "Rabeprazole", comp: "Rabeprazole", cat: "Gastrointestinal", dosage: "Tablet", mfr: "Dr. Reddy's Laboratories", details: "Rapid acid suppression drug.", sideEffects: ["Diarrhea", "Dizziness"], contraindications: ["Hypersensitivity"], schedule: "Schedule H", basePrice: 145 },

  // Respiratory & Antihistamines
  { brand: "Zyrtec", generic: "Cetirizine", comp: "Cetirizine Hydrochloride", cat: "Respiratory", dosage: "Tablet", mfr: "GlaxoSmithKline", details: "Antihistamine used to treat allergies, runny nose, sneezing.", sideEffects: ["Drowsiness", "Dry mouth", "Fatigue"], contraindications: ["Severe renal failure"], schedule: "OTC", basePrice: 35 },
  { brand: "Cetzine", generic: "Cetirizine", comp: "Cetirizine", cat: "Respiratory", dosage: "Tablet", mfr: "GlaxoSmithKline", details: "Anti-allergic relief.", sideEffects: ["Sleepiness", "Dry throat"], contraindications: ["Kidney dysfunction"], schedule: "OTC", basePrice: 32 },
  { brand: "Okacet", generic: "Cetirizine", comp: "Cetirizine", cat: "Respiratory", dosage: "Tablet", mfr: "Cipla Ltd", details: "Symptomatic treatment of allergic rhinitis.", sideEffects: ["Drowsiness", "Fatigue"], contraindications: ["Severe renal impairment"], schedule: "OTC", basePrice: 28 },
  { brand: "Montek LC", generic: "Montelukast + Levocetirizine", comp: "Montelukast & Levocetirizine Dihydrochloride", cat: "Respiratory", dosage: "Tablet", mfr: "Sun Pharmaceutical Industries", details: "Combination drug used for allergic rhinitis, asthma symptoms.", sideEffects: ["Sleepiness", "Dry mouth", "Headache"], contraindications: ["Kidney failure", "Galactose intolerance"], schedule: "Schedule H", basePrice: 195 },
  { brand: "Monticope", generic: "Montelukast + Levocetirizine", comp: "Montelukast & Levocetirizine Dihydrochloride", cat: "Respiratory", dosage: "Tablet", mfr: "Mankind Pharma Ltd", details: "Used for allergy and asthma relief.", sideEffects: ["Fatigue", "Dizziness"], contraindications: ["Severe renal impairment"], schedule: "Schedule H", basePrice: 170 },
  { brand: "Telekast L", generic: "Montelukast + Levocetirizine", comp: "Montelukast & Levocetirizine", cat: "Respiratory", dosage: "Tablet", mfr: "Lupin Ltd", details: "Prevents asthma and treats allergies.", sideEffects: ["Sleepiness", "Stomach upset"], contraindications: ["Kidney disease"], schedule: "Schedule H", basePrice: 180 },
  { brand: "Allegra", generic: "Fexofenadine", comp: "Fexofenadine Hydrochloride", cat: "Respiratory", dosage: "Tablet", mfr: "Sanofi India Ltd", details: "Non-drowsy allergy relief for hay fever, conjunctivitis, and hives.", sideEffects: ["Headache", "Drowsiness", "Nausea"], contraindications: ["Kidney disease"], schedule: "Schedule H", basePrice: 195 },
  { brand: "Fexo", generic: "Fexofenadine", comp: "Fexofenadine", cat: "Respiratory", dosage: "Tablet", mfr: "Cipla Ltd", details: "Allergic rhinitis and urticaria relief.", sideEffects: ["Dry mouth", "Dizziness"], contraindications: ["Hypersensitivity"], schedule: "Schedule H", basePrice: 160 },
  { brand: "Asthalin", generic: "Salbutamol", comp: "Salbutamol Sulfate", cat: "Respiratory", dosage: "Inhaler", mfr: "Cipla Ltd", details: "Bronchodilator providing rapid relief from asthma, wheezing, and COPD symptoms.", sideEffects: ["Tremors", "Headache", "Fast heart rate"], contraindications: ["Threatened abortion", "Cardiac disease"], schedule: "Schedule H", basePrice: 140 },

  // Neurology & Psychiatry
  { brand: "Nexito", generic: "Escitalopram", comp: "Escitalopram Oxalate", cat: "Neurology & Psychiatry", dosage: "Tablet", mfr: "Sun Pharmaceutical Industries", details: "SSRI antidepressant used to treat depression and generalized anxiety disorder.", sideEffects: ["Nausea", "Sexual dysfunction", "Insomnia"], contraindications: ["Concomitant use of MAOIs", "QT prolongation"], schedule: "Schedule H", basePrice: 100 },
  { brand: "Cipralex", generic: "Escitalopram", comp: "Escitalopram", cat: "Neurology & Psychiatry", dosage: "Tablet", mfr: "Lundbeck India", details: "Treatment of major depressive episodes.", sideEffects: ["Sweating", "Fatigue"], contraindications: ["MAOI therapy"], schedule: "Schedule H", basePrice: 120 },
  { brand: "Zoloft", generic: "Sertraline", comp: "Sertraline Hydrochloride", cat: "Neurology & Psychiatry", dosage: "Tablet", mfr: "Pfizer India Ltd", details: "SSRI for major depressive disorder, panic disorder, and OCD.", sideEffects: ["Diarrhea", "Tremor", "Insomnia"], contraindications: ["Concomitant use with pimozide or MAOIs"], schedule: "Schedule H", basePrice: 210 },
  { brand: "Alprax", generic: "Alprazolam", comp: "Alprazolam", cat: "Neurology & Psychiatry", dosage: "Tablet", mfr: "Torrent Pharmaceuticals", details: "Benzodiazepine for short-term relief of severe anxiety and panic attacks.", sideEffects: ["Sedation", "Drowsiness", "Memory impairment"], contraindications: ["Acute narrow-angle glaucoma", "Sleep apnea"], schedule: "Schedule H1", basePrice: 38 },
  { brand: "Trika", generic: "Alprazolam", comp: "Alprazolam", cat: "Neurology & Psychiatry", dosage: "Tablet", mfr: "Unichem Laboratories", details: "Symptomatic relief of anxiety.", sideEffects: ["Slurred speech", "Dizziness"], contraindications: ["Severe respiratory depression"], schedule: "Schedule H1", basePrice: 32 },

  // Vitamins & Supplements
  { brand: "Shelcal", generic: "Calcium + Vitamin D3", comp: "Calcium Carbonate & Vitamin D3", cat: "Vitamins & Supplements", dosage: "Tablet", mfr: "Torrent Pharmaceuticals", details: "Essential supplement for maintaining strong bones and teeth.", sideEffects: ["Constipation", "Flatulence", "Hypercalcemia at high dose"], contraindications: ["Hypercalcemia", "Severe renal calculi"], schedule: "OTC", basePrice: 110 },
  { brand: "Calcijoint", generic: "Calcium + Vitamin D3", comp: "Calcium & Vitamin D3", cat: "Vitamins & Supplements", dosage: "Tablet", mfr: "Mankind Pharma Ltd", details: "Supplement for calcium deficiency.", sideEffects: ["Nausea", "Stomach upset"], contraindications: ["Hypercalcemia"], schedule: "OTC", basePrice: 90 },
  { brand: "Becosules", generic: "Vitamin B-Complex", comp: "B-Complex Vitamins with Vitamin C", cat: "Vitamins & Supplements", dosage: "Capsule", mfr: "Pfizer India Ltd", details: "Supports energy metabolism and corrects nutritional deficiencies.", sideEffects: ["Bright yellow urine", "Mild stomach upset"], contraindications: ["Hypersensitivity to any component"], schedule: "OTC", basePrice: 45 },
  { brand: "Nurokind-OD", generic: "Methylcobalamin", comp: "Mecobalamin", cat: "Vitamins & Supplements", dosage: "Tablet", mfr: "Mankind Pharma Ltd", details: "Active form of Vitamin B12 used to treat peripheral neuropathies and anemia.", sideEffects: ["Headache", "Nausea", "Itching"], contraindications: ["Hypersensitivity"], schedule: "OTC", basePrice: 160 },

  // NSAIDs
  { brand: "Combiflam", generic: "Ibuprofen + Paracetamol", comp: "Ibuprofen & Paracetamol", cat: "NSAIDs", dosage: "Tablet", mfr: "Sanofi India Ltd", details: "Synergistic pain relief formulation for muscle pain, toothache, and headache.", sideEffects: ["Acidity", "Heartburn", "Stomach pain"], contraindications: ["Active peptic ulcer", "Severe heart failure"], schedule: "OTC", basePrice: 38 },
  { brand: "Brufen", generic: "Ibuprofen", comp: "Ibuprofen", cat: "NSAIDs", dosage: "Tablet", mfr: "Abbott India Ltd", details: "NSAID used for relieving pain, fever, and inflammation.", sideEffects: ["Nausea", "Indigestion", "Headache"], contraindications: ["Active gastrointestinal bleeding"], schedule: "OTC", basePrice: 18 },
  { brand: "Zerodol-SP", generic: "Aceclofenac + Paracetamol + Serratiopeptidase", comp: "Aceclofenac & Paracetamol & Serratiopeptidase", cat: "NSAIDs", dosage: "Tablet", mfr: "Ipca Laboratories", details: "Combination pain reliever used to reduce pain and swelling after injury or surgery.", sideEffects: ["Nausea", "Diarrhea", "Dizziness"], contraindications: ["Peptic ulcer", "Severe liver/kidney disease"], schedule: "Schedule H", basePrice: 120 },
  { brand: "Meftal-Spas", generic: "Mefenamic Acid + Dicyclomine", comp: "Mefenamic Acid & Dicyclomine Hydrochloride", cat: "NSAIDs", dosage: "Tablet", mfr: "Blue Cross Laboratories", details: "Used for menstrual cramps, abdominal colic, and muscular spasms.", sideEffects: ["Dry mouth", "Blurred vision", "Dizziness"], contraindications: ["Glaucoma", "Myasthenia gravis", "Ulcerative colitis"], schedule: "Schedule H", basePrice: 48 },

  // Dermatology / Antiseptics
  { brand: "Betadine", generic: "Povidone Iodine", comp: "Povidone Iodine", cat: "Dermatology", dosage: "Ointment", mfr: "Win-Medicare Pvt Ltd", details: "Antiseptic applied to minor cuts, scrapes, and burns.", sideEffects: ["Skin irritation", "Allergic reaction"], contraindications: ["Thyroid disorders in long term use", "Deep wounds"], schedule: "OTC", basePrice: 140 },
  { brand: "Candid", generic: "Clotrimazole", comp: "Clotrimazole", cat: "Dermatology", dosage: "Powder", mfr: "Glenmark Pharmaceuticals", details: "Antifungal powder to prevent skin infections and absorb excess moisture.", sideEffects: ["Skin redness", "Burning sensation"], contraindications: ["Hypersensitivity"], schedule: "OTC", basePrice: 130 },
  { brand: "Ringcutter", generic: "Miconazole", comp: "Miconazole Nitrate", cat: "Dermatology", dosage: "Cream", mfr: "Janssen Pharmaceuticals", details: "Broad-spectrum antifungal cream to treat ringworm, athlete's foot.", sideEffects: ["Skin peeling", "Contact dermatitis"], contraindications: ["Hypersensitivity"], schedule: "OTC", basePrice: 120 },

  // PMBJP User Imported Medicines
  { brand: "Zerodol-P 10's", generic: "Aceclofenac 100mg and Paracetamol 325mg Tablets", comp: "Aceclofenac 100mg & Paracetamol 325mg", cat: "NSAIDs", dosage: "Tablet", mfr: "Ipca Laboratories Ltd", details: "Combination of Aceclofenac and Paracetamol for fast relief from inflammatory pain, joint stiffness, and musculoskeletal conditions.", sideEffects: ["Nausea", "Gastric irritation", "Dizziness"], contraindications: ["Active peptic ulcer", "Severe liver/kidney disease"], schedule: "Schedule H", basePrice: 60.00, pmbjpCode: "1", unitSize: "10's", exactGenericPrice: 10.32, isUserImported: true },
  { brand: "Zerodol 100mg", generic: "Aceclofenac Tablets IP 100 mg", comp: "Aceclofenac 100mg", cat: "NSAIDs", dosage: "Tablet", mfr: "Ipca Laboratories Ltd", details: "NSAID formulation used for symptomatic treatment of pain and inflammation in osteoarthritis, rheumatoid arthritis and ankylosing spondylitis.", sideEffects: ["Nausea", "Gastric irritation", "Dizziness"], contraindications: ["Active peptic ulcer", "Severe liver/kidney disease"], schedule: "Schedule H", basePrice: 45.00, pmbjpCode: "2", unitSize: "10's", exactGenericPrice: 8.25, isUserImported: true },
  { brand: "Pregabid 75 Capsules", generic: "Pregabalin Capsules IP 75 mg", comp: "Pregabalin 75mg", cat: "Neurology & Psychiatry", dosage: "Capsule", mfr: "Pfizer India Ltd", details: "Indicated for neuropathic pain associated with diabetic peripheral neuropathy, postherpetic neuralgia, and fibromyalgia.", sideEffects: ["Nausea", "Gastric irritation", "Dizziness"], contraindications: ["Active peptic ulcer", "Severe liver/kidney disease"], schedule: "Schedule H", basePrice: 160.00, pmbjpCode: "3", unitSize: "10's", exactGenericPrice: 22.69, isUserImported: true },
  { brand: "Ecosprin 150mg", generic: "Aspirin Gastro-resistant Tablets IP 150 mg", comp: "Aspirin 150mg", cat: "Cardiovascular", dosage: "Tablet", mfr: "USV Private Ltd", details: "Antiplatelet agent designed to prevent platelet aggregation, reducing risk of myocardial infarction and recurrence of thrombotic strokes.", sideEffects: ["Nausea", "Gastric irritation", "Dizziness"], contraindications: ["Active peptic ulcer", "Severe liver/kidney disease"], schedule: "Schedule H", basePrice: 15.00, pmbjpCode: "5", unitSize: "14's", exactGenericPrice: 5.16, isUserImported: true },
  { brand: "Myospas Forte", generic: "Chlorzoxazone 500mg, Diclofenac 50mg and Paracetamol 325mg Tablets", comp: "Chlorzoxazone 500mg & Diclofenac 50mg & Paracetamol 325mg", cat: "NSAIDs", dosage: "Tablet", mfr: "Win-Medicare Pvt Ltd", details: "Synergistic muscle relaxant and dual-analgesic formulation targeted at relieving severe painful spasms and acute musculoskeletal injury pain.", sideEffects: ["Nausea", "Gastric irritation", "Dizziness"], contraindications: ["Active peptic ulcer", "Severe liver/kidney disease"], schedule: "Schedule H", basePrice: 120.00, pmbjpCode: "6", unitSize: "10's", exactGenericPrice: 25.78, isUserImported: true },
  { brand: "Voveran Gel 15g", generic: "Diclofenac Gel IP 1.16%w/w (Diclofenac Diethylamine)", comp: "Diclofenac Gel 1.16% w/w", cat: "NSAIDs", dosage: "Topical Cream/Ointment", mfr: "Novartis India Ltd", details: "Topically applied non-steroidal anti-inflammatory gel for localized relief of muscular aches, sprains, osteoarthritic knee pain, and sports injuries.", sideEffects: ["Nausea", "Gastric irritation", "Dizziness"], contraindications: ["Active peptic ulcer", "Severe liver/kidney disease"], schedule: "OTC", basePrice: 75.00, pmbjpCode: "7", unitSize: "15 g", exactGenericPrice: 12.38, isUserImported: true },
  { brand: "Emanzen-D 10's", generic: "Serratiopeptidase 10mg and Diclofenac Sodium 50mg Tablets", comp: "Diclofenac Sodium 50mg & Serratiopeptidase 10mg", cat: "NSAIDs", dosage: "Tablet", mfr: "Novartis India Ltd", details: "Combination of proteolytic enzyme Serratiopeptidase and Diclofenac Sodium to break down abnormal proteins at inflammation sites and relieve moderate-to-severe postoperative pain.", sideEffects: ["Nausea", "Gastric irritation", "Dizziness"], contraindications: ["Active peptic ulcer", "Severe liver/kidney disease"], schedule: "Schedule H", basePrice: 110.00, pmbjpCode: "8", unitSize: "10's", exactGenericPrice: 15.88, isUserImported: true },
  { brand: "Voveran SR 100mg", generic: "Diclofenac Sodium Prolonged Release Tablets IP 100 mg", comp: "Diclofenac Sodium 100mg", cat: "NSAIDs", dosage: "Tablet", mfr: "Novartis India Ltd", details: "Sustained release formulation providing continuous therapeutic levels of diclofenac over 24 hours, minimizing dosage frequency for chronic arthritis patients.", sideEffects: ["Nausea", "Gastric irritation", "Dizziness"], contraindications: ["Active peptic ulcer", "Severe liver/kidney disease"], schedule: "Schedule H", basePrice: 105.00, pmbjpCode: "9", unitSize: "10's", exactGenericPrice: 12.47, isUserImported: true },
  { brand: "Voveran AQ Injection 3ml", generic: "Diclofenac Sodium Injection IP 25mg per ml 3 ml", comp: "Diclofenac Sodium 25mg/ml (3ml)", cat: "NSAIDs", dosage: "Injection", mfr: "Novartis India Ltd", details: "Intramuscular or slow intravenous injection for immediate control of severe renal colic, biliary colic, acute postoperative pain, and migraine attacks.", sideEffects: ["Nausea", "Gastric irritation", "Dizziness"], contraindications: ["Active peptic ulcer", "Severe liver/kidney disease"], schedule: "Schedule H", basePrice: 28.00, pmbjpCode: "10", unitSize: "3 ml", exactGenericPrice: 3.75, isUserImported: true },
  { brand: "Voveran 50mg", generic: "Diclofenac Gastro-Resistant Tablets IP 50 mg", comp: "Diclofenac Sodium 50mg", cat: "NSAIDs", dosage: "Tablet", mfr: "Novartis India Ltd", details: "Enteric-coated diclofenac sodium tablet to reduce gastric irritation during pain relief.", sideEffects: ["Nausea", "Gastric irritation", "Dizziness"], contraindications: ["Active peptic ulcer", "Severe liver/kidney disease"], schedule: "Schedule H", basePrice: 45.00, pmbjpCode: "11", unitSize: "10's", exactGenericPrice: 5.68, isUserImported: true },
  { brand: "Nucoxia 120mg", generic: "Etoricoxib Tablets IP 120 mg", comp: "Etoricoxib 120mg", cat: "NSAIDs", dosage: "Tablet", mfr: "Zydus Cadila", details: "Highly selective COX-2 inhibitor with prolonged analgesic efficacy used to treat severe acute gouty arthritis and acute dental postoperative pain.", sideEffects: ["Nausea", "Gastric irritation", "Dizziness"], contraindications: ["Active peptic ulcer", "Severe liver/kidney disease"], schedule: "Schedule H", basePrice: 220.00, pmbjpCode: "12", unitSize: "10's", exactGenericPrice: 35.63, isUserImported: true },
  { brand: "Nucoxia 90mg", generic: "Etoricoxib Tablets IP 90 mg", comp: "Etoricoxib 90mg", cat: "NSAIDs", dosage: "Tablet", mfr: "Zydus Cadila", details: "COX-2 selective anti-inflammatory tablet designed for daily management of rheumatoid arthritis, osteoarthritis, and ankylosing spondylitis pain.", sideEffects: ["Nausea", "Gastric irritation", "Dizziness"], contraindications: ["Active peptic ulcer", "Severe liver/kidney disease"], schedule: "Schedule H", basePrice: 175.00, pmbjpCode: "13", unitSize: "10's", exactGenericPrice: 31.97, isUserImported: true },
  { brand: "Combiflam 10's", generic: "Ibuprofen 400mg and Paracetamol 325mg Tablets IP", comp: "Ibuprofen 400mg & Paracetamol 325mg", cat: "NSAIDs", dosage: "Tablet", mfr: "Sanofi India Ltd", details: "Synergistic combination of Ibuprofen and Paracetamol providing effective relief from fever, migraine, menstrual pain, toothaches, and soft tissue injuries.", sideEffects: ["Nausea", "Gastric irritation", "Dizziness"], contraindications: ["Active peptic ulcer", "Severe liver/kidney disease"], schedule: "OTC", basePrice: 38.00, pmbjpCode: "14", unitSize: "10's", exactGenericPrice: 8.25, isUserImported: true },
  { brand: "Brufen 200mg", generic: "Ibuprofen Tablets IP 200 mg", comp: "Ibuprofen 200mg", cat: "NSAIDs", dosage: "Tablet", mfr: "Abbott India Ltd", details: "Classical NSAID agent providing anti-inflammatory, analgesic, and antipyretic benefits for pediatric and adult pain conditions.", sideEffects: ["Nausea", "Gastric irritation", "Dizziness"], contraindications: ["Active peptic ulcer", "Severe liver/kidney disease"], schedule: "OTC", basePrice: 18.00, pmbjpCode: "15", unitSize: "10's", exactGenericPrice: 2.81, isUserImported: true }
];

// Let's generate exactly 510 unique medicine entries by creating variations of strengths (e.g. 50mg, 100mg, 250mg, 500mg, 650mg, 10mg, 20mg, 40mg, etc.)
const medicines = [];
let idCounter = 1;

// Define strength/form variations based on base brands
const strengths = {
  "Crocin": ["500mg", "650mg", "Advance"],
  "Calpol": ["250mg Suspension", "500mg", "650mg"],
  "Dolo": ["120mg Syrup", "250mg Suspension", "500mg", "650mg"],
  "Pacimol": ["500mg", "650mg"],
  "Augmentin": ["375mg", "625 Duo", "1g DDS"],
  "Clavam": ["375mg", "625 Duo", "Bid 457mg Syrup"],
  "Moxikind-CV": ["375mg", "625mg"],
  "Azithral": ["250mg", "500mg", "Liquid 200mg/5ml"],
  "Azee": ["250mg", "500mg", "1000mg"],
  "Cifran": ["250mg", "500mg", "OD 1000mg"],
  "Oflox": ["100mg Syrup", "200mg", "400mg"],
  "Monocef": ["250mg Injection", "500mg Injection", "1g Injection", "2g Injection"],
  "Zifi": ["100mg DT", "200mg", "50mg Syrup"],
  "Taxim-O": ["100mg DT", "200mg", "Fort 100mg Syrup"],
  "Lipitor": ["10mg", "20mg", "40mg", "80mg"],
  "Atorva": ["5mg", "10mg", "20mg", "40mg"],
  "Storvas": ["10mg", "20mg", "40mg"],
  "Telma": ["20mg", "40mg", "80mg", "AM (Telmisartan + Amlodipine)", "H (Telmisartan + Hydrochlorothiazide)"],
  "Telmikind": ["20mg", "40mg", "80mg", "AM", "H"],
  "Amlopin": ["2.5mg", "5mg", "10mg"],
  "Stamlo": ["2.5mg", "5mg", "10mg"],
  "Cardace": ["1.25mg", "2.5mg", "5mg", "10mg"],
  "Rosuvas": ["5mg", "10mg", "20mg", "40mg"],
  "Rozavel": ["5mg", "10mg", "20mg", "40mg"],
  "Concor": ["2.5mg", "5mg", "10mg"],
  "Glycomet": ["250mg", "500mg", "850mg", "1g", "GP 1 (Metformin + Glimepiride)", "GP 2"],
  "Metformin ER": ["500mg", "1000mg"],
  "Amaryl": ["1mg", "2mg", "3mg", "4mg", "M 1", "M 2"],
  "Glimy": ["1mg", "2mg", "M 1", "M 2"],
  "Galvus Met": ["50/500mg", "50/850mg", "50/1000mg"],
  "Jalra M": ["50/500mg", "50/850mg", "50/1000mg"],
  "Januvia": ["25mg", "50mg", "100mg"],
  "Istavel": ["25mg", "50mg", "100mg"],
  "Pantocid": ["20mg", "40mg", "HP (Kit)", "D (Pantoprazole + Domperidone)", "L (Pantoprazole + Levosulpiride)"],
  "Pan": ["20mg", "40mg", "D", "L"],
  "Pantodac": ["20mg", "40mg", "D", "L"],
  "Omez": ["10mg", "20mg", "40mg", "DSR", "Insta"],
  "Omee": ["10mg", "20mg", "DSR"],
  "Rantac": ["150mg", "300mg", "Syrup 150mg/10ml"],
  "Aciloc": ["150mg", "300mg", "RD (Ranitidine + Domperidone)"],
  "Veloz": ["10mg", "20mg", "D (Rabeprazole + Domperidone)", "L (Rabeprazole + Levosulpiride)"],
  "Razo": ["10mg", "20mg", "D", "L"],
  "Zyrtec": ["5mg Syrup", "10mg"],
  "Cetzine": ["5mg Syrup", "10mg"],
  "Okacet": ["5mg Syrup", "10mg"],
  "Montek LC": ["Kid Tablet", "Kid Syrup", "Adult 10mg/5mg"],
  "Monticope": ["Kid Tablet", "Kid Syrup", "Adult"],
  "Telekast L": ["Kid Tablet", "Adult"],
  "Allegra": ["30mg Suspension", "120mg", "180mg", "M (Fexofenadine + Montelukast)"],
  "Fexo": ["120mg", "180mg", "M"],
  "Asthalin": ["100mcg Inhaler", "2mg Tablet", "4mg Tablet", "Syrup 2mg/5ml", "AX (Salbutamol + Ambroxol)"],
  "Nexito": ["5mg", "10mg", "20mg", "Plus (Escitalopram + Clonazepam)"],
  "Cipralex": ["5mg", "10mg", "20mg"],
  "Zoloft": ["25mg", "50mg", "100mg"],
  "Alprax": ["0.25mg", "0.5mg", "1mg", "SR 1mg", "Plus (Alprazolam + Propranolol)"],
  "Trika": ["0.25mg", "0.5mg", "1mg"],
  "Shelcal": ["250mg", "500mg", "XT", "HD", "CT"],
  "Calcijoint": ["500mg", "XT", "D3 (Capsules)"],
  "Becosules": ["Capsules", "Syrup", "Performance"],
  "Nurokind-OD": ["Sublingual", "Injection", "Plus", "LC", "G (Methylcobalamin + Gabapentin)"],
  "Combiflam": ["Plus", "Suspension", "Gel", "Tablet"],
  "Brufen": ["200mg", "400mg", "600mg", "Active Gel"],
  "Zerodol-SP": ["Tablet", "MR (Aceclofenac + Tizanidine)", "PT (Aceclofenac + Paracetamol + Tramadol)"],
  "Meftal-Spas": ["Tablet", "Suspension", "DS"],
  "Betadine": ["5% Ointment", "10% Ointment", "10% Solution", "Gargle 2%"],
  "Candid": ["Dusting Powder 1%", "Gel 1%", "V6 (Vaginal Tablet)", "B (Clotrimazole + Beclomethasone)"],
  "Ringcutter": ["Cream", "Powder", "Lotion"]
};

// Generate items using template properties + strength specific scaling
for (const tmpl of templates) {
  const brandList = strengths[tmpl.brand] || ["Standard"];
  
  for (const str of brandList) {
    // Generate unique barcode: 890 (India prefix) + random 10 digits
    const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const barcode = `890${randomDigits}`;

    // Price scaling based on strength label
    let priceScale = 1.0;
    if (str.includes("650") || str.includes("625") || str.includes("200") || str.includes("20")) {
      priceScale = 1.25;
    } else if (str.includes("1000") || str.includes("1g") || str.includes("180") || str.includes("80")) {
      priceScale = 1.8;
    } else if (str.includes("250") || str.includes("5mg") || str.includes("0.25") || str.includes("Suspension") || str.includes("Syrup")) {
      priceScale = 0.7;
    } else if (str.includes("Plus") || str.includes("DSR") || str.includes("AM") || str.includes("L") || str.includes("D")) {
      priceScale = 1.4;
    }

    let brandPrice = parseFloat((tmpl.basePrice * priceScale).toFixed(2));
    // Generics savings are usually between 65% and 82%
    const savingsPercent = Math.floor(65 + Math.random() * 17);
    let genericPrice = parseFloat((brandPrice * (1 - savingsPercent / 100)).toFixed(2));
    let savings = savingsPercent;

    if (tmpl.isUserImported) {
      brandPrice = tmpl.basePrice;
      genericPrice = tmpl.exactGenericPrice;
      savings = Math.round(((brandPrice - genericPrice) / brandPrice) * 100);
    }

    const rating = parseFloat((3.8 + Math.random() * 1.1).toFixed(1));
    const reviewCount = Math.floor(10 + Math.random() * 340);
    const availabilityOptions = ["Available", "Available", "Available", "Low Stock", "Out of Stock"];
    const availability = availabilityOptions[Math.floor(Math.random() * availabilityOptions.length)];

    // Adjust dosage depending on strength labels
    let itemDosage = tmpl.dosage;
    if (str.includes("Syrup") || str.includes("Suspension") || str.includes("Solution") || str.includes("Gargle")) {
      itemDosage = "Syrup/Oral Liquid";
    } else if (str.includes("Injection")) {
      itemDosage = "Injection";
    } else if (str.includes("Inhaler")) {
      itemDosage = "Inhaler/Respules";
    } else if (str.includes("Ointment") || str.includes("Cream") || str.includes("Gel")) {
      itemDosage = "Topical Cream/Ointment";
    } else if (str.includes("Powder")) {
      itemDosage = "Dusting Powder";
    } else if (str.includes("Capsule") || str.includes("DSR")) {
      itemDosage = "Capsule";
    }

    const medName = tmpl.isUserImported ? tmpl.brand : `${tmpl.brand} ${str}`;
    const genName = tmpl.isUserImported ? tmpl.generic : `${tmpl.generic} ${str.replace(/AM|H|DSR|L|D|Plus|Kid|Adult|Suspension|Syrup|Injection|Inhaler|Ointment|Cream|Powder|Gel/g, '').trim() || 'Equivalent'}`;
    const compName = tmpl.isUserImported ? tmpl.comp : `${tmpl.comp} ${str}`;

    medicines.push({
      id: idCounter++,
      brandName: medName,
      genericName: genName,
      composition: compName,
      brandPrice,
      genericPrice,
      savings,
      manufacturer: tmpl.mfr,
      category: tmpl.cat,
      details: tmpl.details,
      dosage: itemDosage,
      availability,
      sideEffects: tmpl.sideEffects,
      contraindications: tmpl.contraindications,
      reviews: { rating, reviewCount },
      barcode,
      schedule: tmpl.schedule,
      ...(tmpl.pmbjpCode ? { pmbjpCode: tmpl.pmbjpCode } : {}),
      ...(tmpl.unitSize ? { unitSize: tmpl.unitSize } : {})
    });
  }
}

// Ensure we have exactly 500+ medicines. If short, let's duplicate some with minor changes to fill up.
const baseLen = medicines.length;
let suffixId = 1;
const therapeuticClasses = ["Cardiovascular", "Antidiabetics", "Gastrointestinal", "Respiratory", "Antibiotics", "Analgesics & Antipyretics", "NSAIDs", "Vitamins & Supplements", "Dermatology", "Neurology & Psychiatry"];
const extraMfrs = ["Cipla Ltd", "Lupin Ltd", "Sun Pharmaceutical Industries", "Cadila Pharmaceuticals", "Torrent Pharmaceuticals", "Glenmark Pharmaceuticals", "Mankind Pharma Ltd", "Intas Pharmaceuticals", "Macleods Pharmaceuticals"];

while (medicines.length < 520) {
  const source = medicines[Math.floor(Math.random() * baseLen)];
  const strengthVal = ["10mg", "20mg", "50mg", "100mg", "250mg", "500mg", "OD", "XR"][Math.floor(Math.random() * 8)];
  const brandName = `${source.brandName.split(' ')[0]} ${strengthVal}`;
  
  // Check uniqueness
  if (medicines.some(m => m.brandName === brandName)) {
    continue;
  }

  const brandPrice = parseFloat((source.brandPrice * (0.8 + Math.random() * 0.4)).toFixed(2));
  const savingsPercent = Math.floor(65 + Math.random() * 17);
  const genericPrice = parseFloat((brandPrice * (1 - savingsPercent / 100)).toFixed(2));
  const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000).toString();

  medicines.push({
    id: idCounter++,
    brandName,
    genericName: `${source.genericName.split(' ')[0]} ${strengthVal}`,
    composition: `${source.composition.split(' ')[0]} ${strengthVal}`,
    brandPrice,
    genericPrice,
    savings: savingsPercent,
    manufacturer: extraMfrs[Math.floor(Math.random() * extraMfrs.length)],
    category: source.category,
    details: source.details,
    dosage: source.dosage,
    availability: ["Available", "Available", "Low Stock"][Math.floor(Math.random() * 3)],
    sideEffects: source.sideEffects,
    contraindications: source.contraindications,
    reviews: {
      rating: parseFloat((3.8 + Math.random() * 1.1).toFixed(1)),
      reviewCount: Math.floor(5 + Math.random() * 150)
    },
    barcode: `890${randomDigits}`,
    schedule: source.schedule
  });
}

// Let's create realistic stores
const stores = [
  { id: 101, name: "PMBJP Kendra - Connaught Place", type: "Government Janaushadhi Store", rating: 4.8, phone: "+91 11-23415522", address: "Shop 12, Block N, Connaught Place, New Delhi", lat: 28.6304, lng: 77.2177, openHours: "09:00 AM - 09:00 PM", homeDelivery: true, availableMedicines: [1, 2, 3, 4, 5, 9, 10, 11, 15, 20, 25, 30] },
  { id: 102, name: "Pradhan Mantri Bhartiya Janaushadhi Store", type: "Government Janaushadhi Store", rating: 4.5, phone: "+91 22-22883311", address: "G-5, Ground Floor, Nariman Point, Mumbai", lat: 18.9268, lng: 72.8224, openHours: "10:00 AM - 08:30 PM", homeDelivery: false, availableMedicines: [1, 3, 4, 6, 8, 11, 12, 18, 22, 28, 35, 40] },
  { id: 103, name: "Generic Plus Pharmacy - Indiranagar", type: "Private Generic Store", rating: 4.6, phone: "+91 80-41223344", address: "812, 100 Feet Rd, Indiranagar, Bengaluru", lat: 12.9718, lng: 77.6412, openHours: "08:00 AM - 10:00 PM", homeDelivery: true, availableMedicines: [1, 2, 3, 4, 5, 7, 13, 14, 19, 21, 24, 33, 45] },
  { id: 104, name: "Jan Aushadhi Store - Shivaji Nagar", type: "Government Janaushadhi Store", rating: 4.7, phone: "+91 20-25539988", address: "Modern College Rd, Shivaji Nagar, Pune", lat: 18.5308, lng: 73.8474, openHours: "09:00 AM - 09:30 PM", homeDelivery: true, availableMedicines: [1, 2, 4, 5, 12, 15, 16, 23, 27, 31, 36, 42] },
  { id: 105, name: "Aarogya Generic Chemist - Dadar", type: "Private Generic Store", rating: 4.4, phone: "+91 22-24151122", address: "Dadar East, Near Railway Station, Mumbai", lat: 19.0178, lng: 72.8478, openHours: "08:30 AM - 09:30 PM", homeDelivery: true, availableMedicines: [1, 4, 5, 6, 10, 13, 17, 26, 29, 32, 34, 38, 41] },
  { id: 106, name: "Janaushadhi Kendra - Sector 62 Noida", type: "Government Janaushadhi Store", rating: 4.9, phone: "+91 120-4567890", address: "C-56, Sector 62, Noida, Uttar Pradesh", lat: 28.6219, lng: 77.3639, openHours: "09:00 AM - 10:00 PM", homeDelivery: true, availableMedicines: [1, 2, 3, 4, 5, 7, 8, 14, 20, 30, 39, 44, 48, 50] },
  { id: 107, name: "PMBJP Kendra - Salt Lake Sector V", type: "Government Janaushadhi Store", rating: 4.6, phone: "+91 33-23579900", address: "EP Block, Sector V, Salt Lake, Kolkata", lat: 22.5726, lng: 88.4339, openHours: "09:00 AM - 09:00 PM", homeDelivery: false, availableMedicines: [2, 5, 8, 10, 12, 14, 16, 18, 22, 24, 26, 30, 35, 40, 45, 50] },
  { id: 108, name: "MedSave Generic Pharmacy - Adyar", type: "Private Generic Store", rating: 4.5, phone: "+91 44-24451100", address: "Gandhi Nagar, Adyar, Chennai", lat: 13.0067, lng: 80.2578, openHours: "08:00 AM - 10:30 PM", homeDelivery: true, availableMedicines: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49] }
];

// Add extra random available medicines to all stores so they have plenty of stock matches
for (const store of stores) {
  const existingSet = new Set(store.availableMedicines);
  while (existingSet.size < 180) {
    existingSet.add(Math.floor(1 + Math.random() * medicines.length));
  }
  store.availableMedicines = Array.from(existingSet);
}

// Standard market trends
const marketTrends = {
  adoptionRates: [
    { year: 2022, rate: 18.5 },
    { year: 2023, rate: 24.2 },
    { year: 2024, rate: 32.8 },
    { year: 2025, rate: 45.0 },
    { year: 2026, rate: 58.3 }
  ],
  categoryAnalysis: [
    { name: "Antibiotics", brandedAvg: 180, genericAvg: 48, savings: 73 },
    { name: "Cardiovascular", brandedAvg: 120, genericAvg: 28, savings: 76 },
    { name: "Antidiabetics", brandedAvg: 85, genericAvg: 19, savings: 77 },
    { name: "Analgesics", brandedAvg: 30, genericAvg: 8, savings: 73 },
    { name: "Gastrointestinal", brandedAvg: 140, genericAvg: 32, savings: 77 }
  ],
  regionalPricing: [
    { zone: "North", averagePremium: 290, genericAverage: 38 },
    { zone: "South", averagePremium: 265, genericAverage: 35 },
    { zone: "West", averagePremium: 280, genericAverage: 36 },
    { zone: "East", averagePremium: 250, genericAverage: 34 }
  ],
  monthlyVolume: [
    { month: "Jul 25", demandBranded: 5400, demandGeneric: 2100 },
    { month: "Aug 25", demandBranded: 5200, demandGeneric: 2300 },
    { month: "Sep 25", demandBranded: 5000, demandGeneric: 2600 },
    { month: "Oct 25", demandBranded: 4800, demandGeneric: 3000 },
    { month: "Nov 25", demandBranded: 4600, demandGeneric: 3400 },
    { month: "Dec 25", demandBranded: 4300, demandGeneric: 3900 },
    { month: "Jan 26", demandBranded: 4100, demandGeneric: 4400 },
    { month: "Feb 26", demandBranded: 3900, demandGeneric: 4800 },
    { month: "Mar 26", demandBranded: 3700, demandGeneric: 5300 },
    { month: "Apr 26", demandBranded: 3500, demandGeneric: 5800 },
    { month: "May 26", demandBranded: 3300, demandGeneric: 6400 },
    { month: "Jun 26", demandBranded: 3100, demandGeneric: 7100 }
  ],
  manufacturersShare: [
    { name: "Janaushadhi (PMBJP)", value: 42 },
    { name: "Cipla (Generic Div)", value: 21 },
    { name: "Alkem (Alkem Generic)", value: 15 },
    { name: "Abbott Generics", value: 12 },
    { name: "Others", value: 10 }
  ]
};

const fullData = {
  medicines,
  stores,
  marketTrends
};

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

fs.writeFileSync(DB_FILE, JSON.stringify(fullData, null, 2), 'utf-8');
console.log(`Successfully generated database with ${medicines.length} medicines and ${stores.length} stores.`);
