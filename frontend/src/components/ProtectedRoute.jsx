// PLACE AT: src/components/ProtectedRoute.jsx  (NEW FILE)

import { Navigate } from "react-router-dom";
import { isLoggedIn, getRole, isAdmin } from "../api/session";

// requiredRole: "student" | "teacher" | "admin" (admin = teacher role + is_admin flag)
const ProtectedRoute = ({ requiredRole, children }) => {
  if (!isLoggedIn()) {
    return <Navigate to="/" replace />;
  }

  const role = getRole();

  if (requiredRole === "admin") {
    if (role !== "teacher" || !isAdmin()) {
      return <Navigate to="/" replace />;
    }
  } else if (requiredRole && role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;