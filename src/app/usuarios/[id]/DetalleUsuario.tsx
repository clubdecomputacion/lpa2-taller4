"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

import { useToast } from "@/components/Toasts";
import {
  Boton,
  Encabezado,
  EstadoError,
  FilasCargando,
  Paginacion,
  Tarjeta,
  Vacio,
  td,
  th,
} from "@/components/ui";
import { ApiError, mensajeError } from "@/lib/api";
import { formatearDuracion, formatearFecha } from "@/lib/formato";
import {
  useAlternarFavorito,
  useFavoritosDeUsuario,
  useIdsFavoritos,
  useTodasLasCanciones,
  useUsuario,
} from "@/lib/queries";
import { setUsuarioActivo, useUsuarioActivo } from "@/lib/usuarioActivo";

function AgregarFavorito({ idUsuario }: { idUsuario: number }) {
  const toast = useToast();
  const canciones = useTodasLasCanciones();
  const favoritos = useIdsFavoritos(idUsuario);
  const alternar = useAlternarFavorito();
  const [seleccion, setSeleccion] = useState("");

  const disponibles = useMemo(
    () => (canciones.data ?? []).filter((c) => !favoritos.data?.has(c.id)),
    [canciones.data, favoritos.data],
  );

  const agregar = (e: React.FormEvent) => {
    e.preventDefault();
    const idCancion = Number(seleccion);
    if (!idCancion) return;
    alternar.mutate(
      { idUsuario, idCancion, marcar: true },
      {
        onSuccess: () => {
          toast.exito("Canción agregada a favoritos");
          setSeleccion("");
        },
        onError: (err) => toast.error(mensajeError(err)),
      },
    );
  };

  const cargando = canciones.isPending || favoritos.isPending;

  return (
    <form onSubmit={agregar} className="flex flex-col gap-2 border-b border-zinc-200 p-4 sm:flex-row dark:border-zinc-800">
      <select
        value={seleccion}
        onChange={(e) => setSeleccion(e.target.value)}
        disabled={cargando || disponibles.length === 0}
        aria-label="Canción para agregar a favoritos"
        className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950"
      >
        <option value="">
          {cargando
            ? "Cargando canciones…"
            : canciones.isError
              ? "No se pudieron cargar las canciones"
              : disponibles.length === 0
                ? "No hay más canciones para agregar"
                : "Elige una canción para agregar…"}
        </option>
        {disponibles.map((c) => (
          <option key={c.id} value={c.id}>
            {c.titulo} — {c.artista}
          </option>
        ))}
      </select>
      <Boton type="submit" disabled={!seleccion} cargando={alternar.isPending}>
        Agregar a favoritos
      </Boton>
    </form>
  );
}

export default function DetalleUsuario() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const toast = useToast();
  const activo = useUsuarioActivo();
  const [offset, setOffset] = useState(0);
  const limit = 10;

  const usuario = useUsuario(id);
  const favoritos = useFavoritosDeUsuario(usuario.data ? id : 0, offset, limit);
  const quitar = useAlternarFavorito();

  if (!Number.isInteger(id) || id <= 0 || (usuario.error instanceof ApiError && usuario.error.status === 404)) {
    return (
      <Tarjeta>
        <Vacio titulo="Usuario no encontrado">
          <Link href="/usuarios" className="text-violet-600 underline dark:text-violet-400">
            Volver a usuarios
          </Link>
        </Vacio>
      </Tarjeta>
    );
  }

  if (usuario.isError) return <EstadoError error={usuario.error} onReintentar={() => usuario.refetch()} />;

  const quitarFavorito = (idCancion: number, titulo: string) =>
    quitar.mutate(
      { idUsuario: id, idCancion, marcar: false },
      {
        onSuccess: () => {
          toast.exito(`"${titulo}" quitada de favoritos`);
          if (favoritos.data?.items.length === 1 && offset > 0) setOffset(offset - limit);
        },
        onError: (e) => toast.error(mensajeError(e)),
      },
    );

  return (
    <>
      <Link href="/usuarios" className="mb-4 inline-block text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
        ← Usuarios
      </Link>
      <Encabezado
        titulo={usuario.data?.nombre ?? "Cargando…"}
        descripcion={
          usuario.data && (
            <>
              {usuario.data.correo} · registrado el {formatearFecha(usuario.data.fecha_registro)}
            </>
          )
        }
        acciones={
          usuario.data &&
          (activo === id ? (
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              Usuario activo
            </span>
          ) : (
            <Boton variante="secundario" onClick={() => setUsuarioActivo(id)}>
              Usar como usuario activo
            </Boton>
          ))
        }
      />

      <Tarjeta>
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h2 className="font-medium">Canciones favoritas</h2>
          {favoritos.data && <span className="text-sm text-zinc-500">{favoritos.data.total}</span>}
        </div>
        {usuario.data && <AgregarFavorito idUsuario={id} />}

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
                    <th className={th}>Canción</th>
                    <th className={th}>Género</th>
                    <th className={`${th} text-right`}>Duración</th>
                    <th className={th}>Marcada</th>
                    <th className={th}>
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {favoritos.isPending ? (
                    <FilasCargando columnas={5} filas={3} />
                  ) : favoritos.data.items.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <Vacio titulo="Sin favoritos todavía">
                          Agrégalos con el selector de arriba o desde{" "}
                          <Link href="/canciones" className="text-violet-600 underline dark:text-violet-400">
                            el catálogo
                          </Link>
                          .
                        </Vacio>
                      </td>
                    </tr>
                  ) : (
                    favoritos.data.items.map((f) => (
                      <tr key={f.id} className="border-t border-zinc-100 dark:border-zinc-800">
                        <td className={td}>
                          <p className="font-medium">{f.cancion.titulo}</p>
                          <p className="text-zinc-500">
                            {f.cancion.artista}
                            {f.cancion.album && ` · ${f.cancion.album}`} · {f.cancion.año}
                          </p>
                        </td>
                        <td className={td}>{f.cancion.genero}</td>
                        <td className={`${td} text-right tabular-nums`}>{formatearDuracion(f.cancion.duracion)}</td>
                        <td className={`${td} text-zinc-500`}>{formatearFecha(f.fecha_marcado)}</td>
                        <td className={`${td} text-right`}>
                          <Boton
                            variante="fantasma"
                            className="text-red-600 hover:text-red-700 dark:text-red-400"
                            disabled={quitar.isPending && quitar.variables?.idCancion === f.id_cancion}
                            onClick={() => quitarFavorito(f.id_cancion, f.cancion.titulo)}
                          >
                            Quitar
                          </Boton>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {favoritos.data && favoritos.data.total > limit && (
              <Paginacion
                offset={offset}
                limit={limit}
                total={favoritos.data.total}
                onCambiar={setOffset}
                cargando={favoritos.isFetching}
              />
            )}
          </>
        )}
      </Tarjeta>
    </>
  );
}
