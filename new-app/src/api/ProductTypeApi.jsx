
const BASE_URL = "";

// Get JWT token from session storage
const getAuthToken = () => {
  let session = {};

  try {
    session = JSON.parse(
      sessionStorage.getItem("weighbridgeSession") || "{}"
    );
  } catch {
    throw new Error("Invalid session. Please login again.");
  }

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
      // Keep the default error message
    }

    throw new Error(errorMessage);
  }

  // DELETE returns 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
};

// GET: All product types (ADMIN and USER)
export const getAllProductTypes = async () => {
  return apiRequest("/api/product-types");
};

// GET: Active product types (ADMIN and USER)
export const getActiveProductTypes = async () => {
  return apiRequest("/api/product-types/active");
};

// GET: Product type by ID (ADMIN and USER)
export const getProductTypeById = async (id) => {
  return apiRequest(
    `/api/product-types/${encodeURIComponent(id)}`
  );
};

// POST: Create product type (ADMIN only)
export const createProductType = async (productTypeData) => {
  return apiRequest("/api/admin/product-types", {
    method: "POST",
    body: JSON.stringify(productTypeData),
  });
};

// PUT: Update product type (ADMIN only)
export const updateProductType = async (
  id,
  productTypeData
) => {
  return apiRequest(
    `/api/admin/product-types/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      body: JSON.stringify(productTypeData),
    }
  );
};

// DELETE: Delete product type (ADMIN only)
export const deleteProductType = async (id) => {
  return apiRequest(
    `/api/admin/product-types/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    }
  );
};

// Grouped API export
const productTypeApi = {
  getAllProductTypes,
  getActiveProductTypes,
  getProductTypeById,
  createProductType,
  updateProductType,
  deleteProductType,
};

export default productTypeApi;
