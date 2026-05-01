# Product Requirements Document
## Shishu Aarogya
### Current-State PRD

Version: 1.0  
Date: 2026-05-01  
Prepared from: current codebase, route structure, UI pages, models, and project notes

## 1. Product Overview
Shishu Aarogya is a web-based child health monitoring platform designed for three primary user groups: parents, ASHA workers, and administrators. The platform aims to digitize child health tracking across vaccination, growth, nutrition, alerts, reporting, and welfare access in one unified system.

The product combines household-level child records with field-worker workflows and district-level administrative visibility. The current implementation supports public marketing pages, role-based authentication, separate dashboards for each user type, child profile and growth data, vaccination schedules, diet guidance, health reports, notifications, government schemes, chatbot support, and hospital discovery.

## 2. Product Vision
Build a practical, multilingual digital health platform that helps caregivers and frontline health workers monitor every child's health journey from early registration through routine growth and vaccination milestones, while giving administrators operational visibility across regions.

## 3. Problem Statement
Current child health processes are often fragmented across paper records, local follow-up, and disconnected reporting tools. This causes:

- missed vaccination schedules
- delayed detection of growth or nutrition issues
- weak coordination between parents, ASHA workers, and administrators
- poor visibility into district and block-level trends
- difficulty discovering schemes, nearby facilities, and actionable next steps

Shishu Aarogya addresses these gaps through a single role-based web platform.

## 4. Target Users
### Parents
- register and manage child profiles
- track vaccination schedules
- monitor growth and nutrition
- view alerts, reports, and schemes
- access AI-assisted guidance and nearby hospitals

### ASHA Workers
- manage assigned children
- log home visits
- track vaccination and growth records
- identify malnutrition cases
- generate field-level reports and receive reminders

### Administrators
- monitor health indicators across regions
- manage users and ASHA workers
- review analytics, registries, alerts, and audit logs
- access district and block reporting views

## 5. Goals
- maintain a digital record for each child
- reduce missed vaccinations through reminders and schedule tracking
- enable early identification of moderate and severe nutrition risk
- improve parent-ASHA-admin coordination
- support data-backed reporting for operational decisions
- improve access to schemes, hospitals, and health information

## 6. Current Scope In Product
### 6.1 Public Experience
- public home page with hero content, platform explanation, and calls to action
- about page
- language selector
- branded positioning around national child health support

### 6.2 Authentication And Access Control
- login and registration
- role-based protected routes for parent, ASHA worker, and admin users
- authenticated API access using bearer token storage
- change password, forgot password, and reset password flows in API layer

### 6.3 Parent Portal
- dashboard with quick actions and health summary
- child profile management
- vaccination schedule view
- growth monitoring and history
- diet plan access
- AI health prediction page
- government schemes page
- health reports page
- notifications page
- settings page
- child search within parent context
- nearby hospital map

### 6.4 ASHA Worker Portal
- dashboard
- list of assigned children
- child detail view
- home visit logging
- vaccination tracker
- growth records
- malnutrition report
- visit history
- notifications
- report generation page
- profile settings

### 6.5 Admin Portal
- dashboard
- district heatmap
- analytics reports
- children registry
- ASHA worker management
- health centre directory
- vaccination data
- malnutrition cases
- government schemes management
- blockwise reports
- notifications panel
- user management
- audit logs
- settings configuration

### 6.6 Shared Platform Features
- multilingual interface support
- chatbot support
- voice guide component
- PDF and Excel report generation
- hospital search and nearby hospital discovery
- notifications and read-state management
- error boundary handling
- lazy-loaded routes for portal pages

## 7. Key Functional Requirements
### 7.1 Child Records
- The system must allow storing a unique child record with generated child ID.
- The system must store demographic and health baseline fields including name, date of birth, gender, blood group, birth weight, birth height, current weight, current height, district, block, village, parent assignment, ASHA assignment, and nutrition status.
- The system must compute age in months for child-based workflows.

### 7.2 Vaccination Tracking
- The system must maintain vaccination schedules per child.
- Vaccination records must support due date, given date, given by, notes, scheduled age, and status values such as upcoming, due, done, and missed.
- Parents and ASHA workers must be able to review vaccination progress.
- The platform should surface overdue or due-now vaccines prominently.

### 7.3 Growth Monitoring
- The system must allow adding growth records with weight, height, age in months, and recorded date.
- Growth records must support health analysis fields including head circumference and WHO-style scoring fields in the data model.
- Growth history should be available to users in child-centric workflows.
- The platform should support prediction output for future health or growth insights.

### 7.4 Nutrition And Diet
- The system must provide age-based diet plans.
- The product should support meal-level recommendations and notes.
- Nutrition status should be visible in the child profile and health overview.

### 7.5 Notifications
- The system must deliver notifications to authenticated users.
- Notifications must support listing, read state, individual mark-as-read, and mark-all-read actions.
- The platform should use notifications for vaccine reminders, growth alerts, and follow-ups.

### 7.6 Reports
- The system must generate downloadable child-level reports in PDF format.
- The system must generate district-level exports in Excel format for authorized roles.
- Reports should help both caregivers and operations users review health status and trends.

### 7.7 Search And Discovery
- Parents should be able to search their child records.
- ASHA workers should be able to search children in their workflow.
- Admin users should be able to search ASHA workers.
- Users should be able to discover nearby hospitals and search health centres.

### 7.8 Government Schemes
- The system must list government schemes.
- The platform should present scheme description, eligibility, and benefit details.
- Admin workflows should support scheme management.

### 7.9 AI And Guidance
- The system includes an AI chatbot endpoint for user queries.
- The product includes a voice guide component for guided onboarding and page help.
- The parent experience includes an AI health prediction workflow tied to child growth data.

## 8. User Journey Summary
### Parent Journey
1. User lands on public site and registers or logs in.
2. Parent accesses dashboard and creates or selects a child profile.
3. Parent reviews vaccine due dates, growth status, diet advice, and notifications.
4. Parent downloads reports, checks schemes, and finds nearby hospitals when needed.

### ASHA Journey
1. ASHA worker logs in and sees assigned children and pending tasks.
2. Worker reviews child details, logs visits, updates growth and vaccination information, and flags malnutrition concerns.
3. Worker uses reports and alerts to manage follow-up activity.

### Admin Journey
1. Admin logs in and sees aggregated health and operations views.
2. Admin reviews dashboards, registries, workers, schemes, alerts, and audit logs.
3. Admin exports data and tracks district or block-level status.

## 9. Non-Functional Requirements
- role-based access must prevent users from opening routes outside their allowed portal
- the UI should remain usable on desktop and mobile layouts
- page bundles should be optimized through lazy loading for protected portal pages
- API requests should attach authentication tokens automatically
- the server should include common security middleware such as helmet, CORS configuration, rate limiting, and request logging in development
- the product should support resilient error handling for failed views and API calls

## 10. Current Technology Stack
### Frontend
- React
- Vite
- React Router
- Axios
- Bootstrap and Bootstrap Icons
- Chart.js and react-chartjs-2
- Leaflet and react-leaflet

### Backend
- Node.js
- Express
- MongoDB with Mongoose
- JWT-based authentication
- PDFKit for PDF generation
- ExcelJS for spreadsheet exports
- Google Generative AI SDK

## 11. Success Indicators
At the current stage, the product appears designed to improve:

- child record completeness
- vaccine completion visibility
- timeliness of growth monitoring
- identification of moderate and severe nutrition cases
- responsiveness of ASHA follow-up
- usage of reports and scheme discovery features

## 12. Known Current-State Notes
- This PRD reflects the product as observed in the current codebase on 2026-05-01.
- Some pages may still be richer in UI structure than in final production-grade backend depth.
- Feature guides and route structure suggest broader intended coverage than what is fully validated end-to-end in this review.
- The latest visible project note confirms recent work on report download improvements in the parent reports flow.

## 13. Recommended Next PRD Expansion
For the next version of this PRD, add:

- measurable KPIs and targets
- detailed user stories with acceptance criteria
- exact admin analytics definitions
- notification rules and trigger matrix
- field-level validation rules
- privacy, consent, and data retention requirements
- deployment architecture and environment requirements

## 14. Executive Summary
Shishu Aarogya is already positioned as a multi-role child health operations platform rather than a simple tracking website. Its strongest current product pillars are child records, vaccination workflows, growth monitoring, diet guidance, multilingual access, operational reporting, and coordination between parents, ASHA workers, and administrators. The product is well-scoped for a government-aligned digital public health use case and now benefits from being documented as a unified platform with clear role-based value.
