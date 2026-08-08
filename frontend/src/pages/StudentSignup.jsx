// PLACE AT: src/pages/StudentSignup.jsx  (NEW FILE)

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { studentSendOtp, studentSignup } from "../api/auth";
import { saveSession } from "../api/session";

const StudentSignup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = details, 2 = OTP
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  // Auto-extract MIS number from the email prefix (purely for display —
  // the backend independently re-derives this from the verified email too)
  const misNumber = (() => {
    const match = email.match(/^(\d+)@/);
    return match ? match[1] : "";
  })();

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
      const res = await studentSignup({ email, otp, name, password });
      saveSession(res.data.access_token, "student", false);
      navigate("/dashboard/student");
    } catch (err) {
      setError(err.response?.data?.detail || "Signup failed. Please check your OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate("/login/student")}
        className="absolute top-8 left-8 flex items-center text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-5 w-5 mr-2" /> Back to Login
      </button>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create Account</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === 1 ? "Use your college email to register" : "Enter the OTP sent to your email"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl border border-gray-100 sm:rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            <form className="space-y-5" onSubmit={handleSendOtp}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">College Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="123456789@cse.iiitp.ac.in"
                />
              </div>

              {/* MIS auto-fill preview — read-only, purely informational */}
              <div>
                <label className="block text-sm font-medium text-gray-700">MIS Number</label>
                <input
                  type="text"
                  readOnly
                  value={misNumber}
                  placeholder="Auto-filled from your email"
                  className="mt-1 block w-full px-3 py-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 sm:text-sm cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Create Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Min. 8 characters"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors disabled:opacity-60"
                style={{ backgroundColor: "#2563eb" }}
              >
                {loading ? "Sending OTP..." : "Send OTP Verification"}
              </button>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleVerifyAndSignup}>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-center">
                  Enter OTP
                </label>
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-center tracking-widest text-lg font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="123456"
                  maxLength={6}
                />
                <p className="text-xs text-gray-500 mt-2 text-center">Check your college email inbox.</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors disabled:opacity-60"
                style={{ backgroundColor: "#28a745" }}
              >
                {loading ? "Verifying..." : "Verify & Create Account"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentSignup;