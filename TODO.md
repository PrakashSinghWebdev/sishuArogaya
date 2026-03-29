# Sishu Arogaya Language Fix - Complete App Translation
Status: 🚀 In Progress | Target: Translate ALL Parent/ASHA/Admin pages + components

## 📋 Implementation Steps (Approved Plan)

### Phase 1: Core Components (App-wide navbar/sidebar)
- [✅] **Topbar.jsx**: Add `useLanguage`, translate "Sishu Arogaya..." → t('appTitle'), add language dropdown switcher (LANGUAGES array)
- [✅] **Sidebar.jsx**: Replace hardcoded NAV_LINKS.label → t('dashboard'), t('myChild'), etc. Match T keys per role
- [✅] **Layout.jsx**: No text, skip

### Phase 2: Parent Pages (Priority - User focus)
- [✅] **ChildProfile.jsx**: Import useLanguage/t(), translate titles/nav/labels (~50 strings)
- [✅] **DietPlan.jsx**: Translate page content (tips, warnings, buttons, labels) - nav already good
- [ ] **VaccinationSchedule.jsx**: Full translation
- [ ] **Remaining Parent**: Dashboard.jsx, GrowthMonitoring.jsx, AIHealthPrediction.jsx, GovernmentSchemes.jsx, HealthReports.jsx, Notifications.jsx, Settings.jsx (partial)

### Phase 3: ASHA Pages
- [ ] **Priority**: NotificationsAlerts.jsx (open tab), Dashboard.jsx, MyChildrenList.jsx, etc.
- [ ] **All**: ChildDetailView.jsx, LogHomeVisit.jsx, GrowthRecords.jsx, MalnutritionReport.jsx, VaccinationTracker.jsx, VisitHistoryLog.jsx, AreaCoverageMap.jsx, ProfileSettings.jsx, GenerateReport.jsx

### Phase 4: Admin Pages
- [ ] **All**: Dashboard.jsx, DistrictHeatmap.jsx, AnalyticsReports.jsx, ChildrenRegistry.jsx, AshaWorkerManagement.jsx, HealthCentreDirectory.jsx, VaccinationData.jsx, MalnutritionCases.jsx, GovernmentSchemes.jsx, BlockwiseReports.jsx, NotificationsPanel.jsx, UserManagement.jsx, AuditLogs.jsx, SettingsConfiguration.jsx

### Phase 5: Auth + Misc
- [ ] **Login.jsx, Register.jsx**: Translate forms/titles
- [ ] **Search_files** for remaining hardcoded strings → batch fix

### Phase 6: Testing & Completion
- [ ] Run `cd client && npm run dev`
- [ ] Test: Settings/Topbar language change → ALL text updates instantly (no refresh)
- [ ] Navigate all roles/pages → Verify 100% translation
- [ ] Update this TODO.md: Mark ✅ completed phases
- [ ] attempt_completion

## 🔧 Edit Guidelines
- Import: `import { useLanguage } from '../context/LanguageContext'; const { t } = useLanguage();`
- Replace strings: t('exact_key') - keys exist in LanguageContext.T
- Navbar: Prefer navLinks array from context
- No new keys needed - use existing T dict
- Preserve layout/CSS exactly

**Progress: 0/6 phases complete**

