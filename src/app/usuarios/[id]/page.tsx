import type { Metadata } from "next";
import { Suspense } from "react";

import { Spinner } from "@/components/ui";
import DetalleUsuario from "./DetalleUsuario";

export const metadata: Metadata = { title: "Favoritos del usuario" };

// Con Cache Components el id es un dato de la petición: se lee dentro de
// <Suspense> (en DetalleUsuario, con useParams).
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Spinner className="size-6 text-zinc-400" />
        </div>
      }
    >
      <DetalleUsuario />
    </Suspense>
  );
}
