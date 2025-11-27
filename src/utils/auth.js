import axios from "axios";

const api = axios.create({ baseURL: "/api" });

// Attach JWT token automatically from storage
api.interceptors.request.use((config) => {
	try {
		const raw = localStorage.getItem("user");
		if (raw) {
			const parsed = JSON.parse(raw);
			const token = parsed?.token || parsed?.accessToken || parsed?.jwt;
			if (token) config.headers.Authorization = `Bearer ${token}`;
		}
	} catch (_) {
		// ignore parse errors
	}
	return config;
});

export const AdminAPI = {
	users: {
		list: () => api.get("/admin/users"),
		create: (payload) => api.post("/admin/users", payload),
		suspend: (id) => api.post(`/admin/users/${id}/suspend`),
		remove: (id) => api.delete(`/admin/users/${id}`),
	},
	approvals: {
		buyer: (payload) => api.post("/admin/approve/buyer", payload),
		wetmill: (payload) => api.post("/admin/approve/wetmill", payload),
		drymill: (payload) => api.post("/admin/approve/drymill", payload),
		roaster: (payload) => api.post("/admin/approve/roaster", payload),
	},
	payments: {
		list: () => api.get("/admin/payments"),
		approve: (id) => api.post(`/admin/payments/${id}/approve`),
		reject: (id) => api.post(`/admin/payments/${id}/reject`),
	},
	catalog: {
		list: (params) => api.get("/catalog", { params }),
		approve: (id) => api.post(`/admin/catalog/${id}/approve`),
		reject: (id) => api.post(`/admin/catalog/${id}/reject`),
	},
	analytics: {
		summary: () => api.get("/admin/stats"),
		topFarmers: (limit = 3) => api.get("/admin/analytics/top-farmers", { params: { limit } }),
		topWetmills: (limit = 3) => api.get("/admin/analytics/top-wetmills", { params: { limit } }),
		topDrymills: (limit = 3) => api.get("/admin/analytics/top-drymills", { params: { limit } }),
	},
	reports: {
		deliveriesCsv: () => "/api/admin/reports/deliveries.csv",
		paymentsCsv: () => "/api/admin/reports/payments.csv",
	},
};

export default api;
