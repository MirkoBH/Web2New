import { API_URL } from './config.js';
import { cerrarSesion, obtenerSesion } from './sesion.js';

/** Error con el código HTTP y el mensaje que devolvió la API. */
export class ErrorApi extends Error {
  constructor(mensaje, estado) {
    super(mensaje);
    this.estado = estado;
  }
}

async function pedir(ruta, { metodo = 'GET', cuerpo, conSesion = false } = {}) {
  const cabeceras = {};
  const sesion = obtenerSesion();
  if (conSesion && sesion) cabeceras.Authorization = `Bearer ${sesion.token}`;

  let body;
  if (cuerpo instanceof FormData) {
    body = cuerpo;
  } else if (cuerpo !== undefined) {
    cabeceras['Content-Type'] = 'application/json';
    body = JSON.stringify(cuerpo);
  }

  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, { method: metodo, headers: cabeceras, body });
  } catch {
    throw new ErrorApi('No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.', 0);
  }

  if (respuesta.status === 204) return null;
  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    if (respuesta.status === 401 && conSesion) cerrarSesion();
    throw new ErrorApi(mensajeDeError(respuesta.status, datos), respuesta.status);
  }
  return datos;
}

function mensajeDeError(estado, datos) {
  const mensaje = Array.isArray(datos?.message) ? datos.message.join('. ') : datos?.message;
  if (estado === 429) return 'Hiciste muchos intentos seguidos. Esperá un minuto e intentá de nuevo.';
  if (estado === 413) return 'Las fotos son muy pesadas. Cada una puede pesar hasta 10 MB.';
  if (estado === 401 && !mensaje) return 'Tu sesión venció. Ingresá de nuevo.';
  return mensaje || 'Ocurrió un error inesperado. Intentá de nuevo.';
}

function aConsulta(filtros) {
  const parametros = new URLSearchParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== null && valor !== '') parametros.set(clave, valor);
  }
  const texto = parametros.toString();
  return texto ? `?${texto}` : '';
}

export const autenticacionApi = {
  registrar: (datos) => pedir('/autenticacion/registro', { metodo: 'POST', cuerpo: datos }),
  iniciarSesion: (datos) => pedir('/autenticacion/inicio-sesion', { metodo: 'POST', cuerpo: datos }),
};

export const usuariosApi = {
  obtenerPerfil: () => pedir('/usuarios/yo', { conSesion: true }),
  actualizarPerfil: (datos) => pedir('/usuarios/yo', { metodo: 'PATCH', cuerpo: datos, conSesion: true }),
};

export const autosApi = {
  listar: (filtros = {}) => pedir(`/autos${aConsulta(filtros)}`),
  listarMios: () => pedir('/autos/mios', { conSesion: true }),
  obtener: (id) => pedir(`/autos/${encodeURIComponent(id)}`),
  publicar: (formulario) => pedir('/autos', { metodo: 'POST', cuerpo: formulario, conSesion: true }),
  editar: (id, formulario) =>
    pedir(`/autos/${encodeURIComponent(id)}`, { metodo: 'PATCH', cuerpo: formulario, conSesion: true }),
  eliminar: (id) => pedir(`/autos/${encodeURIComponent(id)}`, { metodo: 'DELETE', conSesion: true }),
};

export const consultasApi = {
  crear: (datos) => pedir('/consultas', { metodo: 'POST', cuerpo: datos, conSesion: true }),
  listarPorAuto: (autoId) => pedir(`/consultas/auto/${encodeURIComponent(autoId)}`),
  listarRecibidas: () => pedir('/consultas/recibidas', { conSesion: true }),
  responder: (id, respuesta) =>
    pedir(`/consultas/${encodeURIComponent(id)}/respuesta`, {
      metodo: 'PATCH',
      cuerpo: { respuesta },
      conSesion: true,
    }),
};
