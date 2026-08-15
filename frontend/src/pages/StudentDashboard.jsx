// PLACE AT: src/pages/StudentDashboard.jsx  (REPLACES your existing file)

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Circle, ArrowUpRight, X, CheckCircle2 } from "lucide-react";
import { studentProfile, teacherList, studentBookAppointment } from "../api/auth";
import { clearSession } from "../api/session";

const DEPARTMENTS = { 1: "CSE", 2: "ECE" };

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // NEW: same "selected item" pattern as AdminPanel — null = booking panel closed
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [purpose, setPurpose] = useState("");
  const [booking, setBooking] = useState(false);
  const [bookedMsg, setBookedMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [profileRes, teacherRes] = await Promise.all([studentProfile(), teacherList()]);
      setProfile(profileRes.data);
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

  const openBooking = (teacher) => {
    setSelectedTeacher(teacher);
    setPurpose("");
    setBookedMsg("");
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setBooking(true);
    try {
      await studentBookAppointment(selectedTeacher.id, purpose);
      setBookedMsg("Appointment requested! The teacher will review it soon.");
    } catch (err) {
      setBookedMsg(err.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setBooking(false);
    }
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
        <h1 className="font-display uppercase text-lg">Student Dashboard</h1>
        <button onClick={handleLogout} className="flex items-center gap-2 font-mono text-xs tracking-widest text-[#F43493] hover:opacity-70">
          <LogOut className="w-4 h-4" /> LOGOUT
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-5 sm:px-8 py-8">
        {loading ? (
          <p className="font-mono text-sm text-[#0E1B1E]/50">LOADING...</p>
        ) : (
          <>
            {/* WELCOME BLOCK */}
            <div className="bg-[#6BCFE0] p-6 sm:p-8 mb-8">
              <p className="font-mono text-xs tracking-widest text-[#0E1B1E]/60 mb-1">WELCOME BACK</p>
              <h2 className="font-display uppercase text-2xl sm:text-3xl">{profile?.name}</h2>
              <p className="font-body text-sm text-[#0E1B1E]/70 mt-1">Roll No: {profile?.roll_no}</p>
            </div>

            {/* TEACHER LIST */}
            <h3 className="font-mono text-xs tracking-widest text-[#0E1B1E]/50 mb-4">FACULTY DIRECTORY</h3>
            <div className="border border-[#0E1B1E]/10">
              {teachers.map((t) => (
                <button
                  key={t.id}
                  onClick={() => openBooking(t)}
                  className="w-full flex items-center justify-between px-5 py-4 border-b border-[#0E1B1E]/10 last:border-0 hover:bg-[#6BCFE0]/10 text-left transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Circle
                        className={`w-2.5 h-2.5 ${
                          t.status === "Available" ? "fill-green-500 text-green-500" : "fill-gray-400 text-gray-400"
                        }`}
                      />
                      <span className="font-display uppercase text-sm">{t.name}</span>
                    </div>
                    <p className="font-body text-xs text-[#0E1B1E]/50 mt-1">
                      {DEPARTMENTS[t.department_id] || "—"} · {t.status}
                    </p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[#0E1B1E]/30 flex-shrink-0" />
                </button>
              ))}
            </div>
          </>
        )}
      </main>

      {/* BOOKING SLIDE-OVER — same pattern as AdminPanel's detail panel */}
      {selectedTeacher && (
        <>
          <div className="fixed inset-0 bg-[#0E1B1E]/40 z-40" onClick={() => setSelectedTeacher(null)} />

          <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-[#F9FFFD] z-50 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#0E1B1E]/10">
              <span className="font-mono text-xs tracking-widest text-[#0E1B1E]/50">BOOK APPOINTMENT</span>
              <button onClick={() => setSelectedTeacher(null)} className="text-[#0E1B1E]/50 hover:text-[#0E1B1E]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <h2 className="font-display uppercase text-2xl mb-1">{selectedTeacher.name}</h2>
              <p className="font-body text-sm text-[#0E1B1E]/60 mb-8">
                {DEPARTMENTS[selectedTeacher.department_id] || "—"} · {selectedTeacher.status}
              </p>

              {bookedMsg ? (
                <div className="flex items-start gap-2 bg-[#6BCFE0]/20 border border-[#6BCFE0] px-4 py-3">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p className="font-body text-sm">{bookedMsg}</p>
                </div>
              ) : (
                <form onSubmit={handleBook} className="space-y-5">
                  <div>
                    <label className="font-mono text-xs tracking-widest text-[#0E1B1E]/60">PURPOSE</label>
                    <textarea
                      required
                      rows={4}
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      className="font-body mt-2 block w-full px-3 py-3 border border-[#0E1B1E]/20 bg-transparent focus:border-[#0E1B1E] focus:outline-none text-sm"
                      placeholder="What would you like to discuss?"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={booking}
                    className="w-full font-mono text-sm tracking-widest bg-[#0E1B1E] text-white py-3.5 hover:bg-[#0E1B1E]/85 disabled:opacity-60"
                  >
                    {booking ? "SENDING..." : "REQUEST APPOINTMENT"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentDashboard;