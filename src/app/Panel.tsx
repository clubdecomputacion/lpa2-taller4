"use client";

import Link from "next/link";

import { Encabezado, EstadoError, Spinner, Tarjeta } from "@/components/ui";
import { API_URL, mensajeError } from "@/lib/api";
import { formatearUptime } from "@/lib/formato";
import { useCanciones, useFavoritos, useHealth, useUsuarios } from "@/lib/queries";

function Total({
  titulo,
  href,
  total,
  cargando,
  error,
}: {
  titulo: string;
  href: string;
  total?: number;
  cargando: boolean;
  error: boolean;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-violet-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-violet-600"
    >
      <p className="text-sm text-zinc-500">{titulo}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums">
        {cargando ? <Spinner className="size-6 text-zinc-400" /> : error ? "—" : total}
      </p>
      <p className="mt-3 text-xs text-violet-600 group-hover:underline dark:text-violet-400">
        Ver {titulo.toLowerCase()} →
      </p>
    </Link>
  );
}

export default function Panel() {
  const health = useHealth();
  // limit=1: solo interesa el total de cada listado
  const usuarios = useUsuarios(0, 1);
  const canciones = useCanciones(0, 1, {});
  const favoritos = useFavoritos(0, 1);

  const vacio = usuarios.data?.total === 0 && canciones.data?.total === 0;

  return (
    <>
      <Encabezado
        titulo="Panel"
        descripcion={
          <>
            Conectado a <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-800">{API_URL}</code>
          </>
        }
      />

      {health.isError ? (
        <EstadoError error={health.error} onReintentar={() => health.refetch()} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Total titulo="Usuarios" href="/usuarios" total={usuarios.data?.total} cargando={usuarios.isPending} error={usuarios.isError} />
            <Total titulo="Canciones" href="/canciones" total={canciones.data?.total} cargando={canciones.isPending} error={canciones.isError} />
            <Total titulo="Favoritos" href="/favoritos" total={favoritos.data?.total} cargando={favoritos.isPending} error={favoritos.isError} />
          </div>

          {vacio && (
            <Tarjeta className="mt-6 p-5">
              <p className="font-medium">La base de datos está vacía</p>
              <p className="mt-1 text-sm text-zinc-500">
                Empieza <Link href="/usuarios" className="text-violet-600 underline dark:text-violet-400">creando un usuario</Link> y{" "}
                <Link href="/canciones" className="text-violet-600 underline dark:text-violet-400">agregando canciones</Link>; luego elige el
                usuario en la barra superior para marcar favoritos.
              </p>
            </Tarjeta>
          )}

          <Tarjeta className="mt-6">
            <div className="border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
              <h2 className="font-medium">Estado del servicio</h2>
            </div>
            {health.isPending ? (
              <div className="flex items-center gap-2 px-5 py-4 text-sm text-zinc-500">
                <Spinner /> Consultando /health…
              </div>
            ) : (
              <dl className="grid grid-cols-2 gap-4 px-5 py-4 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-zinc-500">API</dt>
                  <dd className={health.data.status === "healthy" ? "font-medium text-emerald-600" : "font-medium text-amber-600"}>
                    {health.data.status === "healthy" ? "En línea" : "Degradada"}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Base de datos</dt>
                  <dd className="font-medium">{health.data.database === "ok" ? "OK" : health.data.database}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Tiempo activo</dt>
                  <dd className="font-medium tabular-nums">{formatearUptime(health.data.uptime_segundos)}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Servidor</dt>
                  <dd className="font-medium">
                    Python {health.data.python} · {health.data.sistema}
                  </dd>
                </div>
              </dl>
            )}
            {(usuarios.isError || canciones.isError) && (
              <p className="border-t border-zinc-200 px-5 py-3 text-sm text-red-600 dark:border-zinc-800">
                {mensajeError(usuarios.error ?? canciones.error)}
              </p>
            )}
          </Tarjeta>
        </>
      )}
    </>
  );
}
