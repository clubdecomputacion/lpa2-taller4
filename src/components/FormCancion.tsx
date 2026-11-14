"use client";

import { formatearDuracion } from "@/lib/formato";
import { useGuardarCancion } from "@/lib/queries";
import type { Cancion } from "@/lib/types";
import { AÑO_MINIMO, añoActual, parsearDuracion, validarCancion } from "@/lib/validacion";
import { useToast } from "./Toasts";
import { Boton, Campo } from "./ui";
import { useFormulario } from "./useFormulario";

export default function FormCancion({
  cancion,
  onListo,
}: {
  cancion?: Cancion;
  onListo: () => void;
}) {
  const toast = useToast();
  const guardar = useGuardarCancion();
  const f = useFormulario(
    {
      titulo: cancion?.titulo ?? "",
      artista: cancion?.artista ?? "",
      album: cancion?.album ?? "",
      duracion: cancion ? formatearDuracion(cancion.duracion) : "",
      año: cancion ? String(cancion.año) : "",
      genero: cancion?.genero ?? "",
    },
    validarCancion,
  );

  const segundos = parsearDuracion(f.valores.duracion);

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.intentarEnviar()) return;
    const datos = {
      titulo: f.valores.titulo.trim(),
      artista: f.valores.artista.trim(),
      album: f.valores.album.trim() || null,
      duracion: segundos!,
      año: Number(f.valores.año),
      genero: f.valores.genero.trim(),
    };
    guardar.mutate(
      { id: cancion?.id, datos },
      {
        onSuccess: (c) => {
          toast.exito(cancion ? `"${c.titulo}" actualizada` : `"${c.titulo}" agregada al catálogo`);
          onListo();
        },
        onError: (err) => f.aplicarErrorServidor(err),
      },
    );
  };

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <Campo etiqueta="Título" required autoFocus maxLength={200} {...f.props("titulo")} />
      <Campo etiqueta="Artista" required maxLength={200} {...f.props("artista")} />
      <Campo etiqueta="Álbum" maxLength={200} ayuda="Opcional" {...f.props("album")} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Campo
          etiqueta="Duración"
          required
          inputMode="numeric"
          placeholder="3:45"
          ayuda={
            segundos && segundos > 0
              ? `${formatearDuracion(segundos)} · ${segundos} s`
              : "mm:ss o segundos"
          }
          {...f.props("duracion")}
        />
        <Campo
          etiqueta="Año"
          required
          inputMode="numeric"
          maxLength={4}
          placeholder={String(añoActual())}
          ayuda={`${AÑO_MINIMO}–${añoActual()}`}
          {...f.props("año")}
        />
        <Campo etiqueta="Género" required maxLength={50} list="generos" {...f.props("genero")} />
        <datalist id="generos">
          {["Pop", "Rock", "Salsa", "Reggaetón", "Vallenato", "Jazz", "Electrónica", "Hip Hop", "Clásica", "Balada"].map(
            (g) => (
              <option key={g} value={g} />
            ),
          )}
        </datalist>
      </div>
      {f.errorGeneral && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
          {f.errorGeneral}
        </p>
      )}
      <div className="mt-2 flex justify-end gap-2">
        <Boton variante="secundario" onClick={onListo} disabled={guardar.isPending}>
          Cancelar
        </Boton>
        <Boton type="submit" cargando={guardar.isPending}>
          {cancion ? "Guardar cambios" : "Agregar canción"}
        </Boton>
      </div>
    </form>
  );
}
