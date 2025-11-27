import React, { useEffect, useState } from "react";
import { AdminAPI } from "../../utils/auth";
import { useToast } from "../../hooks/use-toast";

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", role: "buyer" });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await AdminAPI.users.list();
      setUsers(Array.isArray(data) ? data : data?.users || []);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await AdminAPI.users.create(form);
      setForm({ name: "", email: "", role: "buyer" });
      await fetchUsers();
      toast({ title: "User created", description: `${form.email} added` });
    } catch (e) {
      toast({ title: "Create failed", description: e?.response?.data?.message || e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const suspend = async (id) => {
    try { await AdminAPI.users.suspend(id); await fetchUsers(); toast({ title: "User suspended" }); }
    catch (e) { toast({ title: "Suspend failed", description: e?.response?.data?.message || e.message, variant: "destructive" }); }
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try { await AdminAPI.users.remove(id); await fetchUsers(); toast({ title: "User deleted" }); }
    catch (e) { toast({ title: "Delete failed", description: e?.response?.data?.message || e.message, variant: "destructive" }); }
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-semibold">User Management</h1>

      <form className="flex gap-2 items-end" onSubmit={onCreate}>
        <div>
          <label className="block text-sm">Name</label>
          <input className="border p-2 rounded" value={form.name}
                 onChange={(e)=>setForm({...form, name:e.target.value})} required />
        </div>
        <div>
          <label className="block text-sm">Email</label>
          <input type="email" className="border p-2 rounded" value={form.email}
                 onChange={(e)=>setForm({...form, email:e.target.value})} required />
        </div>
        <div>
          <label className="block text-sm">Role</label>
          <select className="border p-2 rounded" value={form.role}
                  onChange={(e)=>setForm({...form, role:e.target.value})}>
            <option value="admin">admin</option>
            <option value="buyer">buyer</option>
            <option value="wetmill">wetmill</option>
            <option value="drymill">drymill</option>
            <option value="roaster">roaster</option>
            <option value="farmer">farmer</option>
          </select>
        </div>
        <button disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded">Add</button>
      </form>

      {loading ? (
        <div className="flex items-center gap-2"><span className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-transparent rounded-full"></span> Loading users...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">ID</th>
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Email</th>
                <th className="p-2 border">Role</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
            {users.map(u => (
              <tr key={u.id || u._id}>
                <td className="p-2 border">{u.id || u._id}</td>
                <td className="p-2 border">{u.name || u.fullName || "-"}</td>
                <td className="p-2 border">{u.email}</td>
                <td className="p-2 border">{u.role}</td>
                <td className="p-2 border">{u.status || (u.suspended ? "suspended" : "active")}</td>
                <td className="p-2 border space-x-2">
                  <button className="px-3 py-1 bg-yellow-600 text-white rounded" onClick={()=>suspend(u.id || u._id)}>Suspend</button>
                  <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={()=>remove(u.id || u._id)}>Delete</button>
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

export default Users;
