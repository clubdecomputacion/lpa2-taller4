"use client";

// "Usuario activo": el usuario con el que se marcan favoritos desde el
// catálogo de canciones. La API no tiene autenticación, así que se elige en
// la barra superior y se recuerda en localStorage (solo en este navegador).

import { useSyncExternalStore } from "react";

const CLAVE = "musica:usuario-activo";
const oyentes = new Set<() => void>();
/** Respaldo si localStorage no está disponible (modo privado, bloqueado). */
let memoria: number | null = null;

function leer(): number | null {
  try {
    const v = Number(localStorage.getItem(CLAVE));
    return Number.isInteger(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}

export function setUsuarioActivo(id: number | null) {
  try {
    if (id === null) localStorage.removeItem(CLAVE);
    else localStorage.setItem(CLAVE, String(id));
  } catch {
    // almacenamiento no disponible: solo dura esta sesión de la página
    memoria = id;
  }
  oyentes.forEach((o) => o());
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente);
  const alCambiarStorage = (e: StorageEvent) => e.key === CLAVE && oyente();
  window.addEventListener("storage", alCambiarStorage);
  return () => {
    oyentes.delete(oyente);
    window.removeEventListener("storage", alCambiarStorage);
  };
}

export function useUsuarioActivo(): number | null {
  return useSyncExternalStore(
    suscribir,
    () => leer() ?? memoria,
    () => null,
  );
}
