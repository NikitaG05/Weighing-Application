
import { useCallback, useEffect, useMemo, useState } from "react";
import weighmentReportApi from "../../api/weighmentReportApi";
import "../../style/Report.css";

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

const normalizeRecord = (record) => ({
  TicketNo: record.ticketNo ?? record.TicketNo,
  WBName: record.wbName ?? record.WBName ?? "",
  VehicleNo: record.vehicleNo ?? record.VehicleNo,
  PartyName: record.partyName ?? record.PartyName,
  ProductName: record.productName ?? record.ProductName,
  GrossWeight: record.grossWeight ?? record.GrossWeight,
  TareWeight: record.tareWeight ?? record.TareWeight,
  NetWeight: record.netWeight ?? record.NetWeight,
  GrossDate: record.grossDate ?? record.GrossDate,
  TareDate: record.tareDate ?? record.TareDate,
  TicketDate: record.ticketDate ?? record.TicketDate,
  OperatorName: record.operatorName ?? record.OperatorName,
  ShiftName: record.shiftName ?? record.ShiftName,
});

function Reports({ siteId }) {
  const [records, setRecords] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const loadReports = useCallback(async () => {
    if (!siteId) {
      setRecords([]);
      setError("Please select a weighbridge site.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await weighmentReportApi.getLocalReports(siteId);

      const normalized = Array.isArray(data)
        ? data.map(normalizeRecord)
        : [];

      setRecords(normalized);
      setPage(1);
    } catch (err) {
      setRecords([]);
      setError(err.message || "Unable to load reports.");
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const invalidDateRange =
    fromDate && toDate && fromDate > toDate;

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (invalidDateRange) {
      return [];
    }

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

  const clearFilters = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  return (
    <div className="reports">
      <h2>Weighment Reports</h2>
      <p>Completed weighment records synchronized from TareX Desktop.</p>

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
                      {record[field] == null ||
                      record[field] === ""
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
