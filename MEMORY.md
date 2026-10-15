# Memoria — Raíz del Río

## Estado actual
- Shell Next 16.4.0 / React 19.3.0 implementado; negocio/auth demo localStorage V4, sin backend compartido.
- T01 sigue BLOQUEADA por revisión, dos rondas agotadas; VCS-01 separada no la acepta automáticamente.
- Spec 001 abierta; spec 002 R4/P3/T3, registro V6. Ninguna T01–T31 hecha.
- Node 24.14.1/npm 11.11.0 comprobados Windows; OpenCode 2.0.27 observado previamente.

## Decisiones y bloqueos
- SDD spec-anchored/EARS; una tarea por implementador, escritor único, sin delegación recursiva.
- R3/P2/T2 e I1–I5 aprobados 2026-10-14 sujetos a revisión; delta R4 remoto/navegador autorizado, no aprobación operativa global.
- D1/D2/D4 aprobadas; no repetir. Nuevos contratos vuelven al usuario/spec/plan.
- Objetivo: Prisma 7, Better Auth en app, Supabase Free DB/fotos, Vercel Hobby académico personal no comercial.
- Sin Docker/PostgreSQL local; dev/demo creados según usuario, conexión no verificada; secretos fuera del chat.
- Datos ficticios sin importar credenciales; simulación sin cobros, recursos gratuitos. ORM/auth aún no instalados.
- G1/T02 BLOQUEADAS H2 RNF-03/05: aclarar matriz operación/destino/rol/autorización, veto test destructivo demo vs migración operativa autorizable.
- Sin conexión, DDL, semilla, limpieza ni despliegue implícitos; ERS y condiciones Hobby pendientes.
- Reviewer anterior ses_ec1c7c277ffe1p116OGM3cToqn: H1 T01 reproducibilidad; historial íntegro en validation V5/V6, no aceptación actual.

## VCS-01 — 2026-10-15
- IMPLEMENTADA pendiente reviewer conjunto, push y CI Linux; casilla abierta. Autorización: primero versionar Git, después resto.
- Commit T01 06c281edfade51ed0c62d04342ea34755246a9e7 preservado.
- Commit harness 69ea40071e2f30ed4a70d17d51bfd456ee252589: 42 archivos +864/-17; continuidad separada MEMORY + cuatro documentos 002.
- AGENTS/README alineados; docs deployment/traceability corregidos: Next genera dist/next, Netlify es legado, dev Vite/dev:next Next.
- Fetch origin ejecutado: main ahead1/behind0 inicial; único remoto GitHub Usuario03/Proyecto-Ra-z-del-R-o-. Sin merge/rebase/force/push.
- Candidata aislada: archive de 06c281e + 47 rutas explícitas en %LOCALAPPDATA%/Temp/opencode/vcs01-candidate-20261015; sin env/artefactos/dependencias copiados.
- Secuencia CI ejecutada Windows: npm ci → env:check → harness:check → npm test 40/40 → typecheck → build; todo exit 0.
- Rutas generadas next-env ausentes antes del build; typecheck pasó. next-env dev del working tree preservado/excluido, sin corrección necesaria.
- npm run test:e2e: 48/48 (1.6m), Chromium escritorio/móvil/axe, servidor Next propio; sin backend/DB.
- Audit producción 0; audit completo exit1, 7 (2 moderate/5 high) toolchain; riesgo DoS patrones/CSS no confiables, sin fix/major.
- Scan de patrones secretos en 47 candidatos: 0 señalados; no garantía exhaustiva. Diff/check staging OK; warnings LF→CRLF.
- Evidencia detallada propia en tasks002 VCS-01; spec001 y validation conservan procedencia histórica, no cierre inventado.
- NO VERIFICADO: Linux/CI (push retenido hasta reviewer), teclado manual adicional, runtime permisos/modelos/MCP.
- Próximo paso exclusivo: reviewer del conjunto contra 2e892da, luego decisión/push normal autorizado; no iniciar backend ni levantar G1.
