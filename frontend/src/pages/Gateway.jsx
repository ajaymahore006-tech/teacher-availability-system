// PLACE AT: src/pages/Gateway.jsx  (REPLACES your existing file)

import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, CalendarCheck, Clock, ShieldCheck } from "lucide-react";
import dfaLogo from "../assets/dfa_logo.png";
const Gateway = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F9FFFD] text-[#0E1B1E]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap');
        .font-display { font-family: 'Archivo Black', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'Space Mono', monospace; }
      `}</style>

      {/* TOP BAR */}
      <header className="sticky top-0 z-50 bg-[#F9FFFD]/90 backdrop-blur-sm border-b border-[#0E1B1E]/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 sm:px-8 py-3">
          <div className="flex items-center gap-3">
            <img src={dfaLogo} alt="DFA" className="h-8 sm:h-9 w-auto" />
            <span className="font-mono text-xs sm:text-sm tracking-widest">
              DIGITAL FACULTY ASSISTANT
            </span>
          </div>
        </div>
      </header>

      {/* HERO EYEBROW */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-10 sm:pt-14 pb-6">
        <p className="font-mono text-xs tracking-widest text-[#A05341] mb-3">
          FOR STUDENTS &amp; FACULTY —
        </p>
        <h1 className="font-display uppercase leading-[0.95] text-[13vw] sm:text-[7vw] md:text-[5.5vw] tracking-tight">
          Book Time.<br />No Chasing.
        </h1>
        <p className="font-body text-[#0E1B1E]/70 text-base sm:text-lg mt-6 max-w-xl">
          Digital Faculty Assistant connects students and faculty for
          appointments, availability, and academic requests — without the
          hallway guesswork.
        </p>
      </section>

      {/* PORTAL BLOCKS — the signature element */}
      <section className="border-t border-[#0E1B1E]/10">
        <div className="grid sm:grid-cols-2">
          {/* Student Portal */}
          <button
            onClick={() => navigate("/login/student")}
            className="group relative bg-[#6BCFE0] text-left px-6 sm:px-10 py-12 sm:py-24 border-b sm:border-b-0 sm:border-r border-[#0E1B1E]/10 hover:bg-[#5cc2d6] transition-colors"
          >
            <p className="font-mono text-xs tracking-widest text-[#0E1B1E]/60 mb-6">FOR STUDENTS</p>
            <h2 className="font-display uppercase text-[12vw] sm:text-[5vw] leading-[0.9] mb-6">
              Student<br />Portal
            </h2>
            <p className="font-body text-sm sm:text-base text-[#0E1B1E]/75 max-w-xs mb-10">
              Book appointments, check faculty availability, and manage your
              academic requests.
            </p>
            <span className="font-mono text-sm inline-flex items-center gap-2 group-hover:gap-3 transition-all">
              ENTER <ArrowUpRight className="w-4 h-4" />
            </span>
          </button>

          {/* Faculty Portal */}
          <button
            onClick={() => navigate("/login/teacher")}
            className="group relative bg-[#A05341] text-left px-6 sm:px-10 py-12 sm:py-24 hover:bg-[#8a4636] transition-colors"
          >
            <p className="font-mono text-xs tracking-widest text-white/70 mb-6">FOR FACULTY</p>
            <h2 className="font-display uppercase text-white text-[12vw] sm:text-[5vw] leading-[0.9] mb-6">
              Faculty<br />Portal
            </h2>
            <p className="font-body text-sm sm:text-base text-white/85 max-w-xs mb-10">
              Manage your schedule, approve student requests, and update
              your live availability.
            </p>
            <span className="font-mono text-sm text-white inline-flex items-center gap-2 group-hover:gap-3 transition-all">
              ENTER <ArrowUpRight className="w-4 h-4" />
            </span>
          </button>
        </div>
      </section>

      {/* FEATURE STRIP */}
      <section className="border-t border-[#0E1B1E]/10">
        <div className="grid sm:grid-cols-3">
          {[
            { icon: CalendarCheck, label: "Easy Booking", desc: "Book appointments in a few clicks." },
            { icon: Clock, label: "Live Availability", desc: "See faculty schedules in real time." },
            { icon: ShieldCheck, label: "Secure Access", desc: "Separate, verified logins for every role." },
          ].map((f, i) => (
            <div
              key={f.label}
              className={`px-6 sm:px-8 py-10 ${i < 2 ? "sm:border-r border-b sm:border-b-0" : ""} border-[#0E1B1E]/10`}
            >
              <f.icon className="w-6 h-6 text-[#A05341] mb-4" strokeWidth={2} />
              <h3 className="font-display uppercase text-sm tracking-wide mb-2">{f.label}</h3>
              <p className="font-body text-sm text-[#0E1B1E]/60">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0E1B1E] text-[#F9FFFD]/60 font-mono text-xs tracking-widest text-center py-6">
        © {new Date().getFullYear()} DIGITAL FACULTY ASSISTANT
      </footer>
    </div>
  );
};

export default Gateway;