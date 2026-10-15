# Memoria — Raíz del Río

## Estado actual — 2026-10-15
- Shell Next 16.4.0 / React 19.3.0; negocio/auth demo localStorage V4, sin backend compartido.
- T01: H1 RNF-MIG-07 RESUELTO por revisión conjunta VCS-01, no aceptación del commit aislado ni cierre global.
- Spec 001 abierta; spec 002 R4/P3/T3, registro V7. T01–T31 sin casillas hechas en este cierre acotado.
- Windows Node 24.14.1/npm 11.11.0 comprobados por reviewer; OpenCode 2.0.27 observado previamente.

## Decisiones y bloqueos
- SDD/EARS, una tarea por implementador, escritor único; sin delegación recursiva.
- R3/P2/T2 e I1–I5 aprobados 2026-10-14 sujetos a revisión; delta R4 autorizado, no aprobación operativa global.
- D1/D2/D4 y autorización VCS-01 resueltas: no repetir preguntas.
- Objetivo: Prisma 7, Better Auth en app, Supabase Free DB/fotos, Vercel Hobby académico personal no comercial.
- Sin Docker/PostgreSQL local; dev/demo creados según usuario, conexión no verificada; secretos fuera del chat.
- Datos ficticios, simulación sin cobros, recursos gratuitos; ORM/auth aún no instalados.
- G1/T02 BLOQUEADAS H2 RNF-03/05: matriz operación/destino/rol/autorización pendiente; veto test destructivo demo vs migración operativa autorizable.
- Sin conexión, DDL, semilla, limpieza ni despliegue implícitos; ERS y condiciones Hobby pendientes.

## VCS-01 — Publicada, pendiente CI
- Reviewer ses_ec1ad937dffeezwN61lUPNz16m: APROBADO exclusivamente VCS-01/H1, no specs completas ni H2.
- Conjunto revisado: base 2e892da → T01 06c281e → harness 69ea400 → continuidad ddc83e0.
- Reviewer propios: archive limpio npm ci/env/harness/typecheck antes del build/build todos exit 0 Windows.
- Reviewer propios Git/status/diff y scan 59 archivos: sin candidatos a secreto; CI/OpenCode estáticos sin bloqueante.
- Suites 40/40 y 48/48 y audit producción 0 recibidos por reviewer, no repetidos; npm ci confirmó 7 toolchain (2 moderate/5 high).
- Implementer publicación: fetch exit 0, ahead 3/behind 0; git push origin main normal exit 0.
- git ls-remote --exit-code origin refs/heads/main exit 0: ddc83e0128a723d411429c0996b211f28db6af40 = HEAD; final 0/0.
- CI Linux NO VERIFICADO: gh ausente PATH, sin URL/estado recibido; casilla VCS-01 abierta.
- next-env.d.ts generado era único dirty reportado antes del cierre documental: preservar, no restaurar.
- Evidencia/transcripciones y procedencia recibida: validation002 V7 y tasks002; este escritor no ejecutó comandos ajenos.
- Edición propia solo MEMORY y tasks/validation 001/002; sin código/commit/push/delegación. Harness posterior pendiente, sin shell.
- Estos documentos requieren commit adicional posterior; no se declaran ya subidos con ddc83e0.
- Pendientes adicionales: teclado manual, runtime permisos/modelos/MCP; riesgo toolchain sin fix implícito.
- Siguiente: obtener URL/estado CI Linux de ddc83e0 y registrar resultado; resolver H2 antes de G1. No backend ni cierre global.
