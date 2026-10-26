import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Circle,
  Check,
  X,
  MessageSquare,
  Shield,
  Search,
  Award,
  Megaphone,
  UserCheck,
  UserX,
  Send,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  teacherProfile,
  teacherAppointments,
  teacherUpdateStatus,
  teacherUpdateAppointment,
  teacherSearchStudent,
  teacherToggleCR,
  teacherListCRs,
  teacherSendCRMessage,
  teacherBroadcastCRMessage,
} from "../api/auth";
import { clearSession, isAdmin } from "../api/session";
import ChatPanel from "../components/ChatPanel";

const SECTIONS = ["A", "B", "C", "D"];

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [crs, setCrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [chatAppointment, setChatAppointment] = useState(null);
  const [loadError, setLoadError] = useState("");

  // Tab: "appointments" | "cr_management"
  const [mainTab, setMainTab] = useState("appointments");

  // CR Search & Filter state
  const [searchRoll, setSearchRoll] = useState("");
  const [searchingStudent, setSearchingStudent] = useState(false);
  const [searchedStudent, setSearchedStudent] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [sectionFilter, setSectionFilter] = useState("All");

  // Messaging Modal State
  const [messageModal, setMessageModal] = useState(null); // { mode: "single", student } or { mode: "broadcast" }
  const [msgTitle, setMsgTitle] = useState("");
  const [msgContent, setMsgContent] = useState("");
  const [broadcastSection, setBroadcastSection] = useState("All");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [msgFeedback, setMsgFeedback] = useState({ type: "", text: "" });

  const loadData = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setLoadError("");
    try {
      const [profileResult, apptResult, crResult] = await Promise.allSettled([
        teacherProfile(),
        teacherAppointments(),
        teacherListCRs(),
      ]);

      if (profileResult.status === "fulfilled") {
        setProfile(profileResult.value.data);
      } else {
        console.error("Profile load error:", profileResult.reason);
        const detail = profileResult.reason?.response?.data?.detail;
        if (profileResult.reason?.response?.status === 401) {
          setLoadError("Your session has expired. Please log out and sign in again.");
        } else {
          setLoadError(detail || "Could not load faculty profile. Please try reloading.");
        }
      }

      if (apptResult.status === "fulfilled") {
        setAppointments(apptResult.value.data || []);
      } else {
        console.error("Appointments load error:", apptResult.reason);
      }

      if (crResult.status === "fulfilled") {
        setCrs(crResult.value.data || []);
      } else {
        console.error("CRs load error:", crResult.reason);
      }
    } catch (err) {
      console.error("Dashboard error:", err);
      setLoadError("An unexpected error occurred while loading dashboard data.");
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);

    const interval = setInterval(() => {
      loadData(false);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleToggleStatus = async () => {
    const next = profile?.status === "Available" ? "Not Available" : "Available";
    setStatusLoading(true);
    try {
      await teacherUpdateStatus(next);
      setProfile({ ...profile, status: next });
    } catch (err) {
      console.error(err);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleAppointmentAction = async (id, status) => {
    try {
      await teacherUpdateAppointment(id, status);
      loadData(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Student Roll Number Search
  const handleSearchStudent = async (e) => {
    e.preventDefault();
    if (!searchRoll.trim()) return;

    setSearchingStudent(true);
    setSearchError("");
    setSearchedStudent(null);

    try {
      const rollNum = parseInt(searchRoll.trim(), 10);
      if (isNaN(rollNum)) {
        setSearchError("Please enter a valid numeric Roll Number.");
        return;
      }
      const res = await teacherSearchStudent(rollNum);
      setSearchedStudent(res.data);
    } catch (err) {
      setSearchError(err.response?.data?.detail || "Student not found with this roll number.");
    } finally {
      setSearchingStudent(false);
    }
  };

  // Toggle CR Status
  const handleToggleCR = async (roll_no) => {
    try {
      const res = await teacherToggleCR(roll_no);
      if (searchedStudent && searchedStudent.roll_no === roll_no) {
        setSearchedStudent(res.data);
      }
      // Reload CR list
      const crRes = await teacherListCRs();
      setCrs(crRes.data || []);
    } catch (err) {
      console.error("Failed to toggle CR status:", err);
    }
  };

  // Open Message Modal
  const openSingleMessageModal = (student) => {
    setMessageModal({ mode: "single", student });
    setMsgTitle("");
    setMsgContent("");
    setMsgFeedback({ type: "", text: "" });
  };

  const openBroadcastModal = () => {
    setMessageModal({ mode: "broadcast" });
    setMsgTitle("");
    setMsgContent("");
    setBroadcastSection(sectionFilter === "All" ? "All" : sectionFilter);
    setMsgFeedback({ type: "", text: "" });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!msgTitle.trim() || !msgContent.trim() || sendingMsg) return;

    setSendingMsg(true);
    setMsgFeedback({ type: "", text: "" });

    try {
      if (messageModal.mode === "single") {
        await teacherSendCRMessage({
          student_email: messageModal.student.email,
          title: msgTitle.trim(),
          content: msgContent.trim(),
        });
        setMsgFeedback({
          type: "success",
          text: `Announcement delivered to ${messageModal.student.name} (CR).`,
        });
      } else {
        const res = await teacherBroadcastCRMessage({
          section: broadcastSection,
          title: msgTitle.trim(),
          content: msgContent.trim(),
        });
        setMsgFeedback({
          type: "success",
          text: res.data?.message || "Broadcast sent to section CRs.",
        });
      }

      setTimeout(() => {
        setMessageModal(null);
      }, 2000);
    } catch (err) {
      setMsgFeedback({
        type: "error",
        text: err.response?.data?.detail || "Failed to send message.",
      });
    } finally {
      setSendingMsg(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  const isAvailable = profile?.status === "Available";
  const pending = appointments.filter((a) => a.status === "Pending");
  const resolved = appointments.filter((a) => a.status !== "Pending");

  const filteredCRs = crs.filter((cr) => {
    if (sectionFilter === "All") return true;
    return cr.section === sectionFilter;
  });

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
        <div className="flex items-center gap-4">
          {isAdmin() && (
            <button
              onClick={() => navigate("/admin")}
              className="flex items-center gap-1.5 font-mono text-xs tracking-widest text-[#0E1B1E] border border-[#0E1B1E]/20 px-3 py-1.5 hover:bg-[#0E1B1E]/5 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" /> ADMIN PANEL
            </button>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 font-mono text-xs tracking-widest text-[#F43493] hover:opacity-70 transition-opacity"
          >
            <LogOut className="w-4 h-4" /> LOGOUT
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 sm:px-8 py-8">
        {loadError && (
          <div className="mb-6 p-4 bg-[#F43493]/10 border border-[#F43493] text-[#0E1B1E] flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#F43493] flex-shrink-0" />
              <span className="font-body text-xs">{loadError}</span>
            </div>
            <button
              onClick={() => loadData(true)}
              className="font-mono text-xs text-[#F43493] underline hover:opacity-80 flex-shrink-0"
            >
              RETRY
            </button>
          </div>
        )}

        {loading ? (
          <p className="font-mono text-sm text-[#0E1B1E]/50">LOADING...</p>
        ) : (
          <>
            {/* FACULTY HERO CARD + AVAILABILITY TOGGLE */}
            <div className="bg-[#A05341] text-white p-6 sm:p-8 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <p className="font-mono text-xs tracking-widest text-white/70 mb-1">FACULTY PORTAL</p>
                <h2 className="font-display uppercase text-2xl sm:text-3xl">
                  {profile?.name || "FACULTY MEMBER"}
                </h2>
                <p className="font-body text-sm text-white/80 mt-1">
                  ID: <span className="font-mono">{profile?.id || "—"}</span> · {profile?.staff_type || "Teaching"}
                </p>
              </div>

              <button
                onClick={handleToggleStatus}
                disabled={statusLoading || !profile}
                className="flex items-center gap-2 bg-white text-[#0E1B1E] font-mono text-xs tracking-widest px-4 py-3 hover:bg-white/90 disabled:opacity-60 flex-shrink-0 transition-colors shadow-sm"
              >
                <Circle
                  className={`w-3 h-3 ${
                    isAvailable ? "fill-green-500 text-green-500" : "fill-gray-400 text-gray-400"
                  }`}
                />
                {statusLoading ? "UPDATING..." : isAvailable ? "AVAILABLE" : "NOT AVAILABLE"}
              </button>
            </div>

            {/* MAIN TABS: APPOINTMENTS vs CR MANAGEMENT */}
            <div className="flex gap-6 sm:gap-8 mb-8 border-b border-[#0E1B1E]/10">
              <button
                onClick={() => setMainTab("appointments")}
                className={`font-mono text-xs tracking-widest pb-3 border-b-2 transition-colors ${
                  mainTab === "appointments"
                    ? "border-[#F43493] text-[#0E1B1E]"
                    : "border-transparent text-[#0E1B1E]/40"
                }`}
              >
                APPOINTMENTS ({appointments.length})
              </button>
              <button
                onClick={() => setMainTab("cr_management")}
                className={`font-mono text-xs tracking-widest pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  mainTab === "cr_management"
                    ? "border-[#F43493] text-[#0E1B1E]"
                    : "border-transparent text-[#0E1B1E]/40"
                }`}
              >
                CLASS REPRESENTATIVES (CR) ({crs.length})
              </button>
            </div>

            {/* TAB 1: APPOINTMENTS */}
            {mainTab === "appointments" && (
              <>
                {/* PENDING REQUESTS */}
                <h3 className="font-mono text-xs tracking-widest text-[#0E1B1E]/50 mb-4">
                  PENDING REQUESTS ({pending.length})
                </h3>
                <div className="space-y-3 mb-10">
                  {pending.length === 0 ? (
                    <div className="border border-[#0E1B1E]/10 p-6 text-center">
                      <p className="font-body text-sm text-[#0E1B1E]/40">No pending appointment requests right now.</p>
                    </div>
                  ) : (
                    pending.map((a) => (
                      <div
                        key={a.id}
                        className="border border-[#0E1B1E]/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-display uppercase text-sm">
                              {a.student_name || a.student_email}
                            </p>
                            {a.student_section && (
                              <span className="font-mono text-[10px] bg-[#6BCFE0]/20 text-[#0E1B1E] border border-[#6BCFE0] px-1.5 py-0.5 uppercase">
                                Section {a.student_section}
                              </span>
                            )}
                            {a.student_is_cr && (
                              <span className="font-mono text-[9px] bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 uppercase flex items-center gap-0.5">
                                <Award className="w-2.5 h-2.5 text-amber-600" /> CR
                              </span>
                            )}
                            {a.created_at && (
                              <span className="font-mono text-[10px] text-[#0E1B1E]/40">
                                · {new Date(a.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                              </span>
                            )}
                          </div>
                          <p className="font-body text-xs text-[#0E1B1E]/50 mt-0.5">
                            {a.student_email} {a.student_roll_no ? `· Roll: ${a.student_roll_no}` : ""}
                          </p>
                          <p className="font-body text-sm text-[#0E1B1E]/80 mt-1">{a.purpose}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleAppointmentAction(a.id, "Approved")}
                            className="flex items-center gap-1 bg-[#0E1B1E] text-white font-mono text-xs tracking-widest px-4 py-2.5 hover:bg-[#0E1B1E]/85 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" /> APPROVE
                          </button>
                          <button
                            onClick={() => handleAppointmentAction(a.id, "Rejected")}
                            className="flex items-center gap-1 border border-[#F43493] text-[#F43493] font-mono text-xs tracking-widest px-4 py-2.5 hover:bg-[#F43493]/10 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" /> REJECT
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* RESOLVED HISTORY */}
                <h3 className="font-mono text-xs tracking-widest text-[#0E1B1E]/50 mb-4">
                  APPOINTMENT HISTORY ({resolved.length})
                </h3>
                {resolved.length === 0 ? (
                  <div className="border border-[#0E1B1E]/10 p-6 text-center">
                    <p className="font-body text-sm text-[#0E1B1E]/40">No past appointments recorded.</p>
                  </div>
                ) : (
                  <div className="border border-[#0E1B1E]/10">
                    {resolved.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between px-5 py-4 border-b border-[#0E1B1E]/10 last:border-0"
                      >
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-body text-sm font-medium">
                              {a.student_name || a.student_email}
                            </p>
                            {a.student_section && (
                              <span className="font-mono text-[10px] bg-[#6BCFE0]/20 text-[#0E1B1E] border border-[#6BCFE0] px-1.5 py-0.5 uppercase">
                                Sec {a.student_section}
                              </span>
                            )}
                            {a.student_is_cr && (
                              <span className="font-mono text-[9px] bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 uppercase flex items-center gap-0.5">
                                <Award className="w-2.5 h-2.5 text-amber-600" /> CR
                              </span>
                            )}
                            {a.created_at && (
                              <span className="font-mono text-[10px] text-[#0E1B1E]/40">
                                · {new Date(a.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                              </span>
                            )}
                          </div>
                          <p className="font-body text-xs text-[#0E1B1E]/60 mt-0.5">{a.purpose}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {a.status === "Approved" && (
                            <button
                              onClick={() => setChatAppointment(a)}
                              className="relative flex items-center gap-1 font-mono text-[10px] tracking-widest text-[#0E1B1E]/60 hover:text-[#0E1B1E] border border-[#0E1B1E]/20 px-2.5 py-1.5 transition-colors"
                            >
                              <MessageSquare className="w-3 h-3" /> CHAT
                              {a.has_unread && (
                                <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 rounded-full bg-[#F43493]" />
                              )}
                            </button>
                          )}
                          <span
                            className={`font-mono text-[10px] px-2 py-1 ${
                              a.status === "Approved"
                                ? "bg-green-100 text-green-700"
                                : "bg-[#F43493]/10 text-[#F43493]"
                            }`}
                          >
                            {a.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* TAB 2: CR MANAGEMENT & CLASS ANNOUNCEMENTS */}
            {mainTab === "cr_management" && (
              <div className="space-y-8">
                {/* SEARCH STUDENT BY ROLL NUMBER */}
                <div className="border border-[#0E1B1E]/10 p-6 bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Search className="w-4 h-4 text-[#0E1B1E]/60" />
                    <h3 className="font-display uppercase text-sm tracking-wider">
                      SEARCH STUDENT &amp; APPOINT CR
                    </h3>
                  </div>
                  <p className="font-body text-xs text-[#0E1B1E]/60 mb-4">
                    Find any student by Roll Number to inspect their section, assign them as Class Representative (CR), or send class notices.
                  </p>

                  <form onSubmit={handleSearchStudent} className="flex gap-2">
                    <input
                      type="number"
                      value={searchRoll}
                      onChange={(e) => setSearchRoll(e.target.value)}
                      placeholder="Enter student Roll No (e.g. 1124115120)"
                      className="flex-1 font-body text-sm px-3 py-2.5 border border-[#0E1B1E]/20 bg-transparent focus:border-[#0E1B1E] focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={searchingStudent || !searchRoll.trim()}
                      className="font-mono text-xs tracking-widest bg-[#0E1B1E] text-white px-5 py-2.5 hover:bg-[#0E1B1E]/85 transition-colors disabled:opacity-50"
                    >
                      {searchingStudent ? "SEARCHING..." : "SEARCH"}
                    </button>
                  </form>

                  {searchError && (
                    <div className="mt-4 flex items-start gap-2 bg-[#F43493]/10 border border-[#F43493]/30 text-[#a02166] text-xs p-3">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{searchError}</span>
                    </div>
                  )}

                  {/* SEARCH RESULT CARD */}
                  {searchedStudent && (
                    <div className="mt-5 p-4 border border-[#0E1B1E]/20 bg-[#F9FFFD] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-display uppercase text-base">{searchedStudent.name}</h4>
                          {searchedStudent.is_cr ? (
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-amber-100 text-amber-900 border border-amber-400 px-2 py-0.5 uppercase">
                              <Award className="w-3 h-3 text-amber-600" /> APPOINTED CR
                            </span>
                          ) : (
                            <span className="font-mono text-[10px] bg-[#0E1B1E]/5 text-[#0E1B1E]/60 border border-[#0E1B1E]/10 px-2 py-0.5 uppercase">
                              REGULAR STUDENT
                            </span>
                          )}
                        </div>
                        <p className="font-body text-xs text-[#0E1B1E]/60 mt-1">
                          Roll No: <span className="font-mono font-medium">{searchedStudent.roll_no}</span>
                          <span className="mx-2">·</span>
                          Section: <span className="font-mono font-medium">{searchedStudent.section ? `Section ${searchedStudent.section}` : "Not Assigned"}</span>
                        </p>
                        <p className="font-mono text-xs text-[#0E1B1E]/40 mt-0.5">{searchedStudent.email}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleToggleCR(searchedStudent.roll_no)}
                          className={`flex items-center gap-1.5 font-mono text-xs tracking-wider px-3.5 py-2 transition-colors ${
                            searchedStudent.is_cr
                              ? "border border-[#F43493] text-[#F43493] hover:bg-[#F43493]/10"
                              : "bg-[#0E1B1E] text-white hover:bg-[#0E1B1E]/85"
                          }`}
                        >
                          {searchedStudent.is_cr ? (
                            <>
                              <UserX className="w-3.5 h-3.5" /> REMOVE CR ROLE
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5 text-amber-400" /> MAKE STUDENT CR
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => openSingleMessageModal(searchedStudent)}
                          className="flex items-center gap-1.5 font-mono text-xs tracking-wider border border-[#0E1B1E]/20 text-[#0E1B1E] px-3.5 py-2 hover:bg-[#0E1B1E]/5 transition-colors"
                        >
                          <Megaphone className="w-3.5 h-3.5" /> SEND MESSAGE
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* CURRENT APPOINTED CRS LIST & SECTION BROADCAST */}
                <div className="border border-[#0E1B1E]/10 p-6 bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <div>
                      <h3 className="font-display uppercase text-sm tracking-wider">
                        ACTIVE CLASS REPRESENTATIVES ({filteredCRs.length})
                      </h3>
                      <p className="font-body text-xs text-[#0E1B1E]/60 mt-0.5">
                        Students authorized to disseminate class schedules and notices to peers.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        value={sectionFilter}
                        onChange={(e) => setSectionFilter(e.target.value)}
                        className="font-mono text-xs border border-[#0E1B1E]/20 px-3 py-2 bg-transparent"
                      >
                        <option value="All">ALL SECTIONS</option>
                        {SECTIONS.map((s) => (
                          <option key={s} value={s}>
                            SECTION {s}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={openBroadcastModal}
                        disabled={crs.length === 0}
                        className="flex items-center gap-1.5 font-mono text-xs tracking-wider bg-[#0E1B1E] text-white px-3.5 py-2 hover:bg-[#0E1B1E]/85 transition-colors disabled:opacity-50"
                      >
                        <Megaphone className="w-3.5 h-3.5 text-amber-300" /> BROADCAST TO CRS
                      </button>
                    </div>
                  </div>

                  {filteredCRs.length === 0 ? (
                    <div className="border border-[#0E1B1E]/10 p-8 text-center my-4">
                      <Award className="w-8 h-8 text-[#0E1B1E]/20 mx-auto mb-2" />
                      <p className="font-display uppercase text-sm text-[#0E1B1E]/60">No CRs Appointed Yet</p>
                      <p className="font-body text-xs text-[#0E1B1E]/40 mt-1">
                        Use the search tool above by Roll Number to appoint Class Representatives for your sections.
                      </p>
                    </div>
                  ) : (
                    <div className="border border-[#0E1B1E]/10 divide-y divide-[#0E1B1E]/10">
                      {filteredCRs.map((cr) => (
                        <div
                          key={cr.email}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#6BCFE0]/5 transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-display uppercase text-sm">{cr.name}</span>
                              <span className="font-mono text-[10px] bg-[#6BCFE0]/20 text-[#0E1B1E] border border-[#6BCFE0] px-2 py-0.5 uppercase">
                                Section {cr.section || "—"}
                              </span>
                            </div>
                            <p className="font-body text-xs text-[#0E1B1E]/60 mt-1">
                              Roll No: <span className="font-mono font-medium">{cr.roll_no}</span>
                              <span className="mx-2">·</span>
                              {cr.email}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openSingleMessageModal(cr)}
                              className="flex items-center gap-1 font-mono text-xs tracking-wider bg-[#0E1B1E] text-white px-3 py-1.5 hover:bg-[#0E1B1E]/85 transition-colors"
                            >
                              <Send className="w-3 h-3" /> MESSAGE CR
                            </button>
                            <button
                              onClick={() => handleToggleCR(cr.roll_no)}
                              className="font-mono text-xs tracking-wider border border-[#F43493] text-[#F43493] px-2.5 py-1.5 hover:bg-[#F43493]/10 transition-colors"
                              title="Revoke CR Status"
                            >
                              <UserX className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* MESSAGE / ANNOUNCEMENT COMPOSER MODAL */}
      {messageModal && (
        <>
          <div className="fixed inset-0 bg-[#0E1B1E]/40 z-40" onClick={() => setMessageModal(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#F9FFFD] border border-[#0E1B1E]/20 p-6 sm:p-8 w-11/12 max-w-lg z-50 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#0E1B1E]/10 pb-4 mb-4">
              <div>
                <span className="font-mono text-xs tracking-widest text-[#0E1B1E]/50">
                  {messageModal.mode === "single" ? "DIRECT CR ANNOUNCEMENT" : "SECTION CR BROADCAST"}
                </span>
                <h3 className="font-display uppercase text-lg mt-0.5">
                  {messageModal.mode === "single"
                    ? `Message: ${messageModal.student?.name} (Sec ${messageModal.student?.section || "—"})`
                    : "Broadcast to Class Representatives"}
                </h3>
              </div>
              <button onClick={() => setMessageModal(null)} className="text-[#0E1B1E]/50 hover:text-[#0E1B1E]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {msgFeedback.text && (
              <div
                className={`mb-4 flex items-start gap-2 p-3 text-xs border ${
                  msgFeedback.type === "success"
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                    : "bg-[#F43493]/10 border-[#F43493]/30 text-[#a02166]"
                }`}
              >
                {msgFeedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                )}
                <span>{msgFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="space-y-4">
              {messageModal.mode === "broadcast" && (
                <div>
                  <label className="font-mono text-xs tracking-widest text-[#0E1B1E]/60">TARGET SECTION</label>
                  <select
                    value={broadcastSection}
                    onChange={(e) => setBroadcastSection(e.target.value)}
                    className="mt-1 w-full font-body text-sm p-2.5 border border-[#0E1B1E]/20 bg-transparent focus:border-[#0E1B1E] focus:outline-none"
                  >
                    <option value="All">ALL SECTIONS (ALL CRs)</option>
                    {SECTIONS.map((s) => (
                      <option key={s} value={s}>
                        SECTION {s} CRs ONLY
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="font-mono text-xs tracking-widest text-[#0E1B1E]/60">SUBJECT / TITLE</label>
                <input
                  type="text"
                  required
                  value={msgTitle}
                  onChange={(e) => setMsgTitle(e.target.value)}
                  placeholder="e.g. Lab schedule moved to 3 PM in Room 204"
                  className="mt-1 w-full font-body text-sm p-2.5 border border-[#0E1B1E]/20 bg-transparent focus:border-[#0E1B1E] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-mono text-xs tracking-widest text-[#0E1B1E]/60">MESSAGE CONTENT</label>
                <textarea
                  required
                  rows={4}
                  value={msgContent}
                  onChange={(e) => setMsgContent(e.target.value)}
                  placeholder="Details for the CR to communicate to their classmates..."
                  className="mt-1 w-full font-body text-sm p-2.5 border border-[#0E1B1E]/20 bg-transparent focus:border-[#0E1B1E] focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={sendingMsg || !msgTitle.trim() || !msgContent.trim()}
                  className="flex-1 font-mono text-xs tracking-widest bg-[#0E1B1E] text-white py-3 hover:bg-[#0E1B1E]/85 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> {sendingMsg ? "SENDING..." : "DISPATCH ANNOUNCEMENT"}
                </button>
                <button
                  type="button"
                  onClick={() => setMessageModal(null)}
                  className="font-mono text-xs tracking-widest border border-[#0E1B1E]/20 px-4 py-3 hover:bg-[#0E1B1E]/5 transition-colors"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* APPOINTMENT CHAT PANEL */}
      {chatAppointment && (
        <ChatPanel
          appointmentId={chatAppointment.id}
          currentRole="teacher"
          otherPartyLabel={
            chatAppointment.student_name
              ? `${chatAppointment.student_name} (${chatAppointment.student_section ? `Sec ${chatAppointment.student_section}` : chatAppointment.student_email})`
              : chatAppointment.student_email
          }
          onClose={() => {
            setChatAppointment(null);
            loadData(false);
          }}
        />
      )}
    </div>
  );
};

export default TeacherDashboard;
