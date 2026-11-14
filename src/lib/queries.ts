"use client";

// Hooks de datos con TanStack Query: caché en memoria, deduplicación de
// peticiones, reintentos y conservación de la página anterior al paginar.

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import { api } from "./api";
import type {
  CancionCreate,
  CancionUpdate,
  FiltrosCancion,
  UsuarioCreate,
  UsuarioUpdate,
} from "./types";

export const claves = {
  health: ["health"] as const,
  usuarios: ["usuarios"] as const,
  canciones: ["canciones"] as const,
  favoritos: ["favoritos"] as const,
};

// ---------------------------------------------------------------------------
// Consultas
// ---------------------------------------------------------------------------

export function useHealth() {
  return useQuery({
    queryKey: claves.health,
    queryFn: api.health,
    refetchInterval: 30_000,
    retry: false,
  });
}

export function useUsuarios(offset: number, limit: number) {
  return useQuery({
    queryKey: [...claves.usuarios, "lista", offset, limit],
    queryFn: () => api.usuarios.listar(offset, limit),
    placeholderData: keepPreviousData,
  });
}

export function useTodosLosUsuarios() {
  return useQuery({
    queryKey: [...claves.usuarios, "todos"],
    queryFn: api.usuarios.todos,
  });
}

export function useUsuario(id: number) {
  return useQuery({
    queryKey: [...claves.usuarios, id],
    queryFn: () => api.usuarios.obtener(id),
    enabled: Number.isInteger(id) && id > 0,
    retry: (n, e) => (e as { status?: number }).status !== 404 && n < 2,
  });
}

export function useFavoritosDeUsuario(id: number, offset: number, limit: number) {
  return useQuery({
    queryKey: [...claves.usuarios, id, "favoritos", offset, limit],
    queryFn: () => api.usuarios.favoritos(id, offset, limit),
    placeholderData: keepPreviousData,
    enabled: id > 0,
  });
}

/** Ids de las canciones favoritas del usuario (para pintar los corazones). */
export function useIdsFavoritos(idUsuario: number | null) {
  return useQuery({
    queryKey: [...claves.usuarios, idUsuario, "favoritos", "todos"],
    queryFn: () => api.usuarios.todosFavoritos(idUsuario!),
    enabled: idUsuario !== null,
    select: (favs) => new Set(favs.map((f) => f.id_cancion)),
  });
}

export function useCanciones(
  offset: number,
  limit: number,
  filtros: FiltrosCancion,
) {
  return useQuery({
    queryKey: [...claves.canciones, "lista", offset, limit, filtros],
    queryFn: () => api.canciones.listar(offset, limit, filtros),
    placeholderData: keepPreviousData,
  });
}

export function useTodasLasCanciones() {
  return useQuery({
    queryKey: [...claves.canciones, "todas"],
    queryFn: api.canciones.todas,
  });
}

export function useFavoritos(offset: number, limit: number) {
  return useQuery({
    queryKey: [...claves.favoritos, "lista", offset, limit],
    queryFn: () => api.favoritos.listar(offset, limit),
    placeholderData: keepPreviousData,
  });
}

// ---------------------------------------------------------------------------
// Mutaciones
// ---------------------------------------------------------------------------

// Borrar usuarios o canciones elimina sus favoritos en cascada, y los
// favoritos de un usuario incluyen los datos de la canción: por eso se
// invalidan también las claves relacionadas.
const invalidar = (qc: QueryClient, ...grupos: (keyof typeof claves)[]) =>
  Promise.all(grupos.map((g) => qc.invalidateQueries({ queryKey: claves[g] })));

export function useGuardarUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id?: number; datos: UsuarioCreate | UsuarioUpdate }) =>
      id ? api.usuarios.actualizar(id, datos) : api.usuarios.crear(datos as UsuarioCreate),
    onSuccess: () => invalidar(qc, "usuarios"),
  });
}

export function useEliminarUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.usuarios.eliminar,
    onSuccess: () => invalidar(qc, "usuarios", "favoritos"),
  });
}

export function useGuardarCancion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id?: number; datos: CancionCreate | CancionUpdate }) =>
      id ? api.canciones.actualizar(id, datos) : api.canciones.crear(datos as CancionCreate),
    onSuccess: () => invalidar(qc, "canciones", "usuarios"),
  });
}

export function useEliminarCancion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.canciones.eliminar,
    onSuccess: () => invalidar(qc, "canciones", "usuarios", "favoritos"),
  });
}

/** Marca o quita una canción de los favoritos de un usuario. */
export function useAlternarFavorito() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      idUsuario,
      idCancion,
      marcar,
    }: {
      idUsuario: number;
      idCancion: number;
      marcar: boolean;
    }): Promise<void> => {
      if (marcar) await api.usuarios.marcarFavorito(idUsuario, idCancion);
      else await api.usuarios.quitarFavorito(idUsuario, idCancion);
    },
    onSettled: () => invalidar(qc, "usuarios", "favoritos"),
  });
}

export function useCrearFavorito() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ idUsuario, idCancion }: { idUsuario: number; idCancion: number }) =>
      api.favoritos.crear(idUsuario, idCancion),
    onSuccess: () => invalidar(qc, "usuarios", "favoritos"),
  });
}

export function useEliminarFavorito() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.favoritos.eliminar,
    onSuccess: () => invalidar(qc, "usuarios", "favoritos"),
  });
}
