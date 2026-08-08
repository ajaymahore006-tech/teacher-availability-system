// PLACE AT: src/api/session.js  (NEW FILE)

const TOKEN_KEY = "dfa_token";
const ROLE_KEY = "dfa_role";
const IS_ADMIN_KEY = "dfa_is_admin";

export function saveSession(token, role, isAdmin = false) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
  localStorage.setItem(IS_ADMIN_KEY, isAdmin ? "true" : "false");
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRole() {
  return localStorage.getItem(ROLE_KEY);
}

export function isAdmin() {
  return localStorage.getItem(IS_ADMIN_KEY) === "true";
}

export function isLoggedIn() {
  return !!getToken();
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(IS_ADMIN_KEY);
}