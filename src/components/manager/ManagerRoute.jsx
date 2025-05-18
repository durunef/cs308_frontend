import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ManagerRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // 1) Not logged in → send to login & preserve where we wanted to go
  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${location.pathname}`} replace />;
  }

  // 2) Logged in but not a product-manager → kick back to home
  if (user.role !== "product-manager") {
    return <Navigate to="/" replace />;
  }

  // 3) OK!
  return children;
}
