# Validación — Spec 004

Estado: implementación local en progreso; no validada para despliegue.

| Requisito | Evidencia | Estado |
|---|---|---|
| RF-CUI-01 filtros y UI responsive | Filtros separados en contrato/UI; CSS table-card para viewport <=1279px; typecheck/build | Parcial: Playwright/axe de la pantalla administrativa pendiente |
| RF-CUI-02 mensajes de compra | Búsqueda en `src` sin las frases solicitadas; recibo conserva productos, total, identificador y estado por familia | Código implementado; E2E pendiente |
| RF-CUI-03/04 agotamiento y 30 minutos | Trigger PostgreSQL y filtro de catálogo con `statement_timestamp()`; cambio checkout a cero conserva inventario histórico | Pendiente de prueba PostgreSQL autorizada |
| RF-CUI-05 retiro/visibilidad | Sweep idempotente en lecturas backend más predicado SQL exacto; no Vercel Cron (plan Hobby limita a 1 vez/día según documentación Vercel) | Implementación local; DB real no ejecutada |
| RF-CUI-06 reposición previa | Trigger limpia timestamps al reponer antes del corte | Pendiente de PostgreSQL |
| RF-CUI-06a retiro manual | Conserva `withdrawn_at`/ruta existente, independiente de auto-hidden | Revisión de código; E2E pendiente |
| RF-CUI-07 carrito/checkout | Guardas de auto-hidden/expiración en alta, fusión de carrito y confirmación, además de stock atómico | Pendiente de pruebas PostgreSQL concurrentes |
| RF-CUI-08 historia | Migración no borra filas; retiro actual no modifica `order_lines` | Revisión SQL solamente; rollback/backup/relaciones requieren revisión |
| Suite local | `npm test` 77/77; `npm run typecheck` OK | Aprobado local |
| Build | `npm run build` terminó en reintento; Next.js mostró aviso de vulnerabilidad conocida | Build OK con riesgo de dependencia |
| E2E | `npm run test:e2e` | Primer intento no arrancó: Next detuvo build por el aviso de seguridad; retry quedó ejecutándose al registrar esta fila |
| Supabase/DDL | No ejecutados | Migración deliberadamente no aplicada; grants/RLS/target no verificados |

No afirmar operación efectiva en PostgreSQL ni producción hasta ejecutar las pruebas autorizadas y revisar el SQL exacto, rollback y recuperación.
