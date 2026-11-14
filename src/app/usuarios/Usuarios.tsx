"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";

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
import { formatearFecha } from "@/lib/formato";
import { useEliminarUsuario, useUsuarios } from "@/lib/queries";
import type { Usuario } from "@/lib/types";
import { setUsuarioActivo, useUsuarioActivo } from "@/lib/usuarioActivo";

const FormUsuario = dynamic(() => import("@/components/FormUsuario"), {
  loading: () => (
    <div className="flex justify-center py-10">
      <Spinner className="size-6 text-zinc-400" />
    </div>
  ),
});

export default function Usuarios() {
  const toast = useToast();
  const activo = useUsuarioActivo();
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(10);
  const [editando, setEditando] = useState<Usuario | "nuevo" | null>(null);
  const [eliminando, setEliminando] = useState<Usuario | null>(null);

  const { data, isPending, isError, error, refetch, isPlaceholderData, isFetching } = useUsuarios(offset, limit);
  const eliminar = useEliminarUsuario();

  const confirmarEliminar = () => {
    if (!eliminando) return;
    const u = eliminando;
    eliminar.mutate(u.id, {
      onSuccess: () => {
        toast.exito(`Usuario "${u.nombre}" eliminado`);
        if (activo === u.id) setUsuarioActivo(null);
        if (data && data.items.length === 1 && offset > 0) setOffset(Math.max(0, offset - limit));
        setEliminando(null);
      },
      onError: (e) => toast.error(mensajeError(e)),
    });
  };

  return (
    <>
      <Encabezado
        titulo="Usuarios"
        descripcion="Administra los perfiles y consulta sus canciones favoritas."
        acciones={<Boton onClick={() => setEditando("nuevo")}>+ Nuevo usuario</Boton>}
      />

      <Tarjeta>
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
                    <th className={th}>Nombre</th>
                    <th className={th}>Correo</th>
                    <th className={th}>Registro</th>
                    <th className={`${th} text-right`}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {isPending ? (
                    <FilasCargando columnas={4} />
                  ) : data.items.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <Vacio titulo="Aún no hay usuarios">Crea el primero con el botón “Nuevo usuario”.</Vacio>
                      </td>
                    </tr>
                  ) : (
                    data.items.map((u) => (
                      <tr key={u.id} className="border-t border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40">
                        <td className={td}>
                          <Link href={`/usuarios/${u.id}`} className="font-medium hover:text-violet-600 hover:underline dark:hover:text-violet-400">
                            {u.nombre}
                          </Link>
                          {activo === u.id && (
                            <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                              activo
                            </span>
                          )}
                        </td>
                        <td className={`${td} text-zinc-600 dark:text-zinc-400`}>{u.correo}</td>
                        <td className={`${td} text-zinc-600 dark:text-zinc-400`}>{formatearFecha(u.fecha_registro)}</td>
                        <td className={`${td} text-right whitespace-nowrap`}>
                          <Link
                            href={`/usuarios/${u.id}`}
                            className="inline-flex rounded-lg px-3.5 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                          >
                            Favoritos
                          </Link>
                          {activo !== u.id && (
                            <Boton variante="fantasma" onClick={() => setUsuarioActivo(u.id)}>
                              Usar
                            </Boton>
                          )}
                          <Boton variante="fantasma" onClick={() => setEditando(u)}>
                            Editar
                          </Boton>
                          <Boton variante="fantasma" className="text-red-600 hover:text-red-700 dark:text-red-400" onClick={() => setEliminando(u)}>
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
        titulo={editando === "nuevo" ? "Nuevo usuario" : "Editar usuario"}
      >
        {editando !== null && (
          <FormUsuario
            key={editando === "nuevo" ? "nuevo" : editando.id}
            usuario={editando === "nuevo" ? undefined : editando}
            onListo={() => setEditando(null)}
          />
        )}
      </Modal>

      <Confirmar
        abierto={eliminando !== null}
        titulo="Eliminar usuario"
        mensaje={
          <>
            ¿Eliminar a <strong className="text-zinc-900 dark:text-zinc-100">{eliminando?.nombre}</strong> ({eliminando?.correo})? También se
            eliminarán todos sus favoritos. Esta acción no se puede deshacer.
          </>
        }
        cargando={eliminar.isPending}
        onConfirmar={confirmarEliminar}
        onCerrar={() => setEliminando(null)}
      />
    </>
  );
}
