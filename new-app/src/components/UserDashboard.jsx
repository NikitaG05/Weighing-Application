
import { useEffect, useState } from "react";

import "../style/AdminDashboard.css";
import WeighmentAnalytics from "../components/Reports/WeighmentAnalytics";
import "../style/UserDashboard.css";
import WeighmentReports from "../components/Reports/WeighmentReports";
import { getParties } from "../api/partyApi";
import { getVehicles } from "../api/vehicleApi";

import PartyMaster from "../components/Masters/PartyMaster";
import VehicleMaster from "../components/Masters/VehicleMaster";
import ProductMaster from "../components/Masters/ProductMaster";
import UserWeighments from "../components/UserWeighments";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: "▦" },
  { id: "parties", label: "Party Master", icon: "♙" },
  { id: "vehicles", label: "Vehicle Master", icon: "▤" },
  { id: "products", label: "Product Master", icon: "▣" },
  { id: "weighments", label: "Weighments", icon: "⚖" },
  { id: "reports", label: "Reports", icon: "▥" },
  {id: "analytics",label: "Analytics",icon: "▥",},
];

function UserDashboard({ username, onLogout }) {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [parties, setParties] = useState([]);
  const [partyLoading, setPartyLoading] = useState(true);
  const [partyError, setPartyError] = useState("");

  const [vehicles, setVehicles] = useState([]);
  const [vehicleLoading, setVehicleLoading] = useState(true);
  const [vehicleError, setVehicleError] = useState("");

  // Temporary test site.
  // Replace with authenticated user's assigned site later.
  const siteId = 1;

  useEffect(() => {
    let cancelled = false;

    const loadDashboardData = async () => {
      setPartyLoading(true);
      setVehicleLoading(true);
      setPartyError("");
      setVehicleError("");

      const [partyResult, vehicleResult] =
        await Promise.allSettled([
          getParties(siteId),
          getVehicles(siteId),
        ]);

      if (cancelled) {
        return;
      }

      if (partyResult.status === "fulfilled") {
        setParties(
          Array.isArray(partyResult.value)
            ? partyResult.value
            : []
        );
      } else {
        setParties([]);
        setPartyError(
          partyResult.reason?.message ||
            "Unable to fetch Party Master records."
        );
      }

      if (vehicleResult.status === "fulfilled") {
        setVehicles(
          Array.isArray(vehicleResult.value)
            ? vehicleResult.value
            : []
        );
      } else {
        setVehicles([]);
        setVehicleError(
          vehicleResult.reason?.message ||
            "Unable to fetch Vehicle Master records."
        );
      }

      setPartyLoading(false);
      setVehicleLoading(false);
    };

    loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, [siteId]);

  const refreshParties = async () => {
    try {
      setPartyError("");
      const data = await getParties(siteId);
      setParties(Array.isArray(data) ? data : []);
    } catch (error) {
      setPartyError(
        error.message || "Unable to refresh Parties."
      );
    }
  };

  const refreshVehicles = async () => {
    try {
      setVehicleError("");
      const data = await getVehicles(siteId);
      setVehicles(Array.isArray(data) ? data : []);
    } catch (error) {
      setVehicleError(
        error.message || "Unable to refresh Vehicles."
      );
    }
  };

  const activeItem = menuItems.find(
    (item) => item.id === activeMenu
  );

  const recentParties = [...parties]
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    )
    .slice(0, 5);

  return (
    <div className="user-layout">
      {/* Sidebar */}
      <aside
        className={`user-sidebar ${
          sidebarCollapsed ? "collapsed" : ""
        }`}
      >
        <div className="user-brand">
          {!sidebarCollapsed && (
            <div className="user-brand-text">
              <span className="user-brand-eyebrow">
                WEIGHBRIDGE CLOUD
              </span>
              <h2>TareX Cloud</h2>
              <p>Weighbridge Management</p>
            </div>
          )}

          <button
            type="button"
            className="user-sidebar-toggle"
            onClick={() =>
              setSidebarCollapsed((previous) => !previous)
            }
            aria-label={
              sidebarCollapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
            aria-expanded={!sidebarCollapsed}
            title={
              sidebarCollapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
          >
            {sidebarCollapsed ? "☰" : "«"}
          </button>
        </div>

        {!sidebarCollapsed && (
          <span className="user-nav-caption">
            WORKSPACE
          </span>
        )}

        <nav
          className="user-navigation"
          aria-label="Main navigation"
        >
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              title={
                sidebarCollapsed ? item.label : undefined
              }
              aria-label={item.label}
              aria-current={
                activeMenu === item.id
                  ? "page"
                  : undefined
              }
              className={`user-nav-item ${
                activeMenu === item.id ? "active" : ""
              }`}
              onClick={() => setActiveMenu(item.id)}
            >
              <span className="user-nav-icon">
                {item.icon}
              </span>

              {!sidebarCollapsed && (
                <span className="user-nav-label">
                  {item.label}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="user-sidebar-footer">
          <button
            type="button"
            className="user-logout"
            title="Logout"
            aria-label="Logout"
            onClick={onLogout}
          >
            {sidebarCollapsed ? "⏻" : "Logout"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="user-main">
        <header className="user-topbar">
          <div>
            <span className="user-page-eyebrow">
              WEIGHBRIDGE CLOUD
            </span>
            <h1>{activeItem?.label || "Dashboard"}</h1>
          </div>

          <div className="user-profile">
            <span className="user-profile-greeting">
              Welcome, <strong>{username}</strong>
            </span>

            <span className="user-avatar">
              {username?.charAt(0)?.toUpperCase() || "U"}
            </span>

            <div>
              <strong>{username}</strong>
              <small>USER</small>
            </div>
          </div>
        </header>

        {/* Dashboard */}
        {activeMenu === "dashboard" && (
          <>
            <section className="user-welcome">
              <span className="user-banner-eyebrow">
                OVERVIEW
              </span>

              <h2>Welcome to your workspace</h2>

              <p>
                Manage your weighbridge information,
                Party Master, vehicles, products, and
                reports from one dashboard.
              </p>
            </section>

            {/* Statistics */}
            <section className="user-stats">
              <div className="user-stat-card">
                <span>Total Parties</span>

                <h2>
                  {partyLoading
                    ? "..."
                    : partyError
                    ? "—"
                    : parties.length}
                </h2>

                <p>Party Master records</p>
              </div>

              <div className="user-stat-card">
                <span>Total Vehicles</span>

                <h2>
                  {vehicleLoading
                    ? "..."
                    : vehicleError
                    ? "—"
                    : vehicles.length}
                </h2>

                <p>Vehicle Master records</p>
              </div>

              <div className="user-stat-card">
                <span>Total Weighments</span>
                <h2>—</h2>
                <p>Weighment transactions</p>
              </div>

              <div className="user-stat-card">
                <span>Reports</span>
                <h2>—</h2>
                <p>Available reports</p>
              </div>
            </section>

            {vehicleError && (
              <p role="alert">{vehicleError}</p>
            )}

            {/* Quick Access */}
            <section className="user-section-card user-quick-access">
              <div
                className="user-section-icon"
                aria-hidden="true"
              >
                ▦
              </div>

              <h3>Party Management</h3>

              <p>
                Open Party Master to view your
                weighbridge customer records.
              </p>

              <button
                type="button"
                className="user-primary-button"
                onClick={() => setActiveMenu("parties")}
              >
                Open Party Master
              </button>
            </section>

            {/* Vehicle Quick Access */}
            <section className="user-section-card user-quick-access">
              <div
                className="user-section-icon"
                aria-hidden="true"
              >
                ▤
              </div>

              <h3>Vehicle Management</h3>

              <p>
                Add vehicles, assign Parties, manage
                drivers, and maintain tare weights.
              </p>

              <button
                type="button"
                className="user-primary-button"
                onClick={() => setActiveMenu("vehicles")}
              >
                Open Vehicle Master
              </button>
            </section>

            {/* Recent Parties */}
            <section className="user-section-card user-recent-section">
              <div className="user-parties-heading">
                <h3>Recent Parties</h3>

                <button
                  type="button"
                  className="user-primary-button"
                  onClick={() => setActiveMenu("parties")}
                >
                  View All Parties
                </button>
              </div>

              {partyLoading ? (
                <p>Loading Party records...</p>
              ) : partyError ? (
                <p role="alert">{partyError}</p>
              ) : recentParties.length === 0 ? (
                <p>No Party records found.</p>
              ) : (
                <div className="user-party-table-wrapper">
                  <table className="user-party-table">
                    <thead>
                      <tr>
                        <th>Party Code</th>
                        <th>Party Name</th>
                        <th>City</th>
                        <th>Mobile</th>
                        <th>GST No</th>
                      </tr>
                    </thead>

                    <tbody>
                      {recentParties.map((party) => (
                        <tr key={party.id}>
                          <td>{party.partyCode}</td>
                          <td>{party.partyName}</td>
                          <td>{party.city || "-"}</td>
                          <td>{party.mobileNo || "-"}</td>
                          <td>{party.gstNo || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {/* Party Master */}
        {activeMenu === "parties" && (
          <PartyMaster
            siteId={siteId}
            onDataChange={refreshParties}
          />
        )}

        {/* Vehicle Master */}
        {activeMenu === "vehicles" && (
          <VehicleMaster
            siteId={siteId}
            onDataChange={refreshVehicles}
          />
        )}

        {/* Product Master - shared with Admin */}
        {activeMenu === "products" && <ProductMaster />}

        {activeMenu === "weighments" && <UserWeighments />}

        {activeMenu === "reports" && (
          <WeighmentReports siteId={siteId} />
        )}

        {activeMenu === "analytics" && (
          <WeighmentAnalytics siteId={siteId} />
        )}

        {/* Other Modules */}
      {![
          "dashboard",
          "parties",
          "vehicles",
          "products",
          "weighments",
          "reports",
          "analytics",
        ].includes(activeMenu) && (
          <section className="user-section-card">
            <h2>Module Under Development</h2>
            <p>
              This module will be integrated with the
              TareX Cloud Application in an upcoming step.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

export default UserDashboard;
