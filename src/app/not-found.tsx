import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <p className="text-5xl font-semibold text-zinc-300 dark:text-zinc-700">404</p>
      <h1 className="text-lg font-medium">Página no encontrada</h1>
      <Link href="/" className="text-sm text-violet-600 underline dark:text-violet-400">
        Volver al inicio
      </Link>
    </div>
  );
}
