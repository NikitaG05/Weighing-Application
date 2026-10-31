
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getSites,
  createSite,
  updateSite,
  deleteSite,
} from "../../api/sitesApi";

import {
  getAddresses,
  lookupPincode,
  searchCity,
} from "../../api/addressesApi";

import "../../style/Sites.css";
import ActionButtons from "../ActionButtons";

const emptyUser = {
  username: "",
  password: "",
  fullName: "",
  mobileNumber: "",
  email: "",
};

const emptyAddress = {
  city: "",
  state: "",
  pincode: "",
};

function Sites({ accessToken }) {
  const [sites, setSites] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [users, setUsers] = useState([]);

  const [siteName, setSiteName] = useState("");
  
  const [userId, setUserId] = useState("");
  const [addressId, setAddressId] = useState("");

  const [newUser, setNewUser] = useState(emptyUser);
  const [newAddress, setNewAddress] = useState(emptyAddress);

  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [cityResults, setCityResults] = useState([]);
  const [citySearching, setCitySearching] = useState(false);
  const [pinSearching, setPinSearching] = useState(false);

  const pageSize = 8;

  const loadData = useCallback(async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      setError("");

      const [siteData, addressData, userResponse] =
        await Promise.all([
          getSites(accessToken),
          getAddresses(accessToken),
          fetch(
            `${
              process.env.REACT_APP_API_URL ||
              ""
            }/api/admin/sites/users`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          ),
        ]);

      if (!userResponse.ok) {
        throw new Error("Unable to load site users.");
      }

      const userData = await userResponse.json();

      setSites(siteData);
      setAddresses(addressData);
      setUsers(userData);
    } catch (err) {
      setError(err.message || "Unable to load Site Master.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredSites = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return sites.filter((site) =>
      [
        site.siteName,
        site.username,
        site.city,
        site.state,
        site.pincode,
      ]
        .some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(keyword)
        )
    );
  }, [sites, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSites.length / pageSize)
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const visibleSites = filteredSites.slice(
    (page - 1) * pageSize,
    page * pageSize
  );
  
  function cancelNewUser() {
    setUserId("");
    setNewUser({ ...emptyUser });
    setError("");
  }

  function cancelNewAddress() {
    setAddressId("");
    setNewAddress({ ...emptyAddress });
    setCityResults([]);
    setError("");
  }

  function resetForm() {
    setSiteName("");
    setUserId("");
    setAddressId("");
    setNewUser({ ...emptyUser });
    setNewAddress({ ...emptyAddress });
    setCityResults([]);
    setEditingId(null);
  }

  function updateUserField(field, value) {
    setNewUser((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateAddressField(field, value) {
    setNewAddress((current) => ({
      ...current,
      [field]: value,
    }));
  }
  
  
async function handlePincodeLookup() {
  const pincode = String(newAddress.pincode || "").trim();

  if (!/^[1-9][0-9]{5}$/.test(pincode)) {
    setError("Enter a valid 6-digit PIN code.");
    return;
  }

  try {
    setPinSearching(true);
    setError("");
    setCityResults([]);

    const response = await lookupPincode(
      accessToken,
      pincode
    );

    // Support both array and object responses
    const result = Array.isArray(response)
      ? response[0]
      : response;

    if (!result?.city || !result?.state) {
      throw new Error(
        "No valid City and State found for this PIN code."
      );
    }

    setNewAddress((current) => ({
      ...current,
      pincode,
      city: result.city,
      state: result.state,
    }));

  } catch (err) {
    setError(err.message || "PIN lookup failed.");
  } finally {
    setPinSearching(false);
  }
}


  async function handleCitySearch() {
    const city = newAddress.city.trim();
    if (city.length < 2) {
      setError("Enter at least 2 characters to search a city.");
      return;
    }

    try {
      setCitySearching(true);
      setError("");
      setCityResults([]);
      const results = await searchCity(accessToken, city);
      if (!Array.isArray(results) || results.length === 0) {
        setError("No matching PIN codes found for this city.");
        return;
      }
      setCityResults(results);
    } catch (err) {
      setError(err.message || "Unable to search city.");
    } finally {
      setCitySearching(false);
    }
  }

  function selectCityResult(result) {
    setNewAddress((current) => ({
      ...current,
      city: result.city,
      state: result.state,
      pincode: String(result.pincode),
    }));
    setCityResults([]);
    setError("");
  }

  async function handleSubmit(event) {
  event.preventDefault();
  setError("");
  setMessage("");

  if (!siteName.trim()) {
    setError("Site name is required.");
    return;
  }

  if (!userId) {
    setError("Please select a username or add a new user.");
    return;
  }

  if (!addressId) {
    setError("Please select an address or add a new address.");
    return;
  }

  const payload = {
    siteName: siteName.trim(),

    ...(userId === "new"
      ? { newUser }
      : { userId: Number(userId) }),

    ...(addressId === "new"
      ? { newAddress }
      : { addressId: Number(addressId) }),
  };

  try {
    setLoading(true);

    if (editingId !== null) {
      await updateSite(accessToken, editingId, payload);
      setMessage("Site updated successfully.");
    } else {
      await createSite(accessToken, payload);
      setMessage("Site created successfully.");
    }

    resetForm();
    await loadData();
  } catch (err) {
    setError(err.message || "Unable to save site.");
  } finally {
    setLoading(false);
  }
}

  function handleEdit(site) {
    setEditingId(site.id);
    setSiteName(site.siteName);
    setUserId(String(site.userId));
    setAddressId(String(site.addressId));
    setNewUser({ ...emptyUser });
    setNewAddress({ ...emptyAddress });
    setCityResults([]);
    setError("");
    setMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(site) {
    if (
      !window.confirm(
        `Are you sure you want to delete "${site.siteName}"?`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      await deleteSite(accessToken, site.id);
      setMessage("Site deleted successfully.");

      if (editingId === site.id) {
        resetForm();
      }

      await loadData();
    } catch (err) {
      setError(err.message || "Unable to delete site.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sites-page">
      <div className="sites-heading">
        <span className="sites-heading-mark" aria-hidden="true">▦</span>
        <div>
          <h2>Site Master</h2>
          <p>Manage weighbridge sites and their assigned users.</p>
        </div>

        <button
          type="button"
          className="sites-refresh-button"
          onClick={loadData}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {error && <div className="sites-error" role="alert">{error}</div>}
      {message && (
        <div className="sites-success" role="status">{message}</div>
      )}

      <form className="sites-form" onSubmit={handleSubmit}>
        <div className="sites-form-title"><div><span className="sites-eyebrow">SITE DETAILS</span><h3>{editingId ? "Edit Site" : "Add New Site"}</h3><p>Assign a user and address to this site.</p></div></div>

        <label htmlFor="siteName">Site Name *</label>
        <input
          id="siteName"
          value={siteName}
          maxLength={150}
          onChange={(event) =>
            setSiteName(event.target.value)
          }
          placeholder="Enter site name"
          required
        />

        <div className="sites-section">
          <h4>Username *</h4>

          <select
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            required
          >
            <option value="">Select username</option>

            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username}
              </option>
            ))}

            <option value="new">+ Add New User</option>
          </select>

          {userId === "new" && (
            <div className="sites-fields sites-new-details">
              <input
                placeholder="Username"
                value={newUser.username}
                onChange={(event) =>
                  updateUserField("username", event.target.value)
                }
                required
              />

              <input
                type="password"
                placeholder="Password (minimum 8 characters)"
                value={newUser.password}
                onChange={(event) =>
                  updateUserField("password", event.target.value)
                }
                minLength={8}
                required
              />

              <input
                placeholder="Full name"
                value={newUser.fullName}
                onChange={(event) =>
                  updateUserField("fullName", event.target.value)
                }
                required
              />

              <input
                placeholder="10-digit mobile number"
                value={newUser.mobileNumber}
                onChange={(event) =>
                  updateUserField("mobileNumber", event.target.value)
                }
                maxLength={10}
                required
              />

              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(event) =>
                  updateUserField("email", event.target.value)
                }
                required
              />
              
              <div className="sites-cancel-row">
                <button
                  type="button"
                  className="sites-cancel-btn"
                  onClick={cancelNewUser}
                >
                  Cancel New User
                </button>
              </div>

            </div>

          )}
        </div>

        <div className="sites-section">
          <h4>Address *</h4>

          <select
            value={addressId}
            onChange={(event) => setAddressId(event.target.value)}
            required
          >
            <option value="">Select address</option>

            {addresses.map((address) => (
              <option key={address.id} value={address.id}>
                {address.city}, {address.state} - {address.pincode}
              </option>
            ))}

            <option value="new">+ Add New Address</option>
          </select>

          {addressId === "new" && (
            <div className="sites-new-details">
              <div className="sites-address-grid">
                <div className="sites-field">
                  <label htmlFor="sitePincode">PIN Code</label>
                  <div className="sites-input-action">
                    <input
                      id="sitePincode"
                      placeholder="Enter 6-digit PIN code"
                      value={newAddress.pincode}
                      maxLength={6}
                      inputMode="numeric"
                      onChange={(event) => {
                        updateAddressField(
                          "pincode",
                          event.target.value.replace(/\D/g, "")
                        );
                        setCityResults([]);
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={handlePincodeLookup}
                      disabled={pinSearching || loading}
                    >
                      {pinSearching ? "Searching..." : "Find"}
                    </button>
                  </div>
                </div>

                <div className="sites-field">
                  <label htmlFor="siteCity">City</label>
                  <div className="sites-input-action">
                    <input
                      id="siteCity"
                      placeholder="Enter city name"
                      value={newAddress.city}
                      onChange={(event) => {
                        updateAddressField("city", event.target.value);
                        setCityResults([]);
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={handleCitySearch}
                      disabled={citySearching || loading}
                    >
                      {citySearching ? "Searching..." : "Search"}
                    </button>
                  </div>
                </div>

                <div className="sites-field">
                  <label htmlFor="siteState">State</label>
                  <input
                    id="siteState"
                    placeholder="State"
                    value={newAddress.state}
                    onChange={(event) =>
                      updateAddressField("state", event.target.value)
                    }
                    required
                  />
                </div>
              </div>

              {cityResults.length > 0 && (
                <div className="sites-city-results">
                  <p>Select a matching PIN code:</p>
                  {cityResults.map((result, index) => (
                    <button
                      key={`${result.pincode}-${result.officeName}-${index}`}
                      type="button"
                      className="sites-city-result"
                      onClick={() => selectCityResult(result)}
                    >
                      <strong>{result.pincode}</strong>
                      <span>
                        {result.officeName ? ` — ${result.officeName}` : ""}
                        {" — "}{result.city}, {result.state}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div className="sites-cancel-row">
                <button
                  type="button"
                  className="sites-cancel-btn"
                  onClick={cancelNewAddress}
                >
                  Cancel New Address
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="sites-actions">
          <button type="submit" disabled={loading}>
            {editingId ? "Update Site" : "Save Site"}
          </button>

          <button type="button" className="sites-clear-button" onClick={resetForm}>
            Clear
          </button>
        </div>
      </form>

      <div className="sites-list">
        <div className="sites-list-heading">
          <div className="sites-record-title"><h3>Site Records</h3><span className="sites-record-count">{filteredSites.length}</span></div>

          <input
            aria-label="Search sites, users, addresses"
            placeholder="Search sites, users, addresses..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="sites-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Site Name</th>
                <th>Username</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {visibleSites.map((site) => (
                <tr key={site.id}>
                  <td>{site.id}</td>
                  <td>{site.siteName}</td>
                  <td>{site.username}</td>
                  <td>
                    {site.city}, {site.state} -{" "}
                    {site.pincode}
                  </td>
                  <td>
                      <ActionButtons
                        onEdit={() => handleEdit(site)}
                        onDelete={() => handleDelete(site)}
                      />
                    </td>
                </tr>
              ))}

              {!visibleSites.length && (
                <tr>
                  <td colSpan={5} className="sites-empty">No sites found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="sites-pagination">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>

          <span>
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default Sites;
