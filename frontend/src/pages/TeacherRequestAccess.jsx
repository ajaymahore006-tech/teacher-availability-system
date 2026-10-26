import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { teacherRequestAccess } from "../api/auth";
import AuthShell from "../components/AuthShell";

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
    department_id: "1",
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
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthShell
        color="rust"
        eyebrow="REQUEST SUBMITTED"
        title={<>Access<br />Requested</>}
        subtitle="Your application has been received and queued for administrator review."
        backTo="/login/teacher"
        backLabel="Back to Login"
      >
        <div className="text-center py-6">
          <CheckCircle2 className="mx-auto text-emerald-600 w-12 h-12 mb-4" />
          <h2 className="font-display uppercase text-2xl mb-2">Request Sent!</h2>
          <p className="font-body text-sm text-[#0E1B1E]/70 mb-4">
            An administrator will review your access request. Once approved, you will receive an email with a secure link to set your password.
          </p>
          <p className="font-mono text-xs text-[#0E1B1E]/40">Redirecting to gateway in a few seconds...</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      color="rust"
      eyebrow="FACULTY REGISTRATION"
      title={<>Request<br />Access</>}
      subtitle="Submit your credentials for administrative approval to join the faculty directory."
      backTo="/login/teacher"
      backLabel="Back to Login"
    >
      <h2 className="font-display uppercase text-2xl mb-1">Request Account</h2>
      <p className="font-body text-sm text-[#0E1B1E]/60 mb-6">Enter your details for verification.</p>

      {error && (
        <div className="mb-5 flex items-start gap-2 bg-[#F43493]/10 border border-[#F43493]/30 text-[#a02166] text-sm px-3 py-2.5">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="font-body">{error}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">
        <div>
          <label className="font-mono text-xs tracking-widest text-[#0E1B1E]/60">FULL NAME</label>
          <input
            type="text"
            name="name"
            required
            value={form.name}
            onChange={handleChange}
            className="font-body mt-1 block w-full px-3 py-2.5 border border-[#0E1B1E]/20 bg-transparent focus:border-[#0E1B1E] focus:outline-none text-sm"
            placeholder="Dr. Jane Smith"
          />
        </div>

        <div>
          <label className="font-mono text-xs tracking-widest text-[#0E1B1E]/60">OFFICIAL EMAIL</label>
          <input
            type="email"
            name="email"
            required
            value={form.email}
            onChange={handleChange}
            className="font-body mt-1 block w-full px-3 py-2.5 border border-[#0E1B1E]/20 bg-transparent focus:border-[#0E1B1E] focus:outline-none text-sm"
            placeholder="you@college.edu"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-mono text-xs tracking-widest text-[#0E1B1E]/60">STAFF TYPE</label>
            <select
              name="staff_type"
              value={form.staff_type}
              onChange={handleChange}
              className="font-body mt-1 block w-full px-3 py-2.5 border border-[#0E1B1E]/20 bg-transparent focus:border-[#0E1B1E] focus:outline-none text-sm"
            >
              <option value="Teaching">Teaching</option>
              <option value="Non-Teaching">Non-Teaching</option>
            </select>
          </div>

          <div>
            <label className="font-mono text-xs tracking-widest text-[#0E1B1E]/60">DEPARTMENT</label>
            <select
              name="department_id"
              value={form.department_id}
              onChange={handleChange}
              className="font-body mt-1 block w-full px-3 py-2.5 border border-[#0E1B1E]/20 bg-transparent focus:border-[#0E1B1E] focus:outline-none text-sm"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="font-mono text-xs tracking-widest text-[#0E1B1E]/60">
            NOTE FOR ADMIN <span className="opacity-50">(OPTIONAL)</span>
          </label>
          <textarea
            name="message"
            rows={2}
            value={form.message}
            onChange={handleChange}
            className="font-body mt-1 block w-full px-3 py-2 border border-[#0E1B1E]/20 bg-transparent focus:border-[#0E1B1E] focus:outline-none text-sm"
            placeholder="Designation, research lab, etc."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full font-mono text-sm tracking-widest bg-[#0E1B1E] text-white py-3.5 hover:bg-[#0E1B1E]/85 transition-colors disabled:opacity-60 mt-2"
        >
          {loading ? "SUBMITTING..." : "SUBMIT ACCESS REQUEST"}
        </button>
      </form>
    </AuthShell>
  );
};

export default TeacherRequestAccess;
