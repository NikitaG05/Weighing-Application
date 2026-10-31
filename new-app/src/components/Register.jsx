
import { useState } from "react";
import { registerUser } from "../api/authApi";
import "../style/Register.css";

function UserRegistration({ accessToken, onUserRegistered }) {
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("USER");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const cleanFullName = fullName.trim();
    const cleanMobile = mobileNumber.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    if (!cleanFullName || cleanFullName.length > 100) {
      setError("Full name must contain 1 to 100 characters.");
      return;
    }

    if (!/^[0-9]{10}$/.test(cleanMobile)) {
      setError("Mobile number must contain exactly 10 digits.");
      return;
    }

    if (
      cleanEmail.length > 150 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      setError("Enter a valid email address.");
      return;
    }

    if (!cleanUsername || cleanUsername.length > 100) {
      setError("Username must contain 1 to 100 characters.");
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

    if (!["ADMIN", "USER"].includes(role)) {
      setError("Select a valid role.");
      return;
    }

    setLoading(true);

    try {
      const result = await registerUser(accessToken, {
        fullName: cleanFullName,
        mobileNumber: cleanMobile,
        email: cleanEmail,
        username: cleanUsername,
        password,
        role,
      });

      setSuccess(`${result.username} registered successfully.`);

      setFullName("");
      setMobileNumber("");
      setEmail("");
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      setRole("USER");

      // Refresh the User List below the registration form.
      onUserRegistered?.();
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  
return (
  <div>
    <h2>User Registration</h2>
    <p>Create and manage user accounts for the weighbridge application.</p>

    <form className="registration-form" onSubmit={handleSubmit}>

      <div className="form-group">
        <label htmlFor="new-full-name">Full Name</label>
        <input
          id="new-full-name"
          type="text"
          placeholder="Enter full name"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          maxLength={100}
          disabled={loading}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="new-mobile-number">Mobile Number</label>
        <input
          id="new-mobile-number"
          type="tel"
          inputMode="numeric"
          placeholder="Enter 10-digit mobile number"
          autoComplete="tel"
          value={mobileNumber}
          onChange={(e) =>
            setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))
          }
          disabled={loading}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="new-email">Email Address</label>
        <input
          id="new-email"
          type="email"
          placeholder="Enter email address"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={150}
          disabled={loading}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="new-username">Username</label>
        <input
          id="new-username"
          type="text"
          placeholder="Create username"
          autoComplete="off"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={100}
          disabled={loading}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="new-password">Password</label>
        <input
          id="new-password"
          type="password"
          placeholder="Minimum 8 characters"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          disabled={loading}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="confirm-password">Confirm Password</label>
        <input
          id="confirm-password"
          type="password"
          placeholder="Re-enter password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="new-role">User Role</label>
        <select
          id="new-role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          disabled={loading}
          required
        >
          <option value="USER">User</option>
          <option value="ADMIN">Administrator</option>
        </select>
      </div>

      {error && (
        <p className="registration-error" role="alert">
          {error}
        </p>
      )}

      {success && (
        <p className="registration-success" role="status">
          {success}
        </p>
      )}

      <button type="submit" disabled={loading}>
        {loading ? "Registering..." : "Register User"}
      </button>
    </form>
  </div>
);

}

export default UserRegistration;
