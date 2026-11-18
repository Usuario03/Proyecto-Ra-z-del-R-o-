# Tareas — Spec 004

Estado general: aprobada; implementación local en curso. No ejecutar DDL remoto ni desplegar.

| ID | RF | Alcance/archivos | Dependencias | Estado | Hecho cuando |
|---|---|---|---|---|---|
| CUI-T1 | 01 | FisherAccounts, AdminDashboard, styles, contrato/servicio de filtros | Plan aprobado | Implementación lista; viewport pendiente | UI revisada en desktop/tablet/móvil, filtros y acciones intactos |
| CUI-T2 | 02 | BuyerDialogs, Orders, FisherPortal, Checkout/E2E | Plan aprobado | Implementación lista; E2E pendiente | Frases ausentes y order totals/snapshots sin cambios |
| CUI-T3 | 03, 06, 08 | SQL migración, Prisma, trigger | T1/T2; decisión legacy resuelta: ocultar de inmediato | Implementación local lista; PostgreSQL bloqueado por autorización | Timestamp edge correcto, rollback/recovery revisados, historia intacta |
| CUI-T4 | 04–07 | catalog, carts, checkout, sweep por lectura | T3; post-expiry requiere lote nuevo | Implementación local lista; PostgreSQL pendiente | Vencido invisible a hora SQL; stock cero no vendible; reposición probada |
| CUI-T5 | 01–08 | Unitarias, PostgreSQL aislado, Playwright/axe y validation.md | T1–T4 | En curso | Evidencia por RF, sin tests remotos no autorizados |
