import { useEffect, useState } from "react";
import { getMyWeighmentSites, getUserWeighments } from "../api/UserWeighmentApi";
import { getParties } from "../api/partyApi";
import { getVehicles } from "../api/vehicleApi";
import UserWeighments from "./UserWeighments";
import WeighmentReports from "./Reports/WeighmentReports";
import WeighmentAnalytics from "./Reports/WeighmentAnalytics";
import ThemeSelector from "./ThemeSelector";
import "../style/AdminDashboard.css";
import "../style/UserWeighments.css";

const menus = [
  ["dashboard", "Dashboard", "\u25A6"],
  ["parties", "Party Master", "\u2659"],
  ["vehicles", "Vehicle Master", "\u25A4"],
  ["products", "Products", "\u25A3"],
  ["weighments", "Weighments", "\u2696"],
  ["reports", "Reports", "\u25A4"],
  ["analytics", "Analytics", "\u25A5"],
  ["appearance", "Appearance", "\u2699"]
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
        <div><h2>{title}</h2><p>Read-only site records</p></div>
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
            <img className="admin-brand-logo" src={`${process.env.PUBLIC_URL}/favicon.ico`} alt="TareX" />
            {!collapsed && <div className="admin-brand-text"><strong>TareX</strong><span>Cloud Workspace</span></div>}
          </div>
          <button type="button" className="admin-sidebar-header-toggle" aria-label="Toggle sidebar"
            onClick={() => { setCollapsed(v => !v); setMobileOpen(false); }}>
            {collapsed ? ">" : "<"}
          </button>
        </div>
        <div className="admin-sidebar-divider" />
        <nav className="admin-sidebar-nav">
          {!collapsed && <span className="admin-sidebar-section-label">WORKSPACE</span>}
          {menus.map(([id, label, icon]) => (
            <button type="button" key={id} title={label}
              className={`admin-sidebar-link ${active === id ? "active" : ""}`}
              onClick={() => navigate(id)}>
              <span className="admin-sidebar-link-icon">{icon}</span>
              {!collapsed && <span className="admin-sidebar-link-label">{label}</span>}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <button className="admin-sidebar-logout" type="button" onClick={onLogout}>Logout</button>
        </div>
      </aside>

      <div className="admin-workspace">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button className="admin-mobile-menu-button" type="button" aria-label="Open menu"
              onClick={() => setMobileOpen(v => !v)}>Menu</button>
            <div><span className="admin-topbar-eyebrow">WEIGHBRIDGE CLOUD</span><h2>{title}</h2></div>
          </div>
          <div className="admin-topbar-user">
            <span className="admin-topbar-welcome">Welcome, {username}</span>
            <span className="admin-user-avatar">{(username || "U").charAt(0).toUpperCase()}</span>
          </div>
        </header>

        <main className="admin-main-area">
          <div className="admin-content">
            {active !== "appearance" && active !== "weighments" &&
              <div className="uw-filters">
                <label>Weighbridge Site
                  <select value={siteId} disabled={sitesLoading || !sites.length}
                    onChange={e => changeSite(e.target.value)}>
                    {!sites.length && <option value="">No assigned sites</option>}
                    {sites.map(s => <option key={s.id} value={String(s.id)}>{s.siteName}</option>)}
                  </select>
                </label>
              </div>
            }

            {siteError && <p className="uw-error" role="alert">{siteError}</p>}

            {active === "appearance" && <ThemeSelector />}
            {active === "weighments" && <UserWeighments />}

            {active !== "appearance" && active !== "weighments" && (
              sitesLoading ? <p>Loading assigned sites...</p> :
              !siteId ? <p>No weighbridge site assigned to your account.</p> :
              <>
                {active === "dashboard" && (
                  <div className="dashboard-home">
                    <section className="dashboard-welcome">
                      <div className="dashboard-welcome-copy">
                        <span className="dashboard-welcome-label">USER WORKSPACE</span>
                        <h1>Welcome back, {username}</h1>
                        <p>View your synchronized weighbridge data for {siteName}.</p>
                        <div className="dashboard-welcome-actions">
                          <button className="dashboard-hero-primary" onClick={() => navigate("weighments")}>View Weighments</button>
                          <button className="dashboard-hero-secondary" onClick={() => navigate("reports")}>View Reports</button>
                        </div>
                      </div>
                      <div className="dashboard-hero-art" aria-hidden="true">
                        <div className="dashboard-hero-ring dashboard-hero-ring-one" />
                        <div className="dashboard-hero-ring dashboard-hero-ring-two" />
                        <span className="dashboard-hero-symbol">TareX</span>
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
                              <span className="dashboard-insight-icon">&#9638;</span>
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
                          <span className="shortcut-icon">{icon}</span>
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