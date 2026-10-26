import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Circle,
  ArrowUpRight,
  X,
  CheckCircle2,
  MessageSquare,
  Search,
  Megaphone,
  Copy,
  Check,
  Award,
  Edit2,
  AlertCircle,
} from "lucide-react";
import {
  studentProfile,
  teacherList,
  studentBookAppointment,
  studentAppointments,
  studentGetCRMessages,
  studentMarkCRMessageRead,
  studentUpdateSection,
} from "../api/auth";
import { clearSession } from "../api/session";
import ChatPanel from "../components/ChatPanel";

const DEPARTMENTS = { 1: "CSE", 2: "ECE" };
const SECTIONS = ["A", "B", "C", "D"];

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [myAppointments, setMyAppointments] = useState([]);
  const [crMessages, setCrMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatAppointment, setChatAppointment] = useState(null);
  const [tab, setTab] = useState("appointments"); // "appointments" | "directory" | "announcements"

  // Search and filter state for Directory
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [availableOnly, setAvailableOnly] = useState(false);

  // Booking slide-over
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [purpose, setPurpose] = useState("");
  const [booking, setBooking] = useState(false);
  const [bookedMsg, setBookedMsg] = useState("");

  // Edit section modal
  const [editingSection, setEditingSection] = useState(false);
  const [newSection, setNewSection] = useState("A");
  const [savingSection, setSavingSection] = useState(false);
  const [sectionError, setSectionError] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  const loadData = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const [profileRes, teacherRes, apptRes, crRes] = await Promise.all([
        studentProfile(),
        teacherList(),
        studentAppointments(),
        studentGetCRMessages().catch(() => ({ data: [] })),
      ]);
      setProfile(profileRes.data);
      if (profileRes.data?.section) setNewSection(profileRes.data.section);
      setTeachers(teacherRes.data);
      setMyAppointments(apptRes.data);
      setCrMessages(crRes.data || []);
    } catch (err) {
      console.error(err);
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

  const openBooking = (teacher) => {
    setSelectedTeacher(teacher);
    setPurpose("");
    setBookedMsg("");
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!purpose.trim() || booking) return;
    setBooking(true);
    try {
      await studentBookAppointment(selectedTeacher.id, purpose.trim());
      setBookedMsg("Appointment requested! The faculty member will review it soon.");
      loadData(false);
    } catch (err) {
      setBookedMsg(err.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setBooking(false);
    }
  };

  const openEditSectionModal = () => {
    setNewSection(profile?.section || "A");
    setSectionError("");
    setEditingSection(true);
  };

  const handleSaveSection = async (e) => {
    e.preventDefault();
    setSavingSection(true);
    setSectionError("");
    try {
      const res = await studentUpdateSection(newSection);
      setProfile(res.data);
      setEditingSection(false);
    } catch (err) {
      console.error(err);
      setSectionError(err.response?.data?.detail || "Failed to update section. Please try again.");
    } finally {
      setSavingSection(false);
    }
  };

  const handleReadCRMessage = async (msg) => {
    if (!msg.is_read) {
      try {
        await studentMarkCRMessageRead(msg.id);
        setCrMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, is_read: true } : m))
        );
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleCopyForClass = (msg) => {
    const formatted = `📢 [ANNOUNCEMENT FOR SECTION ${profile?.section || ""}]\nFrom: ${msg.teacher_name}\nSubject: ${msg.title}\n\n${msg.content}`;
    navigator.clipboard.writeText(formatted);
    setCopiedId(msg.id);
    handleReadCRMessage(msg);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = departmentFilter === "All" || String(t.department_id) === departmentFilter;
      const matchesAvail = !availableOnly || t.status === "Available";
      return matchesSearch && matchesDept && matchesAvail;
    });
  }, [teachers, searchQuery, departmentFilter, availableOnly]);

  const unreadCRCount = crMessages.filter((m) => !m.is_read).length;

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
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 font-mono text-xs tracking-widest text-[#F43493] hover:opacity-70 transition-opacity"
        >
          <LogOut className="w-4 h-4" /> LOGOUT
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-5 sm:px-8 py-8">
        {loading ? (
          <p className="font-mono text-sm text-[#0E1B1E]/50">LOADING...</p>
        ) : (
          <>
            {/* UNREAD CR ANNOUNCEMENT ALERT BANNER */}
            {unreadCRCount > 0 && (
              <div
                onClick={() => setTab("announcements")}
                className="cursor-pointer mb-6 p-4 bg-[#F43493]/10 border border-[#F43493] flex items-center justify-between gap-4 hover:bg-[#F43493]/15 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Megaphone className="w-5 h-5 text-[#F43493] flex-shrink-0 animate-bounce" />
                  <div>
                    <p className="font-display uppercase text-xs tracking-wider text-[#0E1B1E]">
                      {unreadCRCount} NEW FACULTY ANNOUNCEMENT{unreadCRCount > 1 ? "S" : ""} FOR YOUR CLASS
                    </p>
                    <p className="font-body text-xs text-[#0E1B1E]/70 mt-0.5">
                      Click here to review messages and share with your section.
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs text-[#F43493] underline flex-shrink-0">
                  VIEW NOW →
                </span>
              </div>
            )}

            {/* WELCOME BLOCK */}
            <div className="bg-[#6BCFE0] p-6 sm:p-8 mb-8 relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-xs tracking-widest text-[#0E1B1E]/60 mb-1">WELCOME BACK</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="font-display uppercase text-2xl sm:text-3xl">{profile?.name}</h2>
                    {profile?.is_cr && (
                      <span className="inline-flex items-center gap-1.5 bg-[#0E1B1E] text-white font-mono text-[10px] tracking-wider px-2.5 py-1 uppercase">
                        <Award className="w-3.5 h-3.5 text-amber-300" /> CLASS REPRESENTATIVE (CR)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap font-body text-sm text-[#0E1B1E]/80 mt-1">
                    <span>Roll No: <span className="font-mono font-medium">{profile?.roll_no}</span></span>
                    <span>·</span>
                    <span>
                      Section:{" "}
                      <span className="font-mono font-medium">
                        {profile?.section ? `Section ${profile.section}` : "Not Assigned"}
                      </span>
                    </span>
                    <button
                      onClick={openEditSectionModal}
                      className="ml-1 text-[#0E1B1E] hover:underline inline-flex items-center gap-1 font-mono text-[11px] bg-white/40 hover:bg-white/70 px-2 py-0.5 border border-[#0E1B1E]/20"
                      title="Set Section"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                      {profile?.section ? "CHANGE" : "SET SECTION"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex gap-6 sm:gap-8 mb-8 border-b border-[#0E1B1E]/10 overflow-x-auto">
              <button
                onClick={() => setTab("appointments")}
                className={`font-mono text-xs tracking-widest pb-3 border-b-2 transition-colors whitespace-nowrap ${
                  tab === "appointments" ? "border-[#F43493] text-[#0E1B1E]" : "border-transparent text-[#0E1B1E]/40"
                }`}
              >
                MY APPOINTMENTS ({myAppointments.length})
              </button>
              <button
                onClick={() => setTab("directory")}
                className={`font-mono text-xs tracking-widest pb-3 border-b-2 transition-colors whitespace-nowrap ${
                  tab === "directory" ? "border-[#F43493] text-[#0E1B1E]" : "border-transparent text-[#0E1B1E]/40"
                }`}
              >
                FACULTY DIRECTORY ({teachers.length})
              </button>
              <button
                onClick={() => setTab("announcements")}
                className={`relative font-mono text-xs tracking-widest pb-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  tab === "announcements" ? "border-[#F43493] text-[#0E1B1E]" : "border-transparent text-[#0E1B1E]/40"
                }`}
              >
                CR ANNOUNCEMENTS ({crMessages.length})
                {unreadCRCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-[#F43493]" />
                )}
              </button>
            </div>

            {/* TAB 1: MY APPOINTMENTS */}
            {tab === "appointments" && (
              <>
                <h3 className="font-mono text-xs tracking-widest text-[#0E1B1E]/50 mb-4">MY APPOINTMENTS</h3>

                {myAppointments.length === 0 ? (
                  <div className="border border-[#0E1B1E]/10 p-8 text-center my-6">
                    <p className="font-body text-sm text-[#0E1B1E]/60 mb-4">No appointments booked yet.</p>
                    <button
                      onClick={() => setTab("directory")}
                      className="font-mono text-xs tracking-widest bg-[#0E1B1E] text-white px-5 py-3 hover:bg-[#0E1B1E]/85 transition-colors"
                    >
                      BROWSE FACULTY DIRECTORY
                    </button>
                  </div>
                ) : (
                  <div className="border border-[#0E1B1E]/10 mb-10">
                    {myAppointments.map((a) => {
                      const teacherName =
                        teachers.find((t) => t.id === a.teacher_id)?.name || `Faculty ID: ${a.teacher_id}`;
                      return (
                        <div
                          key={a.id}
                          className="flex items-center justify-between px-5 py-4 border-b border-[#0E1B1E]/10 last:border-0"
                        >
                          <div>
                            <p className="font-body text-sm font-medium">{a.purpose}</p>
                            <p className="font-body text-xs text-[#0E1B1E]/60 mt-0.5">
                              Faculty: <span className="font-medium text-[#0E1B1E]">{teacherName}</span>
                              {a.created_at && (
                                <span className="text-[#0E1B1E]/40 ml-2">
                                  · {new Date(a.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                                </span>
                              )}
                            </p>
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
                                  : a.status === "Rejected"
                                  ? "bg-[#F43493]/10 text-[#F43493]"
                                  : "bg-[#0E1B1E]/5 text-[#0E1B1E]/60"
                              }`}
                            >
                              {a.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* TAB 2: FACULTY DIRECTORY */}
            {tab === "directory" && (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                  <h3 className="font-mono text-xs tracking-widest text-[#0E1B1E]/50">FACULTY DIRECTORY</h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#0E1B1E]/40" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search faculty..."
                        className="pl-8 pr-3 py-1.5 font-body text-xs border border-[#0E1B1E]/20 bg-transparent focus:border-[#0E1B1E] focus:outline-none"
                      />
                    </div>
                    <select
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      className="font-mono text-xs border border-[#0E1B1E]/20 px-2.5 py-1.5 bg-transparent"
                    >
                      <option value="All">ALL DEPTS</option>
                      <option value="1">CSE</option>
                      <option value="2">ECE</option>
                    </select>
                    <label className="flex items-center gap-1.5 font-mono text-xs text-[#0E1B1E]/70 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={availableOnly}
                        onChange={(e) => setAvailableOnly(e.target.checked)}
                        className="accent-[#0E1B1E]"
                      />
                      AVAILABLE ONLY
                    </label>
                  </div>
                </div>

                <div className="border border-[#0E1B1E]/10">
                  {filteredTeachers.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="font-body text-sm text-[#0E1B1E]/50">No faculty members found matching your search.</p>
                    </div>
                  ) : (
                    filteredTeachers.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => openBooking(t)}
                        className="w-full flex items-center justify-between px-5 py-4 border-b border-[#0E1B1E]/10 last:border-0 hover:bg-[#6BCFE0]/10 text-left transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <Circle
                              className={`w-2.5 h-2.5 ${
                                t.status === "Available"
                                  ? "fill-green-500 text-green-500"
                                  : "fill-gray-400 text-gray-400"
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
                    ))
                  )}
                </div>
              </>
            )}

            {/* TAB 3: CR ANNOUNCEMENTS & FACULTY MESSAGES */}
            {tab === "announcements" && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-mono text-xs tracking-widest text-[#0E1B1E]/50">
                    FACULTY ANNOUNCEMENTS FOR CLASS
                  </h3>
                  {profile?.is_cr && (
                    <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1">
                      CR PRIVILEGES ACTIVE
                    </span>
                  )}
                </div>

                {crMessages.length === 0 ? (
                  <div className="border border-[#0E1B1E]/10 p-8 text-center my-6">
                    <Megaphone className="w-8 h-8 text-[#0E1B1E]/30 mx-auto mb-2" />
                    <p className="font-display uppercase text-sm text-[#0E1B1E]/60 mb-1">No Announcements Yet</p>
                    <p className="font-body text-xs text-[#0E1B1E]/50 max-w-sm mx-auto">
                      When faculty members send broadcast notices or instructions to Class Representatives, they will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {crMessages.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => handleReadCRMessage(m)}
                        className={`border p-5 transition-colors ${
                          m.is_read
                            ? "border-[#0E1B1E]/10 bg-white"
                            : "border-[#F43493] bg-[#F43493]/5"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            {!m.is_read && (
                              <span className="font-mono text-[9px] bg-[#F43493] text-white px-1.5 py-0.5 uppercase tracking-wider">
                                NEW
                              </span>
                            )}
                            <h4 className="font-display uppercase text-sm sm:text-base">{m.title}</h4>
                          </div>
                          <span className="font-mono text-[10px] text-[#0E1B1E]/50">
                            {new Date(m.created_at).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <p className="font-mono text-xs text-[#0E1B1E]/60 mb-3">
                          From: <span className="text-[#0E1B1E] font-medium">{m.teacher_name}</span>
                        </p>

                        <div className="p-3 bg-[#0E1B1E]/5 border border-[#0E1B1E]/10 rounded mb-4">
                          <p className="font-body text-sm text-[#0E1B1E]/90 whitespace-pre-wrap">{m.content}</p>
                        </div>

                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyForClass(m);
                            }}
                            className="flex items-center gap-1.5 font-mono text-xs tracking-wider bg-[#0E1B1E] text-white px-3 py-1.5 hover:bg-[#0E1B1E]/85 transition-colors"
                          >
                            {copiedId === m.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" /> COPIED!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" /> COPY FOR CLASS GROUP
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* EDIT SECTION MODAL */}
      {editingSection && (
        <>
          <div className="fixed inset-0 bg-[#0E1B1E]/40 z-40" onClick={() => setEditingSection(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#F9FFFD] border border-[#0E1B1E]/20 p-6 sm:p-8 w-11/12 max-w-sm z-50 shadow-2xl">
            <h3 className="font-display uppercase text-lg mb-2">Select Your Section</h3>
            <p className="font-body text-xs text-[#0E1B1E]/60 mb-4">
              Faculty members and Class Representatives see this section to coordinate appointments and announcements.
            </p>

            {sectionError && (
              <div className="mb-4 flex items-start gap-2 bg-[#F43493]/10 border border-[#F43493]/30 text-[#a02166] text-xs p-3">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{sectionError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSection} className="space-y-4">
              <div>
                <label className="font-mono text-xs tracking-widest text-[#0E1B1E]/60">ACADEMIC SECTION</label>
                <select
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  className="mt-1 w-full font-body text-sm p-3 border border-[#0E1B1E]/20 bg-transparent focus:border-[#0E1B1E] focus:outline-none"
                >
                  {SECTIONS.map((sec) => (
                    <option key={sec} value={sec}>
                      Section {sec}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={savingSection}
                  className="flex-1 font-mono text-xs tracking-widest bg-[#0E1B1E] text-white py-3 hover:bg-[#0E1B1E]/85 transition-colors disabled:opacity-50"
                >
                  {savingSection ? "SAVING..." : "SAVE SECTION"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingSection(false)}
                  className="font-mono text-xs tracking-widest border border-[#0E1B1E]/20 px-4 py-3 hover:bg-[#0E1B1E]/5 transition-colors"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* BOOKING SLIDE-OVER */}
      {selectedTeacher && (
        <>
          <div className="fixed inset-0 bg-[#0E1B1E]/40 z-40" onClick={() => setSelectedTeacher(null)} />

          <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-[#F9FFFD] z-50 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#0E1B1E]/10">
              <span className="font-mono text-xs tracking-widest text-[#0E1B1E]/50">BOOK APPOINTMENT</span>
              <button onClick={() => setSelectedTeacher(null)} className="text-[#0E1B1E]/50 hover:text-[#0E1B1E] p-1">
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
                    disabled={booking || !purpose.trim()}
                    className="w-full font-mono text-sm tracking-widest bg-[#0E1B1E] text-white py-3.5 hover:bg-[#0E1B1E]/85 disabled:opacity-60 transition-colors"
                  >
                    {booking ? "SENDING..." : "REQUEST APPOINTMENT"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </>
      )}

      {/* CHAT PANEL */}
      {chatAppointment && (
        <ChatPanel
          appointmentId={chatAppointment.id}
          currentRole="student"
          otherPartyLabel={
            teachers.find((t) => t.id === chatAppointment.teacher_id)?.name ||
            `Faculty ID: ${chatAppointment.teacher_id}`
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

export default StudentDashboard;
