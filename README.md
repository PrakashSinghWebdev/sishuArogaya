# Shishu Aarogya - Child Health Portal

Shishu Aarogya is a comprehensive, multi-role digital health platform designed to monitor and improve child health outcomes in India. It connects parents, ASHA workers, and administrators to ensure every child receives timely vaccinations, growth monitoring, and nutritional guidance.

## 🌟 Key Features

### 👪 For Parents
- **Digital Health Record:** Maintain a centralized record for each child.
- **Vaccination Tracker:** Automatic schedules and reminders for vaccinations from birth to 24 months.
- **Growth Monitoring:** Track weight, height, and head circumference with visual charts.
- **AI-Powered Nutrition:** Personalized diet plans and health insights using generative AI.
- **Resource Discovery:** Find nearby hospitals and browse government welfare schemes.

### 👩‍⚕️ For ASHA Workers
- **Field Management:** Efficiently manage assigned children in their region.
- **Home Visit Logs:** Digital recording of health checks and nutrition counseling.
- **Smart Alerts:** Instant identification of moderate and severe malnutrition (MAM/SAM) cases.
- **Report Generation:** Automated field reports for district submission.

### 👔 For Administrators
- **Health Heatmaps:** Regional visualization of health indicators (vaccination coverage, nutrition levels).
- **User Management:** Oversight of ASHA workers and parent registries.
- **Audit Logs:** Full transparency of system activities and health record updates.
- **Analytics:** Data-driven insights for block-level and district-level decision-making.

## 🛠️ Tech Stack

- **Frontend:** React, Vite, TailwindCSS (for modern UI), Chart.js (for growth tracking), Leaflet (for hospital mapping).
- **Backend:** Node.js, Express.
- **Database:** MongoDB with Mongoose.
- **AI Integration:** Google Generative AI (Gemini) for health predictions and chatbot support.
- **Utilities:** PDFKit (PDF reports), ExcelJS (Data exports), JWT (Secure Auth).

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Google Gemini API Key (for AI features)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/shishu-aarogya.git
   cd shishu-aarogya
   ```

2. **Server Setup:**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Update .env with your MongoDB URI and API Keys
   npm start
   ```

3. **Client Setup:**
   ```bash
   cd ../client
   npm install
   npm run dev
   ```

### Seeding Data (Optional)
To populate the database with sample data:
```bash
cd server
node seedFullData.js
```

## 📖 Documentation
Detailed documentation is available in the `docs/` folder:
- [Product Requirements (PRD)](docs/PRD.md)
- [Search System Implementation](docs/SEARCH_SYSTEM.md)
- [Features & Translation Guide](docs/FEATURES_GUIDE.md)

## 🛡️ License
This project is licensed under the MIT License.
