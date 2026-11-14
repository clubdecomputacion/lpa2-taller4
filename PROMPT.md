# Prompt y especificación de la API

Este documento reúne la información que pide el taller para generar el frontend con una herramienta de IA:

1. el JSON con los detalles de cada *endpoint* de la API de Música (lpa2-taller3), y
2. el *prompt* sugerido por el profesor, con todos los campos `[ESPECIFICA: ...]` completos.

> El frontend de este repositorio se generó con **Claude Code** (el profesor permitió usar cualquier herramienta de IA). El *prompt* de abajo es el mismo que se puede pegar en [v0.app](https://v0.app), Lovable o Bolt para reproducir un resultado equivalente.

---

## 1. Detalles de la API

- **URL base:** `http://127.0.0.1:8000` (FastAPI + SQLModel)
- **CORS:** habilitado para cualquier origen; expone la cabecera `X-Request-ID`.
- **Paginación:** todos los listados aceptan `?offset=0&limit=20` (`limit` máximo 100) y responden con `{"items": [...], "total": N, "offset": 0, "limit": 20}`.
- **Fechas:** texto ISO 8601 en UTC.
- **Errores comunes a todos los *endpoints*:**
  - `404` y `400` → `{"detail": "mensaje"}`
  - `422` (validación) → `{"detail": [{"loc": ["body", "campo"], "msg": "...", "type": "..."}]}`
  - `500` → `{"detail": "Error interno del servidor", "request_id": "..."}`
- **`DELETE`** responde `204` sin cuerpo.

```json
[
  {
    "endpoint": "http://127.0.0.1:8000/health",
    "método": "GET",
    "body_request": null,
    "body_response": {"status": "healthy | degraded", "database": "ok", "uptime_segundos": 12.5, "python": "3.12.10", "sistema": "Windows"},
    "errores": {}
  },

  {
    "endpoint": "http://127.0.0.1:8000/api/usuarios?offset=0&limit=20",
    "método": "GET",
    "body_request": null,
    "body_response": {"items": [{"id": 1, "nombre": "Ana Gómez", "correo": "ana@correo.com", "fecha_registro": "2026-11-14T21:37:34Z"}], "total": 1, "offset": 0, "limit": 20},
    "errores": {"422": "offset/limit fuera de rango"}
  },
  {
    "endpoint": "http://127.0.0.1:8000/api/usuarios",
    "método": "POST",
    "body_request": {"nombre": "string (1-100)", "correo": "string (email válido, único, máx. 255)"},
    "body_response": {"id": 1, "nombre": "Ana Gómez", "correo": "ana@correo.com", "fecha_registro": "2026-11-14T21:37:34Z"},
    "errores": {"400": "El correo ya está registrado", "422": "Validación de campos"}
  },
  {
    "endpoint": "http://127.0.0.1:8000/api/usuarios/{id}",
    "método": "GET",
    "body_request": null,
    "body_response": {"id": 1, "nombre": "Ana Gómez", "correo": "ana@correo.com", "fecha_registro": "2026-11-14T21:37:34Z"},
    "errores": {"404": "Usuario no encontrado"}
  },
  {
    "endpoint": "http://127.0.0.1:8000/api/usuarios/{id}",
    "método": "PUT",
    "body_request": {"nombre": "string (opcional)", "correo": "string (opcional)"},
    "body_response": {"id": 1, "nombre": "Ana María Gómez", "correo": "ana@correo.com", "fecha_registro": "2026-11-14T21:37:34Z"},
    "errores": {"400": "El correo ya está registrado", "404": "Usuario no encontrado", "422": "Validación de campos"}
  },
  {
    "endpoint": "http://127.0.0.1:8000/api/usuarios/{id}",
    "método": "DELETE",
    "body_request": null,
    "body_response": "204 sin contenido (borra también sus favoritos)",
    "errores": {"404": "Usuario no encontrado"}
  },
  {
    "endpoint": "http://127.0.0.1:8000/api/usuarios/{id}/favoritos?offset=0&limit=20",
    "método": "GET",
    "body_request": null,
    "body_response": {"items": [{"id": 1, "id_usuario": 1, "id_cancion": 2, "fecha_marcado": "2026-11-14T21:40:00Z", "cancion": {"id": 2, "titulo": "La bicicleta", "artista": "Carlos Vives", "album": "Vives", "duracion": 229, "año": 2016, "genero": "Vallenato", "fecha_creacion": "2026-11-14T21:37:44Z"}}], "total": 1, "offset": 0, "limit": 20},
    "errores": {"404": "Usuario no encontrado"}
  },
  {
    "endpoint": "http://127.0.0.1:8000/api/usuarios/{id_usuario}/favoritos/{id_cancion}",
    "método": "POST",
    "body_request": null,
    "body_response": {"id": 1, "id_usuario": 1, "id_cancion": 2, "fecha_marcado": "2026-11-14T21:40:00Z"},
    "errores": {"400": "La canción ya está en favoritos del usuario", "404": "Usuario no encontrado | Canción no encontrada"}
  },
  {
    "endpoint": "http://127.0.0.1:8000/api/usuarios/{id_usuario}/favoritos/{id_cancion}",
    "método": "DELETE",
    "body_request": null,
    "body_response": "204 sin contenido",
    "errores": {"404": "Favorito no encontrado"}
  },

  {
    "endpoint": "http://127.0.0.1:8000/api/canciones?offset=0&limit=20",
    "método": "GET",
    "body_request": null,
    "body_response": {"items": [{"id": 1, "titulo": "Ojitos lindos", "artista": "Bad Bunny", "album": "Un verano sin ti", "duracion": 258, "año": 2022, "genero": "Reggaetón", "fecha_creacion": "2026-11-14T21:37:44Z"}], "total": 1, "offset": 0, "limit": 20},
    "errores": {"422": "offset/limit fuera de rango"}
  },
  {
    "endpoint": "http://127.0.0.1:8000/api/canciones/buscar?titulo=&artista=&genero=&offset=0&limit=20",
    "método": "GET",
    "body_request": null,
    "body_response": "Igual que el listado. Búsqueda parcial, sin distinguir mayúsculas; los filtros se combinan con AND.",
    "errores": {"422": "offset/limit fuera de rango"}
  },
  {
    "endpoint": "http://127.0.0.1:8000/api/canciones",
    "método": "POST",
    "body_request": {"titulo": "string (1-200)", "artista": "string (1-200)", "album": "string | null (máx. 200)", "duracion": "int > 0 (segundos)", "año": "int (1900 - año actual)", "genero": "string (1-50)"},
    "body_response": {"id": 1, "titulo": "Ojitos lindos", "artista": "Bad Bunny", "album": "Un verano sin ti", "duracion": 258, "año": 2022, "genero": "Reggaetón", "fecha_creacion": "2026-11-14T21:37:44Z"},
    "errores": {"422": "Validación de campos"}
  },
  {
    "endpoint": "http://127.0.0.1:8000/api/canciones/{id}",
    "método": "GET",
    "body_request": null,
    "body_response": {"id": 1, "titulo": "Ojitos lindos", "artista": "Bad Bunny", "album": "Un verano sin ti", "duracion": 258, "año": 2022, "genero": "Reggaetón", "fecha_creacion": "2026-11-14T21:37:44Z"},
    "errores": {"404": "Canción no encontrada"}
  },
  {
    "endpoint": "http://127.0.0.1:8000/api/canciones/{id}",
    "método": "PUT",
    "body_request": {"titulo": "opcional", "artista": "opcional", "album": "opcional", "duracion": "opcional", "año": "opcional", "genero": "opcional"},
    "body_response": "La canción actualizada",
    "errores": {"404": "Canción no encontrada", "422": "Validación de campos"}
  },
  {
    "endpoint": "http://127.0.0.1:8000/api/canciones/{id}",
    "método": "DELETE",
    "body_request": null,
    "body_response": "204 sin contenido (borra también los favoritos que la incluyen)",
    "errores": {"404": "Canción no encontrada"}
  },

  {
    "endpoint": "http://127.0.0.1:8000/api/favoritos?offset=0&limit=20",
    "método": "GET",
    "body_request": null,
    "body_response": {"items": [{"id": 1, "id_usuario": 1, "id_cancion": 2, "fecha_marcado": "2026-11-14T21:40:00Z"}], "total": 1, "offset": 0, "limit": 20},
    "errores": {"422": "offset/limit fuera de rango"}
  },
  {
    "endpoint": "http://127.0.0.1:8000/api/favoritos",
    "método": "POST",
    "body_request": {"id_usuario": 1, "id_cancion": 2},
    "body_response": {"id": 1, "id_usuario": 1, "id_cancion": 2, "fecha_marcado": "2026-11-14T21:40:00Z"},
    "errores": {"400": "La canción ya está en favoritos del usuario", "404": "Usuario no encontrado | Canción no encontrada", "422": "Validación de campos"}
  },
  {
    "endpoint": "http://127.0.0.1:8000/api/favoritos/{id}",
    "método": "GET",
    "body_request": null,
    "body_response": {"id": 1, "id_usuario": 1, "id_cancion": 2, "fecha_marcado": "2026-11-14T21:40:00Z"},
    "errores": {"404": "Favorito no encontrado"}
  },
  {
    "endpoint": "http://127.0.0.1:8000/api/favoritos/{id}",
    "método": "DELETE",
    "body_request": null,
    "body_response": "204 sin contenido",
    "errores": {"404": "Favorito no encontrado"}
  }
]
```

---

## 2. Prompt completo

Eres un ingeniero de frontend senior especializado en React, TypeScript y Tailwind CSS. Tu tarea es diseñar interfaces web responsivas y eficientes que consuman APIs existentes.

Crea un frontend web que interactúe con la siguiente API:

> *(pega aquí el JSON de la sección 1, junto con las notas de URL base, paginación y formatos de error)*

Requisitos funcionales:

1. **Interfaz de usuario**:

    - **Diseño esperado:** aplicación Next.js (App Router) en español con barra de navegación superior y cuatro secciones:
      - **Panel:** tarjetas con el total de usuarios, canciones y favoritos, y el estado del servicio leído de `/health` (API, base de datos, tiempo activo).
      - **Canciones:** tabla paginada con título, artista, álbum, género, año y duración en formato `mm:ss`; tres buscadores (título, artista, género) que usan `/api/canciones/buscar`; botones para agregar, editar y eliminar en modales.
      - **Usuarios:** tabla paginada con nombre, correo y fecha de registro; crear, editar y eliminar; enlace a la página de detalle de cada usuario.
      - **Detalle de usuario** (`/usuarios/[id]`): datos del usuario y sus canciones favoritas (con los datos de la canción), un selector para agregar una canción a favoritos y un botón para quitarla.
      - **Favoritos:** listado paginado de todos los favoritos mostrando el nombre del usuario y el título de la canción, con un formulario (usuario + canción) para registrar uno nuevo y opción de eliminar.
      - **Usuario activo:** un selector en la barra superior ("Escuchando como…") que se recuerda en `localStorage`; con un usuario activo, la tabla de canciones muestra un botón ♡/♥ para marcar o quitar favoritos.
      - Indicador de estado de la API (en línea / degradada / sin conexión) en la barra superior; modo claro y oscuro según el sistema; diseño adaptable a móvil.
    - **Estados de carga/éxito/error:**
      - Carga: filas esqueleto en las tablas y *spinner* en los botones mientras se envía.
      - Éxito: notificaciones *toast* ("Canción agregada", "Usuario eliminado", etc.).
      - Error: bloque con el mensaje y botón "Reintentar" cuando falla una consulta; mensaje específico si la API no responde ("No se pudo conectar con la API… ¿Está en ejecución?"); en errores 500 mostrar el `request_id`.
      - Vacío: mensajes guía cuando no hay datos o la búsqueda no tiene resultados.
    - **Comportamientos interactivos:**
      - Paginación con `offset`/`limit` usando el `total` de la respuesta (anterior/siguiente, página X de Y, selector de 10/20/50 por página).
      - Búsqueda con *debounce* (350 ms) que vuelve a la primera página.
      - Validación en tiempo real en los formularios: el error de un campo aparece al salir de él o al enviar, y se actualiza mientras se escribe.
      - Confirmación antes de eliminar, avisando que se borran en cascada los favoritos.
      - La duración se puede escribir como segundos (`225`) o `mm:ss` (`3:45`).

2. **Lógica de integración**:

    - Implementa manejo de errores robusto: un cliente HTTP único con *timeout* de 10 s que convierta las respuestas en un `ApiError` con `status`, mensaje, errores por campo (del `422`) y `request_id`; mostrar los errores `422` junto a cada campo del formulario y el `400` "El correo ya está registrado" en el campo correo; tratar el `204` de `DELETE` como respuesta sin cuerpo.
    - Optimiza el rendimiento: TanStack Query para caché (datos frescos 30 s), deduplicación de peticiones, conservar la página anterior al paginar e invalidar las consultas relacionadas tras cada cambio (por ejemplo, borrar una canción invalida canciones, favoritos y usuarios); los formularios se cargan con `next/dynamic` (*lazy loading*) solo al abrir el modal; no reintentar errores 4xx.
    - **Validaciones de datos necesarias** (las mismas que el backend):
      - Usuario: `nombre` obligatorio, 1–100 caracteres; `correo` obligatorio, formato de correo válido, máximo 255, se envía en minúsculas.
      - Canción: `titulo` y `artista` obligatorios, 1–200; `album` opcional, máximo 200 (vacío se envía como `null`); `duracion` entero mayor que 0 (en segundos); `año` entero de 4 dígitos entre 1900 y el año actual; `genero` obligatorio, 1–50.
      - Favorito: usuario y canción obligatorios; no permitir repetir una canción en los favoritos del mismo usuario.
    - La URL de la API debe configurarse con la variable de entorno `NEXT_PUBLIC_API_URL` (por defecto `http://127.0.0.1:8000`).
