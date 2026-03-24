/**
 * Full Data Seeder
 * Seeds government schemes, sample children with growth/vaccination records,
 * and notifications for the test users created by seed.js
 *
 * Run: node server/seedFullData.js
 */
const mongoose  = require('mongoose');
const dotenv    = require('dotenv');
const path      = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User         = require('./models/User');
const Child        = require('./models/Child');
const GrowthRecord = require('./models/GrowthRecord');
const Vaccination  = require('./models/Vaccination');
const GovtScheme   = require('./models/GovtScheme');
const Notification = require('./models/Notification');
const AshaWorker   = require('./models/AshaWorker');

// ── Govt Schemes ─────────────────────────────────────────────────────────────
const SCHEMES = [
  {
    name: 'Integrated Child Development Services',
    shortName: 'ICDS',
    description: 'Free supplementary nutrition, immunization, health check-ups, referral services, and pre-school non-formal education for children under 6 years and pregnant/lactating mothers across all states.',
    eligibilityCriteria: 'Children aged 0–6 years; pregnant women; lactating mothers from BPL/APL families in rural and urban areas.',
    benefits: 'Supplementary nutrition (SNP), immunization, health check-up, referral services, pre-school education, nutrition and health education.',
    applyLink: 'https://icds-wcd.nic.in',
    category: 'nutrition',
    isActive: true,
  },
  {
    name: 'Pradhan Mantri Matru Vandana Yojana',
    shortName: 'PMMVY',
    description: '₹5,000 direct cash benefit in 3 installments for the first living child. Compensates for wage loss and encourages safe delivery and exclusive breastfeeding.',
    eligibilityCriteria: 'Pregnant and lactating mothers for first living child; age ≥ 19 years; not in regular employment with the Central/State Government.',
    benefits: '₹1,000 on early registration of pregnancy; ₹2,000 after 1st ante-natal check-up; ₹2,000 after registration of birth and completion of first cycle of childhood vaccinations.',
    applyLink: 'https://pmmvy-cas.nic.in',
    category: 'financial',
    isActive: true,
  },
  {
    name: 'Janani Suraksha Yojana',
    shortName: 'JSY',
    description: 'Cash assistance to promote institutional delivery among pregnant women from BPL households, reducing maternal and infant mortality.',
    eligibilityCriteria: 'Pregnant women from BPL/SC/ST families; all pregnant women in Low Performing States (LPS) for institutional delivery.',
    benefits: 'Rural beneficiaries: ₹1,400; Urban beneficiaries: ₹1,000. ASHA incentive ₹600 (rural) / ₹400 (urban) per case.',
    applyLink: 'https://nhm.gov.in/index1.php?lang=1&level=3&sublinkid=841&lid=309',
    category: 'financial',
    isActive: true,
  },
  {
    name: 'Janani Shishu Suraksha Karyakram',
    shortName: 'JSSK',
    description: 'Free and cashless services to pregnant women and sick newborns at government health facilities — no out-of-pocket expenses.',
    eligibilityCriteria: 'All pregnant women delivering in public health facilities; all sick newborns up to 30 days after birth.',
    benefits: 'Free normal delivery including caesarean; free drugs and consumables; free diagnostics; free blood; free diet during hospital stay; free transport from home to facility and back; free treatment for sick newborns up to 30 days.',
    applyLink: 'https://nhm.gov.in/index1.php?lang=1&level=3&sublinkid=842&lid=310',
    category: 'other',
    isActive: true,
  },
  {
    name: 'Rashtriya Bal Swasthya Karyakram',
    shortName: 'RBSK',
    description: 'Child health screening and early intervention for children 0–18 years for 4 Ds — Defects at birth, Deficiencies, Diseases, Development delays including disabilities.',
    eligibilityCriteria: 'All children aged 0–18 years at government schools, anganwadis, and newborns at health facilities.',
    benefits: 'Free health screening; referral to District Early Intervention Centres (DEICs); free treatment up to ₹1 lakh at tertiary level for 30 identified health conditions.',
    applyLink: 'https://rbsk.gov.in',
    category: 'other',
    isActive: true,
  },
  {
    name: 'Poshan Abhiyaan (POSHAN 2.0)',
    shortName: 'POSHAN',
    description: "India's flagship nutrition mission to reduce stunting, wasting, underweight, and anaemia in children under 6, adolescent girls, pregnant and lactating mothers through convergence of schemes.",
    eligibilityCriteria: 'Children under 6 years; pregnant and lactating women; adolescent girls (10–19 years) from all sections.',
    benefits: 'Supplementary nutrition; behaviour change communication; real-time monitoring via POSHAN Tracker app; micro-nutrient supplementation; community-based events (Poshan Maah, Poshan Pakhwada).',
    applyLink: 'https://poshanabhiyaan.gov.in',
    category: 'nutrition',
    isActive: true,
  },
  {
    name: 'Sukanya Samriddhi Yojana',
    shortName: 'SSY',
    description: 'Long-term savings scheme for girl child under 10 years with the highest interest rate among small-savings schemes (8.2% p.a. FY 2024-25). Tax-free returns under Section 80C.',
    eligibilityCriteria: 'Girl child below 10 years of age; account opened by natural/legal guardian; one account per girl child; max two accounts per family.',
    benefits: 'Interest rate: 8.2% p.a. (Q1 FY2025); deposit ₹250–₹1.5 lakh per year; maturity at 21 years from account opening; partial withdrawal allowed after age 18 for education.',
    applyLink: 'https://www.india.gov.in/spotlight/sukanya-samriddhi-yojana',
    category: 'financial',
    isActive: true,
  },
  {
    name: 'Ayushman Bharat — PM Jan Arogya Yojana',
    shortName: 'PMJAY',
    description: "World's largest health insurance/assurance scheme providing ₹5 lakh cover per family per year for secondary and tertiary care hospitalisation at empaneled hospitals.",
    eligibilityCriteria: 'Bottom 40% economically vulnerable families as per SECC 2011 database; approximately 12 crore families (55 crore beneficiaries) across India.',
    benefits: '₹5 lakh annual health cover; cashless treatment at 25,000+ empaneled public & private hospitals; covers pre and post-hospitalisation expenses; no cap on family size or age; portability across India.',
    applyLink: 'https://pmjay.gov.in',
    category: 'other',
    isActive: true,
  },
  {
    name: 'National Immunization Programme',
    shortName: 'NIP/UIP',
    description: "India's Universal Immunisation Programme provides free vaccines against 12 vaccine-preventable diseases to all children and pregnant women at government health facilities.",
    eligibilityCriteria: 'All children from birth to 16 years; pregnant women for tetanus vaccination; no income or caste restriction.',
    benefits: 'Free BCG, Hepatitis B, OPV, IPV, DPT, Measles/MR, JE, Vitamin A, PCV, Rotavirus vaccines; also Td for pregnant women and children at 10 and 16 years.',
    applyLink: 'https://nhm.gov.in/index1.php?lang=1&level=2&sublinkid=824&lid=220',
    category: 'vaccination',
    isActive: true,
  },
  {
    name: 'Mid-Day Meal Scheme (PM POSHAN)',
    shortName: 'PM POSHAN',
    description: 'Free hot cooked meal to children in classes I–VIII in government and government-aided schools to improve enrolment, retention, attendance, and nutritional outcomes.',
    eligibilityCriteria: 'All children enrolled in Classes I–VIII in government and government-aided schools, Madrasas, and Maktabs supported under SSA.',
    benefits: 'Free hot cooked nutritious meal every school day; calorie norms: 450 kcal (primary), 700 kcal (upper primary); protein: 12g (primary), 20g (upper primary); mid-day meal timings ensure better attendance.',
    applyLink: 'https://pmposhan.education.gov.in',
    category: 'nutrition',
    isActive: true,
  },
];

// ── Vaccination schedule (IAP 2020-2021 + India NIS) ─────────────────────────
const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + Math.floor(months));
  d.setDate(d.getDate() + Math.round((months % 1) * 30));
  return d;
};

const VACCINE_SCHEDULE = [
  // Birth
  { name: 'BCG',                          ageMonths: 0   },
  { name: 'Hepatitis B (Birth Dose)',      ageMonths: 0   },
  { name: 'OPV-0 (Birth Dose)',            ageMonths: 0   },
  // 6 weeks (1.5 months)
  { name: 'OPV-1',                         ageMonths: 1.5 },
  { name: 'IPV-1 (Injectable Polio)',      ageMonths: 1.5 },
  { name: 'DPT-1 + Hepatitis B-1',        ageMonths: 1.5 },
  { name: 'PCV-1 (Pneumococcal)',          ageMonths: 1.5 },
  { name: 'Rotavirus-1',                   ageMonths: 1.5 },
  // 10 weeks (2.5 months)
  { name: 'OPV-2',                         ageMonths: 2.5 },
  { name: 'DPT-2 + Hepatitis B-2',        ageMonths: 2.5 },
  { name: 'PCV-2 (Pneumococcal)',          ageMonths: 2.5 },
  { name: 'Rotavirus-2',                   ageMonths: 2.5 },
  // 14 weeks (3.5 months)
  { name: 'OPV-3',                         ageMonths: 3.5 },
  { name: 'IPV-2 (Injectable Polio)',      ageMonths: 3.5 },
  { name: 'DPT-3 + Hepatitis B-3',        ageMonths: 3.5 },
  { name: 'PCV-3 (Pneumococcal)',          ageMonths: 3.5 },
  { name: 'Rotavirus-3',                   ageMonths: 3.5 },
  // 6 months
  { name: 'Influenza (Annual)',             ageMonths: 6   },
  // 9 months
  { name: 'Measles-Rubella (MR-1)',        ageMonths: 9   },
  { name: 'JE-1 (Japanese Encephalitis)', ageMonths: 9   },
  { name: 'Vitamin A (1st dose)',          ageMonths: 9   },
  // 12 months
  { name: 'Hepatitis A (1st dose)',        ageMonths: 12  },
  // 15 months
  { name: 'MMR (Measles-Mumps-Rubella)',  ageMonths: 15  },
  { name: 'Varicella (Chickenpox)-1',      ageMonths: 15  },
  { name: 'PCV Booster',                   ageMonths: 15  },
  // 16-18 months
  { name: 'DPT Booster-1',                ageMonths: 16  },
  { name: 'OPV Booster',                  ageMonths: 16  },
  { name: 'Measles-Rubella (MR-2)',        ageMonths: 16  },
  { name: 'JE-2 (Japanese Encephalitis)', ageMonths: 16  },
  { name: 'Vitamin A (2nd dose)',          ageMonths: 16  },
  // 18 months
  { name: 'Hepatitis A (2nd dose)',        ageMonths: 18  },
  { name: 'Varicella (Chickenpox)-2',      ageMonths: 18  },
  // 24 months
  { name: 'Vitamin A (3rd dose)',          ageMonths: 24  },
  { name: 'Typhoid Conjugate Vaccine',     ageMonths: 24  },
  // 4-6 years (48 months approx)
  { name: 'DPT Booster-2',                ageMonths: 60  },
  { name: 'OPV Booster-2',                ageMonths: 60  },
];

// ── Sample children data ──────────────────────────────────────────────────────
const SAMPLE_CHILDREN = [
  {
    name: 'Arjun Kumar',
    dob: new Date(Date.now() - 8 * 30.44 * 24 * 3600 * 1000), // 8 months old
    gender: 'male',
    bloodGroup: 'B+',
    birthWeight: 3.1,
    birthHeight: 50,
    currentWeight: 8.2,
    currentHeight: 69,
    district: 'Dehradun',
    block: 'Vikasnagar',
    village: 'Kalsi',
    nutritionStatus: 'healthy',
  },
  {
    name: 'Priya Kumari',
    dob: new Date(Date.now() - 14 * 30.44 * 24 * 3600 * 1000), // 14 months old
    gender: 'female',
    bloodGroup: 'O+',
    birthWeight: 2.8,
    birthHeight: 48,
    currentWeight: 9.2,
    currentHeight: 76,
    district: 'Dehradun',
    block: 'Vikasnagar',
    village: 'Kalsi',
    nutritionStatus: 'moderate',
  },
];

// Growth records per child (monthly checkups)
const GROWTH_SERIES = {
  'Arjun Kumar': [
    { ageMonths: 1,  weight: 4.1,  height: 54.5, headCircumference: 37.8 },
    { ageMonths: 2,  weight: 5.4,  height: 58.1, headCircumference: 39.5 },
    { ageMonths: 3,  weight: 6.2,  height: 61.2, headCircumference: 40.8 },
    { ageMonths: 4,  weight: 6.9,  height: 63.6, headCircumference: 41.8 },
    { ageMonths: 5,  weight: 7.5,  height: 65.8, headCircumference: 42.6 },
    { ageMonths: 6,  weight: 7.9,  height: 67.3, headCircumference: 43.2 },
    { ageMonths: 8,  weight: 8.2,  height: 69.0, headCircumference: 43.9 },
  ],
  'Priya Kumari': [
    { ageMonths: 2,  weight: 4.8,  height: 56.7, headCircumference: 38.6 },
    { ageMonths: 4,  weight: 5.9,  height: 61.8, headCircumference: 40.5 },
    { ageMonths: 6,  weight: 6.8,  height: 65.5, headCircumference: 42.0 },
    { ageMonths: 9,  weight: 7.9,  height: 70.5, headCircumference: 43.5 },
    { ageMonths: 12, weight: 8.6,  height: 73.8, headCircumference: 44.5 },
    { ageMonths: 14, weight: 9.2,  height: 76.0, headCircumference: 45.2 },
  ],
};

// ── main ─────────────────────────────────────────────────────────────────────
async function seedFullData() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');

  // ── 1. Government Schemes ────────────────────────────────────────────────
  console.log('\n── Seeding Government Schemes ──');
  for (const s of SCHEMES) {
    const exists = await GovtScheme.findOne({ shortName: s.shortName });
    if (exists) { console.log(`  [skip] ${s.shortName} already exists`); continue; }
    await GovtScheme.create(s);
    console.log(`  [ok] ${s.shortName} — ${s.name}`);
  }

  // ── 2. Find test users ───────────────────────────────────────────────────
  const parentUser = await User.findOne({ email: 'parent@sishu.gov.in' });
  const ashaUser   = await User.findOne({ email: 'asha@sishu.gov.in' });
  if (!parentUser) {
    console.log('\n  Parent user not found. Run `npm run seed` first.');
    await mongoose.disconnect();
    return;
  }
  const ashaWorker = ashaUser ? await AshaWorker.findOne({ userId: ashaUser._id }) : null;

  // ── 3. Sample Children ────────────────────────────────────────────────────
  console.log('\n── Seeding Sample Children ──');
  const createdChildren = [];
  for (const cData of SAMPLE_CHILDREN) {
    const exists = await Child.findOne({ name: cData.name, parentId: parentUser._id });
    if (exists) {
      console.log(`  [skip] ${cData.name} already exists`);
      createdChildren.push(exists);
      continue;
    }

    const child = await Child.create({
      ...cData,
      parentId: parentUser._id,
      ashaId: ashaWorker?._id || undefined,
    });
    console.log(`  [ok] Child: ${child.name}`);

    // Auto-generate vaccination schedule
    const vaccines = VACCINE_SCHEDULE.map((v) => ({
      childId: child._id,
      vaccineName: v.name,
      ageMonths: v.ageMonths,
      dueDate: addMonths(child.dob, v.ageMonths),
      status: 'upcoming',
    }));
    await Vaccination.insertMany(vaccines);

    // Mark early vaccines as done (based on current age)
    const ageNow = (Date.now() - new Date(child.dob).getTime()) / (30.44 * 24 * 3600 * 1000);
    await Vaccination.updateMany(
      { childId: child._id, ageMonths: { $lt: ageNow - 1 } },
      { status: 'done', givenDate: new Date() }
    );
    // Mark vaccines due within 2 weeks as 'due'
    const twoWeeks = new Date(Date.now() + 14 * 24 * 3600 * 1000);
    await Vaccination.updateMany(
      { childId: child._id, status: 'upcoming', dueDate: { $lte: twoWeeks } },
      { status: 'due' }
    );

    console.log(`  [ok] Vaccination schedule created for ${child.name}`);

    // Assign to ASHA worker
    if (ashaWorker) {
      await AshaWorker.findByIdAndUpdate(ashaWorker._id, {
        $addToSet: { assignedChildren: child._id },
      });
    }

    createdChildren.push(child);
  }

  // ── 4. Growth Records ────────────────────────────────────────────────────
  console.log('\n── Seeding Growth Records ──');
  const { predictMalnutrition } = require('./utils/zScore');
  for (const child of createdChildren) {
    const series = GROWTH_SERIES[child.name];
    if (!series) continue;

    for (const g of series) {
      const exists = await GrowthRecord.findOne({ childId: child._id, ageMonths: g.ageMonths });
      if (exists) { console.log(`  [skip] growth record age=${g.ageMonths} for ${child.name}`); continue; }

      const result = predictMalnutrition(g.weight, g.height, g.ageMonths, child.gender);
      const recordDate = new Date(new Date(child.dob).getTime() + g.ageMonths * 30.44 * 24 * 3600 * 1000);

      await GrowthRecord.create({
        childId: child._id,
        recordedBy: ashaUser?._id || parentUser._id,
        recordedDate: recordDate,
        ageMonths: g.ageMonths,
        weight: g.weight,
        height: g.height,
        headCircumference: g.headCircumference,
        wazScore: result.waz,
        hazScore: result.haz,
        whzScore: result.whz,
        prediction: result.prediction,
        notes: 'Recorded during routine checkup',
      });
      console.log(`  [ok] Growth record: ${child.name} @ ${g.ageMonths}m — ${result.prediction}`);
    }

    // Update child current stats
    const latestG = series[series.length - 1];
    await Child.findByIdAndUpdate(child._id, {
      currentWeight: latestG.weight,
      currentHeight: latestG.height,
    });
  }

  // ── 5. Notifications ─────────────────────────────────────────────────────
  console.log('\n── Seeding Notifications ──');
  const notifExists = await Notification.countDocuments({ userId: parentUser._id });
  if (notifExists > 0) {
    console.log('  [skip] Notifications already exist');
  } else {
    const notifs = [
      { userId: parentUser._id, message: 'Welcome to Sishu Arogaya! Your child health monitoring portal is ready.', type: 'system', isRead: true },
      { userId: parentUser._id, message: 'Arjun Kumar\'s 9-month vaccination (MR-1) is due soon. Please visit your nearest health centre.', type: 'vaccine_reminder', isRead: false },
      { userId: parentUser._id, message: 'Growth record added for Arjun Kumar by ASHA Worker Priya Sharma. Weight: 8.2kg (Normal range).', type: 'health_alert', isRead: false },
      { userId: parentUser._id, message: 'Priya Kumari\'s DPT Booster-1 vaccination is coming up at 16 months. Schedule now.', type: 'vaccine_reminder', isRead: false },
      { userId: parentUser._id, message: 'New government scheme available: Sukanya Samriddhi Yojana — 8.2% p.a. for girl child savings.', type: 'scheme_update', isRead: true },
      { userId: parentUser._id, message: 'ASHA Worker Priya Sharma will visit Arjun Kumar on the scheduled date. Be available at home.', type: 'visit_reminder', isRead: true },
      { userId: parentUser._id, message: 'Priya Kumari shows moderate nutritional risk. ASHA counselling session recommended.', type: 'health_alert', isRead: false },
    ];
    await Notification.insertMany(notifs);
    console.log(`  [ok] ${notifs.length} notifications created`);
  }

  console.log('\nFull data seeding complete!');
  console.log('   Government Schemes: seeded');
  console.log('   Sample Children: seeded with growth records & vaccinations');
  console.log('   Notifications: seeded');
  await mongoose.disconnect();
}

seedFullData().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
