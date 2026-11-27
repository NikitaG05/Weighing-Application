import { useEffect, useState } from "react";
import { getUserWeighbridgeStatus } from "../api/UserWeighmentApi";
import "../style/UserWeighbridgeStatus.css";

const formatDate = (value) =>
  value ? value.replace("T", " ").slice(0, 19) : "Not available";

const formatStorage = (bytes) =>
  bytes == null ? "Not available" :
  `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

export default function UserWeighbridgeStatus() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError("");

    getUserWeighbridgeStatus(controller.signal)
      .then(data => {
        if (!controller.signal.aborted) {
          setRows(Array.isArray(data) ? data : []);
        }
      })
      .catch(err => {
        if (!controller.signal.aborted) {
          setRows([]);
          setError(err.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [refresh]);

  const active = rows.filter(r => r.status === "ACTIVE").length;
  const inactive = rows.filter(r => r.status === "INACTIVE").length;
  const unknown = rows.length - active - inactive;
  const totalTrips = rows.reduce(
    (sum, r) => sum + (r.totalTrips || 0), 0
  );

  const lastUpdated = rows
    .map(r => r.lastUpdated)
    .filter(Boolean)
    .sort()
    .reverse()[0];

  const cards = [
    ["Total Weighbridges", rows.length],
    ["Sync Enabled", active],
    ["Sync Disabled", inactive],
    ["Unknown Status", unknown],
    ["Total Trips", totalTrips],
    ["Last Updated", formatDate(lastUpdated)]
  ];

  return (
    <section className="uws-root">
      <div className="uws-heading">
        <div>
          <h2>Weighbridge Status</h2>
          <p>Monitor your registered weighbridges</p>
        </div>
        <button
          className="uws-refresh"
          disabled={loading}
          onClick={() => setRefresh(v => v + 1)}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && <div className="uws-error">{error}</div>}

      {!loading && !error && (
        <>
          <div className="uws-cards">
            {cards.map(([label, value]) => (
              <div className="uws-card" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          <div className="uws-panel">
            <h3>Weighbridge Details</h3>
            <div className="uws-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Sr. No.</th>
                    <th>Weighbridge Name</th>
                    <th>Site Name</th>
                    <th>Sync Status</th>
                    <th>Connection</th>
                    <th>Valid From</th>
                    <th>Valid To</th>
                    <th>No. of Trips</th>
                    <th>Renewal Days</th>
                    <th>Storage Used</th>
                    <th>Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, index) => (
                    <tr key={`${r.siteId}-${r.weighbridgeId}`}>
                      <td>{index + 1}</td>
                      <td>{r.weighbridgeName}</td>
                      <td>{r.siteName}</td>
                      <td>
                        <span className={`uws-status ${String(r.status).toLowerCase()}`}>
                          {r.status === "ACTIVE" ? "Enabled" :
                           r.status === "INACTIVE" ? "Disabled" : "Unknown"}
                        </span>
                      </td>
                      <td>{r.connectionStatus || "UNKNOWN"}</td>
                      <td>{formatDate(r.validFrom)}</td>
                      <td>{formatDate(r.validTo)}</td>
                      <td>{r.totalTrips ?? "Not available"}</td>
                      <td>{r.renewalDays ?? "Not available"}</td>
                      <td>{formatStorage(r.storageUsedBytes)}</td>
                      <td>{formatDate(r.lastUpdated)}</td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td colSpan={11}>No registered weighbridges found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      {loading && <p>Loading weighbridge status...</p>}
    </section>
  );
}
