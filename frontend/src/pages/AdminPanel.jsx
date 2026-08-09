// PLACE AT: src/pages/AdminPanel.jsx  (NEW FILE)

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LogOut, Check, X, Trash2, ShieldPlus, ShieldMinus, Users, Inbox, ShieldCheck } from "lucide-react";
import {
  adminListRequests,
  adminApproveRequest,
  adminRejectRequest,
  adminListTeachers,
  adminDeleteTeacher,
  adminPromoteTeacher,
  adminDemoteTeacher,
} from "../api/auth";
import { clearSession } from "../api/session";

// Matches your departments table — keep this in sync with TeacherRequestAccess.jsx
const DEPARTMENTS = {
  1: "Computer Science Engineering (CSE)",
  2: "Electronics & Communication Engineering (ECE)",
};

const AdminPanel = () => {
  const navigate = useNavigate();
  const { requestId } = useParams(); // supports the /admin/requests/:requestId deep link from emails

  const [tab, setTab] = useState(requestId ? "requests" : "requests");
  const [requests, setRequests] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");

  // NEW: filter state for Manage Teachers tab
  const [staffTypeFilter, setStaffTypeFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");

  const filteredTeachers = teachers.filter((t) => {
    const staffMatch = staffTypeFilter === "All" || t.staff_type === staffTypeFilter;
    const deptMatch = departmentFilter === "All" || String(t.department_id) === departmentFilter;
    return staffMatch && deptMatch;
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqRes, teacherRes] = await Promise.all([
        adminListRequests("Pending"),
        adminListTeachers(),
      ]);
      setRequests(reqRes.data);
      setTeachers(teacherRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id) => {
    try {
      await adminApproveRequest(id);
      setActionMsg("Request approved. Teacher account created and setup email sent.");
      loadData();
    } catch (err) {
      setActionMsg(err.response?.data?.detail || "Failed to approve.");
    }
  };

  const handleReject = async (id) => {
    try {
      await adminRejectRequest(id);
      setActionMsg("Request rejected.");
      loadData();
    } catch (err) {
      setActionMsg(err.response?.data?.detail || "Failed to reject.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this teacher account? This cannot be undone.")) return;
    try {
      await adminDeleteTeacher(id);
      loadData();
    } catch (err) {
      setActionMsg(err.response?.data?.detail || "Failed to delete.");
    }
  };

  const handlePromote = async (id) => {
    try {
      await adminPromoteTeacher(id);
      loadData();
    } catch (err) {
      setActionMsg(err.response?.data?.detail || "Failed to promote.");
    }
  };

  const handleDemote = async (id) => {
    try {
      await adminDemoteTeacher(id);
      loadData();
    } catch (err) {
      setActionMsg(err.response?.data?.detail || "Failed to demote.");
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAVBAR */}
      <header className="bg-white shadow-sm border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">DFA Admin Panel</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {actionMsg && (
          <div className="mb-5 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg p-3">
            {actionMsg}
          </div>
        )}

        {/* TABS */}
        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setTab("requests")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
              tab === "requests" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Inbox className="w-4 h-4" /> Pending Requests ({requests.length})
          </button>
          <button
            onClick={() => setTab("teachers")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
              tab === "teachers" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Users className="w-4 h-4" /> Manage Teachers ({teachers.length})
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500 text-sm">Loading...</p>
        ) : tab === "requests" ? (
          <div className="space-y-4">
            {requests.length === 0 && (
              <p className="text-gray-500 text-sm">No pending requests right now.</p>
            )}
            {requests.map((r) => (
              <div
                key={r.id}
                className={`bg-white border rounded-xl p-5 shadow-sm flex items-center justify-between ${
                  requestId && parseInt(requestId, 10) === r.id ? "ring-2 ring-blue-400" : ""
                }`}
              >
                <div>
                  <h3 className="font-semibold text-slate-900">{r.name}</h3>
                  <p className="text-sm text-gray-500">{r.email}</p>
                  <p className="text-xs text-blue-600 font-medium mt-1">
                    {DEPARTMENTS[r.department_id] || `Department ID: ${r.department_id}`}
                  </p>
                  {r.message && <p className="text-xs text-gray-400 mt-1 italic">"{r.message}"</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(r.id)}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
                  >
                    <Check className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => handleReject(r.id)}
                    className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            {/* NEW: Filter bar */}
            <div className="flex flex-wrap gap-3 mb-4">
              <select
                value={staffTypeFilter}
                onChange={(e) => setStaffTypeFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="All">All Staff Types</option>
                <option value="Teaching">Teaching Staff</option>
                <option value="Non-Teaching">Non-Teaching Staff</option>
              </select>

              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="All">All Departments</option>
                <option value="1">CSE</option>
                <option value="2">ECE</option>
              </select>
            </div>

          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Staff Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((t) => (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      <div className="flex items-center gap-2">
                        {t.name}
                        {t.is_admin && (
                          <span className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                            <ShieldCheck className="w-3 h-3" /> Admin
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{t.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        t.staff_type === "Teaching" ? "bg-indigo-50 text-indigo-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {t.staff_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{t.status}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        {t.is_admin ? (
                          <button
                            onClick={() => handleDemote(t.id)}
                            title="Demote from admin"
                            className="text-amber-600 hover:text-amber-800"
                          >
                            <ShieldMinus className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePromote(t.id)}
                            title="Promote to admin"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ShieldPlus className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(t.id)}
                          title="Remove teacher"
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;