import React, { useState } from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  HeartHandshake, 
  CheckCircle2, 
  ShieldCheck, 
  FileText, 
  ChevronRight, 
  Info, 
  ListChecks, 
  UserCheck, 
  Coins, 
  FileQuestion,
  HelpCircle as QuestionIcon,
  Shield
} from 'lucide-react';

interface QuizQuestion {
  id: number;
  question: string;
  myth: string;
  fact: string;
  explanation: string;
}

interface Scheme {
  id: string;
  name: string;
  shortName: string;
  sponsor: string;
  description: string;
  benefits: string[];
  eligibility: string[];
  documents: string[];
  steps: string[];
}

function SchemeAwareness() {
  const [activeQuestion, setActiveQuestion] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, 'myth' | 'fact' | null>>({});
  const [activeSchemeId, setActiveSchemeId] = useState<string>('pmbjp');
  
  // Interactive Checklist State: tracks which documents the user has ticked off
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});

  const schemes: Scheme[] = [
    {
      id: 'pmbjp',
      shortName: 'PMBJP',
      name: 'Pradhan Mantri Bhartiya Janaushadhi Pariyojana',
      sponsor: 'Department of Pharmaceuticals, Ministry of Chemicals & Fertilizers',
      description: 'A campaign launched by the Govt of India to provide quality generic medicines at affordable prices (50% to 90% cheaper than branded market drugs) to all citizens through dedicated outlets called Janaushadhi Kendras.',
      benefits: [
        'Access to high-quality generic drugs equivalent in therapeutic value to expensive brand-name medications.',
        'Saves 50% to 90% on chronic disease medications (diabetes, heart disease, thyroid, asthma).',
        'Available directly over the counter at any of the 10,000+ Janaushadhi Kendras across India.'
      ],
      eligibility: [
        'Open to all citizens of India, regardless of income bracket.',
        'Requires a valid medical doctor prescription recommending the drug/composition (for prescription-only drugs).'
      ],
      documents: [
        'Valid doctor prescription containing composition or generic drug names',
        'Aadhaar Card (optional, for record keeping)',
        'Pharmacist Registration Certificate (only required if applying to open a new Janaushadhi franchise)',
        'PAN Card & Shop Rent Agreement (only required for franchise applications)'
      ],
      steps: [
        'Obtain a valid prescription from a registered medical practitioner (RMP) containing generic drug names.',
        'Locate the nearest Janaushadhi Kendra using the Shops & Hospitals Locator tab.',
        'Present the prescription at the store counter.',
        'Collect your medicines and pay the subsidized bill (check printed MRP to verify savings).'
      ]
    },
    {
      id: 'pmjay',
      shortName: 'PM-JAY',
      name: 'Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana',
      sponsor: 'National Health Authority (NHA), Ministry of Health & Family Welfare',
      description: 'The largest health assurance scheme in the world, aiming to provide a health cover of ₹5 Lakh per family per year for secondary and tertiary care hospitalization to over 12 crore poor and vulnerable families.',
      benefits: [
        'Cashless health coverage of up to ₹5,00,000 per family per year.',
        'Covers up to 3 days of pre-hospitalization and 15 days of post-hospitalization expenses (diagnostics and medicines).',
        'All pre-existing conditions are covered from day one.',
        'Cashless and paperless treatment at all empaneled public and private hospitals across India.'
      ],
      eligibility: [
        'Families listed in the Socio-Economic Caste Census (SECC) 2011 database under specific deprivation criteria.',
        'Occupational categories of urban workers (ragpickers, beggars, domestic workers, street vendors, construction workers, etc.).',
        'No limit on family size, age, or gender.'
      ],
      documents: [
        'Aadhaar Card or Voter ID Card of all family members',
        'Ration Card (showing family unit listing)',
        'PM-JAY Letter or PMBJP/Ayushman Golden Card ID',
        'Income Certificate (if applying via state-level extension)',
        'Caste Certificate (if eligible under specific category reservation)'
      ],
      steps: [
        'Check eligibility online at the official PM-JAY portal (mera.pmjay.gov.in) using your mobile number or Ration card.',
        'Visit the nearest Ayushman Bharat Empaneled Hospital or Common Service Center (CSC).',
        'Meet the Ayushman Mitra (Help Desk Officer) at the hospital to verify documents.',
        'Get your Ayushman Golden Card printed after e-KYC verification.',
        'Show the card during admission at any empaneled hospital for cashless treatment.'
      ]
    },
    {
      id: 'ran',
      shortName: 'RAN',
      name: 'Rashtriya Arogya Nidhi (National Health Fund)',
      sponsor: 'Ministry of Health & Family Welfare, Government of India',
      description: 'A scheme providing financial assistance to patients living below the poverty line (BPL) who are suffering from major life-threatening diseases, to receive medical treatment at any super-specialty Government Hospital.',
      benefits: [
        'One-time financial grant of up to ₹15,00,000 for medical treatment.',
        'Covers expensive surgeries, oncology (cancer) treatments, kidney transplants, and cardiac surgeries.',
        'Fund is released directly to the treating government hospital superintendent.'
      ],
      eligibility: [
        'Indian citizens living below the poverty line (BPL).',
        'Patients receiving treatment in Central/State Government super-specialty hospitals (e.g. AIIMS, PGIMER, JIPMER).',
        'Not eligible if covered under PM-JAY or if the patient receives reimbursement from any other source.'
      ],
      documents: [
        'Application form signed by the treating doctor and countersigned by the Medical Superintendent',
        'Copy of BPL Card or Income Certificate (demonstrating poverty status)',
        'Ration Card copy listing family members',
        'Estimated cost of treatment certificate from the government hospital head of department',
        'Medical diagnosis report and test result files'
      ],
      steps: [
        'Request the treating doctor at the government hospital to prepare a treatment estimate.',
        'Fill out the RAN Application Form (available at the hospital social welfare counter).',
        'Get the form signed by the HOD and Superintendent.',
        'Submit the form along with BPL card and estimate certificate to the hospital welfare board.',
        'The board reviews and sanctions the funds directly to the hospital billing department.'
      ]
    },
    {
      id: 'hmdg',
      shortName: 'HMDG',
      name: "Health Minister's Discretionary Grant",
      sponsor: 'Ministry of Health & Family Welfare, Government of India',
      description: 'Provides one-time financial assistance to poor patients suffering from major illnesses who require surgical procedures or hospitalization in government hospitals, in cases where other schemes are not applicable.',
      benefits: [
        'One-time financial assistance of up to ₹1,25,000 depending on treatment cost.',
        'Covers surgeries, implants, dialysis, and chemotherapy expenses.',
        'Reimbursement/payment is made directly to the treating government hospital.'
      ],
      eligibility: [
        'Patients whose annual family income is below ₹1,25,000.',
        'Must be undergoing treatment in a Government Hospital (State or Central).',
        'Not eligible if covered under Ayushman Bharat (PM-JAY) or RAN.'
      ],
      documents: [
        'Prescribed HMDG Application Form (duly filled)',
        'Original Income Certificate from SDM, Tehsildar, or Revenue Authority (income < ₹1.25 Lakh/year)',
        'Detailed estimate certificate of hospital expenditure signed by the treating doctor',
        'Aadhaar Card and Ration Card photocopies'
      ],
      steps: [
        'Obtain the HMDG application format from the hospital social work department.',
        'Procure an official Income Certificate from your local revenue authority.',
        'Get a treatment estimate and medical summary certificate signed by the hospital physician.',
        'Submit the application files to the Section Officer (Grants), Ministry of Health & Family Welfare, Nirman Bhawan, New Delhi.',
        'Once approved, the grant is dispatched to the hospital for your treatment credit.'
      ]
    },
    {
      id: 'cghs',
      shortName: 'CGHS / ESIS',
      name: "Central Government Health Scheme & Employees' State Insurance",
      sponsor: 'Ministries of Health & Family Welfare, and Labour & Employment',
      description: 'Comprehensive health security systems providing medical facilities and free medicine distribution to Central Government employees/pensioners (CGHS) and organized sector employees (ESIS).',
      benefits: [
        'Comprehensive outpatient care (OPD) and free distribution of prescribed medicines (both generic and brand-name).',
        'Cashless indoor treatment (hospitalization) at empaneled private hospitals.',
        'Maternity care, family welfare, and preventive health counseling services.'
      ],
      eligibility: [
        'CGHS: Active and retired Central Government employees and their dependent family members.',
        'ESIS: Private sector employees working in factories/establishments with 10+ workers, earning less than ₹21,000 per month.'
      ],
      documents: [
        'CGHS Wellness Card or ESIC Pehchan Card',
        'Aadhaar Card of the primary employee and dependents',
        'Salary Slip (showing ESIC contribution) or Pension Payment Order (PPO)',
        'Passport-sized photographs of family unit members'
      ],
      steps: [
        'Register through your employer (ESIS) or the CGHS portal to receive your medical index card.',
        'Visit your local CGHS Wellness Center or ESIS Dispensary for ailments.',
        'The dispensary doctor checks you and dispenses generic medicines from the in-house pharmacy.',
        'If specialist care is required, obtain a referral letter from the dispensary doctor.',
        'Present the referral and your index card at empaneled private hospitals for cashless admission.'
      ]
    },
    {
      id: 'mjpjay',
      shortName: 'MJPJAY',
      name: 'Mahatma Jyotirao Phule Jan Arogya Yojana (Maharashtra)',
      sponsor: 'State Health Assurance Society, Govt of Maharashtra',
      description: 'A flagship health insurance scheme of Maharashtra government providing cashless quality medical care for secondary and tertiary illnesses requiring hospitalization through an identified network of providers.',
      benefits: [
        'Cashless hospitalization benefits up to ₹5,00,000 per family per year.',
        'Covers 996 medical procedures and surgeries across 34 specialty departments.',
        'Covers diagnostics, doctor consultation, generic medicines, and meals during stay.',
        'Cashless and paperless service at all empaneled public and private hospitals in Maharashtra.'
      ],
      eligibility: [
        'Families holding Yellow, Orange, or Antyodaya Ration Cards in Maharashtra.',
        'Farmers from 14 ecologically distressed districts of Maharashtra.',
        'Families belonging to disadvantaged categories listed by the state.'
      ],
      documents: [
        'Yellow/Orange/Antyodaya Ration Card',
        'Aadhaar Card or Maharashtra Voter ID Card',
        'Valid Farmer certificate (if applying under farmer quota)',
        'State-issued income certificate (annual income limit of ₹1 Lakh for orange card)'
      ],
      steps: [
        'Visit the nearest empaneled network hospital or government hospital in Maharashtra.',
        'Approach the Arogyamitra at the help desk with your Ration Card and Aadhaar.',
        'The Arogyamitra verifies eligibility and uploads documentation online.',
        'Receive immediate medical care cash-free. The hospital files claims directly to the society.'
      ]
    },
    {
      id: 'ysraarogyasri',
      shortName: 'YSR Aarogyasri',
      name: 'Dr. YSR Aarogyasri Health Scheme (Andhra Pradesh)',
      sponsor: 'Dr. YSR Aarogyasri Health Care Trust, Govt of Andhra Pradesh',
      description: 'A comprehensive cashless health insurance scheme implemented in Andhra Pradesh to assist poor families in meeting catastrophic medical expenses without falling into debt.',
      benefits: [
        'Cashless medical coverage of up to ₹5,00,000 per family per year.',
        'Covers over 2,000 surgeries, therapies, and medical procedures.',
        'Includes pre-existing disease coverage, free follow-up consultation, and free post-discharge medicines.',
        'Dedicated network hospitals across Andhra Pradesh, Telangana, and Chennai.'
      ],
      eligibility: [
        'All BPL families in Andhra Pradesh whose names are listed in the civil supplies database.',
        'Families holding YSR Pension Kanuka Cards or Rice Cards.',
        'Any individual whose family income is below ₹5 Lakh per annum (verified by landholding/tax criteria).'
      ],
      documents: [
        'YSR Rice Card or Aarogyasri Card',
        'Aadhaar Card of the patient and family members',
        'Income certificate or Tax returns (for non-Rice Card holders)'
      ],
      steps: [
        'Visit a Trust-empaneled hospital and consult the Arogyamitra at the reception.',
        'The Arogyamitra checks your digital card registry status using Aadhaar.',
        'Once verified, you are referred to the consulting doctor for diagnostics.',
        'Receive cashless treatment. All follow-up checkups and generic medicines post-surgery are covered.'
      ]
    },
    {
      id: 'cmchis',
      shortName: 'CMCHIS',
      name: 'Chief Minister\'s Comprehensive Health Insurance Scheme (Tamil Nadu)',
      sponsor: 'United India Insurance Company, Govt of Tamil Nadu',
      description: 'A Tamil Nadu state welfare program providing quality medical services to poor and low-income families through cashless treatment at empaneled public and private hospitals.',
      benefits: [
        'Health coverage of up to ₹5,00,000 per family per year.',
        'Includes covers for surgeries, critical illnesses (cancer, renal failure, cardiac disease), and neonatal care.',
        'Covers costs of diagnostic tests, doctor fees, anesthesia, and generic medicines.'
      ],
      eligibility: [
        'Families residing in Tamil Nadu whose annual income is less than ₹1,20,000.',
        'Members of registered labor welfare boards, migrant laborers, and orphans.'
      ],
      documents: [
        'Smart Ration Card (Tamil Nadu Family Card)',
        'Income Certificate issued by the local VAO / Revenue Inspector',
        'Aadhaar Card of all family members',
        'Self-declaration form signed by the head of the family'
      ],
      steps: [
        'Obtain an Income Certificate indicating family income is under ₹1.2 Lakh.',
        'Visit the District Collectorate kiosk to apply for a CMCHIS Smart Card.',
        'Provide biometric scans and print the card.',
        'Present the Smart Card at any empaneled government or private hospital for cashless service.'
      ]
    },
    {
      id: 'bsky',
      shortName: 'BSKY',
      name: 'Biju Swasthya Kalyan Yojana (Odisha)',
      sponsor: 'Health & Family Welfare Department, Government of Odisha',
      description: 'A pathbreaking cashless health assurance program in Odisha, ensuring free healthcare services from sub-centers to district headquarters hospitals, and private empaneled hospitals.',
      benefits: [
        'Cashless coverage up to ₹5,00,000 per family per year (and up to ₹10,00,000 for women members).',
        'Covers all healthcare charges including consultation, diagnostics, ICU bed, OT charge, and generic medicines.',
        'Applicable at all government facilities in Odisha and 150+ empaneled private hospitals.'
      ],
      eligibility: [
        'All citizens of Odisha receiving services at government health facilities (100% free).',
        'Families holding National Food Security Act (NFSA) or State Food Security Scheme (SFSS) cards for private hospital coverage.'
      ],
      documents: [
        'NFSA Card / SFSS Card (Ration Card)',
        'Aadhaar Card of the patient',
        'Biju Swasthya Kalyan Card (if physical card was issued)'
      ],
      steps: [
        'Show your Ration Card/BSKY Card at the registration counter of the empaneled hospital.',
        'The Swasthya Mitra desk confirms biometric details via e-KYC.',
        'The doctor advises treatment. Admission and discharge are processed 100% cashless.'
      ]
    }
  ];

  const quizQuestions: QuizQuestion[] = [
    {
      id: 1,
      question: "Are generic medicines less effective because they are cheaper?",
      myth: "Generic medicines are of lower quality, take longer to work, and use inferior raw materials.",
      fact: "Generic medicines have the exact same active ingredients, dosage, safety profile, and efficacy as branded drugs.",
      explanation: "Generic medicines are cheaper only because their manufacturers do not have to duplicate clinical trials, expensive marketing, or patent fees. Quality standards are identical."
    },
    {
      id: 2,
      question: "Are all generic medicines approved by government laboratories?",
      myth: "Generics don't go through strict testing procedures compared to brands.",
      fact: "All PMBJP generic medicines are strictly quality-tested at NABL accredited labs before entering stores.",
      explanation: "Every single batch of medicine distributed under the PMBJP initiative undergoes rigorous double testing (at source and in government labs) to guarantee 100% bio-equivalence."
    },
    {
      id: 3,
      question: "Do generic medicines cause more side effects?",
      myth: "Generic alternatives carry higher risks of side effects.",
      fact: "Generics display identical side effect profiles and therapeutic safety ranges as branded counterparts.",
      explanation: "Because they use the exact same active chemical formulation, the safety, risks, and benefits of generic drugs match the brand-name equivalent exactly."
    },
    {
      id: 4,
      question: "Can generic medicines look different from the brand-name drug?",
      myth: "If the pill is a different shape or color, it is not the same medicine.",
      fact: "Generics may differ in color, shape, packaging, and inactive binders, but they work exactly the same.",
      explanation: "Trademark laws prevent generic manufacturers from making their pills look identical to the brand-name drug. However, the active ingredient remains 100% identical."
    }
  ];

  const handleAnswerSelect = (questionId: number, selected: 'myth' | 'fact') => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: selected
    }));
    setActiveQuestion(questionId);
  };

  const selectedScheme = schemes.find(s => s.id === activeSchemeId) || schemes[0];

  const toggleDocChecked = (docName: string) => {
    setCheckedDocs(prev => ({
      ...prev,
      [docName]: !prev[docName]
    }));
  };

  const getCheckedPercentage = (scheme: Scheme) => {
    const total = scheme.documents.length;
    const checked = scheme.documents.filter(d => checkedDocs[d]).length;
    return total > 0 ? Math.round((checked / total) * 100) : 0;
  };

  const progress = getCheckedPercentage(selectedScheme);

  return (
    <div className="fade-in-section">
      <div className="page-header">
        <h2 className="page-title">National Schemes & Awareness</h2>
        <p className="page-description">
          Explore all Central and State government healthcare programs, verify your document checklists, and separate generic drug myths from facts.
        </p>
      </div>

      {/* Schemes Interactive Hub */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
        
        {/* Navigation Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>
            National Health Schemes
          </h4>
          {schemes.map(scheme => (
            <button
              key={scheme.id}
              onClick={() => {
                setActiveSchemeId(scheme.id);
                setCheckedDocs({});
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                border: `1px solid ${activeSchemeId === scheme.id ? 'var(--primary)' : 'var(--border-color)'}`,
                borderRadius: '8px',
                background: activeSchemeId === scheme.id ? 'var(--primary-glow)' : 'var(--bg-card)',
                color: activeSchemeId === scheme.id ? '#2dd4bf' : 'var(--text-muted)',
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: 600,
                fontSize: '0.9rem',
                transition: 'var(--transition)'
              }}
              className="scheme-nav-btn"
            >
              <span>{scheme.shortName}</span>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>

        {/* Scheme Details display area */}
        <div className="card" style={{ padding: '2rem' }}>
          
          {/* Header */}
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {selectedScheme.sponsor}
            </span>
            <h3 style={{ fontSize: '1.6rem', marginTop: '0.25rem', color: 'var(--text-main)' }}>{selectedScheme.name}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.5rem', lineHeight: '1.6' }}>
              {selectedScheme.description}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            
            {/* Left Column: Benefits & Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Target Benefits */}
              <div>
                <h4 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Coins size={18} color="var(--primary)" /> Scheme Benefits
                </h4>
                <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedScheme.benefits.map((benefit, idx) => (
                    <li key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Eligibility */}
              <div>
                <h4 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <UserCheck size={18} color="var(--secondary)" /> Eligibility Criteria
                </h4>
                <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedScheme.eligibility.map((rule, idx) => (
                    <li key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Application steps */}
              <div>
                <h4 style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <BookOpen size={18} color="var(--accent)" /> Step-by-Step Guidelines
                </h4>
                <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {selectedScheme.steps.map((step, idx) => (
                    <li key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

            </div>

            {/* Right Column: Required Documents Interactive Checklist */}
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ListChecks size={18} color="var(--primary)" /> Document Checklist
                </h4>
                <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 'bold' }}>{progress}% Ready</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Tick off documents you already possess to verify your eligibility preparedness:
              </p>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))', transition: 'width 0.3s ease' }}></div>
              </div>

              {/* Documents List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flexGrow: 1 }}>
                {selectedScheme.documents.map((doc, idx) => {
                  const isChecked = !!checkedDocs[doc];
                  return (
                    <div 
                      key={idx}
                      onClick={() => toggleDocChecked(doc)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        background: isChecked ? 'rgba(16, 185, 129, 0.04)' : 'rgba(255, 255, 255, 0.01)',
                        border: `1px solid ${isChecked ? '#10b981' : 'var(--border-color)'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'var(--transition)'
                      }}
                    >
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Controlled click handles toggle
                        style={{ marginTop: '0.15rem', cursor: 'pointer' }}
                      />
                      <div style={{ fontSize: '0.8rem', color: isChecked ? 'var(--text-main)' : 'var(--text-muted)', lineHeight: '1.4' }}>
                        {doc}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Verified Badge */}
              {progress === 100 && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.75rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: '#10b981', fontSize: '0.8rem', marginTop: '1.5rem', fontWeight: 600 }}>
                  <ShieldCheck size={18} />
                  <span>Document check completed. You possess all required documents!</span>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Myth vs Fact Quiz */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>
          <FileQuestion size={20} color="var(--warning)" /> Myth vs. Fact: Interactive Drug Quality Quiz
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Test your generic medicine awareness. Select whether the assertion below represents scientific facts or commercial myths.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {quizQuestions.map(q => {
            const selected = answers[q.id];
            
            return (
              <div key={q.id} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <QuestionIcon size={16} color="var(--primary)" /> {q.question}
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div 
                    className={`quiz-option ${selected === 'myth' ? 'wrong' : ''}`}
                    onClick={() => handleAnswerSelect(q.id, 'myth')}
                    style={{ padding: '0.75rem 1rem' }}
                  >
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#ef4444', display: 'block', marginBottom: '0.2rem' }}>MYTH:</span>
                    <p style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>{q.myth}</p>
                  </div>

                  <div 
                    className={`quiz-option ${selected === 'fact' ? 'correct' : ''}`}
                    onClick={() => handleAnswerSelect(q.id, 'fact')}
                    style={{ padding: '0.75rem 1rem' }}
                  >
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#10b981', display: 'block', marginBottom: '0.2rem' }}>FACT:</span>
                    <p style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>{q.fact}</p>
                  </div>
                </div>

                {/* Explanation text displays after selection */}
                {selected && (
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-color)', borderRadius: '8px', fontSize: '0.85rem' }}>
                    <strong style={{ color: selected === 'fact' ? '#10b981' : '#ef4444' }}>
                      {selected === 'fact' ? 'Correct Choice! ' : 'Incorrect, that is a Myth! '}
                    </strong>
                    <span style={{ color: 'var(--text-muted)' }}>{q.explanation}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Official Datasets & Price Reference Attribution */}
      <div className="card" style={{ 
        marginTop: '2rem', 
        padding: '1.25rem', 
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, rgba(13, 148, 136, 0.03) 100%)',
        border: '1px solid rgba(45, 212, 191, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={16} color="#2dd4bf" />
          <h4 style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: 700, margin: 0 }}>Official Data Sourcing & Verification</h4>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>
          National and state-level healthcare schemes, eligibility standards, and official policies are tracked and referenced directly from public government resources and medical publications. You can verify and access the raw datasets directly:
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.25rem' }}>
          <a href="https://janaushadhi.gov.in" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#2dd4bf', fontWeight: 600, textDecoration: 'none' }} className="hover-underline">
            PMBJP Product & Price List (janaushadhi.gov.in) ↗
          </a>
          <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
          <a href="http://www.nppaindia.nic.in" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#2dd4bf', fontWeight: 600, textDecoration: 'none' }} className="hover-underline">
            NPPA Price Registry (nppaindia.nic.in) ↗
          </a>
          <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
          <a href="https://www.1mg.com" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#2dd4bf', fontWeight: 600, textDecoration: 'none' }} className="hover-underline">
            Tata 1mg Clinical Info (1mg.com) ↗
          </a>
          <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
          <a href="https://medlineplus.gov" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#2dd4bf', fontWeight: 600, textDecoration: 'none' }} className="hover-underline">
            MedlinePlus Medicine Info (medlineplus.gov) ↗
          </a>
        </div>
      </div>
    </div>
  );
}

export default SchemeAwareness;
