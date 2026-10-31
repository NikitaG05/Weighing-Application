
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

export async function getRoles(token) {
  const response = await api.get("/api/admin/roles", authConfig(token));
  return response.data;
}

export async function createRole(token, role) {
  const response = await api.post(
    "/api/admin/roles",
    role,
    authConfig(token)
  );
  return response.data;
}

export async function updateRole(token, id, role) {
  const response = await api.put(
    `/api/admin/roles/${id}`,
    role,
    authConfig(token)
  );
  return response.data;
}

export async function deleteRole(token, id) {
  await api.delete(`/api/admin/roles/${id}`, authConfig(token));
}
