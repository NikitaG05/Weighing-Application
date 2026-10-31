
import { useCallback, useEffect, useMemo, useState } from "react";
import unitMasterApi from "../../api/UnitMasterApi";
import "../../style/UnitMaster.css";

const EMPTY_FORM = {
  unitCode: "",
  unitName: "",
  statusId: "1",
};

const UnitMaster = () => {
  const [units, setUnits] = useState([]);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Read logged-in user session
  const session = useMemo(() => {
    try {
      return JSON.parse(
        sessionStorage.getItem("weighbridgeSession") || "{}"
      );
    } catch {
      return {};
    }
  }, []);

  const isAdmin =
    String(session.role || "")
      .replace(/^ROLE_/i, "")
      .toUpperCase() === "ADMIN";

  // Load all units
  const loadUnits = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await unitMasterApi.getAllUnits();

      setUnits(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load units.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUnits();
  }, [loadUnits]);

  // Search and filter
  const filteredUnits = useMemo(() => {
    const query = search.trim().toLowerCase();

    return units.filter((unit) => {
      const matchesSearch =
        String(unit.unitCode || "")
          .toLowerCase()
          .includes(query) ||
        String(unit.unitName || "")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        unit.statusCode === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [units, search, statusFilter]);

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Create or update unit
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isAdmin || saving) return;

    setError("");
    setSuccess("");

    const unitCode = form.unitCode.trim().toUpperCase();
    const unitName = form.unitName.trim();

    if (!unitCode || !unitName) {
      setError("Unit code and unit name are required.");
      return;
    }

    const payload = {
      unitCode,
      unitName,
      statusId: Number(form.statusId),
    };

    try {
      setSaving(true);

      if (editingId !== null) {
        await unitMasterApi.updateUnit(editingId, payload);
        setSuccess("Unit updated successfully.");
      } else {
        await unitMasterApi.createUnit(payload);
        setSuccess("Unit created successfully.");
      }

      resetForm();

      const data = await unitMasterApi.getAllUnits();
      setUnits(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to save unit.");
    } finally {
      setSaving(false);
    }
  };

  // Populate form for editing
  const handleEdit = (unit) => {
    if (!isAdmin) return;

    setEditingId(unit.id);

    setForm({
      unitCode: unit.unitCode || "",
      unitName: unit.unitName || "",
      statusId: String(unit.statusId ?? 1),
    });

    setError("");
    setSuccess("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Delete unit
  const handleDelete = async (unit) => {
    if (!isAdmin || deletingId !== null) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${unit.unitName}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(unit.id);
      setError("");
      setSuccess("");

      await unitMasterApi.deleteUnit(unit.id);

      if (editingId === unit.id) {
        resetForm();
      }

      const data = await unitMasterApi.getAllUnits();
      setUnits(Array.isArray(data) ? data : []);

      setSuccess("Unit deleted successfully.");
    } catch (err) {
      setError(
        err.message ||
          "Unable to delete unit. It may be used by a product."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="um-page">
      {/* Page header */}
      <div className="um-header">
        <div>
          <h2>Unit Master</h2>
          <p>
            Manage measurement units shared across all
            weighbridge sites.
          </p>
        </div>

        <button
          type="button"
          className="um-button um-button-secondary"
          onClick={loadUnits}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="um-alert um-alert-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="um-alert um-alert-success" role="status">
          {success}
        </div>
      )}

      {/* Admin form */}
      {isAdmin && (
        <section className="um-card">
          <div className="um-section-heading">
            <h3>
              {editingId !== null ? "Edit Unit" : "Add Unit"}
            </h3>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="um-form-grid">
              <label className="um-field">
                <span>Unit Code *</span>
                <input
                  type="text"
                  name="unitCode"
                  value={form.unitCode}
                  onChange={handleChange}
                  placeholder="e.g. TON"
                  maxLength={30}
                  required
                />
              </label>

              <label className="um-field">
                <span>Unit Name *</span>
                <input
                  type="text"
                  name="unitName"
                  value={form.unitName}
                  onChange={handleChange}
                  placeholder="e.g. Ton"
                  maxLength={100}
                  required
                />
              </label>

              <label className="um-field">
                <span>Status *</span>
                <select
                  name="statusId"
                  value={form.statusId}
                  onChange={handleChange}
                  required
                >
                  <option value="1">Active</option>
                  <option value="2">Inactive</option>
                </select>
              </label>
            </div>

            <div className="um-form-actions">
              <button
                type="submit"
                className="um-button um-button-primary"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId !== null
                    ? "Update Unit"
                    : "Add Unit"}
              </button>

              <button
                type="button"
                className="um-button um-button-secondary"
                onClick={resetForm}
                disabled={saving}
              >
                Clear
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Unit list */}
      <section className="um-card">
        <div className="um-section-heading">
          <h3>Unit List</h3>
          <span className="um-count">
            {filteredUnits.length} Records
          </span>
        </div>

        <div className="um-toolbar">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by code or name..."
            aria-label="Search units"
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            aria-label="Filter by status"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div className="um-table-wrapper">
          <table className="um-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Unit Code</th>
                <th>Unit Name</th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 5 : 4}
                    className="um-empty"
                  >
                    Loading units...
                  </td>
                </tr>
              ) : filteredUnits.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 5 : 4}
                    className="um-empty"
                  >
                    No units found.
                  </td>
                </tr>
              ) : (
                filteredUnits.map((unit) => (
                  <tr key={unit.id}>
                    <td>{unit.id}</td>
                    <td>
                      <strong>{unit.unitCode}</strong>
                    </td>
                    <td>{unit.unitName}</td>
                    <td>
                      <span
                        className={`um-status ${
                          unit.statusCode === "ACTIVE"
                            ? "um-status-active"
                            : "um-status-inactive"
                        }`}
                      >
                        {unit.statusName || unit.statusCode}
                      </span>
                    </td>

                    {isAdmin && (
                      <td>
                        <div className="um-row-actions">
                          <button
                            type="button"
                            className="um-button um-button-edit"
                            onClick={() => handleEdit(unit)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="um-button um-button-delete"
                            onClick={() => handleDelete(unit)}
                            disabled={deletingId !== null}
                          >
                            {deletingId === unit.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default UnitMaster;
