import { useState } from "react";
import UserRegistration from "./Register";
import Reports from "./Report";
import "../style/AdminDashboard.css";

function AdminDashboard({ username, accessToken, onLogout }) {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <main className="admin-page">
      <div className="admin-container">
        <header className="admin-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Welcome, {username}</p>
          </div>

          <button
            className="logout-button"
            type="button"
            onClick={onLogout}
          >
            Logout
          </button>
        </header>

        <nav className="admin-tabs" aria-label="Admin navigation">
          <button
            type="button"
            className={`admin-tab ${
              activeTab === "dashboard" ? "active" : ""
            }`}
            onClick={() => setActiveTab("dashboard")}
          >
            Dashboard
          </button>

          <button
            type="button"
            className={`admin-tab ${
              activeTab === "registration" ? "active" : ""
            }`}
            onClick={() => setActiveTab("registration")}
          >
            User Registration
          </button>

          <button
            type="button"
            className={`admin-tab ${
              activeTab === "report" ? "active" : ""
            }`}
            onClick={() => setActiveTab("report")}
          >
            Reports
          </button>
        </nav>

        <section className="admin-content">
          {activeTab === "dashboard" && (
            <>
              <h2>Dashboard</h2>
              <p>Select a tab to manage users or view reports.</p>
            </>
          )}

          {activeTab === "registration" && (
            <UserRegistration accessToken={accessToken} />
          )}

          {activeTab === "report" && (
            <Reports accessToken={accessToken} />
          )}
        </section>
      </div>
    </main>
  );
}

export default AdminDashboard;