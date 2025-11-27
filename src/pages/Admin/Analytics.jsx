import React, { useEffect, useState } from "react";
import { AdminAPI } from "../../utils/auth";

function Analytics() {
  const [summary, setSummary] = useState(null);
  const [topFarmers, setTopFarmers] = useState([]);
  const [topWetmills, setTopWetmills] = useState([]);
  const [topDrymills, setTopDrymills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [sumRes, farmersRes, wetRes, dryRes] = await Promise.all([
        AdminAPI.analytics.summary(),
        AdminAPI.analytics.topFarmers(5),
        AdminAPI.analytics.topWetmills(5),
        AdminAPI.analytics.topDrymills(5),
      ]);
      setSummary(sumRes.data);
      setTopFarmers(Array.isArray(farmersRes.data) ? farmersRes.data : farmersRes.data?.items || []);
      setTopWetmills(Array.isArray(wetRes.data) ? wetRes.data : wetRes.data?.items || []);
      setTopDrymills(Array.isArray(dryRes.data) ? dryRes.data : dryRes.data?.items || []);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-semibold">Analytics</h1>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <>
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border rounded p-4">
                <div className="text-sm text-gray-600">Users</div>
                <div className="text-2xl font-semibold">{summary.usersCount ?? "-"}</div>
              </div>
              <div className="border rounded p-4">
                <div className="text-sm text-gray-600">Deliveries</div>
                <div className="text-2xl font-semibold">{summary.deliveriesCount ?? "-"}</div>
              </div>
              <div className="border rounded p-4">
                <div className="text-sm text-gray-600">Payments</div>
                <div className="text-2xl font-semibold">{summary.paymentsCount ?? "-"}</div>
              </div>
              <div className="border rounded p-4">
                <div className="text-sm text-gray-600">Revenue</div>
                <div className="text-2xl font-semibold">{summary.totalRevenue ?? "-"}</div>
              </div>
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold mb-2">Top Farmers</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border">Farmer</th>
                    <th className="p-2 border">Deliveries</th>
                    <th className="p-2 border">Total Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {topFarmers.map((f) => (
                    <tr key={f.userId || f._id}>
                      <td className="p-2 border">{f.name || f.user?.name || f.userId}</td>
                      <td className="p-2 border">{f.count}</td>
                      <td className="p-2 border">{f.totalWeight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2 mt-6">Top Wetmills</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border">Wetmill</th>
                    <th className="p-2 border">Deliveries</th>
                    <th className="p-2 border">Total Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {topWetmills.map((w) => (
                    <tr key={w.id || w._id}>
                      <td className="p-2 border">{w.name || w.title || w.id || w._id}</td>
                      <td className="p-2 border">{w.count}</td>
                      <td className="p-2 border">{w.totalWeight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2 mt-6">Top Drymills</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border">Drymill</th>
                    <th className="p-2 border">Deliveries</th>
                    <th className="p-2 border">Total Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {topDrymills.map((d) => (
                    <tr key={d.id || d._id}>
                      <td className="p-2 border">{d.name || d.title || d.id || d._id}</td>
                      <td className="p-2 border">{d.count}</td>
                      <td className="p-2 border">{d.totalWeight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Analytics;
