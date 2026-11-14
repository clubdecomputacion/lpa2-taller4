# Frontend para el API de Música

## Descripción

En este taller generarás el frontend para el API de Música desarrollada en el lpa2-taller3 usando la herramienta [v0.app](https://v0.app/) y un *prompt* especializado.

## Prerrequisitos

- API del lpa2-taller3 funcionando localmente
- Node.js 18+ instalado
- Cuenta en [v0.app](https://v0.app)

## Preparar la información de tu API

Antes de usar el *prompt*, recopila esta información de tu API de Música, para cada *endpoint*:

```json
{
  "endpoint": "http://localhost:3000/api/tu-endpoint",
  "método": "GET/POST/PUT/DELETE",
  "body_request": {"clave": "valor"},
  "body_response": {"data": [], "message": "string"},
  "errores": {"400": "Bad Request", "500": "Server Error"}
}
```

## Usar el *Prompt* en v0.app

1. Accede a [v0.app](https://v0.app)
2. Copia y adapta el siguiente *prompt*:

    ---
    
    Eres un ingeniero de frontend senior especializado en React, TypeScript y Tailwind CSS. Tu tarea es diseñar interfaces web responsivas y eficientes que consuman APIs existentes.

    Crea un frontend web que interactúe con la siguiente API:  

    > pega el JSON con los detalles de tu API 

    Requisitos funcionales:  

    1. **Interfaz de usuario**:  

        - [ESPECIFICA: Diseño esperado (ej: formulario de login, dashboard de datos, tabla editable)]  
        - [ESPECIFICA: Estados de carga/éxito/error]  
        - [ESPECIFICA: Comportamientos interactivos (ej: validación en tiempo real, paginación)]

    2. **Lógica de integración**:  

        - Implementa manejo de errores robusto  
        - Optimiza el rendimiento (ej: caching, lazy loading)  
        - [ESPECIFICA: Validaciones de datos necesarias]

    ---

## Generar y Descargar el Código

1. Ejecuta el *prompt* en [v0.app](https://v0.app)
2. Revisa el *preview* y realiza los ajustes necesarios
3. Descarga el `ZIP` con la aplicación
4. Ve al proyecto: `cd proyectos/lpa2-taller4`
5. Descomprime el `ZIP` en este directorio
6. Configurar Node v20: `curl -sL https://deb.nodesource.com/setup_20.x | sudo -E bash -`
7. Instalar Node/NPM: `sudo apt install nodejs -y`
8. Instalar PNPM: `sudo npm install -g pnpm`
9. Instalar las dependencias del proyecto: `pnpm install`
10. Ejecutar en modo desarrollo: `pnpm dev`
11. Abrir la aplicación en: [localhost:3000](http://localhost:3000/)
12. Revisa y ajusta la configuración del API
13. Para ejecutar en modo producción: `pnpm build` y luego: `pnpm start`


---

## Implementación

El frontend se generó con **Claude Code** (el profesor permitió usar cualquier herramienta de IA). En [`PROMPT.md`](PROMPT.md) está el JSON con los *endpoints* de la API y el *prompt* completo, por si se quiere reproducir en v0.app.

**Tecnologías:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 y TanStack Query.

**Funcionalidades:**

- **Panel:** totales de usuarios, canciones y favoritos, y estado de la API (`/health`).
- **Canciones:** listado paginado, búsqueda por título, artista y género, y crear, editar y eliminar.
- **Usuarios:** listado paginado, crear, editar y eliminar, y página de detalle con sus favoritos.
- **Favoritos:** listado general, registrar y eliminar.
- **Usuario activo:** se elige en la barra superior y permite marcar favoritos con ♡ desde el catálogo.
- **Validación en tiempo real:** usa las mismas reglas que el backend y muestra los errores de la API (422 y 400) junto a cada campo.
- **Estados de la interfaz:** carga, vacío y error con reintento, y notificaciones de éxito.

### Requisitos

| Herramienta | Versión | Instalación en Windows |
|---|---|---|
| Git | cualquiera reciente | [git-scm.com](https://git-scm.com) o `winget install Git.Git` |
| Python | 3.12 o superior (para la API) | [python.org](https://www.python.org) o `winget install Python.Python.3.12` |
| Node.js | 20 o superior | [nodejs.org](https://nodejs.org) o `winget install OpenJS.NodeJS.LTS` |
| pnpm | 9 o superior | `npm install -g pnpm` (después de instalar Node) |

Para comprobar que quedaron instalados, en una terminal nueva:

```bash
git --version
python --version
node --version
pnpm --version
```

### Ejecutar en Windows

Se necesitan **dos terminales**: una para la API y otra para el frontend.

**1. Obtener el código** (si aún no se tiene):

```bash
git clone https://github.com/DerikHurt/lpa2-taller3.git
git clone https://github.com/DerikHurt/lpa2-taller4.git
```

**2. Levantar la API (terminal 1, en la carpeta `lpa2-taller3`):**

```bash
python -m venv venv                 # solo la primera vez
venv\Scripts\activate               # en PowerShell: venv\Scripts\Activate.ps1
pip install -r requirements.txt     # solo la primera vez
uvicorn main:app --reload
```

La API queda en [http://127.0.0.1:8000](http://127.0.0.1:8000) y su documentación en [/docs](http://127.0.0.1:8000/docs). Para comprobar que funciona, abrir [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health): debe responder `"status": "healthy"`.

**3. Levantar el frontend (terminal 2, en la carpeta `lpa2-taller4`):**

```bash
pnpm install    # solo la primera vez, o cuando cambie package.json
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000/). El indicador de la barra superior debe decir **API en línea**.

**4. Primeros datos:** si la base de datos está vacía, el panel lo indica. Se pueden crear usuarios y canciones desde la propia aplicación, o cargarlos con DBeaver como pide el Taller 3. Después, se elige un usuario en **Escuchando como…** para marcar favoritos.

### Otros comandos

| Comando | Para qué sirve |
|---|---|
| `pnpm build` y luego `pnpm start` | Compilar y ejecutar en modo producción |
| `pnpm lint` | Revisar el código con ESLint |
| `pnpm dev --port 3001` | Usar otro puerto si el 3000 está ocupado |

### Configuración

El frontend busca la API en `http://127.0.0.1:8000` por defecto. Si está en otra dirección, se copia `.env.example` como `.env.local` y se ajusta la variable:

```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

> **Importante:** Next.js lee esta variable al arrancar. Después de cambiarla hay que detener `pnpm dev` (Ctrl + C) y volver a ejecutarlo.

### Solución de problemas

| Síntoma | Causa probable y solución |
|---|---|
| «No se pudo conectar con la API en …» | La API no está corriendo o está en otro puerto. Levantarla (paso 2), revisar `/health` y pulsar **Reintentar**. |
| El mensaje muestra un puerto distinto al de la API | `NEXT_PUBLIC_API_URL` apunta a otra dirección, en `.env.local` o en una variable de la terminal. Corregirla y reiniciar `pnpm dev` desde una terminal nueva. |
| `pnpm` no se reconoce como comando | Falta instalarlo (`npm install -g pnpm`) o abrir una terminal nueva después de instalarlo. |
| `Port 3000 is in use` | Otro programa usa el puerto. Cerrarlo o ejecutar `pnpm dev --port 3001`. |
| PowerShell no deja ejecutar `Activate.ps1` | Usar `venv\Scripts\activate.bat` desde `cmd`, o ejecutar una vez `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`. |
| Las tablas aparecen vacías | La base de datos no tiene registros. Ver el paso 4. |
