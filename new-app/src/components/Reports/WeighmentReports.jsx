
import { useEffect, useMemo, useState } from "react";
import weighmentReportApi from "../../api/weighmentReportApi";
import "../../style/WeighmentReports.css";

const BASE_URL =
  process.env.REACT_APP_API_URL || "";

const PAGE_SIZE = 10;

const getToken = () => {
  const session = JSON.parse(
    sessionStorage.getItem("weighbridgeSession") || "{}"
  );
  return session.accessToken;
};

const getDate = (value) => {
  if (!value) return "";
  return String(value).slice(0, 10);
};

const formatNumber = (value) =>
  value == null || value === ""
    ? "-"
    : Number(value).toLocaleString("en-IN", {
        maximumFractionDigits: 3,
      });

const escapeCsv = (value) => {
  let text = String(value ?? "");
  if (/^[\s]*[=+\-@\t\r]/.test(text)) {
    text = "'" + text;
  }
  return `"${text.replace(/"/g, '""')}"`;
};

function WeighmentReports({ siteId }) {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState("");
  const [records, setRecords] = useState([]);

  const [loadingSites, setLoadingSites] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);

  // Load only sites assigned to the logged-in USER.
  useEffect(() => {
    let cancelled = false;

    async function loadSites() {
      setLoadingSites(true);
      setError("");

      try {
        const token = getToken();

        if (!token) {
          throw new Error("Please login again.");
        }

        const response = await fetch(
          `${BASE_URL}/api/user/weighments/sites`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Unable to load assigned sites. HTTP ${response.status}`
          );
        }

        const data = await response.json();
        const assigned = Array.isArray(data) ? data : [];

        if (!cancelled) {
          setSites(assigned);

          setSelectedSite((current) => {
            if (assigned.some(
              (site) => String(site.id) === String(current)
            )) {
              return current;
            }

            if (assigned.some(
              (site) => String(site.id) === String(siteId)
            )) {
              return String(siteId);
            }

            return assigned.length
              ? String(assigned[0].id)
              : "";
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load sites.");
        }
      } finally {
        if (!cancelled) setLoadingSites(false);
      }
    }

    loadSites();

    return () => {
      cancelled = true;
    };
  }, [siteId]);

  // Load reports whenever the selected site changes.
  useEffect(() => {
    if (!selectedSite) {
      setRecords([]);
      return;
    }

    let cancelled = false;

    async function loadReports() {
      setLoading(true);
      setError("");
      setRecords([]);

      try {
        const data = await weighmentReportApi.getAllBySite(
          selectedSite
        );

        if (!cancelled) {
          setRecords(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || "Failed to load weighment reports."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadReports();

    return () => {
      cancelled = true;
    };
  }, [selectedSite]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      const searchable = [
        record.ticketNo,
        record.vehicleNo,
        record.partyName,
        record.productName,
      ]
        .map((value) => String(value ?? "").toLowerCase())
        .join(" ");

      const recordDate = getDate(record.ticketDate);

      const matchesSearch =
        !query || searchable.includes(query);

      const matchesStatus =
        status === "ALL" ||
        (status === "COMPLETED" && record.completed === true) ||
        (status === "PENDING" && record.completed !== true);

      const matchesFrom =
        !fromDate || (recordDate && recordDate >= fromDate);

      const matchesTo =
        !toDate || (recordDate && recordDate <= toDate);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesFrom &&
        matchesTo
      );
    });
  }, [records, search, status, fromDate, toDate]);

  const completedRecords = filteredRecords.filter(
    (record) => record.completed === true
  );

  const totalNetWeight = completedRecords.reduce(
    (total, record) =>
      total + Number(record.netWeight || 0),
    0
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRecords.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const updateFilter = (setter, value) => {
    setter(value);
    setPage(1);
  };

  const exportCsv = () => {
    const headers = [
      "Ticket No",
      "Date",
      "Vehicle",
      "Party",
      "Product",
      "Gross Weight",
      "Tare Weight",
      "Net Weight",
      "Status",
    ];

    const rows = filteredRecords.map((record) => [
      record.ticketNo,
      record.ticketDate,
      record.vehicleNo,
      record.partyName,
      record.productName,
      record.grossWeight,
      record.tareWeight,
      record.netWeight,
      record.completed ? "Completed" : "Pending",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `weighment_report_site_${selectedSite}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="wr-container">
      <div className="wr-header">
        <div>
          <h2>Weighment Reports</h2>
          <p>
            View, filter and export synchronized weighment records.
          </p>
        </div>

        <button
          type="button"
          className="wr-export"
          onClick={exportCsv}
          disabled={
            loading ||
            loadingSites ||
            filteredRecords.length === 0 ||
            Boolean(error)
          }
        >
          Export CSV
        </button>
      </div>

      <div className="wr-filters">
        <label>
          Weighbridge Site
          <select
            value={selectedSite}
            onChange={(event) => {
              setSelectedSite(event.target.value);
              setPage(1);
            }}
            disabled={loadingSites}
          >
            {sites.length === 0 && (
              <option value="">No assigned sites</option>
            )}

            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.siteName}
              </option>
            ))}
          </select>
        </label>

        <label>
          Search
          <input
            type="search"
            placeholder="Ticket, vehicle, party, product"
            value={search}
            onChange={(event) =>
              updateFilter(setSearch, event.target.value)
            }
          />
        </label>

        <label>
          Status
          <select
            value={status}
            onChange={(event) =>
              updateFilter(setStatus, event.target.value)
            }
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
          </select>
        </label>

        <label>
          From Date
          <input
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(event) =>
              updateFilter(setFromDate, event.target.value)
            }
          />
        </label>

        <label>
          To Date
          <input
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(event) =>
              updateFilter(setToDate, event.target.value)
            }
          />
        </label>

        <button
          type="button"
          className="wr-clear"
          onClick={() => {
            setSearch("");
            setStatus("ALL");
            setFromDate("");
            setToDate("");
            setPage(1);
          }}
        >
          Clear Filters
        </button>
      </div>

      {error && (
        <p className="wr-error" role="alert">
          {error}
        </p>
      )}

      {loadingSites || loading ? (
        <p>Loading weighment reports...</p>
      ) : !error && (
        <>
          <div className="wr-stats">
            <div className="wr-stat">
              <span>Total Weighments</span>
              <strong>{filteredRecords.length}</strong>
            </div>

            <div className="wr-stat">
              <span>Completed</span>
              <strong>{completedRecords.length}</strong>
            </div>

            <div className="wr-stat">
              <span>Pending</span>
              <strong>
                {filteredRecords.length - completedRecords.length}
              </strong>
            </div>

            <div className="wr-stat">
              <span>Total Net Weight</span>
              <strong>{formatNumber(totalNetWeight)}</strong>
              <small>Source weight units</small>
            </div>
          </div>

          <div className="wr-table-wrap">
            <table className="wr-table">
              <thead>
                <tr>
                  <th>Ticket No</th>
                  <th>Date</th>
                  <th>Vehicle</th>
                  <th>Party</th>
                  <th>Product</th>
                  <th>Gross</th>
                  <th>Tare</th>
                  <th>Net</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      No weighment records found.
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((record) => (
                    <tr
                      key={
                        record.id ??
                        `${record.siteId}-${record.sourceTransactionId}`
                      }
                    >
                      <td>{record.ticketNo || "-"}</td>
                      <td>{record.ticketDate || "-"}</td>
                      <td>{record.vehicleNo || "-"}</td>
                      <td>{record.partyName || "-"}</td>
                      <td>{record.productName || "-"}</td>
                      <td>{formatNumber(record.grossWeight)}</td>
                      <td>{formatNumber(record.tareWeight)}</td>
                      <td>{formatNumber(record.netWeight)}</td>
                      <td>
                        <span
                          className={
                            record.completed
                              ? "wr-status completed"
                              : "wr-status pending"
                          }
                        >
                          {record.completed
                            ? "Completed"
                            : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="wr-pagination">
            <span>
              Showing {paginatedRecords.length} of{" "}
              {filteredRecords.length} records
            </span>

            <div>
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
              >
                Previous
              </button>

              <span>
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default WeighmentReports;
