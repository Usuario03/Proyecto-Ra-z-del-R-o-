# Raíz del Río — instrucciones para agentes

Comercio de pesca artesanal de Barrancabermeja, proyecto de grado UDI.

## Contexto mínimo
- Lee `MEMORY.md` al iniciar; consulta solo la spec y el código de la tarea.
- Lee `docs/constitution.md` antes de proponer o implementar cambios.
- Mapa de código y contexto por tarea: `docs/architecture.md`.
- Actual: shell Next 16.4 / React 19.3 y prototipo localStorage; sin backend. PostgreSQL/Vercel siguen pendientes; T01 bloqueada por revisión.

## Comandos actuales
- Instalar: `npm ci`; desarrollo Vite: `npm run dev`; Next: `npm run dev:next`; build/preview usan Next.
- Dominio: `npm test`; tipos: `npm run typecheck`; build: `npm run build`.
- Navegador: `npm run test:e2e` (requiere Chromium de Playwright).
- Harness: `npm run harness:check`; entorno: `npm run env:check`.
- Preparación y versiones: `docs/development.md`; despliegue: `docs/deployment.md`.

## Forma de trabajar
- Funcionalidades y cambios de contratos: skill `sdd`, spec viva y criterios EARS.
- Un cambio pequeño sin nuevo comportamiento puede resolverse directamente con verificación dirigida.
- Delega solo con solicitud del usuario o siguiendo el flujo aprobado de `coordinator`.
- Una tarea por implementador; un único escritor por archivo. Sin delegación recursiva.
- Usa búsquedas dirigidas; no releas todo el repositorio, los PDF o el README en cada tarea.
- Entrega breve: tarea/RF, archivos, comandos/resultados y bloqueos; nunca inventes evidencia.
- Consulta `docs/ai-workflow.md` para aprobaciones, permisos y límites de consumo.

## Contratos y convenciones
- Especie ≠ lote ≠ pescador. Stock/canasta cuentan kg enteros o peces enteros según modalidad.
- COP redondeado por línea; recibos históricos independientes del inventario actual.
- Cambios de negocio: skill `domain-rules`; API: `backend-api`; datos: `postgres-migrations`.
- Sigue el estilo de los archivos afectados. Identificadores nuevos en inglés; interfaz y documentación en español.
- Conserva accesibilidad, separación de cuentas y atribuciones de imágenes.

## Cierre
- Ejecuta las comprobaciones correspondientes al cambio; distingue ejecutadas de pendientes.
- Actualiza la tarea asignada y `MEMORY.md` al terminar o quedar bloqueado; un escritor designado por el coordinador.
- Mantén memoria ≤50 líneas, reglas ≤40; decisiones duraderas en `docs/decisions/`.
- Cambios de requisitos vuelven a spec/plan antes del código. No marques validada una spec sin evidencia.
- No guardes secretos ni datos personales en prompts, memoria o documentación.
