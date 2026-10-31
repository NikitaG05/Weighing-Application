const BASE_URL = "/api/user/weighments";

async function request(path, signal) {
  let session;
  try {
    session = JSON.parse(sessionStorage.getItem("weighbridgeSession") || "{}");
  } catch {
    throw new Error("Invalid login session. Please log in again.");
  }
  const token = session.accessToken;
  if (!token) throw new Error("Session expired. Please log in again.");

  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    signal,
  });
  if (!response.ok) {
    const error = await response.text().catch(() => "");
    if (response.status === 401) throw new Error("Session expired. Please log in again.");
    if (response.status === 403) throw new Error("You do not have permission to access this site.");
    throw new Error(`Request failed (${response.status})${error ? `: ${error.slice(0, 150)}` : ""}`);
  }
  return response.json();
}

export const getMyWeighmentSites = (signal) => request("/sites", signal);
export const getUserWeighments = (siteId, signal) =>
  request(`/site/${encodeURIComponent(siteId)}`, signal);
