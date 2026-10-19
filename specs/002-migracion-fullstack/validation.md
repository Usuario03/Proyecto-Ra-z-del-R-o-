# Validación 002 — Registro de revisión documental, NO cierre

Revisión del registro: V16 (recheck aprobado, cierre previo a versionado) · 2026-10-18
Objeto del informe inicial: spec R2 / plan P1 / tareas T1.
Corrección propuesta: spec R3 / plan P2 / tareas T2, ronda documental 1.
Estado actual: recheck documental APROBADO V16; T02.a aceptada solo por evidencia recibida de conexión acotada; T02.b.1 y descubrimiento aceptados offline. T02/A07 BLOQUEADO / NO VERIFICADO para metadatos, permisos/herencia, aislamiento y negativas reales PostgreSQL/Prisma. Sin aprobación global nueva ni mutaciones autorizadas. V16 prevalece sobre estados históricos inferiores.

## V16 — Recheck y cierre previo a versionado, 2026-10-18

Procedencia: resumen del reviewer `ses_eae62a805ffeW0HbK1z3ykmRMK` transmitido por coordinador en esta asignación; sin consulta directa de sesión. Transcripción del resumen recibido:
> APROBADO recheck docsdevelopment32-49 RNF05/07 A07 coherencia plan201-208 sin ampliarSQL permiso. Publicable conjunto base5a779ed locales4c19708/49e2bd8/2d8b1b dirtydiagnóstico/docs excluyendo next-env/env/cert. Propios harnessOK diff/cached/basechecksOK git HEAD2d8b1b originlocal5a779ed ahead3behind0 índicevacío10dirty; nofetch.
> Recibidos tests60 y diagnostico14/aprobados previos, conexión17.11/TLSreadonly no repetida. No cambios inesperados rutas pero sin snapshot dirty byteexact. Pending T02A07 permsherencia aislamiento real negatives PGPrisma, riesgo credencial expuesta sinvalor.

- **APROBADO exclusivamente recheck documental RNF-MIG-05/07 / A07**, guía development:32–49 coherente con plan:201–208. Resuelve el único CAMBIOS NECESARIOS de V15, conservado abajo como histórico. No amplía SELECT ni permisos ni aprueba backend/spec global.
- **Publicable según reviewer:** conjunto base `5a779ed`, locales `4c19708` → `49e2bd8` → `2d8b1b` y diagnóstico/docs dirty revisados. Excluir/preservar `next-env.d.ts`, archivos privados de entorno y certificados; no staging global ni incorporación automática de cambios ajenos. `.env.example` ya pertenece al commit T02.a revisado, no es un secreto de entorno.
- **Propios del reviewer, no ejecutados aquí:** harness OK; diff/cached/base checks OK; HEAD `2d8b1b`, referencia local origin `5a779ed`, ahead 3/behind 0, índice vacío y 10 rutas dirty. Sin fetch: no acredita actualidad del remoto. Invocaciones completas no recibidas, no reconstruidas. No cambios inesperados de rutas reportados, pero sin snapshot dirty byte-exacto: no afirmar identidad de contenido ni cobertura automática de ediciones posteriores.
- **Recibidos por reviewer, no repetidos:** tests 60/60, diagnóstico 14/14 y aprobaciones anteriores; conexión PostgreSQL 17.11/TLS estricto/READ ONLY. Procedencia y límites detallados V12–V15; no conexión ni ensayos reales nuevos.
- **Pendientes:** T02/A07, permisos efectivos/herencia, aislamiento real y negativas PostgreSQL/Prisma. Credencial expuesta sigue siendo riesgo sin valor registrado ni rotación unilateral. [NECESITA ACLARACIÓN] Delimitar SQL de inspección/provisión, revisar y obtener permiso separado antes de remoto; «seguir» no autoriza DDL.

Escritura propia exclusiva validation/tasks 002 y MEMORY (≤50 líneas), con lecturas dirigidas de constitución, memoria, spec y documentos afectados; no código afectado por este cierre. Sin comandos, DB, delegación, commit ni push. Harness/diff posteriores a esta edición pendientes del coordinador; el OK recibido antecede a este registro. Versionado/publicación **PENDIENTES**, no hash futuro inventado: informar en respuesta los resultados reales de commit/push cuando se ejecuten, sin atribuir publicación anticipada a estos documentos.

## V15 — Corrección documental ronda 1, pendiente a esa fecha (histórico)

Procedencia: informe transmitido por coordinador del reviewer `ses_eb30ac1dcffeq24SuwgtGLUgSz`, sin consulta directa de sesión. Transcripción del resumen recibido:
> CAMBIOS NECESARIOS único docs/development32-47 especialmente39 guía dice T02a pendiente pg ausente y SELECT destino/rol/schema/searchpath/permisos permitido contradice plan201-208.
> código2d8b1bAPROBADO runner60/60 propios reviewer harnessdiff0; diagnósticodirtyAPROBADO offline; scan1fixture sintética sinsecretoreal; T02A07 pendiente.

- **APROBADO código** `2d8b1bbe90ba7897147995e55719370399db4aaa`, descubrimiento explícito del runner: reviewer reporta propios 60/60, harness/diff exit 0. Invocaciones completas no recibidas; no reconstruidas ni ejecutadas aquí. Sustituye pendiente de revisión del delta en V14, no acredita backend.
- **APROBADO diagnóstico dirty exclusivamente offline**, pendiente commit según registro recibido; scan reportó un hallazgo correspondiente a fixture sintética, sin secreto real identificado. No equivale a garantía exhaustiva ni elimina el riesgo previo de credencial expuesta en chat.
- **CAMBIOS NECESARIOS documental**, único hallazgo informado RNF-05/07 / A07: `docs/development.md:32–47` (líneas antes de corregir) contradecía plan §9. Corrección limitada a estado pg 8.23.1 instalado, T02.a aceptada por evidencia, SELECT salud/versión/read-only, TLS por transporte; metadatos/permisos T02.b requieren SQL revisado y permiso separado. Fallo TLS marcado histórico, superado con CA solo proceso en retry autorizado. Sin ampliar SQL, criterios ni permisos.
- **Corrección PENDIENTE de revisión**: no se recibió APROBADO para esta nueva edición. T02/A07 siguen pendientes; aprobaciones T02.a/b.1 conservan su alcance anterior. Siguiente: recheck documental, después delimitar inspección/provisión antes de remoto.

Edición propia exclusiva `docs/development.md`, validation 002 y MEMORY (50 líneas); lectura dirigida, sin comandos del reviewer ni propios, código, DB, SQL, secretos, commit, push o delegación. Harness/diff posteriores a esta corrección **PENDIENTES**, sin shell disponible. Historial V14 conservado; no se afirma publicación ni revisión de documentos fuera de asignación.

### Reanudación documental 2026-10-18
- La lectura inicial encontró ya persistida la corrección principal de development: pg instalado, T02.a aceptada, SELECT limitado y metadatos/permisos pendientes T02.b. Se conserva, sin atribuir su escritura a esta reanudación; solo se explicita que el retry no garantiza TLS futuro y se completa este registro. Cotejo por lectura con plan:201–208, V14, tasks T02 y `scripts/check-database-readonly.mjs` (SELECT fijo y transporte); no ejecución del script ni lectura de configuración privada.
- Resumen final transmitido en la asignación, procedencia reviewer `ses_eb30ac1dcffeq24SuwgtGLUgSz`: **«CAMBIOS NECESARIOS»** únicamente development:32–47; **«APROBADO»** código `2d8b1b`, propios `npm test` 60/60 y harness/diff 0; **«APROBADO»** diagnóstico dirty offline, allowlist 14 tests sin secretos, TLS/read-only intactos; scan: un fixture sintético sin secreto real; **«T02/A07 BLOQUEADO / NO VERIFICADO»**. No se consultó la sesión ni se ejecutaron esos comandos. Evidencia detallada de los 14/14 y su reviewer original conservada en V14/V12.
- Historial Git recibido del coordinador, no comprobado aquí: base remota `5a779ed`; locales `4c19708` → `49e2bd8` → `2d8b1b`; diagnóstico y documentación aún dirty. Preservar documentos previos y `next-env.d.ts`. Usuario autoriza versionado/push normal previo y continuar SDD según asignación; no DDL, aprobación de esta corrección ni publicación acreditada. Esta fase no ejecuta commit/push.
- Resultado: corrección ronda 1 **PENDIENTE de recheck documental**, harness/diff posteriores pendientes. Sin nuevos requisitos, SQL ni permisos; riesgo de credencial expuesta pendiente, sin valor registrado. Estados históricos de otros documentos no se reescriben fuera de asignación; V15 conserva el estado de cierre recibido.

## V14 — Cierre acotado e informe para revisión/commit

Procedencia: asignación del coordinador, sin consulta directa de sesiones ni ejecución de comandos. Transcripción del resumen recibido del reviewer `ses_eb30ac1dcffeq24SuwgtGLUgSz`:
> APROBADO T02b1 commit49e2bd8 vs4c19708 puro matrix336 failclosed sin RBAC real; propios tsx6/6 tscdirigido/diff0. APROBADO T02a solo evidencia recibida conexión17.11 strictTLSreadonlyexit0 no reejecutada. T02/A07 BLOQUEADO noverificado metadatos/permisosherencia/aislamiento reales negativosPostgresPrisma.

| Alcance / requisito | Evidencia recibida y procedencia | Veredicto / límite |
| --- | --- | --- |
| T02.b.1; RF-02 preparatorio, RNF-01/03/05/07 | Reviewer: commit `49e2bd8e3ce9398affc8e2a926b2774cb3ae4da3` contra `4c1970861eec30fa54329c2f2134b076be185211`; evaluador puro, matriz 336, rechazo por defecto. Propios tsx 6/6, tsc dirigido y diff exit 0; invocaciones completas no recibidas en este informe. | **APROBADO** exclusivamente offline. POLICY_MATCH no acredita RBAC ni autorización humana/remota. |
| T02.a; RNF-01/05/07, A07 parcial | Reviewer acepta evidencia recibida PostgreSQL 17.11, TLS estricto, READ ONLY, exit 0; no repitió conexión. Retry y límites de cleanup conservados en V13/tasks. | **APROBADO** solo cierre acotado de evidencia; metadatos/permisos permanecen en T02.b. |
| T02/A07; RNF-03/05/07 | Sin evidencia real de metadatos, permisos efectivos/herencia, aislamiento ni negativas PostgreSQL/Prisma. | **BLOQUEADO / NO VERIFICADO**, sin cierre global ni permiso DDL. |

Diagnóstico TLS: se conserva el veredicto del reviewer `ses_ebc84b698ffe8sGbSrGvhemszf` transmitido por coordinador: **«APROBADO solo diagnóstico offline script allowlist sin secretos/TLS hostname readonlytimeouts rollback intactos»**. Propios `node --test tests/check-database-readonly.test.mjs` 14/14 exit 0 y diff OK (V12); no ejecutados aquí. Según asignación, `scripts/check-database-readonly.mjs` y `tests/check-database-readonly.test.mjs` siguen modificados, aprobados pero pendientes de commit; no se verificó Git en esta llamada.

Mejora recomendada de descubrimiento ahora **IMPLEMENTADA, pendiente revisión del delta mínimo**: commit reportado `2d8b1bbe90ba7897147995e55719370399db4aaa`, exclusivamente `package.json`, script exacto `tsx --test src/domain.test.ts src/auth/authDomain.test.ts tests/check-database-readonly.test.mjs tests/integration/environment.test.ts`. Coordinador transmite `npm test` 60/60, harness y diff exit 0. Lectura propia de package.json confirma ese script, no su ejecución ni el contenido del commit. Aprobación de b.1 no extendida a este delta; no se declara publicado.

**Informe listo para revisión y eventual commit, no commit realizado:** cambios de esta fase exclusivamente tasks/validation 002, MEMORY y ajuste mínimo de estados architecture. Revisar diff y ejecutar harness/diff posteriores antes de versionar; staging explícito de rutas asignadas, sin incorporar automáticamente docs previos, diagnóstico o next-env generado. Spec/plan conservan referencias V13 históricas fuera del permiso de esta asignación; V14 registra el estado vigente sin reescribirlos. Sin nuevos requisitos ni aprobación humana nueva.

Siguiente decisión **[NECESITA ACLARACIÓN]**: delimitar SQL de inspección ampliada y alcance de provisión propuesto antes de cualquier operación remota; revisar SQL/destino/rol/recuperación y obtener permisos separados. «Seguir» no autoriza DDL. No repetir lectura T02.a ni decisión H2. Riesgo de contraseña expuesta permanece, sin almacenar valor ni rotar unilateralmente.

Comprobaciones propias: skill sdd y lecturas dirigidas de constitución, memoria, spec activa/plan §9, tareas/validación, workflow/arquitectura, package y evaluador/tests afectados. Solo edición documental; sin shell disponible, harness/diff posteriores **PENDIENTES**. Sin tests, código, SQL, conexión, secretos, delegación, commit ni push. Evidencia del reviewer/implementer no ejecutada por este escritor.

## V13 — Lectura exitosa recibida y siguiente preparación offline

Procedencia: reporte de implementer `ses_eb31a590fffeR36ONQIdAtkT8f` transmitido por coordinador en esta asignación, complementado por registro tasks T02.a; no consulta directa de sesión ni repetición de comandos. Transcripción de la evidencia recibida:
> CA autorizada NODE_EXTRA_CA_CERTS solo proceso, offline0, único script --connect exit0 PASS READ_ONLY PostgreSQL17.11 stderr vacío, TLS strict/read_onlyon, rollback/cierre sin fallo script no independiente; harness/diff0; sin DDL.

| Requisito / alcance | Evidencia recibida | Veredicto de cobertura documental, no aprobación reviewer nueva |
| --- | --- | --- |
| T02.a, RNF-01/05/07, A07 parcial | `npm run db:check-target` exit 0 PASS OFFLINE; único hijo Node `scripts/check-database-readonly.mjs --connect` exit 0 PASS READ_ONLY PostgreSQL 17.11; stderr vacío. CA autorizada solo proceso antes de Node. | Conexión/salud/versión/read-only/TLS acreditados por comprobaciones del script. Timeout configurado, no ensayo remoto de vencimiento. |
| Cleanup T02.a | ROLLBACK/end sin fallo reportado según flujo aprobado. | No observación independiente servidor/transporte. No nueva conexión ni DDL. |
| Metadatos/permisos plan:201 anterior | SELECT actual solo health/version/read_only; configuración cotejada privadamente no mide privilegios efectivos. | NO VERIFICADOS; obligación conservada explícitamente en T02.b. No declarar aislamiento ni persistencia RF-02. |
| RNF-07 / verificaciones del retry | Implementer reportó harness/diff exit 0; tests offline ya revisados no repetidos. | No cubren estas ediciones documentales posteriores. |

Último veredicto reviewer disponible, procedencia coordinador / reviewer `ses_ebc84b698ffe8sGbSrGvhemszf`, transcripción conservada: **«APROBADO solo diagnóstico offline script allowlist sin secretos/TLS hostname readonlytimeouts rollback intactos»**. Propios del reviewer: `node --test tests/check-database-readonly.test.mjs` **14/14 exit 0**, `git diff --check` OK, Node 24.14.1; recibió npm test 54/54 y tipos/harness OK. No ejecutados aquí. **No se recibió APROBADO del cierre remoto ni de la aclaración actual**; no transformar reporte de implementer en revisión independiente.

Decisión documental: mantener R5/P4/T4, sin nuevos RF/RNF, con aclaración de partición pendiente reviewer. T02.a registra la prueba acotada; su casilla sigue abierta hasta revisión. T02.b conserva metadatos/permisos/aislamiento y A07 pendiente. P4 §9 propone secuencia guardas offline → inspección ampliada autorizada → SQL de provisión/M01 revisado → permiso específico → ensayo/recuperación, no nueva autorización de ejecución. Siguiente única tarea: T02.b.1, dos rutas y pruebas definidas en tasks; sin DB ni nuevas dependencias.

Riesgo pendiente: credencial expuesta en chat; usuario no desea rotarla ahora según coordinador. No registrar/repetir valor ni rotar unilateralmente; no asumir seguro. No bloquea trabajo offline; informar riesgo antes de pedir permiso remoto específico. La CA tiene procedencia declarada por usuario; huella/vigencia no autentican por sí mismas esa procedencia.

Comprobaciones propias: skills sdd/postgres y lecturas dirigidas de instrucciones, constitución, memoria, workflow, arquitectura, deployment, spec002 y código de diagnóstico/package; edición exclusiva spec/plan/tasks/validation 002 y MEMORY. Sin shell disponible: harness/diff posteriores **PENDIENTES**; sin tests, DB, código, secretos, commit, push ni delegación. Commit documental y cambios de diagnóstico posteriores al commit inicial siguen pendientes tras reviewer; preservar cambios ajenos/next-env. No se afirma estado Git comprobado en esta llamada. Architecture/deployment contienen estados históricos de conexión no actualizados por estar fuera de asignación; V13 es el estado de continuidad vigente.

## V12 — Cierre del diagnóstico ronda 1, no cierre T02.a

Procedencia: informe del coordinador recibido en esta asignación; reviewer `ses_ebc84b698ffe8sGbSrGvhemszf`. Transcripción del veredicto recibido: **«APROBADO solo diagnóstico offline script allowlist sin secretos/TLS hostname readonlytimeouts rollback intactos»**. No equivale a aprobación humana de confianza CA ni de nuevo intento remoto.

| Alcance / RF-RNF | Evidencia recibida, no ejecutada por este escritor | Resultado |
| --- | --- | --- |
| T02.a / RNF-MIG-01/05 | Reviewer: clasificador allowlist sin secretos; TLS/hostname, read-only, timeouts y rollback intactos. | APROBADO exclusivamente diagnóstico offline ronda 1. |
| RNF-MIG-07 | Propios del reviewer: `node --test tests/check-database-readonly.test.mjs`, **14/14, exit 0**; `git diff --check` OK; Node **24.14.1**. Reviewer recibió `npm test` **54/54**, typecheck/harness OK. | Evidencia offline; no repetida aquí. |
| A07 parcial / RF-MIG-02 preparatorio | Remoto recibido: único intento de esta ronda `npm run db:check-target -- --connect`, exit 1: **FAIL CONNECTION TLS SELF_SIGNED_CERT_IN_CHAIN**. | **BLOQUEADA** confianza de cadena TLS; no acredita autenticación, SELECT, versión, read-only remoto ni rollback. Origen/CA/intermediario no determinados. |

Observación del reviewer: `plan.md:201` pide metadatos/permisos cotejados internamente, mientras el SELECT fijo de `scripts/check-database-readonly.mjs:10` solo consulta health/version/read_only. **[NECESITA ACLARACIÓN]** Precisar esa cobertura antes de cerrar T02.a; el cotejo privado de configuración no acredita permisos efectivos remotos. No ampliar SQL automáticamente ni modificar plan/requisitos en este cierre.

**Recomendación pendiente de autorización del usuario, no ejecutada:** descargar desde el dashboard oficial del proyecto dev → Database Settings → SSL Configuration → Download Certificate la CA oficial y comprobar su aplicabilidad al Session pooler. Referencias recibidas: https://supabase.com/docs/guides/database/psql y https://supabase.com/docs/guides/platform/ssl-enforcement (no consultadas de nuevo por este escritor). No cambiar el toggle de enforcement. Conservar PEM fuera del repositorio; validar condición CA, vigencia, huella y procedencia por fuente oficial independiente antes de confiar. No obtener la confianza de la propia conexión fallida ni instalar certificados globalmente.

Si el usuario descarga/verifica y autoriza esa confianza y un nuevo intento, propuesta: `NODE_EXTRA_CA_CERTS` exclusivamente para el proceso, definido antes de iniciar Node; no en `.env.local`, que el script carga después del inicio. Mantener TLS y hostname estrictos; nunca disableTLS ni desactivar validación. No hay autorización nueva ni conexión en este cierre. Si la CA no es aplicable/verificable, detener y consultar, no probar alternativas automáticamente.

Evidencia propia: skill sdd y lectura dirigida de constitución, memoria, flujo, arquitectura, spec activa, plan afectado, tasks/validation y script; edición exclusiva de validation/tasks 002 y MEMORY (≤50 líneas). Sin comandos del reviewer ni propios, secretos, DB, código, requisitos, delegación, commit o push. Harness/diffchecks posteriores **PENDIENTES** por falta de shell. Documentos pendientes de Git; no se afirma publicación. T02.a/T02/spec abiertas, G1 mutaciones bloqueada; V12 prevalece sobre estados históricos inferiores.

## V11 — Cierre de preparación offline T02.a, SIN conexión ni cierre de tarea/spec
Procedencia: informe del reviewer `ses_ebca6e093ffeAg4zJp7yrZhEtp` transmitido por coordinador en esta asignación; no consulta directa de la sesión ni stdout íntegro. Transcripción del resumen recibido:
> APROBADO preparación offline commit4c1970861eec30fa54329c2f2134b076be185211 padre5a779ed 5archivos. Revisó target independiente failclosed TLS cert+hostname URI sin params SELECT fijos beginreadonly5s rollback cierre transporte errores redacted sin import side effects pg8.23.1 exacto. Propios node --test tests/check-database-readonly.test.mjs10/10PASS, commitdiffcheckOK 5files identical. Recibidos npmtest50 types harness envOK auditprod0toolchain7. No .env leído ni DB.

| Alcance / requisito | Evidencia y procedencia | Resultado / límite |
| --- | --- | --- |
| T02.a / RF-MIG-02 preparatorio; RNF-01/05 | Reviewer inspeccionó destino independiente con rechazo por defecto, TLS certificado + hostname, URI sin parámetros, SELECT fijos, BEGIN READ ONLY, timeout 5 s, rollback, cierre de transporte, errores redactados y ausencia de efectos al importar. | APROBADO **solo preparación offline**; no demuestra TLS/conexión remotos ni persistencia comercial. |
| T02.a / RNF-07 | Reviewer propio: `node --test tests/check-database-readonly.test.mjs` **10/10 PASS**; comprobación diff del commit OK y cinco archivos idénticos reportados. `pg` **8.23.1 exacto**. | Commit local `4c1970861eec30fa54329c2f2134b076be185211`, padre `5a779ed`; `.env.example`, `package.json`, `package-lock.json`, `scripts/check-database-readonly.mjs`, `tests/check-database-readonly.test.mjs`. Sin push. No se reconstruye invocación Git no recibida. |
| Regresión y auditoría | Reviewer recibió: npm test **50/50**, tipos/harness/env OK, audit producción **0**, toolchain **7**; no se atribuyen como repeticiones propias del reviewer. | Evidencia de implementación recibida; riesgo toolchain conservado, sin fix implícito. |
| A07 / prueba real | No `.env` leído ni DB por reviewer; ninguna conexión en este cierre. | **NO VERIFICADA**: configuración privada, versión PostgreSQL efectiva y TLS remoto. T02.a/T02 abiertas; G1 mutaciones pendiente. |

Siguiente paso: el usuario configura/coteja privadamente en `.env.local` `DB_READONLY_EXPECTED_PROJECT_REF` desde **Settings / General / Project ID**, `DB_READONLY_EXPECTED_HOST` desde **Connect / host del pooler** del proyecto dev y `DB_READONLY_TARGET=raiz-del-rio-dev`. Expectativas independientes: no inferirlas ni autocompletarlas desde `DIRECT_URL`; no solicitar valores, URL ni secretos por chat. Después corresponde la prueba real READ ONLY ya autorizada, con salida sanitizada; no se ejecuta en esta fase.

No nuevos permisos: demo sin lectura; DDL, provisión, semillas, limpieza, despliegue y G1 mutaciones siguen pendientes. No marcar T02.a hecha antes de prueba real ni cerrar T02/spec. Docs previos pendientes y `next-env.d.ts` generado preservados; este registro no se incluye ni se presume publicado por el commit de código.
Evidencia propia: skill sdd, lecturas dirigidas de constitución/flujo/MEMORY/spec/tasks/validation y script afectado; edición exclusiva de tasks/validation 002 y MEMORY. Sin comandos, lectura de `.env`, DB, instalaciones, commits, push ni delegación. No se ejecutaron comandos del reviewer; harness/diffchecks posteriores a esta edición **PENDIENTES**, sin shell disponible. V11 prevalece sobre pendientes históricos de cliente/reviewer en V10.

## V10 — Cierre documental exclusivo H2, no cierre de spec
Procedencia: recheck del reviewer `ses_ebf311191ffe9Nbw9YbICD2tdJ` transmitido por coordinador en esta asignación, sin consultar directamente la sesión. Transcripción del veredicto y evidencia recibidos:
> APROBADO exclusivo ronda1 RNF03/05 lectura propia plan178-200,187/193 migrador ensayo sin app,188/194 operativo limitado SQL/destino autorización,186/195 demo veto test destructivo/E2E nunca credencial operativa. No comandos ni DB en recheck.

H2 queda **RESUELTO documentalmente** en ese alcance: distinción de roles y guardas consistente. No valida spec global, implementación de aislamiento, permisos efectivos ni conexión. CI anterior success permanece registrado en V8, sin nueva comprobación ni extensión de su alcance. V10 sustituye el pendiente de revisión H2 de V9; el dictamen CAMBIOS NECESARIOS se conserva como historial.
T02.a sigue pendiente de cliente `pg` y configuración privada del usuario: `.env.local` ignorado con `DIRECT_URL` dev según instrucciones ya existentes en `docs/development.md`. No se crea/lee ese archivo ni se solicitan secretos. Primera lectura dev sigue autorizada, no ejecutada; demo sin permiso de lectura y DDL/semillas/limpieza sin permiso. G1 mutaciones sigue pendiente de guardas/aislamiento efectivos y autorización específica.
Evidencia propia del cierre: lectura dirigida y edición solo de validation/tasks 002 y MEMORY. Sin comandos, SQL, conexión, código, secretos, instalaciones, commit/push ni delegación. No se ejecutaron comprobaciones del reviewer; el recheck tampoco ejecutó comandos. Harness/diffchecks posteriores a esta edición pendientes. Próximo paso: configuración segura por usuario y preparación del cliente por implementer, luego T02.a acotada; no repetir aprobación H2.

## V9 — Corrección documental ronda 1 H2, pendiente a esa fecha (histórico)
Procedencia: informe del reviewer `ses_ebf311191ffe9Nbw9YbICD2tdJ` transmitido por coordinador en esta asignación; no consulta directa de sesión ni stdout íntegro. Transcripción del veredicto/hallazgo recibido:
> CAMBIOS NECESARIOS: plan188,192-193 matriz permite migrador operativo app pero guarda dice roles test/migrador sin permisos app. Distingue explícito migrador ensayo/autoría/shadow SIN permisos app y operativo SOLO permisos SQL/destino específicamente autorizados.

Transcripción de evidencia recibida:
> Reviewer T02.a contrato adecuado TLS certificado+host READONLY timeout ROLLBACK errors sanitized; comprobó shell Node/npm, pg no instalado ni declarado, psql no PATH, .env* raíz ausentes nombres solo, .env/.env.local ignorados; harness OK diffchecksOK; no DB.

Corrección aplicada únicamente a P4 §9: matriz y guardas separan migrador ensayo/autoría/shadow sin permisos app del migrador operativo con privilegios limitados al SQL/destino específicamente autorizados; E2E no usa credencial operativa. No nuevo negocio, permiso ni cambio de contrato T02.a. **Corrección PENDIENTE de revisión; no APROBADO.** El contrato T02.a considerado adecuado no acredita conexión ni levanta G1 de mutaciones.
Evidencia propia: lectura dirigida de plan/validation/MEMORY y edición solo de esos tres documentos. No se ejecutaron los comandos del reviewer ni se reconstruyen invocaciones no recibidas. Harness/diffchecks reportados corresponden a la revisión anterior a esta corrección; comprobaciones posteriores PENDIENTES, sin shell disponible. Sin código, secretos, .env, DB, instalación, commit ni delegación. Próximo paso: revisión de esta corrección; configuración segura/cliente siguen pendientes antes de lectura dev autorizada. V9 prevalece sobre el estado técnico H2 de V8.

## V8 — CI registrado y aclaración H2 autorizada, NO cierre global
Procedencia: asignación del coordinador a este escritor documental. El coordinador transmite aprobación del usuario «Dale, hazlo entonces» a registrar éxito CI, prohibición de pruebas destructivas demo/migraciones demo con permiso específico y primera comprobación READ ONLY de raiz-del-rio-dev; después «Continua donde lo dejamos». Se aprueba solo ese delta R5/P4/T4, no el conjunto técnico ni nuevas mutaciones. No se consultó la sesión original.

Transcripción de evidencia propia del coordinador, recibida (no ejecutada por este escritor):
> HTTP GET https://api.github.com/repos/Usuario03/Proyecto-Ra-z-del-R-o-/actions/runs/38695994167 HTTP200 completed success SHA5a779edbc26ed079c24fac29671d441eb1020860 updated_at2026-10-15T07:01:56Z

URL recibida: https://github.com/Usuario03/Proyecto-Ra-z-del-R-o-/actions/runs/38695994167

| Alcance / requisito | Evidencia / resultado | Límite |
| --- | --- | --- |
| VCS-01 / RNF-07 | CI completed/success, HTTP 200 según coordinador; VCS-01 publicada y CI registrado | SHA `5a779edbc26ed079c24fac29671d441eb1020860`, no `ddc83e0`. No se inspeccionaron logs/jobs ni diff entre esos SHA aquí; no reatribuir revisión previa al nuevo SHA ni inferir E2E de CI. |
| T01/H1 / RNF-07 | Veredicto previo reviewer `ses_ec1ad937dffeezwN61lUPNz16m`: «APROBADO VCS01/H1 conjunto base2e892da->06c281e->69ea400->ddc83e0» | H1 resuelto conjuntamente; transcripción extensa y comandos propios/recibidos en V7. No aprobación aislada T01 ni specs completas. |
| H2 / RNF-03/05 | Decisión humana acotada incorporada en R5 y matriz P4 §9: veto absoluto test destructivo demo; migración operativa dev/demo autorizable por permiso específico | Aclarado documentalmente. Reviewer previo `ses_ec1c7c277ffe1p116OGM3cToqn`: «T02 DOCUMENTAL CAMBIOS NECESARIOS H2 RNF03/05» (V5 íntegro abajo). No se recibió nuevo APROBADO técnico. |
| T02.a / A07 parcial | Primera lectura dev autorizada; contrato READ ONLY, TLS, timeout, SELECT acotado y salida sanitizada documentado | NO EJECUTADA. Configuración privada/cliente pendientes; pg no declarado en package.json, cliente alternativo no comprobado. Sin credenciales leídas/solicitadas. |
| G1 mutaciones / A07 | Pruebas solo schema dev aislado con permiso, rol limitado y guardas; migrador operativo distinguido del runner | DDL/semillas/limpieza sin autorización; aislamiento/Prisma shadow pendientes. Demo sin permiso de lectura. |

Evidencia propia: skill sdd; lecturas dirigidas AGENTS, MEMORY, constitución, flujo, arquitectura, desarrollo, cuatro documentos 002, package.json y .gitignore; edición solo docs architecture/development, spec/plan/tasks/validation 002 y MEMORY. No código de negocio afectado. AGENTS no editado por límite superior de escritura (solo specs/, docs/, MEMORY); su frase T01 bloqueada por revisión queda obsoleta y requiere escritor autorizado, sin ampliar esta asignación.
Verificación propia: revisión documental por lectura/búsqueda dirigida; no shell disponible, `npm run harness:check` y `git diff --check` posteriores PENDIENTES. Sin código, instalaciones, .env real, secretos, delegación, commit/push ni DB. No nuevas comprobaciones remotas. Siguiente: responsable configura conexión dev de forma privada según docs/development; implementer verifica cliente o prepara instalación revisada y ejecuta solo T02.a. Esta edición no se declara publicada.

V8 prevalece sobre estados históricos inferiores: no volver a pedir decisión H2 ni permiso de lectura dev. V7/V5 conservan literalmente evidencia/veredictos a su fecha; no constituyen bloqueos vigentes de CI/H1 ni permisos de mutación.

## V7 — Revisión conjunta y publicación recibidas; CI pendiente a esa fecha (histórico)
Procedencia: informe del reviewer `ses_ec1ad937dffeezwN61lUPNz16m` y reporte de publicación del implementer transmitidos por el usuario/coordinador en esta asignación. No se consultaron directamente las sesiones ni se recibió stdout íntegro. Los comandos/resultados de esta sección son evidencia **recibida**, no ejecución de este escritor documental.

Transcripción del resumen de revisión transmitido:
> APROBADO VCS01/H1 conjunto base2e892da->06c281e->69ea400->ddc83e0. H1 RNF07 resuelto: archive limpio reviewer ci/env/harness/typecheck antesbuild/build todos0 Windows Node24.14.1npm11.11.0; propios Git/status/diff scans59archivos no candidatos secreto, static CI/opencode no bloqueante; suites recibidas40/40 y48/48 no repetidas; 7toolchain2moderate5high confirmadas npmci; prod0 recibido. No valida specs completas G1/H2 pendientes.

Transcripción del resumen de publicación transmitido:
> fetch0 ahead3behind0, git push origin main0 normal, git ls-remote --exit-code origin refs/heads/main0 remoto ddc83e0128a723d411429c0996b211f28db6af40=HEAD, final0/0. gh ausente PATH CI Linux NO VERIFICADO sin run URL/estado. next-env generado único dirty preservar.

| Alcance | Evidencia y procedencia | Resultado vigente |
| --- | --- | --- |
| H1 / T01 / RNF-MIG-07 | Reviewer: archive limpio del conjunto desde base `2e892da`, commits `06c281e` → `69ea400` → `ddc83e0`; `npm ci`, `env:check`, `harness:check`, `typecheck` **antes del build**, `build`, todos exit 0, Windows Node 24.14.1/npm 11.11.0. | **H1 RESUELTO por revisión conjunta**; no aceptación del commit T01 aislado ni backend. T01 conserva casilla abierta en este cierre acotado. |
| Integración/seguridad | Reviewer propios: Git/status/diff, scan de 59 archivos sin candidatos a secreto; inspección estática CI/OpenCode sin bloqueante. No se recibieron invocaciones completas de esos scans; no se reconstruyen. | APROBADO en alcance VCS-01/H1; scan no es garantía exhaustiva ni validación runtime. |
| Regresión/auditoría | Reviewer recibió, no repitió, suites 40/40 y 48/48 y auditoría producción 0. Confirmó mediante npm ci 7 toolchain: 2 moderate/5 high. | Conservar procedencia; riesgo toolchain pendiente, sin fix implícito. |
| Publicación Git | Implementer: fetch exit 0, ahead 3/behind 0; `git push origin main` normal exit 0; `git ls-remote --exit-code origin refs/heads/main` exit 0, remoto `ddc83e0128a723d411429c0996b211f28db6af40` = HEAD, final ahead 0/behind 0. | **VCS-01 PUBLICADA, pendiente CI**; único dirty reportado `next-env.d.ts` generado, preservar. |
| CI Linux | Implementer: gh ausente en PATH, sin URL de ejecución ni estado recibido. | **NO VERIFICADO**; casilla VCS-01 abierta hasta satisfacer su condición. |

Este registro V7 prevalece sobre estados históricos V5/V6: H1 de reproducibilidad resuelto; **G1/H2 RNF-MIG-03/05 siguen BLOQUEADAS**. No hay aprobación H2, permiso de backend/conexión/migración ni cierre de specs 001/002. No confundir estos hallazgos con H1–H3 documentales de R3/P2/T2. Teclado manual adicional y runtime de permisos/modelos/MCP siguen sin acreditar.

Evidencia propia de esta fase: carga de skill sdd y lecturas dirigidas de memoria, constitución, flujo, spec activa y tareas/validaciones asignadas; edición exclusivamente de MEMORY y tareas/validación 001/002, sin código afectado. No se ejecutaron Git, pruebas, auditorías, harness ni comandos del reviewer/implementer; sin shell disponible. Verificación posterior del harness **PENDIENTE**. Estos cambios documentales se versionarán en un commit adicional posterior: **no están acreditados como publicados** por el push recibido. Siguiente: obtener URL/estado CI Linux del commit publicado y registrar resultado; resolver H2 antes de G1, sin repetir autorización VCS-01 ya resuelta.

## V6 — Autorización acotada y auditoría inicial, NO validación final (histórico)
Procedencia: asignación del coordinador a este subagente documental, sin consultar sesión original del usuario/reviewer Git. Autorización transmitida: «primero commits/versionar/subir Git luego resto». Se registra para VCS-01, no como aprobación global R4/P3/T3 ni cierre T01/001. Push normal autorizado, nunca force; sin backend ni G1 ni cambio de requisitos.

Transcripción de evidencia Git recibida:
> main upstream origin/main único remoto GitHub Usuario03/Proyecto-Ra-z-del-R-o-, localahead1 commit06c281e (sin fetch), índice vacío. Harness/docs/spec001/002 untracked, tracked README/package/lock/next-env modificados.

No se transmitió un veredicto final del reviewer Git: **revisión final PENDIENTE / NO VERIFICADA**. Auditoría inicial sin fetch no acredita actualidad del remoto, reproducción, CI, commits nuevos ni push. No se ejecutaron sus comandos aquí. El veredicto recibido para T01/G1 sigue siendo **CAMBIOS NECESARIOS**, transcrito en V5 abajo.

- VCS-01 delimita dos commits futuros: harness existente y documentación 001; continuidad MEMORY/002 después. Preservar/excluir next-env generado hasta decisión justificada por verificación. No stage global ni incorporación automática de cambios ajenos.
- Lectura propia: skill sdd, AGENTS/MEMORY/constitución/flujo/arquitectura, spec activa y artefactos asignados, README, package.json, shell/page Next, Playwright y workflow verify. Scripts declarados confirman dev Vite frente a dev:next/build/preview Next; shell mantiene cliente sin SSR. Son lecturas, no pruebas.
- Edición limitada: docs architecture/development/deployment, tareas/validación 001 y 002, MEMORY. AGENTS/README no editados por límite superior de rutas; alineación pendiente por escritor autorizado (React 19.3/Next 16.4, comandos y retirada de instrucciones dist/Netlify como actuales).
- Sin shell disponible: harness, env, tests, tipos, build, Git, auditoría y CI **NO EJECUTADOS** por este escritor. Reproducción limpia, revisión conjunta y push pendientes. No código/configuración, delegación, backend ni remoto.
- La pregunta V5 nº1 queda resuelta por autorización separada VCS-01; no volver a pedirla. H2 continúa pendiente sin redefinir guardas ni decisiones Supabase. T01 sigue bloqueada hasta evidencia/revisión.

## Cierre V5 conservado — T01 BLOQUEADA / G1 BLOQUEADA
Procedencia: informe de reviewer sesión `ses_ec1c7c277ffe1p116OGM3cToqn`, transmitido por el usuario/coordinador en esta asignación. No se consultó directamente la sesión ni se recibió stdout íntegro. Este escritor no ejecutó los comandos del reviewer. Este estado prevalece sobre próximos pasos históricos inferiores; se preservan aprobaciones anteriores sin extenderlas.

Transcripción del informe recibido:
> T01 CAMBIOS NECESARIOS H1 RNF07 reproducción commit06c281edfade51ed0c62d04342ea34755246a9e7 vs parent2e892da incompleta: package commit carece typecheck,harness:check,env:check,engines,packageManager; scripts harness untracked (ls-tree solo scripts/prepare-hero.py). Workingtree pruebas no acreditan checkout commit. Esperado integración separada harness AUTORIZADA y verificación revisión conjunta, no incluir ajenos automáticamente. Código Next SSR-safe/layout/es/tests assertions sin otros bloqueantes.
>
> T02 DOCUMENTAL CAMBIOS NECESARIOS H2 RNF03/05 plan179,182-193 tasks223 guard demo 'antes toda mutación' contradice migrador demo autorizado futuro. Necesita decisión matriz operación/destino/rol/autorización: prohibición absoluta test destructivo demo vs migración operativa autorizable. No modificar política automáticamente.
>
> Reviewer propios typecheckOK harnessOK e2e dirigido auth/dual grep correo duplicado|PIN, accesibilidad 4/4 con build/axe, npmls expected 2 extraneous @emnapi/runtime @img/sharp-wasm32, git diff/commit --check OK. Recibidos no repetidos ci/test40/e2e48/auditprod0toolchain7. Sin remoto/fuentes editadas; pendientes reproducibilidad aislada/manual/Linux/remoto.

- **H1 vigente / RNF-MIG-07: T01 BLOQUEADA**, dos rondas agotadas; sin tercera corrección automática. Commit `06c281edfade51ed0c62d04342ea34755246a9e7`, padre reportado `2e892da`. Requiere autorización de integración separada del harness y posterior reproducción aislada/revisión conjunta. No incorporar archivos ajenos automáticamente. Working tree favorable no acredita checkout del commit.
- **H2 vigente / RNF-MIG-03/05: G1 BLOQUEADA**, T02 documental con CAMBIOS NECESARIOS, implementación no iniciada. Referencias del reviewer: plan:179,182–193; tasks:223 antes de este cierre. [NECESITA ACLARACIÓN] Matriz operación/destino/rol/autorización que distinga veto absoluto de pruebas destructivas demo de migración operativa eventualmente autorizable. No se cambia política, requisito ni plan. H1/H2 de esta revisión no son los hallazgos históricos ya resueltos.

### Decisiones priorizadas pendientes del usuario
1. ¿Autoriza una integración separada y explícitamente delimitada del harness, seguida de verificación reproducible y revisión conjunta con T01? No se presume permiso ni se añaden cambios ajenos.
2. [NECESITA ACLARACIÓN] ¿Cómo debe distinguir la matriz operación/destino/rol/autorización el veto absoluto a pruebas destructivas en demo y una futura migración operativa con permiso específico? Resolver antes de revisar/autorizar G1; no autoriza conexión ni migración ahora.

Evidencia propia: skill sdd y lecturas dirigidas de memoria, constitución, flujo, spec/validation/tasks y plan:175–193; edición exclusiva de validation.md, estados T01/G1 en tasks.md y MEMORY.md. Sin código afectado por esta asignación, delegación, pruebas, remoto ni commits. Harness posterior **PENDIENTE**, sin herramienta shell disponible. No se declara T01 hecha, spec validada ni backend implementado. Reproducibilidad aislada, teclado manual adicional, Linux y remoto pendientes. Cambiar requisitos exigirá nueva revisión/aprobación; historial humano R3/P2/T2 intacto.

## Delta autorizado R4/P3/T3 — 2026-10-14 (histórico)
Procedencia: asignación del usuario/coordinador a este subagente, sin acceso a la sesión original. Cita transmitida: «No usemos docker ni postgresql local usemos el de supabase, autorizo las pruebas de navegador, ya usé una contraseña generada». Se reportan dos proyectos Free creados, dev y demo; no se comprobó conexión ni se recibieron/solicitaron credenciales. No se guardan URLs, referencias privadas ni secretos.
- R4 cambia RNF-05/07 y A07/A12: exclusivamente PostgreSQL Supabase remoto; pruebas backend aisladas en dev, nunca destructivas en demo. RF-01–25, Better Auth y gratuidad intactos.
- P3/T3 retiran Docker/DB local y actualizan T02, T03, T27/T28, comandos y dependencias. T01 recibe autorización para e2e/navigation.ts y playwright.config.ts: esperar montaje y arrancar Next, sin relajar aserciones funcionales.
- Propuesta operativa pendiente: schemas dedicados test/autoría/shadow, roles mínimos, allowlist privada y guardas de destino/operación. Revisión del aislamiento Prisma 7 y permiso explícito antes de conectar/provisionar/migrar/sembrar/limpiar. migrate dev y --create-only no son inocuos; no reset del proyecto compartido. Sin viabilidad demostrada se bloquea y consulta, no se instala DB local.
- Autorización de navegador no implica mutaciones remotas destructivas. Aprobación histórica no aprueba globalmente R4/P3/T3; solo consta autorización real del delta solicitado. Commits de código por tarea verificada y consulta de decisiones importantes siguen vigentes; ningún commit ejecutado aquí.
- Evidencia propia V4: skill sdd, lectura dirigida de AGENTS/MEMORY/constitution/ai-workflow/architecture, cuatro documentos activos, package.json, e2e/navigation.ts y playwright.config.ts; edición solo documentos asignados y MEMORY. Sin remoto, instalaciones, código, delegación o comandos de pruebas. Harness posterior PENDIENTE, sin shell disponible.
- Evidencia T01 procede del registro recibido en tasks.md: dominio 40/40, typecheck/build/harness OK; caso auth dirigido falla por montaje, suite completa NO VERIFICADA. No se ejecutaron aquí esos comandos; no es aceptación backend A01–A15.
- Revisión independiente del delta R4/P3/T3: PENDIENTE; ningún veredicto nuevo recibido. Siguiente: continuar T01 y repetir navegador; resolver revisión/permiso G1 antes de conexión T02. Preparación no equivale a conexión/despliegue.

Las secciones siguientes conservan el historial V3 y sus pendientes a esa fecha; Docker queda retirado por V4, no es bloqueo actual.

## Aprobación humana de ejecución — 2026-10-14
Procedencia: solicitud de esta fase transmitida por el usuario/coordinador al subagente documental; no consulta directa de la sesión original. Pregunta explícita reportada: «¿Apruebas especificación R3 y plan P2/tareas T2 para ejecutar cinco etapas?».
Respuesta del usuario transmitida (extracto con elipsis de la asignación, no transcripción íntegra): «Perfecto, trata de hacerlo de la mejor manera posible y brindandome la debida retroalimentación, no olvides de hacer commits en los cambios que hayan de codigo para mantener la versión ... para las decisiones importantes siempre consultame ... intervención hazmelo saber».
Se registra aprobación real de **R3/P2/T2 e I1–I5**, no derivada de la aceptación R1 ni del dictamen del reviewer. Autoriza ejecución local secuencial conforme a dependencias y puertas de revisión, no marca ninguna tarea hecha ni acredita pruebas. D1/D2/D4 y las concreciones de esta revisión quedan aprobadas; Docker/ERS, condiciones Hobby y compatibilidad ejecutada siguen pendientes de comprobar.
Nuevos contratos, cambios de requisitos y decisiones importantes vuelven al usuario; cambiar requisitos invalida aprobación previa. Informar avances, bloqueos e intervención requerida. Commits locales de código por tarea verificada, staging explícito solo de archivos propios asignados, sin cambios ajenos ni secretos. **Sin push autorizado**; recursos, migraciones y despliegues remotos requieren permiso separado, incluida T30. Este registro no ejecuta código ni crea commits.

## Procedencia y dictamen inicial conservado
Informe del reviewer transmitido por el usuario/coordinador en la solicitud de corrección. No se recibió transcripción completa de stdout, hash de commit ni identificador de sesión del revisor; no se reconstruyen ni inventan. Referencias de líneas corresponden a **P1/T1**, no a los documentos corregidos.

**Dictamen recibido: CAMBIOS NECESARIOS R2/P1/T1.**

Hallazgos transmitidos (transcripción):
1. «RF13 plan121,133-136 no define confirmación success seguida rejected o concurrentes; hash creación no cubre outcome. Precisar semántica propuesta, precedencia comprobación payload/terminal, 409 divergente vs replay igual, tests T21.»
2. «RF09 merge plan119/tasks137-141 sin regla cantidades solapadas, exceso stock/límite, parcialidad, mergeId distinto payload. Proponer explícitamente política conservadora con resultados observables para aprobación usuario, no afirmar aprobada.»
3. «RF25/RNF01 plan79,81 contador login por identificador sin ventana/umbral y sesión reciente indefinida; concretar parámetros y reautenticación/password actual más pruebas límites.»

## Evidencia recibida del reviewer (NO ejecutada por el planificador)
Transcripción del resumen recibido: «ejecutó git status --short/log -5/diff --stat/ls-files e historial spec002/diff manifiestos, spec002 untracked; node scripts/check-harness.mjs OK estructural; consultas oficiales auth/Supabase/Vercel confirmaron viabilidad condicional».

| Evidencia reportada | Resultado recibido y alcance |
| --- | --- |
| `git status --short`, `git log -5`, `git diff --stat`, `git ls-files`; historial spec002 y diff de manifiestos | spec002 **untracked** en la revisión inicial. No se facilitó comando completo de las dos últimas inspecciones ni salida íntegra; no se atribuye commit/base concreta ni se verifica el estado Git actual. |
| `node scripts/check-harness.mjs` | **OK estructural**, según reviewer inicial. No demuestra corrección de negocio, permisos runtime ni aplicación de propuestas; esta evidencia inicial precede a R3/P2/T2. La revisión posterior se registra abajo. |
| Consultas oficiales de auth/Supabase/Vercel | **Viabilidad condicional**, según reviewer. No es ensayo local/remoto, contratación ni garantía de gratuidad/disponibilidad. Fuentes de planificación ya documentadas en P2 §2, sin fingir consultas nuevas en esta ronda. |

El resultado estructural favorable inicial no cambió aquel dictamen **CAMBIOS NECESARIOS**, conservado como histórico. Este planificador no ejecutó comandos Git, Node, tests, Docker ni despliegues del reviewer.

## Matriz hallazgo → corrección propuesta → revisión documental recibida
| ID / requisito | Corrección documental propuesta | Ubicación / prueba futura | Estado |
| --- | --- | --- | --- |
| H1 RF-MIG-13 | Hash de confirmación distinto al de creación incluye outcome; comparar hash antes de terminal, primer commit válido fija respuesta; mismo payload reproduce, divergente 409, rollback no fija elección. Expiración explícita y concurrencia sin prioridad success. | Referencias del reviewer: spec:65,114; plan:144–155; tasks:152–153. Pruebas futuras: integración PostgreSQL, concurrencia, expiración y rollback. | **RESUELTO documentalmente según reviewer**; aprobado por usuario 2026-10-14; pruebas funcionales pendientes. |
| H2 RF-MIG-09 | Suma solapadas, valida canasta completa, rechazo total sin recorte ante invalidez/stock/500 unidades/50 lotes; expectedCartVersion, clave/hash antes de estado actual, replay éxito/rechazo y divergencia 409. UI conserva selección si falla. | Referencias del reviewer: spec:61,115; plan:132–139; tasks:140–141,164. Pruebas futuras: límites, versión, replay y conservación ante fallo. | **RESUELTO documentalmente según reviewer**; aprobado por usuario 2026-10-14; pruebas funcionales pendientes. |
| H3 RF-MIG-25 / RNF-MIG-01 | Login 5/60 s/IP y 10/900 s/email normalizado; ventanas/contadores/Retry-After definidos. Sesión password-auth <300 s más contraseña actual en cada cambio; refresh no reautentica, 5 cambios/900 s/cuenta. | Referencias del reviewer: spec:77,81,116; plan:79,81; tasks:54–55,66–67. Pruebas futuras: fronteras, atomicidad, reautenticación y bypass. | **RESUELTO documentalmente según reviewer**; aprobado por usuario 2026-10-14; pruebas de seguridad pendientes. |

## Informe posterior recibido: R3/P2/T2
Procedencia: informe de la sesión reviewer `ses_eca023728ffe1amYvePTaq7EBH`, transmitido por el coordinador en la asignación de cierre; recibido en fase anterior el 2026-10-13, registrado el 2026-10-14. No se consultó directamente esa sesión ni se recibió stdout completo o commit verificable.

Transcripción del veredicto recibido: «VEREDICTO APROBADO exclusivo corrección documental H1-H3 R3/P2/T2, no aprobación humana ni funcional».

Transcripción de evidencia recibida: «Reviewer realizó lectura/búsqueda cuatro documentos e inspección y ejecución node scripts/check-harness.mjs resultado OK estructural tras correcciones. Ningún bloqueante remanente en alcance revisión».

Este resultado cierra los hallazgos documentales H1–H3 en ese alcance, no acredita comportamiento implementado ni autoriza código. El harness reportado es posterior a las correcciones R3/P2/T2, pero anterior a este registro V2.

## Evidencia propia del cierre y puertas de avance
- V2: lecturas dirigidas y edición exclusiva de validation.md/MEMORY.md. V3: lectura de skill sdd, MEMORY, constitución, flujo y cuatro documentos de spec 002; actualización exclusiva de sus estados/aprobación y MEMORY. Sin cambios de requisitos/revisiones funcionales, delegación, código/configuración ni servicios; no hay código afectado por esta asignación documental.
- `node scripts/check-harness.mjs` tras este cierre: **PENDIENTE**, sin herramienta shell disponible. No ejecutado por este agente; el OK anterior pertenece al reviewer.
- A01–A15 son criterios previstos: **todos sin evidencia de implementación**. No confundir informe documental inicial con validación funcional.
- Revisión documental H1–H3 de R3/P2/T2: **APROBADO según informe recibido**; dictamen inicial y transcripciones conservados arriba. Estados de spec/plan/tasks sincronizados en V3 con revisión y aprobación humana posteriores, sin alterar contratos.
- Próximo paso: comprobar dependencias e iniciar T01/I1; respetar revisiones entre I1–I5 y consultar decisiones importantes nuevas. T01–T31 siguen pendientes.
- Spec permanece abierta, aprobada para ejecución pero no validada funcionalmente. Docker/ERS/condiciones Hobby y permisos externos permanecen pendientes. Harness posterior a V3 pendiente: sin shell disponible, no ejecutado por este agente.
