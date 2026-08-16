// PLACE AT: src/pages/TeacherDashboard.jsx  (REPLACES your existing file)

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Check, X, Circle, MessageSquare } from "lucide-react";
import { teacherProfile, teacherAppointments, teacherUpdateAppointment, teacherUpdateStatus } from "../api/auth";
import { clearSession } from "../api/session";
import ChatPanel from "../components/ChatPanel";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);

  // NEW: which appointment's chat is open. null = closed.
  const [chatAppointment, setChatAppointment] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profileRes, apptRes] = await Promise.all([teacherProfile(), teacherAppointments()]);
      setProfile(profileRes.data);
      setAppointments(apptRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Toggle availability: flips Available <-> Not Available, tells the backend, then refreshes.
  const handleToggleStatus = async () => {
    if (!profile) return;
    const newStatus = profile.status === "Available" ? "Not Available" : "Available";
    setStatusLoading(true);
    try {
      await teacherUpdateStatus(newStatus);
      setProfile({ ...profile, status: newStatus }); // update locally so the UI reacts instantly
    } catch (err) {
      console.error(err);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleAppointmentAction = async (id, status) => {
    try {
      await teacherUpdateAppointment(id, status);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  const pending = appointments.filter((a) => a.status === "Pending");
  const resolved = appointments.filter((a) => a.status !== "Pending");
  const isAvailable = profile?.status === "Available";

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
        <h1 className="font-display uppercase text-lg">Faculty Dashboard</h1>
        <button onClick={handleLogout} className="flex items-center gap-2 font-mono text-xs tracking-widest text-[#F43493] hover:opacity-70">
          <LogOut className="w-4 h-4" /> LOGOUT
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-5 sm:px-8 py-8">
        {loading ? (
          <p className="font-mono text-sm text-[#0E1B1E]/50">LOADING...</p>
        ) : (
          <>
            {/* WELCOME BLOCK + AVAILABILITY TOGGLE */}
            <div className="bg-[#A05341] text-white p-6 sm:p-8 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div>
                <p className="font-mono text-xs tracking-widest text-white/70 mb-1">WELCOME BACK</p>
                <h2 className="font-display uppercase text-2xl sm:text-3xl">{profile?.name}</h2>
                <p className="font-body text-sm text-white/80 mt-1">{profile?.email}</p>
              </div>

              <button
                onClick={handleToggleStatus}
                disabled={statusLoading}
                className="flex items-center gap-2 bg-white text-[#0E1B1E] font-mono text-xs tracking-widest px-4 py-3 hover:bg-white/90 disabled:opacity-60 flex-shrink-0"
              >
                <Circle className={`w-3 h-3 ${isAvailable ? "fill-green-500 text-green-500" : "fill-gray-400 text-gray-400"}`} />
                {statusLoading ? "UPDATING..." : isAvailable ? "AVAILABLE" : "NOT AVAILABLE"}
              </button>
            </div>

            {/* PENDING REQUESTS */}
            <h3 className="font-mono text-xs tracking-widest text-[#0E1B1E]/50 mb-4">
              PENDING REQUESTS ({pending.length})
            </h3>
            <div className="space-y-3 mb-10">
              {pending.length === 0 && (
                <p className="font-body text-sm text-[#0E1B1E]/40">No pending appointment requests right now.</p>
              )}
              {pending.map((a) => (
                <div key={a.id} className="border border-[#0E1B1E]/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-display uppercase text-sm">{a.student_email}</p>
                    <p className="font-body text-sm text-[#0E1B1E]/60 mt-1">{a.purpose}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAppointmentAction(a.id, "Approved")}
                      className="flex items-center gap-1 bg-[#0E1B1E] text-white font-mono text-xs tracking-widest px-4 py-2.5 hover:bg-[#0E1B1E]/85"
                    >
                      <Check className="w-3.5 h-3.5" /> APPROVE
                    </button>
                    <button
                      onClick={() => handleAppointmentAction(a.id, "Rejected")}
                      className="flex items-center gap-1 border border-[#F43493] text-[#F43493] font-mono text-xs tracking-widest px-4 py-2.5 hover:bg-[#F43493]/10"
                    >
                      <X className="w-3.5 h-3.5" /> REJECT
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* RESOLVED (approved/rejected) HISTORY */}
            {resolved.length > 0 && (
              <>
                <h3 className="font-mono text-xs tracking-widest text-[#0E1B1E]/50 mb-4">HISTORY</h3>
                <div className="border border-[#0E1B1E]/10">
                  {resolved.map((a) => (
                    <div key={a.id} className="flex items-center justify-between px-5 py-4 border-b border-[#0E1B1E]/10 last:border-0">
                      <div>
                        <p className="font-body text-sm">{a.student_email}</p>
                        <p className="font-body text-xs text-[#0E1B1E]/50">{a.purpose}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {a.status === "Approved" && (
                          <button
                            onClick={() => setChatAppointment(a)}
                            className="flex items-center gap-1 font-mono text-[10px] tracking-widest text-[#0E1B1E]/60 hover:text-[#0E1B1E] border border-[#0E1B1E]/20 px-2.5 py-1.5"
                          >
                            <MessageSquare className="w-3 h-3" /> CHAT
                          </button>
                        )}
                        <span
                          className={`font-mono text-[10px] px-2 py-1 ${
                            a.status === "Approved" ? "bg-green-100 text-green-700" : "bg-[#F43493]/10 text-[#F43493]"
                          }`}
                        >
                          {a.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>

      {chatAppointment && (
        <ChatPanel
          appointmentId={chatAppointment.id}
          currentRole="teacher"
          otherPartyLabel={chatAppointment.student_email}
          onClose={() => setChatAppointment(null)}
        />
      )}
    </div>
  );
};

export default TeacherDashboard;