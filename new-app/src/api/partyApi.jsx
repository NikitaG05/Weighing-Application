
const API_BASE_URL = "";


const getHeaders = () => {
  const sessionData = sessionStorage.getItem(
    "weighbridgeSession"
  );

  let token = null;

  if (sessionData) {
    try {
      const session = JSON.parse(sessionData);
      token = session.accessToken;
    } catch (error) {
      console.error("Invalid login session data");
    }
  }

  if (!token) {
    throw new Error(
      "Login session not found. Please login again."
    );
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
};


const handleResponse = async (response) => {
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Session expired. Please login again.");
    }

    if (response.status === 403) {
      throw new Error(
        "You do not have permission to access this site."
      );
    }

    throw new Error(
      `Request failed. HTTP ${response.status}`
    );
  }

  return response.json();
};

export const getParties = async (siteId) => {
  const response = await fetch(
    `${API_BASE_URL}/api/user/parties?siteId=${encodeURIComponent(siteId)}`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  return handleResponse(response);
};

export const saveParty = async (partyData) => {
  const response = await fetch(
    `${API_BASE_URL}/api/user/parties/sync`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(partyData),
    }
  );

  return handleResponse(response);
};
