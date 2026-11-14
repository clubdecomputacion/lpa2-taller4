// Validaciones del lado del cliente. Replican las reglas del backend
// (musica_api/models.py y utils.py) para avisar antes de enviar; el backend
// sigue siendo la fuente de verdad y sus errores 422 se muestran igual.

export type Errores<K extends string> = Partial<Record<K, string>>;

// Mismo patrón que PATRON_CORREO en utils.py
const PATRON_CORREO = /^[\w.+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

export const AÑO_MINIMO = 1900;
export const añoActual = () => new Date().getFullYear();

function texto(
  valor: string,
  etiqueta: string,
  max: number,
  obligatorio = true,
): string | undefined {
  const v = valor.trim();
  if (obligatorio && !v) return `${etiqueta} es obligatorio`;
  if (v.length > max) return `Máximo ${max} caracteres (${v.length})`;
  return undefined;
}

// ---------------------------------------------------------------------------
// Usuario
// ---------------------------------------------------------------------------

export interface FormUsuario {
  nombre: string;
  correo: string;
}

export function validarUsuario(f: FormUsuario): Errores<keyof FormUsuario> {
  const e: Errores<keyof FormUsuario> = {};
  e.nombre = texto(f.nombre, "El nombre", 100);
  const correo = f.correo.trim();
  if (!correo) e.correo = "El correo es obligatorio";
  else if (correo.length > 255) e.correo = "Máximo 255 caracteres";
  else if (!PATRON_CORREO.test(correo))
    e.correo = "El correo no tiene un formato válido";
  return limpiar(e);
}

// ---------------------------------------------------------------------------
// Canción
// ---------------------------------------------------------------------------

export interface FormCancion {
  titulo: string;
  artista: string;
  album: string;
  /** Texto escrito por el usuario: "225" (segundos) o "3:45" (mm:ss). */
  duracion: string;
  año: string;
  genero: string;
}

/** Convierte "225" o "3:45" a segundos. Devuelve null si no es válido. */
export function parsearDuracion(valor: string): number | null {
  const v = valor.trim();
  if (/^\d+$/.test(v)) return Number(v);
  const m = /^(\d+):([0-5]\d)$/.exec(v);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  return null;
}

export function validarCancion(f: FormCancion): Errores<keyof FormCancion> {
  const e: Errores<keyof FormCancion> = {};
  e.titulo = texto(f.titulo, "El título", 200);
  e.artista = texto(f.artista, "El artista", 200);
  e.album = texto(f.album, "El álbum", 200, false);
  e.genero = texto(f.genero, "El género", 50);

  if (!f.duracion.trim()) e.duracion = "La duración es obligatoria";
  else {
    const s = parsearDuracion(f.duracion);
    if (s === null) e.duracion = "Usa segundos (225) o mm:ss (3:45)";
    else if (s <= 0) e.duracion = "Debe ser mayor que 0";
  }

  const max = añoActual();
  if (!f.año.trim()) e.año = "El año es obligatorio";
  else if (!/^\d{4}$/.test(f.año.trim())) e.año = "Escribe un año de 4 dígitos";
  else {
    const a = Number(f.año);
    if (a < AÑO_MINIMO || a > max)
      e.año = `El año debe estar entre ${AÑO_MINIMO} y ${max}`;
  }
  return limpiar(e);
}

function limpiar<K extends string>(e: Errores<K>): Errores<K> {
  for (const k of Object.keys(e) as K[]) if (!e[k]) delete e[k];
  return e;
}

export const sinErrores = (e: object) => Object.keys(e).length === 0;
