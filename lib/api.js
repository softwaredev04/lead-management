const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token");
}

export function setToken(token) {
  window.localStorage.setItem("token", token);
}

export function clearToken() {
  window.localStorage.removeItem("token");
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
  getWebsites: () => request("/api/websites"),
  getServices: () => request("/api/services"),
};

export { API_BASE };
