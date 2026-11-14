"use client";

import {
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

import { mensajeError } from "@/lib/api";

// ---------------------------------------------------------------------------
// Botón
// ---------------------------------------------------------------------------

type Variante = "primario" | "secundario" | "peligro" | "fantasma";

const variantes: Record<Variante, string> = {
  primario:
    "bg-violet-600 text-white hover:bg-violet-700 disabled:bg-violet-600/50",
  secundario:
    "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800",
  peligro: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-600/50",
  fantasma:
    "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
};

export function Boton({
  variante = "primario",
  cargando = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
  cargando?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled || cargando}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 disabled:cursor-not-allowed ${variantes[variante]} ${className}`}
      {...props}
    >
      {cargando && <Spinner />}
      {children}
    </button>
  );
}

export function Spinner({ className = "size-4" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
    />
  );
}

// ---------------------------------------------------------------------------
// Campo de formulario con error en línea
// ---------------------------------------------------------------------------

export function Campo({
  etiqueta,
  error,
  ayuda,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  etiqueta: string;
  error?: string;
  ayuda?: ReactNode;
}) {
  const id = useId();
  const idMensaje = `${id}-mensaje`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {etiqueta}
        {props.required && <span className="text-red-600"> *</span>}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error || ayuda ? idMensaje : undefined}
        className={`rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:ring-2 dark:bg-zinc-950 dark:text-zinc-100 ${
          error
            ? "border-red-500 focus:ring-red-500/30"
            : "border-zinc-300 focus:border-violet-500 focus:ring-violet-500/30 dark:border-zinc-700"
        }`}
        {...props}
      />
      {error ? (
        <p id={idMensaje} className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : ayuda ? (
        <p id={idMensaje} className="text-xs text-zinc-500">
          {ayuda}
        </p>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal (elemento <dialog> nativo: foco atrapado y Escape para cerrar)
// ---------------------------------------------------------------------------

export function Modal({
  abierto,
  onCerrar,
  titulo,
  children,
}: {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      onClose={onCerrar}
      onClick={(e) => e.target === ref.current && onCerrar()}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
    >
      {abierto && (
        <div className="p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <h2 className="text-lg font-semibold">{titulo}</h2>
            <button
              type="button"
              onClick={onCerrar}
              className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

export function Confirmar({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = "Eliminar",
  cargando,
  onConfirmar,
  onCerrar,
}: {
  abierto: boolean;
  titulo: string;
  mensaje: ReactNode;
  textoConfirmar?: string;
  cargando?: boolean;
  onConfirmar: () => void;
  onCerrar: () => void;
}) {
  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo={titulo}>
      <div className="text-sm text-zinc-600 dark:text-zinc-400">{mensaje}</div>
      <div className="mt-6 flex justify-end gap-2">
        <Boton variante="secundario" onClick={onCerrar} disabled={cargando}>
          Cancelar
        </Boton>
        <Boton variante="peligro" onClick={onConfirmar} cargando={cargando}>
          {textoConfirmar}
        </Boton>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Estados de carga / error / vacío
// ---------------------------------------------------------------------------

export function FilasCargando({ columnas, filas = 5 }: { columnas: number; filas?: number }) {
  return (
    <>
      {Array.from({ length: filas }, (_, i) => (
        <tr key={i} className="border-t border-zinc-100 dark:border-zinc-800">
          {Array.from({ length: columnas }, (_, j) => (
            <td key={j} className="px-4 py-3.5">
              <div className="h-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function EstadoError({
  error,
  onReintentar,
}: {
  error: unknown;
  onReintentar?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center dark:border-red-900/60 dark:bg-red-950/40"
    >
      <p className="font-medium text-red-800 dark:text-red-200">No se pudieron cargar los datos</p>
      <p className="max-w-md text-sm text-red-700 dark:text-red-300">{mensajeError(error)}</p>
      {onReintentar && (
        <Boton variante="secundario" onClick={onReintentar}>
          Reintentar
        </Boton>
      )}
    </div>
  );
}

export function Vacio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <p className="font-medium text-zinc-800 dark:text-zinc-200">{titulo}</p>
      {children && <div className="text-sm text-zinc-500">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Paginación
// ---------------------------------------------------------------------------

export const TAMAÑOS_PAGINA = [10, 20, 50];

export function Paginacion({
  offset,
  limit,
  total,
  onCambiar,
  onCambiarLimite,
  cargando,
}: {
  offset: number;
  limit: number;
  total: number;
  onCambiar: (offset: number) => void;
  onCambiarLimite?: (limit: number) => void;
  cargando?: boolean;
}) {
  const pagina = Math.floor(offset / limit) + 1;
  const paginas = Math.max(1, Math.ceil(total / limit));
  const desde = total === 0 ? 0 : offset + 1;
  const hasta = Math.min(offset + limit, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-zinc-200 px-4 py-3 text-sm sm:flex-row dark:border-zinc-800">
      <p className="text-zinc-500">
        {desde}–{hasta} de {total}
        {cargando && <Spinner className="ml-2 size-3 align-middle" />}
      </p>
      <div className="flex items-center gap-3">
        {onCambiarLimite && (
          <label className="flex items-center gap-2 text-zinc-500">
            Por página
            <select
              value={limit}
              onChange={(e) => onCambiarLimite(Number(e.target.value))}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              {TAMAÑOS_PAGINA.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="flex items-center gap-1">
          <Boton
            variante="secundario"
            onClick={() => onCambiar(Math.max(0, offset - limit))}
            disabled={pagina <= 1}
            aria-label="Página anterior"
          >
            ←
          </Boton>
          <span className="min-w-20 text-center tabular-nums text-zinc-600 dark:text-zinc-400">
            {pagina} / {paginas}
          </span>
          <Boton
            variante="secundario"
            onClick={() => onCambiar(offset + limit)}
            disabled={pagina >= paginas}
            aria-label="Página siguiente"
          >
            →
          </Boton>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contenedores
// ---------------------------------------------------------------------------

export function Encabezado({
  titulo,
  descripcion,
  acciones,
}: {
  titulo: string;
  descripcion?: ReactNode;
  acciones?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
        {descripcion && <p className="mt-1 text-sm text-zinc-500">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
    </div>
  );
}

export function Tarjeta({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 ${className}`}
    >
      {children}
    </div>
  );
}

export const th =
  "px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500";
export const td = "px-4 py-3 align-middle";
