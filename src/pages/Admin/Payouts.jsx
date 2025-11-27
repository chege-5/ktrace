import React, { useState, useEffect } from "react";
import { AdminAPI } from "../../utils/auth";
import { useToast } from "../../hooks/use-toast";

function Payouts() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState(null);
  const { toast } = useToast();

  const fetchPayments = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await AdminAPI.payments.list();
      setPayments(Array.isArray(data) ? data : data?.payments || []);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const approve = async (id) => {
    setActionId(id);
    try {
      await AdminAPI.payments.approve(id);
      await fetchPayments();
      toast({ title: "Payment approved", description: `ID ${id}` });
    } catch (e) {
      toast({ title: "Approve failed", description: e?.response?.data?.message || e.message, variant: "destructive" });
    } finally {
      setActionId(null);
    }
  };

  const reject = async (id) => {
    setActionId(id);
    try {
      await AdminAPI.payments.reject(id);
      await fetchPayments();
      toast({ title: "Payment rejected", description: `ID ${id}` });
    } catch (e) {
      toast({ title: "Reject failed", description: e?.response?.data?.message || e.message, variant: "destructive" });
    } finally {
      setActionId(null);
    }
  };

  if (loading) return <div className="p-4 flex items-center gap-2"><span className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-transparent rounded-full"></span> Loading payments...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Payments Approvals</h1>
      {payments.length === 0 ? (
        <div>No payments found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">ID</th>
                <th className="p-2 border">Payer</th>
                <th className="p-2 border">Amount</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Created</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id || p._id}>
                  <td className="p-2 border">{p.id || p._id}</td>
                  <td className="p-2 border">{p.payer || p.user?.email || "-"}</td>
                  <td className="p-2 border">{p.amount}</td>
                  <td className="p-2 border">{p.status}</td>
                  <td className="p-2 border">{new Date(p.created_at || p.createdAt || Date.now()).toLocaleString()}</td>
                  <td className="p-2 border space-x-2">
                    <button
                      className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-50"
                      disabled={actionId === (p.id || p._id)}
                      onClick={() => approve(p.id || p._id)}
                    >
                      Approve
                    </button>
                    <button
                      className="px-3 py-1 bg-red-600 text-white rounded disabled:opacity-50"
                      disabled={actionId === (p.id || p._id)}
                      onClick={() => reject(p.id || p._id)}
                    >
                      Reject
                    </button>
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

export default Payouts;
