// PLACE AT: src/pages/TeacherLogin.jsx  (NEW FILE)

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Mail, AlertCircle } from "lucide-react";
import { teacherLogin } from "../api/auth";
import { saveSession } from "../api/session";

const TeacherLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

      if (is_admin) {
        navigate("/admin");
      } else {
        navigate("/dashboard/teacher");
      }
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail || "Something went wrong.";

      if (status === 404) {
        // No account exists for this email
        setShowRequestPrompt(true);
      }
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate("/")}
        className="absolute top-8 left-8 flex items-center text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-5 w-5 mr-2" /> Back to Gateway
      </button>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Faculty Portal
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to access your account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl border border-gray-100 sm:rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{showRequestPrompt ? "No account found for this email." : error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border bg-gray-50"
                  placeholder="you@college.edu"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border bg-gray-50"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors disabled:opacity-60"
              style={{ backgroundColor: "#10b981" }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {showRequestPrompt && (
            <div className="mt-6 text-center border-t pt-5">
              <p className="text-sm text-gray-600 mb-3">
                No account found for this email. If you're a faculty member,
                you can request access from the admin.
              </p>
              <button
                onClick={() => navigate("/teacher/request-access", { state: { email } })}
                className="text-emerald-600 font-semibold text-sm hover:underline"
              >
                Request Account Access &rarr;
              </button>
            </div>
          )}

          {!showRequestPrompt && (
            <div className="mt-6 text-center border-t pt-5">
              <p className="text-sm text-gray-600">
                New faculty member?{" "}
                <button
                  onClick={() => navigate("/teacher/request-access", { state: { email } })}
                  className="text-emerald-600 font-semibold hover:underline"
                >
                  Request Account Access
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherLogin;