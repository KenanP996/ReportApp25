// Backend base; default to same-origin. Change if serving frontend from a different host.
const API_BASE = "";

const state = {
  token: localStorage.getItem("token"),
  user: null
};

export function getState() {
  return state;
}

export function setSession(token, user) {
  state.token = token;
  state.user = user;
  localStorage.setItem("token", token);
}

export function clearSession() {
  state.token = null;
  state.user = null;
  localStorage.removeItem("token");
}

export async function hydrateSession() {
  if (!state.token) return null;
  try {
    const { user } = await api("/api/auth/me");
    state.user = user;
    return user;
  } catch (error) {
    clearSession();
    return null;
  }
}

export async function api(path, options = {}) {
  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {})
  };

  let url = `${API_BASE}${path}`;

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(url, { ...options, headers });
  if (response.status === 204) return {};

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    clearSession();
    throw new Error(data?.error || "Unauthorized");
  }

  if (!response.ok) {
    throw new Error(data?.error || data?.message || "Request failed");
  }

  return data;
}

export function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function requireRole(role) {
  return state.user && state.user.role === role;
}
