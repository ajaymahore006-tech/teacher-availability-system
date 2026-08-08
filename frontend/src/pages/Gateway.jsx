// PLACE AT: src/pages/Gateway.jsx  (NEW FILE — replaces your old Gateway.jsx)

import React from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Users, CalendarCheck, Clock, ShieldCheck } from "lucide-react";

const Gateway = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col">
      {/* NAVBAR */}
      <header className="bg-[#1f3f75] text-white px-6 md:px-12 py-4 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/assets/iiit_pune_logo_transparent.png"
              alt="IIIT Pune Logo"
              className="h-12 w-auto"
            />
            <div>
              <h1 className="text-base md:text-lg font-bold leading-tight">
                Indian Institute of Information Technology Pune
              </h1>
              <p className="text-xs text-slate-300 hidden md:block">
                An Institute of National Importance by an Act of Parliament
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* HERO */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            Digital Faculty Assistant
          </h1>
          <p className="text-lg text-slate-600 mb-10">
            The modern platform connecting students and faculty for seamless
            appointment scheduling and academic support.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl w-full">
          {/* Student Portal */}
          <button
            onClick={() => navigate("/login/student")}
            className="group bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left"
          >
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-5">
              <GraduationCap className="text-blue-600 w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Student Portal</h2>
            <p className="text-sm text-slate-500 mb-6">
              Book appointments, check faculty availability, and manage your
              academic requests.
            </p>
            <span className="text-blue-600 font-semibold text-sm group-hover:underline">
              Access Portal &rarr;
            </span>
          </button>

          {/* Faculty Portal */}
          <button
            onClick={() => navigate("/login/teacher")}
            className="group bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-5">
              <Users className="text-emerald-600 w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Faculty Portal</h2>
            <p className="text-sm text-slate-500 mb-6">
              Manage your schedule, approve student requests, and update your
              live availability.
            </p>
            <span className="text-emerald-600 font-semibold text-sm group-hover:underline">
              Access Portal &rarr;
            </span>
          </button>
        </div>

        {/* Feature strip */}
        <div className="grid sm:grid-cols-3 gap-6 max-w-4xl w-full mt-16">
          <div className="bg-white rounded-xl p-6 shadow-sm text-center">
            <CalendarCheck className="mx-auto text-blue-600 w-8 h-8 mb-3" />
            <h3 className="font-semibold text-slate-800 mb-1">Easy Booking</h3>
            <p className="text-xs text-slate-500">Book appointments in just a few clicks.</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm text-center">
            <Clock className="mx-auto text-blue-600 w-8 h-8 mb-3" />
            <h3 className="font-semibold text-slate-800 mb-1">Availability</h3>
            <p className="text-xs text-slate-500">Check teacher schedules in real time.</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm text-center">
            <ShieldCheck className="mx-auto text-blue-600 w-8 h-8 mb-3" />
            <h3 className="font-semibold text-slate-800 mb-1">Secure Access</h3>
            <p className="text-xs text-slate-500">Separate login for students and faculty.</p>
          </div>
        </div>
      </main>

      <footer className="bg-[#1f3f75] text-white text-center py-4 text-xs">
        &copy; {new Date().getFullYear()} Indian Institute of Information Technology Pune. All Rights Reserved.
      </footer>
    </div>
  );
};

export default Gateway;