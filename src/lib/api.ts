// Cliente HTTP de la API de Música.
//
// Formatos de error que devuelve el backend:
//   400 / 404  -> {"detail": "mensaje"}
//   422        -> {"detail": [{"loc": ["body", "campo"], "msg": "..."}]}
//   500        -> {"detail": "Error interno del servidor", "request_id": "..."}
// DELETE responde 204 sin cuerpo.

import type {
  Cancion,
  CancionCreate,
  CancionUpdate,
  Favorito,
  FavoritoConCancion,
  FiltrosCancion,
  Health,
  Pagina,
  Usuario,
  UsuarioCreate,
  UsuarioUpdate,
} from "./types";

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"
).replace(/\/+$/, "");

const TIMEOUT_MS = 10_000;

/** Máximo que acepta el backend en `limit`. */
export const LIMITE_MAXIMO = 100;

export class ApiError extends Error {
  /** 0 = no hubo respuesta (API caída, CORS, timeout). */
  readonly status: number;
  /** Errores por campo (de un 422), con la clave del campo del formulario. */
  readonly campos: Record<string, string>;
  readonly requestId?: string;

  constructor(
    message: string,
    status: number,
    campos: Record<string, string> = {},
    requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.campos = campos;
    this.requestId = requestId;
  }
}

interface DetalleValidacion {
  loc: (string | number)[];
  msg: string;
  type?: string;
}

// Traducción de los mensajes de validación de Pydantic más comunes.
function traducirMensaje(d: DetalleValidacion): string {
  const msg = d.msg.replace(/^Value error, /, "");
  switch (d.type) {
    case "missing":
      return "Este campo es obligatorio";
    case "string_too_short":
      return "No puede estar vacío";
    case "string_too_long":
      return "El texto es demasiado largo";
    case "greater_than":
      return "Debe ser mayor que 0";
    case "int_parsing":
    case "int_type":
      return "Debe ser un número entero";
    default:
      return msg;
  }
}

async function construirError(res: Response): Promise<ApiError> {
  const requestId = res.headers.get("X-Request-ID") ?? undefined;
  let cuerpo: unknown = null;
  try {
    cuerpo = await res.json();
  } catch {
    // respuesta sin JSON
  }
  const detail = (cuerpo as { detail?: unknown } | null)?.detail;

  if (res.status === 422 && Array.isArray(detail)) {
    const campos: Record<string, string> = {};
    for (const d of detail as DetalleValidacion[]) {
      // loc = ["body", "campo"] o ["query", "limit"]
      const campo = String(d.loc[d.loc.length - 1]);
      campos[campo] ??= traducirMensaje(d);
    }
    return new ApiError("Revisa los datos del formulario", 422, campos, requestId);
  }

  if (typeof detail === "string") {
    return new ApiError(detail, res.status, {}, requestId);
  }

  const genericos: Record<number, string> = {
    404: "Recurso no encontrado",
    500: "Error interno del servidor",
  };
  return new ApiError(
    genericos[res.status] ?? `Error inesperado (HTTP ${res.status})`,
    res.status,
    {},
    requestId,
  );
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
      signal: init.signal ?? AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    const timeout = e instanceof DOMException && e.name === "TimeoutError";
    throw new ApiError(
      timeout
        ? "La API tardó demasiado en responder"
        : `No se pudo conectar con la API en ${API_URL}. ¿Está en ejecución?`,
      0,
    );
  }

  if (!res.ok) throw await construirError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function query(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/** Recorre todas las páginas de un listado (para selectores). */
async function todas<T>(
  path: string,
  filtros: Record<string, string | undefined> = {},
): Promise<T[]> {
  const items: T[] = [];
  let offset = 0;
  for (;;) {
    const pag = await request<Pagina<T>>(
      `${path}${query({ ...filtros, offset, limit: LIMITE_MAXIMO })}`,
    );
    items.push(...pag.items);
    offset += pag.items.length;
    if (pag.items.length === 0 || offset >= pag.total) return items;
  }
}

const json = (data: unknown) => JSON.stringify(data);

export const api = {
  health: () => request<Health>("/health"),

  usuarios: {
    listar: (offset: number, limit: number) =>
      request<Pagina<Usuario>>(`/api/usuarios${query({ offset, limit })}`),
    todos: () => todas<Usuario>("/api/usuarios"),
    obtener: (id: number) => request<Usuario>(`/api/usuarios/${id}`),
    crear: (datos: UsuarioCreate) =>
      request<Usuario>("/api/usuarios", { method: "POST", body: json(datos) }),
    actualizar: (id: number, datos: UsuarioUpdate) =>
      request<Usuario>(`/api/usuarios/${id}`, {
        method: "PUT",
        body: json(datos),
      }),
    eliminar: (id: number) =>
      request<void>(`/api/usuarios/${id}`, { method: "DELETE" }),
    favoritos: (id: number, offset: number, limit: number) =>
      request<Pagina<FavoritoConCancion>>(
        `/api/usuarios/${id}/favoritos${query({ offset, limit })}`,
      ),
    todosFavoritos: (id: number) =>
      todas<FavoritoConCancion>(`/api/usuarios/${id}/favoritos`),
    marcarFavorito: (idUsuario: number, idCancion: number) =>
      request<Favorito>(`/api/usuarios/${idUsuario}/favoritos/${idCancion}`, {
        method: "POST",
      }),
    quitarFavorito: (idUsuario: number, idCancion: number) =>
      request<void>(`/api/usuarios/${idUsuario}/favoritos/${idCancion}`, {
        method: "DELETE",
      }),
  },

  canciones: {
    listar: (offset: number, limit: number, filtros: FiltrosCancion = {}) => {
      const limpios = {
        titulo: filtros.titulo?.trim(),
        artista: filtros.artista?.trim(),
        genero: filtros.genero?.trim(),
      };
      const hayFiltros = Object.values(limpios).some(Boolean);
      const ruta = hayFiltros ? "/api/canciones/buscar" : "/api/canciones";
      return request<Pagina<Cancion>>(
        `${ruta}${query({ ...(hayFiltros ? limpios : {}), offset, limit })}`,
      );
    },
    todas: () => todas<Cancion>("/api/canciones"),
    obtener: (id: number) => request<Cancion>(`/api/canciones/${id}`),
    crear: (datos: CancionCreate) =>
      request<Cancion>("/api/canciones", { method: "POST", body: json(datos) }),
    actualizar: (id: number, datos: CancionUpdate) =>
      request<Cancion>(`/api/canciones/${id}`, {
        method: "PUT",
        body: json(datos),
      }),
    eliminar: (id: number) =>
      request<void>(`/api/canciones/${id}`, { method: "DELETE" }),
  },

  favoritos: {
    listar: (offset: number, limit: number) =>
      request<Pagina<Favorito>>(`/api/favoritos${query({ offset, limit })}`),
    crear: (idUsuario: number, idCancion: number) =>
      request<Favorito>("/api/favoritos", {
        method: "POST",
        body: json({ id_usuario: idUsuario, id_cancion: idCancion }),
      }),
    eliminar: (id: number) =>
      request<void>(`/api/favoritos/${id}`, { method: "DELETE" }),
  },
};

/** Mensaje legible para cualquier error (incluye el id de seguimiento en 500). */
export function mensajeError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.requestId && error.status >= 500
      ? `${error.message} (id: ${error.requestId})`
      : error.message;
  }
  return error instanceof Error ? error.message : "Error desconocido";
}
