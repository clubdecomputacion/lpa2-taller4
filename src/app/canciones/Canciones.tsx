"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import BotonFavorito from "@/components/BotonFavorito";
import { useToast } from "@/components/Toasts";
import {
  Boton,
  Confirmar,
  Encabezado,
  EstadoError,
  FilasCargando,
  Modal,
  Paginacion,
  Spinner,
  Tarjeta,
  Vacio,
  td,
  th,
} from "@/components/ui";
import { mensajeError } from "@/lib/api";
import { formatearDuracion } from "@/lib/formato";
import { useCanciones, useEliminarCancion, useIdsFavoritos } from "@/lib/queries";
import type { Cancion, FiltrosCancion } from "@/lib/types";
import { useDebounce } from "@/lib/useDebounce";
import { useUsuarioActivo } from "@/lib/usuarioActivo";

// El formulario solo se descarga cuando se abre el modal (lazy loading).
const FormCancion = dynamic(() => import("@/components/FormCancion"), {
  loading: () => (
    <div className="flex justify-center py-10">
      <Spinner className="size-6 text-zinc-400" />
    </div>
  ),
});

const FILTROS: { clave: keyof FiltrosCancion; etiqueta: string; placeholder: string }[] = [
  { clave: "titulo", etiqueta: "Título", placeholder: "Buscar por título" },
  { clave: "artista", etiqueta: "Artista", placeholder: "Buscar por artista" },
  { clave: "genero", etiqueta: "Género", placeholder: "Buscar por género" },
];

export default function Canciones() {
  const toast = useToast();
  const idUsuario = useUsuarioActivo();
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(10);
  const [filtros, setFiltros] = useState<FiltrosCancion>({});
  const filtrosAplicados = useDebounce(filtros);
  const [editando, setEditando] = useState<Cancion | "nueva" | null>(null);
  const [eliminando, setEliminando] = useState<Cancion | null>(null);

  const { data, isPending, isError, error, refetch, isPlaceholderData, isFetching } = useCanciones(
    offset,
    limit,
    filtrosAplicados,
  );
  const favoritos = useIdsFavoritos(idUsuario);
  const eliminar = useEliminarCancion();

  const hayFiltros = Object.values(filtros).some((v) => v?.trim());

  const cambiarFiltro = (clave: keyof FiltrosCancion, valor: string) => {
    setFiltros((f) => ({ ...f, [clave]: valor }));
    setOffset(0);
  };

  // Si se borra el último elemento de una página, retroceder una.
  const confirmarEliminar = () => {
    if (!eliminando) return;
    const c = eliminando;
    eliminar.mutate(c.id, {
      onSuccess: () => {
        toast.exito(`"${c.titulo}" eliminada`);
        if (data && data.items.length === 1 && offset > 0) setOffset(Math.max(0, offset - limit));
        setEliminando(null);
      },
      onError: (e) => toast.error(mensajeError(e)),
    });
  };

  const columnas = idUsuario ? 7 : 6;

  return (
    <>
      <Encabezado
        titulo="Canciones"
        descripcion={
          idUsuario
            ? "Toca ♡ para marcar una canción como favorita del usuario activo."
            : "Elige un usuario en la barra superior para marcar favoritos."
        }
        acciones={<Boton onClick={() => setEditando("nueva")}>+ Agregar canción</Boton>}
      />

      <Tarjeta>
        <div className="grid gap-3 border-b border-zinc-200 p-4 sm:grid-cols-3 dark:border-zinc-800">
          {FILTROS.map((f) => (
            <input
              key={f.clave}
              type="search"
              value={filtros[f.clave] ?? ""}
              onChange={(e) => cambiarFiltro(f.clave, e.target.value)}
              placeholder={f.placeholder}
              aria-label={f.etiqueta}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 dark:border-zinc-700 dark:bg-zinc-950"
            />
          ))}
        </div>

        {isError ? (
          <div className="p-4">
            <EstadoError error={error} onReintentar={() => refetch()} />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={`w-full min-w-[640px] text-sm transition-opacity ${isPlaceholderData ? "opacity-60" : ""}`}>
                <thead className="bg-zinc-50 dark:bg-zinc-950/50">
                  <tr>
                    {idUsuario && <th className={`${th} w-12`}><span className="sr-only">Favorito</span></th>}
                    <th className={th}>Canción</th>
                    <th className={th}>Álbum</th>
                    <th className={th}>Género</th>
                    <th className={`${th} text-right`}>Año</th>
                    <th className={`${th} text-right`}>Duración</th>
                    <th className={`${th} text-right`}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {isPending ? (
                    <FilasCargando columnas={columnas} />
                  ) : data.items.length === 0 ? (
                    <tr>
                      <td colSpan={columnas}>
                        {hayFiltros ? (
                          <Vacio titulo="Sin resultados">Ninguna canción coincide con la búsqueda.</Vacio>
                        ) : (
                          <Vacio titulo="Aún no hay canciones">Agrega la primera con el botón “Agregar canción”.</Vacio>
                        )}
                      </td>
                    </tr>
                  ) : (
                    data.items.map((c) => (
                      <tr key={c.id} className="border-t border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40">
                        {idUsuario && (
                          <td className="px-2 py-2">
                            {favoritos.isPending ? (
                              <span className="grid size-8 place-items-center text-zinc-300">♡</span>
                            ) : (
                              <BotonFavorito cancion={c} idUsuario={idUsuario} marcado={favoritos.data?.has(c.id) ?? false} />
                            )}
                          </td>
                        )}
                        <td className={td}>
                          <p className="font-medium">{c.titulo}</p>
                          <p className="text-zinc-500">{c.artista}</p>
                        </td>
                        <td className={`${td} text-zinc-600 dark:text-zinc-400`}>{c.album ?? "—"}</td>
                        <td className={td}>
                          <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                            {c.genero}
                          </span>
                        </td>
                        <td className={`${td} text-right tabular-nums`}>{c.año}</td>
                        <td className={`${td} text-right tabular-nums`}>{formatearDuracion(c.duracion)}</td>
                        <td className={`${td} text-right whitespace-nowrap`}>
                          <Boton variante="fantasma" onClick={() => setEditando(c)}>
                            Editar
                          </Boton>
                          <Boton variante="fantasma" className="text-red-600 hover:text-red-700 dark:text-red-400" onClick={() => setEliminando(c)}>
                            Eliminar
                          </Boton>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {data && data.total > 0 && (
              <Paginacion
                offset={offset}
                limit={limit}
                total={data.total}
                onCambiar={setOffset}
                onCambiarLimite={(l) => {
                  setLimit(l);
                  setOffset(0);
                }}
                cargando={isFetching}
              />
            )}
          </>
        )}
      </Tarjeta>

      <Modal
        abierto={editando !== null}
        onCerrar={() => setEditando(null)}
        titulo={editando === "nueva" ? "Agregar canción" : "Editar canción"}
      >
        {editando !== null && (
          <FormCancion
            key={editando === "nueva" ? "nueva" : editando.id}
            cancion={editando === "nueva" ? undefined : editando}
            onListo={() => setEditando(null)}
          />
        )}
      </Modal>

      <Confirmar
        abierto={eliminando !== null}
        titulo="Eliminar canción"
        mensaje={
          <>
            ¿Eliminar <strong className="text-zinc-900 dark:text-zinc-100">“{eliminando?.titulo}”</strong> de{" "}
            {eliminando?.artista}? También se quitará de los favoritos de todos los usuarios. Esta acción no se puede deshacer.
          </>
        }
        cargando={eliminar.isPending}
        onConfirmar={confirmarEliminar}
        onCerrar={() => setEliminando(null)}
      />
    </>
  );
}
