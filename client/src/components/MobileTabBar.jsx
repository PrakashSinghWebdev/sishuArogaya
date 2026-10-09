import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

// First 4 links show as tabs; the full list opens from "More".
const LINKS = {
  parent: [
    {
      to: "/parent/dashboard",
      icon: "bi-house-door",
      key: "dashboard",
      label: "Home",
    },
    {
      to: "/parent/vaccination",
      icon: "bi-shield-check",
      key: "vaccines",
      label: "Vaccines",
    },
    {
      to: "/parent/diet-plan",
      icon: "bi-egg-fried",
      key: "dietPlan",
      label: "Diet",
    },
    {
      to: "/parent/child-profile",
      icon: "bi-person-heart",
      key: "myChild",
      label: "My Child",
    },
    {
      to: "/parent/ai-prediction",
      icon: "bi-cpu",
      key: "aiPrediction",
      label: "AI Prediction",
    },
    {
      to: "/parent/schemes",
      icon: "bi-bank",
      key: "schemes",
      label: "Schemes",
    },
    {
      to: "/parent/reports",
      icon: "bi-file-earmark-text",
      key: "reports",
      label: "Reports",
    },
    {
      to: "/parent/notifications",
      icon: "bi-bell",
      key: "notifications",
      label: "Notifications",
    },
    {
      to: "/parent/settings",
      icon: "bi-gear",
      key: "settings",
      label: "Settings",
    },
  ],
  asha: [
    {
      to: "/asha/dashboard",
      icon: "bi-house-door",
      key: "dashboard",
      label: "Home",
    },
    {
      to: "/asha/children",
      icon: "bi-people",
      key: "myChildren",
      label: "Children",
    },
    {
      to: "/asha/log-visit",
      icon: "bi-clipboard-plus",
      key: "logVisit",
      label: "Log Visit",
    },
    {
      to: "/asha/vaccination-tracker",
      icon: "bi-shield-check",
      key: "vaccinationTracker",
      label: "Vaccines",
    },
    {
      to: "/asha/growth-records",
      icon: "bi-graph-up-arrow",
      key: "growthRecords",
      label: "Growth Records",
    },
    {
      to: "/asha/malnutrition-report",
      icon: "bi-exclamation-triangle",
      key: "malnutritionReport",
      label: "Malnutrition",
    },
    {
      to: "/asha/visit-history",
      icon: "bi-clock-history",
      key: "visitHistory",
      label: "Visit History",
    },
    {
      to: "/asha/generate-report",
      icon: "bi-file-earmark-bar-graph",
      key: "generateReport",
      label: "Reports",
    },
    {
      to: "/asha/notifications",
      icon: "bi-bell",
      key: "notifications",
      label: "Notifications",
    },
    {
      to: "/asha/settings",
      icon: "bi-gear",
      key: "settings",
      label: "Settings",
    },
  ],
  admin: [
    {
      to: "/admin/dashboard",
      icon: "bi-speedometer2",
      key: "dashboard",
      label: "Home",
    },
    {
      to: "/admin/children",
      icon: "bi-people-fill",
      key: "childrenRegistry",
      label: "Children",
    },
    {
      to: "/admin/analytics",
      icon: "bi-bar-chart-line",
      key: "analyticsReports",
      label: "Analytics",
    },
    {
      to: "/admin/heatmap",
      icon: "bi-map-fill",
      key: "districtHeatmap",
      label: "Heatmap",
    },
    {
      to: "/admin/asha-workers",
      icon: "bi-person-badge-fill",
      key: "ashaWorkers",
      label: "ASHA Workers",
    },
    {
      to: "/admin/health-centres",
      icon: "bi-hospital",
      key: "healthCentreDirectory",
      label: "Health Centres",
    },
    {
      to: "/admin/vaccination-data",
      icon: "bi-shield-plus",
      key: "vaccinationData",
      label: "Vaccination Data",
    },
    {
      to: "/admin/malnutrition",
      icon: "bi-exclamation-octagon",
      key: "malnutritionCasesAdmin",
      label: "Malnutrition",
    },
    {
      to: "/admin/schemes",
      icon: "bi-bank",
      key: "governmentSchemes",
      label: "Schemes",
    },
    {
      to: "/admin/block-reports",
      icon: "bi-file-earmark-excel",
      key: "blockwiseReports",
      label: "Block Reports",
    },
    {
      to: "/admin/notifications",
      icon: "bi-broadcast",
      key: "notificationsPanel",
      label: "Notifications",
    },
    {
      to: "/admin/users",
      icon: "bi-person-gear",
      key: "userManagement",
      label: "Users",
    },
    {
      to: "/admin/audit-logs",
      icon: "bi-journal-text",
      key: "auditLogs",
      label: "Audit Logs",
    },
    {
      to: "/admin/settings",
      icon: "bi-sliders",
      key: "settingsConfig",
      label: "Settings",
    },
  ],
};

const isActive = (pathname, to) =>
  pathname === to || pathname.startsWith(`${to}/`);

const MobileTabBar = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => setMoreOpen(false), [pathname]);

  const links = LINKS[user?.role];
  if (!links || !pathname.startsWith(`/${user.role}/`)) return null;

  // Tab labels stay short (English fallback); the sheet uses translated names.
  const label = (l) =>
    String(t(l.key) || l.label)
      .replace(/^[^\p{L}\p{N}]+/u, "")
      .trim();
  const tabs = links.slice(0, 4);
  const moreActive = !tabs.some((l) => isActive(pathname, l.to));

  return (
    <>
      {moreOpen && (
        <div className="m-sheet-backdrop" onClick={() => setMoreOpen(false)}>
          <div
            className="m-sheet"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="All pages"
          >
            <div className="m-sheet-handle" />
            <div className="m-sheet-grid">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`m-sheet-item${isActive(pathname, l.to) ? " active" : ""}`}
                >
                  <i className={`bi ${l.icon}`} />
                  <span>{label(l)}</span>
                </Link>
              ))}
              <button
                type="button"
                className="m-sheet-item danger"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
              >
                <i className="bi bi-box-arrow-right" />
                <span>{t("logout") || "Logout"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="m-tabbar" aria-label="Main">
        {tabs.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={`m-tab${isActive(pathname, l.to) ? " active" : ""}`}
          >
            <i className={`bi ${l.icon}`} />
            <span>{l.label}</span>
          </Link>
        ))}
        <button
          type="button"
          className={`m-tab${moreOpen || moreActive ? " active" : ""}`}
          onClick={() => setMoreOpen((v) => !v)}
        >
          <i className="bi bi-grid-3x3-gap" />
          <span>More</span>
        </button>
      </nav>
    </>
  );
};

export default MobileTabBar;
