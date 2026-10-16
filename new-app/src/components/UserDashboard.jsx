import "../style/AdminDashboard.css";

function UserDashboard({ username, onLogout }) {
  return (
    <main className="admin-page">
      <div className="admin-container">
        <header className="admin-header">
          <div>
            <h1>User Dashboard</h1>
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

        <section className="admin-content">
          <h2>Welcome to Weighment Software</h2>
          <p>You are logged in successfully.</p>
        </section>
      </div>
    </main>
  );
}

export default UserDashboard;