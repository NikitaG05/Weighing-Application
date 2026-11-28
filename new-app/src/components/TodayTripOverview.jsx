export default function TodayTripOverview({
  records = [],
  loading = false,
  error = "",
  scope = "Selected site",
  onRefresh
}) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());

  const todayRecords = records.filter(record =>
    record.deleted !== true &&
    record.cloudHidden !== true &&
    String(record.ticketDate || "").slice(0, 10) === today
  );

  const completed = todayRecords.filter(
    record => record.completed === true
  );

  const pending = todayRecords.length - completed.length;

  const netWeight = completed.reduce(
    (total, record) => total + (Number(record.netWeight) || 0),
    0
  );

  const cards = [
    ["Today's Total Trips", todayRecords.length, "#2563eb"],
    ["Today's Completed Trips", completed.length, "#16a34a"],
    ["Today's Pending Trips", pending, "#d97706"],
    ["Today's Net Weight", netWeight.toLocaleString("en-IN", {
      maximumFractionDigits: 3
    }) + " kg", "#0891b2"]
  ];

  return (
    <section className="dashboard-insights">
      <div className="dashboard-insights-header">
        <div>
          <h3>Today's Trip Overview</h3>
          <p>{scope} | {today} | IST</p>
        </div>
        <button
          type="button"
          className="dashboard-insights-refresh"
          disabled={loading}
          onClick={onRefresh}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <p className="dashboard-insights-error" role="alert">
          {error}
        </p>
      )}

      <div className="dashboard-insights-grid">
        {cards.map(([label, value, color]) => (
          <div
            className="dashboard-insight-card"
            key={label}
            style={{ borderTop: `3px solid ${color}` }}
          >
            <div className="dashboard-insight-top">
              <span className="dashboard-insight-label">
                {label}
              </span>
            </div>
            <strong className="dashboard-insight-value">
              {loading ? "..." : error ? "-" : value}
            </strong>
            <span className="dashboard-insight-note">
              {scope}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}