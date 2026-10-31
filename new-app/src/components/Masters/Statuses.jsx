import { useCallback, useEffect, useState } from "react";
import { getStatuses, createStatus, updateStatus, deleteStatus } from "../../api/statusesApi";
import ActionButtons from "../ActionButtons";
import "../../style/Statuses.css";

const emptyForm = { statusCode: "", statusName: "", enabled: true };
const SYSTEM_STATUSES = ["ACTIVE", "INACTIVE"];

function Statuses({ accessToken }) {
  const [statuses, setStatuses] = useState([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadStatuses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getStatuses(accessToken);
      setStatuses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || "Unable to load statuses.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { loadStatuses(); }, [loadStatuses]);

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
    const statusCode = form.statusCode.trim().toUpperCase();
    const statusName = form.statusName.trim();
    if (!/^[A-Z][A-Z0-9_]{0,19}$/.test(statusCode)) {
      setError("Status code must start with a letter and contain only letters, numbers, or underscores.");
      return;
    }
    if (!statusName || statusName.length > 100) {
      setError("Status name must contain 1 to 100 characters.");
      return;
    }
    setSaving(true);
    try {
      const payload = { statusCode, statusName, enabled: form.enabled };
      if (editingId !== null) {
        await updateStatus(accessToken, editingId, payload);
      } else {
        await createStatus(accessToken, payload);
      }
      resetForm();
      await loadStatuses();
      setSuccess(editingId !== null ? "Status updated successfully." : "Status created successfully.");
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || "Unable to save status.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (status) => {
    setEditingId(status.id);
    setForm({ statusCode: status.statusCode, statusName: status.statusName, enabled: status.enabled });
    setError("");
    setSuccess("");
  };

  const handleDelete = async (status) => {
    if (SYSTEM_STATUSES.includes(status.statusCode)) {
      setError("System statuses cannot be deleted.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete "${status.statusName}"?`)) return;
    setDeletingId(status.id);
    setError("");
    setSuccess("");
    try {
      await deleteStatus(accessToken, status.id);
      if (editingId === status.id) resetForm();
      await loadStatuses();
      setSuccess("Status deleted successfully.");
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || "Unable to delete status.");
    } finally {
      setDeletingId(null);
    }
  };

  const isSystemStatus = SYSTEM_STATUSES.includes(form.statusCode);

  return (
    <div className="statuses-page">
      <header className="statuses-header">
        <h2>Status Management</h2>
        <p>Create and manage application status definitions.</p>
      </header>

      <form className="statuses-form" onSubmit={handleSubmit}>
        <div className="statuses-form-heading">
          <h3>{editingId !== null ? "Edit Status" : "Add New Status"}</h3>
          <p>Define a status code, display name and availability.</p>
        </div>
        <div className="statuses-form-grid">
          <div className="statuses-field">
            <label htmlFor="statusCode">Status Code <span aria-hidden="true">*</span></label>
            <input id="statusCode" name="statusCode" type="text" placeholder="e.g. PENDING" value={form.statusCode} onChange={handleChange} maxLength={20} disabled={editingId !== null || saving} required />
          </div>
          <div className="statuses-field">
            <label htmlFor="statusName">Status Name <span aria-hidden="true">*</span></label>
            <input id="statusName" name="statusName" type="text" placeholder="e.g. Pending Approval" value={form.statusName} onChange={handleChange} maxLength={100} disabled={saving} required />
          </div>
        </div>
        <div className="statuses-form-footer">
          <label className="statuses-checkbox">
            <input type="checkbox" name="enabled" checked={form.enabled} onChange={handleChange} disabled={saving || (editingId !== null && isSystemStatus)} />
            <span>Enabled</span>
          </label>
          <div className="statuses-form-actions">
            <button type="submit" disabled={saving} className="statuses-save-button">
              {saving ? "Saving..." : editingId !== null ? "Update Status" : "Add Status"}
            </button>
            {editingId !== null && (
              <button type="button" className="statuses-cancel-button" onClick={resetForm} disabled={saving}>Cancel</button>
            )}
          </div>
        </div>
      </form>

      {error && <p className="statuses-error" role="alert">{error}</p>}
      {success && <p className="statuses-success" role="status">{success}</p>}

      <section className="statuses-list" aria-label="Registered statuses">
        <div className="statuses-list-header">
          <div>
            <h3>Registered Statuses</h3>
            <p>{statuses.length} {statuses.length === 1 ? "status" : "statuses"} registered</p>
          </div>
          <button type="button" onClick={loadStatuses} disabled={loading} className="statuses-refresh-button module-refresh-button">
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        <div className="statuses-table-wrapper">
          <table className="statuses-table">
            <thead><tr><th>ID</th><th>Status Code</th><th>Status Name</th><th>Enabled</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="statuses-empty">Loading statuses...</td></tr>
              ) : statuses.length === 0 ? (
                <tr><td colSpan={5} className="statuses-empty">No statuses found.</td></tr>
              ) : statuses.map((status) => {
                const systemStatus = SYSTEM_STATUSES.includes(status.statusCode);
                return (
                  <tr key={status.id}>
                    <td>{status.id}</td>
                    <td><span className="statuses-code">{status.statusCode}</span></td>
                    <td>{status.statusName}</td>
                    <td><span className={`statuses-badge ${status.enabled ? "enabled" : "disabled"}`}>{status.enabled ? "Enabled" : "Disabled"}</span></td>
                    <td>
                      <ActionButtons
                        onEdit={() => handleEdit(status)}
                        onDelete={() => handleDelete(status)}
                        deleteDisabled={systemStatus || deletingId === status.id}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Statuses;
