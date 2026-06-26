const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Preloaded mock database containing highly realistic Indian medical market data
const seedData = {
  medicines: [
    { id: 1, brandName: "Crocin 650", genericName: "Paracetamol 650 mg", composition: "Paracetamol 650mg", brandPrice: 35.0, genericPrice: 10.2, savings: 71, manufacturer: "GlaxoSmithKline Pharmaceuticals", category: "Analgesics & Antipyretics", details: "Used for treatment of fever, mild-to-moderate pain." },
    { id: 2, brandName: "Augmentin 625 Duo", genericName: "Amoxicillin + Clavulanic Acid 625", composition: "Amoxicillin 500mg + Clavulanic Acid 125mg", brandPrice: 223.5, genericPrice: 60.1, savings: 73, manufacturer: "GlaxoSmithKline", category: "Antibiotics", details: "Penicillin-class antibiotic used to treat bacterial infections." },
    { id: 3, brandName: "Lipitor 10mg", genericName: "Atorvastatin 10 mg", composition: "Atorvastatin 10mg", brandPrice: 95.0, genericPrice: 21.8, savings: 77, manufacturer: "Pfizer India Ltd", category: "Cardiovascular", details: "HMG-CoA reductase inhibitor to reduce bad cholesterol and triglycerides." },
    { id: 4, brandName: "Glycomet 500", genericName: "Metformin 500 mg", composition: "Metformin Hydrochloride 500mg", brandPrice: 45.2, genericPrice: 12.0, savings: 73, manufacturer: "USV Private Ltd", category: "Antidiabetics", details: "First-line medication for the treatment of type 2 diabetes." },
    { id: 5, brandName: "Pantocid 40", genericName: "Pantoprazole 40 mg", composition: "Pantoprazole 40mg", brandPrice: 155.0, genericPrice: 35.5, savings: 77, manufacturer: "Alkem Laboratories Ltd", category: "Gastrointestinal", details: "Proton pump inhibitor that decreases the amount of acid produced in the stomach." },
    { id: 6, brandName: "Zyrtec 10mg", genericName: "Cetirizine 10 mg", composition: "Cetirizine Hydrochloride 10mg", brandPrice: 40.0, genericPrice: 8.8, savings: 78, manufacturer: "GlaxoSmithKline", category: "Antihistamines", details: "Antihistamine used to treat allergies, runny nose, sneezing." },
    { id: 7, brandName: "Azithral 500", genericName: "Azithromycin 500 mg", composition: "Azithromycin 500mg", brandPrice: 130.0, genericPrice: 32.5, savings: 75, manufacturer: "Alembic Pharmaceuticals", category: "Antibiotics", details: "Macrolide antibiotic used for bacterial infections of ears, throat, lungs." },
    { id: 8, brandName: "Montek LC", genericName: "Montelukast + Levocetirizine", composition: "Montelukast 10mg + Levocetirizine 5mg", brandPrice: 210.0, genericPrice: 54.6, savings: 74, manufacturer: "Sun Pharmaceutical Industries", category: "Respiratory", details: "Combination drug used for allergic rhinitis, asthma symptoms." },
    { id: 9, brandName: "Calpol 500", genericName: "Paracetamol 500 mg", composition: "Paracetamol 500mg", brandPrice: 18.0, genericPrice: 6.0, savings: 67, manufacturer: "GlaxoSmithKline", category: "Analgesics & Antipyretics", details: "Fever reducer and pain reliever." },
    { id: 10, brandName: "Pan-D", genericName: "Pantoprazole + Domperidone", composition: "Pantoprazole 40mg + Domperidone 30mg", brandPrice: 198.0, genericPrice: 49.5, savings: 75, manufacturer: "Alkem Laboratories Ltd", category: "Gastrointestinal", details: "Used for GERD, acid reflux, heartburn." },
    { id: 11, brandName: "Telma 40", genericName: "Telmisartan 40 mg", composition: "Telmisartan 40mg", brandPrice: 110.0, genericPrice: 25.3, savings: 77, manufacturer: "Glenmark Pharmaceuticals", category: "Cardiovascular", details: "Angiotensin II receptor antagonist used for high blood pressure." },
    { id: 12, brandName: "Clavam 625 Duo", genericName: "Amoxicillin + Clavulanic Acid 625", composition: "Amoxicillin 500mg + Clavulanic Acid 125mg", brandPrice: 218.0, genericPrice: 60.1, savings: 72, manufacturer: "Alkem Laboratories Ltd", category: "Antibiotics", details: "Bacterial infections treatment." },
    { id: 13, brandName: "Lasix 40mg", genericName: "Furosemide 40 mg", composition: "Furosemide 40mg", brandPrice: 15.4, genericPrice: 4.1, savings: 73, manufacturer: "Sanofi India Ltd", category: "Cardiovascular", details: "Diuretic to treat fluid build-up due to heart failure or liver disease." },
    { id: 14, brandName: "Betadine 10% Ointment", genericName: "Povidone Iodine 10%", composition: "Povidone Iodine 10%", brandPrice: 160.0, genericPrice: 44.8, savings: 72, manufacturer: "Win-Medicare Pvt Ltd", category: "Antiseptics", details: "Antiseptic applied to minor cuts, scrapes, and burns." },
    { id: 15, brandName: "Voveran SR 100", genericName: "Diclofenac Sodium 100 mg", composition: "Diclofenac Sodium 100mg", brandPrice: 105.0, genericPrice: 28.3, savings: 73, manufacturer: "Novartis India Ltd", category: "NSAIDs", details: "Nonsteroidal anti-inflammatory drug (NSAID) for severe joint pain." },
    { id: 16, brandName: "Januvia 100mg", genericName: "Sitagliptin 100 mg", composition: "Sitagliptin 100mg", brandPrice: 420.0, genericPrice: 95.0, savings: 77, manufacturer: "MSD India", category: "Antidiabetics", details: "DPP-4 inhibitor used for type 2 diabetes management." },
    { id: 17, brandName: "Galvus Met 50/500", genericName: "Vildagliptin + Metformin", composition: "Vildagliptin 50mg + Metformin Hydrochloride 500mg", brandPrice: 280.0, genericPrice: 72.0, savings: 74, manufacturer: "Novartis India Ltd", category: "Antidiabetics", details: "Combination oral antidiabetic drug." },
    { id: 18, brandName: "Amaryl 2mg", genericName: "Glimepiride 2 mg", composition: "Glimepiride 2mg", brandPrice: 125.0, genericPrice: 32.0, savings: 74, manufacturer: "Sanofi India Ltd", category: "Antidiabetics", details: "Sulfonylurea medication to lower blood sugar in type 2 diabetes." },
    { id: 19, brandName: "Thyronorm 50mcg", genericName: "Levothyroxine 50 mcg", composition: "Thyroxine Sodium 50mcg", brandPrice: 180.0, genericPrice: 45.0, savings: 75, manufacturer: "Abbott India Ltd", category: "Thyroid", details: "Synthetic thyroid hormone replacement for hypothyroidism." },
    { id: 20, brandName: "Thyronorm 100mcg", genericName: "Levothyroxine 100 mcg", composition: "Thyroxine Sodium 100mcg", brandPrice: 210.0, genericPrice: 52.0, savings: 75, manufacturer: "Abbott India Ltd", category: "Thyroid", details: "For patients needing higher dose thyroid hormone replacement." },
    { id: 21, brandName: "Cardace 5mg", genericName: "Ramipril 5 mg", composition: "Ramipril 5mg", brandPrice: 145.0, genericPrice: 38.0, savings: 74, manufacturer: "Sanofi India Ltd", category: "Cardiovascular", details: "ACE inhibitor used to treat high blood pressure and heart failure." },
    { id: 22, brandName: "Amlopin 5mg", genericName: "Amlodipine 5 mg", composition: "Amlodipine Besylate 5mg", brandPrice: 48.0, genericPrice: 12.0, savings: 75, manufacturer: "Unique Pharmaceuticals", category: "Cardiovascular", details: "Calcium channel blocker used to treat high blood pressure and chest pain." },
    { id: 23, brandName: "Rosuvas 10mg", genericName: "Rosuvastatin 10 mg", composition: "Rosuvastatin Calcium 10mg", brandPrice: 175.0, genericPrice: 42.0, savings: 76, manufacturer: "Sun Pharmaceutical Industries", category: "Cardiovascular", details: "Statin medication for cholesterol reduction." },
    { id: 24, brandName: "Betaloc 50mg", genericName: "Metoprolol Succinate 50 mg", composition: "Metoprolol Succinate 50mg", brandPrice: 190.0, genericPrice: 48.0, savings: 75, manufacturer: "AstraZeneca India", category: "Cardiovascular", details: "Beta-blocker to treat high blood pressure, angina, and heart failure." },
    { id: 25, brandName: "Plavix 75mg", genericName: "Clopidogrel 75 mg", composition: "Clopidogrel Bisulfate 75mg", brandPrice: 240.0, genericPrice: 58.0, savings: 76, manufacturer: "Sanofi India Ltd", category: "Cardiovascular", details: "Antiplatelet medication used to prevent blood clots in cardiovascular disease." },
    { id: 26, brandName: "Omez 20mg", genericName: "Omeprazole 20 mg", composition: "Omeprazole 20mg", brandPrice: 65.0, genericPrice: 15.0, savings: 77, manufacturer: "Dr. Reddy's Laboratories", category: "Gastrointestinal", details: "Proton pump inhibitor used to treat acid reflux and ulcers." },
    { id: 27, brandName: "Veloz 20mg", genericName: "Rabeprazole 20 mg", composition: "Rabeprazole Sodium 20mg", brandPrice: 165.0, genericPrice: 38.0, savings: 77, manufacturer: "Torrent Pharmaceuticals", category: "Gastrointestinal", details: "Fast-acting proton pump inhibitor for acidity and gastrointestinal reflux." },
    { id: 28, brandName: "Rantac 150mg", genericName: "Ranitidine 150 mg", composition: "Ranitidine Hydrochloride 150mg", brandPrice: 45.0, genericPrice: 12.0, savings: 73, manufacturer: "J.B. Chemicals & Pharmaceuticals", category: "Gastrointestinal", details: "H2-receptor antagonist used to reduce stomach acid production." },
    { id: 29, brandName: "Domstal 10mg", genericName: "Domperidone 10 mg", composition: "Domperidone 10mg", brandPrice: 35.0, genericPrice: 9.0, savings: 74, manufacturer: "Torrent Pharmaceuticals", category: "Gastrointestinal", details: "Antiemetic used to treat nausea and vomiting." },
    { id: 30, brandName: "Brufen 400mg", genericName: "Ibuprofen 400 mg", composition: "Ibuprofen 400mg", brandPrice: 22.0, genericPrice: 6.5, savings: 70, manufacturer: "Abbott India Ltd", category: "NSAIDs", details: "NSAID used for relieving pain, fever, and inflammation." },
    { id: 31, brandName: "Zerodol-SP", genericName: "Aceclofenac + Paracetamol + Serratiopeptidase", composition: "Aceclofenac 100mg + Paracetamol 325mg + Serratiopeptidase 15mg", brandPrice: 135.0, genericPrice: 34.0, savings: 75, manufacturer: "Ipca Laboratories", category: "NSAIDs", details: "Combination pain reliever used to reduce pain and swelling after injury or surgery." },
    { id: 32, brandName: "Meftal-Spas", genericName: "Mefenamic Acid + Dicyclomine", composition: "Mefenamic Acid 250mg + Dicyclomine Hydrochloride 10mg", brandPrice: 55.0, genericPrice: 14.0, savings: 75, manufacturer: "Blue Cross Laboratories", category: "Antispasmodics", details: "Used for menstrual cramps, abdominal colic, and muscular spasms." },
    { id: 33, brandName: "Cifran 500", genericName: "Ciprofloxacin 500 mg", composition: "Ciprofloxacin Hydrochloride 500mg", brandPrice: 95.0, genericPrice: 24.0, savings: 75, manufacturer: "Sun Pharmaceutical Industries", category: "Antibiotics", details: "Fluoroquinolone antibiotic for treating various bacterial infections." },
    { id: 34, brandName: "Oflox 200", genericName: "Ofloxacin 200 mg", composition: "Ofloxacin 200mg", brandPrice: 85.0, genericPrice: 21.0, savings: 75, manufacturer: "Cipla Ltd", category: "Antibiotics", details: "Used for typhoid fever, urinary tract, and respiratory tract infections." },
    { id: 35, brandName: "Monocef 1g", genericName: "Ceftriaxone 1 g", composition: "Ceftriaxone Sodium 1g", brandPrice: 75.0, genericPrice: 18.0, savings: 76, manufacturer: "Aristo Pharmaceuticals", category: "Antibiotics", details: "Broad-spectrum cephalosporin antibiotic injection." },
    { id: 36, brandName: "Asthalin Inhaler", genericName: "Salbutamol 100mcg", composition: "Salbutamol Sulfate 100mcg per puff", brandPrice: 165.0, genericPrice: 45.0, savings: 73, manufacturer: "Cipla Ltd", category: "Respiratory", details: "Bronchodilator providing rapid relief from asthma, wheezing, and COPD symptoms." },
    { id: 37, brandName: "Pulmicort Respules 0.5mg", genericName: "Budesonide 0.5mg", composition: "Budesonide 0.5mg per 2ml", brandPrice: 110.0, genericPrice: 28.0, savings: 75, manufacturer: "AstraZeneca India", category: "Respiratory", details: "Corticosteroid inhalant suspension for reducing airway inflammation in asthma." },
    { id: 38, brandName: "1-AL 5mg", genericName: "Levocetirizine 5 mg", composition: "Levocetirizine Dihydrochloride 5mg", brandPrice: 70.0, genericPrice: 18.0, savings: 74, manufacturer: "FDC Ltd", category: "Antihistamines", details: "Second-generation antihistamine used to relieve allergy symptoms." },
    { id: 39, brandName: "Allegra 120mg", genericName: "Fexofenadine Hydrochloride 120 mg", composition: "Fexofenadine Hydrochloride 120mg", brandPrice: 218.0, genericPrice: 55.0, savings: 75, manufacturer: "Sanofi India Ltd", category: "Antihistamines", details: "Non-drowsy allergy relief for hay fever, conjunctivitis, and hives." },
    { id: 40, brandName: "Neurontin 300mg", genericName: "Gabapentin 300 mg", composition: "Gabapentin 300mg", brandPrice: 320.0, genericPrice: 78.0, savings: 76, manufacturer: "Pfizer India Ltd", category: "Neurology & Psychiatry", details: "Used to treat neuropathic pain, fibromyalgia, and seizures." },
    { id: 41, brandName: "Nexito 10mg", genericName: "Escitalopram 10 mg", composition: "Escitalopram Oxalate 10mg", brandPrice: 115.0, genericPrice: 28.0, savings: 76, manufacturer: "Sun Pharmaceutical Industries", category: "Neurology & Psychiatry", details: "SSRI antidepressant used to treat depression and generalized anxiety disorder." },
    { id: 42, brandName: "Zoloft 50mg", genericName: "Sertraline 50 mg", composition: "Sertraline Hydrochloride 50mg", brandPrice: 240.0, genericPrice: 58.0, savings: 76, manufacturer: "Pfizer India Ltd", category: "Neurology & Psychiatry", details: "SSRI for major depressive disorder, panic disorder, and OCD." },
    { id: 43, brandName: "Alprax 0.5mg", genericName: "Alprazolam 0.5 mg", composition: "Alprazolam 0.5mg", brandPrice: 45.0, genericPrice: 11.0, savings: 76, manufacturer: "Torrent Pharmaceuticals", category: "Neurology & Psychiatry", details: "Benzodiazepine for short-term relief of severe anxiety and panic attacks." },
    { id: 44, brandName: "Shelcal 500", genericName: "Calcium + Vitamin D3", composition: "Calcium Carbonate 1250mg (equiv. elemental Calcium 500mg) + Vitamin D3 250 IU", brandPrice: 132.0, genericPrice: 32.0, savings: 76, manufacturer: "Torrent Pharmaceuticals", category: "Vitamins & Supplements", details: "Essential supplement for maintaining strong bones and teeth." },
    { id: 45, brandName: "Becosules Capsules", genericName: "Vitamin B-Complex + Vitamin C", composition: "Vitamin B1, B2, B3, B5, B6, B9, B12, Biotin, Vitamin C", brandPrice: 52.0, genericPrice: 15.0, savings: 71, manufacturer: "Pfizer India Ltd", category: "Vitamins & Supplements", details: "Supports energy metabolism and corrects nutritional deficiencies." },
    { id: 46, brandName: "Nurokind-OD", genericName: "Methylcobalamin 1500mcg", composition: "Mecobalamin 1500mcg", brandPrice: 185.0, genericPrice: 42.0, savings: 77, manufacturer: "Mankind Pharma Ltd", category: "Vitamins & Supplements", details: "Active form of Vitamin B12 used to treat peripheral neuropathies and anemia." },
    { id: 47, brandName: "Liv.52", genericName: "Ayurvedic Liver Formulation", composition: "Himsra, Kasani, Mandur Bhasma, Kakamachi", brandPrice: 150.0, genericPrice: 65.0, savings: 57, manufacturer: "Himalaya Wellness", category: "Vitamins & Supplements", details: "Natural liver protective supplement that stimulates appetite and improves digestion." },
    { id: 48, brandName: "Combiflam", genericName: "Ibuprofen + Paracetamol", composition: "Ibuprofen 400mg + Paracetamol 325mg", brandPrice: 45.0, genericPrice: 12.0, savings: 73, manufacturer: "Sanofi India Ltd", category: "NSAIDs", details: "Synergistic pain relief formulation for muscle pain, toothache, and headache." },
    { id: 49, brandName: "Sporlac DS", genericName: "Lactic Acid Bacillus", composition: "Lactic Acid Bacillus spores 120 million", brandPrice: 125.0, genericPrice: 32.0, savings: 74, manufacturer: "Sanzyme Ltd", category: "Gastrointestinal", details: "Probiotic capsule to restore gut flora balance and treat diarrhea." },
    { id: 50, brandName: "Dulcolax 5mg", genericName: "Bisacodyl 5 mg", composition: "Bisacodyl 5mg", brandPrice: 18.0, genericPrice: 5.5, savings: 69, manufacturer: "Sanofi India Ltd", category: "Gastrointestinal", details: "Stimulant laxative providing overnight relief from constipation." },
    { id: 51, brandName: "Cremaffin", genericName: "Liquid Paraffin + Milk of Magnesia", composition: "Liquid Paraffin 1.25ml + Milk of Magnesia 3.75ml per 5ml", brandPrice: 280.0, genericPrice: 78.0, savings: 72, manufacturer: "Abbott India Ltd", category: "Gastrointestinal", details: "Stool softener emulsion providing gentle relief from chronic constipation." },
    { id: 52, brandName: "Digene Gel", genericName: "Antacid Gel", composition: "Aluminium Hydroxide, Magnesium Hydroxide, Simethicone", brandPrice: 165.0, genericPrice: 45.0, savings: 73, manufacturer: "Abbott India Ltd", category: "Gastrointestinal", details: "Mint-flavored oral gel for fast relief from acidity, gas, and bloating." },
    { id: 53, brandName: "Deriphyllin", genericName: "Etofylline + Theophylline", composition: "Etofylline 77mg + Theophylline 23mg", brandPrice: 55.0, genericPrice: 15.0, savings: 73, manufacturer: "Zydus Cadila", category: "Respiratory", details: "Bronchodilator tablet for relieving shortness of breath and wheezing." },
    { id: 54, brandName: "Arkamin", genericName: "Clonidine Hydrochloride 100mcg", composition: "Clonidine Hydrochloride 100mcg", brandPrice: 85.0, genericPrice: 22.0, savings: 74, manufacturer: "Torrent Pharmaceuticals", category: "Cardiovascular", details: "Centrally acting antihypertensive used to lower high blood pressure." },
    { id: 55, brandName: "Nicotex 2mg", genericName: "Nicotine Polacrilex 2mg", composition: "Nicotine Polacrilex 2mg", brandPrice: 110.0, genericPrice: 45.0, savings: 59, manufacturer: "Cipla Ltd", category: "Vitamins & Supplements", details: "Nicotine replacement therapy gum to support smoking cessation." },
    { id: 56, brandName: "Otrivin Oxy", genericName: "Oxymetazoline Hydrochloride 0.05%", composition: "Oxymetazoline Hydrochloride 0.05% w/v", brandPrice: 115.0, genericPrice: 38.0, savings: 67, manufacturer: "GlaxoSmithKline", category: "Respiratory", details: "Nasal spray for rapid relief of nasal congestion caused by common cold or allergies." },
    { id: 57, brandName: "Ringcutter", genericName: "Miconazole Nitrate", composition: "Miconazole Nitrate 2% w/w", brandPrice: 145.0, genericPrice: 35.0, savings: 76, manufacturer: "Janssen Pharmaceuticals", category: "Antiseptics", details: "Broad-spectrum antifungal cream to treat ringworm, athlete's foot." },
    { id: 58, brandName: "Candid Dusting Powder", genericName: "Clotrimazole 1%", composition: "Clotrimazole 1% w/w", brandPrice: 165.0, genericPrice: 42.0, savings: 75, manufacturer: "Glenmark Pharmaceuticals", category: "Antiseptics", details: "Antifungal powder to prevent skin infections and absorb excess moisture." },
    { id: 59, brandName: "Ecosprin 75", genericName: "Aspirin 75mg", composition: "Aspirin 75mg", brandPrice: 12.0, genericPrice: 3.5, savings: 71, manufacturer: "USV Private Ltd", category: "Cardiovascular", details: "Low-dose aspirin used as a blood thinner to prevent heart attacks and strokes." },
    { id: 60, brandName: "Ventorlin", genericName: "Salbutamol Syrup", composition: "Salbutamol 2mg per 5ml", brandPrice: 48.0, genericPrice: 12.0, savings: 75, manufacturer: "GlaxoSmithKline", category: "Respiratory", details: "Oral bronchodilator liquid for young children experiencing asthma or wheezing." },
    { id: 61, brandName: "Ciplox Eye Drops", genericName: "Ciprofloxacin 0.3%", composition: "Ciprofloxacin 0.3% w/v", brandPrice: 25.0, genericPrice: 7.0, savings: 72, manufacturer: "Cipla Ltd", category: "Antibiotics", details: "Antibiotic eye/ear drops to treat superficial infections of the eye and external ear." },
    { id: 62, brandName: "Betnesol", genericName: "Betamethasone 0.5mg", composition: "Betamethasone Sodium Phosphate 0.5mg", brandPrice: 22.0, genericPrice: 6.0, savings: 73, manufacturer: "GlaxoSmithKline", category: "Analgesics & Antipyretics", details: "Corticosteroid tablet used to treat inflammatory conditions and severe allergies." },
    { id: 63, brandName: "Cyclopam", genericName: "Dicyclomine + Paracetamol", composition: "Dicyclomine Hydrochloride 20mg + Paracetamol 500mg", brandPrice: 65.0, genericPrice: 18.0, savings: 72, manufacturer: "Indoco Remedies", category: "Antispasmodics", details: "Used for treatment of spasmodic pain in abdomen, bowels, and bladder." },
    { id: 64, brandName: "Envas 5mg", genericName: "Enalapril Maleate 5mg", composition: "Enalapril Maleate 5mg", brandPrice: 42.0, genericPrice: 10.5, savings: 75, manufacturer: "Cadila Pharmaceuticals", category: "Cardiovascular", details: "ACE inhibitor used to treat hypertension and heart failure." },
    { id: 65, brandName: "Kenacort 40mg", genericName: "Triamcinolone Acetonide 40mg", composition: "Triamcinolone Acetonide 40mg", brandPrice: 225.0, genericPrice: 58.0, savings: 74, manufacturer: "Abbott India Ltd", category: "Analgesics & Antipyretics", details: "Long-acting corticosteroid injection for joint inflammation, allergies, and skin conditions." }
  ],
  stores: [
    { id: 101, name: "PMBJP Kendra - Connaught Place", type: "Government Janaushadhi Store", rating: 4.8, phone: "+91 11-23415522", address: "Shop 12, Block N, Connaught Place, New Delhi", lat: 28.6304, lng: 77.2177, stock: { 1: "Available", 2: "Available", 4: "Available", 5: "Available", 9: "Available", 10: "Available" } },
    { id: 102, name: "Pradhan Mantri Bhartiya Janaushadhi Store", type: "Government Janaushadhi Store", rating: 4.5, phone: "+91 22-22883311", address: "G-5, Ground Floor, Nariman Point, Mumbai", lat: 18.9268, lng: 72.8224, stock: { 1: "Available", 3: "Available", 4: "Available", 6: "Available", 8: "Available", 11: "Available" } },
    { id: 103, name: "Generic Plus Pharmacy - Indiranagar", type: "Private Generic Store", rating: 4.6, phone: "+91 80-41223344", address: "812, 100 Feet Rd, Indiranagar, Bengaluru", lat: 12.9718, lng: 77.6412, stock: { 1: "Available", 2: "Available", 3: "Available", 4: "Available", 5: "Available", 7: "Available" } },
    { id: 104, name: "Jan Aushadhi store - Shivaji Nagar", type: "Government Janaushadhi Store", rating: 4.7, phone: "+91 20-25539988", address: "Modern College Rd, Shivaji Nagar, Pune", lat: 18.5308, lng: 73.8474, stock: { 1: "Available", 2: "Available", 4: "Available", 5: "Available", 12: "Available", 15: "Available" } },
    { id: 105, name: "Aarogya Generic Chemist", type: "Private Generic Store", rating: 4.4, phone: "+91 22-24151122", address: "Dadar East, Near Railway Station, Mumbai", lat: 19.0178, lng: 72.8478, stock: { 1: "Available", 4: "Available", 5: "Available", 6: "Available", 10: "Available", 13: "Available" } },
    { id: 106, name: "Janaushadhi Kendra - Sector 62", type: "Government Janaushadhi Store", rating: 4.9, phone: "+91 120-4567890", address: "C-56, Sector 62, Noida, Uttar Pradesh", lat: 28.6219, lng: 77.3639, stock: { 1: "Available", 2: "Available", 3: "Available", 4: "Available", 5: "Available", 7: "Available", 8: "Available", 14: "Available" } }
  ],
  marketTrends: {
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
  }
};

// Initialize DB file
function initDB() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(seedData, null, 2), 'utf-8');
    console.log("Database initialized with seed data.");
  }
}

// Read DB file
function readDB() {
  initDB();
  const data = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(data);
}

// Write DB file
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

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
  for (const val of bigrams1) {
    if (bigrams2.has(val)) {
      intersection++;
    }
  }
  
  return (2.0 * intersection) / (bigrams1.size + bigrams2.size);
}

// DB Interface Methods (works like simple ORM queries)
const db = {
  medicines: {
    findMany: () => readDB().medicines,
    findFirst: (filterFn) => readDB().medicines.find(filterFn),
    filter: (filterFn) => readDB().medicines.filter(filterFn),
    save: (med) => {
      const dbData = readDB();
      const index = dbData.medicines.findIndex(m => m.id === med.id);
      if (index !== -1) {
        dbData.medicines[index] = { ...dbData.medicines[index], ...med };
      } else {
        if (!med.id) {
          const maxId = dbData.medicines.reduce((max, m) => Math.max(max, m.id), 0);
          med.id = maxId + 1;
        }
        dbData.medicines.push(med);
      }
      writeDB(dbData);
      return med;
    },
    saveMany: (meds) => {
      const dbData = readDB();
      let maxId = dbData.medicines.reduce((max, m) => Math.max(max, m.id), 0);
      meds.forEach(med => {
        const index = dbData.medicines.findIndex(m => m.id === med.id || (m.brandName.toLowerCase() === med.brandName.toLowerCase()));
        if (index !== -1) {
          dbData.medicines[index] = { ...dbData.medicines[index], ...med };
        } else {
          if (!med.id) {
            maxId = maxId + 1;
            med.id = maxId;
          }
          dbData.medicines.push(med);
        }
      });
      writeDB(dbData);
    },
    search: (query) => {
      const q = query.toLowerCase().trim();
      if (!q) return [];
      
      const exactMatches = readDB().medicines.filter(m => 
        m.brandName.toLowerCase().includes(q) || 
        m.genericName.toLowerCase().includes(q) ||
        m.composition.toLowerCase().includes(q) ||
        (m.barcode && m.barcode.includes(q))
      );

      if (exactMatches.length > 0) {
        return exactMatches;
      }

      // If no exact match, run fuzzy bigram similarity lookup
      return readDB().medicines.map(m => {
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
    findMany: () => readDB().stores,
    filter: (filterFn) => readDB().stores.filter(filterFn),
    findNearby: (lat, lng, radiusKm = 15) => {
      // Calculate distance using Haversine formula
      const toRad = (value) => (value * Math.PI) / 180;
      const stores = readDB().stores;
      
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
    get: () => readDB().marketTrends
  }
};

module.exports = db;
