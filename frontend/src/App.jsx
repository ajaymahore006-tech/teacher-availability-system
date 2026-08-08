// PLACE AT: src/App.jsx  (REPLACES your existing file)

import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Gateway from "./pages/Gateway";
import StudentLogin from "./pages/StudentLogin";
import StudentSignup from "./pages/StudentSignup";
import TeacherLogin from "./pages/TeacherLogin";
import TeacherRequestAccess from "./pages/TeacherRequestAccess";
import SetPassword from "./pages/SetPassword";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import AdminPanel from "./pages/AdminPanel";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Gateway />} />
        <Route path="/login/student" element={<StudentLogin />} />
        <Route path="/signup/student" element={<StudentSignup />} />
        <Route path="/login/teacher" element={<TeacherLogin />} />
        <Route path="/teacher/request-access" element={<TeacherRequestAccess />} />
        <Route path="/set-password" element={<SetPassword />} />

        {/* Protected */}
        <Route
          path="/dashboard/student"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/teacher"
          element={
            <ProtectedRoute requiredRole="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/requests/:requestId"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminPanel />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;