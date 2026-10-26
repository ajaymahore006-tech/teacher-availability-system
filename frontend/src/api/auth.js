import client from "./client";

// ===================== STUDENT =====================
export const studentSendOtp = (email) => client.post("/api/student/send-otp", { email });

export const studentSignup = (payload) => client.post("/api/student/signup", payload);
// payload: { email, otp, name, password, section }

export const studentLogin = (email, password) =>
  client.post("/api/student/login", { email, password });

export const studentForgotPassword = (email) =>
  client.post("/api/student/forgot-password", { email });

export const studentResetPassword = (payload) =>
  client.post("/api/student/reset-password", payload);
// payload: { email, otp, new_password }

export const studentProfile = () => client.get("/api/student/profile");

export const studentUpdateSection = (section) =>
  client.put("/api/student/section", { section });

export const studentBookAppointment = (teacher_id, purpose) =>
  client.post("/api/student/book-appointment", { teacher_id, purpose });

export const studentAppointments = () => client.get("/api/student/appointments");

export const studentGetCRMessages = () => client.get("/api/student/cr-messages");

export const studentMarkCRMessageRead = (id) =>
  client.put(`/api/student/cr-messages/${id}/read`);

// ===================== TEACHER =====================
export const teacherLogin = (email, password) =>
  client.post("/api/teacher/login", { email, password });

export const teacherRequestAccess = (payload) =>
  client.post("/api/teacher/request-access", payload);
// payload: { name, email, department_id, staff_type, message }

export const teacherSetPassword = (token, new_password) =>
  client.post("/api/teacher/set-password", { token, new_password });

export const teacherProfile = () => client.get("/api/teacher/profile");

export const teacherList = () => client.get("/api/teacher/list");

export const teacherUpdateStatus = (status) =>
  client.put("/api/teacher/update-status", { status });

export const teacherAppointments = () => client.get("/api/teacher/appointments");

export const teacherUpdateAppointment = (id, status) =>
  client.put(`/api/teacher/appointments/${id}`, { status });

export const teacherSearchStudent = (roll_no) =>
  client.get("/api/teacher/students/search", { params: { roll_no } });

export const teacherToggleCR = (roll_no) =>
  client.post(`/api/teacher/students/${roll_no}/toggle-cr`);

export const teacherListCRs = (section) =>
  client.get("/api/teacher/crs", { params: section && section !== "All" ? { section } : {} });

export const teacherSendCRMessage = (payload) =>
  client.post("/api/teacher/cr-messages", payload);
// payload: { student_email, title, content }

export const teacherBroadcastCRMessage = (payload) =>
  client.post("/api/teacher/cr-messages/broadcast", payload);
// payload: { section, title, content }

export const teacherGetCRMessages = () =>
  client.get("/api/teacher/cr-messages");

// ===================== SHARED =====================
export const getAppointmentMessages = (appointmentId) =>
  client.get(`/api/appointments/${appointmentId}/messages`);

export const sendAppointmentMessage = (appointmentId, content) =>
  client.post(`/api/appointments/${appointmentId}/messages`, { content });

// ===================== ADMIN =====================
export const adminListRequests = (statusFilter) =>
  client.get("/api/admin/requests", { params: statusFilter ? { status_filter: statusFilter } : {} });

export const adminGetRequest = (id) => client.get(`/api/admin/requests/${id}`);

export const adminApproveRequest = (id) => client.post(`/api/admin/requests/${id}/approve`);

export const adminRejectRequest = (id) => client.post(`/api/admin/requests/${id}/reject`);

export const adminListTeachers = () => client.get("/api/admin/teachers");

export const adminCreateTeacher = (payload) => client.post("/api/admin/teachers", payload);

export const adminDeleteTeacher = (id) => client.delete(`/api/admin/teachers/${id}`);

export const adminPromoteTeacher = (id) => client.post(`/api/admin/teachers/${id}/promote`);

export const adminDemoteTeacher = (id) => client.post(`/api/admin/teachers/${id}/demote`);
