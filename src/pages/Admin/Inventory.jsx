import React, { useEffect, useState } from "react";
import { AdminAPI } from "../../utils/auth";
import { useToast } from "../../hooks/use-toast";

function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("pending");
  const [actionId, setActionId] = useState(null);
  const { toast } = useToast();

  const fetchItems = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await AdminAPI.catalog.list({ status: filter });
      setItems(Array.isArray(data) ? data : data?.catalog || []);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [filter]);

  const approve = async (id) => {
    setActionId(id);
    try { await AdminAPI.catalog.approve(id); await fetchItems(); toast({ title: "Inventory approved" }); }
    catch (e) { toast({ title: "Approve failed", description: e?.response?.data?.message || e.message, variant: "destructive" }); }
    finally { setActionId(null); }
  };
  const reject = async (id) => {
    setActionId(id);
    try { await AdminAPI.catalog.reject(id); await fetchItems(); toast({ title: "Inventory rejected" }); }
    catch (e) { toast({ title: "Reject failed", description: e?.response?.data?.message || e.message, variant: "destructive" }); }
    finally { setActionId(null); }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Inventory Approvals</h1>
        <select className="border p-2 rounded" value={filter} onChange={(e)=>setFilter(e.target.value)}>
          <option value="pending">pending</option>
          <option value="approved">approved</option>
          <option value="rejected">rejected</option>
          <option value="withdrawn">withdrawn</option>
        </select>
      </div>
      {loading ? (
        <div className="flex items-center gap-2"><span className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-transparent rounded-full"></span> Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">ID</th>
                <th className="p-2 border">Lot</th>
                <th className="p-2 border">Title</th>
                <th className="p-2 border">Price/kg</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id || it._id}>
                  <td className="p-2 border">{it.id || it._id}</td>
                  <td className="p-2 border">{it.delivery || it.lotId || "-"}</td>
                  <td className="p-2 border">{it.title || it.name}</td>
                  <td className="p-2 border">{it.pricePerKg || it.price}</td>
                  <td className="p-2 border">{it.status}</td>
                  <td className="p-2 border space-x-2">
                    <button
                      className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-50"
                      disabled={actionId === (it.id || it._id)}
                      onClick={() => approve(it.id || it._id)}
                    >Approve</button>
                    <button
                      className="px-3 py-1 bg-red-600 text-white rounded disabled:opacity-50"
                      disabled={actionId === (it.id || it._id)}
                      onClick={() => reject(it.id || it._id)}
                    >Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Inventory;
