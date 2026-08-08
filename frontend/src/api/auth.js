// PLACE AT: src/api/auth.js  (NEW FILE)

import client from "./client";

// ===================== STUDENT =====================
export const studentSendOtp = (email) => client.post("/api/student/send-otp", { email });

export const studentSignup = (payload) => client.post("/api/student/signup", payload);
// payload: { email, otp, name, password }

export const studentLogin = (email, password) =>
  client.post("/api/student/login", { email, password });

export const studentForgotPassword = (email) =>
  client.post("/api/student/forgot-password", { email });

export const studentResetPassword = (payload) =>
  client.post("/api/student/reset-password", payload);
// payload: { email, otp, new_password }

export const studentProfile = () => client.get("/api/student/profile");

// ===================== TEACHER =====================
export const teacherLogin = (email, password) =>
  client.post("/api/teacher/login", { email, password });

export const teacherRequestAccess = (payload) =>
  client.post("/api/teacher/request-access", payload);
// payload: { name, email, department_id, message }

export const teacherSetPassword = (token, new_password) =>
  client.post("/api/teacher/set-password", { token, new_password });

export const teacherProfile = () => client.get("/api/teacher/profile");

export const teacherList = () => client.get("/api/teacher/list");

export const teacherUpdateStatus = (status) =>
  client.put("/api/teacher/update-status", { status });

export const teacherAppointments = () => client.get("/api/teacher/appointments");

export const teacherUpdateAppointment = (id, status) =>
  client.put(`/api/teacher/appointments/${id}`, { status });

// ===================== ADMIN =====================
export const adminListRequests = (statusFilter) =>
  client.get("/api/admin/requests", { params: statusFilter ? { status_filter: statusFilter } : {} });

export const adminGetRequest = (id) => client.get(`/api/admin/requests/${id}`);

export const adminApproveRequest = (id) => client.post(`/api/admin/requests/${id}/approve`);

export const adminRejectRequest = (id) => client.post(`/api/admin/requests/${id}/reject`);

export const adminListTeachers = () => client.get("/api/admin/teachers");

export const adminCreateTeacher = (payload) => client.post("/api/admin/teachers", payload);
// payload: { name, email, department_id }

export const adminDeleteTeacher = (id) => client.delete(`/api/admin/teachers/${id}`);

export const adminPromoteTeacher = (id) => client.post(`/api/admin/teachers/${id}/promote`);

export const adminDemoteTeacher = (id) => client.post(`/api/admin/teachers/${id}/demote`);