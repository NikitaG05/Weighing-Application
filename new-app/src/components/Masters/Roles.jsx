import { useCallback, useEffect, useState } from "react";
import { getRoles, createRole, updateRole, deleteRole } from "../../api/rolesApi";
import "../../style/Roles.css";
import ActionButtons from "../ActionButtons";

const emptyForm = { roleCode: "", roleName: "", enabled: true };
const isSystemRole = (code) => ["ADMIN", "USER"].includes(String(code || "").toUpperCase());

function Roles({ accessToken }) {
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadRoles = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError("");
    try {
      const data = await getRoles(accessToken);
      setRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.detail || "Unable to load roles.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((previous) => ({ ...previous, [name]: type === "checkbox" ? checked : value }));
  };

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!form.roleCode.trim() || !form.roleName.trim()) {
      setError("Role code and role name are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        roleCode: form.roleCode.trim().toUpperCase(),
        roleName: form.roleName.trim(),
        enabled: form.enabled,
      };
      if (editingId !== null) {
        await updateRole(accessToken, editingId, payload);
      } else {
        await createRole(accessToken, payload);
      }
      resetForm();
      await loadRoles();
      setSuccess(editingId !== null ? "Role updated successfully." : "Role created successfully.");
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.detail || "Unable to save role.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (role) => {
    setEditingId(role.id);
    setForm({ roleCode: role.roleCode || "", roleName: role.roleName || "", enabled: Boolean(role.enabled) });
    setError("");
    setSuccess("");
  };

  const handleDelete = async (role) => {
    if (isSystemRole(role.roleCode)) {
      setError("System roles cannot be deleted.");
      return;
    }
    if (!window.confirm(`Delete role "${role.roleName}"?`)) return;
    setError("");
    setSuccess("");
    setDeletingId(role.id);
    try {
      await deleteRole(accessToken, role.id);
      if (editingId === role.id) resetForm();
      await loadRoles();
      setSuccess("Role deleted successfully.");
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.detail || "Unable to delete role.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="roles-page">
      <header className="roles-page-header">
        <h2>Role Management</h2>
        <p className="roles-description">Create and manage application roles and their availability.</p>
      </header>

      <form className="roles-form" onSubmit={handleSubmit}>
        <div className="roles-form-heading">
          <h3>{editingId !== null ? "Edit Role" : "Add New Role"}</h3>
          <p>{editingId !== null ? "Update the selected role details." : "Enter the details to register a new role."}</p>
        </div>
        <div className="roles-form-grid">
          <div className="roles-field">
            <label htmlFor="roleCode">Role Code <span aria-hidden="true">*</span></label>
            <input id="roleCode" name="roleCode" value={form.roleCode} onChange={handleChange}
              placeholder="e.g. OPERATOR" maxLength={20} disabled={editingId !== null || saving} required />
          </div>
          <div className="roles-field">
            <label htmlFor="roleName">Role Name <span aria-hidden="true">*</span></label>
            <input id="roleName" name="roleName" value={form.roleName} onChange={handleChange}
              placeholder="e.g. Weighbridge Operator" maxLength={100} disabled={saving} required />
          </div>
          <div className="roles-field roles-status-field">
            <span className="roles-field-label">Role Status</span>
            <label className="roles-checkbox">
              <input type="checkbox" name="enabled" checked={form.enabled} onChange={handleChange}
                disabled={saving || (editingId !== null && isSystemRole(form.roleCode))} />
              <span>{form.enabled ? "Enabled" : "Disabled"}</span>
            </label>
          </div>
        </div>
        <div className="roles-actions">
          <button type="submit" className="roles-primary-button" disabled={saving}>
            {saving ? "Saving..." : editingId !== null ? "Update Role" : "Add Role"}
          </button>
          {editingId !== null && (
            <button type="button" className="roles-cancel" onClick={resetForm} disabled={saving}>Cancel</button>
          )}
        </div>
      </form>

      {error && <p className="roles-error" role="alert">{error}</p>}
      {success && <p className="roles-success" role="status">{success}</p>}

      <section className="roles-list" aria-label="Registered roles">
        <div className="roles-list-header">
          <div>
            <h3>Registered Roles</h3>
            <p>{roles.length} {roles.length === 1 ? "role" : "roles"} registered</p>
          </div>
          <button type="button" className="roles-refresh-button" onClick={loadRoles} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        {loading ? (
          <p className="roles-loading" role="status">Loading roles...</p>
        ) : (
          <div className="roles-table-wrapper">
            <table className="roles-table">
              <thead><tr><th>ID</th><th>Role Code</th><th>Role Name</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {roles.length === 0 ? (
                  <tr><td colSpan={5} className="roles-empty">No roles found.</td></tr>
                ) : roles.map((role) => (
                  <tr key={role.id}>
                    <td>{role.id}</td>
                    <td><span className="roles-code">{role.roleCode}</span></td>
                    <td>{role.roleName}</td>
                    <td><span className={`roles-status ${role.enabled ? "roles-status-enabled" : "roles-status-disabled"}`}>
                      {role.enabled ? "Enabled" : "Disabled"}
                    </span></td>
                    <td><ActionButtons onEdit={() => handleEdit(role)} onDelete={() => handleDelete(role)}
                      deleteDisabled={deletingId === role.id} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default Roles;
