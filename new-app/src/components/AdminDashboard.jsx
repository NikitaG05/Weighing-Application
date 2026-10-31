import { useCallback, useEffect, useState } from "react";

import UserRegistration from "./Register";
import User from "./Masters/Users";
import Roles from "./Masters/Roles";
import Statuses from "./Masters/Statuses";
import Reports from "./Report";
import WeighmentAnalytics from "./Reports/WeighmentAnalytics";
import Addresses from "./Masters/Addresses";
import Sites from "./Masters/Sites";
import WeighBridge from "../components/Masters/WeighBridge";
import ThemeSelector from "./ThemeSelector";
import { getDashboardInsights } from "../api/dashboardApi";
import { getSites } from "../api/sitesApi";

import PartyMaster from "../components/Masters/PartyMaster";
import VehicleMaster from "../components/Masters/VehicleMaster";
import UnitMaster from "../components/Masters/UnitMaster";
import ProductTypeMaster from "../components/Masters/ProductType";
import ProductMaster from "./Masters/ProductMaster";
import "../style/AdminDashboard.css";

/* Lightweight SVG icons - no additional package needed */
function DashboardIcon({ name, size = 20 }) {
  const paths = {
    menu: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </>
    ),
    close: <path d="M6 6l12 12M18 6L6 18" />,
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    masters: (
      <>
        <ellipse cx="12" cy="5" rx="8" ry="3" />
        <path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
        <path d="M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a6 6 0 0 1 12 0v2" />
        <path d="M17 5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 5" />
      </>
    ),
    reports: (
      <>
        <path d="M5 3h10l4 4v14H5z" />
        <path d="M15 3v5h4M9 17v-4M12 17v-7M15 17v-3" />
      </>
    ),
    analytics: (
      <>
        <path d="M4 20V11h4v9M10 20V5h4v15M16 20v-7h4v7" />
      </>
    ),
    palette: (
      <>
        <path d="M12 3a9 9 0 1 0 0 18h1.2a2 2 0 0 0 1.6-3.2 1.7 1.7 0 0 1 1.3-2.8H18a3 3 0 0 0 3-3 9 9 0 0 0-9-9Z" />
        <circle cx="7.5" cy="11" r="1" />
        <circle cx="10" cy="7" r="1" />
        <circle cx="15" cy="7.5" r="1" />
      </>
    ),
    logout: (
      <>
        <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" />
        <path d="M14 7l5 5-5 5M19 12H9" />
      </>
    ),
    chevronLeft: <path d="M15 18l-6-6 6-6" />,
    chevronRight: <path d="M9 18l6-6-6-6" />,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    sites: <><path d="M3 10l9-7 9 7v10H3z" /><path d="M9 20v-7h6v7" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
    pause: <><circle cx="12" cy="12" r="9" /><path d="M10 9v6M14 9v6" /></>,
    shield: <><path d="M12 2 4 5v6c0 5 3.4 8.3 8 11 4.6-2.7 8-6 8-11V5z" /><path d="m9 12 2 2 4-4" /></>,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.dashboard}
    </svg>
  );
}

function AdminDashboard({
  username,
  accessToken,
  role,
  onLogout,
}) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeMaster, setActiveMaster] = useState("weighbridge");
  const [usersRefreshKey, setUsersRefreshKey] = useState(0);
  const [showAppearance, setShowAppearance] = useState(false);

  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState("");

  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [sitesLoading, setSitesLoading] = useState(false);
  const [sitesError, setSitesError] = useState("");

  const loadInsights = useCallback(async () => {
    if (!accessToken) return;
    setInsightsLoading(true);
    setInsightsError("");
    try {
      const result = await getDashboardInsights(accessToken);
      setInsights(result);
    } catch (error) {
      setInsightsError(error.message || "Unable to load dashboard insights.");
    } finally {
      setInsightsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (activeTab === "dashboard") loadInsights();
  }, [activeTab, loadInsights]);

  const insightCards = [
    { label: "Total Weighbridges", key: "totalWeighbridges", icon: "masters", note: "Registered weighbridges" },
    { label: "Total Sites", key: "totalSites", icon: "sites", note: "Operational locations" },
    { label: "Registered Users", key: "totalUsers", icon: "users", note: "All user accounts" },
    { label: "Active Users", key: "activeUsers", icon: "check", note: "Enabled accounts" },
    { label: "Inactive Users", key: "inactiveUsers", icon: "pause", note: "Disabled accounts" },
    { label: "Admin Accounts", key: "adminAccounts", icon: "shield", note: "Administrator access" },
  ];


  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("adminSidebarCollapsed") === "true";
  });

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(
      "adminSidebarCollapsed",
      String(sidebarCollapsed)
    );
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (!mobileSidebarOpen) return;

    function handleEscape(event) {
      if (event.key === "Escape") {
        setMobileSidebarOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [mobileSidebarOpen]);

  const handleUserRegistered = useCallback(() => {
    setUsersRefreshKey((previous) => previous + 1);
  }, []);

  const navigationTabs = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "masters", label: "Masters", icon: "masters" },
    {
      id: "registration",
      label: "User Registration",
      icon: "users",
    },
    { id: "report", label: "Reports", icon: "reports" },
    { id: "analytics", label: "Analytics", icon: "analytics" },
  ];

  const masterTabs = [
    { id: "weighbridge", label: "Weighbridge Master" },
    { id: "sites", label: "Site Master" },
    { id: "addresses", label: "Address Master" },
    { id: "users", label: "User Master" },
    { id: "roles", label: "Role Master" },
    { id: "statuses", label: "Status Master" },
    { id: "parties", label: "Party Master" },
    { id: "vehicles", label: "Vehicle Master" },
    { id: "units", label: "Unit Master" },
    { id: "productTypes", label: "Product Type Master" },
    { id: "products", label: "Product Master" },
  ];

  function handleNavigation(tabId) {
    setActiveTab(tabId);
    setShowAppearance(false);
    setMobileSidebarOpen(false);
  }

  function handleAppearance() {
    setShowAppearance((previous) => !previous);
    setMobileSidebarOpen(false);
  }

  const currentPageTitle =
    navigationTabs.find((tab) => tab.id === activeTab)?.label ||
    "Dashboard";

    const loadSites = useCallback(async () => {
    if (!accessToken) return;

    try {
      setSitesLoading(true);
      setSitesError("");

      const data = await getSites(accessToken);

      const siteList = Array.isArray(data) ? data : [];

      setSites(siteList);

      setSelectedSiteId((current) =>
        siteList.some((site) => String(site.id) === String(current))
          ? current
          : ""
      );
    } catch (error) {
      setSitesError(error.message || "Unable to load sites.");
    } finally {
      setSitesLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (
      (activeTab === "masters" &&
      ["parties", "vehicles"].includes(activeMaster)) ||
      activeTab === "analytics"
    ) {
      loadSites();
    }
  }, [activeTab, activeMaster, loadSites]);

  return (
    <main
      className={`admin-page ${
        sidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
    >
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <button
          type="button"
          className="admin-sidebar-overlay"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Close navigation menu"
        />
      )}

      {/* Sidebar */}
      <aside
        id="admin-sidebar"
        className={`admin-sidebar ${
          mobileSidebarOpen ? "mobile-open" : ""
        }`}
        aria-label="Admin sidebar"
      >
        <div className="admin-sidebar-brand">
          <div className="admin-sidebar-header-actions">
            <button
              type="button"
              className="admin-sidebar-header-toggle"
              onClick={() => {
                if (window.matchMedia("(max-width: 768px)").matches) {
                  setMobileSidebarOpen(false);
                } else {
                  setSidebarCollapsed((previous) => !previous);
                }
              }}
              aria-label={
                mobileSidebarOpen
                  ? "Close navigation menu"
                  : sidebarCollapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
              }
              title={sidebarCollapsed && !mobileSidebarOpen ? "Expand sidebar" : "Close sidebar"}
              aria-controls="admin-sidebar"
            >
              <DashboardIcon
                name={sidebarCollapsed && !mobileSidebarOpen ? "chevronRight" : "close"}
                size={20}
              />
            </button>
          </div>

          <div className="admin-brand-identity">
            <img
              src={`${process.env.PUBLIC_URL}/favicon.ico`}
              alt="Precision Weighing Systems logo"
              className="admin-sidebar-logo"
            />
            <div className="admin-brand-text">
              <strong>PRECISION</strong>
              <span>WEIGHING SYSTEMS</span>
            </div>
          </div>
        </div>

        <div className="admin-sidebar-divider" />

        <nav
          className="admin-sidebar-nav"
          aria-label="Main navigation"
        >
          <span className="admin-sidebar-section-label">
            WORKSPACE
          </span>

          {navigationTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              title={sidebarCollapsed ? tab.label : undefined}
              className={`admin-sidebar-link ${
                activeTab === tab.id ? "active" : ""
              }`}
              onClick={() => handleNavigation(tab.id)}
              aria-current={
                activeTab === tab.id ? "page" : undefined
              }
            >
              <span className="admin-sidebar-link-icon">
                <DashboardIcon name={tab.icon} />
              </span>

              <span className="admin-sidebar-link-label">
                {tab.label}
              </span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <button
            type="button"
            className={`admin-sidebar-link ${
              showAppearance ? "active" : ""
            }`}
            title={sidebarCollapsed ? "Appearance" : undefined}
            onClick={handleAppearance}
            aria-expanded={showAppearance}
            aria-controls="admin-appearance-panel"
          >
            <span className="admin-sidebar-link-icon">
              <DashboardIcon name="palette" />
            </span>

            <span className="admin-sidebar-link-label">
              Appearance
            </span>
          </button>

          <button
            type="button"
            className="admin-sidebar-link admin-sidebar-logout"
            title={sidebarCollapsed ? "Logout" : undefined}
            onClick={onLogout}
          >
            <span className="admin-sidebar-link-icon">
              <DashboardIcon name="logout" />
            </span>

            <span className="admin-sidebar-link-label">
              Logout
            </span>
          </button>

        </div>
      </aside>

      {/* Main workspace */}
      <div className="admin-workspace">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-mobile-menu-button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open navigation menu"
              aria-controls="admin-sidebar"
              aria-expanded={mobileSidebarOpen}
            >
              <DashboardIcon name="menu" />
            </button>

            <div>
              <span className="admin-topbar-eyebrow">
                WEIGHBRIDGE CLOUD
              </span>
              <h1>{currentPageTitle}</h1>
            </div>
          </div>

          <div className="admin-topbar-user">
            <span className="admin-topbar-welcome">
              Welcome, <strong>{username}</strong>
            </span>

            <div className="admin-user-avatar" aria-hidden="true">
              {String(username || "A")
                .charAt(0)
                .toUpperCase()}
            </div>
          </div>
        </header>

        <div className="admin-main-area">
          {showAppearance && (
            <section
              id="admin-appearance-panel"
              className="admin-appearance-panel"
              aria-label="Appearance settings"
            >
              <ThemeSelector />
            </section>
          )}

          <section className="admin-content">
            {/* Dashboard */}
            {activeTab === "dashboard" && (
              <div className="dashboard-home">
                <div className="dashboard-welcome">
                  <div className="dashboard-welcome-copy">
                    <span className="dashboard-label">ADMIN WORKSPACE</span>
                    <h2>Welcome back, {username || "Admin"}</h2>
                    <p>Monitor your weighbridge network, manage master records, and keep your operations moving.</p>
                    <div className="dashboard-welcome-actions">
                      <button type="button" className="dashboard-hero-primary" onClick={() => handleNavigation("masters")}>Manage masters <DashboardIcon name="arrow" size={16} /></button>
                      <button type="button" className="dashboard-hero-secondary" onClick={() => handleNavigation("report")}>View reports</button>
                    </div>
                  </div>
                  <div className="dashboard-hero-art" aria-hidden="true">
                    <div className="dashboard-hero-ring dashboard-hero-ring-one" />
                    <div className="dashboard-hero-ring dashboard-hero-ring-two" />
                    <div className="dashboard-hero-symbol"><DashboardIcon name="masters" size={54} /></div>
                  </div>
                </div>

                <section className="dashboard-insights" aria-label="Dashboard insights">
                  <div className="dashboard-insights-header">
                    <div>
                      <h3>Operations Overview</h3>
                      <p>Live information from your registered records</p>
                    </div>
                    <button
                      type="button"
                      className="dashboard-insights-refresh"
                      onClick={loadInsights}
                      disabled={insightsLoading || !accessToken}
                    >
                      {insightsLoading ? "Refreshing..." : "Refresh"}
                    </button>
                  </div>

                  {insightsError && (
                    <p className="dashboard-insights-error" role="alert">
                      {insightsError}
                    </p>
                  )}

                  <div className="dashboard-insights-grid" aria-busy={insightsLoading}>
                    {insightCards.map((card) => (
                      <div className={`dashboard-insight-card dashboard-insight-${card.key}`} key={card.key}>
                        <div className="dashboard-insight-top">
                          <span className="dashboard-insight-label">{card.label}</span>
                          <span className="dashboard-insight-icon"><DashboardIcon name={card.icon} size={21} /></span>
                        </div>
                        <strong className="dashboard-insight-value">
                          {insightsLoading && !insights ? "..." : insights?.[card.key] ?? "—"}
                        </strong>
                        <span className="dashboard-insight-note">{card.note}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="dashboard-shortcuts-heading">
                  <div><h3>Quick access</h3><p>Jump into your daily management tasks</p></div>
                </div>
                <div className="dashboard-shortcuts">
                  <button
                    type="button"
                    className="dashboard-shortcut"
                    onClick={() => handleNavigation("masters")}
                  >
                    <span className="shortcut-icon">
                      <DashboardIcon name="masters" size={23} />
                    </span>

                    <strong>Master Management</strong>

                    <span>
                      Manage weighbridges, sites,
                      addresses and other master data.
                    </span>

                    <span className="shortcut-link">
                      Open Masters
                      <DashboardIcon name="arrow" size={15} />
                    </span>
                  </button>

                  <button
                    type="button"
                    className="dashboard-shortcut"
                    onClick={() => handleNavigation("registration")}
                  >
                    <span className="shortcut-icon">
                      <DashboardIcon name="users" size={23} />
                    </span>

                    <strong>User Management</strong>

                    <span>
                      Register users and manage existing
                      user records.
                    </span>

                    <span className="shortcut-link">
                      Manage Users
                      <DashboardIcon name="arrow" size={15} />
                    </span>
                  </button>

                  <button
                    type="button"
                    className="dashboard-shortcut"
                    onClick={() => handleNavigation("report")}
                  >
                    <span className="shortcut-icon">
                      <DashboardIcon name="reports" size={23} />
                    </span>

                    <strong>Reports</strong>

                    <span>
                      Access available weighbridge
                      reports and records.
                    </span>

                    <span className="shortcut-link">
                      View Reports
                      <DashboardIcon name="arrow" size={15} />
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Masters */}
            {activeTab === "masters" && (
              <div className="masters-section">
                <div className="admin-section-heading">
                  <h2>Master Management</h2>
                  <p>
                    Manage master records used throughout
                    the application.
                  </p>
                </div>

                <nav
                  className="master-tabs"
                  aria-label="Master management"
                >
                  {masterTabs.map((master) => (
                    <button
                      key={master.id}
                      type="button"
                      className={`master-tab ${
                        activeMaster === master.id
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        setActiveMaster(master.id)
                      }
                      aria-current={
                        activeMaster === master.id
                          ? "page"
                          : undefined
                      }
                    >
                      {master.label}
                    </button>
                  ))}
                </nav>

                <div className="master-content">
                  {activeMaster === "weighbridge" && (
                    <WeighBridge accessToken={accessToken} />
                  )}

                  {activeMaster === "sites" && (
                    <Sites accessToken={accessToken} />
                  )}

                  {activeMaster === "addresses" && (
                    <Addresses accessToken={accessToken} />
                  )}

                  {activeMaster === "users" && (
                   <User
                      accessToken={accessToken}
                      currentUserRole={role}
                      refreshKey={usersRefreshKey}
                    />
                  )}

                  {activeMaster === "roles" && (
                    <Roles accessToken={accessToken} />
                  )}

                  {activeMaster === "statuses" && (
                    <Statuses accessToken={accessToken} />
                  )}

                  {activeMaster === "units" && (
                    <UnitMaster />
                  )}

                  {activeMaster === "productTypes" && (
                    <ProductTypeMaster />
                  )}

                  {activeMaster === "products" && (
                    <ProductMaster />
                  )}

                  {["parties", "vehicles"].includes(activeMaster) && (
                    <div
                      style={{
                        marginBottom: "24px",
                        padding: "20px",
                        border: "1px solid var(--border-color)",
                        borderRadius: "12px",
                        background: "var(--surface)",
                      }}
                    >
                      <label
                        htmlFor="admin-site-select"
                        style={{ display: "block", marginBottom: "10px", fontWeight: 600 }}
                      >
                        Select Weighbridge Site
                      </label>

                      <select
                        id="admin-site-select"
                        value={selectedSiteId}
                        onChange={(event) => setSelectedSiteId(event.target.value)}
                        disabled={sitesLoading}
                        style={{ width: "100%", maxWidth: "400px", padding: "12px" }}
                      >
                        <option value="">-- Select Site --</option>

                        {sites.map((site) => (
                          <option key={site.id} value={site.id}>
                            {site.siteName}
                          </option>
                        ))}
                      </select>

                      {sitesLoading && <p>Loading sites...</p>}
                      {sitesError && <p role="alert">{sitesError}</p>}
                    </div>
                  )}

                  {activeMaster === "parties" && selectedSiteId && (
                      <PartyMaster
                        key={`party-${selectedSiteId}`}
                        siteId={Number(selectedSiteId)}
                      />
                    )}

                    {activeMaster === "vehicles" && selectedSiteId && (
                      <VehicleMaster
                        key={`vehicle-${selectedSiteId}`}
                        siteId={Number(selectedSiteId)}
                      />
                    )}
                </div>
              </div>
            )}

            {/* User Registration */}
            {activeTab === "registration" && (
              <div className="user-management-section">
                <UserRegistration
                  accessToken={accessToken}
                  onUserRegistered={handleUserRegistered}
                />

                <User
                  accessToken={accessToken}
                  refreshKey={usersRefreshKey}
                />
              </div>
            )}

            {/* Weighment Analytics - synchronized MySQL data */}
            {activeTab === "analytics" && (
              <div className="masters-section">
                <div className="admin-section-heading">
                  <h2>Weighment Analytics</h2>
                  <p>Analyze synchronized weighment transactions by site.</p>
                </div>
                <div className="master-content">
                  <div className="wa-site-selector">
                    <label htmlFor="weighbridge-site">
                      Select Weighbridge Site
                    </label>

                    <select
                      id="weighbridge-site"
                      className="wa-site-select"
                      value={selectedSiteId}
                      onChange={(e) => setSelectedSiteId(e.target.value)}
                    >
                      <option value="">-- Select Site --</option>

                      {sites.map((site) => (
                        <option key={site.id} value={site.id}>
                          {site.siteName}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedSiteId && !sitesError && (
                    <WeighmentAnalytics key={selectedSiteId} siteId={Number(selectedSiteId)} />
                  )}
                </div>
              </div>
            )}

            {/* Reports */}
            {activeTab === "report" && (
              <Reports accessToken={accessToken} />
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

export default AdminDashboard;
