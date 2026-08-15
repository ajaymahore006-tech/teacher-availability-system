// PLACE AT: src/pages/TeacherLogin.jsx  (REPLACES your existing file)

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { teacherLogin } from "../api/auth";
import { saveSession } from "../api/session";
import AuthShell from "../components/AuthShell";

const TeacherLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showRequestPrompt, setShowRequestPrompt] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setShowRequestPrompt(false);
    setLoading(true);
    try {
      const res = await teacherLogin(email, password);
      const { access_token, is_admin } = res.data;
      saveSession(access_token, "teacher", is_admin);
      navigate(is_admin ? "/admin" : "/dashboard/teacher");
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail || "Something went wrong.";
      if (status === 404) {
        setShowRequestPrompt(true);
        setError("No account found for this email.");
      } else {
        setError(detail);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      color="rust"
      eyebrow="FOR FACULTY"
      title={<>Faculty<br />Portal</>}
      subtitle="Manage your schedule, approve student requests, and update your live availability."
    >
      <h2 className="font-display uppercase text-2xl mb-1">Sign In</h2>
      <p className="font-body text-sm text-[#0E1B1E]/60 mb-8">Welcome back — enter your details.</p>

      {error && (
        <div className="mb-5 flex items-start gap-2 bg-[#F43493]/10 border border-[#F43493]/30 text-[#a02166] text-sm px-3 py-2.5">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="font-body">{error}</span>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleLogin} autoComplete="off">
        <div>
          <label className="font-mono text-xs tracking-widest text-[#0E1B1E]/60">EMAIL ADDRESS</label>
          <input
            type="email"
            name="teacher-email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="font-body mt-2 block w-full px-3 py-3 border border-[#0E1B1E]/20 bg-transparent focus:border-[#0E1B1E] focus:outline-none text-sm"
            placeholder="you@college.edu"
          />
        </div>

        <div>
          <label className="font-mono text-xs tracking-widest text-[#0E1B1E]/60">PASSWORD</label>
          <div className="relative mt-2">
            <input
              type={showPassword ? "text" : "password"}
              name="teacher-password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="font-body block w-full px-3 py-3 pr-10 border border-[#0E1B1E]/20 bg-transparent focus:border-[#0E1B1E] focus:outline-none text-sm"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#0E1B1E]/40 hover:text-[#0E1B1E]"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full font-mono text-sm tracking-widest bg-[#0E1B1E] text-white py-3.5 hover:bg-[#0E1B1E]/85 transition-colors disabled:opacity-60"
        >
          {loading ? "SIGNING IN..." : "SIGN IN"}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-[#0E1B1E]/10">
        <p className="font-body text-sm text-[#0E1B1E]/70">
          {showRequestPrompt ? "If you're a faculty member, " : "New faculty member? "}
          <button
            onClick={() => navigate("/teacher/request-access", { state: { email } })}
            className="font-semibold text-[#0E1B1E] underline underline-offset-2"
          >
            Request Account Access
          </button>
        </p>
      </div>
    </AuthShell>
  );
};

export default TeacherLogin;