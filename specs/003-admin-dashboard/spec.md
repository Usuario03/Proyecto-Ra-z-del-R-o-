# Spec 003 — Dashboard integral de administración

Revisión: R1 · 2026-11-18
Estado: R1 y AP1 aprobadas por el usuario el 2026-11-18; implementación local parcial, validación pendiente.
Base observada: main a85b925; backend propio Next.js/pg, PostgreSQL Supabase, scrypt/JWT. No Supabase Auth ni Edge Functions en el flujo vigente.

## Contexto y límites
La solicitud «Sí» responde a estas propuestas: mantener API/auth propias sobre Supabase PostgreSQL; inactivo y suspendido son estados distintos y ambos bloquean login; usar baja lógica/restauración y posponer eliminación permanente; contraseña temporal con cambio obligatorio, apoyado en `first_login_required`; añadir último acceso y auditoría mediante cambios de esquema.

La base tiene `profiles.first_login_required` y `provisioning_pending`, pero no estado, fecha de baja, último login ni auditoría de cuentas. El campo `first_login_required` aún no está conectado a un flujo demostrado de cambio forzado. Las cuentas/auth están separadas en `profiles`, `auth_credentials`, `fisher_details`; existen referencias históricas con `ON DELETE RESTRICT`. Por tanto eliminación permanente se excluye; preservación de identidad, órdenes, líneas, lotes y auditoría requiere soft delete.

No se introducirán Supabase Auth, Edge Functions, Service Role Key ni segunda autenticación. La API existente obtiene privilegios mediante backend. PostgreSQL remoto no se modificará hasta revisión SQL, destino, recuperación y autorización operativa específica.

## Actores
- Administrador autenticado: administra cuentas de pescadores y consulta métricas/auditoría; conserva sus controles ambientales.
- Pescador: consulta únicamente su portal, no administra cuentas ni puede recuperar acceso por autoservicio.
- Cliente: registro público de cliente sin permisos administrativos.

## Requisitos EARS
- **RF-ADM-01 — Navegación:** CUANDO un administrador entre a su panel, EL SISTEMA ofrecerá Resumen general, Gestión de pescadores, Crear pescador, Papelera de usuarios, Gestión ambiental, Actividad y auditoría y Configuración.
- **RF-ADM-02 — Autorización:** CUANDO se solicite cualquier operación de administración, EL SISTEMA verificará sesión y rol administrador contra el perfil persistido; rechazará sesión ausente, expirada, pescador, cliente o rol manipulado.
- **RF-ADM-03 — Listado:** CUANDO el administrador consulte pescadores, EL SISTEMA paginará resultados de PostgreSQL y permitirá búsqueda por nombre/correo/documento y filtros por estado, zona y fecha de alta. La respuesta omitirá sal/hash y datos innecesarios.
- **RF-ADM-03a — Cuentas existentes:** CUANDO se habilite la gestión, EL SISTEMA consultará y mostrará las cuentas pescadoras que ya estén en las tablas persistidas, sin duplicarlas ni sobrescribir sus credenciales, roles, lotes o historial. Las cuentas de ejemplo del SQL versionado no se insertarán en un proyecto remoto por inferencia.
- **RF-ADM-04 — Perfil:** CUANDO se abra un pescador, EL SISTEMA mostrará los datos de identidad permitidos, estado, creación, último acceso si existe y actividad disponible.
- **RF-ADM-05 — Edición:** CUANDO el administrador edite datos válidos, EL SISTEMA validará unicidad normalizada de correo/documento, guardará el cambio en transacción y generará auditoría inmutable.
- **RF-ADM-06 — Alta:** CUANDO el administrador cree una cuenta, EL SISTEMA asignará rol fisher en backend, validará perfil y correo/documento únicos, guardará contraseña inicial con scrypt y solicitará cambio en el siguiente ingreso. El registro público seguirá siendo solo cliente.
- **RF-ADM-07 — Estado:** CUANDO se desactive, suspenda o reactive una cuenta, EL SISTEMA actualizará su estado en servidor, invalidará/impedirá autenticación cuando corresponda y registrará actor/instante/acción. Inactivo es deshabilitación administrativa sin plazo; suspendido es bloqueo administrativo temporal, ambos impiden login; reactivar devuelve a activo.
- **RF-ADM-08 — Restablecimiento:** CUANDO un administrador restablezca acceso, EL SISTEMA aceptará una contraseña temporal nueva, almacenará solo scrypt y marcará `first_login_required`; no enviará ni revelará credenciales existentes y exigirá cambiar la contraseña antes de otras operaciones autenticadas.
- **RF-ADM-09 — Baja lógica:** CUANDO un administrador confirme eliminar pescador, EL SISTEMA lo moverá a papelera conservando perfil/credencial bajo bloqueo de login, lotes, recibos y auditoría. Confirmará explícitamente antes de mutar.
- **RF-ADM-10 — Restauración:** CUANDO un administrador restaure una cuenta, EL SISTEMA preservará relaciones existentes, reactivará como activo mediante reautenticación/cambio de contraseña temporal y registrará actor/instante.
- **RF-ADM-11 — Permanencia:** MIENTRAS no exista política y autorización de retención/permisos, EL SISTEMA no expondrá ni ejecutará eliminación permanente.
- **RF-ADM-12 — Papelera:** CUANDO se consulte la papelera, EL SISTEMA permitirá buscar cuentas bajas, mostrar fecha y actor de baja y restaurar; no borrará automáticamente datos históricos.
- **RF-ADM-13 — Resumen:** CUANDO se cargue el dashboard, EL SISTEMA calculará desde PostgreSQL conteos de pescadores total/activo/suspendido/eliminado, altas recientes, clientes cuando disponibles y actividad reciente. No usará semillas, Store local ni estimaciones.
- **RF-ADM-14 — Auditoría:** CUANDO se cree, edite, restablezca contraseña, suspenda, reactive, elimine o restaure una cuenta, EL SISTEMA registrará acción, actor, entidad, instante y cambios permitidos, sin contraseña, hash, sal ni secreto. El registro de auditoría será append-only para el rol de aplicación.
- **RF-ADM-15 — Último acceso:** CUANDO una cuenta inicie sesión correctamente, EL SISTEMA actualizará `last_login_at`; acceso fallido no lo modificará. Si el histórico previo no existe, se mostrará «No disponible», sin inventarlo.
- **RF-ADM-16 — Ambiente:** MIENTRAS exista el módulo de gestión ambiental, EL SISTEMA conservará sin regresión las reglas, autorización, auditoría y controles actuales.
- **RF-ADM-17 — Responsive:** CUANDO se use desktop, tableta o móvil, EL SISTEMA ofrecerá navegación y controles accesibles, tabla utilizable (scroll interno/tarjetas en viewport estrecho), teclado y mensajes legibles.
- **RF-ADM-18 — Errores:** SI una validación, permiso, persistencia o concurrencia falla, ENTONCES EL SISTEMA indicará error recuperable y no afirmará éxito ni dejará cambios parciales.

## Datos y privacidad
- Migración propuesta: estado con valores `active|inactive|suspended|deleted`, `deleted_at`, `deleted_by`, `last_login_at`; auditoría administrativa append-only con actor FK, acción, target, timestamp y diff JSON con allowlist.
- Definir constraints para consistencia de estado/timestamps, índices de búsqueda y unicidad de identificadores. Correo/documento de cuenta borrada permanecen reservados hasta política aprobada.
- Sin historial de acceso previo no hay fecha retroactiva. La fecha de creación usa `profiles.created_at`/`fisher_details.created_at`.
- No guardar contraseñas temporales en auditoría, logs, respuestas, URL, localStorage ni memoria de UI después del submit.
- RLS actual no comprobada por esta inspección; aplicación usa pg backend. Revisar grants/RLS y riesgo de acceso directo antes de afirmar aislamiento. Nunca exponer clave privilegiada.

## Aceptación verificable
1. Tabla/paginación/búsqueda/filtros resuelven DB, no Store; prueba de límites, orden y filtros.
2. Negativas API para invitado, cliente, pescador, token con rol adulterado, perfil DB no-admin y target no-fisher; no se escribe.
3. Alta, edición con duplicado, cambio de estados, bloqueo de login y auditoría atómica con actor correcto.
4. Restablecimiento fuerza cambio en siguiente login; credencial anterior deja de autenticar; auditoría no contiene valores sensibles.
5. Baja conserva relaciones, recibos y lotes; logout/relogin bloqueados; papelera muestra fecha/actor; restauración recupera identidad y requiere establecer nueva contraseña.
6. Métricas concuerdan con fixtures de una base de pruebas aislada; actividad reciente se deriva del log.
7. Módulo ambiental pasa pruebas actuales sin regresión.
8. Playwright/axe de desktop, tablet y móvil verifica navegación, formularios, tabla y confirmaciones.
9. PostgreSQL real: migración desde estado previo, rollback, concurrencia de estados/edición, foreign keys, grants/RLS inspeccionados y recuperación documentada.

## Pendientes de revisión / decisiones
- RLS/grants reales, roles DB y política de acceso directo no están inspeccionados para esta spec; se deben auditar en modo READ ONLY antes de decidir políticas.
- Definir interfaz de selección de contraseña temporal sin enviarla por correo: solo se aprobó el flujo de contraseña temporal/change-required, no canal de entrega. El administrador podría establecer y entregar en canal privado; aprobar dentro del plan.
- El dashboard de configuración no tiene operaciones adicionales definidas; limitarlo a información de cuenta/entorno sin cambiar secretos ni infraestructura.
- Schema/migración y uso de datos reales requieren SQL revisado, plan de recuperación y autorización específica de entorno.

## Verificación de elaboración
Inspección de solo lectura: `server/prisma/schema.prisma`, `server/README.md`, `src/admin/AdminDashboard.tsx`, `src/admin/FisherManagement.tsx`, `specs/002-migracion-fullstack/auth-validation.md`, `MEMORY.md`. Sin consultas a Supabase, cambios de código ni mutaciones.

## Actualización — cuentas existentes
El usuario solicita incorporar al panel las cuentas de pescadores ya creadas en Supabase. RF-ADM-03 ya las obtiene desde PostgreSQL; RF-ADM-03a aclara que se preservan y no se vuelven a sembrar. La migración local contiene cuentas de ejemplo idempotentes, pero no prueba que existan en el Supabase remoto.

## Ejecución ADM-T1
2026-11-18: `npm run db:check-target -- --connect` y la variante offline ejecutadas con runner allowlisted; ambas devuelven `FAIL CONFIGURATION`. No hubo conexión ni se expusieron valores. `npm run env:check` también falla: Node 24.11.0 frente a 24.14.1 y npm 11.21.1 frente a 11.11.0. Grants/RLS/versión efectiva no verificados. Las tareas dependientes del esquema quedan BLOQUEADAS hasta restaurar el entorno/configuración local privada esperada y confirmar destino. No solicitar ni enviar secretos por chat.

## Implementación local parcial — 2026-11-18
Se añadieron borrador de migración y schema Prisma, contratos/servicios/controladores/rutas API, UI de administración y flujo de contraseña temporal. Estos cambios todavía no prueban compatibilidad con el esquema remoto ni el aislamiento real de roles/RLS. La migración no se ejecutó; las funciones conectadas dependen de que el destino autorizado tenga la migración revisada.
Comprobaciones locales: `npm test` 71/71 antes de incorporar pruebas nuevas; `npm run typecheck` OK; primer build detenido por aviso de Next vulnerable y reintento terminó correctamente con advertencia. Pruebas nuevas del contrato admin aún deben ejecutarse. Pendientes: integración PostgreSQL aislada, migración/rollback autorizados, flujos de UI, accesibilidad y revisión de sesiones vigentes tras suspensión/baja. No declarar la RF completa.
