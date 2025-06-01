// src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router";

export default function ProtectedRoute() {
  const isAuth = localStorage.getItem("isAuthenticated") === "true";
  return isAuth ? <Outlet /> : <Navigate to="/login" replace />;
}
