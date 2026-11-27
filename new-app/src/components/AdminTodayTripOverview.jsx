import { useEffect, useState } from "react";
import { getSites } from "../api/sitesApi";
import weighmentReportApi from "../api/weighmentReportApi";
import TodayTripOverview from "./TodayTripOverview";

export default function AdminTodayTripOverview({ accessToken }) {
  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState("all");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError("");
      setRecords([]);

      try {
        const siteList = await getSites(accessToken);

        if (!Array.isArray(siteList)) {
          throw new Error("Invalid site response.");
        }

        if (cancelled) return;
        setSites(siteList);

        const selected = siteId === "all"
          ? siteList
          : siteList.filter(site => String(site.id) === siteId);

        if (siteId !== "all" && selected.length === 0) {
          throw new Error("Selected site is unavailable.");
        }

        const results = await Promise.all(
          selected.map(site =>
            weighmentReportApi.getAllBySite(site.id)
          )
        );

        if (!results.every(Array.isArray)) {
          throw new Error("Invalid weighment response.");
        }

        if (!cancelled) {
          setRecords(results.flat());
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load trips.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (accessToken) {
      loadData();
    } else {
      setRecords([]);
      setError("Login session unavailable.");
      setLoading(false);
    }

    return () => { cancelled = true; };
  }, [accessToken, siteId, refresh]);

  const scope = siteId === "all"
    ? "All Sites"
    : sites.find(site => String(site.id) === siteId)?.siteName
      || "Selected Site";

  return (
    <div>
      <div className="wa-site-selector">
        <label htmlFor="admin-trip-site">Trip Overview Site</label>
        <select
          id="admin-trip-site"
          className="wa-site-select"
          value={siteId}
          disabled={loading}
          onChange={event => {
            setLoading(true);
            setRecords([]);
            setSiteId(event.target.value);
          }}
        >
          <option value="all">All Sites</option>
          {sites.map(site => (
            <option key={site.id} value={String(site.id)}>
              {site.siteName}
            </option>
          ))}
        </select>
      </div>

      <TodayTripOverview
        records={records}
        loading={loading}
        error={error}
        scope={scope}
        onRefresh={() => setRefresh(value => value + 1)}
      />
    </div>
  );
}