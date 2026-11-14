// Tipos que reflejan los esquemas de la API de Música (lpa2-taller3).
// Las fechas llegan como texto ISO 8601.

export interface Pagina<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
}

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  fecha_registro: string;
}

export interface UsuarioCreate {
  nombre: string;
  correo: string;
}

export type UsuarioUpdate = Partial<UsuarioCreate>;

export interface Cancion {
  id: number;
  titulo: string;
  artista: string;
  album: string | null;
  /** Duración en segundos */
  duracion: number;
  año: number;
  genero: string;
  fecha_creacion: string;
}

export interface CancionCreate {
  titulo: string;
  artista: string;
  album: string | null;
  duracion: number;
  año: number;
  genero: string;
}

export type CancionUpdate = Partial<CancionCreate>;

export interface Favorito {
  id: number;
  id_usuario: number;
  id_cancion: number;
  fecha_marcado: string;
}

export interface FavoritoConCancion extends Favorito {
  cancion: Cancion;
}

export interface FiltrosCancion {
  titulo?: string;
  artista?: string;
  genero?: string;
}

export interface Health {
  status: "healthy" | "degraded";
  database: string;
  uptime_segundos: number;
  python: string;
  sistema: string;
}
