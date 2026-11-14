/** 225 -> "3:45" */
export function formatearDuracion(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const formatoFecha = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
});

/** El backend guarda UTC; si la fecha llega sin zona, se interpreta como UTC. */
export function formatearFecha(iso: string): string {
  const conZona = /[zZ]|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : `${iso}Z`;
  const d = new Date(conZona);
  return Number.isNaN(d.getTime()) ? iso : formatoFecha.format(d);
}

export function formatearUptime(segundos: number): string {
  const s = Math.floor(segundos);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h} h ${m} min`;
  if (m > 0) return `${m} min ${s % 60} s`;
  return `${s} s`;
}
