import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { studentSendOtp, studentSignup } from "../api/auth";
import { saveSession } from "../api/session";
import AuthShell from "../components/AuthShell";

const SECTIONS = ["A", "B", "C", "D"];

const StudentSignup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = details, 2 = OTP
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [section, setSection] = useState("A");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await studentSendOtp(email);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not send OTP. Check your email format.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await studentSignup({ email, otp, name, password, section });
      saveSession(res.data.access_token, "student", false);
      navigate("/dashboard/student");
    } catch (err) {
      setError(err.response?.data?.detail || "Signup failed. Please check your OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      color="sky"
      eyebrow="STUDENT REGISTRATION"
      title={<>Create<br />Account</>}
      subtitle="Join the Digital Faculty Assistant portal to book appointments and stay connected with faculty and CRs."
      backTo="/login/student"
      backLabel="Back to Login"
    >
      <h2 className="font-display uppercase text-2xl mb-1">
        {step === 1 ? "Student Signup" : "Verify OTP"}
      </h2>
      <p className="font-body text-sm text-[#0E1B1E]/60 mb-6">
        {step === 1 ? "Use your official college email ID and specify your section." : `Enter the 6-digit code sent to ${email}`}
      </p>

      {error && (
        <div className="mb-5 flex items-start gap-2 bg-[#F43493]/10 border border-[#F43493]/30 text-[#a02166] text-sm px-3 py-2.5">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="font-body">{error}</span>
        </div>
      )}

      {step === 1 ? (
        <form className="space-y-4" onSubmit={handleSendOtp} autoComplete="off">
          <div>
            <label className="font-mono text-xs tracking-widest text-[#0E1B1E]/60">FULL NAME</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="font-body mt-1 block w-full px-3 py-3 border border-[#0E1B1E]/20 bg-transparent focus:border-[#0E1B1E] focus:outline-none text-sm"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="font-mono text-xs tracking-widest text-[#0E1B1E]/60">COLLEGE EMAIL</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="font-body mt-1 block w-full px-3 py-3 border border-[#0E1B1E]/20 bg-transparent focus:border-[#0E1B1E] focus:outline-none text-sm"
              placeholder="123456789@cse.iiitp.ac.in"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-xs tracking-widest text-[#0E1B1E]/60">CLASS SECTION</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="font-body mt-1 block w-full px-3 py-3 border border-[#0E1B1E]/20 bg-transparent focus:border-[#0E1B1E] focus:outline-none text-sm"
              >
                {SECTIONS.map((sec) => (
                  <option key={sec} value={sec}>
                    Section {sec}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-mono text-xs tracking-widest text-[#0E1B1E]/60">PASSWORD</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full font-mono text-sm tracking-widest bg-[#0E1B1E] text-white py-3.5 hover:bg-[#0E1B1E]/85 transition-colors disabled:opacity-60 mt-2"
          >
            {loading ? "SENDING OTP..." : "SEND VERIFICATION CODE"}
          </button>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={handleVerifyAndSignup} autoComplete="off">
          <div>
            <label className="font-mono text-xs tracking-widest text-[#0E1B1E]/60">6-DIGIT OTP CODE</label>
            <input
              type="text"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="font-mono text-center tracking-widest text-lg mt-1 block w-full px-3 py-3 border border-[#0E1B1E]/20 bg-transparent focus:border-[#0E1B1E] focus:outline-none"
              placeholder="123456"
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length < 6}
            className="w-full font-mono text-sm tracking-widest bg-[#0E1B1E] text-white py-3.5 hover:bg-[#0E1B1E]/85 transition-colors disabled:opacity-60 mt-2"
          >
            {loading ? "VERIFYING..." : "COMPLETE SIGNUP"}
          </button>

          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full font-mono text-xs tracking-widest text-[#0E1B1E]/60 hover:text-[#0E1B1E] text-center pt-2"
          >
            ← EDIT DETAILS / RESEND
          </button>
        </form>
      )}

      <div className="mt-8 pt-6 border-t border-[#0E1B1E]/10">
        <p className="font-body text-sm text-[#0E1B1E]/70">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login/student")}
            className="font-medium text-[#0E1B1E] underline hover:opacity-75"
          >
            Sign In
          </button>
        </p>
      </div>
    </AuthShell>
  );
};

export default StudentSignup;
