import axios from "axios";

const authApi = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL || "http://localhost:8081",
  timeout: 15000,
});

function getApiError(error, fallbackMessage) {
  if (!error.response) {
    return new Error(
      "Cannot connect to the server. Check the backend and network."
    );
  }

  return new Error(
    `${fallbackMessage} (${error.response.status}).`
  );
}

export async function loginAdmin(username, password) {
  let response;

  try {
    response = await authApi.post("/api/auth/login", {
      username: username.trim(),
      password,
    });
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error("Invalid username or password.");
    }

    throw getApiError(error, "Login failed");
  }

  if (!response.data.accessToken) {
    throw new Error("The server did not return an access token.");
  }

  return response.data;
}

export async function getAdminDetails(accessToken) {
  try {
    const response = await authApi.get("/api/admin/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  } catch (error) {
    throw getApiError(error, "Unable to verify admin access");
  }
}


export async function registerUser(accessToken, user) {
  try {
    const response = await authApi.post("/api/admin/users", user, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  } catch (error) {
    const status = error.response?.status;

    if (status === 409) {
      throw new Error("Username already exists.");
    }

    if (status === 400) {
      throw new Error(
        "Check your username and password. Password must have at least 8 characters and at most 72 UTF-8 bytes."
      );
    }

    if (status === 401) {
      throw new Error("Your session expired. Please log in again.");
    }

    if (status === 403) {
      throw new Error("Only an admin can register users.");
    }

    throw getApiError(error, "Registration failed");
  }
}

export async function getUserDetails(accessToken) {
  try {
    const response = await authApi.get("/api/user/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  } catch (error) {
    throw getApiError(error, "Unable to verify user access");
  }
}