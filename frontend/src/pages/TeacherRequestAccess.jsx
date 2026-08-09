// PLACE AT: src/pages/TeacherRequestAccess.jsx  (NEW FILE)

import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { teacherRequestAccess } from "../api/auth";

// Matches your existing departments table — update if you add more departments
const DEPARTMENTS = [
  { id: 1, name: "Computer Science Engineering (CSE)" },
  { id: 2, name: "Electronics & Communication Engineering (ECE)" },
];

const TeacherRequestAccess = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    name: "",
    email: location.state?.email || "",
    department_id: "",
    staff_type: "Teaching",
    message: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await teacherRequestAccess({
        ...form,
        department_id: parseInt(form.department_id, 10),
      });
      setSuccess(true);
      // Auto-redirect to the homepage after showing the confirmation briefly
      setTimeout(() => {
        navigate("/");
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md text-center border border-gray-100">
          <CheckCircle2 className="mx-auto text-emerald-500 w-14 h-14 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Request Sent!</h2>
          <p className="text-sm text-gray-600 mb-2">
            Your request has been sent to the admin for review. You'll receive
            an email with a link to set your password once it's approved.
          </p>
          <p className="text-xs text-gray-400">Redirecting you to the homepage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate("/login/teacher")}
        className="absolute top-8 left-8 flex items-center text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-5 w-5 mr-2" /> Back to Login
      </button>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Request Faculty Access
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Submit your details for admin review
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

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="Dr. Jane Smith"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="you@college.edu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <select
                name="department_id"
                required
                value={form.department_id}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              >
                <option value="" disabled>Select your department</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Message <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                name="message"
                rows={3}
                value={form.message}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="Anything the admin should know..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors disabled:opacity-60"
              style={{ backgroundColor: "#10b981" }}
            >
              {loading ? "Sending..." : "Submit Request"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TeacherRequestAccess;