
import axios from "axios";

const addressesApi = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL ||
    "",
  timeout: 20000,
});

function authConfig(accessToken) {
  return {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
}

function handleError(error, fallback) {
  if (!error.response) {
    return "Cannot connect to the server or postal lookup service.";
  }

  const status = error.response.status;

  if (status === 401) {
    return "Session expired. Please log in again.";
  }

  if (status === 403) {
    return "You do not have permission.";
  }

  if (status === 404) {
    return "Address or PIN code not found.";
  }

  if (status === 409) {
    return "Address already exists or cannot be deleted because it is in use.";
  }

  if (status === 400) {
    return "Please check the address details and PIN code.";
  }

  if (status === 502) {
    return "Postal lookup service is temporarily unavailable.";
  }

  return `${fallback} (${status}).`;
}

// Auto-fetch City and State by PIN code
export async function lookupPincode(accessToken, pincode) {
  try {
    const response = await addressesApi.get(
      `/api/admin/addresses/pincode/${pincode}`,
      authConfig(accessToken)
    );

    return response.data;
  } catch (error) {
    throw new Error(
      handleError(error, "PIN lookup failed")
    );
  }
}

// Fetch all addresses
export async function getAddresses(accessToken) {
  try {
    const response = await addressesApi.get(
      "/api/admin/addresses",
      authConfig(accessToken)
    );

    return response.data;
  } catch (error) {
    throw new Error(
      handleError(error, "Unable to fetch addresses")
    );
  }
}

// Fetch address by ID
export async function getAddressById(accessToken, id) {
  try {
    const response = await addressesApi.get(
      `/api/admin/addresses/${id}`,
      authConfig(accessToken)
    );

    return response.data;
  } catch (error) {
    throw new Error(
      handleError(error, "Unable to fetch address")
    );
  }
}

// Add new address
export async function createAddress(accessToken, data) {
  try {
    const response = await addressesApi.post(
      "/api/admin/addresses",
      data,
      authConfig(accessToken)
    );

    return response.data;
  } catch (error) {
    throw new Error(
      handleError(error, "Unable to create address")
    );
  }
}

// Update existing address
export async function updateAddress(
  accessToken,
  id,
  data
) {
  try {
    const response = await addressesApi.put(
      `/api/admin/addresses/${id}`,
      data,
      authConfig(accessToken)
    );

    return response.data;
  } catch (error) {
    throw new Error(
      handleError(error, "Unable to update address")
    );
  }
}

// Delete address
export async function deleteAddress(accessToken, id) {
  try {
    await addressesApi.delete(
      `/api/admin/addresses/${id}`,
      authConfig(accessToken)
    );

    return true;
  } catch (error) {
    throw new Error(
      handleError(error, "Unable to delete address")
    );
  }
}


export async function searchCity(accessToken, city) {
  try {
    const response = await addressesApi.get(
      "/api/admin/addresses/search-city",
      {
        ...authConfig(accessToken),
        params: { city },
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(
      handleError(error, "Unable to search city")
    );
  }
}

