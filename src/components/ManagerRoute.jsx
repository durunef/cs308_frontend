// src/components/manager/ManagerRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ManagerRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // 1) Not logged in → send to login (with redirect param)
  if (!isAuthenticated) {
    const params = new URLSearchParams({ redirect: location.pathname });
    return <Navigate to={`/login?${params.toString()}`} replace />;
  }

  // 2) Logged in but NOT a product-manager → send to home
  if (user?.role !== "product-manager") {
    return <Navigate to="/" replace />;
  }

  // 3) Otherwise allow access
  return children;
}
