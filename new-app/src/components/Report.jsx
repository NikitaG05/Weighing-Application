import { useCallback, useEffect, useMemo, useState } from "react";
import { getLocalReports } from "../api/reportsApi";
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

function Reports({ accessToken }) {
  const [records, setRecords] = useState([]);
  const [fileErrors, setFileErrors] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getLocalReports(accessToken);
      setRecords(data.records);
      setFileErrors(data.errors || []);
      setPage(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const invalidDateRange =
    fromDate && toDate && fromDate > toDate;

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (fromDate && toDate && fromDate > toDate) {
      return [];
    }

    return records.filter((record) => {
      const matchesSearch =
        !query ||
        columns.some(([field]) =>
          String(record[field] ?? "").toLowerCase().includes(query)
        );

      // Desktop format: yyyy-MM-dd HH:mm:ss
      const ticketDate = String(record.TicketDate ?? "").slice(0, 10);
      const hasValidDate = /^\d{4}-\d{2}-\d{2}$/.test(ticketDate);

      const matchesDate =
        (!fromDate && !toDate) ||
        (hasValidDate &&
          (!fromDate || ticketDate >= fromDate) &&
          (!toDate || ticketDate <= toDate));

      return matchesSearch && matchesDate;
    });
  }, [records, search, fromDate, toDate]);

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

  function clearFilters() {
    setSearch("");
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  return (
    <div className="reports">
      <h2>Weighment Reports</h2>
      <p>JSON exports from the local desktop application.</p>

      <div className="reports-filters">
        <div className="reports-filter">
          <label htmlFor="report-search">Search records</label>
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
          <label htmlFor="report-from">Ticket date from</label>
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
          <label htmlFor="report-to">Ticket date to</label>
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
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {invalidDateRange && (
        <div className="reports-errors" role="alert">
          <p>From date must be on or before To date.</p>
        </div>
      )}

      {error && (
        <div className="reports-errors" role="alert">
          <p>{error}</p>
        </div>
      )}

      {fileErrors.length > 0 && (
        <details className="reports-errors">
          <summary>
            {fileErrors.length} file(s) could not be read
          </summary>
          {fileErrors.map((message, index) => (
            <p key={index}>{message}</p>
          ))}
        </details>
      )}

      <p role="status">
        {filteredRecords.length} matching record(s) of {records.length}.
      </p>

      {visibleRecords.length > 0 ? (
        <div className="reports-table-wrapper">
          <table className="reports-table">
            <caption>Desktop weighment records</caption>
            <thead>
              <tr>
                {columns.map(([field, label]) => (
                  <th key={field} scope="col">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {visibleRecords.map((record, index) => (
                <tr key={startIndex + index}>
                  {columns.map(([field]) => (
                    <td key={field}>
                      {record[field] == null || record[field] === ""
                        ? "—"
                        : String(record[field])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && !error && <p>No matching records found.</p>
      )}

      <div className="reports-pagination">
        <div className="reports-page-size">
          <label htmlFor="report-page-size">Rows per page</label>
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

          <span>Page {currentPage} of {totalPages}</span>

          <button
            className="reports-secondary"
            type="button"
            disabled={currentPage === totalPages || loading}
            onClick={() => setPage(currentPage + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default Reports;