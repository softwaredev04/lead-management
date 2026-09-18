const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token");
}

export function setToken(token) {
  window.localStorage.setItem("token", token);
}

export function clearToken() {
  window.localStorage.removeItem("token");
  window.localStorage.removeItem("user");
}

export function setUser(user) {
  window.localStorage.setItem("user", JSON.stringify(user));
}

export function getCurrentUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(getToken());
}

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    throw new Error("Unauthorized");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

export const api = {
  login: (email, password) => request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  }),
  getLeads: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/leads${qs ? `?${qs}` : ""}`);
  },
  getLead: (id) => request(`/api/leads/${id}`),
  createLead: (body) => request("/api/leads", { method: "POST", body: JSON.stringify(body) }),
  updateLead: (id, body) => request(`/api/leads/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteLead: (id) => request(`/api/leads/${id}`, { method: "DELETE" }),
  bulkLeads: (body) => request("/api/leads/bulk", { method: "POST", body: JSON.stringify(body) }),
  getStats: () => request("/api/leads/stats"),
  getCharts: () => request("/api/leads/charts"),
  getWebsites: () => request("/api/websites"),
  createWebsite: (body) =>
    request("/api/websites", { method: "POST", body: JSON.stringify(body) }),
  updateWebsite: (id, body) =>
    request(`/api/websites/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteWebsite: (id) => request(`/api/websites/${id}`, { method: "DELETE" }),
  getWebsiteStats: () => request("/api/websites/stats"),
  checkWebsite: (body) =>
    request("/api/websites/check", { method: "POST", body: JSON.stringify(body) }),
  cleanupTestLeads: () => request("/api/websites/check", { method: "DELETE" }),
  getServices: () => request("/api/services"),
  getUsers: () => request("/api/users"),
  createUser: (body) => request("/api/users", { method: "POST", body: JSON.stringify(body) }),
  getUser: (id) => request(`/api/users/${id}`),
  updateUser: (id, body) =>
    request(`/api/users/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteUser: (id) => request(`/api/users/${id}`, { method: "DELETE" }),
  getIntegrationAuthorizeRequest: (requestId) =>
    request(`/api/integrations/authorize-request/${encodeURIComponent(requestId)}`),
  confirmIntegration: (body) =>
    request("/api/integrations/confirm", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getIntegrations: () => request("/api/integrations"),
  disconnectIntegration: (id) =>
    request(`/api/integrations/${id}/disconnect`, { method: "POST" }),
};

export { API_BASE };
