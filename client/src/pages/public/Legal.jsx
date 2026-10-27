import { Link } from 'react-router-dom';

// DRAFT text — must be reviewed by the department's legal officer before launch. Not legal advice.
const UPDATED = '21 October 2026';
const CONTACT = 'support@shishuaarogya.gov.in';

function LegalPage({ title, sections }) {
  return (
    <main style={{ maxWidth: 820, margin: '0 auto', padding: '40px 16px 64px', lineHeight: 1.7, color: '#1f2937' }}>
      <Link to="/" style={{ color: '#0e7490' }}>&larr; Back Home</Link>
      <h1 style={{ marginTop: 16 }}>{title}</h1>
      <p style={{ color: '#6b7280' }}>Last updated: {UPDATED}</p>
      {sections.map(([heading, ...paras]) => (
        <section key={heading}>
          <h2 style={{ fontSize: '1.2rem', marginTop: 28 }}>{heading}</h2>
          {paras.map((p, i) => Array.isArray(p)
            ? <ul key={i}>{p.map((li) => <li key={li}>{li}</li>)}</ul>
            : <p key={i}>{p}</p>)}
        </section>
      ))}
    </main>
  );
}

const privacy = [
  ['1. Who we are',
    'Shishu Aarogya is a child health monitoring portal run by the Health Department. We act as the Data Fiduciary under the Digital Personal Data Protection Act, 2023 (DPDP Act) for the personal data described below.'],
  ['2. What we collect',
    ['Account details: name, phone number, email, role (parent, ASHA worker, administrator), district and block.',
      "Child details: name, date of birth, gender, parent or guardian's name, address and location.",
      'Health records: growth measurements (height, weight, MUAC), vaccination history, malnutrition status, home visit notes, referrals and maternal care records.',
      'Usage data: the language you choose, notification preferences and messages you send through the portal or the chatbot.']],
  ["3. Children's data and parental consent",
    "Most records in this portal belong to children under 18. Under Section 9 of the DPDP Act, we process a child's data only with the verifiable consent of a parent or lawful guardian, or when an ASHA worker or health official records it while delivering a public health service. We do not track children's behaviour, show them targeted ads or build profiles of them for any purpose other than their health care."],
  ['4. Why we use it',
    ['To track growth, vaccinations and nutrition, and to send due-date reminders.',
      'To let assigned ASHA workers and health officials provide care and referrals.',
      'To produce anonymised district and block statistics for public health planning.',
      'To secure accounts (one-time passwords, login sessions).']],
  ['5. Who we share it with',
    'We share data only with health staff assigned to your area and with the following service providers, for the purpose stated:',
    ['Google (Gemini AI): questions sent to the chatbot and growth data used for the AI health prediction feature are processed to generate answers.',
      'SendGrid or our email provider: email address, for one-time passwords and alerts.',
      'SMS and WhatsApp gateways: phone number and message text, for reminders and alerts.',
      'Map providers (OpenStreetMap, Nominatim, Overpass, OSRM): approximate location, for showing nearby health centres.',
      'YouTube and Unsplash: embedded videos and images; these services may see your IP address when content loads.'],
    'We do not sell personal data.'],
  ['6. Cookies',
    'We use a single, strictly necessary cookie to keep you signed in. It is deleted when you close your browser or sign out. We do not use advertising or analytics cookies. Your language choice is stored in your browser only.'],
  ['7. How long we keep it',
    'Child health and immunisation records are retained for the period required by Health Department record-keeping rules. Account data is kept while the account is active.'],
  ['8. Your rights',
    'Under the DPDP Act you may ask to access, correct or update your data, withdraw consent, or raise a grievance. You can update your profile in Account Settings. For anything else, write to us at the address below. Some health records may need to be kept by law even after a request.'],
  ['9. Security',
    'Data is sent over encrypted connections, passwords are stored as one-way hashes, and access is limited by role and assigned area.'],
  ['10. Grievance officer',
    `Email ${CONTACT}, or write to the Health Department, New Delhi. We will respond within the time set by the DPDP Act and its Rules. If you are not satisfied, you may complain to the Data Protection Board of India.`],
];

const terms = [
  ['1. About the service',
    'Shishu Aarogya helps parents, ASHA workers and health officials record and monitor child health. By creating an account you agree to these terms and to our Privacy Policy.'],
  ['2. Not a substitute for a doctor',
    'Growth charts, diet plans, chatbot answers and AI health predictions are for information only. They are not a medical diagnosis. In an emergency, call 108 or go to the nearest health centre.'],
  ['3. Your account',
    ['Give accurate information and keep it up to date.',
      'Keep your password and one-time passwords private. You are responsible for activity on your account.',
      "Register a child only if you are the child's parent or lawful guardian, or an authorised health worker."]],
  ['4. Health workers and officials',
    'ASHA workers and administrators may access only the records of their assigned area, and only for providing care. Misuse of records may lead to removal of access and action under applicable law.'],
  ['5. Acceptable use',
    ['Do not try to access data you are not authorised to see.',
      'Do not upload false, harmful or unlawful content.',
      'Do not overload, scrape or interfere with the portal.']],
  ['6. Shop orders',
    'Products in the shop are paid for in cash or by UPI on delivery. Prices and availability may change. Orders are confirmed only on delivery.'],
  ['7. Content and licences',
    'Portal content, logos and text belong to the Health Department or are used under licence. Embedded videos and images remain the property of their owners.'],
  ['8. Liability',
    'We work to keep the portal accurate and available, but we cannot guarantee it will be error-free or always online. To the extent the law allows, we are not liable for losses caused by relying on information in the portal instead of medical advice.'],
  ['9. Changes',
    'We may update these terms. We will show the new date at the top of this page, and continuing to use the portal means you accept the updated terms.'],
  ['10. Governing law and contact',
    `These terms are governed by the laws of India. Questions: ${CONTACT}.`],
];

export const PrivacyPolicy = () => <LegalPage title="Privacy Policy" sections={privacy} />;
export const TermsOfUse = () => <LegalPage title="Terms of Use" sections={terms} />;
