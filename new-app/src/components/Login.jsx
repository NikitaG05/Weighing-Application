import { useState } from "react";
import {
  loginAdmin,
  getAdminDetails,
  getUserDetails,
} from "../api/authApi";
import AdminDashboard from "./AdminDashboard";
import "../style/Login.css";
import UserDashboard from "./UserDashboard";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

 async function handleLogin(event) {
  event.preventDefault();
  setError("");
  setLoading(true);

  try {
    const data = await loginAdmin(username, password);

    if (!["ADMIN", "USER"].includes(data.role)) {
      throw new Error("Unsupported account role.");
    }

    const account =
      data.role === "ADMIN"
        ? await getAdminDetails(data.accessToken)
        : await getUserDetails(data.accessToken);

    setSession({
      accessToken: data.accessToken,
      username: account.username || data.username,
      role: data.role,
    });

    setPassword("");
  } catch (err) {
    setError(err.message || "Login failed. Please try again.");
  } finally {
    setLoading(false);
  }
}

  function clearForm() {
    setUsername("");
    setPassword("");
    setError("");
  }

  function handleLogout() {
    setSession(null);
    clearForm();
  }

  if (session?.role === "ADMIN") {
      return (
        <AdminDashboard
          username={session.username}
          accessToken={session.accessToken}
          onLogout={handleLogout}
        />
      );
    }

    if (session?.role === "USER") {
      return (
        <UserDashboard
          username={session.username}
          accessToken={session.accessToken}
          onLogout={handleLogout}
        />
      );
    }

  return (
    <main className="login-page">
      <section
        className="login-panel"
        aria-labelledby="login-heading"
      >
        <header className="login-title">
          Weighment Software
        </header>

        <div className="login-brand">
          <h1 id="login-heading">PRECISION</h1>
          <p>WEIGHING SYSTEMS</p>
        </div>

        <form className="login-content" onSubmit={handleLogin}>
          <div className="login-row">
            <label htmlFor="username">User Name</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              maxLength={100}
              disabled={loading}
              required
            />
          </div>

          <div className="login-row">
            <label htmlFor="password">Password</label>

            <div className="password-field">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={loading}
                required
              />

              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowPassword((previous) => !previous)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-controls="password"
                aria-pressed={showPassword}
                disabled={loading}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                  {showPassword && <path d="m3 3 18 18" />}
                </svg>
              </button>
            </div>
          </div>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <div className="login-actions">
            <button
              className="login-button"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Login"}
            </button>

            <button
              className="clear-button"
              type="button"
              onClick={clearForm}
              disabled={loading}
            >
              Clear
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default Login;