
import { useCallback, useEffect, useRef, useState } from "react";

import {
  lookupPincode,
  searchCity,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from "../../api/addressesApi";

import "../../style/Addresses.css";
import ActionButtons from "../ActionButtons";

const EMPTY_FORM = {
  pincode: "",
  city: "",
  state: "",
};

function Addresses({ accessToken }) {
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const lookupSequence = useRef(0);

  const [citySuggestions, setCitySuggestions] = useState([]);
  const [searchingCity, setSearchingCity] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);

  const citySearchSequence = useRef(0);
  const citySearchTimer = useRef(null);

  // Load all addresses
  const loadAddresses = useCallback(async () => {
    if (!accessToken) return;

    setLoading(true);
    setError("");

    try {
      const data = await getAddresses(accessToken);
      setAddresses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load addresses.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  // Clear pending city search on unmount.
  useEffect(() => {
    return () => {
      citySearchSequence.current += 1;
      lookupSequence.current += 1;
      if (citySearchTimer.current) clearTimeout(citySearchTimer.current);
    };
  }, []);

  function clearCityLookup() {
    citySearchSequence.current += 1;
    if (citySearchTimer.current) clearTimeout(citySearchTimer.current);
    citySearchTimer.current = null;
    setCitySuggestions([]);
    setShowCitySuggestions(false);
    setSearchingCity(false);
  }

  // Automatic PIN lookup
  async function handlePincodeChange(value) {
    clearCityLookup();
    const pincode = value.replace(/\D/g, "").slice(0, 6);

    const sequence = ++lookupSequence.current;

    setForm((prev) => ({
      ...prev,
      pincode,
      city: "",
      state: "",
    }));

    setError("");
    setSuccess("");
    setLookingUp(false);

    if (pincode.length !== 6) return;

    setLookingUp(true);

    try {
      const locations = await lookupPincode(
        accessToken,
        pincode
      );

      if (sequence !== lookupSequence.current) return;

      if (!Array.isArray(locations) || !locations.length) {
        throw new Error("No location found for this PIN code.");
      }

      setForm((prev) => ({
        ...prev,
        city: locations[0].city || "",
        state: locations[0].state || "",
      }));
    } catch (err) {
      if (sequence === lookupSequence.current) {
        setError(
          err.message ||
            "PIN lookup failed. Enter City and State manually."
        );
      }
    } finally {
      if (sequence === lookupSequence.current) {
        setLookingUp(false);
      }
    }
  }

  
  // Debounced city search. Results come from the postal directory API.
  function handleCityChange(value) {
    clearCityLookup();
    lookupSequence.current += 1;
    setLookingUp(false);
    setForm((prev) => ({ ...prev, city: value, state: "", pincode: "" }));
    setError("");
    setSuccess("");

    const term = value.trim();
    if (term.length < 2) return;

    const sequence = citySearchSequence.current;
    setShowCitySuggestions(true);
    setSearchingCity(true);
    citySearchTimer.current = setTimeout(async () => {
      try {
        const results = await searchCity(accessToken, term);
        if (sequence !== citySearchSequence.current) return;
        setCitySuggestions(Array.isArray(results) ? results : []);
      } catch (err) {
        if (sequence !== citySearchSequence.current) return;
        setError(err.message || "Unable to search city.");
        setCitySuggestions([]);
      } finally {
        if (sequence === citySearchSequence.current) setSearchingCity(false);
      }
    }, 350);
  }

  function selectCitySuggestion(location) {
    clearCityLookup();
    lookupSequence.current += 1;
    setLookingUp(false);
    setForm({
      city: location.city || "",
      state: location.state || "",
      pincode: location.pincode || "",
    });
    setError("");
    setSuccess("");
  }

  function handleEdit(address) {
    clearCityLookup();
    lookupSequence.current += 1;
    setLookingUp(false);

    setEditingId(address.id);

    setForm({
      pincode: address.pincode || "",
      city: address.city || "",
      state: address.state || "",
    });

    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    clearCityLookup();
    lookupSequence.current += 1;
    setLookingUp(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (lookingUp || searchingCity) {
      setError("Please wait for the location lookup to finish.");
      return;
    }

    if (!/^[1-9][0-9]{5}$/.test(form.pincode)) {
      setError("Enter a valid 6-digit Indian PIN code.");
      return;
    }

    if (!form.city.trim() || !form.state.trim()) {
      setError("City and State are required.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      pincode: form.pincode,
      city: form.city.trim(),
      state: form.state.trim(),
    };

    try {
      if (editingId !== null) {
        await updateAddress(accessToken, editingId, payload);
        setSuccess("Address updated successfully.");
      } else {
        await createAddress(accessToken, payload);
        setSuccess("Address added successfully.");
      }

      resetForm();
      await loadAddresses();
    } catch (err) {
      setError(err.message || "Unable to save address.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(address) {
    const confirmed = window.confirm(
      `Delete address ${address.city}, ${address.state} (${address.pincode})?`
    );

    if (!confirmed) return;

    setDeletingId(address.id);
    setError("");
    setSuccess("");

    try {
      await deleteAddress(accessToken, address.id);

      if (editingId === address.id) {
        resetForm();
      }

      setSuccess("Address deleted successfully.");
      await loadAddresses();
    } catch (err) {
      setError(err.message || "Unable to delete address.");
    } finally {
      setDeletingId(null);
    }
  }

  const filteredAddresses = addresses.filter((address) => {
    const term = search.toLowerCase().trim();

    return (
      String(address.id).includes(term) ||
      (address.city || "").toLowerCase().includes(term) ||
      (address.state || "").toLowerCase().includes(term) ||
      (address.pincode || "").includes(term)
    );
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAddresses.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedAddresses = filteredAddresses.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="addresses-master">
      <h2>Address Master</h2>

      <form
        className="addresses-form"
        onSubmit={handleSubmit}
      >
        <h3>
          {editingId !== null
            ? "Edit Address"
            : "Add New Address"}
        </h3>

        <div className="addresses-form-grid">
          <div className="addresses-field">
            <label htmlFor="address-pincode">
              PIN Code *
            </label>

            <input
              id="address-pincode"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter 6-digit PIN code"
              value={form.pincode}
              onChange={(event) =>
                handlePincodeChange(event.target.value)
              }
              disabled={saving}
              required
            />

            {lookingUp && (
              <small>Fetching City and State...</small>
            )}
          </div>

          <div className="addresses-field addresses-city-field">
            <label htmlFor="address-city">City *</label>
            <input
              id="address-city"
              type="text"
              maxLength={100}
              placeholder="Type a city, e.g. Pune"
              value={form.city}
              onChange={(event) => handleCityChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setShowCitySuggestions(false);
              }}
              autoComplete="off"
              disabled={saving}
              
              aria-controls="address-city-options"
              required
            />
            {searchingCity && <small>Searching Indian postal locations...</small>}
            {showCitySuggestions && !searchingCity && citySuggestions.length === 0 && (
              <small>No matches in the postal directory. You may enter the details manually.</small>
            )}
            {showCitySuggestions && citySuggestions.length > 0 && (
              <div id="address-city-options" className="addresses-city-suggestions">
                {citySuggestions.slice(0, 100).map((location, index) => (
                  <button
                    key={`${location.pincode}-${location.officeName}-${index}`}
                    type="button"
                    className="addresses-city-option"
                    onClick={() => selectCitySuggestion(location)}
                  >
                    <strong>{location.officeName || location.city}</strong>
                    <span>{location.city}, {location.state}</span>
                    <span className="addresses-pin-label">PIN: {location.pincode}</span>
                  </button>
                ))}
                {citySuggestions.length > 100 && (
                  <small>Showing first 100 matches. Type a more specific location.</small>
                )}
              </div>
            )}
          </div>

          <div className="addresses-field">
            <label htmlFor="address-state">
              State *
            </label>

            <input
              id="address-state"
              type="text"
              maxLength={100}
              placeholder="State"
              value={form.state}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  state: event.target.value,
                }))
              }
              disabled={saving}
              required
            />
          </div>
        </div>

        <p className="addresses-hint">
          Enter a 6-digit PIN to fill City and State, or type a City
          and choose the correct postal location to fill PIN and State.
          You can also correct the details manually.
        </p>

        <div className="addresses-form-actions">
          <button
            type="submit"
            className="addresses-primary-button"
            disabled={saving || lookingUp || searchingCity}
          >
            {saving
              ? "Saving..."
              : editingId !== null
              ? "Update Address"
              : "Add Address"}
          </button>

          <button
            type="button"
            className="addresses-secondary-button"
            onClick={resetForm}
            disabled={saving}
          >
            {editingId !== null ? "Cancel Edit" : "Clear"}
          </button>
        </div>
      </form>

      {error && (
        <p className="addresses-error">{error}</p>
      )}

      {success && (
        <p className="addresses-success">{success}</p>
      )}

      <section className="addresses-list">
      <div className="addresses-list-header">
        <h3>Registered Addresses</h3>

        <button
          type="button"
          className="addresses-refresh-button module-refresh-button"
          onClick={loadAddresses}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="addresses-toolbar">
        <input
          type="search"
          placeholder="Search City, State or PIN code..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="addresses-table-wrapper">
        <table className="addresses-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>PIN Code</th>
              <th>City</th>
              <th>State</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedAddresses.map((address) => (
              <tr key={address.id}>
                <td>{address.id}</td>
                <td>{address.pincode}</td>
                <td>{address.city}</td>
                <td>{address.state}</td>
                
                <td>
                  <ActionButtons
                    onEdit={() => handleEdit(address)}
                    onDelete={() => handleDelete(address)}
                  />
                </td>

              </tr>
            ))}

            {!loading && paginatedAddresses.length === 0 && (
              <tr>
                <td colSpan={5} className="addresses-empty">
                  No addresses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="addresses-pagination">
        <label>
          Rows per page:
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </label>

        <div className="addresses-page-controls">
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

      <p className="addresses-total">
        Total Addresses: {filteredAddresses.length}
      </p>
      </section>
    </div>
  );
}

export default Addresses;
