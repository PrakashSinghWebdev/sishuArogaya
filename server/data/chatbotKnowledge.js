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
    patterns: ['diarrhea', 'loose motions', 'loose stool', 'stomach upset', 'dehydration', 'दस्त', 'पेचिश', 'loose motion', 'diarrhea in child', 'baby diarrhea', 'child diarrhea', 'diarrhea treatment', 'diarrhoea', 'watery stool', 'how to treat diarrhea', 'baby loose motion'],
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

  // ══════════════════════ NEWBORN CARE ══════════════════════
  {
    intent: 'newborn_care',
    patterns: ['newborn care', 'care of newborn', 'new baby care', 'just born baby', 'neonatal care', 'baby born today', 'care after birth', 'how to take care of newborn', 'naya bachha', 'navjat shishu'],
    response: `**Newborn Baby Care (First 28 Days):**

**Warmth:**
• Keep baby in skin-to-skin contact (Kangaroo Mother Care)
• Room temperature 25–28°C — no fans/AC directly on baby
• Cover head with soft cap

**Feeding:**
• Start breastfeeding within 1 hour of birth
• Breastfeed every 2–3 hours (8–12 times per day)
• Give ONLY breast milk for 6 months — no water, no formula

**Cord Care:**
• Keep cord stump clean and dry
• Do NOT apply oil, turmeric, or ash — causes infection
• Cord falls off naturally in 7–10 days

**Bathing:**
• Delay first bath by 24 hours
• Sponge bath only until cord falls off

**Warning Signs — Go to hospital immediately:**
🚨 Not feeding, very sleepy
🚨 Yellow colour (jaundice) spreading below belly button
🚨 Fast breathing (>60 breaths/min)
🚨 Cold to touch, blue lips or fingernails
🚨 Bulging fontanelle (soft spot on head)

📞 National helpline: 1800-180-1104`
  },

  // ══════════════════════ KANGAROO MOTHER CARE ══════════════════════
  {
    intent: 'kangaroo_mother_care',
    patterns: ['kangaroo mother care', 'kmc', 'skin to skin', 'premature baby care', 'preterm baby', 'low birth weight baby', 'small baby care', 'premie care', 'born early baby'],
    response: `**Kangaroo Mother Care (KMC) — For Small & Premature Babies:**

KMC means keeping your baby on your bare chest (skin-to-skin).

**Benefits:**
• Keeps baby warm — prevents hypothermia
• Promotes breastfeeding
• Faster weight gain
• Reduces infections and deaths in premature babies
• Strengthens mother-baby bond

**How to do KMC:**
• Place baby upright between your breasts
• Baby wears only diaper + cap + socks
• Cover both with a shawl or wrap
• Do for minimum 8 hours/day (can be done by father too)

**When to start:**
• As soon as baby is medically stable
• Can be done even in NICU

**Who needs it most:**
• Birth weight < 2.5 kg (Low Birth Weight)
• Born before 37 weeks (Premature)

✅ KMC is safe, free, and proven to save lives!

📞 Ask your ASHA worker or ANM for a demonstration.`
  },

  // ══════════════════════ WORM TREATMENT ══════════════════════
  {
    intent: 'deworming',
    patterns: ['deworming', 'worm treatment', 'albendazole', 'national deworming day', 'pet ke kirde', 'intestinal worms', 'roundworm', 'hookworm', 'pinworm', 'child worms'],
    response: `**Deworming for Children:**

**National Deworming Day** — February 10 and August 10 every year.

**Who should be dewormed:**
• Children 1–19 years of age

**Medicine:**
• Albendazole 400mg chewable tablet
• Chew tablet (do not swallow whole)
• Given free at Anganwadi, school, PHC

**Age-wise dose:**
• 1–2 years: Half tablet (200mg) — crush and mix with food
• 2–19 years: 1 full tablet (400mg)

**Benefits:**
• Improves nutrition absorption
• Reduces anemia
• Better growth and concentration in school
• Reduces malnutrition

**Side effects** (rare, pass in 1–2 days):
• Mild stomach pain, nausea — this is normal
• Drink water and rest

✅ Safe to give along with vaccines.
✅ Free at all government centres.`
  },

  // ══════════════════════ VACCINE — PCV (PNEUMOCOCCAL) ══════════════════════
  {
    intent: 'vaccine_pcv',
    patterns: ['pcv vaccine', 'pneumococcal vaccine', 'pneumonia vaccine', 'pcv', 'pneumococcal', '10 week vaccine', 'pneumo jab'],
    response: `**PCV — Pneumococcal Conjugate Vaccine:**

**What it prevents:**
Pneumococcal disease — a bacterium that causes:
• Pneumonia (lung infection)
• Meningitis (brain infection)
• Blood poisoning (sepsis)

**Schedule:**
• PCV-1 at 6 weeks
• PCV-2 at 10 weeks
• PCV-3 at 14 weeks

**How given:** Injection in the thigh

**Side effects:**
• Mild redness/swelling at injection site
• Low-grade fever — normal, resolves in 1–2 days
• Give paracetamol if fever high

✅ Free under India's Universal Immunisation Programme (UIP).`
  },

  // ══════════════════════ VACCINE — ROTAVIRUS ══════════════════════
  {
    intent: 'vaccine_rotavirus_detail',
    patterns: ['rotavirus vaccine detail', 'rotavirus dose', 'rota vaccine', 'diarrhea vaccine', 'gastro vaccine', 'loose motion vaccine', 'rotarix', 'rotateq'],
    response: `**Rotavirus Vaccine:**

**What it prevents:**
Rotavirus — the leading cause of severe diarrhea in children under 5. Can cause dehydration and death.

**Schedule (oral drops):**
• Dose 1 at 6 weeks
• Dose 2 at 10 weeks
• Dose 3 at 14 weeks

**How given:** Oral drops (by mouth — not injection)

**Important:**
• Do NOT give if baby is vomiting severely
• Breastfeed normally before and after
• Very safe — protects up to 85% against severe rotavirus diarrhea

**Side effects:**
• Very mild — baby may be slightly fussy
• Rarely: mild loose stools within 7 days

✅ Free under India's UIP.`
  },

  // ══════════════════════ VACCINE — IPV ══════════════════════
  {
    intent: 'vaccine_ipv',
    patterns: ['ipv vaccine', 'inactivated polio vaccine', 'ipv injection', 'ipv dose', 'injectable polio'],
    response: `**IPV — Inactivated Polio Vaccine (Injectable):**

Used alongside OPV drops to give stronger protection against polio.

**Schedule:**
• IPV-1 at 6 weeks
• IPV-2 at 14 weeks

**How given:** Injection in thigh or arm

**Difference from OPV:**
• OPV = oral drops (given at birth, 6w, 10w, 14w, booster doses)
• IPV = injection — boosts immunity further

✅ Together, OPV + IPV give the best protection against all 3 types of polio virus.`
  },

  // ══════════════════════ VACCINE — JE ══════════════════════
  {
    intent: 'vaccine_je',
    patterns: ['je vaccine', 'japanese encephalitis vaccine', 'brain fever vaccine', 'je-1', 'je-2', 'encephalitis vaccine', 'dimagi bukhar vaccine'],
    response: `**JE — Japanese Encephalitis Vaccine:**

**What it prevents:**
Japanese Encephalitis — a viral brain infection spread by mosquito bites. Can cause brain damage and death.

**Schedule:**
• JE-1 at 9 months
• JE-2 at 16–24 months (booster)

**Available in:** Areas where JE is common (UP, Bihar, Assam, Karnataka, etc.)

**How given:** Injection

**Side effects:**
• Mild fever, redness at site — resolves in 1–2 days

✅ Free at government centres in endemic districts.`
  },

  // ══════════════════════ COUGH & COLD ══════════════════════
  {
    intent: 'cough_cold',
    patterns: ['cough', 'cold', 'runny nose', 'nasal congestion', 'blocked nose', 'khansi', 'zukam', 'common cold baby', 'baby cough', 'infant cold'],
    response: `**Cough & Cold in Children:**

**Most colds are caused by viruses — antibiotics do NOT help.**

**Home Treatment:**
• Saline (salt water) nasal drops — 2 drops each nostril, 3 times/day
• Steam inhalation — for older children
• Honey (1 tsp) for cough — **only for children over 1 year**
• Keep head slightly elevated during sleep
• Offer extra fluids (breast milk, warm water, soup)

**Danger Signs — see doctor immediately:**
🚨 Fast breathing or difficulty breathing
🚨 Wheezing (whistling sound from chest)
🚨 Fever > 38.5°C for more than 3 days
🚨 Child refuses all food/drink
🚨 Earache (ear infection)
🚨 Under 2 months with any cough

**Do NOT:**
• Give adult cough syrups to babies
• Give cold medicines to children under 2 years
• Give aspirin (risk of Reye's syndrome)`
  },

  // ══════════════════════ EAR INFECTION ══════════════════════
  {
    intent: 'ear_infection',
    patterns: ['ear infection', 'ear pain', 'ear discharge', 'otitis media', 'kaan dard', 'kaan se pani', 'ear problem baby', 'baby ear', 'child ear ache'],
    response: `**Ear Infection in Children:**

**Signs:**
• Pulling/tugging at ear
• Crying more than usual
• Fever
• Discharge (pus/fluid) from ear
• Difficulty hearing, not responding to sounds

**What to do:**
• Take child to doctor for examination
• Doctor may prescribe antibiotic ear drops or oral antibiotics
• Complete the full course of antibiotics

**Warning signs:**
🚨 Ear discharge (pus) — always see doctor
🚨 Swelling behind the ear
🚨 Child very unwell or stiff neck

**Prevention:**
• Breastfeeding protects against ear infections
• Keep baby away from cigarette smoke
• Vaccinate on time (PCV vaccine helps prevent some ear infections)

📞 If ear is discharging pus, visit PHC immediately.`
  },

  // ══════════════════════ MALARIA ══════════════════════
  {
    intent: 'malaria',
    patterns: ['malaria', 'malaria in child', 'malaria symptoms', 'mosquito fever', 'malaria treatment', 'malaria prevention', 'malaria baby', 'malarial fever'],
    response: `**Malaria in Children:**

**Symptoms:**
• High fever with chills and shivering
• Fever comes and goes in cycles
• Sweating after fever
• Headache, vomiting
• Loss of appetite

**Warning Signs — Emergency:**
🚨 Convulsions (fits)
🚨 Unconscious or very drowsy
🚨 Breathing difficulty
🚨 Yellow eyes/skin (jaundice)
🚨 Not able to eat/drink

**What to do:**
• Test for malaria: RDT (Rapid Diagnostic Test) at PHC — free
• Do NOT give home treatment without testing
• Complete full course of antimalarial medication

**Prevention:**
• Use mosquito nets (ITN — Insecticide-Treated Nets) — available free from government
• Eliminate standing water (breeding ground)
• Use mosquito repellent

📞 Malaria hotline: 1800-11-0101 (free)`
  },

  // ══════════════════════ DENGUE ══════════════════════
  {
    intent: 'dengue',
    patterns: ['dengue', 'dengue fever', 'dengue symptoms', 'platelet count', 'dengue baby', 'dengue child', 'dengue treatment'],
    response: `**Dengue Fever in Children:**

**Symptoms:**
• Sudden high fever (39–40°C)
• Severe headache, pain behind eyes
• Joint and muscle pain ("breakbone fever")
• Skin rash (red spots)
• Nausea, vomiting

**Warning Signs — Go to hospital immediately:**
🚨 Bleeding from gums, nose, or in urine/stool
🚨 Red spots on skin that don't fade when pressed
🚨 Severe stomach pain
🚨 Persistent vomiting
🚨 Very drowsy or restless

**Treatment:**
• No specific medicine — supportive care
• Rest and plenty of fluids (ORS, coconut water, juices)
• Paracetamol for fever — do NOT give Aspirin or Ibuprofen
• Hospital admission if platelet count < 1 lakh

**Prevention:**
• Remove stagnant water (dengue mosquito breeds in clean water)
• Use mosquito nets and repellent
• Wear full-sleeve clothes`
  },

  // ══════════════════════ TYPHOID ══════════════════════
  {
    intent: 'typhoid',
    patterns: ['typhoid', 'typhoid fever', 'enteric fever', 'typhoid vaccine', 'tcv vaccine', 'typhoid child', 'typhoid symptoms'],
    response: `**Typhoid in Children:**

**Symptoms:**
• Gradually increasing fever (gets higher each day)
• Headache, weakness
• Stomach pain, constipation or diarrhea
• Rose spots on skin (pale pink spots)
• Prolonged fever > 1 week

**Treatment:**
• Antibiotics prescribed by doctor (complete full course)
• Light, easily digestible diet
• Plenty of fluids
• Rest

**Typhoid Conjugate Vaccine (TCV):**
• Single dose at 9–12 months
• Highly effective (80% protection)
• Free at government health centres in many states

**Prevention:**
• Clean drinking water (boil or filter)
• Wash hands before eating and after toilet
• Eat freshly cooked food

📞 If high fever > 5 days — always see doctor.`
  },

  // ══════════════════════ SKIN CONDITIONS ══════════════════════
  {
    intent: 'skin_conditions',
    patterns: ['baby skin rash', 'nappy rash', 'diaper rash', 'eczema child', 'skin problem baby', 'heat rash', 'prickly heat', 'ringworm', 'scabies', 'baby skin care'],
    response: `**Common Baby Skin Conditions:**

**Diaper/Nappy Rash:**
• Keep area clean and dry
• Change diapers frequently
• Apply zinc oxide barrier cream
• Let baby go without diaper for short periods

**Heat Rash (Prickly Heat):**
• Small red bumps — common in hot weather
• Keep baby cool, loose cotton clothing
• Talcum powder or calamine lotion

**Eczema:**
• Dry, itchy, red patches
• Moisturise frequently with unscented cream
• Avoid harsh soaps; use baby-safe products
• See doctor if infected (oozing/crusting)

**Scabies:**
• Intense itching especially at night
• Small bumps between fingers, wrists
• Whole family needs treatment (permethrin cream)
• Wash all clothes/bedding in hot water

**Ringworm:**
• Circular itchy patch — despite name, it's a fungal infection
• Antifungal cream from doctor

🚨 See doctor for: widespread rash, fever with rash, bleeding spots on skin.`
  },

  // ══════════════════════ ORAL HEALTH ══════════════════════
  {
    intent: 'oral_health',
    patterns: ['baby teeth', 'teething', 'tooth care child', 'dental care baby', 'brushing teeth child', 'oral hygiene baby', 'first tooth', 'tooth decay child'],
    response: `**Child Oral Health & Teething:**

**Teething Timeline:**
• First tooth: around 6 months
• All 20 milk teeth by age 2.5–3 years

**Teething Symptoms:**
• Drooling, chewing on things, irritability
• Mild gum soreness
• **Teething does NOT cause fever** — if fever, check for other cause

**Teething relief:**
• Cold (not frozen) teething ring
• Gently rub gums with clean finger

**Dental Care:**
• Before teeth: wipe gums with clean damp cloth after feeds
• First tooth appears: use soft baby toothbrush, smear of fluoride toothpaste
• Age 3+: pea-sized fluoride toothpaste, brush twice daily

**Tooth Decay Prevention:**
• Never put baby to sleep with bottle of milk/juice
• Reduce sugar in diet
• First dental visit by age 1

✅ Healthy baby teeth are important for speech, chewing, and spacing for adult teeth.`
  },

  // ══════════════════════ EYE CARE ══════════════════════
  {
    intent: 'eye_care',
    patterns: ['baby eye care', 'eye discharge baby', 'sticky eyes newborn', 'eye infection child', 'conjunctivitis baby', 'squint baby', 'red eye', 'ankh infection'],
    response: `**Baby Eye Care:**

**Sticky Eyes in Newborns (very common):**
• Clean with sterile cotton wool dipped in warm water
• Wipe from inner corner outward
• Use separate cotton for each eye
• Usually clears in a few weeks

**Conjunctivitis (Pink Eye):**
• Red, watery or sticky discharge
• Wipe with clean cotton and boiled (cooled) water
• Doctor may prescribe antibiotic eye drops
• Wash hands frequently to avoid spreading

**Warning signs:**
🚨 Swelling around eye
🚨 Baby unable to open eye
🚨 Cloudiness in pupil (cataract)
🚨 Eyes not looking in same direction (squint)

**Vision Screening:**
• Newborn check at birth (red reflex test)
• RBSK screening at Anganwadi age 0–6
• Tell ASHA worker if you notice squint, crossed eyes, or white pupil

✅ Early detection saves sight — all problems found early can be treated.`
  },

  // ══════════════════════ SLEEP ══════════════════════
  {
    intent: 'baby_sleep',
    patterns: ['baby sleep', 'how much sleep baby', 'sleep hours child', 'baby not sleeping', 'baby crying at night', 'safe sleep baby', 'co sleeping', 'sids prevention', 'sudden infant death'],
    response: `**Baby Sleep Guide:**

**Recommended Sleep Hours:**
• Newborn (0–3 months): 14–17 hours/day
• Infant (4–11 months): 12–15 hours/day
• Toddler (1–2 years): 11–14 hours/day
• Preschool (3–5 years): 10–13 hours/day

**Safe Sleep — Prevent SIDS:**
✅ Always place baby on BACK to sleep
✅ Firm, flat surface — no soft mattress
✅ No pillows, loose bedding, or toys in sleep area
✅ Room temperature comfortable (not too hot)
✅ Breastfeeding protects against SIDS
✅ Smoke-free environment

**Why baby wakes at night:**
• Hunger — feed on demand
• Wet/soiled diaper
• Discomfort or illness
• Needs comfort

**Sleep tips:**
• Establish bedtime routine (bath → feed → sleep)
• Differentiate day and night (bright light during day, dim at night)
• Swaddling helps newborns feel secure

🚨 Always put baby to sleep on back — never on stomach or side.`
  },

  // ══════════════════════ VACCINATION SIDE EFFECTS ══════════════════════
  {
    intent: 'vaccine_side_effects',
    patterns: ['vaccine side effects', 'after vaccination', 'vaccination reaction', 'baby crying after injection', 'swelling after vaccine', 'fever after vaccine', 'vaccine fever treatment', 'post vaccine care'],
    response: `**After Vaccination — What to Expect:**

**Normal reactions (very common):**
• Mild fever (< 38.5°C) — for 1–2 days
• Redness, swelling at injection site
• Baby irritable or crying
• Sleepiness

**What to do:**
• Give paracetamol (by weight) for fever
• Apply cold, clean cloth on injection site
• Breastfeed more — it comforts baby
• Do NOT massage injection site — makes swelling worse

**Paracetamol dose:**
• 10–15 mg per kg body weight
• Every 6 hours as needed
• Ask doctor/ASHA worker for exact dose

**BCG special:**
• A small bump/blister at injection site after 2–4 weeks is NORMAL
• It will ulcerate and heal into a small scar — do not put any cream

**When to see doctor:**
🚨 High fever (>39°C) not coming down with paracetamol
🚨 Continuous crying for > 3 hours
🚨 Fits/seizures
🚨 Difficulty breathing
🚨 Rash over whole body

✅ Mild reactions mean your baby's immune system is responding — that's good!`
  },

  // ══════════════════════ HAND WASHING ══════════════════════
  {
    intent: 'hand_hygiene',
    patterns: ['hand washing', 'hand hygiene', 'handwash', 'how to wash hands', 'hath dhona', 'hygiene baby', 'prevent infection hygiene', 'soap hand washing'],
    response: `**Hand Hygiene — Key to Preventing Disease:**

**When to wash hands (critical times):**
• Before preparing food
• Before feeding baby
• Before breastfeeding
• After using toilet
• After cleaning baby's bottom
• After blowing nose / coughing
• After touching animals

**How to wash hands correctly (20 seconds):**
1. Wet hands with clean running water
2. Apply soap
3. Rub palms, back of hands, between fingers, under nails
4. Rinse thoroughly
5. Dry with clean cloth or air dry

**If no running water:**
• Use ash + water OR alcohol-based hand sanitiser

**Impact of hand washing:**
• Reduces diarrhea by 47%
• Reduces respiratory infections by 23%
• Prevents spread of worms, typhoid, and other infections

✅ Hand washing is the single most effective action to prevent child illness.`
  },

  // ══════════════════════ WATER & SANITATION ══════════════════════
  {
    intent: 'water_sanitation',
    patterns: ['safe drinking water', 'water purification', 'boil water', 'clean water baby', 'water borne disease', 'toilet sanitation', 'open defecation', 'swachh bharat', 'ODF village', 'water source'],
    response: `**Safe Water & Sanitation for Child Health:**

**Safe Drinking Water:**
• Boil water for at least 1 minute (at high altitude: 3 minutes)
• Filter or use chlorine tablets if boiling not possible
• Store in covered, clean container
• Never collect water with dirty hands

**Water-borne diseases prevented:**
• Diarrhea, typhoid, cholera, hepatitis A, worm infections

**Sanitation — Swachh Bharat Mission:**
• Free toilet construction: PM Swachh Bharat Mission
• Contact Gram Panchayat or Block office to apply
• Open defecation is a major cause of child malnutrition

**Oral Rehydration Solution (ORS):**
• For diarrhea caused by unsafe water
• Mix 1 ORS packet in 1 litre boiled and cooled water

**Government Schemes:**
• Jal Jeevan Mission — piped water to every household
• Swachh Bharat Mission — free toilets

📞 Report water contamination: district health officer or Gram Panchayat.`
  },

  // ══════════════════════ POSTPARTUM MOTHER CARE ══════════════════════
  {
    intent: 'postpartum_care',
    patterns: ['mother after delivery', 'postpartum care', 'after childbirth care', 'new mother care', 'postnatal care', 'delivery recovery', 'after birth mother', 'mata ki dekh bhal', 'caesarean recovery'],
    response: `**Mother's Care After Delivery:**

**First 48 hours:**
• Rest in clean, warm environment
• Start breastfeeding within 1 hour of delivery
• Iron and folic acid tablets — continue for 180 days
• Vitamin A capsule (200,000 IU) within 6 weeks of delivery

**Diet:**
• Eat nutritious food: dal, rice, vegetables, eggs, milk, fruits
• Drink plenty of fluids
• Continue taking iron-folic acid tablets

**Warning Signs — go to hospital:**
🚨 Heavy bleeding (soaking > 2 pads/hour)
🚨 Foul-smelling vaginal discharge
🚨 High fever (>38°C)
🚨 Severe headache or blurred vision
🚨 Leg pain/swelling (may be blood clot)
🚨 Feeling sad all the time (postpartum depression)

**Postnatal checkups:**
• Day 3, Day 7, Day 42 — visit ANM/ASHA or PHC

**Caesarean recovery:**
• Keep wound clean and dry
• Report redness, discharge, or wound opening to doctor

📞 JSY benefit: institutional delivery + ₹1400 (rural) / ₹1000 (urban) cash.`
  },

  // ══════════════════════ ANTENATAL CARE ══════════════════════
  {
    intent: 'antenatal_care',
    patterns: ['antenatal care', 'pregnancy care', 'pregnant woman care', 'anc visits', 'checkup during pregnancy', 'pregnant diet', 'prenatal care', 'garbhavastha', 'pregnancy checkup'],
    response: `**Antenatal Care (ANC) — Care During Pregnancy:**

**Recommended ANC Visits:**
• 1st visit: within 12 weeks of pregnancy (first trimester)
• 2nd visit: 14–26 weeks
• 3rd visit: 28–34 weeks
• 4th visit: 36+ weeks

**Free services at PHC/Sub-centre:**
✅ Weight and blood pressure check
✅ Blood tests (hemoglobin, blood group, blood sugar, HIV)
✅ Urine tests
✅ Ultrasound (at least 1 during pregnancy)
✅ TT injection (Tetanus Toxoid) — 2 doses or booster
✅ Iron-Folic Acid tablets (180 tablets, start from 1st trimester)
✅ Calcium tablets

**Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA):**
• Free comprehensive ANC on 9th of every month at PHC
• Doctor examination + all tests

**Danger signs during pregnancy:**
🚨 Bleeding from vagina
🚨 Severe headache or blurred vision
🚨 Swelling of face/hands
🚨 No baby movement after 28 weeks
🚨 Fever

📞 Call ASHA or 108 for any danger sign.`
  },

  // ══════════════════════ FAMILY PLANNING ══════════════════════
  {
    intent: 'family_planning',
    patterns: ['family planning', 'contraception', 'birth control', 'spacing children', 'avoid pregnancy', 'parivar niyojan', 'nsbari', 'iud', 'copper t', 'condom', 'sterilization', 'tubectomy', 'vasectomy'],
    response: `**Family Planning Services:**

**Free Government Services (Mission Parivar Vikas):**

**Spacing Methods:**
• Condoms — available free at PHC, Anganwadi, ASHA
• Oral Contraceptive Pills (OCP) — free at sub-centre
• Depo Provera (injection, 3-monthly) — at PHC
• Copper-T / IUD — inserted at PHC, effective 5–10 years

**Permanent Methods:**
• Tubectomy (female sterilisation) — free, with compensation ₹2000
• Vasectomy (male sterilisation) — free, with compensation ₹3000

**After baby:**
• Breastfeeding provides some protection (LAM method)
• For reliable contraception: start Copper-T or pills after 6 weeks

**Basket of Choices — available free:**
• Condoms, OCPs, EC pills (emergency), IUD, injectable, sterilisation

✅ All services confidential and free at government facilities.
📞 Contact ASHA worker or ANM for counselling and referral.`
  },

  // ══════════════════════ TUBERCULOSIS IN CHILDREN ══════════════════════
  {
    intent: 'tuberculosis_child',
    patterns: ['tuberculosis child', 'tb in children', 'tb symptoms child', 'tb treatment child', 'bcg and tb', 'child tb', 'tb baby', 'kshay rog', 'nikshay', 'tb test child'],
    response: `**Tuberculosis (TB) in Children:**

**Symptoms:**
• Cough lasting > 2 weeks
• Fever especially in evenings
• Night sweats
• Weight loss / poor weight gain
• Loss of appetite
• Swollen lymph nodes in neck

**Diagnosis:**
• Mantoux test (TST) or IGRA blood test
• Chest X-ray
• Sputum or gastric lavage (for babies)
• All free at government TB centres

**Treatment:**
• 6 months of antibiotics (DOTS — Directly Observed Therapy)
• 100% free under Nikshay programme
• Do NOT stop treatment even if child feels better

**BCG protection:**
• BCG vaccine at birth protects against severe forms (miliary TB, TB meningitis)
• Does not fully prevent TB — screening still important

**Nikshay Poshan Yojana:**
• ₹500/month nutritional support during TB treatment
• Register at government TB centre

📞 TB helpline: 1800-11-6666 (free)`
  },

  // ══════════════════════ WEIGHT GAIN ISSUES ══════════════════════
  {
    intent: 'poor_weight_gain',
    patterns: ['baby not gaining weight', 'poor weight gain', 'underweight baby', 'child not growing', 'weight not increasing', 'thin baby', 'baby weight low', 'faltering growth', 'bache ka wajan nahi badh raha'],
    response: `**Poor Weight Gain / Faltering Growth in Babies:**

**Common Causes:**
• Not enough breast milk
• Incorrect breastfeeding technique
• Introducing solids too early or too late
• Frequent illness (diarrhea, infections)
• Underlying medical condition

**What to do:**

For babies under 6 months:
• Feed on demand — 8–12 times per day
• Ensure deep latch (not just nipple)
• Feed from both breasts each time
• See lactation counsellor if problem with supply

For babies 6 months+:
• Continue breastfeeding + 3 meals/day + 2 snacks
• Energy-dense foods: khichdi with ghee, banana, egg
• Add oil/ghee to every meal
• Treat any illness promptly

**Medical check:**
• Weigh every month at Anganwadi
• Plot on growth chart
• If dropping 2 or more channels — refer to doctor

**NRC (Nutrition Rehabilitation Centre):**
• For severe acute malnutrition (SAM) with complications
• Free inpatient care + therapeutic food

📞 Talk to your ASHA worker or AWW immediately if you are worried about weight.`
  },

  // ══════════════════════ READY-TO-USE THERAPEUTIC FOOD (RUTF) ══════════════════════
  {
    intent: 'rutf_treatment',
    patterns: ['rutf', 'ready to use therapeutic food', 'plumpy nut', 'therapeutic food', 'sam treatment food', 'severe malnutrition treatment', 'nutrimix', 'protein energy malnutrition treatment'],
    response: `**RUTF — Ready-to-Use Therapeutic Food:**

**What is RUTF?**
A peanut-based, energy-dense food used to treat Severe Acute Malnutrition (SAM).

**Brand names:** Plumpy'Nut, Nutrimix

**Why RUTF is special:**
• Does not need cooking
• Long shelf life
• Does not need water — safe even in areas with poor sanitation
• High in calories, protein, vitamins, minerals

**How given:**
• Given at home alongside breastfeeding
• 3 packets/day for a child 6–59 months (by weight)
• Child comes for check-up every 1–2 weeks

**Where to get:**
• NRC (Nutrition Rehabilitation Centre) — free
• CMAM (Community-based Management of Acute Malnutrition) programme
• Contact ASHA worker or AWW

**Duration:** Usually 8–12 weeks

✅ With RUTF, 80–90% of SAM children recover completely.

📞 Ask your ASHA worker to refer your child to the NRC if severely malnourished.`
  },

  // ══════════════════════ ORS (ORAL REHYDRATION SALT) ══════════════════════
  {
    intent: 'ors_preparation',
    patterns: ['ors', 'oral rehydration', 'ors preparation', 'how to make ors', 'ors solution', 'dehydration treatment', 'rehydration salts', 'jeevan jal', 'diarrhea fluid'],
    response: `**ORS — Oral Rehydration Solution:**

**When to use:**
• Whenever a child has diarrhea — start ORS immediately
• Also helpful for vomiting, fever, heat exhaustion

**Packaged ORS:**
• Available free at PHC, Sub-centre, Anganwadi
• Mix 1 sachet in 1 litre of boiled and cooled water
• Give small sips frequently

**Homemade ORS (if no packet available):**
• 1 litre boiled cooled water
• 6 level teaspoons sugar
• ½ teaspoon salt
• Mix well and taste — should taste like tears (not too salty!)

**How much to give:**
• Under 2 years: 50–100 ml after each loose stool
• 2–10 years: 100–200 ml after each loose stool
• Continue until diarrhea stops

**Zinc (always give with ORS):**
• Under 6 months: 10mg zinc daily for 14 days
• 6 months+: 20mg zinc daily for 14 days
• Zinc reduces duration and severity of diarrhea

**Do NOT give:**
• Sugary drinks, juice, carbonated drinks
• Salt-sugar water without proper measurements

🚨 Go to hospital if: blood in stool, severe vomiting, no urine in 6 hours, child very drowsy.`
  },

  // ══════════════════════ ZINC SUPPLEMENTATION ══════════════════════
  {
    intent: 'zinc_supplementation',
    patterns: ['zinc', 'zinc supplement', 'zinc tablet', 'zinc syrup', 'zinc for diarrhea', 'zinc deficiency child', 'zinc dose'],
    response: `**Zinc Supplementation for Children:**

**Why zinc matters:**
• Zinc is essential for immune function, growth, and brain development
• Zinc deficiency is common in India — affects growth and immunity

**For diarrhea treatment:**
• Give zinc ALWAYS alongside ORS
• Under 6 months: 10mg daily for 14 days
• 6 months to 5 years: 20mg daily for 14 days
• Reduces diarrhea duration by 25% and severity by 40%

**For general nutrition:**
• Zinc is found in: meat, eggs, dairy, legumes (dal), pumpkin seeds
• Breastmilk has adequate zinc for infants under 6 months

**Zinc-rich foods:**
• Meat and fish (best absorbed)
• Eggs
• Dairy products (milk, paneer)
• Legumes — dal, rajma, chana
• Nuts and seeds

**Zinc tablets/syrup:**
• Available free at PHC for diarrhea management
• Dispersible zinc tablets — dissolve in a spoon of water

✅ Zinc + ORS is the WHO/UNICEF recommended treatment for childhood diarrhea.`
  },

  // ══════════════════════ CHILD DEVELOPMENT & PLAY ══════════════════════
  {
    intent: 'child_development_play',
    patterns: ['child development', 'baby play', 'stimulation baby', 'how to stimulate baby', 'cognitive development', 'early childhood development', 'play ideas for baby', 'toys for baby', 'learning activities baby', 'bache ka vikas'],
    response: `**Early Childhood Development & Play:**

**Why play matters:**
Play is how babies learn — it builds brain connections, language, and social skills.

**0–3 months:**
• Talk and sing to baby — faces 20–30cm away
• Black and white patterns stimulate vision
• Skin-to-skin, gentle massage

**3–6 months:**
• Rattles, bright toys within reach
• Tummy time (supervised) to strengthen neck
• Mirror play — baby loves seeing own face

**6–12 months:**
• Peekaboo, pat-a-cake
• Give things to grab, bang, and mouth (safe objects)
• Name everything you do: "now we eat, now we sleep"

**1–2 years:**
• Blocks, stacking, simple sorting
• Picture books — point to pictures and name them
• Outdoor play and exploring nature
• Simple songs and nursery rhymes

**2–3 years:**
• Pretend play (cooking, dolls, doctor)
• Crayons and drawing
• Simple puzzles

**Responsive parenting:**
• Respond to baby's cries and sounds
• Maintain eye contact
• Read simple stories every day

✅ You don't need expensive toys — a loving, talking, responsive caregiver is the best stimulus!`
  },

  // ══════════════════════ IMMUNISATION CATCH-UP ══════════════════════
  {
    intent: 'vaccine_catchup',
    patterns: ['missed vaccine', 'catch up vaccination', 'delayed vaccination', 'vaccine pending', 'child not vaccinated', 'no vaccination yet', 'vaccination overdue', 'late vaccination', 'vaccine missed'],
    response: `**Missed/Delayed Vaccines — Catch-Up:**

**Good news:** It is NEVER too late to vaccinate!

**What to do:**
• Go to nearest Anganwadi, Sub-centre, PHC, or hospital
• Bring your child's vaccination card (if you have it)
• ASHA worker can check what's pending and arrange catch-up

**Key rules for catch-up:**
• You do NOT need to restart a series from scratch
• Give the next dose as soon as possible
• Minimum intervals between doses must be maintained
• All missed vaccines can be given on the same day (unless they need spacing)

**Minimum intervals:**
• DPT/Polio series: at least 4 weeks between doses
• MR: single dose if not given, or 2 doses if > 12 months old
• Hepatitis B series: allow proper intervals

**Free under UIP:**
All vaccines in India's Universal Immunisation Programme are free at government facilities.

**Village Health and Nutrition Days (VHND):**
• Monthly immunisation sessions at Anganwadi centres
• Ask your ASHA worker for the next session date

📞 Contact your ASHA worker — she will arrange catch-up vaccination for your child.`
  },

  // ══════════════════════ WEIGHING / GROWTH MONITORING ══════════════════════
  {
    intent: 'growth_monitoring',
    patterns: ['weigh baby', 'weighing child', 'growth monitoring', 'growth chart', 'how to weigh baby', 'weight check', 'monthly weighing', 'anganwadi weighing', 'plot growth chart'],
    response: `**Growth Monitoring — Weighing Your Child:**

**Why it matters:**
Regular weighing detects malnutrition early, before it becomes severe.

**Where to weigh:**
• Anganwadi Centre — every month (free)
• PHC / Sub-centre
• Village Health and Nutrition Day (VHND)

**How often:**
• Monthly until age 2 years
• Every 3 months from 2–5 years

**Growth Chart (WHO Child Growth Standards):**
• Green zone: Normal
• Yellow zone: Moderate acute malnutrition (MAM) — needs extra feeding
• Red zone: Severe acute malnutrition (SAM) — needs medical care

**Indicators tracked:**
• Weight-for-age (underweight)
• Height-for-age (stunting)
• Weight-for-height (wasting — most important for acute malnutrition)
• MUAC (mid-upper arm circumference) — quick screening

**MUAC cut-offs (6–59 months):**
• Green ≥ 12.5cm: Normal
• Yellow 11.5–12.4cm: MAM
• Red < 11.5cm: SAM

✅ Ask AWW to show you your child's growth chart every month.
📞 If child in yellow or red zone — refer to PHC or NRC immediately.`
  },

  // ══════════════════════ APP FEATURES ══════════════════════
  {
    intent: 'app_features',
    patterns: ['app features', 'what can this app do', 'how to use app', 'app help', 'sishu arogaya features', 'app functions', 'login app', 'register app', 'parent features', 'asha features'],
    response: `**Sishu Arogaya App — Features:**

**For Parents:**
• View child's vaccination schedule and upcoming vaccines
• Track child's weight and height growth
• Access diet plans by age
• View ASHA worker contact
• Get health notifications and reminders

**For ASHA Workers:**
• View assigned children list
• Log home visit details
• Track vaccination status of all children
• Monitor malnutrition reports
• Access growth records

**For Admin:**
• Manage ASHA assignments
• View district-wide health data
• Generate reports

**Getting Started:**
• Parents: Register with your mobile number
• ASHA workers: Use credentials given by your supervisor
• Admin: Separate admin login

**Need help?**
📞 Contact your ASHA worker directly through the app.

✅ The app works on mobile and desktop browsers.`
  },

  // ══════════════════════ HOTLINES & EMERGENCY ══════════════════════
  {
    intent: 'emergency_numbers',
    patterns: ['emergency number', 'helpline number', 'ambulance number', 'call for help', 'health helpline', '108', 'call 108', 'emergency contact', 'hospital emergency', 'crisis help'],
    response: `**Emergency & Health Helpline Numbers:**

🚨 **108** — Free ambulance & emergency (24/7)
🚨 **102** — Free ambulance for pregnant women and sick children
📞 **1800-180-1104** — Child health helpline (toll-free)
📞 **1800-11-0101** — Malaria helpline (toll-free)
📞 **1800-11-6666** — TB helpline (Nikshay, toll-free)
📞 **14416 / 1800-110-416** — Mental health helpline (iCall)
📞 **1098** — CHILDLINE for child welfare emergency
📞 **104** — Health advice line (many states)

**When to call 108:**
• Child not breathing, unconscious
• Severe difficulty breathing
• Seizures (fits) lasting > 5 minutes
• Suspected poisoning
• Severe injuries or bleeding
• Pregnant woman in emergency

✅ All these numbers are toll-free from any phone — including no-balance phones.`
  },

  // ══════════════════════ COMPLEMENTARY FEEDING — DETAILED ══════════════════════
  {
    intent: 'complementary_feeding_6m',
    patterns: ['what to feed 6 month baby', 'starting solids', 'first foods baby', '6 month food', 'solid food start', 'weaning food', 'oopar ka khana', 'baby food start', 'first solid food', 'complementary food start'],
    response: `**Starting Solid Foods at 6 Months:**

**Why 6 months?**
Breast milk alone is not enough after 6 months. Baby needs extra energy and nutrients.

**Golden Rules:**
• Continue breastfeeding (do NOT stop)
• Start SLOWLY — 1 new food at a time
• Give same new food for 3 days before introducing another

**What to give at 6 months:**
• Mashed rice + dal (khichdi) — most important
• Mashed banana
• Mashed sweet potato or potato
• Cooked and mashed vegetables
• No salt, no sugar, no honey

**Consistency:** Thick paste (not watery gruel)

**Amount:**
• Start: 2–3 teaspoons, 2 times/day
• By 9 months: Half a small bowl (125ml), 3 times/day + 1 snack

**8–9 months:**
• Add mashed eggs (yolk first)
• Soft mashed fish / chicken
• Curd (dahi)
• Add a little ghee or oil to every meal

**12 months onward:**
• Family foods (well-cooked, soft)
• 3 meals + 2 snacks per day
• Cow's milk as drink is okay after 12 months

🚨 Do NOT give honey before 1 year — risk of infant botulism.`
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
