# Tareas 002 — Migración completa, dividida por incrementos

Revisión: T3 · Spec R4 / plan P3 · 2026-10-14
Estado: delta remoto/navegador expresamente autorizado; detalles operativos P3 pendientes de revisión. Historial R3/P2/T2 e I1–I5 aprobado y dictamen H1–H3 conservados en validation.md; no aprobación global nueva.
No permiso implícito de conexión/mutaciones remotas ni pasos T30. Push normal autorizado exclusivamente para VCS-01 tras verificaciones/revisión; RF de negocio intactos, referencias P2 a sus contratos siguen vigentes en P3.
Todas las casillas pendientes; T01 **H1 RESUELTO por revisión conjunta VCS-01**, sin cierre global ni backend; G1 **BLOQUEADA** por aclaración H2. VCS-01 publicada, CI Linux pendiente. Evidencia recibida en validation.md V7, no ejecutada por este escritor documental. Este estado prevalece sobre estados históricos de T01.

## Reglas de ejecución posterior
- 31 tareas en cinco incrementos (máximo 8 por incremento): I1–I5 autorizados; respetar dependencias y revisión de cada incremento antes del siguiente. Una tarea por llamada de implementador, sin delegación recursiva.
- Commits locales de código por tarea verificada; staging explícito de archivos asignados propios, excluyendo cambios ajenos y secretos. Push normal solo en alcance VCS-01, no force. Dar retroalimentación y avisar bloqueos/intervención; nuevos contratos y decisiones importantes vuelven al usuario, y cambios de requisitos invalidan aprobación previa.
- El coordinador asigna único escritor; archivos compartidos como package.json, schema.prisma, StoreContext y navegación se modifican secuencialmente. Cada tarea actualiza su estado/evidencia y memoria solo cuando el coordinador le asigne esa escritura.
- RF abreviados se refieren a RF-MIG de R3; RNF a RNF-MIG. Pruebas nuevas/regresión primero para negocio y autorización. «Hecho» exige evidencia ejecutada y revisión correspondiente; implementado no equivale a validado.
- Comandos mencionados son **por ejecutar** tras aprobación, en entorno de pruebas. Scripts nuevos se crearán en T02 y tareas dueñas; no se afirma que existan actualmente. Nunca reset, semilla o migración remota sin permiso explícito y guard de destino.
- Dependencia común G0: aprobación histórica R3/P2/T2, D1/D2/D4 recibida; delta sin Docker/DB local y navegador autorizado. T01 puede continuar; G1 para todas las tareas de persistencia: revisión de aislamiento P3 §5/9, configuración privada y permiso explícito para conexión y cada clase de operación remota/destino. Sin G1 se prepara offline, no se conecta ni muta. ERS faltante no amplía reglas educativas. Reviewer H1–H3 no acredita este delta ni permisos remotos.

## VCS-01 — Integrar y versionar harness existente antes de continuar (tarea separada)
- [ ] **Estado: PUBLICADA, pendiente CI Linux.** Reviewer conjunto **APROBADO exclusivamente VCS-01/H1**; publicación normal confirmada por informe del implementer. Autorización recibida 2026-10-15 mediante coordinador: primero commits/versionar/subir Git, después el resto. No backend, G1 ni cambio de requisitos; no tercera corrección automática T01. Casilla abierta hasta cumplir todo el criterio.
- RF-HAR-01/04/05; RNF-HAR-01/03 y RNF-MIG-07. Depende del inventario Git y delimitación explícita de archivos, no de levantar G1.
- Secuencia de una única tarea: alinear documentación → integrar harness existente en commit separado → commit de continuidad → reproducción limpia/verificaciones → revisión conjunta → push normal a origin/main y comprobar resultado. Si remoto diverge, detener e informar, nunca force.
- Archivos del primer commit previsto: `package.json`, `package-lock.json`, `.npmrc`, `.nvmrc`, `.github/workflows/verify.yml`, scripts `check-environment.mjs`/`check-harness.mjs`, `.opencode/`, `opencode.jsonc`, `docs/`, `AGENTS.md`, `README.md`, `specs/001-harness/`. Inventariar rutas concretas y revisar diff antes de stage; no incluir automáticamente archivos ajenos/secretos por pertenecer a esos directorios.
- Segundo commit previsto: `MEMORY.md` y documentos existentes `specs/002-migracion-fullstack/`, continuidad e historial sin alterar requisitos ni resolver H2.
- `next-env.d.ts`: cambio generado reportado; excluir/preservar hasta que la verificación justifique una decisión explícita, no borrar ni restaurar automáticamente.
- Asignación documental previa: planner alineó docs y registros sin shell. Implementer VCS-01 autorizado completó AGENTS/README y corrigió referencias de despliegue/traceability: salida Next real `dist/next/`, Netlify legado. Perfiles/configuración existentes integrados sin rediseño; spec/plan/validation y spec001 conservan su historial, no se declara su cierre.
- Hecho cuando: dos commits delimitados revisados, checkout limpio reproducible con Node/npm fijados y lockfile; `npm ci`, `env:check`, `harness:check`, `npm test`, `typecheck`, `build` y regresión navegador pertinente con Chromium registrados; comprobar diferencias/secretos y estado Git; revisión conjunta con procedencia, push normal confirmado y CI Linux registrado (o bloqueo explícito, sin marcar hecha). Workflow actual no incluye E2E: ejecutarlo aparte. Auditoría producción/toolchain debe conservar riesgos, no ejecutar fix implícito.
- Evidencia ejecutada por implementer VCS-01 (Windows, 2026-10-15): `git fetch origin` OK; `git rev-list --left-right --count HEAD...origin/main` inicial 1/0, remoto único GitHub Usuario03/Proyecto-Ra-z-del-R-o-, sin divergencia. Commit previo 06c281e preservado. Commit harness `69ea40071e2f30ed4a70d17d51bfd456ee252589`: 42 archivos, +864/-17; segundo commit de continuidad incluye exclusivamente MEMORY y los cuatro documentos 002 (hash consultable en Git, no autorreferencial).
- Reproducción candidata aislada: `git archive HEAD` de 06c281e más lista explícita de 47 archivos asignados, sin node_modules, env ni artefactos copiados, en `%LOCALAPPDATA%/Temp/opencode/vcs01-candidate-20261015`. Node 24.14.1/npm 11.11.0 ya instalados; no instalación global. Secuencia exacta workflow: `npm ci` → `npm run env:check` → `npm run harness:check` → `npm test` (40/40) → `npm run typecheck` → `npm run build`: todos exit 0. Build Next 16.4.0 genera / y /_not-found estáticas, sin DB.
- Antes de instalar/build, `dist/next/types/routes.d.ts` no existía; typecheck previo al build pasó sin cambios técnicos. `next-env.d.ts` usa rutas productivas del commit en la copia; versión dev generada del working tree excluida y preservada. No fue necesario corregir configuración ni fuentes.
- `npm run test:e2e`: 48/48, 1.6 min, Chromium disponible, escritorio/móvil/axe; inicia build/preview Next sin reutilizar servidor. `npm audit --omit=dev --json`: 0 vulnerabilidades, exit 0. `npm audit --json`: exit 1, 7 (2 moderate/5 high) en toolchain; riesgo DoS con patrones/CSS no confiables permanece, sin fix/major/overrides.
- Seguridad/integración: inventario explícito 42+5 rutas; scan de patrones de claves privadas/tokens/JWT/URLs DB con contraseña sin imprimir valores: 0 archivos candidatos señalados (no garantía exhaustiva). `git diff --check` y `git diff --cached --check` OK; warnings Git LF→CRLF, npm audit 7 conocidos; sin warnings nuevos de build. Evidencia de ejecución anterior no se reatribuye a reviewer.
- Actualización recibida 2026-10-15, posterior a la evidencia candidata: reviewer `ses_ec1ad937dffeezwN61lUPNz16m`, **APROBADO VCS-01/H1**, conjunto base `2e892da` → `06c281e` → `69ea400` → `ddc83e0`. Archive limpio del reviewer: npm ci/env/harness/typecheck antes del build/build, todos exit 0 en Windows Node 24.14.1/npm 11.11.0. Git/status/diff y scan de 59 archivos propios del reviewer: sin candidatos a secreto; CI/OpenCode estáticos sin bloqueante. Suites 40/40 y 48/48 y prod 0 recibidos por reviewer, no repetidos; 7 toolchain (2 moderate/5 high) confirmados por npm ci. Transcripción/procedencia completa en validation.md V7; no ejecutado por este escritor.
- Publicación recibida del implementer: fetch exit 0, ahead 3/behind 0; `git push origin main` normal exit 0; `git ls-remote --exit-code origin refs/heads/main` exit 0, remoto `ddc83e0128a723d411429c0996b211f28db6af40` = HEAD, final ahead 0/behind 0. `next-env.d.ts` generado era el único dirty reportado: preservado, no editar/restaurar.
- Pendientes **NO VERIFICADOS**: CI Linux, gh ausente en PATH y sin URL/estado de ejecución recibido; teclado manual adicional y runtime de permisos/modelos/MCP. H1 resuelto, G1/H2 bloqueadas, spec 001 abierta; ninguna conexión Supabase/migración/despliegue acreditada. Este cierre documental requiere commit adicional posterior y no se declara ya publicado. Harness posterior a esta edición pendiente, sin shell disponible.

## I1 — Fundamento reproducible (5 tareas)

**Estado G1 (2026-10-15): BLOQUEADA.** Reviewer `ses_ec1c7c277ffe1p116OGM3cToqn`: T02 documental **CAMBIOS NECESARIOS**, H2 RNF-03/05 (plan:179,182–193; tasks:223 antes de este cierre). [NECESITA ACLARACIÓN] Decisión matriz operación/destino/rol/autorización: prohibición absoluta de pruebas destructivas demo frente a migración operativa futura autorizable. No se modifica política ni se autoriza conexión; T02 no iniciada. La indicación histórica de continuar T01 en G0 queda suspendida por el cierre bloqueado.

- [ ] **T01 — Preparar base Next.js sin reescribir la interfaz.** RF-01; RNF-04/07.
  - **Estado vigente (2026-10-15): H1 RNF-07 RESUELTO por revisión conjunta VCS-01**, reviewer `ses_ec1ad937dffeezwN61lUPNz16m`: **APROBADO VCS-01/H1**, conjunto base `2e892da` → `06c281e` → `69ea400` → `ddc83e0`. Reproducción en archive limpio comprobada por reviewer, incluido typecheck antes del build. Sustituye bloqueo H1 del informe V5, conservado en validation.md; no revalida aisladamente `06c281e`, no constituye tercera corrección ni acredita backend. Casilla abierta en este cierre acotado: CI Linux pendiente en VCS-01, sin cierre global ni levantamiento G1/H2. Evidencia recibida en validation.md V7, no ejecutada aquí; rondas inferiores son historial.
  - Depende de: G0.
  - Archivos asignados: `package.json`, `package-lock.json`, `next.config.ts`, `next-env.d.ts`, `tsconfig.json`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/client/PrototypeShell.tsx`, `tailwind.config.js`, `e2e/navigation.ts`, `playwright.config.ts` (estos dos añadidos por autorización de navegador recibida en T3); `e2e/admin.spec.ts`, `e2e/auth.spec.ts`, `e2e/dual.spec.ts`, `e2e/profile.spec.ts` añadidos por coordinador el 2026-10-15 en ronda 2, ajuste técnico de selectores bajo autorización de pruebas navegador, sin nuevo contrato/requisito.
  - Hecho cuando: versiones P2 exactas resueltas sin RC, App Router en español monta shell cliente y estilos/activos sin acceso localStorage durante SSR; no se declara backend completo. Si cambia compatibilidad, volver al plan.
  - Evidencia pendiente: metadatos versiones fijadas, `npm ci`, `npm run typecheck`, `npm run build`; registrar warnings/peers, no ocultarlos.
  - Estado T01 (2026-10-14): **BLOQUEADA**, código parcial sin commit ni cierre. Registro npm reconfirmado con `npm view` para next 16.4.0, react/react-dom y tipos 19.3.0; `npm ls` confirma árbol sin peers inválidos. Node v24.14.1/npm 11.11.0. `npm install --package-lock-only --ignore-scripts` OK con warning ERESOLVE sobre React 18 del lock previo; `npm ci` OK, sin ese warning. Ambos reportan 8 vulnerabilidades (2 moderate, 6 high); `npm audit --json` exit 1: cadena Tailwind 3/braces/micromatch/chokidar/fast-glob y postcss/source-map-js; no se ejecutó fix ni cambio major.
  - Verificación: antes de instalar, `npm test`/`npm run typecheck` fallaron por tsx/tsc ausentes. Tras instalar: `npm test` 40/40; `npm run typecheck` OK antes/después del build; `npm run build` OK, `/` estática, sin DB. Next añadió allowJs a tsconfig y mostró aviso de telemetría. `npm run harness:check` OK estructural. HTTP local 200, lang=es y fallback de carga SSR; shell usa dynamic ssr:false. No se acredita backend.
  - Regresión: `npm run preview -- --port 4173` inició Next local; E2E reutiliza ese servidor. Primer `npm run test:e2e`: 48 fallos de arranque por Chromium ausente. `npx playwright install chromium` OK. Segundo E2E abortado por timeout global 240 s (3 casos pasaron, 9 fallaron hasta ese momento); repetición `npm run test:e2e -- e2e/auth.spec.ts --project=desktop --grep "correo duplicado"`: 1 fallo reproducible a 45 s en navigation.ts:8→4. isVisible inmediato durante carga del shell interpreta ausencia temporal de login como sesión activa y busca Mi cuenta; snapshot final sí muestra Iniciar sesión. Suite completa **NO VERIFICADA**.
  - Decisión recibida T3: autorizados `e2e/navigation.ts` para esperar montaje antes de consultar sesión y `playwright.config.ts` para iniciar Next directamente (dev:next o build/preview; no flags Vite). Regresión navegador autorizada, no escrituras DB remotas implícitas. Siguiente: corregir esos archivos, repetir caso auth dirigido y suite pertinente/completa, revisar auditoría y preparar commit con staging parcial que excluya cambios preexistentes package/lock. Bloqueo de permiso resuelto, regresión técnica pendiente. Docker eliminado como dependencia; sin despliegue ni conexión remota.
  - Ronda 1, cierre 2026-10-15: **BLOQUEADA**, sin commit. navigation.ts espera con expect(...or(...)).toBeVisible el control login/cuenta antes de decidir sesión; sin sleeps ni relajación de assertions. playwright.config.ts ejecuta `npm run build && npm run preview -- --port 4173`, reuseExistingServer:false para no probar Vite accidentalmente. Caso dirigido `npm run test:e2e -- e2e/auth.spec.ts --project=desktop --grep "correo duplicado"`: ya supera montaje/login, falla en auth.spec.ts:90 por strict mode: alerta de negocio + alerta vacía del anunciador accesible Next. `npm run test:e2e` completo, ejecutado dos veces (antes/después del parche transitivo): **26 passed / 22 failed, 2.1 min**; los 22 fallos son selectores getByRole('alert') ambiguos en admin/auth/dual/profile, no timeout de montaje.
  - Auditoría ronda 1: `npm audit --omit=dev --json` inicial detectó source-map-js 1.2.1 vía PostCSS/Next (GHSA-68fv-2mgg-jv7q, DoS por offsets de sourcemaps). `npm view source-map-js version --json` confirmó 1.2.2; `npm update source-map-js --package-lock-only --ignore-scripts` + `npm ci` OK, parche compatible sin major. Audit producción posterior **0 vulnerabilidades**. Audit completo exit 1: **7 (2 moderate/5 high)** en toolchain Tailwind 3; GHSA-vfj7-8cjw-p6xm (braces, patrones profundamente anidados) y GHSA-rj75-hqrm-r3gf (selector-parser, complejidad cuadrática). `npm ls` confirmó cadenas; `npm view braces version --json` devuelve 3.0.3 todavía afectado; selector-parser corregido 7.1.6 frente a 6.1.4 instalado. npm propone Tailwind 4.3.3 major: no aplicado, sin overrides forzados. Exposición restante: DoS de build/watch procesando patrones/CSS no confiables; no se identificó ruta HTTP T01 que procese esas entradas, ni se acredita ausencia universal de explotación. Revisión de toolchain antes de aceptar fuentes no confiables; no bloquear por sí sola esta transición local, sí mantener riesgo explícito.
  - Verificaciones tras parche transitivo: `npm test` **40/40**, `npm run typecheck` y `npm run build` **OK**; E2E resultados anteriores. `npm run harness:check` OK estructural y `git diff --check` OK; warnings Git LF→CRLF, npm audit 7 conocidos; build sin warnings nuevos. No remoto/DB/Docker. Instalación reproducible comprobada con npm ci de nuevo.
  - Permiso adicional requerido para cerrar regresión: `e2e/admin.spec.ts`, `e2e/auth.spec.ts`, `e2e/dual.spec.ts`, `e2e/profile.spec.ts`: acotar alertas al componente/formulario/diálogo de negocio conservando mensajes esperados y unicidad. No eliminar/ocultar anunciador accesible Next ni usar first() para silenciar ambigüedad. Archivos fuera de permiso intactos. Índice vacío; cambios ajenos iniciales preservados. Commit condicionado a nueva regresión satisfactoria y reviewer pendiente.
  - **Estado vigente ronda 2 (2026-10-15): IMPLEMENTADA, pendiente reviewer**, casilla sin marcar hasta revisión; sustituye los bloqueos técnicos históricos anteriores. Alertas acotadas por rol + texto comercial esperado mediante filter(hasText), conservando toContainText y strict mode (no first/skip/force/sleeps); anunciador Next intacto. No cambios de UI/negocio ni DB/remoto. Tailwind.config.js no necesitó cambios: su glob src ya cubre App Router.
  - Evidencia final ejecutada: `npm run test:e2e` **48 passed (1.7m)**, escritorio/móvil, incluyendo auth antes fallido, flujos comerciales y axe existentes; `npm test` **40/40**; `npm run typecheck`, `npm run build`, `npm run harness:check`, `git diff --check` y `git diff --cached --check` **OK**. Build Next 16.4.0 prerenderiza / y /_not-found; sin warnings nuevos. Git avisa conversión LF→CRLF. `npm audit --omit=dev --json` **0 vulnerabilidades**, `npm audit --json` **7 (2 moderate/5 high), exit 1**, igual que ronda 1 tras parche; antes del parche eran 8. Riesgo toolchain/fixes mayor pendientes descritos arriba, no eliminado ni ocultado. Prueba manual de teclado adicional y Linux **NO VERIFICADOS** en esta tarea; Playwright/axe no acreditan certificación.
  - Commit código local **06c281edfade51ed0c62d04342ea34755246a9e7** (`feat: preparar shell Next App Router y regresión navegador T01`), 14 archivos: package/lock (staging parcial), tsconfig, next-env/config, layout/page/PrototypeShell, playwright.config y e2e navigation/admin/auth/dual/profile. Sin docs, secretos ni push. El índice excluyó explícitamente packageManager/engines y scripts typecheck/harness/env preexistentes, también engines raíz del lock; permanecen en working tree. Verificaciones realizadas sobre working tree con ese harness previo, no sobre un checkout aislado del commit. Coordinador debe integrar el harness por separado para reproducir esos scripts desde Git.
  - Git restante tras commit: README.md, package.json y package-lock.json modificados por cambios preexistentes; sin seguimiento .github/, .npmrc, .nvmrc, .opencode/, AGENTS.md, MEMORY.md, docs/, opencode.jsonc, scripts/check-environment.mjs, scripts/check-harness.mjs y specs/. Índice vacío; documentación asignada actualizada fuera del commit. Ninguna otra tarea iniciada ni spec declarada validada.

- [ ] **T02 — Preparar conexión Supabase segura y harness aislado dev.** RF-02; RNF-05/07/09.
  - Depende de: T01; G1 para cualquier conexión/provisión/ensayo remoto. Proyectos Free dev/demo creados según usuario, no verificados; sin instalar Docker/PostgreSQL local.
  - Archivos asignados: `.env.example`, `package.json`, `package-lock.json`, `scripts/check-environment.mjs`, `scripts/database-target.ts`, `tests/integration/helpers/database.ts`, `tests/integration/environment.test.ts`.
  - Hecho cuando: configuración distingue runtime pool/CLI directa o sesión/test/shadow; TLS verificado y credenciales fuera del chat/repo/logs; guardas P3 §9 rechazan demo, destino desconocido, app compartida y permisos excesivos. Tras permiso, demostrar conexión PostgreSQL real a schema dedicado dev con rol acotado, sin reset del proyecto. `test:integration` usa ese aislamiento; db:check-target offline por defecto. Auth sigue Better Auth.
  - Evidencia pendiente: tests offline de guardas y `npm run env:check`; tras permiso, verificar versión/rol/schema/search_path, aislamiento y negativas sin tocar demo. Registrar solo resultado anonimizado. Sin permiso/configuración segura: BLOQUEADA parte remota, no marcada hecha. Shadow/autoría y SQL se revisan en T03; navegador no autoriza conexión implícita.

- [ ] **T03 — Crear persistencia auth/perfiles y migración M01.** RF-02/03/23; RNF-02/03.
  - Depende de: T02 y G1 para migración/semilla/limpieza; estrategia shadow revisada P3 §5/9.
  - Archivos asignados: `prisma/schema.prisma`, `prisma/migrations/*_identity/`, `prisma.config.ts`, `src/server/db.ts`, `src/server/env.ts`, `scripts/database-target.ts`, `scripts/migrate-database.ts`, `tests/integration/identity-schema.test.ts`, `.env.example`, `package.json`, `package-lock.json`.
  - Hecho cuando: Prisma 7/pg distingue URL runtime/CLI, tablas auth revisadas, perfil único/rol coherente y privilegios mínimos; aplicar M01 dos veces no duplica; no migrar schemas Supabase administrados.
  - Evidencia pendiente: `npx prisma validate`, `npx prisma generate`; `npm run db:migrate` aplica SQL revisado a aislamiento dev vacío autorizado y comprueba status con guardas. `npx tsx --test tests/integration/identity-schema.test.ts` usa helper obligatorio. `migrate dev --create-only` únicamente en autoría/shadow separados autorizados; puede resetear shadow, no ejecutar sobre proyecto compartido ni aceptar reset ante drift. Si privilegios/schema no garantizan aislamiento, bloquear y consultar, no improvisar DB local.

- [ ] **T04 — Extraer reglas puras conservando límites/COP/fechas.** RF-07/10/11/16/19; RNF-08.
  - Depende de: T01.
  - Archivos asignados: `src/domain.ts`, `src/domain.test.ts`, `src/domain/commerce.ts`, `src/domain/environment.ts`, `src/domain/time.ts`, `src/domain/commerce.test.ts`, `src/domain/time.test.ts`, `package.json` (descubrimiento tests).
  - Hecho cuando: tests previos/regresión conservan unidades y límites; BigInt COP y Bogotá/UTC explícitos, reglas no importan React/localStorage. No retirar todavía adaptadores UI no migrados.
  - Evidencia pendiente: `npm test`, `npm run typecheck`; casos 2 peces/750 g/10.001 COP y fronteras de fechas/talla.

- [ ] **T05 — Contrato común HTTP, origen, DTO y errores seguros.** RF-01/04/20; RNF-01/09.
  - Depende de: T03.
  - Archivos asignados: `src/contracts/common.ts`, `src/server/http/errors.ts`, `src/server/http/origin.ts`, `src/server/http/limits.ts`, `src/client/api.ts`, `tests/integration/http.test.ts`.
  - Hecho cuando: validación runtime, payload/paginación/orígenes P2, errores sin SQL/secreto y contadores atómicos; 401/403/404/409/413/422/429/503 diferenciados y sin bypass header/origin.
  - Evidencia pendiente: tests JSON inválido/cross-site/rate limit concurrente/dependencia caída, `npm run test:integration`, typecheck.

**Puerta I1:** entorno y contratos revisados; no marcar migración funcional completada. Comandos y limitaciones del revisor pendientes.

## I2 — Identidad y perfiles reales en backend (5 tareas)

- [ ] **T06 — Integrar única autenticación y sesión Better Auth.** RF-03/04/22; RNF-01/05.
  - Depende de: T03/T05; D1 aprobado.
  - Archivos asignados: `src/server/auth.ts`, `src/server/authorization.ts`, `src/server/http/limits.ts`, `src/app/api/auth/[...all]/route.ts`, `src/lib/auth-client.ts`, `tests/integration/auth.test.ts`, `prisma/schema.prisma` y nueva migración auth solo si esquema generado lo exige.
  - Hecho cuando: cookies/expiración/revocación/orígenes P2, login 5/60 s/IP y 10/900 s/identificador con ventanas/contadores atómicos §4; timestamp passwordAuthenticatedAt ligado a sesión solo por login contraseña, no por refresh. Sin PIN/hash cliente/identidad demo; comprobar sesión DB. Catch-all no evade wrappers.
  - Evidencia pendiente: `npm run test:integration`, typecheck/build; pruebas login 5/6 por IP, 10/11 por mismo email con IP distintas, trim/minúsculas equivalentes, cuenta inexistente y éxito cuentan, rechazo no extiende ventana, 59.999/60 s y 899.999/900 s, concurrencia N+1 y Retry-After. Signup/signin/logout/expiry/cookie/origen/refresh sin elevar frescura, PostgreSQL real. No ejecutar aún.

- [ ] **T07 — Alta por rol y provisión exclusiva de administrador.** RF-04/23; RNF-01/02.
  - Depende de: T06.
  - Archivos asignados: `src/contracts/profile.ts`, `src/server/services/profiles.ts`, `src/app/api/me/route.ts`, `src/app/api/me/onboarding/route.ts`, `scripts/provision-admin.ts`, `prisma/seed.ts`, `tests/integration/onboarding.test.ts`.
  - Hecho cuando: onboarding client/fisher idempotente, datos ficticios validados, sin escalada admin/cambio de rol; cuenta incompleta no obtiene permisos. CLI admin necesita operación local explícita/secreto protegido y no existe endpoint público equivalente.
  - Evidencia pendiente: pruebas de rol falsificado, registro duplicado/fallido/reintentado, propiedad y semillas sin credenciales fijas; provisión solo en DB test y verificación permisos.

- [ ] **T08 — Editar perfil y credenciales con reautenticación.** RF-05/22/25; RNF-01.
  - Depende de: T07.
  - Archivos asignados: `src/server/services/profiles.ts`, `src/app/api/me/profile/route.ts`, `src/app/api/me/credentials/route.ts`, `src/server/auth.ts`, `src/app/api/auth/[...all]/route.ts`, `tests/integration/profile.test.ts`.
  - Hecho cuando: nombre/teléfono/dirección propios; email/password vía biblioteca con currentPassword en cada petición **y** autenticación de sesión hace <300 s; a >=300 s exigir nuevo signin (403 REAUTHENTICATION_REQUIRED). Password incorrecta aun con sesión fresca →403 INVALID_CURRENT_PASSWORD. Máximo 5 cambios/900 s/cuenta, unicidad, revocación otras sesiones y sin bypass catch-all ni verificación obsoleta concurrente; no SMTP/recuperación ficticia.
  - Evidencia pendiente: tests 299.999/300 s, timestamp ausente/futuro, refresh no reautentica, login nuevo habilita pero sigue exigiendo contraseña; password incorrecta y 5/6 peticiones en 900 s, límites concurrentes; email duplicado/otro usuario/revocación/direct endpoint/cambio simultáneo. `npm run test:integration`, typecheck; A15 pendiente de ejecución.

- [ ] **T09 — Conectar UI de acceso y navegación por sesión.** RF-03/04/22/23; RNF-04.
  - Depende de: T07/T08.
  - Archivos asignados: `src/auth/AuthModule.tsx`, `ClientAccess.tsx`, `AdminAccess.tsx`, `FisherRegistration.tsx` dentro de `src/auth/`; `src/fisher/FisherLogin.tsx`, `src/PlataformaPescaDual.tsx`, `src/SiteHeader.tsx`, `src/client/session.ts`, `src/app/acceso/page.tsx`, `e2e/auth.spec.ts`, `e2e/navigation.ts`.
  - Hecho cuando: registro/login de roles usan servidor, sin ingreso rápido/selector de identidad confiado/PIN mostrado; error/carga/teclado/foco conservados; logout limpia caches y no vuelve a datos privados con Atrás. Nota de demo distingue backend y email no verificado.
  - Evidencia pendiente: `npm run test:e2e -- e2e/auth.spec.ts`, typecheck/build, sesión nueva y falsificación localStorage no autorizan.

- [ ] **T10 — Conectar perfil comprador y controles de credenciales.** RF-05/25; RNF-04.
  - Depende de: T09.
  - Archivos asignados: `src/buyer/CustomerProfile.tsx`, `src/app/cuenta/perfil/page.tsx`, `src/client/session.ts`, `e2e/profile.spec.ts`.
  - Hecho cuando: formulario conserva edición válida, distingue cambio de credenciales, pide contraseña actual cada vez; 403 REAUTHENTICATION_REQUIRED guía a nuevo login y reenvío explícito, no retry automático. 429 informa espera sin divulgar cuenta; explica ausencia de recuperación por correo, no guarda secretos persistentes.
  - Evidencia pendiente: `npm run test:e2e -- e2e/profile.spec.ts`, teclado/etiquetas y sesiones revocadas comprobadas.

**Puerta I2:** revisión independiente de contratos de sesión/roles antes de exponer escrituras comerciales; informe pendiente.

## I3 — Oferta, fotos y ambiente compartidos (7 tareas)

- [ ] **T11 — Modelo catálogo/ambiental/media y semilla M02.** RF-06–08/16/24; RNF-02/03/08.
  - Depende de: T03/T04/T07.
  - Archivos asignados: `prisma/schema.prisma`, `prisma/migrations/*_catalog/`, `prisma/seed.ts`, `tests/integration/catalog-schema.test.ts`.
  - Hecho cuando: especie/lote/pescador separados, CHECK unidades/precios/fechas/stock, FK media/propietario; baja lógica; reglas y simulación talla educativas. Seeds sin datos personales reales ni credenciales publicadas.
  - Evidencia pendiente: migrar vacía/M01→M02, constraints invalid input/rollback, `npm run test:integration`.

- [ ] **T12 — Almacenamiento fotos con validación y compensación.** RF-07/24; RNF-01/05/09.
  - Depende de: T05/T06/T11.
  - Archivos asignados: `src/contracts/media.ts`, `src/server/services/media.ts`, `src/server/storage/types.ts`, `local.ts`, `supabase.ts` dentro de `src/server/storage/`; `src/app/api/media/route.ts`, `src/app/api/media/[id]/route.ts`, `scripts/cleanup-media.ts`, `tests/integration/media.test.ts`, `package.json`.
  - Hecho cuando: límite tamaño/tipo/decodificación/cuota atómica, archivos locales reales y adaptador remoto configurado sin secretos públicos, estados pending/ready/attached y limpieza segura; uploads ajenos/paths arbitrarios rechazados.
  - Evidencia pendiente: pruebas con bytes reales, corrupto/SVG/bomba pixel/exceso/objeto huérfano/caída DB; `npm run test:integration`. Smoke Supabase explícitamente pendiente hasta autorización externa, no sustituido por mocks.

- [ ] **T13 — API catálogo público y capturas/inventario privados.** RF-06–08/11/17; RNF-01/02.
  - Depende de: T04/T11/T12.
  - Archivos asignados: `src/contracts/catalog.ts`, `capture.ts` dentro de `src/contracts/`; `src/server/services/catalog.ts`, `captures.ts`, `inventory.ts` dentro de `src/server/services/`; `src/app/api/catalog/route.ts`, `species/route.ts`, `fishers/[id]/route.ts`, `lots/route.ts`, `lots/[id]/route.ts` bajo `src/app/api/`; `tests/integration/catalog.test.ts`, `inventory.test.ts`.
  - Hecho cuando: DTO público no filtra campos privados, publicación atribuye sesión, valida media/reglas/límites; stock con versión y retiro lógico, sin alterar históricos ni aceptar fisherId manipulado.
  - Evidencia pendiente: autorizado/otro dueño/stock negativo/foto ajena/veda/talla/version stale; integración y tests dominio.

- [ ] **T14 — API ambiental y auditoría exclusivamente admin.** RF-16/17; RNF-01/08.
  - Depende de: T11/T13.
  - Archivos asignados: `src/contracts/environment.ts`, `src/server/services/environment.ts`, `src/app/api/environment/rules/[speciesId]/route.ts`, `src/app/api/environment/audit/route.ts`, `src/app/api/environment/demo/route.ts`, `tests/integration/environment.test.ts`.
  - Hecho cuando: controles/talla simulada auditados con actor servidor y versión, no admin rechazado, locks compatibles checkout; parámetros educativos, sin crear calendario legal o notificaciones.
  - Evidencia pendiente: autorización y fronteras ambientales, update concurrente/version, integración PostgreSQL.

- [ ] **T15 — Integrar catálogo, captura e inventario UI.** RF-06–08/17; RNF-04.
  - Depende de: T13.
  - Archivos asignados: `src/PlataformaPescaFrontend.tsx`, `src/client/catalog.ts`, `src/fisher/CaptureWizard.tsx`, `QuantityPriceStep.tsx`, `InventoryItem.tsx`, `InclusiveControls.tsx` dentro de `src/fisher/`; `e2e/inventory.spec.ts`.
  - Hecho cuando: filtros/origen conservados, imagen llega al backend, carga/error/version stale visibles, no mutación Store autoritativa ni éxito antes de respuesta. Cantidades kg/peces y ayudas preservadas.
  - Evidencia pendiente: E2E captura→otro navegador→stock/pausa/retiro, foto rechazada, error backend y responsive.

- [ ] **T16 — Perfil y foto pescador persistentes sin PIN.** RF-24; RNF-01/04.
  - Depende de: T12/T09/T15.
  - Archivos asignados: `src/app/api/me/photo/route.ts`, `src/server/services/profiles.ts`, `src/fisher/FisherPortal.tsx`, `src/app/pescador/page.tsx`, `tests/integration/fisher-profile.test.ts`, `e2e/profile.spec.ts`.
  - Hecho cuando: avatar propio se actualiza vía mediaId, origen/miembro ficticio claros, PIN eliminado; foto ajena no asociable, cuenta sin rol no entra al portal.
  - Evidencia pendiente: integración propiedad + E2E reload/cambio cuenta/foto y accesibilidad.

- [ ] **T17 — Integrar panel ambiental y avisos internos.** RF-16/17; RNF-04.
  - Depende de: T14/T15.
  - Archivos asignados: `src/admin/AdminDashboard.tsx`, `src/app/administracion/page.tsx`, `src/buyer/EnvironmentalEducation.tsx`, `e2e/admin.spec.ts`.
  - Hecho cuando: controles y simulación talla usan API, auditoría visible al admin, catálogo revalida restricciones; no mostrar como normas oficiales ni avisos externos.
  - Evidencia pendiente: E2E admin/captura restringida/rol falsificado y contraste con auditoría DB.

**Puerta I3:** paridad de oferta/ambiente e identidad documentada; no equivale a comercio transaccional terminado.

## I4 — Canasta, compra simulada y pedido histórico (8 tareas)

- [ ] **T18 — Modelo comercial y restricciones M03.** RF-09–15/18/19; RNF-02/03.
  - Depende de: T11.
  - Archivos asignados: `prisma/schema.prisma`, `prisma/migrations/*_commerce/`, `tests/integration/commerce-schema.test.ts`.
  - Hecho cuando: canasta/merge con hash y respuesta estable; intento con hash creación separado de confirmationHash/respuesta (§7 P2), constraints de unicidad; snapshots/order/fulfillment y COP exactos; snapshots no editables por contrato/rol, sin cascade destructivo; M02→M03 conservador.
  - Evidencia pendiente: migraciones vacía/upgrade, restricciones BigInt/unique/FK y rollback en PostgreSQL real.

- [ ] **T19 — API de canastas con fusión invitada idempotente.** RF-09/10/20; RNF-01/02.
  - Depende de: T13/T18.
  - Archivos asignados: `src/contracts/cart.ts`, `src/server/services/carts.ts`, `src/app/api/cart/route.ts`, `src/app/api/cart/lines/[lotId]/route.ts`, `src/app/api/cart/merge/route.ts`, `tests/integration/cart.test.ts`.
  - Hecho cuando: política P2 §6.1 implementada tras aprobación: sumar solapadas y validar canasta completa; rechazo total ante cualquier exceso/invalidez sin recorte/parcialidad ni versión modificada. Mismo mergeId/hash reproduce resultado antes de comprobar versión/stock actuales; hash divergente 409. Registrar rechazo de dominio/versionado estable, no errores técnicos; no ownerId cliente ni reservas.
  - Evidencia pendiente: `npm run test:integration` con 2+3/stock5→5 y stock4→rechazo íntegro, segundo lote válido tampoco aplicado; 500/501 unidades y 50/51 lotes; stock/veda/retiro/version stale; duplicate lotId inválido, orden distinto equivalente; replay éxito/rechazo y clave diferente con acción explícita, mismo mergeId payload distinto y simultáneos iguales/distintos, rollback sin consumir clave; A14 no ejecutada.

- [ ] **T20 — Intento/cotización y resultados simulados servidor.** RF-10/11/13/18/20; RNF-01/08.
  - Depende de: T04/T18/T19.
  - Archivos asignados: `src/contracts/checkout.ts`, `src/server/services/checkout.ts` (cotización/intentos), `src/app/api/checkout/attempts/route.ts`, `src/app/api/checkout/attempts/[id]/route.ts`, `src/app/api/checkout/attempts/[id]/expire/route.ts`, `tests/integration/attempts.test.ts`.
  - Hecho cuando: snapshot servidor y entrega/calendario, expiry correcto, clave/hash impide replay divergente, GET solo observa; no PAN/CVV ni conexión bancaria. Vencimiento/rechazo no descuenta.
  - Evidencia pendiente: creación repetida, expiración reloj controlado, identidad ajena/datos sensibles rechazados y pool/DB failure.

- [ ] **T21 — Confirmación atómica y concurrencia sin sobreventa.** RF-11–13/18/20; RNF-02.
  - Depende de: T14/T20.
  - Archivos asignados: `src/server/services/checkout.ts` (confirmación), `src/server/transactions.ts`, `src/app/api/checkout/attempts/[id]/confirm/route.ts`, `tests/integration/checkout.test.ts`.
  - Hecho cuando: P2 §7 fija confirmationHash incluyendo outcome y HTTP/respuesta **en el mismo commit**; comparar payload antes de devolver terminal. Replay igual no duplica, distinto 409 CONFIRMATION_PAYLOAD_CONFLICT; sin prioridad success/rejected, gana primer commit válido, rollback no fija payload. Mantener locks/SERIALIZABLE, revalidación y venta atómica.
  - Evidencia pendiente: `npm run test:integration` PostgreSQL con barreras: success→success, rejected→rejected, success→rejected y rejected→success; outcomes iguales/distintos paralelos forzando ambos ganadores; expire antes/durante confirmación, resultado stale reproducido, body inválido aun terminal, rollback primero y segundo outcome que sí hace commit. Comprobar hash/respuesta, orderId, stock y canasta; última unidad, veda/stock/precio concurrentes y timeout. A13 pendiente; mocks no acreditan atomicidad.

- [ ] **T22 — Lectura histórica, entrega y métricas por propietario.** RF-14/15/18/19; RNF-01/08.
  - Depende de: T21.
  - Archivos asignados: `src/contracts/order.ts`, `src/server/services/orders.ts`, `metrics.ts` dentro de `src/server/services/`; `src/app/api/orders/route.ts`, `orders/[id]/route.ts`, `orders/[id]/fulfillment/route.ts`, `orders/[id]/received/route.ts`, `transactions/route.ts`, `metrics/me/route.ts` bajo `src/app/api/`; `tests/integration/orders.test.ts`.
  - Hecho cuando: recibos inmutables tras retiro/perfil, datos por parte pescador, transición deseada idempotente, recepción solo todos enviados, ingreso bruto derivado de confirmados en Bogotá.
  - Evidencia pendiente: multipescador, transición/recepción concurrente, línea ajena, límites temporales, retiro de lote posterior.

- [ ] **T23 — Conectar canasta y checkout manteniendo simulación.** RF-09–13/18/20; RNF-04.
  - Depende de: T19/T20/T21/T09.
  - Archivos asignados: `src/client/cart.ts`, `src/buyer/BuyerDialogs.tsx`, `src/Checkout.tsx`, `src/PlataformaPescaDual.tsx`, `e2e/dual.spec.ts`.
  - Hecho cuando: fusión P2 mantiene selección invitada ante rechazo/timeout y muestra motivos; limpiar solo éxito confirmado, nuevo mergeId solo por acción explícita, no al remontar UI. Canasta DB/cuatro métodos simulados; timeout consulta intento y conserva outcome en retry; divergencia 409 no cambia elección terminal. Cerrar modal no promete cancelar commit; no total confiado ni tarjeta enviada API.
  - Evidencia pendiente: E2E éxito/rechazo/vencimiento/veda/precio nuevo, interceptar respuesta perdida y verificar solo un pedido/stock; teclado y datos ficticios.

- [ ] **T24 — Conectar historial comprador y recibos.** RF-14/15/18; RNF-04.
  - Depende de: T22/T23.
  - Archivos asignados: `src/buyer/CustomerDashboard.tsx`, `src/Orders.tsx`, `src/app/cuenta/page.tsx`, `e2e/dual.spec.ts`, `e2e/profile.spec.ts`.
  - Hecho cuando: historial/pagos simulados/impresión desde snapshots, recepción autorizada con errores útiles; retiro lote/cambio perfil no rompe recibo.
  - Evidencia pendiente: E2E cuenta nueva/otra cuenta, multi-pescador e impresión, contraste histórico PostgreSQL.

- [ ] **T25 — Conectar preparación y métricas pescador.** RF-15/19; RNF-04/08.
  - Depende de: T22/T16/T24.
  - Archivos asignados: `src/fisher/FisherPortal.tsx`, `e2e/dual.spec.ts`, `e2e/fisher-layout.spec.ts`.
  - Hecho cuando: solo pedidos/partes propias, avance deseado no doble, gráfico bruto y kg/peces sin sumar líneas ajenas; catálogo/recibo no depende de Store local.
  - Evidencia pendiente: E2E dos pescadores/cliente, reintento preparación, responsive/ayudas y totales cotejados DB.

**Puerta I4:** revisión crítica de transacciones/autorización/históricos con PostgreSQL real antes de publicación. Máximo dos rondas de corrección; falta de evidencia vuelve al coordinador.

## I5 — Corte definitivo, validación y preparación gratuita (6 tareas)

- [ ] **T26 — Retirar persistencia y credenciales locales de negocio.** RF-01/02/21/22; RNF-01/04.
  - Depende de: T10/T17/T25.
  - Archivos asignados: `src/StoreContext.tsx`, `src/domain.ts`, `src/auth/authDomain.ts`, `src/auth/authDomain.test.ts`, `src/accessibility/PreferencesContext.tsx`, `src/accessibility/ClientTextButton.tsx`, `src/fisher/FisherHelp.tsx`, `src/PlataformaPescaDual.tsx`, `src/main.tsx`, `index.html`, `vite.config.ts`, `netlify.toml`, `package.json`, `package-lock.json`.
  - Hecho cuando: dependencias/entradas Vite retiradas solo si sin consumidores; no demo passwords/session digest en bundle, localStorage solo preferencias explícitas, sin lectura/escritura Store ni fallback de negocio. Claves antiguas ignoradas, no borradas automáticamente. Tipos/helpers puros aún necesarios conservados.
  - Evidencia pendiente: búsqueda dirigida `localStorage`, `loadStore`, `setStore`, credenciales demo/imports Vite; `npm test`, typecheck/build; navegador con V1/V2/V4 hostil no cambia DB.

- [ ] **T27 — Regresión completa y accesibilidad sobre backend.** Todos RF; RNF-01/04/05.
  - Depende de: T26.
  - Archivos asignados: `playwright.config.ts`, `e2e/auth.spec.ts`, `profile.spec.ts`, `inventory.spec.ts`, `admin.spec.ts`, `dual.spec.ts`, `accessibility.spec.ts`, `fisher-layout.spec.ts`, `navigation.ts` dentro de `e2e/`; `tests/integration/isolation.test.ts`.
  - Hecho cuando: fixtures y app E2E usan mismo schema dedicado autorizado Supabase dev, no localStorage ni demo; flujos A01–A11 y fronteras A13–A15, axe/teclado/reload/multinavegador comprobados con G1. Bloqueos reportados, no ajustar tests para aceptar regresión.
  - Evidencia pendiente: `npm test`, `npm run test:integration`, `npm run typecheck`, `npm run build`, `npm run test:e2e`; salidas/reporte con fallos y entorno. Correcciones de UI fuera de archivos asignados vuelven al coordinador.

- [ ] **T28 — Ensayar migraciones y recuperación en aislamiento Supabase dev.** RF-02/12/14/20; RNF-02/03/05.
  - Depende de: T27 y G1; permiso explícito del ensayo/limpieza/restauración en destino dedicado, nunca demo.
  - Archivos asignados: `scripts/verify-migrations.ts`, `tests/integration/migrations.test.ts`, `specs/002-migracion-fullstack/plan.md` (anexo de evidencia, no cambiar decisiones unilateralmente).
  - Hecho cuando: M01→M02→M03 y DB vacía ensayadas, roles runtime sin DDL, fallo no deja venta parcial; respaldo/restauración DB y fotos a entorno nuevo preserva históricos; build no migra.
  - Evidencia pendiente: `pg_dump`/`pg_restore` de schemas autorizados (cliente compatible con versión remota, sin servidor local), backup cifrado fuera del repo y copia de fotos a destino aislado; status/integración tras restaurar con guardas. No restaurar objetos/roles globales ni resetear proyecto compartido; no prometer rollback automático.

- [ ] **T29 — Preparar Vercel/Supabase gratuitos y documentación operativa.** RF-01/02/20; RNF-06/07/09.
  - Depende de: T28; D2 y condiciones Hobby confirmadas.
  - Archivos asignados: `.env.example`, `next.config.ts`, `scripts/check-environment.mjs`, `docs/development.md`, `docs/deployment.md`, `docs/architecture.md` (solo secciones de transición/objetivo ya implementado), `specs/002-migracion-fullstack/plan.md` (checklist y fuentes reconfirmadas).
  - Hecho cuando: URLs pooled/runtime y CLI separadas, prepared statements/pg documentados, proyecto Preview/final aislados, versión major y secretos/roles/bucket definidos; cuotas actuales citadas, sin Pro/trials/add-ons/SMTP implícitos; procedimiento de publicación y recuperación claro. Esta tarea prepara, no crea recursos ni despliega.
  - Evidencia pendiente: `npm run harness:check`, `npm run env:check`, build en Linux, revisión `.env.example` sin valores reales; checklist A08/A12 con pasos externos pendientes.

- [ ] **T30 — Verificación externa opcional y separadamente autorizada.** RF-02/03/07/12/24; RNF-06/07/09.
  - Depende de: T29 **más** autorización explícita del responsable para migración/Preview y credenciales fuera del chat; proyectos Free ya creados según usuario. Sin ella queda pendiente, no bloquea describir preparación pero sí afirmar despliegue validado. No sustituye permisos G1 de pruebas dev en T02–T28.
  - Archivos asignados: `specs/002-migracion-fullstack/tasks.md` (evidencia), `plan.md` (versiones efectivas/resultados). No fuentes nuevas; correcciones requieren nueva asignación.
  - Hecho cuando: Free/Hobby y condiciones verificados sin recrear proyectos existentes, proveedor/major/región efectivos verificados, migración revisada aplicada a Preview dev con permiso, pool y fotos remotas/permisos comprobados, smoke tres roles con DB real, cuota y ausencia de cobro comprobadas. Demo final exige permiso separado, nunca test destructivo; no está autorizada por T30.
  - Evidencia pendiente: comandos efectivos de migrate/build y URL Preview sin secretos, logs versiones Node/npm/Postgres, pruebas login/upload/checkout/histórico, panel cuotas. Registrar procedencia si los ejecutó el usuario/revisor, no atribuir ejecución propia.

- [ ] **T31 — Revisión final y cierre documental proporcional.** Todos RF/RNF.
  - Depende de: T27–T29; T30 si se pretende declarar Preview verificada.
   - Archivos asignados: `specs/002-migracion-fullstack/spec.md`, `plan.md`, `tasks.md`, `validation.md`, `MEMORY.md` (escritor documental designado; ejecución autorizada sujeta a dependencias).
  - Hecho cuando: se incorpora matriz A01–A15→prueba/comando→resultado del revisor con procedencia y veredicto textual, conservando dictamen inicial; se distinguen preparación/Preview/producción y tareas no hechas. Informe documental no valida implementación. MEMORY <=50 líneas.
  - Evidencia pendiente: informe APROBADO / CAMBIOS NECESARIOS / BLOQUEADO-NO VERIFICADO según revisor; `npm run harness:check` para cierre documental. No afirmar haber ejecutado comandos reportados por terceros.

## Estado de esta propuesta
Historial R3/P2/T2 e I1–I5 aprobado; T01–T31 ninguna marcada hecha en este cierre acotado. T01 H1 resuelto por revisión conjunta; G1/H2 BLOQUEADAS, sin backend ni operaciones remotas habilitados. VCS-01 publicada en ddc83e0, pendiente URL/estado de CI Linux, casilla abierta. Spec 001 sin cierre. Dictamen actual y evidencia recibida en validation.md V7; este cierre documental aún requiere commit adicional posterior, no está acreditado como subido.
