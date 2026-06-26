import { useState, useEffect } from 'react';

export type Language = 'en' | 'hi' | 'mr';

export const translations = {
  en: {
    // Nav / Sidebar
    appTitle: "GenMed Hub",
    alternativeFinder: "Alternative Finder",
    priceDashboard: "Price Dashboard",
    prescriptionOptimizer: "Prescription Optimizer",
    shopsHospitals: "Shops & Hospitals",
    govSchemes: "Government Schemes",
    marketIntelligence: "Market Intelligence",
    healthWallet: "Health Wallet",
    savingsCalculator: "Savings Calculator",
    fakeDetector: "Fake Detector",
    safetyAnalyzer: "Safety Analyzer",
    genericSubstituteScanner: "Substitute Scanner",
    medicineReminder: "Medicine Reminder",
    lightMode: "Light Mode",
    darkMode: "Dark Mode",
    voiceSearch: "Voice Search",
    micLabel: "Click to speak...",
    micListening: "Listening...",
    
    // Alternative Finder Page
    finderTitle: "Generic Alternative Finder",
    finderDesc: "Search any brand name or formulation instantly to discover identical generic alternatives and calculate direct cost savings.",
    searchPlaceholder: "Search by Brand Name (e.g. Crocin, Augmentin), Generic Form, Composition or scan Barcode...",
    voiceSearchTitle: "Speak the Medicine Name",
    barcodeScanTitle: "Position Barcode in Camera View",
    scanning: "Scanning...",
    stopScanning: "Stop Camera",
    startScanning: "Scan Barcode",
    savingPill: "Save up to {pct}%",
    genericEquivalent: "Generic Equivalent",
    manufacturer: "Manufacturer",
    composition: "Composition",
    priceBranded: "Brand Price",
    priceGeneric: "Generic Price",
    rating: "Rating",
    availability: "Availability",
    dosageForm: "Dosage Form",
    sideEffects: "Side Effects",
    contraindications: "Contraindications",
    safetySchedule: "Safety Schedule",
    stockRisk: "Supply Chain Risk Index",
    daysRemaining: "{days} days of stock remaining",
    stockStable: "Stable stock levels",
    stockOut: "Out of Stock - Restock in progress",
    viewDetails: "View Details",
    hideDetails: "Hide Details"
  },
  hi: {
    // Nav / Sidebar
    appTitle: "जेनमेड हब",
    alternativeFinder: "जेनेरिक खोज",
    priceDashboard: "मूल्य डैशबोर्ड",
    prescriptionOptimizer: "पर्चा ऑप्टिमाइज़र",
    shopsHospitals: "दुकानें और अस्पताल",
    govSchemes: "सरकारी योजनाएं",
    marketIntelligence: "बाज़ार रिपोर्ट",
    healthWallet: "स्वास्थ्य वॉलेट",
    savingsCalculator: "बचत कैलकुलेटर",
    fakeDetector: "नकली दवा जाँच",
    safetyAnalyzer: "सुरक्षा विश्लेषक",
    genericSubstituteScanner: "विकल्प स्कैनर",
    medicineReminder: "दवा रिमाइंडर",
    lightMode: "लाइट मोड",
    darkMode: "डार्क मोड",
    voiceSearch: "आवाज खोज",
    micLabel: "बोलने के लिए क्लिक करें...",
    micListening: "सुन रहा है...",

    // Alternative Finder Page
    finderTitle: "जेनेरिक विकल्प खोजें",
    finderDesc: "समान जेनेरिक विकल्पों की खोज करने और सीधी लागत बचत की गणना करने के लिए किसी भी ब्रांड नाम या फ़ॉर्मूले को तुरंत खोजें।",
    searchPlaceholder: "ब्रांड का नाम (जैसे Crocin, Augmentin), जेनेरिक फॉर्म, संघटन खोजें या बारकोड स्कैन करें...",
    voiceSearchTitle: "दवा का नाम बोलें",
    barcodeScanTitle: "कैमरे के सामने बारकोड रखें",
    scanning: "स्कैनिंग चालू है...",
    stopScanning: "कैमरा बंद करें",
    startScanning: "बारकोड स्कैन करें",
    savingPill: "{pct}% तक बचाएं",
    genericEquivalent: "जेनेरिक विकल्प",
    manufacturer: "निर्माता",
    composition: "संघटन (कम्पोजीशन)",
    priceBranded: "ब्रांडेड कीमत",
    priceGeneric: "जेनेरिक कीमत",
    rating: "रेटिंग",
    availability: "उपलब्धता",
    dosageForm: "खुराक का रूप",
    sideEffects: "दुष्प्रभाव (Side Effects)",
    contraindications: "परहेज (Contraindications)",
    safetySchedule: "सुरक्षा अनुसूची",
    stockRisk: "आपूर्ति जोखिम सूचकांक",
    daysRemaining: "{days} दिनों का स्टॉक शेष",
    stockStable: "स्थिर स्टॉक स्तर",
    stockOut: "स्टॉक समाप्त - रीस्टॉक प्रगति पर",
    viewDetails: "विवरण देखें",
    hideDetails: "विवरण छुपाएं"
  },
  mr: {
    // Nav / Sidebar
    appTitle: "जेनमेड हब",
    alternativeFinder: "जेनेरिक शोध",
    priceDashboard: "किंमत डॅशबोर्ड",
    prescriptionOptimizer: "प्रिस्क्रिप्शन ऑप्टिमाइझ",
    shopsHospitals: "औषधालये आणि रुग्णालये",
    govSchemes: "शासकीय योजना",
    marketIntelligence: "बाजार अहवाल",
    healthWallet: "आरोग्य वॉलेट",
    savingsCalculator: "बचत कॅल्क्युलेटर",
    fakeDetector: "बनावट औषध तपासणी",
    safetyAnalyzer: "सुरक्षा विश्लेषक",
    genericSubstituteScanner: "पर्याय स्कॅनर",
    medicineReminder: "औषध रिमाइंडर",
    lightMode: "लाइट मोड",
    darkMode: "डार्क मोड",
    voiceSearch: "आवाज शोध",
    micLabel: "बोलण्यासाठी क्लिक करा...",
    micListening: "ऐकत आहे...",

    // Alternative Finder Page
    finderTitle: "जेनेरिक पर्याय शोधा",
    finderDesc: "समान जेनेरिक पर्याय शोधण्यासाठी आणि थेट खर्च बचतीची गणना करण्यासाठी कोणत्याही ब्रँडचे नाव किंवा घटक त्वरित शोधा.",
    searchPlaceholder: "ब्रँडचे नाव (उदा. Crocin, Augmentin), जेनेरिक फॉर्म, घटक शोधा किंवा बारकोड स्कॅन करा...",
    voiceSearchTitle: "औषधाचे नाव बोला",
    barcodeScanTitle: "कॅमेरा समोर बारकोड ठेवा",
    scanning: "स्कॅनिंग सुरू आहे...",
    stopScanning: "कॅमेरा बंद करा",
    startScanning: "बारकोड स्कॅन करा",
    savingPill: "{pct}% पर्यंत बचत करा",
    genericEquivalent: "जेनेरिक पर्याय",
    manufacturer: "उत्पादक",
    composition: "घटक (कम्पोजीशन)",
    priceBranded: "ब्रँडेड किंमत",
    priceGeneric: "जेनेरिक किंमत",
    rating: "रेटिंग",
    availability: "उपलब्धता",
    dosageForm: "औषधाचा प्रकार",
    sideEffects: "दुष्परिणाम",
    contraindications: "वर्ज्य परिस्थिती",
    safetySchedule: "सुरक्षा वेळापत्रक",
    stockRisk: "पुरवठा साखळी जोखीम",
    daysRemaining: "{days} दिवसांचा स्टॉक शिल्लक",
    stockStable: "स्थिर स्टॉक पातळी",
    stockOut: "स्टॉक संपला - रीस्टॉक सुरू आहे",
    viewDetails: "तपशील पहा",
    hideDetails: "तपशील लपवा"
  }
};

let currentLang: Language = (localStorage.getItem('genmed_lang') as Language) || 'en';
const listeners = new Set<(lang: Language) => void>();

export const getLanguage = (): Language => currentLang;

export const setLanguage = (lang: Language) => {
  currentLang = lang;
  localStorage.setItem('genmed_lang', lang);
  listeners.forEach(listener => listener(lang));
};

export const useTranslation = () => {
  const [lang, setLangState] = useState<Language>(currentLang);

  useEffect(() => {
    const listener = (newLang: Language) => setLangState(newLang);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const t = (key: keyof typeof translations['en'], replacements?: Record<string, string | number>) => {
    let text = translations[lang][key] || translations['en'][key] || String(key);
    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };

  return { t, lang, setLanguage };
};
