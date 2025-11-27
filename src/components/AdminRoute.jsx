import React from "react";
import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
  const userRaw = localStorage.getItem("user") || sessionStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : null;
  const isAdmin = !!token && user?.role === "admin";
  return isAdmin ? children : <Navigate to="/login" />;
}