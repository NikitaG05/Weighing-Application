
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import weighmentReportApi from "../api/weighmentReportApi";
import { getSites } from "../api/sitesApi";
import "../style/Report.css";

const columns = [
  ["TicketNo", "Ticket No."],
  ["WBName", "Weighbridge"],
  ["VehicleNo", "Vehicle No."],
  ["PartyName", "Party"],
  ["ProductName", "Product"],
  ["GrossWeight", "Gross Weight"],
  ["TareWeight", "Tare Weight"],
  ["NetWeight", "Net Weight"],
  ["GrossDate", "Gross Date"],
  ["TareDate", "Tare Date"],
  ["TicketDate", "Ticket Date"],
  ["OperatorName", "Operator"],
  ["ShiftName", "Shift"],
];

// Convert Spring Boot camelCase fields to table fields.
const normalizeRecord = (record) => ({
    sourceTransactionId:
    record.sourceTransactionId ??
    record.SourceTransactionId ??
    null,

  siteId:
    record.siteId ??
    record.SiteId ??
    null,
  TicketNo: record.ticketNo ?? record.TicketNo ?? "",
  WBName: record.wbName ?? record.WBName ?? "",
  VehicleNo: record.vehicleNo ?? record.VehicleNo ?? "",
  PartyName: record.partyName ?? record.PartyName ?? "",
  ProductName: record.productName ?? record.ProductName ?? "",
  GrossWeight: record.grossWeight ?? record.GrossWeight ?? "",
  TareWeight: record.tareWeight ?? record.TareWeight ?? "",
  NetWeight: record.netWeight ?? record.NetWeight ?? "",
  GrossDate: record.grossDate ?? record.GrossDate ?? "",
  TareDate: record.tareDate ?? record.TareDate ?? "",
  TicketDate: record.ticketDate ?? record.TicketDate ?? "",
  OperatorName: record.operatorName ?? record.OperatorName ?? "",
  ShiftName: record.shiftName ?? record.ShiftName ?? "",
});

// The admin dashboard may not pass accessToken as a prop.
// Read the existing session as a fallback without exposing the token in the UI.
function getSessionAccessToken() {
  try {
    const session = JSON.parse(
      sessionStorage.getItem("weighbridgeSession") || "{}"
    );
    return session.accessToken || "";
  } catch {
    return "";
  }
}

function Reports({ accessToken }) {
  const [records, setRecords] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState("all");
  const [sitesLoading, setSitesLoading] = useState(true);
  const [sitesError, setSitesError] = useState("");
  const requestId = useRef(0);
  const token = accessToken || getSessionAccessToken();

  // Load available weighbridge sites using the existing admin API.
  useEffect(() => {
    let cancelled = false;

    async function loadSites() {
      setSitesLoading(true);
      setSitesError("");

      try {
        const data = await getSites(token);
        const siteList = Array.isArray(data)
          ? data
          : Array.isArray(data?.content)
            ? data.content
            : Array.isArray(data?.data)
              ? data.data
              : [];

        if (cancelled) return;

        const validSites = siteList.filter(
          (site) => site.id != null || site.siteId != null
        );
        setSites(validSites);
        setSelectedSiteId((previous) => {
              if (previous === "all") return "all";

              const exists = validSites.some(
                (site) => String(site.id ?? site.siteId) === String(previous)
              );

              return exists ? previous : "all";
            });
      } catch (err) {
        if (!cancelled) {
          setSites([]);
          setSelectedSiteId("");
          setSitesError(err.message || "Unable to load sites.");
        }
      } finally {
        if (!cancelled) setSitesLoading(false);
      }
    }

    if (token) {
      loadSites();
    } else {
      setSites([]);
      setSelectedSiteId("");
      setSitesLoading(false);
      setSitesError("Please log in again.");
    }

    return () => {
      cancelled = true;
    };
  }, [token]);

  // Load completed reports whenever the site changes or Refresh is clicked.
  const loadReports = useCallback(async () => {
    const currentRequest = ++requestId.current;

    setLoading(true);
    setError("");

    try {
      const data = await weighmentReportApi.getLocalReports(selectedSiteId);
      if (currentRequest !== requestId.current) return;

      setRecords(Array.isArray(data) ? data.map(normalizeRecord) : []);
      setPage(1);
    } catch (err) {
      if (currentRequest !== requestId.current) return;
      console.error("Failed to load reports:", err);
      setRecords([]);
      setError(err.message || "Unable to load reports.");
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [selectedSiteId]);

  useEffect(() => {
    loadReports();
    return () => {
      requestId.current += 1;
    };
  }, [loadReports]);

  const invalidDateRange = Boolean(
    fromDate && toDate && fromDate > toDate
  );

  // Search and date filtering.
  const filteredRecords = useMemo(() => {
    if (invalidDateRange) {
      return [];
    }

    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesSearch =
        !query ||
        columns.some(([field]) =>
          String(record[field] ?? "")
            .toLowerCase()
            .includes(query)
        );

      const ticketDate = String(
        record.TicketDate ?? ""
      ).slice(0, 10);

      const hasValidDate =
        /^\d{4}-\d{2}-\d{2}$/.test(ticketDate);

      const matchesDate =
        (!fromDate && !toDate) ||
        (hasValidDate &&
          (!fromDate || ticketDate >= fromDate) &&
          (!toDate || ticketDate <= toDate));

      return matchesSearch && matchesDate;
    });
  }, [records, search, fromDate, toDate, invalidDateRange]);

  // Pagination.
  const totalPages = Math.max(
    1,
    Math.ceil(filteredRecords.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;

  const visibleRecords = filteredRecords.slice(
    startIndex,
    startIndex + pageSize
  );

  const handleDelete = async (record) => {
  const transactionId = record.sourceTransactionId;
  const siteId = record.siteId ?? selectedSiteId;

  if (!transactionId || !siteId) {
    setError("Cannot delete: missing site or transaction ID.");
    return;
  }

  const confirmed = window.confirm(
    `Hide ticket ${record.TicketNo} from Cloud Reports?`
  );

  if (!confirmed) return;

  // Backend DELETE testing is still pending.
  // Do not send a DELETE request yet.
  setError(
    "Cloud DELETE is not enabled yet. Backend testing is pending."
  );
};

  const clearFilters = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  return (
    <div className="reports">
      <h2>Weighment Reports</h2>

      <p>
        Completed weighment records synchronized from TareX Desktop.
      </p>

      <div className="reports-filter" style={{ maxWidth: 360, marginBottom: 20 }}>
        <label htmlFor="report-site">Select Weighbridge Site</label>
        <select
          id="report-site"
          value={selectedSiteId}
          onChange={(event) => {
            setSelectedSiteId(event.target.value);
            setRecords([]);
            setPage(1);
          }}
          disabled={sitesLoading || Boolean(sitesError)}
        >
          {sites.length === 0 && (
            <option value="all">All Weighbridge Sites</option>
          )}
          {sites.map((site) => {
            const id = site.id ?? site.siteId;
            return (
              <option key={id} value={String(id)}>
                {site.siteName ?? site.name ?? site.wbName ?? `Site ${id}`}
              </option>
            );
          })}
        </select>
        {sitesError && <p role="alert">{sitesError}</p>}
      </div>

      <div className="reports-filters">
        <div className="reports-filter">
          <label htmlFor="report-search">
            Search records
          </label>

          <input
            id="report-search"
            type="search"
            placeholder="Ticket, vehicle, party, product..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="reports-filter">
          <label htmlFor="report-from">
            Ticket date from
          </label>

          <input
            id="report-from"
            type="date"
            value={fromDate}
            onChange={(event) => {
              setFromDate(event.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="reports-filter">
          <label htmlFor="report-to">
            Ticket date to
          </label>

          <input
            id="report-to"
            type="date"
            value={toDate}
            onChange={(event) => {
              setToDate(event.target.value);
              setPage(1);
            }}
          />
        </div>

        <button
          className="reports-secondary"
          type="button"
          onClick={clearFilters}
        >
          Clear Filters
        </button>

        <button
          className="reports-refresh"
          type="button"
          onClick={loadReports}
          disabled={loading || sitesLoading || !selectedSiteId}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {invalidDateRange && (
        <div className="reports-errors" role="alert">
          <p>
            From date must be on or before To date.
          </p>
        </div>
      )}

      {error && (
        <div className="reports-errors" role="alert">
          <p>{error}</p>
        </div>
      )}

      <p role="status">
        {loading
          ? "Loading weighment reports..."
          : `${filteredRecords.length} matching record(s) of ${records.length}.`}
      </p>

      {visibleRecords.length > 0 ? (
        <div className="reports-table-wrapper">
          <table className="reports-table">
            <caption>
              Completed weighment records
            </caption>

            <thead>
              <tr>
                {columns.map(([field, label]) => (
                  <th key={field} scope="col">
                    {label}
                  </th>
                ))}
                <th scope="col">Actions</th>
              </tr>
            </thead>

            <tbody>
              {visibleRecords.map((record, index) => (
                <tr key={startIndex + index}>
                  {columns.map(([field]) => (
                    <td key={field}>
                      {record[field] == null ||
                      record[field] === ""
                        ? "—"
                        : String(record[field])}
                    </td>
                  ))}

                  <td className="reports-actions">
                      <button
                        type="button"
                        className="reports-view-btn"
                        onClick={() => setSelectedRecord(record)}
                      >
                        View
                      </button>

                      <button
                        type="button"
                        className="reports-delete-btn"
                        onClick={() => handleDelete(record)}
                      >
                        Delete
                      </button>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading &&
        !error && (
          <p>No matching records found.</p>
        )
      )}

      <div className="reports-pagination">
        <div className="reports-page-size">
          <label htmlFor="report-page-size">
            Rows per page
          </label>

          <select
            id="report-page-size"
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        <span>
          {filteredRecords.length === 0
            ? "Showing 0 records"
            : `Showing ${startIndex + 1}–${Math.min(
                startIndex + pageSize,
                filteredRecords.length
              )} of ${filteredRecords.length}`}
        </span>

        <div className="reports-page-buttons">
          <button
            className="reports-secondary"
            type="button"
            disabled={currentPage === 1 || loading}
            onClick={() => setPage(currentPage - 1)}
          >
            Previous
          </button>

          <span>
            Page {currentPage} of {totalPages}
          </span>

          <button
            className="reports-secondary"
            type="button"
            disabled={currentPage === totalPages || loading}
            onClick={() => setPage(currentPage + 1)}
          >
            Next
          </button>
        </div>

           </div>  {/* Line 494 */}

      {/* View Details Modal */}
      {selectedRecord && (
        <div
          className="reports-modal-overlay"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="reports-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Weighment Details"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>Weighment Details</h3>

            {columns.map(([field, label]) => (
              <p key={field}>
                <strong>{label}:</strong>{" "}
                {selectedRecord[field] ?? "—"}
              </p>
            ))}

            <button
              type="button"
              onClick={() => setSelectedRecord(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>  
  );
}

export default Reports;