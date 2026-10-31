
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

import weighmentReportApi from "../../api/weighmentReportApi";
import "../../style/WeighmentAnalytics.css";

const COLORS = [
  "#2563eb",
  "#0d9488",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
];

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 3,
  });

const getTicketDay = (date) => {
  if (!date) return null;

  // Backend format: yyyy-MM-dd HH:mm:ss
  const day = String(date).slice(0, 10);

  return /^\d{4}-\d{2}-\d{2}$/.test(day)
    ? day
    : null;
};

function WeighmentAnalytics({ siteId }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError("");

      try {
        const data =
          await weighmentReportApi.getAllBySite(siteId);

        if (!cancelled) {
          setRecords(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || "Unable to load analytics."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [siteId]);

  const analytics = useMemo(() => {
    const active = records.filter(
      (record) => record.deleted !== true
    );

    const completed = active.filter(
      (record) => record.completed === true
    );

    const pending = active.length - completed.length;

    const totalNetWeight = completed.reduce(
      (sum, record) =>
        sum + Number(record.netWeight || 0),
      0
    );

    const dailyMap = new Map();
    const productMap = new Map();
    const partyMap = new Map();

    active.forEach((record) => {
      const day = getTicketDay(record.ticketDate);

      if (day) {
        dailyMap.set(
          day,
          (dailyMap.get(day) || 0) + 1
        );
      }

      const party = record.partyName || "Unknown";

      partyMap.set(
        party,
        (partyMap.get(party) || 0) + 1
      );
    });

    completed.forEach((record) => {
      const product =
        record.productName || "Unknown";

      productMap.set(
        product,
        (productMap.get(product) || 0) +
          Number(record.netWeight || 0)
      );
    });

    const dailyData = [...dailyMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date,
        count,
      }));

    const productData = [...productMap.entries()]
      .map(([name, weight]) => ({
        name,
        weight,
      }))
      .sort((a, b) => b.weight - a.weight);

    const partyData = [...partyMap.entries()]
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      total: active.length,
      completed: completed.length,
      pending,
      totalNetWeight,
      dailyData,
      productData,
      partyData,
      statusData: [
        { name: "Completed", value: completed.length },
        { name: "Pending", value: pending },
      ].filter((item) => item.value > 0),
    };
  }, [records]);

  if (loading) {
    return <p>Loading weighment analytics...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <div className="wa-dashboard">
      <div className="wa-heading">
        <h2>Weighment Analytics</h2>
        <p>
          Site-wise statistics from synchronized MySQL
          weighment records.
        </p>
      </div>

      <div className="wa-stats">
        {[
          ["Total Weighments", analytics.total],
          ["Completed", analytics.completed],
          ["Pending", analytics.pending],
          [
            "Total Net Weight",
            formatNumber(analytics.totalNetWeight),
          ],
        ].map(([label, value]) => (
          <div className="wa-stat" key={label}>
            <span>{label}</span>
            <h2>{value}</h2>
          </div>
        ))}
      </div>

      {analytics.total === 0 ? (
        <div className="wa-panel">
          No synchronized weighment records found.
        </div>
      ) : (
        <div className="wa-charts">
          <section className="wa-panel">
            <h3>Daily Weighment Trend</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={analytics.dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Weighments"
                  stroke="#2563eb"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </section>

          <section className="wa-panel">
            <h3>Product-wise Net Weight</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={analytics.productData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={formatNumber} />
                <Legend />
                <Bar
                  dataKey="weight"
                  name="Net Weight"
                  fill="#0d9488"
                />
              </BarChart>
            </ResponsiveContainer>
          </section>

          <section className="wa-panel">
            <h3>Completed vs Pending</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={analytics.statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  label
                >
                  {analytics.statusData.map((item, index) => (
                    <Cell
                      key={item.name}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </section>

          <section className="wa-panel">
            <h3>Top 10 Parties by Weighments</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={analytics.partyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey="count"
                  name="Weighments"
                  fill="#8b5cf6"
                />
              </BarChart>
            </ResponsiveContainer>
          </section>
        </div>
      )}
    </div>
  );
}

export default WeighmentAnalytics;
