// PLACE AT: src/pages/TeacherDashboard.jsx  (NEW FILE — placeholder, full design port comes next)

import React from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { clearSession } from "../api/session";

const TeacherDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md text-center border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Teacher Dashboard</h2>
        <p className="text-sm text-gray-600 mb-6">
          You're logged in! Full dashboard design coming in the next build pass.
        </p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 justify-center mx-auto text-red-600 font-semibold text-sm hover:underline"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </div>
  );
};

export default TeacherDashboard;