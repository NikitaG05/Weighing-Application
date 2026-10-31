import { useEffect, useMemo, useState } from "react";
import { getMyWeighmentSites, getUserWeighments } from "../api/UserWeighmentApi";
import "../style/UserWeighments.css";

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
    setSelected(null);
    setError("");
    getUserWeighments(siteId, controller.signal)
      .then((data) => setRecords(Array.isArray(data) ? data : []))
      .catch((err) => { if (err.name !== "AbortError") setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setRecordsLoading(false); });
    return () => controller.abort();
  }, [siteId, reload]);

  useEffect(() => { setPage(1); }, [siteId, query, status, from, to]);

  const filtered = useMemo(() => records.filter((r) => {
    const text = [r.ticketNo, r.vehicleNo, r.partyName, r.productName, r.sourceTransactionId].join(" ").toLowerCase();
    const searchMatches = text.includes(query.trim().toLowerCase());
    const statusMatches = status === "ALL" || (status === "COMPLETED" ? r.completed === true : r.completed !== true);
    const day = dayOf(r.ticketDate);
    return searchMatches && statusMatches && (!from || (day && day >= from)) && (!to || (day && day <= to));
  }), [records, query, status, from, to]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const completed = records.filter((r) => r.completed === true).length;
  const netTotal = records.filter((r) => r.completed === true).reduce((sum, r) => sum + (Number(r.netWeight) || 0), 0);

  return (
    <section className="uw-root">
      <div className="uw-heading">
        <div><h2>Weighment Details</h2><p>Synced transactions from your assigned weighbridge sites</p></div>
        <div className="uw-site"><label htmlFor="uw-site">Weighbridge Site</label>
          <select id="uw-site" value={siteId} disabled={sitesLoading || !sites.length} onChange={(e) => setSiteId(e.target.value)}>
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
          <label>Search<input aria-label="Search weighments" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ticket, vehicle, party, product" /></label>
          <label>Status<select value={status} onChange={(e) => setStatus(e.target.value)}><option value="ALL">All</option><option value="COMPLETED">Completed</option><option value="PENDING">Pending</option></select></label>
          <label>From<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
          <label>To<input type="date" min={from || undefined} value={to} onChange={(e) => setTo(e.target.value)} /></label>
          <button type="button" onClick={() => setReload((v) => v + 1)} disabled={!siteId || recordsLoading}>Refresh</button>
        </div>
        <div className="uw-table-wrap"><table><thead><tr><th>Ticket</th><th>Date</th><th>Vehicle</th><th>Party</th><th>Product</th><th>Gross</th><th>Tare</th><th>Net</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>{recordsLoading || sitesLoading ? <tr><td colSpan="10">Loading weighments...</td></tr> : visible.length === 0 ? <tr><td colSpan="10">No weighments found.</td></tr> : visible.map((r) => <tr key={`${r.siteId}-${r.sourceTransactionId}`}><td>{r.ticketNo || "—"}</td><td>{formatDate(r.ticketDate)}</td><td>{r.vehicleNo || "—"}</td><td>{r.partyName || "—"}</td><td>{r.productName || "—"}</td><td>{formatWeight(r.grossWeight)}</td><td>{formatWeight(r.tareWeight)}</td><td>{formatWeight(r.netWeight)}</td><td><span className={`uw-status ${r.completed ? "done" : "pending"}`}>{r.status || (r.completed ? "COMPLETED" : "PENDING")}</span></td><td><button type="button" onClick={() => setSelected(r)}>View</button></td></tr>)}</tbody>
        </table></div>
        <div className="uw-pagination"><span>{filtered.length} record(s) · Page {page} of {totalPages}</span><div><button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button><button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button></div></div>
      </div>
      {selected && <div className="uw-modal-backdrop" onClick={() => setSelected(null)}><div className="uw-modal" role="dialog" aria-modal="true" aria-label="Weighment transaction details" onClick={(e) => e.stopPropagation()}><div className="uw-modal-header"><h3>Transaction Details</h3><button type="button" onClick={() => setSelected(null)} aria-label="Close details">✕</button></div><dl>{[["Ticket No", selected.ticketNo],["Transaction ID", selected.sourceTransactionId],["Site", sites.find((s) => String(s.id) === siteId)?.siteName],["Weighbridge", selected.wbName],["Vehicle", selected.vehicleNo],["Party", selected.partyName],["Product", selected.productName],["Ticket Date", formatDate(selected.ticketDate)],["Gross Date", formatDate(selected.grossDate)],["Tare Date", formatDate(selected.tareDate)],["Gross Weight", formatWeight(selected.grossWeight)],["Tare Weight", formatWeight(selected.tareWeight)],["Net Weight", formatWeight(selected.netWeight)],["Status", selected.status],["Operator", selected.operatorName],["Shift", selected.shiftName],["Synced At", formatDate(selected.syncedAt)]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? "—"}</dd></div>)}</dl></div></div>}
    </section>
  );
}
