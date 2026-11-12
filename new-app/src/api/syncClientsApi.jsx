import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "",
  timeout: 30000,
});

const config = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

function fail(error) {
  const status = error.response?.status;
  if (status === 401) throw new Error("Admin session expired. Please sign in again.");
  if (status === 403) throw new Error("Admin access required.");
  throw new Error(error.response?.data?.message || `Request failed${status ? ` (${status})` : ": server unreachable"}.`);
}

export async function listSyncClients(token) {
  try {
    const response = await api.get("/api/admin/sync-clients", config(token));
    return response.data;
  } catch (error) { fail(error); }
}

export async function createSyncClient(token, siteId) {
  try {
    const response = await api.post("/api/admin/sync-clients", { siteId: Number(siteId) }, config(token));
    return response.data;
  } catch (error) { fail(error); }
}

export async function changeSyncClientStatus(token, id, enabled) {
  try {
    const response = await api.patch(`/api/admin/sync-clients/${id}/status`, { enabled }, config(token));
    return response.data;
  } catch (error) { fail(error); }
}

export async function rotateSyncClientSecret(token, id) {
  try {
    const response = await api.post(`/api/admin/sync-clients/${id}/rotate-secret`, null, config(token));
    return response.data;
  } catch (error) { fail(error); }
}
