# Validación AC1 / AP1 — 2026-11-17

Estado: implementación realizada; validación parcial offline/UI. PostgreSQL real pendiente de autorización de destino y ejecución.
El usuario aprobó AC1 y contraseña inicial mediante «Si», y después AP1 mediante «si». Sin delegación.

## Cambios
- RF-AU-01: eliminado `src/Chat.tsx`, montaje y estilos exclusivos.
- RF-AU-02/09: formulario único en AuthModule/ClientAccess; retirados componentes AdminAccess/FisherLogin/FisherRegistration, demo y PIN visible.
- RF-AU-03/04/06: contratos sin oneTouch; registro público solo cliente; ruta admin exige rol firmado y verifica perfil persistido; secreto predeterminado eliminado.
- RF-AU-05/07: gestión de pescadores, transacción SQL existente, scrypt, normalización y duplicados 409, respuesta sin token de la cuenta creada. Sin mecanismo nuevo de correo.
- RF-AU-08: no migraciones ni escrituras remotas ejecutadas. Las cuentas existentes no se transforman. Se reemplazó comparación de ID fijo de administrador en UI por sesión activa.
- RF-AU-10/11: errores accesibles, estilos existentes, contraseña visible/oculta, retirada de mensaje local obsoleto. Pagos siguen rotulados simulados.
- Helpers de autenticación local retirados de producción y conservados solo en `tests/fixtures/legacy-auth.ts` para regresión histórica. No acreditan autenticación real.

## Evidencia ejecutada
- `npm run typecheck`: exit 0.
- `npm test`: 71/71; repetición final después de mover helpers legacy también 71/71.
- `npm run harness:check` y `git diff --check`: exit 0. Git mostró avisos de conversión LF/CRLF, sin errores de whitespace.
- `npx playwright test e2e/unified-auth.spec.ts`: 8/8 en escritorio y Pixel 7, con respuestas API interceptadas, sin DB. Incluye tres roles, localStorage adulterado, errores, duplicidad, alta administrativa sin cambio de sesión, registro cliente, ausencia de controles retirados y ancho de página.
- Axe en registro: sin infracciones reportadas. Capturas de registro escritorio y gestión móvil revisadas.
- Primer recorrido falló por selector ambiguo con el anunciador de Next; corregido acotando los alerts a `main`.
- Build Next ejecutado por Playwright completó tras reintento. Next mostró advertencia de vulnerabilidad conocida en la versión instalada; actualización pendiente y fuera de este cambio.

## Pendientes y límites
- No se ejecutó alta/login contra PostgreSQL real: persistencia, rollback y duplicidad concurrente requieren base de pruebas aislada autorizada.
- Los tests unitarios de login usan QueryExecutor controlado; las negativas de controladores rechazan antes de conectar. No confundir con integración SQL.
- Suite E2E histórica completa no ejecutada; contiene recorridos PIN/demo/selectores retirados que requieren adaptación.
- Configurar secreto privado seguro en despliegue y conexión PostgreSQL existente. No se leyeron secretos ni se cambió configuración privada.
- Publicación solicitada el 2026-11-18: main fb096db integrado; types y 71 pruebas repetidos con éxito, diff check sin errores. Commit/push se verifican en la entrega. Sin despliegue ni validación global AC1.
- `AGENTS.md` (bloque generado por Next) y `next-env.d.ts` (rutas del servidor dev) se mantienen locales, fuera del commit funcional.
