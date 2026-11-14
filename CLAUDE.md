# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Course workshop (lpa2-taller4): a Spanish-language frontend for the Music API built in lpa2-taller3, a FastAPI backend. The taller3 code lives next to this repo at `../../TALLER3_back/lpa2-taller3` and runs on `http://127.0.0.1:8000`. The top of `README.md` is the professor's assignment; leave it unchanged and add new material under "Implementación". `PROMPT.md` holds the endpoint JSON and the filled-in v0 prompt. Keep it in sync if the API contract changes. User-facing text and code identifiers are in Spanish.

## Commands

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build        # production build (also runs TypeScript checks)
pnpm start
pnpm lint         # ESLint (eslint-config-next)
pnpm exec tsc --noEmit   # needs a prior build/dev run: LayoutProps types are generated into .next/
```

There is no test suite. The API base URL comes from `NEXT_PUBLIC_API_URL` (see `.env.example`). It is inlined at build time, so restart `dev` or rebuild after changing it.

## Next.js 16 caveats

This is Next.js 16 with `cacheComponents` and `partialPrefetching` enabled in `next.config.ts`. APIs differ from older versions. Read `node_modules/next/dist/docs/` before using unfamiliar APIs (see `AGENTS.md`, which `next dev` regenerates). In particular:

- `useParams` on a dynamic route must be inside `<Suspense>`, as in `src/app/usuarios/[id]/page.tsx`.
- `useSearchParams` also needs a Suspense boundary. The pages avoid it and keep pagination and filters in React state.

## Architecture

All data fetching happens on the client. Each `page.tsx` is a thin server component (it exports `metadata`) that renders a `"use client"` component in the same folder.

- **`src/lib/api.ts`:** the single HTTP client.
  - Converts backend errors into `ApiError` (`status`, `message`, `campos`, `requestId`). The backend formats are `{"detail": str}` for 400/404, `{"detail": [{loc, msg, type}]}` for 422, and a 500 that includes `request_id`.
  - `status: 0` means the request never reached the API (server down, CORS or timeout).
  - DELETE returns 204 with no body.
  - `canciones.listar` switches to `/api/canciones/buscar` when any filter is set.
  - `todas()` pages through a whole listing in steps of `limit=100`, the backend's maximum. Selectors and name lookups use it.
- **`src/lib/queries.ts`:** TanStack Query hooks and the query keys `usuarios`, `canciones` and `favoritos`.
  - The backend cascades deletes, and a user's favorites embed song data, so mutations invalidate related groups as well. For example, deleting a song invalidates `canciones`, `usuarios` and `favoritos`. Preserve this when adding mutations.
  - Default query options (30 s stale time, no retry on 4xx) live in `src/components/Providers.tsx`.
- **`src/lib/validacion.ts`:** client-side validation that mirrors `musica_api/models.py` and `utils.py` in taller3 (email regex, length limits, year 1900 to current year, duration > 0). Update both sides together.
- **`src/components/useFormulario.ts`:** shared form state. A field's local error appears after blur or after a submit attempt. Server errors attach to fields through `ApiError.campos`, or through a regex on the message for the 400 "El correo ya está registrado".
- **`src/lib/usuarioActivo.ts`:** the "usuario activo" (there is no auth). It is a `localStorage` store read with `useSyncExternalStore`, with an in-memory fallback when storage is unavailable. It drives the ♡ buttons on the songs table.
- **`src/components/ui.tsx`:** shared primitives: `Boton`, `Campo`, `Modal` (native `<dialog>`), `Confirmar`, `Paginacion`, and the loading, empty and error states. The forms are lazy-loaded with `next/dynamic` when their modal opens.
- **Field name `año`:** the backend's song year field contains `ñ`. It is used as-is in the TypeScript types and in request bodies.
