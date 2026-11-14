"use client";

import { useState } from "react";

import { ApiError, mensajeError } from "@/lib/api";
import { sinErrores, type Errores } from "@/lib/validacion";

/**
 * Estado de un formulario con validación en tiempo real:
 * - los errores de un campo aparecen al salir de él (blur) o al intentar enviar,
 *   y se recalculan mientras se escribe;
 * - los errores del servidor (422 por campo, o 400 de correo repetido) se
 *   muestran junto al campo correspondiente hasta que el usuario lo edite.
 */
export function useFormulario<F extends Record<string, string>>(
  inicial: F,
  validar: (f: F) => Errores<Extract<keyof F, string>>,
) {
  type K = Extract<keyof F, string>;
  const [valores, setValores] = useState<F>(inicial);
  const [tocados, setTocados] = useState<Partial<Record<K, boolean>>>({});
  const [enviado, setEnviado] = useState(false);
  const [erroresServidor, setErroresServidor] = useState<Errores<K>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const erroresLocales = validar(valores);
  const visible = (k: K) => enviado || tocados[k];

  const error = (k: K): string | undefined =>
    erroresServidor[k] ?? (visible(k) ? erroresLocales[k] : undefined);

  const props = (k: K) => ({
    name: k,
    value: valores[k],
    error: error(k),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setValores((prev) => ({ ...prev, [k]: v }));
      setErroresServidor((prev) => {
        if (!(k in prev)) return prev;
        const copia = { ...prev };
        delete copia[k];
        return copia;
      });
    },
    onBlur: () => setTocados((t) => ({ ...t, [k]: true })),
  });

  /** Marca el envío; devuelve true si se puede enviar. */
  const intentarEnviar = () => {
    setEnviado(true);
    setErrorGeneral(null);
    return sinErrores(erroresLocales);
  };

  /** Reparte un error del servidor entre los campos y el mensaje general. */
  const aplicarErrorServidor = (e: unknown, campoPorMensaje?: Partial<Record<K, RegExp>>) => {
    if (e instanceof ApiError) {
      const porCampo: Errores<K> = {};
      for (const [campo, msg] of Object.entries(e.campos)) {
        if (campo in valores) porCampo[campo as K] = msg;
      }
      for (const [campo, patron] of Object.entries(campoPorMensaje ?? {}) as [K, RegExp][]) {
        if (patron.test(e.message)) porCampo[campo] = e.message;
      }
      if (Object.keys(porCampo).length > 0) {
        setErroresServidor(porCampo);
        return;
      }
    }
    setErrorGeneral(mensajeError(e));
  };

  return {
    valores,
    props,
    intentarEnviar,
    aplicarErrorServidor,
    errorGeneral,
    valido: sinErrores(erroresLocales),
  };
}
