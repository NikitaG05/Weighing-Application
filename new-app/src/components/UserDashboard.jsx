import { useEffect, useState } from "react";
import { getMyWeighmentSites, getUserWeighments } from "../api/UserWeighmentApi";
import { getParties } from "../api/partyApi";
import { getVehicles } from "../api/vehicleApi";
import UserWeighments from "./UserWeighments";
import WeighmentReports from "./Reports/WeighmentReports";
import WeighmentAnalytics from "./Reports/WeighmentAnalytics";
import ThemeSelector from "./ThemeSelector";
import UserWeighbridgeStatus from "./UserWeighbridgeStatus";
import "../style/AdminDashboard.css";
import "../style/UserWeighments.css";

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
    key: <><circle cx="8" cy="15" r="4" /><path d="M11 12 21 2M17 6l3 3M15 8l3 3" /></>,
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

const menus = [
  ["dashboard", "Dashboard", "dashboard"],
  ["parties", "Party Master", "users"],
  ["vehicles", "Vehicle Master", "reports"],
  ["products", "Products", "masters"],
  ["weighments", "Report", "reports"],
  ["reports", "WB Reports", "reports"],
  ["analytics", "Analytics", "analytics"],
  ["appearance", "Appearance", "palette"], ["status", "Status", "check"]
];

function ReadOnlyTable({ title, rows, columns }) {
  const [search, setSearch] = useState("");
  const filtered = rows.filter(row =>
    columns.some(([key]) =>
      String(row[key] ?? "").toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <section className="uw-root">
      <div className="uw-heading">
        <div><h1>{title}</h1><p>Read-only site records</p></div>
      </div>
      <div className="uw-panel">
        <div className="uw-filters">
          <label>Search
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search records..." />
          </label>
        </div>
        <div className="uw-table-wrap">
          <table>
            <thead><tr>{columns.map(([key, label]) => <th key={key}>{label}</th>)}</tr></thead>
            <tbody>
              {filtered.length === 0 ?
                <tr><td colSpan={columns.length}>No records found.</td></tr> :
                filtered.map((row, index) =>
                  <tr key={row.id ?? index}>
                    {columns.map(([key]) => <td key={key}>{row[key] ?? "-"}</td>)}
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default function UserDashboard({ username, onLogout }) {
  const [active, setActive] = useState("dashboard");
  const [openGroup, setOpenGroup] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState("");
  const [parties, setParties] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [records, setRecords] = useState([]);
  const [sitesLoading, setSitesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [siteError, setSiteError] = useState("");
  const [errors, setErrors] = useState({});
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getMyWeighmentSites(controller.signal)
      .then(data => {
        if (controller.signal.aborted) return;
        const list = Array.isArray(data) ? data : [];
        setSites(list);
        setSiteId(list.length ? String(list[0].id) : "");
      })
      .catch(err => {
        if (!controller.signal.aborted) setSiteError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setSitesLoading(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!siteId) return;
    let cancelled = false;
    setLoading(true);
    setErrors({});
    setParties([]);
    setVehicles([]);
    setRecords([]);

    Promise.allSettled([
      getParties(siteId),
      getVehicles(siteId),
      getUserWeighments(siteId)
    ]).then(results => {
      if (cancelled) return;
      const setters = [setParties, setVehicles, setRecords];
      const names = ["parties", "vehicles", "records"];
      const failures = {};
      results.forEach((result, i) => {
        if (result.status === "fulfilled" && Array.isArray(result.value)) {
          setters[i](result.value);
        } else {
          failures[names[i]] = result.reason?.message || "Unable to load data.";
        }
      });
      setErrors(failures);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [siteId, refresh]);

  const navigate = id => {
    setActive(id);
    setMobileOpen(false);
  };

  const changeSite = id => {
    setParties([]);
    setVehicles([]);
    setRecords([]);
    setErrors({});
    setLoading(true);
    setSiteId(id);
  };

  const products = [...new Set(records.map(r => r.productName?.trim()).filter(Boolean))]
    .sort().map(productName => ({ productName }));

  const completed = records.filter(r => r.completed === true).length;
  const siteName = sites.find(s => String(s.id) === siteId)?.siteName || "";
  const title = menus.find(m => m[0] === active)?.[1];

  const cards = [
    ["Total Parties", parties.length, "parties"],
    ["Total Vehicles", vehicles.length, "vehicles"],
    ["Products Weighed", products.length, "records"],
    ["Total Weighments", records.length, "records"],
    ["Completed", completed, "records"],
    ["Pending", records.length - completed, "records"]
  ];

  return (
    <div className={`admin-page ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className={`admin-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="admin-sidebar-brand">
          <div className="admin-brand-identity">
            <img className="admin-sidebar-logo" src={`${process.env.PUBLIC_URL}/favicon.ico`} alt="TareX" />
            {!collapsed && <div className="admin-brand-text"><strong>TareX</strong><span>WEIGHING SYSTEMS</span></div>}
          </div>
          <button type="button" className="admin-sidebar-header-toggle" aria-label="Toggle sidebar"
            onClick={() => { setCollapsed(v => !v); setMobileOpen(false); }}>
            <DashboardIcon name={collapsed ? "chevronRight" : "close"} />
          </button>
        </div>
        <div className="admin-sidebar-divider" />
        <nav className="admin-sidebar-nav">
  {!collapsed && <span className="admin-sidebar-section-label">WORKSPACE</span>}
  {[
    ["dashboard", "Dashboard", "dashboard", []],
    ["master", "Master", "masters", ["parties", "vehicles", "products"]],
    ["reportGroup", "Reports", "reports", ["weighments", "reports"]],
    ["status", "Status", "check", []]
  ].map(([id, label, icon, children]) => (
    <div key={id}>
      <button type="button" title={label}
        className={`admin-sidebar-link ${active === id || children.includes(active) ? "active" : ""}`}
        aria-expanded={children.length ? openGroup === id : undefined}
        onClick={() => {
          if (children.length) {
            setCollapsed(false);
            setOpenGroup(v => v === id ? "" : id);
          } else {
            setOpenGroup("");
            navigate(id);
          }
        }}>
        <span className="admin-sidebar-link-icon"><DashboardIcon name={icon} /></span>
        {!collapsed && <span className="admin-sidebar-link-label">{label}</span>}
        {!collapsed && children.length > 0 && <span>{openGroup === id ? "-" : "+"}</span>}
      </button>
      {!collapsed && openGroup === id && children.map(child => (
        <button type="button" key={child}
          className={`admin-sidebar-link ${active === child ? "active" : ""}`}
          style={{ paddingLeft: "32px", fontSize: "13px" }}
          onClick={() => navigate(child)}>
          <span className="admin-sidebar-link-label">{menus.find(m => m[0] === child)?.[1]}</span>
        </button>
      ))}
    </div>
  ))}
</nav>
        
      </aside>

      <div className="admin-workspace">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button className="admin-mobile-menu-button" type="button" aria-label="Open menu"
              onClick={() => setMobileOpen(v => !v)}><DashboardIcon name="menu" /></button>
            <div><span className="admin-topbar-eyebrow">WEIGHBRIDGE CLOUD</span><h1>{title}</h1></div>
          </div>
          <div className="admin-topbar-user" style={{ position: "relative" }}>
  <span className="admin-topbar-welcome">Welcome, {username}</span>
  <button type="button" className="admin-user-avatar"
    aria-label="Account menu" aria-expanded={profileOpen}
    onClick={() => setProfileOpen(v => !v)}>
    {(username || "U").charAt(0).toUpperCase()}
  </button>
  {profileOpen && (
    <div style={{ position: "absolute", right: 0, top: "100%", zIndex: 100, background: "#17365d", padding: "10px", borderRadius: "8px", minWidth: "160px" }}>
      <button type="button" className="admin-sidebar-link"
        onClick={() => { navigate("appearance"); setProfileOpen(false); }}>
        Appearance
      </button>
      <button type="button" className="admin-sidebar-link" onClick={onLogout}>
        Logout
      </button>
    </div>
  )}
</div>
        </header>

        <main className="admin-main-area">
          <div className="admin-content">
            {active !== "appearance" && active !== "weighments" && active !== "status" &&
              <div className="wa-site-selector">
                <label>Weighbridge Site
                  <select className="wa-site-select" value={siteId} disabled={sitesLoading || !sites.length}
                    onChange={e => changeSite(e.target.value)}>
                    {!sites.length && <option value="">No assigned sites</option>}
                    {sites.map(s => <option key={s.id} value={String(s.id)}>{s.siteName}</option>)}
                  </select>
                </label>
              </div>
            }

            {siteError && <p className="uw-error" role="alert">{siteError}</p>}

            {active === "appearance" && <ThemeSelector />}
            {active === "status" && <UserWeighbridgeStatus />}
            {active === "weighments" && <UserWeighments />}

            {active !== "appearance" && active !== "weighments" && active !== "status" && (
              sitesLoading ? <p>Loading assigned sites...</p> :
              !siteId ? <p>No weighbridge site assigned to your account.</p> :
              <>
                {active === "dashboard" && (
                  <div className="dashboard-home">
                    <section className="dashboard-welcome">
                      <div className="dashboard-welcome-copy">
                        <span className="dashboard-label">USER WORKSPACE</span>
                        <h2>Welcome back, {username}</h2>
                        <p>View your synchronized weighbridge data for {siteName}.</p>
                        <div className="dashboard-welcome-actions">
                          <button className="dashboard-hero-primary" onClick={() => navigate("weighments")}>View Weighments</button>
                          <button className="dashboard-hero-secondary" onClick={() => navigate("reports")}>View Reports</button>
                        </div>
                      </div>
                      <div className="dashboard-hero-art" aria-hidden="true">
                        <div className="dashboard-hero-ring dashboard-hero-ring-one" />
                        <div className="dashboard-hero-ring dashboard-hero-ring-two" />
                        <div className="dashboard-hero-symbol"><DashboardIcon name="masters" size={54} /></div>
                      </div>
                    </section>

                    <section className="dashboard-insights">
                      <div className="dashboard-insights-header">
                        <div><h3>Operations Overview</h3><p>{siteName} - Read-only access</p></div>
                        <button className="dashboard-insights-refresh" disabled={loading}
                          onClick={() => setRefresh(v => v + 1)}>Refresh</button>
                      </div>
                      {Object.entries(errors).map(([key, message]) =>
                        <p className="dashboard-insights-error" key={key}>{key}: {message}</p>
                      )}
                      <div className="dashboard-insights-grid">
                        {cards.map(([label, value, source]) => (
                          <div className="dashboard-insight-card" key={label}>
                            <div className="dashboard-insight-top">
                              <span className="dashboard-insight-label">{label}</span>
                              <span className="dashboard-insight-icon"><DashboardIcon name={source === "parties" ? "users" : source === "vehicles" ? "sites" : label === "Completed" ? "check" : label === "Pending" ? "pause" : "masters"} size={21} /></span>
                            </div>
                            <strong className="dashboard-insight-value">
                              {loading ? "..." : errors[source] ? "-" : value}
                            </strong>
                            <span className="dashboard-insight-note">Selected site</span>
                          </div>
                        ))}
                      </div>
                    </section>
                    <div className="dashboard-shortcuts-heading"><h3>Quick Access</h3></div>
                    <div className="dashboard-shortcuts">
                      {menus.filter(m => ["parties","vehicles","products","weighments","reports","analytics"].includes(m[0])).map(([id,label,icon]) =>
                        <button key={id} className="dashboard-shortcut" onClick={() => navigate(id)}>
                          <span className="shortcut-icon"><DashboardIcon name={icon} /></span>
                          <strong>{label}</strong><span>View site records</span>
                          <span className="shortcut-link">Open &rarr;</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {["parties","vehicles","products"].includes(active) && (
                  loading ? <p>Loading records...</p> :
                  errors[active === "products" ? "records" : active] ?
                    <p role="alert">{errors[active === "products" ? "records" : active]}</p> :
                    active === "parties" ?
                      <ReadOnlyTable key={`party-${siteId}`} title="Party Master" rows={parties}
                        columns={[["partyCode","Code"],["partyName","Party Name"],["city","City"],["mobileNo","Mobile"],["gstNo","GST No."]]} /> :
                    active === "vehicles" ?
                      <ReadOnlyTable key={`vehicle-${siteId}`} title="Vehicle Master" rows={vehicles}
                        columns={[["vehicleNo","Vehicle No."],["partyName","Party"],["driverName","Driver"],["tareWeight","Tare Weight"]]} /> :
                      <ReadOnlyTable key={`product-${siteId}`} title="Products in Weighment Records" rows={products}
                        columns={[["productName","Product Name"]]} />
                )}

                {active === "reports" && <WeighmentReports key={siteId} siteId={siteId} readOnly />}
                {active === "analytics" && <WeighmentAnalytics key={siteId} siteId={siteId} readOnly />}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}