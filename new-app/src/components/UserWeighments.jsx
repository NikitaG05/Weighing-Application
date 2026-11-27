import { useEffect, useMemo, useState } from "react";
import { getMyWeighmentSites, getUserWeighments } from "../api/UserWeighmentApi";
import "../style/UserWeighments.css";
import WeighmentImageGallery from "./WeighmentImageGallery";

const PAGE_SIZE = 10;
const formatWeight = (value) => value == null ? "—" : `${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 3 })} kg`;
const formatDate = (value) => value ? String(value).replace("T", " ").slice(0, 19) : "—";
const dayOf = (value) => value ? String(value).slice(0, 10) : "";

export default function UserWeighments() {
  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState("");
  const [records, setRecords] = useState([]);
  const [sitesLoading, setSitesLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [bridge, setBridge] = useState("");
  const [party, setParty] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [applied, setApplied] = useState(null);
  const [status, setStatus] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setSitesLoading(true);
    getMyWeighmentSites(controller.signal)
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setSites(list);
        setSiteId((current) => list.some((s) => String(s.id) === String(current)) ? current : (list[0] ? String(list[0].id) : ""));
        setError("");
      })
      .catch((err) => { if (err.name !== "AbortError") setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setSitesLoading(false); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!siteId) { setRecords([]); return; }
    const controller = new AbortController();
    setRecordsLoading(true);
    setRecords([]);
    setSelected(null); setApplied(null);
    setError("");
    getUserWeighments(siteId, controller.signal)
      .then((data) => setRecords(Array.isArray(data) ? data : []))
      .catch((err) => { if (err.name !== "AbortError") setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setRecordsLoading(false); });
    return () => controller.abort();
  }, [siteId, reload]);

  useEffect(() => { setPage(1); }, [siteId, query, status, from, to]);

  const options = (field) => [...new Set(records.map(r => r[field]).filter(Boolean))].sort();

  const filtered = useMemo(() => {
    if (!applied || applied.siteId !== siteId) return [];
    return records.filter((r) => {
      if (applied.bridge && r.wbName !== applied.bridge) return false;
      if (applied.party && r.partyName !== applied.party) return false;
      if (applied.vehicle && r.vehicleNo !== applied.vehicle) return false;
      const { query, status, from, to } = applied;
    const text = [r.ticketNo, r.vehicleNo, r.partyName, r.productName, r.sourceTransactionId].join(" ").toLowerCase();
    const searchMatches = text.includes(query.trim().toLowerCase());
    const statusMatches = status === "ALL" || (status === "COMPLETED" ? r.completed === true : r.completed !== true);
    const day = dayOf(r.ticketDate);
    return searchMatches && statusMatches && (!from || (day && day >= from)) && (!to || (day && day <= to));
  }); }, [records, applied, siteId]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const completed = records.filter((r) => r.completed === true).length;
  const netTotal = records.filter((r) => r.completed === true).reduce((sum, r) => sum + (Number(r.netWeight) || 0), 0);

const reportHeaders = ["Sr. No.", "Weighbridge", "Site", "Ticket No.", "Date Time", "Party", "Vehicle", "Product", "Gross Weight", "Tare Weight", "Net Weight", "Status"];

  const reportRows = () => filtered.map((r, i) => [
    i + 1, r.wbName, sites.find(s => String(s.id) === siteId)?.siteName,
    r.ticketNo, formatDate(r.ticketDate), r.partyName, r.vehicleNo,
    r.productName, r.grossWeight, r.tareWeight, r.netWeight, r.status
  ]);

  const exportCsv = () => {
    const cell = value => {
      let text = String(value ?? "");
      if (typeof value === "string" && /^[\s]*[=+\-@]/.test(text)) text = "'" + text;
      return '"' + text.replace(/"/g, '""') + '"';
    };
    const csv = [reportHeaders, ...reportRows()].map(row => row.map(cell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "TareX-Weighment-Report.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

    const exportExcel = async () => {
    try {
      const XLSX = await import("xlsx");

      const worksheet = XLSX.utils.aoa_to_sheet([
        reportHeaders,
        ...reportRows()
      ]);

      worksheet["!cols"] = [
        { wch: 10 }, { wch: 25 }, { wch: 25 },
        { wch: 15 }, { wch: 22 }, { wch: 25 },
        { wch: 18 }, { wch: 22 }, { wch: 18 },
        { wch: 18 }, { wch: 18 }, { wch: 16 }
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Weighment Report");

      XLSX.writeFile(
        workbook,
        `TareX-Report-${applied.from}-to-${applied.to}.xlsx`
      );
    } catch (err) {
      window.alert("Excel export failed: " + err.message);
    }
  };

const printReport = () => {
    const win = window.open("", "_blank");
    if (!win) {
      window.alert("Please allow pop-ups to print the report.");
      return;
    }
    win.document.title = "TareX Weighment Report";
    const heading = win.document.createElement("h2");
    heading.textContent = "TareX Weighment Report";
    win.document.body.appendChild(heading);
    const table = win.document.createElement("table");
    table.style.cssText = "border-collapse:collapse;width:100%;font:12px Arial";
    [reportHeaders, ...reportRows()].forEach((row, i) => {
      const tr = table.insertRow();
      row.forEach(value => {
        const td = win.document.createElement(i === 0 ? "th" : "td");
        td.textContent = String(value ?? "");
        td.style.cssText = "border:1px solid #999;padding:6px";
        tr.appendChild(td);
      });
    });
    win.document.body.appendChild(table);
    win.focus();
    win.print();
  };

  return (
    <section className="uw-root uw-report">
      <div className="uw-heading">
        <div><h2>Weighment Report</h2><p>Synced transactions from your assigned weighbridge sites</p></div>
        <div className="uw-site"><label htmlFor="uw-site">Weighbridge Site</label>
          <select id="uw-site" value={siteId} disabled={sitesLoading || !sites.length} onChange={(e) => { setApplied(null); setBridge(""); setParty(""); setVehicle(""); setSiteId(e.target.value); }}>
            {!sites.length && <option value="">No assigned sites</option>}
            {sites.map((s) => <option key={s.id} value={String(s.id)}>{s.siteName}</option>)}
          </select>
        </div>
      </div>
      {error && <div className="uw-error" role="alert">{error}</div>}
      <div className="uw-stats">
        <div><span>Total Weighments</span><strong>{records.length}</strong></div>
        <div><span>Completed</span><strong>{completed}</strong></div>
        <div><span>Pending</span><strong>{records.length - completed}</strong></div>
        <div><span>Completed Net Weight</span><strong>{formatWeight(netTotal)}</strong></div>
      </div>
      <div className="uw-panel">
        <div className="uw-filters">
<label>From Date *<input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label>
<label>To Date *<input type="date" min={from || undefined} value={to} onChange={e => setTo(e.target.value)} /></label>
{[
  ["Weighbridge Name", "wbName", bridge, setBridge],
  ["Party Name", "partyName", party, setParty],
  ["Vehicle No.", "vehicleNo", vehicle, setVehicle]
].map(([label, field, value, setter]) => (
  <label key={field}>{label}
    <select value={value} onChange={e => setter(e.target.value)}>
      <option value="">All</option>
      {options(field).map(v => <option key={v} value={v}>{v}</option>)}
    </select>
  </label>
))}
<label>Search<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Ticket, vehicle, party, product" /></label>
<label>Status<select value={status} onChange={e => setStatus(e.target.value)}><option value="ALL">All</option><option value="COMPLETED">Completed</option><option value="PENDING">Pending</option></select></label>
<button type="button" disabled={!siteId || recordsLoading || sitesLoading || !!error} onClick={() => {
  if (!from || !to || from > to) {
    window.alert("Please select a valid From and To date.");
    return;
  }
  setApplied({ siteId, from, to, bridge, party, vehicle, query, status });
  setPage(1);
}}>Search Data</button>
<button type="button" disabled={!filtered.length || recordsLoading || !!error} onClick={printReport}>Print</button>
<button type="button" disabled={!filtered.length || recordsLoading || !!error} onClick={exportCsv}>Export CSV</button>
<button type="button" disabled={!filtered.length || recordsLoading || !!error} onClick={exportExcel}>Export Excel</button>
<button type="button" disabled={!siteId || recordsLoading} onClick={() => { setApplied(null); setReload(v => v + 1); }}>Refresh</button>
</div>
        <div className="uw-table-wrap"><table><thead><tr><th>Sr. No.</th><th>Weighbridge Name</th><th>Site Name</th><th>Ticket No.</th><th>Date &amp; Time</th><th>Vehicle No.</th><th>Party Name</th><th>Product Name</th><th>Gross Weight</th><th>Tare Weight</th><th>Net Weight</th><th>Status</th><th>View</th></tr></thead>
          <tbody>{recordsLoading || sitesLoading ? <tr><td colSpan="13">Loading weighments...</td></tr> : visible.length === 0 ? <tr><td colSpan="13">No weighments found.</td></tr> : visible.map((r, index) => <tr key={`${r.siteId}-${r.sourceTransactionId}`}><td>{(currentPage - 1) * PAGE_SIZE + index + 1}</td><td>{r.wbName || "-"}</td><td>{sites.find(s => String(s.id) === String(r.siteId))?.siteName || "-"}</td><td>{r.ticketNo || "—"}</td><td>{formatDate(r.ticketDate)}</td><td>{r.vehicleNo || "—"}</td><td>{r.partyName || "—"}</td><td>{r.productName || "—"}</td><td>{formatWeight(r.grossWeight)}</td><td>{formatWeight(r.tareWeight)}</td><td>{formatWeight(r.netWeight)}</td><td><span className={`uw-status ${r.completed ? "done" : "pending"}`}>{r.status || (r.completed ? "COMPLETED" : "PENDING")}</span></td><td><button type="button" onClick={() => setSelected(r)}>View</button></td></tr>)}</tbody>
        </table></div>
        <div className="uw-pagination"><span>{filtered.length} record(s) · Page {currentPage} of {totalPages}</span><div><button disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button><button disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button></div></div>
      </div>
      {selected && <div className="uw-modal-backdrop" onClick={() => setSelected(null)}><div className="uw-modal" role="dialog" aria-modal="true" aria-label="Weighment transaction details" onClick={(e) => e.stopPropagation()}><div className="uw-modal-header"><h3>Transaction Details</h3><button type="button" onClick={() => setSelected(null)} aria-label="Close details">✕</button></div><dl>{[["Ticket No", selected.ticketNo],["Transaction ID", selected.sourceTransactionId],["Site", sites.find((s) => String(s.id) === siteId)?.siteName],["Weighbridge", selected.wbName],["Vehicle", selected.vehicleNo],["Party", selected.partyName],["Product", selected.productName],["Ticket Date", formatDate(selected.ticketDate)],["Gross Date", formatDate(selected.grossDate)],["Tare Date", formatDate(selected.tareDate)],["Gross Weight", formatWeight(selected.grossWeight)],["Tare Weight", formatWeight(selected.tareWeight)],["Net Weight", formatWeight(selected.netWeight)],["Status", selected.status],["Operator", selected.operatorName],["Shift", selected.shiftName],["Synced At", formatDate(selected.syncedAt)]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? "—"}</dd></div>)}</dl>

          <WeighmentImageGallery
            key={`${selected.siteId}-${selected.sourceTransactionId}`}
            siteId={selected.siteId}
            transactionId={selected.sourceTransactionId}
          />

        </div></div>}
    </section>
  );
}
