// PLACE AT: src/pages/AdminPanel.jsx  (REPLACES your existing file)

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Check, X, Trash2, ShieldPlus, ShieldMinus, ArrowUpRight } from "lucide-react";
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

const DEPARTMENTS = { 1: "Computer Science Engineering (CSE)", 2: "Electronics & Communication Engineering (ECE)" };

const AdminPanel = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("requests");
  const [requests, setRequests] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");

  const [staffTypeFilter, setStaffTypeFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");

  // NEW: which teacher's detail panel is open. null = closed.
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  const filteredTeachers = teachers.filter((t) => {
    const staffMatch = staffTypeFilter === "All" || t.staff_type === staffTypeFilter;
    const deptMatch = departmentFilter === "All" || String(t.department_id) === departmentFilter;
    return staffMatch && deptMatch;
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqRes, teacherRes] = await Promise.all([adminListRequests("Pending"), adminListTeachers()]);
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
    await adminApproveRequest(id).catch((e) => setActionMsg(e.response?.data?.detail || "Failed to approve."));
    loadData();
  };
  const handleReject = async (id) => {
    await adminRejectRequest(id).catch((e) => setActionMsg(e.response?.data?.detail || "Failed to reject."));
    loadData();
  };
  const handleDelete = async (id) => {
    if (!window.confirm("Remove this teacher account? This cannot be undone.")) return;
    await adminDeleteTeacher(id).catch((e) => setActionMsg(e.response?.data?.detail || "Failed to delete."));
    setSelectedTeacher(null);
    loadData();
  };
  const handlePromote = async (id) => {
    await adminPromoteTeacher(id).catch((e) => setActionMsg(e.response?.data?.detail || "Failed to promote."));
    loadData();
  };
  const handleDemote = async (id) => {
    await adminDemoteTeacher(id).catch((e) => setActionMsg(e.response?.data?.detail || "Failed to demote."));
    loadData();
  };

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#F9FFFD] text-[#0E1B1E]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap');
        .font-display { font-family: 'Archivo Black', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'Space Mono', monospace; }
      `}</style>

      {/* TOP BAR */}
      <header className="sticky top-0 z-40 bg-[#F9FFFD]/90 backdrop-blur-sm border-b border-[#0E1B1E]/10 px-5 sm:px-8 py-4 flex items-center justify-between">
        <h1 className="font-display uppercase text-lg">Admin Panel</h1>
        <button onClick={handleLogout} className="flex items-center gap-2 font-mono text-xs tracking-widest text-[#F43493] hover:opacity-70">
          <LogOut className="w-4 h-4" /> LOGOUT
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-5 sm:px-8 py-8">
        {actionMsg && (
          <div className="mb-5 font-body text-sm bg-[#6BCFE0]/20 border border-[#6BCFE0] px-4 py-3">{actionMsg}</div>
        )}

        {/* TABS */}
        <div className="flex gap-8 mb-8 border-b border-[#0E1B1E]/10">
          <button
            onClick={() => setTab("requests")}
            className={`font-mono text-xs tracking-widest pb-3 border-b-2 transition-colors ${
              tab === "requests" ? "border-[#F43493] text-[#0E1B1E]" : "border-transparent text-[#0E1B1E]/40"
            }`}
          >
            PENDING REQUESTS ({requests.length})
          </button>
          <button
            onClick={() => setTab("teachers")}
            className={`font-mono text-xs tracking-widest pb-3 border-b-2 transition-colors ${
              tab === "teachers" ? "border-[#F43493] text-[#0E1B1E]" : "border-transparent text-[#0E1B1E]/40"
            }`}
          >
            MANAGE TEACHERS ({teachers.length})
          </button>
        </div>

        {loading ? (
          <p className="font-mono text-sm text-[#0E1B1E]/50">LOADING...</p>
        ) : tab === "requests" ? (
          <div className="space-y-3">
            {requests.length === 0 && <p className="font-body text-sm text-[#0E1B1E]/50">No pending requests right now.</p>}
            {requests.map((r) => (
              <div key={r.id} className="border border-[#0E1B1E]/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display uppercase text-base">{r.name}</h3>
                  <p className="font-body text-sm text-[#0E1B1E]/60">{r.email}</p>
                  <p className="font-mono text-xs text-[#A05341] mt-1">
                    {DEPARTMENTS[r.department_id] || `DEPT ${r.department_id}`} · {r.staff_type?.toUpperCase()}
                  </p>
                  {r.message && <p className="font-body text-xs text-[#0E1B1E]/40 mt-1 italic">"{r.message}"</p>}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => handleApprove(r.id)} className="flex items-center gap-1 bg-[#0E1B1E] text-white font-mono text-xs tracking-widest px-4 py-2.5 hover:bg-[#0E1B1E]/85">
                    <Check className="w-3.5 h-3.5" /> APPROVE
                  </button>
                  <button onClick={() => handleReject(r.id)} className="flex items-center gap-1 border border-[#F43493] text-[#F43493] font-mono text-xs tracking-widest px-4 py-2.5 hover:bg-[#F43493]/10">
                    <X className="w-3.5 h-3.5" /> REJECT
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap gap-3 mb-5">
              <select value={staffTypeFilter} onChange={(e) => setStaffTypeFilter(e.target.value)} className="font-mono text-xs border border-[#0E1B1E]/20 px-3 py-2 bg-transparent">
                <option value="All">ALL STAFF TYPES</option>
                <option value="Teaching">TEACHING</option>
                <option value="Non-Teaching">NON-TEACHING</option>
              </select>
              <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="font-mono text-xs border border-[#0E1B1E]/20 px-3 py-2 bg-transparent">
                <option value="All">ALL DEPARTMENTS</option>
                <option value="1">CSE</option>
                <option value="2">ECE</option>
              </select>
            </div>

            {/* Clickable rows — same list works for mobile and desktop, just simpler columns than before */}
            <div className="border border-[#0E1B1E]/10">
              {filteredTeachers.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTeacher(t)}
                  className="w-full flex items-center justify-between px-5 py-4 border-b border-[#0E1B1E]/10 last:border-0 hover:bg-[#6BCFE0]/10 text-left transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display uppercase text-sm">{t.name}</span>
                      {t.is_admin && <span className="font-mono text-[10px] bg-[#0E1B1E] text-white px-1.5 py-0.5">ADMIN</span>}
                    </div>
                    <p className="font-body text-xs text-[#0E1B1E]/50">{t.email}</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[#0E1B1E]/30 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* SLIDE-OVER DETAIL PANEL — only renders when selectedTeacher is not null */}
      {selectedTeacher && (
        <>
          {/* backdrop — clicking it closes the panel */}
          <div className="fixed inset-0 bg-[#0E1B1E]/40 z-40" onClick={() => setSelectedTeacher(null)} />

          <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-[#F9FFFD] z-50 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#0E1B1E]/10">
              <span className="font-mono text-xs tracking-widest text-[#0E1B1E]/50">TEACHER DETAILS</span>
              <button onClick={() => setSelectedTeacher(null)} className="text-[#0E1B1E]/50 hover:text-[#0E1B1E]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <h2 className="font-display uppercase text-2xl mb-1">{selectedTeacher.name}</h2>
              <p className="font-body text-sm text-[#0E1B1E]/60 mb-6">{selectedTeacher.email}</p>

              <div className="space-y-4 font-body text-sm">
                <div className="flex justify-between border-b border-[#0E1B1E]/10 pb-3">
                  <span className="text-[#0E1B1E]/50">Teacher ID</span>
                  <span className="font-mono">{selectedTeacher.id}</span>
                </div>
                <div className="flex justify-between border-b border-[#0E1B1E]/10 pb-3">
                  <span className="text-[#0E1B1E]/50">Department</span>
                  <span>{DEPARTMENTS[selectedTeacher.department_id] || "—"}</span>
                </div>
                <div className="flex justify-between border-b border-[#0E1B1E]/10 pb-3">
                  <span className="text-[#0E1B1E]/50">Staff Type</span>
                  <span>{selectedTeacher.staff_type}</span>
                </div>
                <div className="flex justify-between border-b border-[#0E1B1E]/10 pb-3">
                  <span className="text-[#0E1B1E]/50">Status</span>
                  <span>{selectedTeacher.status}</span>
                </div>
                <div className="flex justify-between border-b border-[#0E1B1E]/10 pb-3">
                  <span className="text-[#0E1B1E]/50">Admin Access</span>
                  <span>{selectedTeacher.is_admin ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-[#0E1B1E]/10 space-y-2">
              {selectedTeacher.is_admin ? (
                <button
                  onClick={() => { handleDemote(selectedTeacher.id); setSelectedTeacher(null); }}
                  className="w-full flex items-center justify-center gap-2 border border-[#A05341] text-[#A05341] font-mono text-xs tracking-widest py-3 hover:bg-[#A05341]/10"
                >
                  <ShieldMinus className="w-4 h-4" /> REMOVE ADMIN ACCESS
                </button>
              ) : (
                <button
                  onClick={() => { handlePromote(selectedTeacher.id); setSelectedTeacher(null); }}
                  className="w-full flex items-center justify-center gap-2 border border-[#0E1B1E] text-[#0E1B1E] font-mono text-xs tracking-widest py-3 hover:bg-[#0E1B1E]/5"
                >
                  <ShieldPlus className="w-4 h-4" /> GRANT ADMIN ACCESS
                </button>
              )}
              <button
                onClick={() => handleDelete(selectedTeacher.id)}
                className="w-full flex items-center justify-center gap-2 bg-[#F43493] text-white font-mono text-xs tracking-widest py-3 hover:bg-[#e02384]"
              >
                <Trash2 className="w-4 h-4" /> REMOVE TEACHER
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminPanel;