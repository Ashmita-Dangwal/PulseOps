// Change this when your API is hosted somewhere other than localhost.
export const API_BASE = localStorage.getItem("pulseops_api") || "http://localhost:5000/api";
export const SOCKET_BASE = API_BASE.replace(/\/api\/?$/, "");
