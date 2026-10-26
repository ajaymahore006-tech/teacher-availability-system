import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { teacherSetPassword } from "../api/auth";
import { saveSession } from "../api/session";
import AuthShell from "../components/AuthShell";

const SetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Missing or invalid setup link. Please check your invitation email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await teacherSetPassword(token, password);
      const { access_token, is_admin } = res.data;
      saveSession(access_token, "teacher", is_admin);
      navigate(is_admin ? "/admin" : "/dashboard/teacher");
    } catch (err) {
      setError(err.response?.data?.detail || "This setup link has expired. Please contact the administrator.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      color="rust"
      eyebrow="FACULTY ACTIVATION"
      title={<>Set Your<br />Password</>}
      subtitle="Welcome to Digital Faculty Assistant. Choose a strong password to activate your account."
      backTo="/login/teacher"
      backLabel="Back to Login"
    >
      <h2 className="font-display uppercase text-2xl mb-1">Activate Account</h2>
      <p className="font-body text-sm text-[#0E1B1E]/60 mb-6">Create a password to access your dashboard.</p>

      {error && (
        <div className="mb-5 flex items-start gap-2 bg-[#F43493]/10 border border-[#F43493]/30 text-[#a02166] text-sm px-3 py-2.5">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="font-body">{error}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">
        <div>
          <label className="font-mono text-xs tracking-widest text-[#0E1B1E]/60">NEW PASSWORD</label>
          <div className="relative mt-1">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="font-body block w-full px-3 py-3 pr-10 border border-[#0E1B1E]/20 bg-transparent focus:border-[#0E1B1E] focus:outline-none text-sm"
              placeholder="Min. 8 characters"
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

        <div>
          <label className="font-mono text-xs tracking-widest text-[#0E1B1E]/60">CONFIRM PASSWORD</label>
          <input
            type={showPassword ? "text" : "password"}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="font-body mt-1 block w-full px-3 py-3 border border-[#0E1B1E]/20 bg-transparent focus:border-[#0E1B1E] focus:outline-none text-sm"
            placeholder="Repeat password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full font-mono text-sm tracking-widest bg-[#0E1B1E] text-white py-3.5 hover:bg-[#0E1B1E]/85 transition-colors disabled:opacity-60 mt-2"
        >
          {loading ? "ACTIVATING..." : "ACTIVATE ACCOUNT"}
        </button>
      </form>
    </AuthShell>
  );
};

export default SetPassword;
