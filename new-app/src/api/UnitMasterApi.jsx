
const BASE_URL = "";

// Get JWT token from existing login session
const getAuthToken = () => {
  const session = JSON.parse(
    sessionStorage.getItem("weighbridgeSession") || "{}"
  );

  return session.accessToken;
};

// Common API request handler
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Session expired. Please login again.");
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = `Request failed: ${response.status}`;

    try {
      const errorData = await response.json();

      errorMessage =
        errorData.message ||
        errorData.detail ||
        errorData.error ||
        errorMessage;
    } catch {
      // Keep default error message
    }

    throw new Error(errorMessage);
  }

  // DELETE returns 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
};

// GET: All units (ADMIN and USER)
export const getAllUnits = async () => {
  return apiRequest("/api/units");
};

// GET: Active units (ADMIN and USER)
export const getActiveUnits = async () => {
  return apiRequest("/api/units/active");
};

// GET: Unit by ID (ADMIN and USER)
export const getUnitById = async (id) => {
  return apiRequest(`/api/units/${encodeURIComponent(id)}`);
};

// POST: Create unit (ADMIN only)
export const createUnit = async (unitData) => {
  return apiRequest("/api/admin/units", {
    method: "POST",
    body: JSON.stringify(unitData),
  });
};

// PUT: Update unit (ADMIN only)
export const updateUnit = async (id, unitData) => {
  return apiRequest(
    `/api/admin/units/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      body: JSON.stringify(unitData),
    }
  );
};

// DELETE: Delete unit (ADMIN only)
export const deleteUnit = async (id) => {
  return apiRequest(
    `/api/admin/units/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    }
  );
};

// Optional grouped export
const unitMasterApi = {
  getAllUnits,
  getActiveUnits,
  getUnitById,
  createUnit,
  updateUnit,
  deleteUnit,
};

export default unitMasterApi;
