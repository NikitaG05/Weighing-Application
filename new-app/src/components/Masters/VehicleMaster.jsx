
import { useEffect, useMemo, useState } from "react";
import { getParties } from "../../api/partyApi";
import { getVehicles, saveVehicle } from "../../api/vehicleApi";
import "../../style/VehicleMaster.css";

const emptyVehicle = {
  vehicleNo: "",
  partyId: "",
  driverName: "",
  tareWeight: "",
};

function VehicleMaster({ siteId, onDataChange }) {
  const [vehicles, setVehicles] = useState([]);
  const [parties, setParties] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [partyFilter, setPartyFilter] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...emptyVehicle });

  const loadData = async () => {
    if (siteId == null) {
      setVehicles([]);
      setParties([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [vehicleData, partyData] = await Promise.all([
        getVehicles(siteId),
        getParties(siteId),
      ]);

      setVehicles(
        Array.isArray(vehicleData) ? vehicleData : []
      );

      setParties(
        Array.isArray(partyData) ? partyData : []
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [siteId]);

  const filteredVehicles = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return vehicles.filter((vehicle) => {
      const matchesSearch = [
        vehicle.vehicleNo,
        vehicle.partyName,
        vehicle.driverName,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(keyword)
      );

      const matchesParty =
        !partyFilter ||
        String(vehicle.partyId) === partyFilter;

      return matchesSearch && matchesParty;
    });
  }, [vehicles, search, partyFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredVehicles.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const visibleVehicles = filteredVehicles.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const updateFilter = (setter, value) => {
    setter(value);
    setPage(1);
  };

  const openAddForm = () => {
    setForm({ ...emptyVehicle });
    setEditing(false);
    setError("");
    setMessage("");
    setShowForm(true);
  };

  const openEditForm = (vehicle) => {
    setForm({
      id: vehicle.id,
      vehicleNo: vehicle.vehicleNo || "",
      partyId: String(vehicle.partyId ?? ""),
      driverName: vehicle.driverName || "",
      tareWeight: vehicle.tareWeight ?? "",
    });

    setEditing(true);
    setError("");
    setMessage("");
    setShowForm(true);
  };

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!form.vehicleNo.trim()) {
      setError("Vehicle Number is required.");
      return;
    }

    if (!form.partyId) {
      setError("Please select a Party.");
      return;
    }

    const normalizedVehicleNo = form.vehicleNo
      .replace(/\s+/g, "")
      .toUpperCase();

    if (normalizedVehicleNo.length > 30) {
      setError(
        "Vehicle Number cannot exceed 30 characters."
      );
      return;
    }

    if (
      form.tareWeight !== "" &&
      (!Number.isFinite(Number(form.tareWeight)) ||
        Number(form.tareWeight) < 0)
    ) {
      setError("Enter a valid non-negative Tare Weight.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await saveVehicle({
        siteId: Number(siteId),
        vehicleNo: normalizedVehicleNo,
        partyId: Number(form.partyId),
        driverName: form.driverName.trim() || null,
        tareWeight:
          form.tareWeight === ""
            ? null
            : Number(form.tareWeight),
      });

      setShowForm(false);
      setMessage(
        editing
          ? "Vehicle updated successfully."
          : "Vehicle saved successfully."
      );

      await loadData();
      onDataChange?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="vehicle-master">
      <div className="vehicle-master-header">
        <div>
          <h2>Vehicle Master List</h2>
          <p>
            Add, search and manage weighbridge Vehicles.
          </p>
        </div>

        <button
          type="button"
          className="vehicle-primary-btn"
          onClick={openAddForm}
          disabled={siteId == null || loading}
        >
          + Add Vehicle
        </button>
      </div>

      {message && (
        <p className="vehicle-success" role="status">
          {message}
        </p>
      )}

      {error && (
        <p className="vehicle-error" role="alert">
          {error}
        </p>
      )}

      {!showForm && (
        <>
          <div className="vehicle-filters">
            <input
              type="search"
              placeholder="Search vehicle, party or driver..."
              value={search}
              onChange={(event) =>
                updateFilter(setSearch, event.target.value)
              }
            />

            <select
              value={partyFilter}
              onChange={(event) =>
                updateFilter(setPartyFilter, event.target.value)
              }
            >
              <option value="">All Parties</option>

              {parties.map((party) => (
                <option
                  key={party.id}
                  value={String(party.id)}
                >
                  {party.partyName}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="vehicle-secondary-btn"
              onClick={() => {
                setSearch("");
                setPartyFilter("");
                setPage(1);
              }}
            >
              Clear Filters
            </button>

            <button
              type="button"
              className="vehicle-secondary-btn"
              onClick={loadData}
              disabled={loading}
            >
              Refresh
            </button>
          </div>

          <div className="vehicle-table-wrapper">
            <table className="vehicle-table">
              <thead>
                <tr>
                  <th>Vehicle No</th>
                  <th>Party Name</th>
                  <th>Driver Name</th>
                  <th>Tare Weight</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5">
                      Loading Vehicles...
                    </td>
                  </tr>
                ) : visibleVehicles.length === 0 ? (
                  <tr>
                    <td colSpan="5">
                      No Vehicles found.
                    </td>
                  </tr>
                ) : (
                  visibleVehicles.map((vehicle) => (
                    <tr key={vehicle.id}>
                      <td>{vehicle.vehicleNo}</td>
                      <td>{vehicle.partyName || "-"}</td>
                      <td>{vehicle.driverName || "-"}</td>
                      <td>
                        {vehicle.tareWeight ?? "-"}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="vehicle-edit-btn"
                          onClick={() =>
                            openEditForm(vehicle)
                          }
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="vehicle-pagination">
            <span>
              Showing{" "}
              {filteredVehicles.length === 0
                ? 0
                : (currentPage - 1) * pageSize + 1}
              {"–"}
              {Math.min(
                currentPage * pageSize,
                filteredVehicles.length
              )}{" "}
              of {filteredVehicles.length}
            </span>

            <div className="vehicle-pagination-controls">
              <label htmlFor="vehicle-page-size">
                Rows per page
              </label>

              <select
                id="vehicle-page-size"
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>

              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() =>
                  setPage(currentPage - 1)
                }
              >
                Previous
              </button>

              <span>
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setPage(currentPage + 1)
                }
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {showForm && (
        <form
          className="vehicle-form"
          onSubmit={handleSave}
        >
          <h3>
            {editing
              ? "Edit Vehicle"
              : "Add New Vehicle"}
          </h3>

          <p className="vehicle-form-hint">
            Cloud Record ID:{" "}
            {editing
              ? form.id
              : "Auto-generated on save"}
          </p>

          <div className="vehicle-form-grid">
            <label>
              Vehicle Number *
              <input
                name="vehicleNo"
                value={form.vehicleNo}
                onChange={updateField}
                maxLength={30}
                placeholder="MH14AB1234"
                required
                readOnly={editing}
              />
            </label>

            <label>
              Party Name *
              <select
                name="partyId"
                value={form.partyId}
                onChange={updateField}
                required
              >
                <option value="">
                  Select Party
                </option>

                {parties.map((party) => (
                  <option
                    key={party.id}
                    value={String(party.id)}
                  >
                    {party.partyName}
                    {" ("}
                    {party.partyCode}
                    {")"}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Driver Name
              <input
                name="driverName"
                value={form.driverName}
                onChange={updateField}
                maxLength={150}
                placeholder="Enter Driver Name"
              />
            </label>

            <label>
              Tare Weight
              <input
                name="tareWeight"
                type="number"
                min="0"
                step="0.01"
                value={form.tareWeight}
                onChange={updateField}
                placeholder="Enter Tare Weight"
              />
            </label>
          </div>

          <p className="vehicle-form-hint">
            Tare Weight can be entered manually.
            Automatic weighbridge reading will be
            integrated with the desktop application later.
          </p>

          <div className="vehicle-form-actions">
            <button
              type="button"
              className="vehicle-secondary-btn"
              onClick={() => {
                setShowForm(false);
                setError("");
              }}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="vehicle-primary-btn"
              disabled={saving || parties.length === 0}
            >
              {saving
                ? "Saving..."
                : editing
                ? "Update Vehicle"
                : "Save Vehicle"}
            </button>
          </div>

          {parties.length === 0 && !loading && (
            <p className="vehicle-error">
              No Parties are available for this site.
              Please create a Party first.
            </p>
          )}
        </form>
      )}
    </section>
  );
}

export default VehicleMaster;
