# Plan 001 — Harness SDD

Revisión de spec: 1
Estado: autorizado para montaje por petición del usuario.

## Archivos y responsabilidades
- AGENTS/MEMORY/constitución: entrada mínima y continuidad (RF-01, RF-04).
- docs/architecture.md y requirements/traceability.md: contexto actual/objetivo y fuentes (RF-01).
- .opencode/agents/: cuatro roles, permisos y entregas (RF-02, RF-03, RF-05).
- .opencode/commands/: nueve comandos sin shell interpolado (RF-06, RF-07).
- .opencode/skills/: SDD con plantillas, API, PostgreSQL y negocio (RF-07).
- opencode.jsonc: Astra, límites de salida, compactación y MCP desactivado (RNF-02).
- scripts/check-harness.mjs y check-environment.mjs: comprobaciones locales sin dependencias (RNF-03).
- .nvmrc, .npmrc, package.json/lock y workflow CI: instalación reproducible del estado actual.

## Decisiones
Build predeterminado; coordinator explícito. Astra medio en perfiles. Sin plugins ni llamadas LLM para validación rutinaria.
Context7 desactivado; se usa documentación oficial mediante herramientas existentes.
No agregar ORM ni framework backend mientras faltan decisiones de integración.

## Verificación
Validador estructural, entorno local, npm ci, unitarias, typecheck y build. Comprobar catálogo OpenCode sin generar llamadas al modelo si la CLI lo permite.
E2E no requerido por cambios documentales/configuración de agentes sin cambios funcionales de UI.
