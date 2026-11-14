"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import { ApiError } from "@/lib/api";
import { ToastProvider } from "./Toasts";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Los datos se consideran frescos 30 s: navegar entre páginas
            // reutiliza la caché en lugar de volver a pedirlos.
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: true,
            // No reintentar errores del cliente (4xx); sí fallos de red o 5xx.
            retry: (intentos, error) => {
              if (error instanceof ApiError && error.status >= 400 && error.status < 500)
                return false;
              return intentos < 2;
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}
