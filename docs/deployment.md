# Despliegue y compatibilidad

## Actual
Shell Next 16.4.0 / React 19.3.0 con negocio y autenticación demo en localStorage. `npm run build` ejecuta `next build` y usa la salida predeterminada `.next/`; `npm run preview` ejecuta `next start`. No genera un entregable estático Vite.
`npm run dev` conserva Vite; `dev:next` usa Next. `netlify.toml` es legado de la versión estática y no acredita despliegue compatible con el build actual. No publicar `dist/` como sitio estático.
T01 continúa BLOQUEADA por reproducibilidad/revisión. No hay backend PostgreSQL ni despliegue externo verificado.

## Objetivo aprobado
Next.js API en Vercel Hobby condicionado a uso personal académico no comercial; Prisma 7, Better Auth en app y Supabase Free para PostgreSQL/fotos. Sin Supabase Auth ni recursos pagos. Proyectos dev/demo creados según usuario, conexión no comprobada.

## Procedimiento futuro condicionado — no autorización de ejecución
G1/H2 sigue bloqueada: aclarar matriz operación/destino/rol/autorización antes de operaciones remotas. No se redefine aquí; nunca pruebas destructivas en demo. Versionar/subir Git no autoriza despliegue, conexión ni migración.
1. Reproducir el shell y harness desde Git con lockfile; Next/React ya están fijados en package.json, sin actualizar versiones por esta tarea.
2. Comprobar Node 24 soportado por la versión elegida y por Vercel. Configurar explícitamente su major en Vercel.
3. Usar npm 11.11.0 como referencia; verificar versión efectiva de instalación en logs de build.
4. Crear entornos Local, Preview y Producción con credenciales y datos separados.
5. Configurar pooling PostgreSQL, regiones cercanas y límites de conexiones según proveedor.
6. Documentar variables en `.env.example` al introducirlas. Secretos en Vercel; solo valores públicos bajo NEXT_PUBLIC_.
7. Ensayar migraciones en DB de prueba y ejecutarlas una vez por publicación mediante proceso coordinado.
8. Ejecutar tipos, pruebas de integración y build; probar el recorrido esencial contra Preview.
9. Publicar producción después de comprobaciones, con respaldo y procedimiento de recuperación documentados.

## Reproducción
CI fija Node exacto y npm; producción administrada puede actualizar parches dentro del major. Registrar versiones efectivas.
No copiar node_modules de Windows: instalar desde lockfile en Linux. `.github/workflows/verify.yml` declara instalación, entorno, harness, unitarias, tipos y build; no hay ejecución CI acreditada en esta fase ni E2E en ese workflow.
PostgreSQL será exclusivamente remoto Supabase, sin servidor local/Docker; versión efectiva y extensiones aún por comprobar tras autorización.
Separar generación de cliente ORM/build de migraciones y seeds. Las vistas previas no deben migrar producción.

## Pendientes de decisión
G1/H2, versión efectiva PostgreSQL, condiciones Hobby, compatibilidad efectiva Vercel y permisos por operación/destino. Integración frontend, ORM, proveedores, auth y simulación ya tienen decisiones registradas en spec 002; no volver a solicitarlas.
Reproducción limpia, revisión y CI pendientes. Ninguna guía ni auditoría inicial declara el despliegue listo.
