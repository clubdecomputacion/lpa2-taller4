"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Tipo = "exito" | "error" | "info";

interface Toast {
  id: number;
  tipo: Tipo;
  mensaje: string;
}

interface ToastApi {
  exito: (mensaje: string) => void;
  error: (mensaje: string) => void;
  info: (mensaje: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const estilos: Record<Tipo, string> = {
  exito: "border-emerald-500/40 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  error: "border-red-500/40 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100",
  info: "border-zinc-400/40 bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100",
};

const iconos: Record<Tipo, string> = { exito: "✓", error: "!", info: "i" };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const siguienteId = useRef(1);

  const cerrar = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const mostrar = useCallback(
    (tipo: Tipo, mensaje: string) => {
      const id = siguienteId.current++;
      setToasts((t) => [...t.slice(-3), { id, tipo, mensaje }]);
      setTimeout(() => cerrar(id), tipo === "error" ? 7000 : 4000);
    },
    [cerrar],
  );

  const api = useMemo<ToastApi>(
    () => ({
      exito: (m) => mostrar("exito", m),
      error: (m) => mostrar("error", m),
      info: (m) => mostrar("info", m),
    }),
    [mostrar],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tipo === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${estilos[t.tipo]}`}
          >
            <span className="mt-px font-bold" aria-hidden>
              {iconos[t.tipo]}
            </span>
            <p className="flex-1">{t.mensaje}</p>
            <button
              type="button"
              onClick={() => cerrar(t.id)}
              className="opacity-60 hover:opacity-100"
              aria-label="Cerrar notificación"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}
