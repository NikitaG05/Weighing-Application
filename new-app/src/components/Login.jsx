
import { useEffect, useState } from "react";

import {
  loginAdmin,
  getAdminDetails,
  getUserDetails,
} from "../api/authApi";

import AdminDashboard from "./AdminDashboard";
import UserDashboard from "./UserDashboard";

import "../style/Login.css";

const SESSION_KEY = "weighbridgeSession";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const storedSession = sessionStorage.getItem(SESSION_KEY);

        if (!storedSession) return;

        const saved = JSON.parse(storedSession);

        if (
          !saved?.accessToken ||
          !["ADMIN", "USER"].includes(saved.role)
        ) {
          sessionStorage.removeItem(SESSION_KEY);
          return;
        }

        const account =
          saved.role === "ADMIN"
            ? await getAdminDetails(saved.accessToken)
            : await getUserDetails(saved.accessToken);

        if (cancelled) return;

        setSession({
          accessToken: saved.accessToken,
          username: account.username || saved.username,
          role: saved.role,
        });
      } catch (err) {
        if (!cancelled) {
          console.error("Session restoration failed:", err);
          sessionStorage.removeItem(SESSION_KEY);
        }
      } finally {
        if (!cancelled) {
          setCheckingSession(false);
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginAdmin(username, password);

      if (!data.accessToken) {
        throw new Error("Login token not received.");
      }

      if (!["ADMIN", "USER"].includes(data.role)) {
        throw new Error("Unsupported account role.");
      }

      const account =
        data.role === "ADMIN"
          ? await getAdminDetails(data.accessToken)
          : await getUserDetails(data.accessToken);

      const newSession = {
        accessToken: data.accessToken,
        username: account.username || data.username || username,
        role: data.role,
      };

      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify(newSession)
      );

      setSession(newSession);
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
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
    setShowPassword(false);
    clearForm();
  }

  if (checkingSession) {
    return (
      <main className="login-page">
        <div className="login-loading">
          <span className="login-spinner" aria-hidden="true" />
          <p>Checking your session...</p>
        </div>
      </main>
    );
  }

  if (session?.role === "ADMIN") {
    return (
      <AdminDashboard
        username={session.username}
        accessToken={session.accessToken}
        role={session.role}
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
        <div className="login-topline" />

        <div className="login-header">
          <div className="login-brand-icon" aria-hidden="true">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3v3M5 7l-2 3M19 7l2 3" />
              <path d="M4 10h16l-1.5 10h-13L4 10Z" />
              <path d="M8 15h8M12 12v6" />
            </svg>
          </div>

          <div className="login-brand">
            <h1 id="login-heading">PRECISION</h1>
            <p>WEIGHING SYSTEMS</p>
          </div>

          <div className="login-heading">
            <h2>Welcome back</h2>
            <p>
              Sign in to access your weighment management
              system.
            </p>
          </div>
        </div>

        <form className="login-content" onSubmit={handleLogin}>
          <div className="login-row">
            <label htmlFor="username">Username</label>

            <div className="login-input-wrapper">
              <svg
                className="login-input-icon"
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
              </svg>

              <input
                id="username"
                name="username"
                type="text"
                placeholder="Enter your username"
                autoComplete="username"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                maxLength={100}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="login-row">
            <label htmlFor="password">Password</label>

            <div className="login-input-wrapper password-field">
              <svg
                className="login-input-icon"
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect
                  x="5"
                  y="10"
                  width="14"
                  height="11"
                  rx="2"
                />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>

              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                disabled={loading}
                required
              />

              <button
                className="password-toggle"
                type="button"
                onClick={() =>
                  setShowPassword((previous) => !previous)
                }
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
                aria-controls="password"
                aria-pressed={showPassword}
                disabled={loading}
              >
                <svg
                  width="19"
                  height="19"
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
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <div className="login-actions">
            <button
              className="login-button"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="button-spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <span aria-hidden="true">→</span>
                </>
              )}
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

        <footer className="login-footer">
          <span className="login-status-dot" />
          Secure Weighment Management
        </footer>
      </section>
    </main>
  );
}

export default Login;
