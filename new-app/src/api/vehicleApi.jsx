
const API_BASE_URL = "";

const getHeaders = () => {
  const sessionData = sessionStorage.getItem(
    "weighbridgeSession"
  );

  let token = null;

  if (sessionData) {
    try {
      const session = JSON.parse(sessionData);
      token = session.accessToken;
    } catch (error) {
      console.error("Invalid login session data", error);
    }
  }

  if (!token) {
    throw new Error(
      "Login session not found. Please login again."
    );
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
};

const handleResponse = async (response) => {
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        "Session expired. Please login again."
      );
    }

    if (response.status === 403) {
      throw new Error(
        "You do not have permission to access this site."
      );
    }

    if (response.status === 404) {
      throw new Error("Vehicle not found.");
    }

    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.message ||
      errorData?.detail ||
      `Request failed. HTTP ${response.status}`
    );
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

// Get all vehicles for a site.
export const getVehicles = async (siteId) => {
  const response = await fetch(
    `${API_BASE_URL}/api/vehicles/site/${encodeURIComponent(siteId)}`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  return handleResponse(response);
};

// Get a vehicle by ID.
export const getVehicleById = async (siteId, vehicleId) => {
  const response = await fetch(
    `${API_BASE_URL}/api/vehicles/site/${encodeURIComponent(siteId)}/${encodeURIComponent(vehicleId)}`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  return handleResponse(response);
};

// Create or update a vehicle.
export const saveVehicle = async (vehicleData) => {
  const response = await fetch(
    `${API_BASE_URL}/api/vehicles/sync`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(vehicleData),
    }
  );

  return handleResponse(response);
};
