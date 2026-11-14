"use client";

import { mensajeError } from "@/lib/api";
import { useAlternarFavorito } from "@/lib/queries";
import type { Cancion } from "@/lib/types";
import { useToast } from "./Toasts";
import { Spinner } from "./ui";

export default function BotonFavorito({
  cancion,
  idUsuario,
  marcado,
}: {
  cancion: Cancion;
  idUsuario: number;
  marcado: boolean;
}) {
  const toast = useToast();
  const alternar = useAlternarFavorito();

  const clic = () =>
    alternar.mutate(
      { idUsuario, idCancion: cancion.id, marcar: !marcado },
      {
        onSuccess: () =>
          toast.exito(marcado ? `"${cancion.titulo}" quitada de favoritos` : `"${cancion.titulo}" agregada a favoritos`),
        onError: (e) => toast.error(mensajeError(e)),
      },
    );

  return (
    <button
      type="button"
      onClick={clic}
      disabled={alternar.isPending}
      aria-pressed={marcado}
      aria-label={marcado ? `Quitar "${cancion.titulo}" de favoritos` : `Marcar "${cancion.titulo}" como favorita`}
      title={marcado ? "Quitar de favoritos" : "Marcar como favorita"}
      className={`grid size-8 place-items-center rounded-lg text-lg transition-colors disabled:opacity-60 ${
        marcado
          ? "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50"
          : "text-zinc-400 hover:bg-zinc-100 hover:text-rose-500 dark:hover:bg-zinc-800"
      }`}
    >
      {alternar.isPending ? <Spinner className="size-4" /> : marcado ? "♥" : "♡"}
    </button>
  );
}
