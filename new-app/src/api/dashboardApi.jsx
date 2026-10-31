
import axios from "axios";
import { getSites } from "./sitesApi";
import { getAllUsers } from "./usersApi";

const api = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL ||
    "",
  timeout: 20000,
});

export async function getDashboardInsights(accessToken) {
  const [bridgeResponse, sites, users] = await Promise.all([
    api.get("/api/weighbridges", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),
    getSites(accessToken),
    getAllUsers(accessToken),
  ]);

  const bridges = bridgeResponse.data;

  if (![bridges, sites, users].every(Array.isArray)) {
    throw new Error("Invalid dashboard API response.");
  }

  return {
    totalWeighbridges: bridges.length,
    totalSites: sites.length,
    totalUsers: users.length,
    activeUsers: users.filter(
      (user) => user.enabled === true
    ).length,
    inactiveUsers: users.filter(
      (user) => user.enabled === false
    ).length,
    adminAccounts: users.filter(
      (user) => String(user.role).toUpperCase() === "ADMIN"
    ).length,
  };
}
