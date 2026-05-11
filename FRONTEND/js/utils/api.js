// ─────────────────────────────────────────────────────────────
// AutoPulse – Cliente API centralizado
// Todas las llamadas al backend pasan por aquí
// ─────────────────────────────────────────────────────────────

const API_BASE = window.__APP_CONFIG__?.API_BASE_URL || "http://localhost:3000/api";

// ── Token JWT desde sesión ────────────────────────────────────
function getToken() {
  try {
    const sesion = JSON.parse(localStorage.getItem("web2_session") || "null");
    return sesion?.token || null;
  } catch {
    return null;
  }
}

// ── Fetch base con manejo de errores ─────────────────────────
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Error desconocido" }));
    // Si el backend rechazó por IA, incluir el detalle en el mensaje
    if (err.rechazado) {
      const error = new Error(err.message || "Publicación rechazada por la IA.");
      error.danios  = err.danios;
      error.puntaje = err.puntaje;
      error.motivo  = err.motivo;
      throw error;
    }
    throw new Error(err.message || `Error ${res.status}`);
  }

  return res.json();
}

// ── Fetch para multipart (sin Content-Type, lo pone el browser) ─
async function apiFetchMultipart(path, formData) {
  const token = getToken();
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Error desconocido" }));
    // Si el backend rechazó por IA, incluir el detalle en el mensaje
    if (err.rechazado) {
      const error = new Error(err.message || "Publicación rechazada por la IA.");
      error.danios  = err.danios;
      error.puntaje = err.puntaje;
      error.motivo  = err.motivo;
      throw error;
    }
    throw new Error(err.message || `Error ${res.status}`);
  }

  return res.json();
}

// ══════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════
export const authApi = {
  registrar: (datos) => apiFetch("/auth/register", { method: "POST", body: JSON.stringify(datos) }),
  login: (datos) => apiFetch("/auth/login", { method: "POST", body: JSON.stringify(datos) }),
};

// ══════════════════════════════════════════════════════════════
// AUTOS
// ══════════════════════════════════════════════════════════════
export const carsApi = {
  listar: (filtros = {}) => {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([k, v]) => { if (v !== "" && v != null) params.set(k, v); });
    const qs = params.toString();
    return apiFetch(`/cars${qs ? "?" + qs : ""}`);
  },
  obtener: (id) => apiFetch(`/cars/${id}`),
  misAutos: () => apiFetch("/cars/mis-autos"),
  crear: (datos) => apiFetch("/cars", { method: "POST", body: JSON.stringify(datos) }),
  actualizar: (id, datos) => apiFetch(`/cars/${id}`, { method: "PATCH", body: JSON.stringify(datos) }),
  eliminar: (id) => apiFetch(`/cars/${id}`, { method: "DELETE" }),
  subirImagenes: (id, formData) => apiFetchMultipart(`/cars/${id}/upload-images`, formData),
  analizarIA: (id) => apiFetch(`/cars/${id}/analizar-ia`, { method: "POST" }),
};

// ══════════════════════════════════════════════════════════════
// CONSULTAS
// ══════════════════════════════════════════════════════════════
export const consultasApi = {
  crear: (datos) => apiFetch("/consultas", { method: "POST", body: JSON.stringify(datos) }),
  porAuto: (autoId) => apiFetch(`/consultas/auto/${autoId}`),
  misConsultas: () => apiFetch("/consultas/mis-consultas"),
  responder: (id, respuesta) => apiFetch(`/consultas/${id}/responder`, { method: "PATCH", body: JSON.stringify({ respuesta }) }),
};

// ══════════════════════════════════════════════════════════════
// USUARIOS
// ══════════════════════════════════════════════════════════════
export const usuariosApi = {
  miPerfil: () => apiFetch("/users/me"),
};
