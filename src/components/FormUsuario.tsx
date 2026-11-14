"use client";

import { useGuardarUsuario } from "@/lib/queries";
import type { Usuario } from "@/lib/types";
import { validarUsuario } from "@/lib/validacion";
import { useToast } from "./Toasts";
import { Boton, Campo } from "./ui";
import { useFormulario } from "./useFormulario";

export default function FormUsuario({
  usuario,
  onListo,
}: {
  usuario?: Usuario;
  onListo: () => void;
}) {
  const toast = useToast();
  const guardar = useGuardarUsuario();
  const f = useFormulario(
    { nombre: usuario?.nombre ?? "", correo: usuario?.correo ?? "" },
    validarUsuario,
  );

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.intentarEnviar()) return;
    const datos = {
      nombre: f.valores.nombre.trim(),
      correo: f.valores.correo.trim().toLowerCase(),
    };
    guardar.mutate(
      { id: usuario?.id, datos },
      {
        onSuccess: (u) => {
          toast.exito(usuario ? `Usuario "${u.nombre}" actualizado` : `Usuario "${u.nombre}" creado`);
          onListo();
        },
        onError: (err) => f.aplicarErrorServidor(err, { correo: /correo/i }),
      },
    );
  };

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <Campo etiqueta="Nombre" required autoFocus maxLength={100} {...f.props("nombre")} />
      <Campo
        etiqueta="Correo electrónico"
        type="email"
        required
        autoComplete="email"
        placeholder="nombre@correo.com"
        {...f.props("correo")}
      />
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
          {usuario ? "Guardar cambios" : "Crear usuario"}
        </Boton>
      </div>
    </form>
  );
}
