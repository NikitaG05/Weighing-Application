import axios from "axios";

const reportsApi = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL || "",
  timeout: 30000,
});

export async function getLocalReports(accessToken) {
  try {
    const response = await reportsApi.get("/api/admin/reports/local", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  } catch (error) {
    const status = error.response?.status;

    if (status === 401) {
      throw new Error("Session expired. Please log in again.");
    }

    if (status === 403) {
      throw new Error("Admin access is required.");
    }

    if (status === 503) {
      throw new Error(
        "The backend cannot read D:/API. Check the folder and permissions."
      );
    }

    throw new Error("Unable to load reports. Check the backend.");
  }
}