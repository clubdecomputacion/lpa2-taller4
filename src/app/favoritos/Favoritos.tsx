"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useToast } from "@/components/Toasts";
import {
  Boton,
  Confirmar,
  Encabezado,
  EstadoError,
  FilasCargando,
  Paginacion,
  Tarjeta,
  Vacio,
  td,
  th,
} from "@/components/ui";
import { mensajeError } from "@/lib/api";
import { formatearFecha } from "@/lib/formato";
import {
  useCrearFavorito,
  useEliminarFavorito,
  useFavoritos,
  useTodasLasCanciones,
  useTodosLosUsuarios,
} from "@/lib/queries";
import type { Favorito } from "@/lib/types";

const select =
  "flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950";

export default function Favoritos() {
  const toast = useToast();
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(10);
  const [idUsuario, setIdUsuario] = useState("");
  const [idCancion, setIdCancion] = useState("");
  const [eliminando, setEliminando] = useState<Favorito | null>(null);

  const favoritos = useFavoritos(offset, limit);
  // /api/favoritos solo trae ids: los nombres se resuelven con los listados
  // completos, que ya están en caché porque los usan otros selectores.
  const usuarios = useTodosLosUsuarios();
  const canciones = useTodasLasCanciones();
  const crear = useCrearFavorito();
  const eliminar = useEliminarFavorito();

  const nombreUsuario = useMemo(() => new Map(usuarios.data?.map((u) => [u.id, u.nombre])), [usuarios.data]);
  const cancionPorId = useMemo(() => new Map(canciones.data?.map((c) => [c.id, c])), [canciones.data]);

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idUsuario || !idCancion) return;
    crear.mutate(
      { idUsuario: Number(idUsuario), idCancion: Number(idCancion) },
      {
        onSuccess: () => {
          toast.exito("Favorito registrado");
          setIdCancion("");
        },
        onError: (err) => toast.error(mensajeError(err)),
      },
    );
  };

  const confirmarEliminar = () => {
    if (!eliminando) return;
    eliminar.mutate(eliminando.id, {
      onSuccess: () => {
        toast.exito("Favorito eliminado");
        if (favoritos.data?.items.length === 1 && offset > 0) setOffset(Math.max(0, offset - limit));
        setEliminando(null);
      },
      onError: (err) => toast.error(mensajeError(err)),
    });
  };

  const sinDatos = usuarios.data?.length === 0 || canciones.data?.length === 0;

  return (
    <>
      <Encabezado titulo="Favoritos" descripcion="Todas las canciones marcadas como favoritas, de todos los usuarios." />

      <Tarjeta>
        <form onSubmit={enviar} className="flex flex-col gap-2 border-b border-zinc-200 p-4 sm:flex-row dark:border-zinc-800">
          <select value={idUsuario} onChange={(e) => setIdUsuario(e.target.value)} disabled={!usuarios.data?.length} aria-label="Usuario" className={select}>
            <option value="">{usuarios.isPending ? "Cargando usuarios…" : "Usuario…"}</option>
            {usuarios.data?.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>
          <select value={idCancion} onChange={(e) => setIdCancion(e.target.value)} disabled={!canciones.data?.length} aria-label="Canción" className={select}>
            <option value="">{canciones.isPending ? "Cargando canciones…" : "Canción…"}</option>
            {canciones.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.titulo} — {c.artista}
              </option>
            ))}
          </select>
          <Boton type="submit" disabled={!idUsuario || !idCancion} cargando={crear.isPending}>
            Marcar favorito
          </Boton>
        </form>
        {sinDatos && (
          <p className="border-b border-zinc-200 px-4 py-2 text-sm text-zinc-500 dark:border-zinc-800">
            Necesitas al menos un usuario y una canción para registrar favoritos.
          </p>
        )}

        {favoritos.isError ? (
          <div className="p-4">
            <EstadoError error={favoritos.error} onReintentar={() => favoritos.refetch()} />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={`w-full min-w-[560px] text-sm ${favoritos.isPlaceholderData ? "opacity-60" : ""}`}>
                <thead className="bg-zinc-50 dark:bg-zinc-950/50">
                  <tr>
                    <th className={th}>Usuario</th>
                    <th className={th}>Canción</th>
                    <th className={th}>Marcado</th>
                    <th className={th}>
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {favoritos.isPending ? (
                    <FilasCargando columnas={4} />
                  ) : favoritos.data.items.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <Vacio titulo="Todavía no hay favoritos">Márcalos con el formulario de arriba o con ♡ en el catálogo.</Vacio>
                      </td>
                    </tr>
                  ) : (
                    favoritos.data.items.map((f) => {
                      const cancion = cancionPorId.get(f.id_cancion);
                      return (
                        <tr key={f.id} className="border-t border-zinc-100 dark:border-zinc-800">
                          <td className={td}>
                            <Link href={`/usuarios/${f.id_usuario}`} className="font-medium hover:text-violet-600 hover:underline dark:hover:text-violet-400">
                              {nombreUsuario.get(f.id_usuario) ?? `Usuario #${f.id_usuario}`}
                            </Link>
                          </td>
                          <td className={td}>
                            {cancion ? (
                              <>
                                <span className="font-medium">{cancion.titulo}</span>
                                <span className="text-zinc-500"> — {cancion.artista}</span>
                              </>
                            ) : (
                              <span className="text-zinc-500">Canción #{f.id_cancion}</span>
                            )}
                          </td>
                          <td className={`${td} text-zinc-500`}>{formatearFecha(f.fecha_marcado)}</td>
                          <td className={`${td} text-right`}>
                            <Boton variante="fantasma" className="text-red-600 hover:text-red-700 dark:text-red-400" onClick={() => setEliminando(f)}>
                              Eliminar
                            </Boton>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {favoritos.data && favoritos.data.total > 0 && (
              <Paginacion
                offset={offset}
                limit={limit}
                total={favoritos.data.total}
                onCambiar={setOffset}
                onCambiarLimite={(l) => {
                  setLimit(l);
                  setOffset(0);
                }}
                cargando={favoritos.isFetching}
              />
            )}
          </>
        )}
      </Tarjeta>

      <Confirmar
        abierto={eliminando !== null}
        titulo="Eliminar favorito"
        mensaje={
          eliminando && (
            <>
              ¿Quitar <strong className="text-zinc-900 dark:text-zinc-100">{cancionPorId.get(eliminando.id_cancion)?.titulo ?? `la canción #${eliminando.id_cancion}`}</strong> de
              los favoritos de {nombreUsuario.get(eliminando.id_usuario) ?? `el usuario #${eliminando.id_usuario}`}?
            </>
          )
        }
        cargando={eliminar.isPending}
        onConfirmar={confirmarEliminar}
        onCerrar={() => setEliminando(null)}
      />
    </>
  );
}
