
import axios from "axios";

const sitesApi = axios.create({
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

function getErrorMessage(error, fallback) {
  if (!error.response) {
    return "Cannot connect to the server. Please check if the backend is running.";
  }

  const status = error.response.status;
  const data = error.response.data;

  if (status === 401) {
    return "Session expired. Please log in again.";
  }

  if (status === 403) {
    return "You do not have permission to perform this action.";
  }

  if (status === 404) {
    return "Site, user, or address not found.";
  }

  if (status === 409) {
    return (
      data?.detail ||
      data?.message ||
      "This record already exists or conflicts with existing data."
    );
  }

  if (status === 400) {
    return (
      data?.detail ||
      data?.message ||
      "Please check the entered site details."
    );
  }

  return (
    data?.detail ||
    data?.message ||
    `${fallback} (${status}).`
  );
}

// 1. Get all sites
export async function getSites(accessToken) {
  try {
    const response = await sitesApi.get(
      "/api/admin/sites",
      authConfig(accessToken)
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Unable to fetch sites")
    );
  }
}

// 2. Get site by ID
export async function getSiteById(accessToken, id) {
  try {
    const response = await sitesApi.get(
      `/api/admin/sites/${id}`,
      authConfig(accessToken)
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Unable to fetch site")
    );
  }
}

// 3. Create site
export async function createSite(accessToken, siteData) {
  try {
    const response = await sitesApi.post(
      "/api/admin/sites",
      siteData,
      authConfig(accessToken)
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Unable to create site")
    );
  }
}

// 4. Update site
export async function updateSite(
  accessToken,
  id,
  siteData
) {
  try {
    const response = await sitesApi.put(
      `/api/admin/sites/${id}`,
      siteData,
      authConfig(accessToken)
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Unable to update site")
    );
  }
}

// 5. Delete site
export async function deleteSite(accessToken, id) {
  try {
    await sitesApi.delete(
      `/api/admin/sites/${id}`,
      authConfig(accessToken)
    );

    return true;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Unable to delete site")
    );
  }
}
