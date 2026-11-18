# Plan — Dashboard integral de administración (AP1)

Spec: `spec.md` R1 y AP1 aprobadas por el usuario mediante «Si» el 2026-11-18. ADM-T1 bloqueada por configuración read-only no validada.

## Enfoque
Conservar Next.js Route Handlers, servicios SQL con `pg`, perfiles/credenciales propias y PostgreSQL Supabase. No añadir Supabase Auth ni Edge Functions: sería migración de autenticación separada y contradice la arquitectura aprobada. Componentes de interfaz llaman APIs; stores locales no son fuente de autoridad. Todos los listados/KPIs son consultas al servidor. Un único escritor por tarea.

## Estado de ejecución
- ADM-T1: BLOQUEADA (ver spec); sin conexión a Supabase.
- ADM-T2: borrador local de SQL/Prisma añadido, no revisado contra metadata/grants reales y no ejecutado; no autoriza DDL.
- ADM-T3–T5: primer corte local añadido. Incompleto: pruebas de integración/UI pendientes y efecto de suspensión sobre sesiones JWT ya emitidas no está cubierto. No marcar hecho ni desplegar.
- ADM-T6: unitarias actuales/typecheck/build parcial ejecutados; pruebas recién agregadas y E2E/DB aislada pendientes.

## Tareas secuenciales propuestas
1. **ADM-T1 — Auditoría READ ONLY de esquema, grants y RLS.** Confirmar destino dev, TLS, roles efectivos, policies existentes, claves/índices y relaciones. No escribir. Entregar evidencia sanitizada. Si no se puede demostrar destino/permiso, bloquear DB. **BLOQUEADA:** `npm run db:check-target -- --connect` devolvió `FAIL CONFIGURATION`, sin conectar.
2. **ADM-T2 — Contrato de datos/migración.** Diseñar SQL versionado para estado/soft delete/last login/admin audit, constraints, índices y triggers/guardas append-only; actualizar schema Prisma documentalmente si es fuente vigente. Especificar recuperación/rollback y compatibilidad con registros históricos. No ejecutar en Supabase hasta permiso operacional específico.
3. **ADM-T3 — Dominio seguro de cuentas.** Contratos runtime, repositorio y servicios de listar/filtrar/editar/estado/baja/restaurar/reset. En transacciones, autorización admin desde sesión + perfil DB y cambios más auditoría atómicos. Login rechaza estado no activo; verifica actor/estado en DB al autenticar. Primer-login exige actualizar contraseña antes de devolver sesión de uso normal.
4. **ADM-T4 — Lectura dashboard.** Endpoints de resumen, actividad y listado paginado usando SQL agregada, filtros parametrizados, límite superior y sort allowlist. Conteos consistentes; sin datos sintéticos.
5. **ADM-T5 — UI modular.** Navegación vertical/compacta y secciones Resumen, Gestión, Crear, Papelera, Ambiente, Auditoría, Configuración. Tabla responsive, filtros, perfil, edición, confirmaciones, contraseña temporal de una sola vista/entrega privada y estados de carga/error. Reusar módulo ambiental sin alterar reglas.
6. **ADM-T6 — Pruebas/revisión.** Test puro de contratos, controladores, RBAC y scrypt; integración con PostgreSQL aislado autorizado para migración, rollback, constraints, acceso denegado y concurrencia; Playwright/axe, typecheck/build y regresión ambiental. Registrar evidencia por RF, riesgos y requisitos no comprobados.

## Contratos propuestos
- `GET /api/admin/summary`: conteos, ventana reciente acordada y eventos permitidos.
- `GET /api/admin/fishers`: `q`, `status`, `port`, `createdFrom/To`, `cursor/page`, `limit`; máximo 100 y sort allowlist.
- `GET /api/admin/fishers/:id`: perfil administrativo redacted.
- `PATCH /api/admin/fishers/:id`: campos permitidos y versión para conflicto 409.
- `POST /api/admin/fishers`: cuenta nueva; contraseña no vuelve en respuesta.
- `POST /api/admin/fishers/:id/password-reset`: establece contraseña temporal sin devolver valor; `first_login_required=true`.
- `POST /api/admin/fishers/:id/{suspend,reactivate,delete,restore}`: acción idempotente/estado explícito; delete soft.
- `GET /api/admin/trash`, `GET /api/admin/audit`: paginados y filtrados.
- `POST /api/auth/login` actualiza `last_login_at` solo en éxito; restricciones de estado aplicadas por DB.

## Decisiones para implementación
- Política inicial de estado: nuevo pescador `active`; reset/restauración establece `first_login_required`; deleted no puede iniciar sesión.
- Contraseña temporal: entrada por admin, campo no almacenable en UI; confirmación de éxito sin eco de contraseña. El plan debe cerrar canal privado de entrega.
- Soft delete no borra ni anula lotes/órdenes; política de catálogo/listados para lotes de pescador eliminado requiere revisar contratos actuales y decidir si se ocultan nuevas compras sin alterar históricos.
- No habrá botón de eliminación permanente en R1.
- Métricas recientes: ventana de 30 días propuesta; confirmar o cambiar durante aprobación.
- Paginación propuesta 25 por página, máximo 100.

## Puertas de seguridad / operación
- La autorización actual de trabajo no permite DDL, seed, limpieza ni escritura remota. ADM-T1 READ ONLY requiere confirmación de destino autorizado según MEMORY; ADM-T2 no ejecuta SQL.
- Antes de mutar: permiso específico de DB destino/operación, SQL exacto revisado y recuperación definida. Prohibido tests destructivos en demo.
- No inspeccionar/mostrar secretos; claves privilegiadas solo server env; escaneo de bundle y logs.
- No declarar RLS verificada por inspección de archivos; probar grants efectivos/negative access real de forma autorizada.

## Hecho cuando
R1 y AP1 aprobadas, ADM-T1/T2 revisadas y autorizadas según alcance; cada RF acepta evidencia correspondiente; el módulo ambiental no regresa; operaciones no permitidas fallan cerradas; limitaciones de DB/configuración reportadas. No avanzar a tareas dependientes de esquema hasta resolver ADM-T1 o aprobar un subalcance offline que no reclame compatibilidad RLS/DB.
