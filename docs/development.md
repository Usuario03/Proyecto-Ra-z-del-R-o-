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
El prototipo actual no requiere variables de entorno. La primera comprobación DB autorizada usa configuración privada separada, nunca variables públicas ni secretos en el chat. El build de Next.js usa su salida predeterminada `.next/` para ser compatible con Vercel.

## Próximo incremento: backend
Next 16.4.0 / React 19.3.0 están declarados y el shell cliente implementado; negocio/auth siguen en localStorage. T01/H1 resuelto por revisión conjunta VCS-01; CI exitoso registrado en validation 002 V8, no cierre global.
Objetivo aprobado condicionado: Prisma 7, Better Auth en app y Supabase Free DB/fotos; sin Supabase Auth, Docker ni PostgreSQL local. Estas dependencias backend no están implementadas.
H2 aclarado documentalmente; matriz vigente en plan 002 §9. Solo lectura inicial dev autorizada; DDL, semillas y limpieza siguen sin permiso. Pruebas destructivas solo en schema dev aislado con permiso y guardas, nunca demo. Migraciones operativas dev/demo son autorizables por separado, no están universalmente vetadas.
VCS-01 publicada con CI exitoso según coordinador. T02.a aceptada solo por evidencia recibida de lectura acotada; T02.b.1 aceptada offline, sin backend ni cierre de T02/A07/spec. Siguiente: delimitar inspección/provisión T02.b y sus permisos separados (validation 002).

### T02.a — Lectura acotada aceptada; configuración de referencia, no orden de reejecución
1. En el panel del proyecto **raiz-del-rio-dev**, abrir **Connect**, seleccionar **Session pooler**, puerto **5432** (IPv4). No seleccionar demo ni el pool transacción :6543 para esta comprobación. Copiar localmente la URL que muestra el panel con marcador de contraseña; no enviarla al chat, tampoco host/referencia/usuario reales.
2. Configurar localmente `DIRECT_URL` en `.env.local` ignorado, o en un almacén/variable efímera privada. `.gitignore` contiene `.env.*`; el implementer comprobará además que el archivo no esté ya versionado antes de usarlo. Este escritor no crea ni lee un `.env` real. Sustituir el marcador solo en el equipo, codificando caracteres reservados de la contraseña. No pegar URLs en argumentos, historial ni logs. No se necesitan claves anon ni serviceRole para PostgreSQL.
3. Usar TLS con validación de certificado y hostname (CA oficial si el cliente la necesita); nunca `rejectUnauthorized:false` ni desactivar verificación para continuar. La URL por sí sola no acredita TLS correcto. Comparar destino contra configuración privada, sin imprimirlo.
4. `pg` **8.23.1 exacto** está declarado e instalado según evidencia registrada T02.a; no requiere servidor PostgreSQL local ni nueva instalación. La conexión aceptada reportó PostgreSQL **17.11**, sin comprobar demo ni compatibilidad Prisma real.
5. Primera conexión únicamente con transacción **READ ONLY**, límites de 5 s y cierre controlado. SELECT permitido exclusivamente de constante de salud, versión del servidor y estado read-only. **TLS se comprueba en el transporte, no mediante SELECT.** Sin tablas de negocio, funciones mutantes, DDL, semillas, limpieza, migrador ni test de escritura; finalizar con ROLLBACK. Si falla TLS/destino/read-only, abortar, no degradar guardas. Metadatos de destino/rol/schema/search_path y permisos efectivos/heredados permanecen **pendientes T02.b**: SQL fijo revisado y permiso separado antes de lectura ampliada; no están autorizados por T02.a.
6. Informar solo éxito/fallo sanitizado, versión PostgreSQL y verificaciones booleanas; no URLs, contraseña, nombres de roles, IDs privados ni errores crudos del driver. No se acredita aislamiento de escritura con esta lectura. Demo no tiene autorización de conexión; migraciones y pruebas posteriores necesitan permisos específicos.

### Diagnóstico T02.a (corrección ronda 1)
`npm run db:check-target` valida offline; `npm run db:check-target -- --connect` requiere permiso de intento remoto. El diagnóstico separa **fase** de **categoría/código permitido**; `CONNECTION` no identifica una causa. Códigos desconocidos y mensajes no reconocidos producen `UNKNOWN`, sin detalles del driver. Los mensajes conocidos se comparan completos y se traducen a etiquetas fijas, nunca se imprimen.

Histórico: el intento autorizado del 2026-10-16 devolvió `FAIL CONNECTION TLS SELF_SIGNED_CERT_IN_CHAIN`. Según [Node 24](https://nodejs.org/docs/latest-v24.x/api/errors.html#self_signed_cert_in_chain), el emisor no está en la lista de confianza; no demuestra contraseña incorrecta, fallo de `options` ni origen de la cadena presentada. Ese bloqueo fue superado en el retry autorizado del 2026-10-17 con CA externa autorizada mediante `NODE_EXTRA_CA_CERTS` **solo en el proceso hijo antes de iniciar Node**, sin instalación/confianza global ni relajación de certificado/hostname. Procedencia de CA declarada por responsable; huella/vigencia no autentican por sí mismas esa procedencia. No confiar automáticamente en certificados de conexiones fallidas ni cargar CA por inferencia.

Evidencia recibida aceptada por reviewer, no reejecutada: `PASS READ_ONLY PostgreSQL 17.11`, exit 0, stderr vacío; transporte TLS encrypted/authorized con hostname estricto, salud=1/read-only=on. ROLLBACK/end sin fallo reportado según script, no observación independiente; timeout configurado, no ensayo remoto de vencimiento. Esto no acredita permisos, aislamiento ni T02/A07 completos, ni garantiza TLS en conexiones futuras. No repetir conexión sin permiso específico del intento.

Fuentes consultadas en diagnóstico previo, no consultadas de nuevo en esta corrección: [SSL de node-postgres](https://node-postgres.com/features/ssl), [conexión/SSL Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres), [error de identidad pooler](https://supabase.com/docs/guides/troubleshooting/tenant-or-user-not-found). En pg 8.23.1, `lib/client.js` envía `options` y límites como parámetros de inicio; `lib/connection.js` pasa las opciones SSL a Node. El retry aceptado acredita solo la configuración usada, no compatibilidad universal de parámetros ni Prisma. No quitar `default_transaction_read_only` ni límites para continuar; un rechazo futuro requiere revisión, no degradación silenciosa.

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
