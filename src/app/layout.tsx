import type { Metadata } from "next";
import { Suspense } from "react";

import Navegacion from "@/components/Navegacion";
import Providers from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Música", template: "%s · Música" },
  description: "Frontend de la API de Música: usuarios, canciones y favoritos",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <Providers>
          <Suspense>
            <Navegacion />
          </Suspense>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
          <footer className="border-t border-zinc-200 py-4 text-center text-xs text-zinc-500 dark:border-zinc-800">
            LPA2 · Taller 4 — Frontend de la API de Música
          </footer>
        </Providers>
      </body>
    </html>
  );
}
