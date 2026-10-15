# ADR 001 — Harness SDD ligero

Estado: aceptado para montaje por petición del usuario en esta sesión.

## Contexto
Frontend existente; backend objetivo Next.js API, PostgreSQL, Vercel. GPT-6 Astra con cuota limitada.
Los apuntes Días 1–3 proponen instrucciones/memoria breves, SDD spec-anchored y cuatro roles.

## Decisión
Usar OpenCode V2, cuatro perfiles con Astra medio, nueve comandos finos y cuatro skills bajo demanda.
Build es predeterminado para reducir llamadas en tareas pequeñas; coordinator se selecciona para SDD.
Specs y aprobaciones por revisión; una tarea por implementador, revisión final independiente y máximo dos rondas de corrección.
Una única memoria breve, con escritor designado. Estado actual y arquitectura objetivo documentados por separado.
MCP Context7 opcional desactivado. Verificación estructural local sin dependencias y CI reproducible.

## Consecuencias
Más trazabilidad y contexto dirigido; la delegación añade costo, por eso se limita al trabajo sustancial.
No hay garantía de ahorro porcentual; medir uso real y correcciones. Límites de pasos no son límites de gasto.
Versiones/servicios backend se aprobarán en un incremento propio; no instalar Prisma ni migrar frontend como efecto del harness.
