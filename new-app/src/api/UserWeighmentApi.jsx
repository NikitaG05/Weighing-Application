const BASE_URL = `${(process.env.REACT_APP_API_URL || "").replace(/\/$/, "")}/api/user/weighments`;

const ADMIN_BASE_URL = `${(process.env.REACT_APP_API_URL || "").replace(/\/$/, "")}/api/admin/weighment-sync`;

async function request(path, signal, asBlob = false, isAdmin = false, baseUrl = BASE_URL) {
  let session;
  try {
    session = JSON.parse(sessionStorage.getItem("weighbridgeSession") || "{}");
  } catch {
    throw new Error("Invalid login session. Please log in again.");
  }
  const token = session.accessToken;
  if (!token) throw new Error("Session expired. Please log in again.");

  const response = await fetch(`${isAdmin ? ADMIN_BASE_URL : baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: asBlob ? "image/jpeg, image/png" : "application/json" },
    signal,
  });
  if (!response.ok) {
    const error = await response.text().catch(() => "");
    if (response.status === 401) throw new Error("Session expired. Please log in again.");
    if (response.status === 403) throw new Error("You do not have permission to access this site.");
    throw new Error(`Request failed (${response.status})${error ? `: ${error.slice(0, 150)}` : ""}`);
  }
  return asBlob ? response.blob() : response.json();
}

export const getMyWeighmentSites = (signal) => request("/sites", signal);
export const getUserWeighments = (siteId, signal) =>
  request(`/site/${encodeURIComponent(siteId)}`, signal);


export const getWeighmentImages = (
  siteId, transactionId, signal, isAdmin = false
) =>
  request(
    `/site/${encodeURIComponent(siteId)}/transaction/${encodeURIComponent(transactionId)}/images`,
    signal,
    false,
    isAdmin
  );

export const getWeighmentImage = (
  siteId, transactionId, imageType, signal, isAdmin = false
) =>
  request(
    `/site/${encodeURIComponent(siteId)}/transaction/${encodeURIComponent(transactionId)}/images/${encodeURIComponent(imageType)}`,
    signal,
    true,
    isAdmin
  );

export const getUserWeighbridgeStatus = (signal) => request("", signal, false, false, BASE_URL.replace(/\/weighments$/, "/weighbridge-status"));