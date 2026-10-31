
import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "",
  timeout: 15000,
});

const authConfig = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export async function getStatuses(token) {
  const response = await api.get("/api/admin/statuses", authConfig(token));
  return response.data;
}

export async function createStatus(token, status) {
  const response = await api.post(
    "/api/admin/statuses",
    status,
    authConfig(token)
  );
  return response.data;
}

export async function updateStatus(token, id, status) {
  const response = await api.put(
    `/api/admin/statuses/${id}`,
    status,
    authConfig(token)
  );
  return response.data;
}

export async function deleteStatus(token, id) {
  await api.delete(`/api/admin/statuses/${id}`, authConfig(token));
}
