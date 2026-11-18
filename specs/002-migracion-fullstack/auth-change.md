# Autenticación unificada — AC1

Estado: AC1 aprobada por el usuario mediante «Si» en respuesta a la aprobación de especificación y contraseña inicial. Plan/tareas pendientes de aprobación separada.
Fuente: solicitud reiterada del usuario, 2026-11-17.
Base inspeccionada: main 9bec03f; backend SQL, scrypt y cookie JWT existentes.

## Requisitos EARS
- RF-AU-01: CUANDO se renderice cualquier página, EL SISTEMA omitirá el asistente flotante y su ventana, eliminando su lógica; conservará la lectura accesible del portal.
- RF-AU-02: CUANDO se solicite acceso, EL SISTEMA ofrecerá correo y contraseña con control de visibilidad y botón «Iniciar sesión», sin seleccionar rol.
- RF-AU-03: CUANDO se autentique una cuenta, EL SISTEMA obtendrá su rol del servidor y abrirá su sección; rechazará operaciones sin identidad, rol o titularidad autorizados.
- RF-AU-04: CUANDO se registre públicamente una cuenta, EL SISTEMA asignará exclusivamente cliente en backend, rechazando roles privilegiados enviados por petición modificada.
- RF-AU-05: CUANDO un administrador cree una cuenta desde «Gestión de pescadores», EL SISTEMA validará nombre, correo y datos necesarios, comprobará unicidad y asignará pescador en PostgreSQL.
- RF-AU-06: SI otro actor intenta crear pescadores, ENTONCES EL SISTEMA rechazará la solicitud sin escrituras.
- RF-AU-07: CUANDO se establezca una contraseña, EL SISTEMA usará el mecanismo scrypt existente, sin devolver contraseñas existentes ni almacenarlas en texto plano.
- RF-AU-08: CUANDO se aplique el cambio, EL SISTEMA conservará cuentas y roles existentes en PostgreSQL sin importar privilegios de localStorage.
- RF-AU-09: CUANDO se muestre ingreso o registro, EL SISTEMA omitirá cuentas precargadas, accesos demo, selección de perfiles y registro público de pescadores.
- RF-AU-10: CUANDO haya errores de credenciales, duplicados o campos inválidos, EL SISTEMA mostrará errores accesibles y conservará diseño, colores, tipografía y adaptación móvil.
- RF-AU-11: MIENTRAS una función permanezca simulada, EL SISTEMA describirá fielmente su funcionamiento; eliminar avisos locales obsoletos no convierte pagos simulados en reales.

## Decisión propuesta para establecer contraseña
Reutilizar scrypt del backend: el formulario de alta administrada solicita una contraseña inicial nueva con confirmación y control mostrar/ocultar, nunca recupera ni muestra contraseñas existentes. No añadir un proveedor de correo ni invitaciones sin decisión expresa.
El administrador deberá entregar la credencial por un canal privado fuera de la aplicación. Esta elección requiere aprobación; no se presenta como un mecanismo de activación ya existente.

## Cambios respecto a spec 002
Sustituye alta pública de pescadores RF-MIG-23, conservación del chat y accesos diferenciados.
La base actual contiene backend propio; las referencias históricas a ausencia de backend no describen main 9bec03f.
No cambiar cuentas existentes ni ejecutar migraciones remotas por inferencia.

## Verificación requerida
Pruebas de API: cliente público fijo, petición manipulada, autorización de alta pescador, duplicidad, credenciales inválidas y sesión falsificada.
Pruebas de interfaz: tres roles en formulario único, ausencia de demo/chat/selectores, registro cliente y gestión pescador, teclado y móvil/escritorio.
Typecheck, build y pruebas dirigidas; integración PostgreSQL solo en destino aislado autorizado.
Resultados: pendientes. No hay implementación ni validación funcional en esta revisión.
