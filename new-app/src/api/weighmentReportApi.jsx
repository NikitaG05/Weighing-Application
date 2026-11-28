
import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "";

const weighmentApi = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

const getSession = () => {
  const sessionData = sessionStorage.getItem(
    "weighbridgeSession"
  );

  if (!sessionData) {
    throw new Error(
      "Login session not found. Please login again."
    );
  }

  let session;

  try {
    session = JSON.parse(sessionData);
  } catch {
    throw new Error(
      "Invalid login session. Please login again."
    );
  }

  if (!session?.accessToken) {
    throw new Error(
      "Access token not found. Please login again."
    );
  }

  return session;
};

const getHeaders = (session) => ({
  Authorization: `Bearer ${session.accessToken}`,
  Accept: "application/json",
});

const getApiPath = (session) => {
  const role = String(session.role || "")
    .replace(/^ROLE_/i, "")
    .toUpperCase();

  if (role === "ADMIN") {
    return "/api/admin/weighment-sync";
  }

  if (role === "USER") {
    return "/api/user/weighments";
  }

  throw new Error(
    "Invalid user role. Please login again."
  );
};

const validateSiteId = (siteId) => {
  const id = Number(siteId);

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("A valid site ID is required.");
  }

  return id;
};

const handleError = (error) => {
  if (!error.response) {
    throw error;
  }

  const status = error.response.status;

  if (status === 401) {
    throw new Error(
      "Session expired. Please login again."
    );
  }

  if (status === 403) {
    throw new Error(
      "You are not authorized to access this site's weighment reports."
    );
  }

  if (status === 404) {
    throw new Error(
      "Requested API endpoint or weighment record not found."
    );
  }

  throw new Error(
    `Unable to load weighment data. HTTP ${status}`
  );
};

const weighmentReportApi = {

  // ADMIN: Fetch completed, non-deleted reports
 getLocalReports: async (siteId) => {
    const id = validateSiteId(siteId);

    try {
      const session = getSession();

      const role = String(session.role || "")
        .replace(/^ROLE_/i, "")
        .toUpperCase();

      if (role !== "ADMIN") {
        throw new Error(
          "Only administrators can access local reports."
        );
      }

      const response = await weighmentApi.get(
        "/api/admin/reports/local",
        {
          params: { siteId: id },
          headers: getHeaders(session),
        }
      );

      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  // Fetch all weighments for a site
  getAllBySite: async (siteId) => {
    const id = validateSiteId(siteId);

    try {
      const session = getSession();
      const apiPath = getApiPath(session);

      const response = await weighmentApi.get(
        `${apiPath}/site/${id}`,
        {
          headers: getHeaders(session),
        }
      );

      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  // Fetch completed weighments for a site
  getCompletedBySite: async (siteId) => {
    const id = validateSiteId(siteId);

    try {
      const session = getSession();
      const apiPath = getApiPath(session);

      const response = await weighmentApi.get(
        `${apiPath}/site/${id}/completed`,
        {
          headers: getHeaders(session),
        }
      );

      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

  // Fetch a weighment by transaction ID
  getByTransaction: async (
    siteId,
    sourceTransactionId
  ) => {
    const id = validateSiteId(siteId);
    const transactionId = Number(sourceTransactionId);

    if (
      !Number.isSafeInteger(transactionId) ||
      transactionId <= 0
    ) {
      throw new Error("Invalid transaction ID.");
    }

    try {
      const session = getSession();
      const apiPath = getApiPath(session);

      const response = await weighmentApi.get(
        `${apiPath}/site/${id}/transaction/${transactionId}`,
        {
          headers: getHeaders(session),
        }
      );

      return response.data;
    } catch (error) {
      handleError(error);
    }
  },

    // ADMIN: Hide a weighment from Cloud Reports only.
  // Does not delete the original Desktop record.
  deleteCloudWeighment: async (siteId, sourceTransactionId) => {
    const id = validateSiteId(siteId);
    const transactionId = Number(sourceTransactionId);

    if (
      !Number.isSafeInteger(transactionId) ||
      transactionId <= 0
    ) {
      throw new Error("Invalid transaction ID.");
    }

    try {
      const session = getSession();

      const role = String(session.role || "")
        .replace(/^ROLE_/i, "")
        .toUpperCase();

      if (role !== "ADMIN") {
        throw new Error(
          "Only administrators can delete cloud weighments."
        );
      }

      await weighmentApi.delete(
        `/api/admin/weighment-sync/site/${id}/transaction/${transactionId}`,
        {
          headers: getHeaders(session),
        }
      );

      return true;
    } catch (error) {
      handleError(error);
    }
  },
};

export default weighmentReportApi;
