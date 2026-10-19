# Memoria — Raíz del Río

## Estado actual — 2026-10-18
- Shell Next 16.4.0 / React 19.3.0; negocio/auth demo localStorage V4, sin backend compartido.
- T01/H1 RESUELTO por revisión conjunta VCS-01, no aceptación del commit aislado ni cierre global.
- Spec 001/002 abiertas; 002 R5/P4/T4, V16 recheck documental APROBADO; T02/A07 BLOQUEADO / NO VERIFICADO.
- Windows Node 24.14.1/npm 11.11.0 comprobados por reviewer; OpenCode 2.0.27 observado previamente.

## Decisiones y límites vigentes
- SDD/EARS, una tarea por implementador, escritor único; sin delegación recursiva.
- R3/P2/T2 e I1–I5 aprobados 2026-10-14 sujetos a revisión; D1/D2/D4 resueltas, no repetir.
- R5/P4/T4: solo delta explícito autorizado vía coordinador («Dale, hazlo entonces», «Continua donde lo dejamos»).
- H2 ronda 1 APROBADO exclusivamente documental RNF-03/05: ensayo sin app, operativo solo SQL/destino autorizados; no spec global validada.
- Pruebas destructivas demo prohibidas absolutamente; pruebas dev solo schema aislado, rol mínimo, permiso y guardas.
- Migraciones operativas dev/demo autorizables con permiso específico/SQL/recuperación, no veto universal.
- Primera comprobación READ ONLY raiz-del-rio-dev autorizada ahora; demo no tiene permiso de lectura.
- Sin permiso actual DDL, provisión, semillas, limpieza ni despliegue. Lectura no autoriza escrituras.
- Objetivo: Prisma 7, Better Auth en app, Supabase Free DB/fotos, Vercel Hobby académico personal no comercial.
- Sin Docker/PostgreSQL local; dev READ ONLY comprobado PostgreSQL 17.11; demo sin conexión autorizada.
- Datos ficticios/simulación sin cobros; ORM/auth no declarados; T02.a instala pg 8.23.1 exacto (registro estable reconfirmado).
- Usuario reporta DIRECT_URL dev configurada; .env.local ignorado/no tracked comprobado, contenido no leído ni expuesto.
- ERS, condiciones Hobby, versión PostgreSQL demo e aislamiento/roles/shadow siguen pendientes; P4 §9 propone paquete SQL/recuperación M01, no autorizado.

## Evidencia recibida — no ejecutada por este escritor
- Reviewer ses_ec1ad937dffeezwN61lUPNz16m: APROBADO exclusivamente VCS-01/H1, no specs completas/H2.
- Conjunto revisado: base 2e892da → 06c281e → 69ea400 → ddc83e0; archive limpio ci/env/harness/typecheck antes de build/build exit 0.
- Reviewer propios Git/status/diff y scan 59 archivos sin candidatos secreto; CI/OpenCode estáticos sin bloqueante.
- Suites 40/40 y 48/48 y audit prod 0 recibidos por reviewer, no repetidos; npm ci confirmó 7 toolchain (2 moderate/5 high).
- Implementer publicó push normal; ls-remote ddc83e0128a723d411429c0996b211f28db6af40=HEAD y final 0/0 a esa fecha.
- Coordinador HTTP GET GitHub actions/runs/38695994167: HTTP200 completed success, SHA 5a779edbc26ed079c24fac29671d441eb1020860.
- CI updated_at 2026-10-15T07:01:56Z; URL y transcripción en validation002 V8. No atribuirlo a ddc83e0 ni revisión nueva del SHA.
- VCS-01 publicada/CI registrado; reviewer ses_ebf311191ffe9Nbw9YbICD2tdJ: APROBADO exclusivo H2 ronda 1, lectura plan178–200; recheck sin comandos/DB.
- Reviewer: contrato T02.a adecuado; Node/npm comprobados, .env* raíz ausentes (solo nombres), .env/.env.local ignorados; harness/diffchecks OK, sin DB.
- next-env.d.ts generado era único dirty reportado previamente; preservar, no restaurar automáticamente.

## Continuidad
- Reviewer ses_eb30ac1dcffeq24SuwgtGLUgSz: APROBADO T02.a solo evidencia recibida PostgreSQL17.11/TLS estricto/read-only exit0; conexión no reejecutada.
- Mismo reviewer: APROBADO T02.b.1 commit49e2bd8 vs4c19708; puro/matriz336/fail-closed, no RBAC real; propios tsx6/6, tsc dirigido/diff0.
- Casillas T02.a/b.1 hechas solo alcance aceptado; T02/A07 abiertas: metadatos/permisos/herencia/aislamiento/negativas reales PostgreSQL/Prisma pendientes.
- Commit b.1: 49e2bd8e3ce9398affc8e2a926b2774cb3ae4da3, solo scripts/database-target.ts y tests/integration/environment.test.ts; sin publicación acreditada.
- Reviewer ses_eb30ac1dcffeq24SuwgtGLUgSz APROBADO commit2d8b1bbe90ba7897147995e55719370399db4aaa solo package.json; delta runner offline.
- Script test: tsx --test src/domain.test.ts src/auth/authDomain.test.ts tests/check-database-readonly.test.mjs tests/integration/environment.test.ts.
- Mismo reviewer propios runner60/60, harness/diff0; diagnóstico dirty APROBADO offline, scan1 fixture sintética sin secreto real; no ejecutados aquí.
- Diagnóstico: ses_ebc84b698ffe8sGbSrGvhemszf APROBADO allowlist offline sin secretos; propios node --test tests/check-database-readonly.test.mjs14/14/diffOK.
- Reviewer ses_eae62a805ffeW0HbK1z3ykmRMK APROBADO recheck development32–49/plan201–208 RNF05/07 A07; sin ampliar SQL/permisos; V15 CAMBIOS NECESARIOS histórico.
- Base T02.a 4c1970861eec30fa54329c2f2134b076be185211; retry implementer ses_eb31a590fffeR36ONQIdAtkT8f: PASS READ_ONLY17.11 stderr vacío.
- CA solo hijo antes de Node, procedencia declarada; rollback/end sin fallo según script, no observación independiente. Sin confianza global ni TLS relajado.
- Siguiente [NECESITA ACLARACIÓN]: delimitar SQL inspección/provisión; revisión y permiso específico antes de remoto. «Seguir» no autoriza DDL.
- Riesgo contraseña expuesta sin rotación permanece; no almacenar valor ni rotar unilateralmente. G1 mutaciones bloqueada.
- V16 publicable base5a779ed+4c19708/49e2bd8/2d8b1b+diagnóstico/docs; excluir next-env/env privados/cert. Publicador 2026-10-18: diff inspeccionado, npm test60/60, harness y diff/base checks exit0; scan14 archivos, única fixture sintética, sin valores expuestos. MEMORY50/AGENTS39 líneas. Sin DB/config privada/delegación; commit/push pendientes a esta edición, resultados reales en respuesta. T02/A07 sin cierre.
