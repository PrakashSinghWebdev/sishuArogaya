/**
 * Sishu Arogaya – Client-Side Chatbot Knowledge Base
 * Covers: vaccines, growth, nutrition, schemes, illnesses, emergencies, ASHA, development.
 */

const KNOWLEDGE_BASE = [

  // ── GREETINGS ──────────────────────────────────────────────────────────────
  {
    intent: 'greeting',
    patterns: ['hello', 'hi', 'namaste', 'hey', 'good morning', 'good evening', 'hii', 'helo', 'namaskar', 'hy', 'hiya'],
    response: `Hello! 👋 I am Shishu Aarogya's health assistant.

I can help you with:
• Vaccines and immunization schedule
• Child growth and nutrition
• Government health schemes (ICDS, PMMVY, JSY, PMJAY)
• Common illnesses — fever, diarrhea, cough
• Emergency warning signs
• Breastfeeding guidance
• Baby developmental milestones

What would you like to know today?`,
  },

  // ── VACCINE SCHEDULE OVERVIEW ─────────────────────────────────────────────
  {
    intent: 'vaccine_schedule_overview',
    patterns: [
      'vaccination schedule', 'vaccine schedule', 'all vaccines', 'complete vaccination',
      'immunization schedule', 'which vaccines', 'vaccine list', 'टीकाकरण सूची',
      'immunization', 'immunisation', 'vaccines for baby', 'baby vaccination',
    ],
    response: `**Complete Vaccination Schedule (Birth to 5 Years)**

**At Birth:**
• BCG — protects against TB (tuberculosis)
• Hepatitis B (birth dose) — liver protection
• OPV-0 — polio prevention

**6 Weeks (1.5 months):**
• OPV-1 + DPT-1 + HepB-1 + PCV-1 + Rotavirus-1 + IPV-1

**10 Weeks (2.5 months):**
• OPV-2 + DPT-2 + HepB-2 + PCV-2 + Rotavirus-2

**14 Weeks (3.5 months):**
• OPV-3 + DPT-3 + HepB-3 + PCV-3 + Rotavirus-3 + IPV-2

**9 Months:**
• Measles-Rubella (MR-1) + Vitamin A (1st dose) + JE-1

**15–18 Months:**
• MMR + DPT Booster-1 + OPV Booster + PCV Booster + Vitamin A (2nd dose)

**24 Months:**
• Vitamin A (3rd dose) + Typhoid vaccine

**5 Years:**
• DPT Booster-2 + OPV Booster-2

👉 Keep your child's vaccination card safe. Never miss a dose!`,
  },

  // ── BCG VACCINE ──────────────────────────────────────────────────────────
  {
    intent: 'vaccine_bcg',
    patterns: ['bcg vaccine', 'bcg', 'tb vaccine', 'tuberculosis vaccine', 'birth vaccine', 'बीसीजी', 'tuberculosis'],
    response: `**BCG Vaccine (Tuberculosis Protection)**

Given at birth to protect against Tuberculosis (TB) — a serious lung infection.

**When:** At birth (or as soon as possible)
**How:** Small injection on the upper left arm

**What to expect:**
A small red lump appears after 2–3 weeks → becomes a small blister → heals leaving a small scar. This scar is NORMAL — it means the vaccine worked!

**Common reactions (normal):**
Mild swelling, redness, small lump at injection site.

⚠️ If you see swelling in the armpit (lymph node), consult your doctor. Do NOT squeeze or apply anything to the site.`,
  },

  // ── POLIO VACCINE ────────────────────────────────────────────────────────
  {
    intent: 'vaccine_polio',
    patterns: ['polio vaccine', 'opv', 'ipv', 'polio drops', 'polio', 'पोलियो', 'pulse polio'],
    response: `**Polio Vaccine**

Polio can cause permanent paralysis. The vaccine completely prevents this.

**Types:**
• OPV (Oral Polio Vaccine) — given as drops by mouth
• IPV (Injectable Polio Vaccine) — given as injection

**Schedule:**
• OPV-0 at birth
• OPV-1 + IPV-1 at 6 weeks
• OPV-2 at 10 weeks
• OPV-3 + IPV-2 at 14 weeks
• OPV Booster at 16–18 months
• OPV Booster-2 at 5 years

Also given during **Pulse Polio** (National Immunization Days) — always accept these drops even if your child already had vaccines.

India has been polio-free since 2014 — thanks to this vaccine! 🇮🇳`,
  },

  // ── DPT VACCINE ─────────────────────────────────────────────────────────
  {
    intent: 'vaccine_dpt',
    patterns: ['dpt vaccine', 'dpt', 'diphtheria', 'pertussis', 'tetanus', 'whooping cough', 'काली खांसी', 'triple vaccine'],
    response: `**DPT Vaccine (Triple Protection)**

Protects against 3 serious diseases:
• **D — Diphtheria:** Throat infection that can block breathing
• **P — Pertussis (Whooping Cough):** Severe cough that can stop breathing in babies
• **T — Tetanus:** Deadly infection from wounds

**Schedule:**
• DPT-1: 6 weeks | DPT-2: 10 weeks | DPT-3: 14 weeks
• DPT Booster-1: 16–18 months | Booster-2: 5 years

**Common reactions (normal):**
Mild fever, redness or swelling at injection site for 1–2 days.
→ Give paracetamol for fever. Apply cold cloth to injection site.

🚨 Seek care if: Fever above 40°C, convulsions, non-stop crying for 3+ hours.`,
  },

  // ── MEASLES / MMR ────────────────────────────────────────────────────────
  {
    intent: 'vaccine_measles',
    patterns: ['measles vaccine', 'measles', 'mr vaccine', 'mmr', 'rubella', 'mumps', 'खसरा', 'measles rubella'],
    response: `**Measles-Rubella (MR) and MMR Vaccine**

**Measles** → high fever + rash → can cause blindness, brain damage, death
**Rubella** → can cause severe birth defects in the unborn child
**Mumps** → swelling of the face and jaw

**Schedule:**
• MR-1: 9 months (Measles + Rubella)
• MMR: 15 months (Measles + Mumps + Rubella)
• MR-2: 16–18 months

**After vaccination:** Mild fever and rash 7–12 days later is NORMAL — not infectious.

**Signs of measles infection:**
High fever → cough, runny nose, red eyes → widespread rash from face downward. Seek care immediately!`,
  },

  // ── HEPATITIS B ─────────────────────────────────────────────────────────
  {
    intent: 'vaccine_hepatitis',
    patterns: ['hepatitis vaccine', 'hepatitis b', 'liver vaccine', 'hep b', 'हेपेटाइटिस', 'hepatitis'],
    response: `**Hepatitis B Vaccine (Liver Protection)**

Hepatitis B attacks the liver. Chronic infection leads to liver failure and liver cancer.

**Schedule:**
• Birth dose: Within 24 hours of birth (VERY IMPORTANT!)
• Dose 2: At 6 weeks (combined with DPT)
• Dose 3: At 10 weeks
• Dose 4: At 14 weeks

**Why the birth dose is urgent:**
If the mother has Hepatitis B, giving the vaccine within 24 hours prevents the baby from getting infected. This cannot be made up later.

The vaccine gives lifelong protection. Safe — over 1 billion doses given worldwide.`,
  },

  // ── ROTAVIRUS ────────────────────────────────────────────────────────────
  {
    intent: 'vaccine_rotavirus',
    patterns: ['rotavirus', 'diarrhea vaccine', 'stomach vaccine', 'rota vaccine', 'दस्त का टीका', 'rota'],
    response: `**Rotavirus Vaccine (Severe Diarrhea Prevention)**

Rotavirus is the #1 cause of severe diarrhea and dehydration in babies under 2 years — life-threatening if untreated.

**Schedule:**
• Rotavirus-1: 6 weeks
• Rotavirus-2: 10 weeks
• Rotavirus-3: 14 weeks

**How:** Given by mouth (oral drops) — not an injection.

**After vaccination:** Your child is protected from the most dangerous strains of diarrhea. Still practice good hygiene — wash hands before feeding.`,
  },

  // ── VITAMIN A ────────────────────────────────────────────────────────────
  {
    intent: 'vaccine_vitamin_a',
    patterns: ['vitamin a', 'vitamin a dose', 'विटामिन ए', 'vitamin a supplement'],
    response: `**Vitamin A Supplementation**

Not a vaccine but a vital supplement given with vaccinations. Prevents blindness and boosts immunity.
• Reduces child deaths by 23%!

**Schedule:**
• 1st dose: 9 months (orange liquid drops)
• 2nd dose: 16–18 months
• 3rd dose: 24 months
• Then every 6 months until 5 years

**Food sources of Vitamin A:**
Carrots, sweet potato, pumpkin, spinach, egg yolk, liver, papaya, mango

🍳 Tip: Cook orange/yellow vegetables in a little oil — helps absorb Vitamin A better!`,
  },

  // ── NORMAL WEIGHT & HEIGHT ───────────────────────────────────────────────
  {
    intent: 'normal_weight_height',
    patterns: [
      'normal weight', 'average weight', 'baby weight', 'normal height', 'average height',
      'is my baby normal', 'weight chart', 'height chart', 'सामान्य वजन', 'normal growth',
      'weight for age', 'how much should baby weigh', '6 month weight', 'baby height',
    ],
    response: `**Normal Weight & Height Guide (WHO Standards)**

| Age | Weight (Boys) | Weight (Girls) | Height (Boys) | Height (Girls) |
|-----|--------------|----------------|--------------|----------------|
| Birth | 3.3 kg | 3.2 kg | 49.9 cm | 49.1 cm |
| 3 months | 6.4 kg | 5.8 kg | 61.4 cm | 59.8 cm |
| 6 months | 7.9 kg | 7.3 kg | 67.6 cm | 65.7 cm |
| 9 months | 8.9 kg | 8.2 kg | 72.0 cm | 70.1 cm |
| 12 months | 9.6 kg | 8.9 kg | 75.7 cm | 74.0 cm |
| 18 months | 10.9 kg | 10.2 kg | 82.3 cm | 80.7 cm |
| 24 months | 12.2 kg | 11.5 kg | 87.8 cm | 86.4 cm |

A child 10–15% above or below these values can still be healthy.

⚠️ See a doctor if: Child not gaining weight for 2+ months, visible ribs/bones, or swollen feet.`,
  },

  // ── Z-SCORE ──────────────────────────────────────────────────────────────
  {
    intent: 'zscore_explained',
    patterns: ['z score', 'zscore', 'z-score', 'waz', 'haz', 'whz', 'what is zscore', 'weight for age', 'height for age', 'z स्कोर', 'zscores'],
    response: `**What is a Z-Score? (Explained Simply)**

A Z-Score tells us how your child's measurements compare to healthy children of the same age and sex.

**Three types:**
• **WAZ** (Weight-for-Age) — is the weight right for the age?
• **HAZ** (Height-for-Age) — is the height right? (checks stunting)
• **WHZ** (Weight-for-Height) — is weight right for height? (checks wasting)

**What the numbers mean:**
• 0 → Exactly average — perfectly normal ✅
• -1 to 0 → Slightly below average — still healthy ✅
• -2 to -1 → At risk — needs better nutrition ⚠️
• Below -2 → Malnutrition — needs medical attention 🔴
• Below -3 → Severe malnutrition — go to hospital URGENTLY 🚨

Think of it like a report card. Near 0 = your child is on track. Below -2 = needs extra nutrition care.`,
  },

  // ── MALNUTRITION ─────────────────────────────────────────────────────────
  {
    intent: 'malnutrition_explained',
    patterns: [
      'malnutrition', 'undernutrition', 'malnourished', 'stunting', 'wasting', 'underweight',
      'कुपोषण', 'what is malnutrition', 'child malnutrition', 'severe malnutrition', 'sam', 'mam',
    ],
    response: `**Understanding Malnutrition in Children**

Malnutrition means a child is not getting enough nutrients to grow and stay healthy.

**Three main types:**
🔴 **Underweight** (low weight for age)
🔴 **Stunting** (too short for age — from long-term poor nutrition)
🔴 **Wasting** (too thin for height — recent/acute malnutrition)

**Warning signs:**
• Very thin body, ribs visible
• Arms and legs look very thin
• Face looks old or wrinkled
• Swollen feet or face (URGENT!)
• Very pale inner eyelids
• Weak, not active, not interested in food

**Causes:** Not enough food, poor diet, repeated illness, poor breastfeeding start, unclean water.

**Treatment:** Extra feeding, therapeutic foods (RUTF), treating infections. Severe cases need NRC admission.

🏥 Contact your ASHA worker or PHC immediately if you notice these signs.`,
  },

  // ── BREASTFEEDING ────────────────────────────────────────────────────────
  {
    intent: 'breastfeeding',
    patterns: [
      'breastfeeding', 'breast milk', 'breast feed', 'how often feed', 'newborn feeding',
      'colostrum', 'mother milk', 'स्तनपान', 'दूध पिलाना', 'nursing baby', 'feed baby',
      'breastfeed', 'mother feed',
    ],
    response: `**Breastfeeding Guide**

**The 3 Golden Rules:**
🥛 **Start within 1 hour of birth** — the first yellow milk (colostrum) is packed with antibodies. Never throw it away!
🥛 **Breastfeed ONLY for first 6 months** — no water, no other milk, no food
🥛 **Continue until 2 years** alongside solid foods after 6 months

**How often to feed:**
• Newborns: Every 2–3 hours (8–12 times a day, including nights)
• 1–3 months: Every 2–4 hours
• 3–6 months: Every 3–4 hours

**Signs baby is getting enough:**
✅ Baby gains weight well
✅ Wets 6+ cloth diapers per day
✅ Baby seems satisfied after feeding
✅ Pees at least 6 times a day

⚠️ Seek help if: Nipple pain, baby not gaining weight, less wet diapers — talk to your ASHA worker!`,
  },

  // ── COMPLEMENTARY FEEDING ────────────────────────────────────────────────
  {
    intent: 'complementary_feeding',
    patterns: [
      'solid food', 'first food', 'weaning', 'complementary feeding', 'when to start food',
      '6 months food', 'baby food', 'ठोस आहार', 'start solid', 'first solid', 'food for baby',
    ],
    response: `**Starting Solid Foods at 6 Months**

Before 6 months, breast milk alone is perfect. Baby's gut is not ready for solids earlier.

**6 months:**
• Rice porridge, dal water, mashed banana, mashed cooked vegetables
• 2–3 small meals/day + continue breastfeeding
• Start with 2–3 spoons, gradually increase

**7–8 months:**
• Mashed khichdi with dal + vegetables
• Mashed egg yolk, soft fruits (banana, papaya)
• 2–3 meals + 1–2 snacks/day

**9–11 months:**
• Family foods finely chopped (dal, rice, roti, sabzi, egg, curd)
• 3 meals + 2 snacks daily

**12+ months:**
• Almost all family foods
• 3 meals + 2–3 snacks

**Always add a teaspoon of oil or ghee to meals** — gives energy and helps absorb nutrients.

⚠️ Avoid before 1 year: honey (risk of botulism), whole nuts (choking), too much salt or sugar.`,
  },

  // ── FEVER ────────────────────────────────────────────────────────────────
  {
    intent: 'fever_management',
    patterns: [
      'fever', 'temperature', 'baby fever', 'high temperature', 'paracetamol', 'बुखार',
      'child fever', 'fever treatment', 'fever in baby', 'fever management',
    ],
    response: `**Managing Fever in Children**

**Normal:** 36.5°C – 37.5°C | **Fever:** Above 38°C (100.4°F)

**Home care for mild fever (38–39°C):**
• Remove extra clothing and blankets
• Give paracetamol: 10–15 mg per kg of weight, every 4–6 hours
• Give extra fluids (breastmilk, ORS, water, soups)
• Wipe with lukewarm (not cold!) wet cloth on forehead, armpits

**Do NOT:**
❌ Don't use aspirin in children (dangerous — causes Reye's syndrome)
❌ Don't use ice or cold water sponging
❌ Don't wrap in blankets to "sweat it out"

**Go to hospital IMMEDIATELY if:**
🚨 Any fever in baby under 2 months (any fever is serious!)
🚨 Temperature above 40°C
🚨 Fever with neck stiffness, severe headache, rash
🚨 Fever with convulsions (fits/seizures)
🚨 Child is not responding, very weak, or unconscious
🚨 Fever lasting more than 3 days`,
  },

  // ── DIARRHEA / ORS ───────────────────────────────────────────────────────
  {
    intent: 'diarrhea_management',
    patterns: [
      'diarrhea', 'loose motions', 'loose stool', 'stomach upset', 'ors',
      'dehydration', 'दस्त', 'पेचिश', 'loose motion', 'ors solution', 'oral rehydration',
    ],
    response: `**Managing Diarrhea (Loose Motions)**

Diarrhea causes dehydration — the biggest danger for children.

**Immediate treatment — ORS:**
• ORS saves lives! Available free from ASHA worker, Anganwadi, or government health centre
• **Homemade ORS:** 1 litre clean water + 6 teaspoons sugar + ½ teaspoon salt. Stir well.
• Give small sips every 2–3 minutes
• Continue breastfeeding — do NOT stop

**How much ORS:**
• Under 2 years: 50–100 ml after each loose stool
• 2–10 years: 100–200 ml after each loose stool

**Signs of dehydration — go to hospital:**
🚨 Dry mouth, no tears when crying
🚨 Sunken eyes or sunken soft spot (fontanelle)
🚨 Not passing urine for 6+ hours
🚨 Very weak, lethargic, or unconscious
🚨 Blood in stool | Vomiting everything

**Food during diarrhea:** Keep feeding — don't stop food. Give soft foods. Zinc syrup (as prescribed) helps.

⚠️ Do NOT give Imodium/loperamide to children.`,
  },

  // ── PNEUMONIA / COUGH ────────────────────────────────────────────────────
  {
    intent: 'pneumonia_ari',
    patterns: [
      'pneumonia', 'cough', 'breathing problem', 'cold', 'chest infection', 'ari',
      'respiratory', 'fast breathing', 'निमोनिया', 'खांसी', 'सांस लेने में तकलीफ',
      'breathing difficulty', 'chest problem',
    ],
    response: `**Recognizing Pneumonia (Chest Infection)**

Pneumonia kills more children under 5 than any other illness. Early treatment saves lives.

**Warning signs of pneumonia:**
• **Fast breathing** — over 60/min in babies under 2 months; over 50/min in 2–12 months; over 40/min in 1–5 years
• **Chest in-drawing** — you can see the lower chest pulling IN with each breath (very serious!)
• Wheezing or noisy breathing
• Nasal flaring (nostrils widening)
• Cough with yellow/green phlegm or blood
• Fever with fast breathing

**Home care for mild cough/cold:**
• Saline nose drops for blocked nose
• Continue breastfeeding and extra fluids
• No antibiotics without doctor's prescription

**Go to hospital IMMEDIATELY if:**
🚨 Very fast breathing (see rates above)
🚨 Chest pulling in with each breath
🚨 Baby turns blue (especially around lips)
🚨 Child unable to drink or feed
🚨 High fever with breathing problems`,
  },

  // ── EMERGENCY SIGNS ──────────────────────────────────────────────────────
  {
    intent: 'emergency_signs',
    patterns: [
      'emergency', 'danger signs', 'warning signs', 'when to hospital', 'serious condition',
      'urgent care', 'emergency baby', 'आपातकाल', 'खतरे के संकेत', 'when to go to hospital',
      'danger sign', 'is it serious', 'urgent',
    ],
    response: `🚨 **EMERGENCY WARNING SIGNS — Go to Hospital IMMEDIATELY**

**In ANY baby under 2 months, go immediately for:**
• Any fever (even slight)
• Not feeding well or refusing feeds
• Convulsions (fits)
• Fast or difficult breathing
• Very slow breathing
• Lethargic — moves only when stimulated
• Skin very pale or yellow (jaundice spreading to limbs)

**In children 2 months – 5 years, go immediately for:**
• Convulsions (fits/seizures)
• Unconscious or very difficult to wake up
• Breathing very fast or with chest in-drawing
• Child is not able to drink or feed
• Vomiting everything they drink
• Extremely pale or blue skin
• Severe dehydration (sunken eyes, dry mouth)
• Any bulging of the fontanelle (soft spot on head)

📞 **Call 108** — Free ambulance service available 24/7 across India`,
  },

  // ── ICDS SCHEME ──────────────────────────────────────────────────────────
  {
    intent: 'scheme_icds',
    patterns: [
      'icds', 'anganwadi', 'integrated child development', 'poshan', 'nutrition programme',
      'poshan abhiyan', 'आंगनबाड़ी', 'poshan', 'anganwari', 'AWC',
    ],
    response: `**ICDS — Integrated Child Development Services (Anganwadi)**

ICDS is India's flagship programme for child nutrition and development.

**Free services available at every Anganwadi Centre:**
✅ Supplementary nutrition (take-home ration or hot cooked meal)
✅ Pre-school education (3–6 years)
✅ Health check-up every month (weight, height, MUAC measurement)
✅ Immunization (vaccines given at Anganwadi or nearby PHC)
✅ Health and nutrition education for mothers
✅ Referral for sick children

**Who can access:**
• Children from birth to 6 years
• Pregnant women and breastfeeding mothers
• Adolescent girls (14–18 years)

**How to register:** Visit your nearest Anganwadi Centre — registration is free and open to all.

💡 Your Anganwadi worker tracks your child's weight monthly. Never miss these check-ups!`,
  },

  // ── PMMVY ────────────────────────────────────────────────────────────────
  {
    intent: 'scheme_pmmvy',
    patterns: [
      'pmmvy', 'maternity benefit', 'maternity allowance', '5000 maternity', 'pradhan mantri matru',
      'maternity cash', 'मातृ वंदना', 'matru vandana', 'maternity scheme',
    ],
    response: `**PMMVY — Pradhan Mantri Matru Vandana Yojana**

Cash benefit for pregnant and breastfeeding mothers to compensate for wage loss.

**Amount: ₹5,000 in 3 installments**

• **₹1,000 (1st):** Register in 1st trimester at Anganwadi/health centre
• **₹2,000 (2nd):** After 6 months of pregnancy + at least 1 antenatal check-up
• **₹2,000 (3rd):** After child is born + after first immunization (OPV + BCG)

**Who qualifies:**
• All pregnant women for their first live birth (19+ years)
• Women in government jobs do NOT qualify (covered separately)

**How to apply:** Visit Anganwadi Centre or PHC with:
• Aadhar card
• Bank passbook (account in mother's name)
• MCP card (Mother-Child Protection card)

💡 Also get ₹1,000 extra from JSY if you deliver at a government hospital!`,
  },

  // ── JSY ──────────────────────────────────────────────────────────────────
  {
    intent: 'scheme_jsy',
    patterns: [
      'jsy', 'janani suraksha', 'delivery benefit', 'hospital delivery cash',
      'institutional delivery', 'जननी सुरक्षा', 'delivery scheme', 'cash for delivery',
    ],
    response: `**JSY — Janani Suraksha Yojana (Safe Delivery Incentive)**

Cash incentive to encourage hospital delivery and reduce maternal/infant deaths.

**Amount:**
• Rural areas: ₹1,400 per delivery
• Urban areas: ₹1,000 per delivery
• ASHA worker also gets ₹300–600 for facilitating

**Who qualifies:**
• All pregnant women delivering at government hospitals or accredited private hospitals
• Below poverty line (BPL) families
• SC/ST women (all qualify regardless of BPL)
• Women above 19 years

**How to get it:**
1. Register at nearest PHC/CHC/government hospital
2. Get 3+ antenatal check-ups
3. Deliver at the registered facility
4. Cash deposited directly to bank account`,
  },

  // ── JSSK ─────────────────────────────────────────────────────────────────
  {
    intent: 'scheme_jssk',
    patterns: [
      'jssk', 'janani shishu', 'free delivery', 'free antenatal', 'free treatment baby',
      'जननी शिशु', 'free hospital', 'free medicine',
    ],
    response: `**JSSK — Janani Shishu Suraksha Karyakram (Free Treatment)**

FREE treatment for pregnant women and sick newborns at all government hospitals.

**Pregnant women get FREE:**
✅ Normal and caesarean delivery
✅ All medicines and consumables
✅ Diagnostic tests (blood, urine, ultrasound)
✅ Diet during hospital stay
✅ Blood transfusion
✅ Free transport to hospital and back home
✅ Treatment for pregnancy complications

**Sick Newborn (0–30 days) gets FREE:**
✅ All treatment, medicines, tests
✅ Free diet for mother while baby is admitted
✅ Free transport

**Where:** All government district hospitals, CHCs, PHCs.

⚠️ This is your RIGHT. If any government facility charges you for delivery, you can complain to the District CMO.`,
  },

  // ── PMJAY / AYUSHMAN BHARAT ──────────────────────────────────────────────
  {
    intent: 'scheme_pmjay',
    patterns: [
      'pmjay', 'ayushman bharat', 'health insurance', 'free treatment', '5 lakh insurance',
      'hospital insurance', 'आयुष्मान भारत', 'ayushman card', 'ayushman',
    ],
    response: `**Ayushman Bharat — PMJAY (₹5 Lakh Health Insurance)**

World's largest health insurance scheme.

**Coverage:**
✅ Up to ₹5,00,000 per family per year
✅ 1,500+ medical procedures covered
✅ Pre and post hospitalization expenses
✅ All pre-existing diseases covered from day 1
✅ Cashless treatment at empanelled hospitals

**Who qualifies:**
• Economically vulnerable families identified in SECC 2011 database
• BPL families, construction workers, domestic workers, and more

**How to check eligibility:** Visit pmjay.gov.in or nearest Ayushman Mitra help desk

**How to avail:** Show your Ayushman card at any empanelled government or private hospital.

**Find nearby hospitals:** 1800-111-565 (toll-free helpline)`,
  },

  // ── RBSK ─────────────────────────────────────────────────────────────────
  {
    intent: 'scheme_rbsk',
    patterns: [
      'rbsk', 'rashtriya bal swasthya', 'child health screening', 'free surgery child',
      'birth defect', 'school health', 'बाल स्वास्थ्य',
    ],
    response: `**RBSK — Rashtriya Bal Swasthya Karyakram**

Free health screening and treatment for children from birth to 18 years.

**What is screened:**
• Birth defects (heart, eye, ear, limb problems)
• Diseases (sickle cell, thalassemia, hypothyroidism)
• Deficiencies (Vitamin D, iron, iodine)
• Developmental delays and disabilities

**Who screens:** Mobile Health Teams (MHTs) visit Anganwadis, schools regularly.

**Treatment:** If a problem is found, children are referred for FREE treatment including surgeries at tertiary care hospitals.

**How to access:** Contact your Anganwadi worker or nearest government health centre to register your child.`,
  },

  // ── DEVELOPMENTAL MILESTONES ─────────────────────────────────────────────
  {
    intent: 'developmental_milestones',
    patterns: [
      'milestones', 'baby milestones', 'development', 'when does baby walk', 'when does baby talk',
      'when does baby sit', 'baby development', 'विकास', 'बच्चे का विकास', 'motor development',
      'first words', 'walking age', 'sitting age',
    ],
    response: `**Baby Developmental Milestones**

**1 Month:** Follows faces with eyes, responds to sounds, lifts head briefly

**2 Months:** Smiles socially, coos and makes sounds, holds head up for short time

**3–4 Months:** Laughs, holds head steady, reaches for objects

**6 Months:** Sits with support, turns to voices, babbles (ba-ba, ma-ma), transfers objects hand to hand

**9 Months:** Sits without support, crawls, waves bye-bye, says mama/dada with meaning

**12 Months (1 Year):** Pulls to stand, may take first steps, 1–3 words with meaning, follows simple instructions

**18 Months:** Walking well, 10–20 words, plays simple pretend games, points to show interest

**24 Months (2 Years):** Runs, climbs, 2-word phrases, 50+ words, names familiar objects

**3 Years:** Sentences, climbs stairs, dresses partially, follows 2-step instructions

⚠️ Concern: If your child is NOT reaching milestones for their age, consult a doctor early. Early intervention makes a big difference!`,
  },

  // ── ASHA WORKER ──────────────────────────────────────────────────────────
  {
    intent: 'asha_worker',
    patterns: [
      'asha worker', 'asha', 'health worker', 'community health worker', 'आशा वर्कर',
      'asha role', 'what does asha do', 'contact asha',
    ],
    response: `**Your ASHA Worker — A Lifeline for Your Child**

ASHA (Accredited Social Health Activist) is your community health guide, available in every village and urban slum.

**What your ASHA worker does for you:**
✅ Registers your pregnancy and ensures safe delivery
✅ Tracks your child's vaccination — sends reminders, helps schedule
✅ Monitors your child's growth (weight, height)
✅ Provides ORS and basic medicines for fever and diarrhea
✅ Counsels on breastfeeding, nutrition, family planning
✅ Helps you access all government schemes (JSY, PMMVY, JSSK)
✅ Arranges ambulance during emergencies
✅ Conducts home visits for pregnant women and newborns

**When to contact your ASHA worker:**
• When you are pregnant (register early!)
• For vaccination reminders
• When your child is sick
• To access government schemes
• For any health question

**In this app:** View your assigned ASHA worker in the Child Profile section.

📞 **National ASHA Helpline: 1800-180-1104** (Free, Mon–Sat 9am–6pm)`,
  },

  // ── JAUNDICE ─────────────────────────────────────────────────────────────
  {
    intent: 'jaundice',
    patterns: ['jaundice', 'yellow skin', 'yellow eyes', 'newborn yellow', 'neonatal jaundice', 'पीलिया'],
    response: `**Newborn Jaundice (Yellow Skin)**

Caused by bilirubin buildup. Mild jaundice in days 2–5 is very common and usually harmless.

**Normal (physiological) jaundice:**
• Yellow tint only on face and upper body
• Appears day 2–3, peaks day 3–5, goes away by day 7–10
• Baby is feeding well and active

**Go to hospital IMMEDIATELY if:**
🚨 Jaundice appears within 24 hours of birth
🚨 Yellow color spreads to arms, legs, hands, feet
🚨 Baby not feeding, very sleepy, or cannot be woken
🚨 Jaundice lasting more than 2 weeks (3 weeks if premature)
🚨 Dark brown/tea-colored urine
🚨 Pale or white/clay-colored stools

**Treatment:** Phototherapy (blue light) at hospital. Frequent breastfeeding helps clear bilirubin.

**Home care for mild jaundice:** 5–10 minutes of morning sunlight on baby's skin can help slightly — but is not a substitute for hospital treatment.`,
  },

  // ── ANEMIA ───────────────────────────────────────────────────────────────
  {
    intent: 'anemia',
    patterns: ['anemia', 'anaemia', 'low hemoglobin', 'pale child', 'iron deficiency', 'weak blood', 'खून की कमी', 'एनीमिया'],
    response: `**Anemia in Children (Low Blood Count)**

Anemia means not enough hemoglobin to carry oxygen. Iron deficiency is the most common cause.

**Signs of anemia:**
• Pale inner eyelids (pull down lower eyelid — should be red/pink)
• Pale lips, nails, palms
• Tires easily, less active
• Poor appetite, frequent infections
• Delayed development

**Prevention:**
• Breastfeed exclusively for 6 months
• Give iron-rich foods after 6 months: liver, dal, spinach, eggs, fortified cereals, meat
• Pair with Vitamin C (lemon, tomato, guava) — helps absorb iron from plants
• Avoid tea/coffee with meals
• Deworm every 6 months after 1 year

**Treatment:** Iron syrup or drops as prescribed. Continue for at least 3 months.

💊 Government iron syrup is given weekly to children 6 months–5 years by ASHA workers (free).`,
  },

  // ── VITAMIN D / RICKETS ──────────────────────────────────────────────────
  {
    intent: 'vitamin_d',
    patterns: ['vitamin d', 'rickets', 'bone weak', 'bone problem', 'calcium', 'विटामिन डी', 'सूखा रोग'],
    response: `**Vitamin D and Rickets**

Vitamin D helps absorb calcium and is essential for strong bones. Deficiency causes Rickets — soft, weak, curved bones.

**Signs of Vitamin D deficiency:**
• Delayed teething
• Soft spot on head (fontanelle) closes late
• Bowing of legs
• Swollen wrists and ankles
• Delayed walking | Poor growth

**Prevention:**
• **Sunlight:** 15–20 minutes of morning sun on baby's arms and legs — most natural source
• **Breast milk is low in Vitamin D** — babies need sunlight or supplements
• **Vitamin D drops:** 400 IU/day from birth to 1 year (ask your doctor)
• **Foods:** Fatty fish, egg yolk, fortified milk

⚠️ Severe rickets needs X-ray and specialist care. Early treatment = complete recovery.`,
  },

  // ── ABOUT THE APP ────────────────────────────────────────────────────────
  {
    intent: 'about_app',
    patterns: [
      'about', 'what is this app', 'sishu arogaya', 'about the system', 'what is sishu',
      'app features', 'इस ऐप के बारे में', 'about app', 'what can you do',
    ],
    response: `**About Shishu Aarogya**

Shishu Aarogya is a National Integrated Child Health Monitoring System for the Government of India, supporting all states and 22+ languages nationwide.

**Features:**
📊 Track child growth using WHO z-score standards
💉 Manage vaccination schedules (IAP 2020–2021 guidelines)
🤖 AI-powered malnutrition prediction
🥗 Personalized diet plans based on child's health status
🏛️ Information on all government health schemes
📋 Generate health reports (PDF)
👩‍⚕️ Connect parents with assigned ASHA worker

**Who uses it:**
• **Parents** — monitor child's health from home
• **ASHA Workers** — track children, log visits and growth
• **Admins** — district-level analytics and oversight

📞 For help: 1800-180-1104`,
  },

  // ── DIET PLAN ────────────────────────────────────────────────────────────
  {
    intent: 'diet_plan',
    patterns: [
      'diet plan', 'diet', 'what to eat', 'food plan', 'nutrition plan', 'meal plan',
      'आहार', 'diet chart', 'baby diet', 'food for child', 'diet for baby',
    ],
    response: `**Diet Plan for Children**

**0–6 months:**
• Breast milk ONLY — no water, no other food
• Feed on demand, 8–12 times a day

**6–8 months:**
• Breast milk + Start soft solids
• Khichdi (rice + dal), mashed banana, mashed cooked vegetables
• 2–3 meals + 1–2 snacks + breastmilk

**9–11 months:**
• Mashed family foods: dal, rice, roti, sabzi, egg, curd
• 3 meals + 2 snacks + breastmilk
• Finger foods they can pick up

**12 months – 2 years:**
• All family foods (avoid very spicy, very salty, processed)
• 3 meals + 2–3 snacks + continue breastmilk if possible

**Key nutrition tips:**
✅ Add ghee or oil to every meal (energy dense)
✅ Give eggs — best complete protein source
✅ Iron-rich foods: dal, green leafy vegetables, meat, fortified cereals
✅ Calcium: curd, paneer, sesame (til)
✅ Always wash hands before feeding

💡 Visit the Diet Plan section in this app for a personalized diet chart for your child!`,
  },

  // ── UNKNOWN / FALLBACK ───────────────────────────────────────────────────
  {
    intent: 'unknown',
    patterns: [],
    response: `I'm not sure about that specific question. But I can help you with:

• **Vaccines** — "Tell me about BCG vaccine" or "vaccination schedule"
• **Growth** — "Normal weight for 6 month baby" or "what is z-score?"
• **Nutrition** — "What to feed 6 month baby?" or "breastfeeding tips"
• **Illnesses** — "My baby has fever" or "diarrhea treatment"
• **Schemes** — "What is ICDS?" or "How to get PMMVY money?"
• **Emergencies** — "Emergency signs" or "When to go to hospital"
• **Development** — "Baby milestones" or "When does baby walk?"
• **Diet** — "Diet plan for baby" or "What should my child eat?"

Please try rephrasing your question, or tap one of the suggestion chips.

📞 **For medical advice, always consult your ASHA worker or nearest PHC.**`,
  },
];

/**
 * Find the best matching answer for a user query.
 * Uses exact match > phrase match > word-level fuzzy match.
 */
export function findAnswer(query) {
  if (!query || typeof query !== 'string') {
    return KNOWLEDGE_BASE.find(k => k.intent === 'unknown').response;
  }

  const q = query.toLowerCase().trim();

  let bestScore = 0;
  let bestEntry = null;

  for (const entry of KNOWLEDGE_BASE) {
    if (entry.intent === 'unknown') continue;
    let score = 0;

    for (const pattern of entry.patterns) {
      if (q === pattern) {
        score += 20;
        break;
      }
      if (q.includes(pattern)) {
        score += 8;
        continue;
      }
      if (pattern.includes(q)) {
        score += 6;
        continue;
      }
      // Word-level match
      const pWords = pattern.split(/\s+/);
      const qWords = q.split(/\s+/);
      for (const pw of pWords) {
        if (pw.length < 3) continue;
        for (const qw of qWords) {
          if (qw.length < 3) continue;
          if (qw === pw) score += 3;
          else if (qw.includes(pw) || pw.includes(qw)) score += 1;
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  const MIN_SCORE = 2;
  if (bestScore >= MIN_SCORE && bestEntry) return bestEntry.response;
  return KNOWLEDGE_BASE.find(k => k.intent === 'unknown').response;
}

export default KNOWLEDGE_BASE;
