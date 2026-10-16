import { useState } from "react";
import { registerUser } from "../api/authApi";
import "../style/Register.css";

function UserRegistration({ accessToken }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!username.trim()) {
      setError("Enter a username.");
      return;
    }

    if (
      password.trim().length === 0 ||
      password.length < 8 ||
      new TextEncoder().encode(password).length > 72
    ) {
      setError(
        "Password must have at least 8 characters and at most 72 UTF-8 bytes."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const result = await registerUser(accessToken, {
        username: username.trim(),
        password,
      });

      setSuccess(`${result.username} registered successfully.`);
      setUsername("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="registration">
      <h2>User Registration</h2>
      <p>Create a user account for the weighbridge application.</p>

      <form className="registration-form" onSubmit={handleSubmit}>
        <label htmlFor="new-username">Username</label>
        <input
          id="new-username"
          autoComplete="off"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          maxLength={100}
          disabled={loading}
          required
        />

        <label htmlFor="new-password">Password</label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          disabled={loading}
          required
        />

        <label htmlFor="confirm-password">Confirm Password</label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          disabled={loading}
          required
        />

        {error && <p className="registration-error" role="alert">{error}</p>}
        {success && (
          <p className="registration-success" role="status">{success}</p>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register User"}
        </button>
      </form>
    </div>
  );
}

export default UserRegistration;