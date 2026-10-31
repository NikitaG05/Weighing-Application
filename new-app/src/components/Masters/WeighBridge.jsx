
import { useCallback, useEffect, useState } from "react";
import "../../style/WeighBridge.css";
import { getSites } from "../../api/sitesApi";
import ActionButtons from "../ActionButtons";

const API_BASE = `${
  process.env.REACT_APP_API_URL || ""
}/api`;

function WeighBridge({ accessToken }) {
  const [sites, setSites] = useState([]);
  const [weighbridges, setWeighbridges] = useState([]);

  const [form, setForm] = useState({
    weighbridgeName: "",
    siteId: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const request = useCallback(
    async (path, options = {}) => {
        const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            ...options.headers,
        },
        });

        if (!response.ok) {
        let message = `Request failed (${response.status})`;

        try {
            const data = await response.json();
            message = data.message || data.error || message;
        } catch {
            // Keep default error message.
        }

        throw new Error(message);
        }

        if (response.status === 204) return null;

        return response.json();
    },
    [accessToken]
    );

    const loadData = useCallback(async () => {
    if (!accessToken) return;

    setLoading(true);
    setError("");

    try {
        const [siteData, weighbridgeData] = await Promise.all([
        getSites(accessToken),
        request("/weighbridges"),
        ]);

        console.log("Registered Sites:", siteData);

        setSites(
        Array.isArray(siteData) ? siteData : []
        );

        setWeighbridges(
        Array.isArray(weighbridgeData) ? weighbridgeData : []
        );
    } catch (err) {
        console.error("Weighbridge loading error:", err);
        setError(err.message || "Unable to load weighbridge data.");
    } finally {
        setLoading(false);
    }
    }, [accessToken, request]);


  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedSite = sites.find(
    (site) => String(site.id) === String(form.siteId)
  );

  // Address is populated from Site Master data.
    const selectedAddress = selectedSite
    ? [
        selectedSite.city,
        selectedSite.state,
        selectedSite.pincode,
        ]
        .filter(Boolean)
        .join(", ")
    : "";


  const resetForm = () => {
    setForm({
      weighbridgeName: "",
      siteId: "",
    });
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.weighbridgeName.trim()) {
      setError("Please enter a weighbridge name.");
      return;
    }

    if (!form.siteId) {
      setError("Please select a site.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        weighbridgeName: form.weighbridgeName.trim(),
        siteId: Number(form.siteId),
      };

      if (editingId !== null) {
        await request(`/weighbridges/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        setSuccess("Weighbridge updated successfully.");
      } else {
        await request("/weighbridges", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setSuccess("Weighbridge registered successfully.");
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (weighbridge) => {
    setEditingId(weighbridge.id);
    setForm({
      weighbridgeName: weighbridge.weighbridgeName,
      siteId: String(weighbridge.siteId),
    });
    setViewing(null);
    setError("");
    setSuccess("");
  };

  const handleDelete = async (weighbridge) => {
    const confirmed = window.confirm(
      `Delete weighbridge "${weighbridge.weighbridgeName}"?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await request(`/weighbridges/${weighbridge.id}`, {
        method: "DELETE",
      });

      if (editingId === weighbridge.id) {
        resetForm();
      }

      if (viewing?.id === weighbridge.id) {
        setViewing(null);
      }

      setSuccess("Weighbridge deleted successfully.");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="weighbridge-master">
      <div className="weighbridge-heading">
        <span className="weighbridge-eyebrow">MASTER DATA / WEIGHBRIDGES</span>
        <h3>Weighbridge Master</h3>
        <p>Register and manage weighbridges.</p>
      </div>

      {error && (
        <div className="weighbridge-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="weighbridge-success" role="status">
          {success}
        </div>
      )}

      <form
        className="weighbridge-form"
        onSubmit={handleSubmit}
      >
        <h4 className="weighbridge-section-title">
          {editingId !== null
            ? "Update Weighbridge"
            : "Register Weighbridge"}
        </h4>

        <div className="weighbridge-form-grid">
          <div className="weighbridge-field">
            <label htmlFor="weighbridge-name">
              Weighbridge Name *
            </label>
            <input
              id="weighbridge-name"
              type="text"
              maxLength={150}
              value={form.weighbridgeName}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  weighbridgeName: event.target.value,
                }))
              }
              placeholder="Enter weighbridge name"
              required
            />
          </div>
          
            <div className="weighbridge-field">
                <label htmlFor="weighbridge-site">
                    Site Name *
                </label>

                <select
                id="weighbridge-site"
                value={form.siteId}
                onChange={(event) =>
                    setForm((previous) => ({
                    ...previous,
                    siteId: event.target.value,
                    }))
                }
                required
                >
                <option value="">Select Site</option>

                {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                    {site.siteName}
                    </option>
                ))}
                </select>
            </div>

          <div className="weighbridge-field">
            <label htmlFor="weighbridge-address">
              Site Address
            </label>
            <input
              id="weighbridge-address"
              type="text"
              value={selectedAddress}
              placeholder="Auto-filled from selected site"
              readOnly
            />
          </div>
        </div>

        <p className="weighbridge-form-note">
          <span className="weighbridge-note-icon" aria-hidden="true">i</span>
          Weighbridge ID is generated automatically.
          Total Trips starts at 0.
        </p>

        <div className="weighbridge-form-actions">
          <button
            type="submit"
            className="weighbridge-primary-button"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : editingId !== null
              ? "Update Weighbridge"
              : "Register Weighbridge"}
          </button>

          {editingId !== null && (
            <button
              type="button"
              className="weighbridge-secondary-button"
              onClick={resetForm}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="weighbridge-list">
        <div className="weighbridge-list-header">
          <div className="weighbridge-list-heading">
            <h4>Registered Weighbridges</h4>
            <span className="weighbridge-count">{weighbridges.length} records</span>
          </div>

          <button
            type="button"
            className="weighbridge-secondary-button"
            onClick={loadData}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="weighbridge-loading" role="status">Loading weighbridges...</p>
        ) : (
          <div className="weighbridge-table-wrapper">
            <table className="weighbridge-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Weighbridge Name</th>
                  <th>Site Name</th>
                  <th>Address</th>
                  <th>Total Trips</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {weighbridges.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="weighbridge-empty">
                      No weighbridges registered yet.
                    </td>
                  </tr>
                ) : (
                  weighbridges.map((weighbridge) => (
                    <tr key={weighbridge.id}>
                      <td>{weighbridge.id}</td>
                      <td className="weighbridge-name-cell">{weighbridge.weighbridgeName}</td>
                      <td>{weighbridge.siteName}</td>
                      <td>{weighbridge.address || "-"}</td>
                      <td><span className="weighbridge-trip-count">{weighbridge.totalTrips ?? 0}</span></td>
                      
                      <td>
                        <ActionButtons
                          onView={() => setViewing(weighbridge)}
                          onEdit={() => handleEdit(weighbridge)}
                          onDelete={() => handleDelete(weighbridge)}
                        />
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewing && (
        <div className="weighbridge-details">
          <div className="weighbridge-list-header">
            <h4>Weighbridge Details</h4>

            <button
              type="button"
              className="weighbridge-secondary-button"
              onClick={() => setViewing(null)}
            >
              Close
            </button>
          </div>

          <div className="weighbridge-details-grid">
            <p><strong>ID:</strong> {viewing.id}</p>
            <p>
              <strong>Name:</strong> {viewing.weighbridgeName}
            </p>
            <p>
              <strong>Site:</strong> {viewing.siteName}
            </p>
            <p>
              <strong>Address:</strong> {viewing.address || "-"}
            </p>
            <p>
              <strong>Total Trips:</strong> {viewing.totalTrips ?? 0}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default WeighBridge;
