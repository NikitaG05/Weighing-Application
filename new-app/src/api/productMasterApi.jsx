const BASE_URL = "";

const getAuthToken = () => {
  let session;
  try {
    session = JSON.parse(sessionStorage.getItem("weighbridgeSession") || "{}");
  } catch {
    throw new Error("Invalid session. Please log in again.");
  }
  if (!session.accessToken) throw new Error("Session expired. Please log in again.");
  return session.accessToken;
};

const apiRequest = async (path, options = {}) => {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAuthToken()}`,
      ...options.headers,
    },
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const error = await response.json();
      message = error.detail || error.message || error.error || message;
    } catch { /* Response may not contain JSON */ }
    throw new Error(message);
  }
  if (response.status === 204) return null;
  return response.json();
};

export const getAllProducts = () => apiRequest("/api/products");
export const getActiveProducts = () => apiRequest("/api/products/active");
export const getProductById = (id) => apiRequest(`/api/products/${encodeURIComponent(id)}`);
export const createProduct = (data) => apiRequest("/api/admin/products", {
  method: "POST", body: JSON.stringify(data),
});
export const updateProduct = (id, data) => apiRequest(`/api/admin/products/${encodeURIComponent(id)}`, {
  method: "PUT", body: JSON.stringify(data),
});
export const deleteProduct = (id) => apiRequest(`/api/admin/products/${encodeURIComponent(id)}`, {
  method: "DELETE",
});

const productMasterApi = { getAllProducts, getActiveProducts, getProductById, createProduct, updateProduct, deleteProduct };
export default productMasterApi;
