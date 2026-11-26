import { API_URL } from './config.js';
import { logout, getSession } from './session.js';

/** Error con el código HTTP y el mensaje que devolvió la API. */
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', payload, withAuth = false } = {}) {
  const headers = {};
  const session = getSession();
  if (withAuth && session) headers.Authorization = `Bearer ${session.token}`;

  let body;
  if (payload instanceof FormData) {
    body = payload;
  } else if (payload !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(payload);
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { method, headers, body });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.', 0);
  }

  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && withAuth) logout();
    throw new ApiError(errorMessage(response.status, data), response.status);
  }
  return data;
}

function errorMessage(status, data) {
  const message = Array.isArray(data?.message) ? data.message.join('. ') : data?.message;
  if (status === 429) return 'Hiciste muchos intentos seguidos. Esperá un minuto e intentá de nuevo.';
  if (status === 413) return 'Las fotos son muy pesadas. Cada una puede pesar hasta 10 MB.';
  if (status === 401 && !message) return 'Tu sesión venció. Ingresá de nuevo.';
  return message || 'Ocurrió un error inesperado. Intentá de nuevo.';
}

function toQueryString(filters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  }
  const text = params.toString();
  return text ? `?${text}` : '';
}

export const authApi = {
  register: (data) => request('/auth/register', { method: 'POST', payload: data }),
  login: (data) => request('/auth/login', { method: 'POST', payload: data }),
};

export const usersApi = {
  getProfile: () => request('/users/me', { withAuth: true }),
  updateProfile: (data) => request('/users/me', { method: 'PATCH', payload: data, withAuth: true }),
};

export const carsApi = {
  list: (filters = {}) => request(`/cars${toQueryString(filters)}`),
  listMine: () => request('/cars/mine', { withAuth: true }),
  get: (id) => request(`/cars/${encodeURIComponent(id)}`),
  publish: (form) => request('/cars', { method: 'POST', payload: form, withAuth: true }),
  update: (id, form) =>
    request(`/cars/${encodeURIComponent(id)}`, { method: 'PATCH', payload: form, withAuth: true }),
  remove: (id) => request(`/cars/${encodeURIComponent(id)}`, { method: 'DELETE', withAuth: true }),
};

export const inquiriesApi = {
  create: (data) => request('/inquiries', { method: 'POST', payload: data, withAuth: true }),
  listByCar: (carId) => request(`/inquiries/car/${encodeURIComponent(carId)}`),
  listReceived: () => request('/inquiries/received', { withAuth: true }),
  answer: (id, answer) =>
    request(`/inquiries/${encodeURIComponent(id)}/answer`, {
      method: 'PATCH',
      payload: { answer },
      withAuth: true,
    }),
};
