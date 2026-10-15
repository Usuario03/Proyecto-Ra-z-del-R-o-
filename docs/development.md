# Entorno de desarrollo

## Versiones de referencia
- Node.js **24.14.1** (`.nvmrc`): versión observada en el equipo y fijada para CI.
- npm **11.11.0** (`packageManager`): versión de referencia de instalación.
- OpenCode **2.0.27**: versión observada durante el montaje; configuración V2.
- Dependencias actuales: `package.json` y `package-lock.json`. `npm ci` instala el árbol bloqueado.
- `.npmrc` guarda nuevas dependencias con versión exacta y comprueba engines. Actualizaciones en cambios dedicados.

## Inicio
Selecciona Node 24.14.1 con tu gestor de versiones (en Windows, el gestor debe instalarse previamente).
`.nvmrc` declara la versión, no instala ni cambia Node por sí solo.

```sh
npm ci
npm run env:check
npm run harness:check
npm test
npm run typecheck
npm run build
npm run dev:next
```

Para navegador: `npx playwright install chromium` y después `npm run test:e2e`.
`npm run dev` conserva Vite; `dev:next` inicia Next. `build` ejecuta `next build` y `preview` ejecuta `next start` (requiere build previo). Playwright inicia build/preview Next sin reutilizar un servidor previo.
El prototipo actual no requiere variables de entorno. No introducir credenciales de servicios futuros.

## Próximo incremento: backend
Next 16.4.0 / React 19.3.0 están declarados y el shell cliente implementado; negocio/auth siguen en localStorage. T01 permanece BLOQUEADA hasta reproducción limpia y revisión conjunta del harness integrado.
Objetivo aprobado condicionado: Prisma 7, Better Auth en app y Supabase Free DB/fotos; sin Supabase Auth, Docker ni PostgreSQL local. Estas dependencias backend no están implementadas.
G1/H2 sigue BLOQUEADA: no conectar, migrar, sembrar ni limpiar por esta guía. La matriz operación/destino/rol/autorización requiere aclaración; no se redefine aquí. Pruebas backend solo aisladas en dev, nunca destructivas en demo.
Prioridad autorizada: versionar el harness existente en commit separado, continuidad MEMORY/spec002 en otro, reproducción limpia, revisión y push normal. Procedimiento y pendientes: spec 002, tarea VCS-01; esto no inicia backend ni cierra spec 001.

## Uso diario del harness
1. Abre OpenCode en la raíz y selecciona `coordinator` en el selector de agentes.
2. Pide: «Consulta el estado de la spec 001 y guía el siguiente incremento con SDD».
3. Usa `/sdd-status 001-harness` para retomar con poco contexto.
4. Para la migración existente: `/sdd-status 002-migracion-fullstack`; no crear otra spec 002.
5. Respetar aprobaciones y bloqueos de la revisión activa antes de implementar una tarea.
6. `/sdd-validate 002-migracion-fullstack` solicita validación; no declara cierre ni levanta T01/G1 por sí solo.

Los comandos y agentes se descubren desde `.opencode/`; si la sesión no muestra cambios, abre una sesión nueva o recarga configuración.
Las sesiones existentes conservan modelo/agente seleccionados. Elige Astra medio para trabajo habitual.
Los comandos no ejecutan shell al expandirse. Sus agentes leen explícitamente los archivos necesarios.
Context7 está desactivado para evitar conexiones y contexto innecesarios. Activarlo es opcional y puede requerir autenticación.
