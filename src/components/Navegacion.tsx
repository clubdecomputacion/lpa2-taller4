"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { useHealth, useTodosLosUsuarios } from "@/lib/queries";
import { setUsuarioActivo, useUsuarioActivo } from "@/lib/usuarioActivo";

const enlaces = [
  { href: "/", texto: "Inicio" },
  { href: "/canciones", texto: "Canciones" },
  { href: "/usuarios", texto: "Usuarios" },
  { href: "/favoritos", texto: "Favoritos" },
];

function EstadoApi() {
  const { data, isError, isPending } = useHealth();
  const [color, texto] = isPending
    ? ["bg-zinc-400", "Conectando…"]
    : isError
      ? ["bg-red-500", "API sin conexión"]
      : data.status === "healthy"
        ? ["bg-emerald-500", "API en línea"]
        : ["bg-amber-500", "API degradada"];
  return (
    <span className="flex items-center gap-2 text-xs text-zinc-500" title={texto}>
      <span className={`size-2 rounded-full ${color}`} aria-hidden />
      <span className="hidden lg:inline">{texto}</span>
    </span>
  );
}

function SelectorUsuario() {
  const activo = useUsuarioActivo();
  const { data: usuarios, isPending } = useTodosLosUsuarios();

  // Si el usuario guardado ya no existe (fue eliminado), se limpia.
  useEffect(() => {
    if (usuarios && activo !== null && !usuarios.some((u) => u.id === activo)) {
      setUsuarioActivo(null);
    }
  }, [usuarios, activo]);

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="hidden text-zinc-500 sm:inline">Escuchando como</span>
      <select
        value={activo ?? ""}
        onChange={(e) => setUsuarioActivo(e.target.value ? Number(e.target.value) : null)}
        disabled={isPending || !usuarios?.length}
        className="max-w-40 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        aria-label="Usuario activo para marcar favoritos"
      >
        <option value="">{usuarios?.length ? "Elige un usuario" : "Sin usuarios"}</option>
        {usuarios?.map((u) => (
          <option key={u.id} value={u.id}>
            {u.nombre}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function Navegacion() {
  const ruta = usePathname();
  const activa = (href: string) => (href === "/" ? ruta === "/" : ruta.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/85 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/85">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid size-7 place-items-center rounded-lg bg-violet-600 text-sm text-white" aria-hidden>
            ♪
          </span>
          Música
        </Link>
        <nav className="order-last -mx-1 flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto">
          {enlaces.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              aria-current={activa(e.href) ? "page" : undefined}
              className={`rounded-lg px-3 py-1.5 text-sm whitespace-nowrap transition-colors ${
                activa(e.href)
                  ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {e.texto}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <EstadoApi />
          <SelectorUsuario />
        </div>
      </div>
    </header>
  );
}
