# Plan — Ajustes UI y vencimiento de lotes (CUI-P1)

Spec: `spec.md` R2 y plan CUI-P1 aprobados por el usuario el 2026-11-18.

## Enfoque

Conservar React/Next.js/pg y reglas de stock actuales. Ingreso y total de pedidos no cambian. Los productos agotados se mantienen como lotes persistidos; se agrega un instante confiable de agotamiento y estado de retiro automático distinto del retiro manual (`withdrawn_at`). El reloj de PostgreSQL es autoridad. El catálogo nunca expone/vende lotes vencidos aunque el proceso periódico se ejecute tarde.

## Tareas propuestas

1. **CUI-T1 — UI administrativa responsive.** Separar filtros de nombre/correo/documento en contrato/consulta, ajustar grilla de filtros, densidad y alineación de columnas, y presentar acciones como grupo flexible con tamaños uniformes; mantener alternativa de tarjetas/stack móvil. Aplicar consistencia a otras tablas del dashboard sin cambiar permisos. Prueba Playwright en móvil/tableta/escritorio.
2. **CUI-T2 — Retirar texto promocional de compra.** Eliminar bloque de impacto y frases de intermediación de `BuyerDialogs` y localizar cualquier aparición restante en vistas de compra/recibo. No tocar lógica de totales, order snapshots ni persistencia.
3. **CUI-T3 — Persistencia/expiry PostgreSQL.** Nueva migración aditiva con `out_of_stock_at` y `auto_hidden_at` (nombres a validar); trigger SQL fija timestamp en transición a cero, lo conserva mientras siga agotado, cancela si repone antes del límite y mantiene separado retiro manual. Actualizar Prisma. Resolver explícitamente stock histórico en cero; no inferir fecha pasada.
4. **CUI-T4 — Barrera pública y proceso automático.** En cada lectura de catálogo, ejecutar sweep idempotente en PostgreSQL para persistir lotes vencidos como ocultos; las consultas públicas aplicarán además el límite exacto con el reloj SQL, aun entre sweeps. El reloj del navegador no participa. Validar stock y visibilidad al añadir al carrito y confirmar checkout dentro de las transacciones/locks existentes. No borrar filas ni recibos. No depender de Vercel Cron: la documentación vigente consultada indica que Hobby solo admite una ejecución diaria, insuficiente para un plazo de 30 minutos. No desplegar/configurar remoto como parte de este plan.
5. **CUI-T5 — Pruebas/revisión.** Unitarias de mapping/UX; integración PostgreSQL aislada para transiciones de stock, reloj, vencimiento, reposición, concurrencia carrito/checkout, retiro manual e invariancia de recibos; E2E responsive y compra. Registrar evidencia, revisión y pendientes.

## Archivos/rutas previstos

- UI: `src/admin/FisherAccounts.tsx`, `src/admin/AdminDashboard.tsx`, `src/styles.css`, `server/contracts/admin.ts`, `server/services/admin.ts`, `src/buyer/BuyerDialogs.tsx`, `src/Checkout.tsx`, `src/Orders.tsx`, `src/fisher/FisherPortal.tsx`.
- Persistencia: `server/prisma/schema.prisma`, nueva carpeta `server/prisma/migrations/<fecha>_lot_expiry/migration.sql`.
- API/servicios: `server/services/catalog.ts`, `server/services/carts.ts`, `server/services/checkout.ts`, controlador/ruta de proceso programado y configuración de scheduler según decisión.
- Pruebas: `server/services/*.test.ts`, `tests/integration/*`, `e2e/*` y scripts correspondientes.

## Contrato de stock/visibilidad propuesto

- Cero por venta o edición: timestamp SQL se fija una sola vez.
- Reposición anterior a 30 minutos: timestamp se limpia y venta vuelve; no se reinicia por refresco.
- Al cumplir 30 minutos: filtro público excluye al lote usando la hora SQL, y el sweep persistirá `auto_hidden_at` en la siguiente consulta backend.
- Proceso: sweep server-side oportunista durante consultas de catálogo; el predicado SQL estricto oculta exactamente al vencer aunque no haya una solicitud posterior.
- Stock cero siempre impide add-to-cart/checkout, incluso durante la ventana de visibilidad.
- Retiro manual sigue usando su mecanismo actual; no se confunde con retiro por agotamiento.
- [NECESITA ACLARACIÓN] Restock después de vencimiento: propuesta es mantener oculto y requerir republicación.
- [NECESITA ACLARACIÓN] Lotes ya agotados al migrar: propuesta es ocultarlos inmediatamente y preservar datos, sin inventar hora histórica.

## Puertas de datos/operación

- La migración se revisa con SQL exacto, constraints/índices, compatibilidad con datos históricos, rollback y recuperación antes de solicitar ejecución.
- Ninguna consulta de escritura/DDL a Supabase, ejecución de cron ni despliegue se incluye sin permiso específico y destino confirmado.
- Demo no se usa para ensayos destructivos. Integración solo en esquema aislado autorizado.

## Hecho cuando

RF-CUI-01–08 tienen evidencia; las decisiones CUI-09 y backfill están cerradas; T1–T5 pasan comprobaciones; cron/visibilidad exacta y concurrencia se demuestran; migración revisada/recuperable, sin DDL remoto no autorizado; ambiente y recibos sin regresión.
