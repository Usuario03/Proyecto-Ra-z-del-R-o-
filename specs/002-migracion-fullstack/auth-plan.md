# Plan y tareas de autenticación — AP1

Spec: auth-change.md AC1 aprobada. AP1 aprobado por el usuario mediante «si» en respuesta a la solicitud explícita de aprobación del plan. Implementación en curso.

## Implementación
1. **AU-T1 — Backend y contratos (RF-AU-03–08).** Separar registro público cliente de creación administrativa de pescador en contratos y servicios. Mantener `/api/me/onboarding` para clientes y añadir `POST /api/admin/fishers`. Validar sesión y rol administrador contra perfil persistido antes del alta. Asignar roles en servidor, validar entradas y normalizar correo; resolver duplicados también desde restricciones DB. Reutilizar transacción y scrypt existentes. El alta administrativa no devuelve token del pescador ni sustituye la sesión del administrador. Requerir secreto privado de sesión, sin valor predeterminado conocido.
2. **AU-T2 — Formulario único (RF-AU-02/04/09/10).** Refactorizar `src/auth/AuthModule.tsx`, acceso cliente y navegación. Correo/contraseña vacíos, mostrar/ocultar e «Iniciar sesión» para los tres roles. Registro exclusivo cliente con enlace de retorno; eliminar componentes y llamadas obsoletas de acceso por rol, ingreso demo y registro público pescador. Usar sesión API sin fallback de autenticación local. Conservar contenido institucional y funciones del portal.
3. **AU-T3 — Gestión de pescadores (RF-AU-05–07/10).** Añadir formulario al panel administrador con nombre, correo, datos requeridos por el contrato existente, contraseña inicial y confirmación. El backend guarda únicamente sal/hash. Limpiar contraseñas al guardar/cerrar; nunca registrar ni devolver sus valores. Conservar cuentas y relaciones existentes, sin semillas ni reinicios de DB.
4. **AU-T4 — Eliminar asistente (RF-AU-01/09/11).** Retirar componente flotante, ventana, estado, imports y estilos exclusivos. Mantener lectura accesible del pescador. Corregir mensajes locales obsoletos sin ocultar simulación de pagos vigente.
5. **AU-T5 — Verificación y documentación.** Pruebas dirigidas de contratos/API, rol manipulado, no administrador, duplicados y autenticación. Actualizar recorridos afectados y comprobar móvil/escritorio/teclado. Ejecutar typecheck, build y pruebas pertinentes. Registrar resultados reales, pendientes y variables requeridas; actualizar MEMORY y documentación de uso.

## Contratos previstos
- Registro público: sin selector de rol; rol cliente impuesto en servidor. Peticiones con rol privilegiado rechazadas.
- Alta administrativa: nombre/correo/datos pescador/contraseña inicial; rol pescador impuesto en servidor. Respuesta 201 con perfil público necesario, sin credenciales ni sesión del nuevo usuario.
- Errores: validación 400, sin sesión 401, sin permiso 403, duplicados 409, límites 429, fallo de configuración/persistencia sin éxito ficticio.
- Login: correo/contraseña; rol desde datos persistidos, nunca desde formulario ni almacenamiento local.

## Dependencias y límites
T2 y T3 dependen de T1; T5 verifica el conjunto. Un único escritor; no delegación solicitada.
Se reutiliza esquema actual; si surge necesidad de migración, documentar SQL y recuperación y solicitar autorización específica antes de ejecutarla.
No conectarse ni escribir en DB remota sin el permiso de destino/operación requerido por el proyecto. Pruebas DB aisladas pendientes de esa autorización; mocks no acreditan persistencia real.
No modificar cuentas existentes, contratar servicios, desplegar ni publicar cambios por inferencia.

## Hecho cuando
RF-AU-01–11 tienen evidencia reproducible; no quedan accesos locales alternativos ni alta pública privilegiada; sesión administrador permanece al crear pescador; contraseñas nunca se persisten en claro. Integración no ejecutable se informa bloqueada, sin declarar validación completa.

## Estado
AU-T1–T4 implementadas. AU-T5 parcial: tipos, pruebas unitarias y UI dirigida ejecutados; integración PostgreSQL y adaptación de E2E históricos pendientes. Evidencia en auth-validation.md.
