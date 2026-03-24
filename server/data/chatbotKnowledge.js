/**
 * Sishu Arogaya Chatbot Knowledge Base
 * Built from IAP 2020-2021, WHO guidelines, IMCI, NIS, NLEM, and Indian child health standards.
 * All responses are in plain, easy-to-understand language.
 */

const KNOWLEDGE_BASE = [

  // ══════════════════════ GREETINGS ══════════════════════
  {
    intent: 'greeting',
    patterns: ['hello', 'hi', 'namaste', 'hey', 'good morning', 'good evening', 'hii', 'helo'],
    response: `Hello! 👋 I am Sishu Arogaya's health assistant. I can help you with:
• Vaccination schedule and information
• Child growth and nutrition
• Signs of malnutrition
• Government health schemes
• Common childhood illnesses
• Emergency warning signs
• Breastfeeding guidance

What would you like to know today?`
  },

  // ══════════════════════ VACCINES — GENERAL ══════════════════════
  {
    intent: 'vaccine_schedule_overview',
    patterns: ['vaccination schedule', 'vaccine schedule', 'all vaccines', 'complete vaccination', 'immunization schedule', 'which vaccines', 'vaccine list', 'टीकाकरण सूची'],
    response: `Your child needs these vaccines from birth to 5 years:

**At Birth:**
• BCG — protects against TB
• Hepatitis B (birth dose) — protects liver
• OPV-0 — protects against polio

**6 Weeks (1.5 months):**
• OPV-1 + DPT-1+HepB-1 + PCV-1 + Rotavirus-1 + IPV-1

**10 Weeks (2.5 months):**
• OPV-2 + DPT-2+HepB-2 + PCV-2 + Rotavirus-2

**14 Weeks (3.5 months):**
• OPV-3 + DPT-3+HepB-3 + PCV-3 + Rotavirus-3 + IPV-2

**6 Months:**
• Influenza (flu) vaccine — 1st dose

**9 Months:**
• Measles-Rubella (MR-1) + Vitamin A (1st dose) + JE-1

**12 Months:**
• Hepatitis A (1st dose)

**15-18 Months:**
• MMR + Varicella (chickenpox) + PCV Booster + DPT Booster-1 + Hepatitis A (2nd dose)

**24 Months:**
• Vitamin A (3rd dose) + Typhoid vaccine

**5 Years:**
• DPT Booster-2 + OPV Booster-2

👉 Keep your child's vaccination card safe. Never miss a dose!`
  },

  {
    intent: 'vaccine_bcg',
    patterns: ['bcg vaccine', 'bcg', 'tb vaccine', 'tuberculosis vaccine', 'birth vaccine', 'बीसीजी'],
    response: `**BCG Vaccine (TB Protection)**

The BCG vaccine protects your baby against Tuberculosis (TB) — a serious infection that mainly affects the lungs.

**When:** Given at birth (or as soon as possible after birth)
**How:** A small injection on the upper left arm
**What to expect:** A small red bump appears at the injection site after 2-3 weeks. This becomes a small blister, then heals leaving a small scar. This scar is NORMAL and shows the vaccine worked.
**Common reactions:** Mild swelling, redness, small lump at injection site — all normal.

⚠️ If you see swelling in the armpit (lymph node), consult your doctor. Do NOT squeeze or apply anything to the injection site.`
  },

  {
    intent: 'vaccine_polio',
    patterns: ['polio vaccine', 'opv', 'ipv', 'polio drops', 'polia', 'पोलियो'],
    response: `**Polio Vaccine (Polio Prevention)**

Polio is a disease that can cause permanent paralysis (legs stop working). The vaccine completely prevents this.

**Types:**
• **OPV (Oral Polio Vaccine)** — given as oral drops (by mouth)
• **IPV (Injectable Polio Vaccine)** — given as injection

**Schedule:**
• OPV-0: At birth
• OPV-1: 6 weeks + IPV-1: 6 weeks
• OPV-2: 10 weeks
• OPV-3: 14 weeks + IPV-2: 14 weeks
• OPV Booster: 16-18 months
• OPV Booster-2: 5 years

Also given during **National Immunization Days (Pulse Polio)** — when health workers give drops house-to-house. Always accept these drops even if your child had vaccines.

India has been polio-free since 2014 — thanks to this vaccine! Let's keep it that way.`
  },

  {
    intent: 'vaccine_dpt',
    patterns: ['dpt vaccine', 'dpt', 'diphtheria', 'pertussis', 'tetanus', 'whooping cough', 'काली खांसी'],
    response: `**DPT Vaccine (Triple Protection)**

DPT protects against 3 serious diseases:
• **D — Diphtheria:** A throat infection that can block breathing
• **P — Pertussis (Whooping Cough):** Severe coughing that can stop breathing in babies
• **T — Tetanus:** A deadly infection from dirty wounds

**Schedule:**
• DPT-1+HepB-1: 6 weeks
• DPT-2+HepB-2: 10 weeks
• DPT-3+HepB-3: 14 weeks
• DPT Booster-1: 16-18 months
• DPT Booster-2: 5 years

**Common reactions (normal):** Mild fever, redness/swelling at injection site for 1-2 days.
**Management:** Give paracetamol for fever. Apply cold cloth to injection site.

⚠️ Seek care if: High fever above 40°C, convulsions, non-stop crying for 3+ hours, difficulty breathing.`
  },

  {
    intent: 'vaccine_measles',
    patterns: ['measles vaccine', 'measles', 'mr vaccine', 'mmr', 'rubella', 'mumps', 'खसरा'],
    response: `**Measles-Rubella (MR) and MMR Vaccine**

**Measles** causes high fever, rash all over body, and can lead to blindness, brain damage, and death in children.
**Rubella** can cause birth defects if a pregnant woman gets it.
**Mumps** causes swelling of the face/jaw.

**Schedule:**
• MR-1: 9 months (Measles + Rubella)
• MMR: 15 months (Measles + Mumps + Rubella)
• MR-2: 16-18 months

**Common reactions:** Mild fever and rash 7-12 days after vaccination — this is NORMAL and not infectious.

**Signs of measles to watch for:**
High fever → cough, runny nose, red eyes → widespread rash from face downward. Seek care immediately if you see these signs.`
  },

  {
    intent: 'vaccine_hepatitis',
    patterns: ['hepatitis vaccine', 'hepatitis b', 'liver vaccine', 'hep b', 'हेपेटाइटिस'],
    response: `**Hepatitis B Vaccine (Liver Protection)**

Hepatitis B is a virus that attacks the liver. Chronic infection can lead to liver failure and liver cancer.

**Schedule:**
• Birth dose: Within 24 hours of birth (VERY IMPORTANT — the sooner the better)
• Dose 2: At 6 weeks (combined with DPT)
• Dose 3: At 10 weeks
• Dose 4: At 14 weeks

**Why the birth dose is urgent:** If the mother has Hepatitis B, giving the vaccine within 24 hours protects the baby from getting infected. This cannot be done later.

The vaccine is safe and effective. More than 1 billion doses have been given worldwide. Your child is protected for life with these 4 doses.`
  },

  {
    intent: 'vaccine_rotavirus',
    patterns: ['rotavirus', 'diarrhea vaccine', 'stomach vaccine', 'rota vaccine', 'दस्त का टीका'],
    response: `**Rotavirus Vaccine (Diarrhea Prevention)**

Rotavirus is the #1 cause of severe diarrhea and dehydration in babies under 2 years. It can be life-threatening.

**Schedule:**
• Rotavirus-1: 6 weeks
• Rotavirus-2: 10 weeks
• Rotavirus-3: 14 weeks

**How it's given:** By mouth (oral drops) — not injection
**Common reactions:** Mild stomach upset, fussiness — normal and usually brief.

**After the vaccine:** Your child is protected against the most dangerous strains of diarrhea. However, still practice good hygiene — wash hands before feeding, keep feeding equipment clean.`
  },

  {
    intent: 'vaccine_vitamin_a',
    patterns: ['vitamin a', 'vitamin a dose', 'vitamin supplement', 'विटामिन ए'],
    response: `**Vitamin A Supplementation**

Vitamin A is not a vaccine but a vital supplement given with vaccinations. It prevents:
• Night blindness and vision problems
• Severe infections and immune weakness
• It reduces child mortality by 23%!

**Schedule:**
• 1st dose: 9 months (6 months for low-birth-weight babies)
• 2nd dose: 16-18 months
• 3rd dose: 24 months
• Then every 6 months until 5 years

**How given:** By mouth — a few drops of orange liquid
**Source:** Also give your child Vitamin A-rich foods: carrots, sweet potato, pumpkin, spinach, egg yolk, liver, papaya, mango

🍳 Tip: Cooking orange/yellow vegetables in a little oil helps the body absorb Vitamin A better.`
  },

  // ══════════════════════ GROWTH & NUTRITION ══════════════════════
  {
    intent: 'normal_weight_height',
    patterns: ['normal weight', 'average weight', 'baby weight', 'normal height', 'average height', 'is my baby normal', 'weight chart', 'height chart', 'सामान्य वजन'],
    response: `**Normal Weight and Height Guide (WHO Standards)**

| Age | Boys Weight | Girls Weight | Boys Height | Girls Height |
|-----|------------|-------------|------------|-------------|
| Birth | 3.3 kg | 3.2 kg | 49.9 cm | 49.1 cm |
| 3 months | 6.4 kg | 5.8 kg | 61.4 cm | 59.8 cm |
| 6 months | 7.9 kg | 7.3 kg | 67.6 cm | 65.7 cm |
| 9 months | 8.9 kg | 8.2 kg | 72.0 cm | 70.1 cm |
| 12 months | 9.6 kg | 8.9 kg | 75.7 cm | 74.0 cm |
| 18 months | 10.9 kg | 10.2 kg | 82.3 cm | 80.7 cm |
| 24 months | 12.2 kg | 11.5 kg | 87.8 cm | 86.4 cm |

**Remember:** These are averages. A child 10-15% above or below these values can still be healthy. Your ASHA worker will calculate your child's z-score for a more accurate assessment.

⚠️ Concern signs: Child not gaining weight for 2+ months, or visible ribs/bones, or swollen feet — see a doctor.`
  },

  {
    intent: 'zscore_explained',
    patterns: ['z score', 'zscore', 'z-score', 'waz', 'haz', 'whz', 'what is zscore', 'weight for age', 'height for age', 'z स्कोर'],
    response: `**What is a Z-Score? (Explained Simply)**

A Z-Score tells us how your child's measurements compare to healthy children of the same age and gender.

**Three types:**
• **WAZ (Weight-for-Age):** Is your child's weight appropriate for their age?
• **HAZ (Height-for-Age):** Is your child's height appropriate for their age? (Stunting)
• **WHZ (Weight-for-Height):** Is the weight proportionate to height? (Wasting/Acute malnutrition)

**What the numbers mean:**
• **Z-score 0:** Exactly average — perfectly normal
• **Z-score -1 to 0:** Slightly below average — still healthy
• **Z-score -2 to -1:** At risk — needs monitoring and better nutrition
• **Z-score below -2:** Malnutrition — needs medical attention
• **Z-score below -3:** Severe malnutrition — needs urgent hospital care

**In simple words:** Think of it like a school grade. A score near 0 means your child is right on track. Below -2 means your child needs extra nutrition care. Below -3 is serious — see a doctor immediately.`
  },

  {
    intent: 'malnutrition_explained',
    patterns: ['malnutrition', 'undernutrition', 'malnourished', 'stunting', 'wasting', 'underweight', 'कुपोषण', 'what is malnutrition'],
    response: `**Understanding Malnutrition in Children**

Malnutrition means a child is not getting enough nutrients to grow and stay healthy.

**Three main types:**

🔴 **Underweight** (low WAZ): Child weighs less than expected for their age
🔴 **Stunting** (low HAZ): Child is shorter than expected — from long-term poor nutrition
🔴 **Wasting** (low WHZ): Child is too thin for their height — acute/recent malnutrition

**Warning signs to watch for:**
• Child looks very thin or skin hangs loosely
• Ribs are visible
• Arms and legs look very thin (check: mid-upper arm too thin)
• Face looks old/wrinkled
• Swollen feet or face (in severe cases — URGENT!)
• Very pale inner eyelids
• Child is weak, not active, not interested in food

**What causes it:** Not enough food, poor diet quality, repeated illness, poor breastfeeding start, unclean water/sanitation.

**Treatment:** Extra feeding, therapeutic foods (RUTF), treating infections. Severe cases need hospital/NRC admission.

🏥 **Visit your nearest PHC or contact your ASHA worker immediately if you notice these signs.**`
  },

  // ══════════════════════ BREASTFEEDING ══════════════════════
  {
    intent: 'breastfeeding',
    patterns: ['breastfeeding', 'breast milk', 'breast feed', 'how often feed', 'newborn feeding', 'colostrum', 'mother milk', 'स्तनपान', 'दूध पिलाना'],
    response: `**Breastfeeding Guide**

**The Golden Rules:**
🥛 **Start within 1 hour of birth** — the first yellowish milk (colostrum) is packed with antibodies. Never throw it away!
🥛 **Breastfeed ONLY for the first 6 months** — no water, no other milk, no food
🥛 **Continue breastfeeding until 2 years** — alongside solid foods after 6 months

**How often to feed:**
• Newborns: Every 2-3 hours (8-12 times a day, including at night)
• 1-3 months: Every 2-4 hours
• 3-6 months: Every 3-4 hours
• After 6 months: Continue with meals

**How to know baby is getting enough:**
✅ Baby gains weight well
✅ Wets 6+ cloth diapers (or 3+ disposables) per day
✅ Baby seems satisfied after feeding
✅ Pees at least 6 times a day

**Tips for good breastfeeding:**
• Ensure baby opens mouth wide and takes in the areola (dark area), not just the nipple
• Feed on demand — never restrict
• Eat well yourself, drink plenty of water
• Don't give bottles or pacifiers in early weeks

⚠️ Seek help if: Nipple pain, baby not gaining weight, less wet diapers, or you feel unsure — talk to your ASHA worker!`
  },

  {
    intent: 'complementary_feeding',
    patterns: ['solid food', 'first food', 'weaning', 'complementary feeding', 'when to start food', '6 months food', 'baby food', 'ठोस आहार'],
    response: `**Starting Solid Foods at 6 Months**

**Why 6 months?** Before 6 months, baby's gut and kidneys are not ready for solid foods. Breast milk alone is perfect.

**Starting solids — Step by Step:**

**6 months:**
• Start with soft, mashed single foods
• Rice porridge (khichdi), dal water, mashed banana, cooked and mashed vegetables
• 2-3 small meals per day + continue breastfeeding
• Start with 2-3 spoons, gradually increase

**7-8 months:**
• Mashed khichdi with dal + vegetables
• Mashed cooked egg yolk
• Soft fruits (mashed banana, papaya, chikoo)
• 2-3 meals + 1-2 healthy snacks

**9-11 months:**
• Family foods, finely chopped
• Dal, rice, roti, sabzi, egg, curd
• 3 meals + 2 snacks daily

**12+ months:**
• Almost all family foods (avoid very spicy, salty, processed)
• 3 meals + 2-3 snacks

**Always add a teaspoon of oil or ghee to meals** — helps absorb nutrients and gives extra energy.

⚠️ Avoid: Honey before 1 year (risk of botulism), whole nuts (choking), too much salt or sugar.`
  },

  // ══════════════════════ COMMON ILLNESSES ══════════════════════
  {
    intent: 'fever_management',
    patterns: ['fever', 'temperature', 'baby fever', 'high temperature', 'paracetamol', 'bhar', 'बुखार'],
    response: `**Managing Fever in Children**

**Normal temperature:** 36.5°C – 37.5°C (97.7°F – 99.5°F)
**Fever:** Above 38°C (100.4°F)

**Home care for mild fever (38-39°C):**
• Remove extra clothing and blankets
• Give paracetamol (acetaminophen): 10-15 mg per kg of weight, every 4-6 hours
• Give extra fluids (breastmilk, ORS, water, soups)
• Wipe with lukewarm (not cold) wet cloth on forehead, armpits, groin
• Keep the room cool and airy

**Do NOT:**
❌ Don't use aspirin in children (risk of Reye's syndrome)
❌ Don't use ice or cold water sponging
❌ Don't give blankets to "sweat it out"

**When to go to hospital IMMEDIATELY:**
🚨 Fever in a baby under 2 months (any fever is serious)
🚨 Temperature above 40°C (104°F)
🚨 Fever with neck stiffness, severe headache, rash, or sensitivity to light
🚨 Fever with convulsions (fits/seizures)
🚨 Child is not responding, very weak, or unconscious
🚨 Fever lasting more than 3 days with no improvement`
  },

  {
    intent: 'diarrhea_management',
    patterns: ['diarrhea', 'loose motions', 'loose stool', 'stomach upset', 'ors', 'dehydration', 'दस्त', 'पेचिश', 'loose motion'],
    response: `**Managing Diarrhea (Loose Motions)**

Diarrhea is dangerous because it causes dehydration — the biggest risk for young children.

**Immediate treatment — ORS (Oral Rehydration Solution):**
• ORS is the most important treatment. It saves lives!
• Available free at ASHA worker, Anganwadi, or government health centres
• **Homemade ORS:** Mix 1 liter clean water + 6 teaspoons sugar + ½ teaspoon salt. Stir well.
• Give small sips frequently (a few ml every 2-3 minutes)
• Continue breastfeeding — do NOT stop

**How much ORS to give:**
• Baby under 2 years: 50-100 ml after each loose stool
• Children 2-10 years: 100-200 ml after each loose stool

**Signs of dehydration (go to hospital):**
🚨 Dry mouth, no tears when crying
🚨 Sunken eyes or sunken soft spot on baby's head
🚨 Not passing urine for 6+ hours
🚨 Child is very weak, lethargic, or unconscious
🚨 Blood in stool
🚨 Vomiting everything they drink

**Food during diarrhea:** Continue feeding — don't stop food. Give soft, easily digestible foods. Zinc syrup (as prescribed) reduces diarrhea duration.

⚠️ Do NOT give: Imodium/loperamide to children — dangerous for young children.`
  },

  {
    intent: 'pneumonia_ari',
    patterns: ['pneumonia', 'cough', 'breathing problem', 'cold', 'chest infection', 'ari', 'respiratory', 'fast breathing', 'निमोनिया', 'खांसी', 'सांस लेने में तकलीफ'],
    response: `**Recognizing Pneumonia (Chest Infection)**

Pneumonia is one of the top killers of children under 5. It can be treated if caught early.

**Warning signs of pneumonia:**
• **Fast breathing** — more than 60 breaths/min in babies under 2 months; more than 50/min in 2-12 months; more than 40/min in 1-5 years
• **Chest in-drawing** — you can see the lower chest pulling in with each breath (very serious sign)
• Wheezing or noisy breathing
• Nasal flaring (nostrils widening when breathing)
• Cough with yellow/green phlegm or blood
• Fever with fast breathing

**Home care for mild cough/cold:**
• Saline nose drops for blocked nose
• Continue breastfeeding and fluids
• Clear the nose gently with cotton wick
• No antibiotics without doctor prescription

**Go to hospital immediately if:**
🚨 Baby breathing very fast (see rates above)
🚨 Chest pulling in with each breath
🚨 Baby turns blue (especially around lips)
🚨 Child is unable to drink/feed
🚨 High fever with breathing problems`
  },

  // ══════════════════════ EMERGENCY SIGNS ══════════════════════
  {
    intent: 'emergency_signs',
    patterns: ['emergency', 'danger signs', 'warning signs', 'when to hospital', 'serious condition', 'urgent care', 'emergency baby', 'आपातकाल', 'खतरे के संकेत'],
    response: `🚨 **EMERGENCY WARNING SIGNS — Go to Hospital IMMEDIATELY**

**In ANY baby under 2 months, go to hospital for:**
• Any fever (even slight)
• Not feeding well or refusing feeds
• Convulsions (fits)
• Fast or difficult breathing
• Very slow breathing or stopped breathing
• Movement only when stimulated (lethargic)
• Skin very pale or yellow (jaundice spreading to limbs)

**In ALL children, go to hospital IMMEDIATELY for:**
• Convulsions/fits (any seizure)
• Unconscious or cannot be woken
• Stiff neck with fever
• Breathing difficulty, fast breathing, or chest in-drawing
• Severe dehydration (sunken eyes, dry mouth, no urine for 6+ hours)
• Swollen feet (severe malnutrition sign)
• High fever above 40°C
• Severe malnutrition — very thin, visible ribs, arm too thin
• Blood in urine, stool, or vomit
• Accidental poisoning
• Burns, severe injury, or road accident

📞 **Call 108 (Ambulance — FREE)** for any emergency
📞 **National Health Helpline: 1800-180-1104** (free, Mon-Sat 9am-6pm)`
  },

  // ══════════════════════ GOVERNMENT SCHEMES ══════════════════════
  {
    intent: 'scheme_icds',
    patterns: ['icds', 'anganwadi', 'integrated child development', 'anganwadi center', 'आंगनवाड़ी', 'poshan'],
    response: `**ICDS — Integrated Child Development Services (Anganwadi)**

**What is it?** India's flagship program for children 0-6 years and pregnant/breastfeeding mothers.

**Benefits — ALL FREE:**
✅ Supplementary nutrition (extra food/meals at Anganwadi centre)
✅ Growth monitoring every month (weight, height)
✅ Immunization (vaccines)
✅ Health check-ups
✅ Pre-school education for children 3-6 years
✅ Nutrition education for mothers
✅ Iron-folic acid tablets for women

**Who can get it?**
• All children 0-6 years
• Pregnant women
• Breastfeeding mothers
• Adolescent girls (11-14 years, out of school)

**How to access:**
• Visit your local Anganwadi Centre (every village and urban ward has one)
• Register with the Anganwadi worker
• Attend monthly weighing and health check sessions

🌟 **POSHAN Abhiyaan** is the newer initiative to make ICDS stronger and end malnutrition by 2024.`
  },

  {
    intent: 'scheme_pmmvy',
    patterns: ['pmmvy', 'maternity benefit', 'maternity allowance', '5000 maternity', 'pradhan mantri matru', 'maternity cash', 'मातृ वंदना'],
    response: `**PMMVY — Pradhan Mantri Matru Vandana Yojana**

**What is it?** Cash benefit for pregnant and breastfeeding mothers to compensate for wage loss.

**Amount:** ₹5,000 total in 3 installments

**Installment 1 — ₹1,000:**
• Register within the 1st trimester (first 3 months of pregnancy)
• Register at Anganwadi/ASHA/health centre

**Installment 2 — ₹2,000:**
• After 6 months of pregnancy
• After receiving at least 1 antenatal check-up

**Installment 3 — ₹2,000:**
• After child is born
• After child receives OPV + BCG vaccine (first immunization)

**Who qualifies:**
• All pregnant women (for first live birth, 19+ years)
• Women in government jobs do NOT qualify (covered by other schemes)

**How to apply:** Visit Anganwadi Centre or health centre with:
• Aadhar card
• Bank passbook (account must be in mother's name)
• MCP card (Mother-Child Protection card)

💡 Also get ₹1,000 extra from JSY if you deliver at government hospital.`
  },

  {
    intent: 'scheme_jsy',
    patterns: ['jsy', 'janani suraksha', 'delivery benefit', 'hospital delivery cash', 'institutional delivery', 'जननी सुरक्षा'],
    response: `**JSY — Janani Suraksha Yojana**

**What is it?** Cash incentive to encourage mothers to deliver in hospitals (not at home), reducing maternal and infant death.

**Amount:**
• **Rural areas:** ₹1,400 per delivery
• **Urban areas:** ₹1,000 per delivery
• **ASHA worker also gets:** ₹300-600 for facilitating

**Who qualifies:**
• All pregnant women delivering in government hospitals/accredited private hospitals
• Below poverty line (BPL) families
• SC/ST women (all qualify regardless of BPL status)
• Women above 19 years of age

**How to get it:**
1. Register at nearest PHC/CHC/government hospital
2. Get antenatal check-ups done (minimum 3 recommended)
3. Deliver in the registered facility
4. Cash is deposited directly to bank account

**Benefits of hospital delivery:**
• Safer delivery for mother and baby
• Free delivery services at government hospitals
• Emergency caesarean section available if needed
• Free newborn care and vaccinations`
  },

  {
    intent: 'scheme_jssk',
    patterns: ['jssk', 'janani shishu', 'free delivery', 'free antenatal', 'free treatment baby', 'जननी शिशु'],
    response: `**JSSK — Janani Shishu Suraksha Karyakram**

**What is it?** FREE treatment for pregnant women and sick newborns at government hospitals.

**Pregnant Women Get FREE:**
✅ Delivery (normal and caesarean)
✅ All medicines and consumables
✅ Diagnostic tests (blood, urine, ultrasound)
✅ Diet during hospital stay
✅ Blood transfusion if needed
✅ Free transport to hospital and back home
✅ Treatment for complications during pregnancy

**Sick Newborn (0-30 days) Gets FREE:**
✅ All treatment, medicines, tests
✅ Free diet for mother if baby admitted
✅ Free transport

**Where available:** All government district hospitals, CHCs, PHCs.

⚠️ This is your RIGHT. If any government facility charges you for delivery services, you can complain to the District CMO.`
  },

  {
    intent: 'scheme_pmjay',
    patterns: ['pmjay', 'ayushman bharat', 'health insurance', 'free treatment', '5 lakh insurance', 'hospital insurance', 'आयुष्मान भारत'],
    response: `**Ayushman Bharat — PMJAY (Health Insurance for All)**

**What is it?** World's largest health insurance scheme — ₹5 lakh per family per year for hospitalization.

**Coverage:**
✅ Up to ₹5,00,000 (5 lakh) per family per year
✅ Over 1,500+ medical procedures covered
✅ Pre and post hospitalization expenses
✅ All pre-existing diseases covered from day 1
✅ Available at 25,000+ empaneled hospitals (government + private)
✅ Cashless treatment — no advance payment

**Who qualifies:**
• Families listed in SECC 2011 database (Socio-Economic Caste Census)
• Around 10 crore+ vulnerable families (50 crore people) across India

**How to check if you qualify:**
• Visit the nearest Ayushman Bharat Arogya Mitra at government hospital
• Call helpline: 14555 or 1800-111-565 (free)
• Website: pmjay.gov.in

**Golden Card:** Get your Ayushman Bharat Golden Card from the nearest Common Service Centre (CSC) or government hospital. Carry it for all hospital visits.`
  },

  {
    intent: 'scheme_rbsk',
    patterns: ['rbsk', 'rashtriya bal swasthya', 'child health screening', 'birth defect screening', 'free child check', 'राष्ट्रीय बाल स्वास्थ्य'],
    response: `**RBSK — Rashtriya Bal Swasthya Karyakram**

**What is it?** FREE health screening for children 0-18 years for 30 health conditions.

**Who does the screening:** Mobile Health Teams visit Anganwadi centres and schools regularly.

**4 D's that are screened:**
• **Defects at Birth:** Heart defects, cleft lip/palate, club foot, etc.
• **Deficiencies:** Anemia, Vitamin D deficiency, Vitamin A deficiency
• **Diseases:** Childhood diseases, dental problems, vision problems, hearing problems
• **Developmental Delays:** Autism, ADHD, learning disabilities, speech delay

**Where children are screened:**
• All Anganwadi Centres (children 0-6 years)
• All government schools (Class 1-12)

**What happens after screening:**
• Children needing treatment are referred to District Early Intervention Centre (DEIC) or hospitals
• All treatment is FREE, including surgery

**Who to contact:** Your Anganwadi worker, ASHA worker, or nearest PHC to know the screening schedule.`
  },

  // ══════════════════════ GROWTH & DEVELOPMENT MILESTONES ══════════════════════
  {
    intent: 'developmental_milestones',
    patterns: ['milestones', 'development', 'when baby walk', 'when baby talk', 'baby sitting', 'baby crawl', 'baby smile', 'developmental delay', 'विकास के पड़ाव'],
    response: `**Child Development Milestones**

**1-3 months:**
• Smiles at you ✓
• Follows moving objects with eyes ✓
• Recognizes mother's voice ✓
• Makes cooing sounds ✓

**4-6 months:**
• Holds head up steadily ✓
• Reaches for objects ✓
• Laughs out loud ✓
• Rolls from tummy to back ✓

**7-9 months:**
• Sits with support, then without support ✓
• Starts to crawl or bottom-shuffle ✓
• Says "mama", "dada" (not specifically) ✓
• Picks up small objects ✓

**10-12 months:**
• Pulls to stand, walks with support ✓
• Waves bye-bye ✓
• Says first meaningful words ✓
• Points at objects ✓

**12-18 months:**
• Walks independently ✓
• Uses 5-10 words ✓
• Feeds self with spoon (messy) ✓

**2 years:**
• Runs, climbs ✓
• 50+ words, 2-word sentences ✓

⚠️ **Consult a doctor if:**
• Not smiling by 3 months
• Not sitting by 9 months
• Not walking by 18 months
• Not saying words by 12 months
• Not using 2-word phrases by 2 years
• Loss of any previously learned skill`
  },

  // ══════════════════════ ASHA WORKER ══════════════════════
  {
    intent: 'asha_worker',
    patterns: ['asha worker', 'asha', 'accredited social health', 'what does asha do', 'asha ki bhumika', 'आशा वर्कर'],
    response: `**ASHA Worker — Your Community Health Friend**

**ASHA** stands for Accredited Social Health Activist. Every village has an ASHA worker who is a trained woman from the community.

**What your ASHA worker can help you with:**
✅ Inform you about health schemes and help you enroll
✅ Accompany you to health facilities for delivery
✅ Track your child's vaccination and ensure no doses are missed
✅ Monitor your child's growth and nutrition
✅ Provide ORS and basic medicines for fever, diarrhea
✅ Counsel on breastfeeding, nutrition, family planning
✅ Make arrangements for ambulance during emergencies
✅ Conduct regular home visits for pregnant women and newborns

**When to contact your ASHA worker:**
• When you are pregnant (register early)
• For vaccination reminders
• When your child is sick
• To access government schemes
• For any health question or concern

**In this app:** You can view your assigned ASHA worker in the Child Profile section. If not assigned, contact your nearest PHC or Anganwadi.

📞 **National ASHA Helpline: 1800-180-1104** (Free, Mon-Sat 9am-6pm)`
  },

  // ══════════════════════ SPECIFIC HEALTH TOPICS ══════════════════════
  {
    intent: 'jaundice',
    patterns: ['jaundice', 'yellow skin', 'yellow eyes', 'newborn yellow', 'neonatal jaundice', 'पीलिया'],
    response: `**Newborn Jaundice (Yellowing of Skin)**

**What is it?** A yellowish color of the skin and whites of eyes in newborns. Caused by bilirubin buildup.

**Is it normal?** Mild jaundice in the first 2-5 days after birth is very common and usually harmless (physiological jaundice).

**Normal signs:**
• Yellow tint only on face and upper body
• Appears on day 2-3, peaks day 3-5, goes away by day 7-10
• Baby is feeding well and active

**WARNING — Go to hospital IMMEDIATELY if:**
🚨 Jaundice appears within 24 hours of birth
🚨 Yellow color spreads to arms, legs, hands, feet (severe)
🚨 Baby is not feeding, very sleepy, or cannot be woken easily
🚨 Jaundice lasting more than 2 weeks (or 3 weeks if premature)
🚨 Dark brown/tea-colored urine
🚨 Pale or white/clay-colored stools

**Treatment:** Phototherapy (blue light therapy) at hospital for significant jaundice. Frequent breastfeeding helps clear bilirubin.

**Home care for mild jaundice:** Morning sunlight (5-10 minutes on baby's skin in the first few days) can help slightly, but is not a substitute for hospital phototherapy.`
  },

  {
    intent: 'anemia',
    patterns: ['anemia', 'anaemia', 'low hemoglobin', 'pale child', 'iron deficiency', 'weak blood', 'खून की कमी', 'एनीमिया'],
    response: `**Anemia in Children (Low Blood Count)**

Anemia means the blood doesn't have enough hemoglobin (the protein that carries oxygen). Iron deficiency is the most common cause.

**Signs of anemia:**
• Pale inner eyelids (pull down lower eyelid — should be red/pink)
• Pale lips, nails, palms
• Child tires easily, less active
• Poor appetite
• Frequent infections
• Delayed development

**Prevention:**
• **Breastfeed exclusively** for 6 months (breast milk iron is well-absorbed)
• **Complement with iron-rich foods** after 6 months: liver, dal, spinach, eggs, fortified cereals, meat
• **Pair with Vitamin C** (lemon, tomato, guava) — helps absorb iron from plant foods
• **Avoid tea/coffee** with meals (reduces iron absorption)
• **Deworm** every 6 months after 1 year (worms cause anemia)
• **Iron Syrup:** Given by ASHA worker every week for children 6 months-5 years (government program)

**Treatment:** Iron syrup or drops as prescribed. Continue for at least 3 months even if child feels better.

⚠️ Severe anemia requires hospital treatment and blood tests.`
  },

  {
    intent: 'vitamin_d',
    patterns: ['vitamin d', 'rickets', 'bone weak', 'bone problem', 'calcium', 'विटामिन डी', 'सूखा रोग'],
    response: `**Vitamin D and Rickets in Children**

Vitamin D helps the body absorb calcium and is essential for strong bones. Deficiency causes Rickets — soft, weak, curved bones.

**Signs of Vitamin D deficiency:**
• Delayed teething
• Soft spot on head (fontanelle) closes late
• Bowing of legs (bow-legs)
• Swollen wrists and ankles
• Delayed walking
• Poor growth

**Prevention:**
• **Sunlight:** 15-20 minutes of sun exposure on baby's skin in morning (arms, legs visible) — most natural source
• **Breast milk is low in Vitamin D** — babies need sunlight or supplements
• **Vitamin D drops:** Recommended for exclusively breastfed babies — 400 IU per day from birth to 1 year (ask your doctor)
• **Foods:** Fatty fish (salmon, sardines), egg yolk, fortified milk

**Treatment:** Vitamin D supplements as prescribed — doses and duration depend on severity.

⚠️ Severe rickets needs X-ray and specialist care. Early treatment gives complete recovery.`
  },

  // ══════════════════════ ABOUT SISHU AROGAYA ══════════════════════
  {
    intent: 'about_app',
    patterns: ['about', 'what is this app', 'sishu arogaya', 'about the system', 'what is sishu', 'app features', 'इस ऐप के बारे में'],
    response: `**About Sishu Arogaya**

Sishu Arogaya is a Government Integrated Child Health Monitoring System developed at Dev Bhoomi Uttarakhand University (DBUU), Dehradun.

**What it does:**
📊 Tracks child growth using WHO z-score standards
💉 Manages vaccination schedules (38 vaccines per IAP 2020-2021)
🤖 AI-powered malnutrition prediction
🥗 Personalized diet plans based on child's health status
🏛️ Information on all government health schemes
📋 Generates health reports (PDF)
👩‍⚕️ Connects parents with their assigned ASHA worker

**Who uses it:**
• **Parents** — monitor their child's health from home
• **ASHA Workers** — track all assigned children, log visits and growth records
• **Admins** — district-level analytics and oversight

**Data privacy:** All health data is stored securely. Your child's information is only visible to you and your assigned ASHA worker.

📞 For help: 1800-180-1104`
  },

  // ══════════════════════ DEFAULT / UNKNOWN ══════════════════════
  {
    intent: 'unknown',
    patterns: [],
    response: `I'm not sure about that specific question. But I can help you with:

• **Vaccines** — "Tell me about BCG vaccine" or "vaccination schedule"
• **Growth** — "What is normal weight?" or "What is z-score?"
• **Nutrition** — "What to feed 6 month baby?" or "breastfeeding tips"
• **Illnesses** — "My baby has fever" or "diarrhea treatment"
• **Schemes** — "What is ICDS?" or "How to get PMMVY money?"
• **Emergencies** — "Emergency signs" or "When to go to hospital"
• **Development** — "Baby milestones" or "when does baby walk?"

Please try rephrasing your question or choose from the suggestions above.

📞 **For medical advice, always consult your ASHA worker or nearest PHC.**`
  }
];

/**
 * Find the best matching intent for a user query.
 * Returns the response string.
 */
function findAnswer(query) {
  if (!query || typeof query !== 'string') return KNOWLEDGE_BASE.find(k => k.intent === 'unknown').response;

  const q = query.toLowerCase().trim();

  // Score each intent
  let bestScore = 0;
  let bestEntry = null;

  for (const entry of KNOWLEDGE_BASE) {
    if (entry.intent === 'unknown') continue;
    let score = 0;
    for (const pattern of entry.patterns) {
      if (q === pattern) { score += 10; break; } // exact match
      if (q.includes(pattern)) score += 5; // phrase match
      // Word-level match
      const words = pattern.split(' ');
      const qWords = q.split(/\s+/);
      for (const word of words) {
        if (word.length > 2 && qWords.some(w => w.includes(word) || word.includes(w))) {
          score += 1;
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  if (bestScore > 0 && bestEntry) return bestEntry.response;
  return KNOWLEDGE_BASE.find(k => k.intent === 'unknown').response;
}

module.exports = { KNOWLEDGE_BASE, findAnswer };
