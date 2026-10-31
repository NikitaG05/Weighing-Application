
import { useEffect, useMemo, useState } from "react";
import { getParties, saveParty } from "../../api/partyApi";
import "../../style/PartyMaster.css";

const emptyParty = {
  partyCode: "",
  partyType: "CUSTOMER",
  partyName: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  pincode: "",
  mobileNo: "",
  emailId: "",
  gstNo: "",
  charges: "",
};

function PartyMaster({ siteId, onDataChange }) {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyParty);

  const loadParties = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getParties(siteId);
      setParties(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (siteId != null) {
      loadParties();
    }
  }, [siteId]);

  const partyTypes = useMemo(
    () =>
      [...new Set(parties.map((p) => p.partyType).filter(Boolean))]
        .sort(),
    [parties]
  );

  const cities = useMemo(
    () =>
      [...new Set(parties.map((p) => p.city).filter(Boolean))]
        .sort(),
    [parties]
  );

  const filteredParties = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return parties.filter((party) => {
      const matchesSearch = [
        party.partyCode,
        party.partyName,
        party.city,
        party.mobileNo,
        party.emailId,
        party.gstNo,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(keyword)
      );

      const matchesType =
        !typeFilter || party.partyType === typeFilter;

      const matchesCity =
        !cityFilter || party.city === cityFilter;

      return matchesSearch && matchesType && matchesCity;
    });
  }, [parties, search, typeFilter, cityFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredParties.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const visibleParties = filteredParties.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const updateFilter = (setter, value) => {
    setter(value);
    setPage(1);
  };

  const openAddForm = () => {
    setForm({ ...emptyParty });
    setEditing(false);
    setError("");
    setMessage("");
    setShowForm(true);
  };

  const openEditForm = (party) => {
    setForm({
        id: party.id,
        partyCode: party.partyCode || "",
        partyType: party.partyType || "CUSTOMER",
        partyName: party.partyName || "",
        addressLine1: party.addressLine1 || "",
        addressLine2: party.addressLine2 || "",
        city: party.city || "",
        pincode: party.pincode || "",
        mobileNo: party.mobileNo || "",
        emailId: party.emailId || "",
        gstNo: party.gstNo || "",
        charges: party.charges ?? "",
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

    if (!form.partyCode.trim() || !form.partyName.trim()) {
      setError("Party Code and Party Name are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await saveParty({
        siteId,
        ...form,
        partyCode: form.partyCode.trim(),
        partyName: form.partyName.trim(),
        city: form.city.trim(),
        pincode: form.pincode.trim() || null,
        charges:
          form.charges === "" ? null : Number(form.charges),
      });

      setShowForm(false);
      setMessage(
        editing
          ? "Party updated successfully."
          : "Party saved successfully."
      );

      await loadParties();
      onDataChange?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="party-master">
      <div className="party-master-header">
        <div>
          <h2>Party Master List</h2>
          <p>
            Add, search and manage weighbridge Parties.
          </p>
        </div>

        <button
          type="button"
          className="party-primary-btn"
          onClick={openAddForm}
          disabled={siteId == null}
        >
          + Add Party
        </button>
      </div>

      {message && (
        <p className="party-success" role="status">
          {message}
        </p>
      )}

      {error && (
        <p className="party-error" role="alert">
          {error}
        </p>
      )}

      {!showForm && (
        <>
          <div className="party-filters">
            <input
              type="search"
              placeholder="Search name, code, mobile, email, GST..."
              value={search}
              onChange={(e) =>
                updateFilter(setSearch, e.target.value)
              }
            />

            <select
              value={typeFilter}
              onChange={(e) =>
                updateFilter(setTypeFilter, e.target.value)
              }
            >
              <option value="">All Party Types</option>
              {partyTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <select
              value={cityFilter}
              onChange={(e) =>
                updateFilter(setCityFilter, e.target.value)
              }
            >
              <option value="">All Cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="party-secondary-btn"
              onClick={() => {
                setSearch("");
                setTypeFilter("");
                setCityFilter("");
                setPage(1);
              }}
            >
              Clear Filters
            </button>

            <button
              type="button"
              className="party-secondary-btn"
              onClick={loadParties}
              disabled={loading}
            >
              Refresh
            </button>
          </div>

          <div className="party-table-wrapper">
            <table className="party-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Party Name</th>
                  <th>Type</th>
                  <th>City</th>
                  <th>PIN Code</th>
                  <th>Mobile</th>
                  <th>Email</th>
                  <th>GST No</th>
                  <th>Charges</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10">Loading Parties...</td>
                  </tr>
                ) : visibleParties.length === 0 ? (
                  <tr>
                    <td colSpan="10">No Parties found.</td>
                  </tr>
                ) : (
                  visibleParties.map((party) => (
                    <tr key={party.id}>
                      <td>{party.partyCode}</td>
                      <td>{party.partyName}</td>
                      <td>{party.partyType || "-"}</td>
                      <td>{party.city || "-"}</td>
                      <td>{party.pincode || "-"}</td>
                      <td>{party.mobileNo || "-"}</td>
                      <td>{party.emailId || "-"}</td>
                      <td>{party.gstNo || "-"}</td>
                      <td>{party.charges ?? "-"}</td>
                      <td>
                        <button
                          type="button"
                          className="party-edit-btn"
                          onClick={() => openEditForm(party)}
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

          <div className="party-pagination">
            <span>
              Showing{" "}
              {filteredParties.length === 0
                ? 0
                : (currentPage - 1) * pageSize + 1}
              {"–"}
              {Math.min(
                currentPage * pageSize,
                filteredParties.length
              )}{" "}
              of {filteredParties.length}
            </span>

            <div className="party-pagination-controls">
              <label htmlFor="party-page-size">
                Rows per page
              </label>

              <select
                id="party-page-size"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
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
                onClick={() => setPage(currentPage - 1)}
              >
                Previous
              </button>

              <span>
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {showForm && (
        <form className="party-form" onSubmit={handleSave}>
          <h3>{editing ? "Edit Party" : "Add New Party"}</h3>

          <p className="party-form-hint">
            Cloud Record ID: {editing ? form.id : "Auto-generated on save"}
          </p>

          <div className="party-form-grid">
            <label>
              Party Code *
              <input
                name="partyCode"
                value={form.partyCode}
                onChange={updateField}
                required
                readOnly={editing}
              />
            </label>

            <label>
              Party Type
              <input
                name="partyType"
                value={form.partyType}
                onChange={updateField}
                placeholder="Party Type"
              />
            </label>

            <label>
              Party Name *
              <input
                name="partyName"
                value={form.partyName}
                onChange={updateField}
                required
              />
            </label>

            <label>
              Mobile Number
              <input
                name="mobileNo"
                value={form.mobileNo}
                onChange={updateField}
                inputMode="tel"
              />
            </label>

            <label>
              Email
              <input
                name="emailId"
                type="email"
                value={form.emailId}
                onChange={updateField}
              />
            </label>

            <label>
              GST Number
              <input
                name="gstNo"
                value={form.gstNo}
                onChange={updateField}
              />
            </label>

            <label>
              City
              <input
                name="city"
                value={form.city}
                onChange={updateField}
              />
            </label>

            <label>
              PIN Code
              <input
                name="pincode"
                value={form.pincode}
                onChange={updateField}
                inputMode="numeric"
                maxLength={6}
                pattern="[0-9]{6}"
                placeholder="Enter 6-digit PIN Code"
                title="PIN Code must contain 6 digits"
              />
            </label>

            <label>
              Charges
              <input
                name="charges"
                type="number"
                min="0"
                step="0.01"
                value={form.charges}
                onChange={updateField}
              />
            </label>

            <label>
              Address Line 1
              <input
                name="addressLine1"
                value={form.addressLine1}
                onChange={updateField}
              />
            </label>

            <label>
              Address Line 2
              <input
                name="addressLine2"
                value={form.addressLine2}
                onChange={updateField}
              />
            </label>
          </div>

          <p className="party-form-hint">
            PIN Code is resolved by the backend when the city
            matches a unique postal code.
          </p>

          <div className="party-form-actions">
            <button
              type="button"
              className="party-secondary-btn"
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
              className="party-primary-btn"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editing
                ? "Update Party"
                : "Save Party"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

export default PartyMaster;
