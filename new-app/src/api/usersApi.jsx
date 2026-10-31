
import axios from "axios";

// Axios configuration
const usersApi = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL || "",
  timeout: 15000,
});

// JWT Authorization
function authConfig(accessToken) {
  return {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
}

// Common error handling
function getErrorMessage(error, fallback) {
  const status = error.response?.status;
  const data = error.response?.data;

  if (!error.response) {
    return "Cannot connect to the server. Please check if the backend is running.";
  }

  if (status === 401) {
    return "Session expired or invalid. Please login again.";
  }

  if (status === 403) {
    return "You do not have permission to perform this action.";
  }

  if (status === 404) {
    return "User not found.";
  }

  if (status === 409) {
    return (
      data?.detail ||
      data?.message ||
      "Username already exists or the operation conflicts with existing data."
    );
  }

  if (status === 400) {
    return (
      data?.detail ||
      data?.message ||
      "Invalid information. Please check the entered details."
    );
  }

  return (
    data?.detail ||
    data?.message ||
    `${fallback} (${status}).`
  );
}

// 1. Register new user
export async function registerUser(accessToken, user) {
  try {
    const response = await usersApi.post(
      "/api/admin/users",
      user,
      authConfig(accessToken)
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Registration failed")
    );
  }
}

// 2. Fetch all registered users
export async function getAllUsers(accessToken) {
  try {
    const response = await usersApi.get(
      "/api/admin/users",
      authConfig(accessToken)
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Unable to fetch users")
    );
  }
}

// 3. Fetch user details by ID
export async function getUserById(accessToken, id) {
  try {
    const response = await usersApi.get(
      `/api/admin/users/${id}`,
      authConfig(accessToken)
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Unable to fetch user details")
    );
  }
}

// 4. Update user information
export async function updateUser(
  accessToken,
  id,
  userData
) {
  try {
    const response = await usersApi.put(
      `/api/admin/users/${id}`,
      userData,
      authConfig(accessToken)
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Unable to update user")
    );
  }
}

// 5. Delete user
export async function deleteUser(accessToken, id) {
  try {
    await usersApi.delete(
      `/api/admin/users/${id}`,
      authConfig(accessToken)
    );

    return true;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Unable to delete user")
    );
  }
}
