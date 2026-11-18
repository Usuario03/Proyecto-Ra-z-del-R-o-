# Spec 004 — Ajustes administrativos, mensajes de compra y lotes agotados

Revisión: R2 · 2026-11-18
Estado: R2 y plan CUI-P1 aprobados por el usuario el 2026-11-18; decisiones de reposición y legacy cerradas.
Base observada: `main` en `6aa92e4`; API Next.js/pg y PostgreSQL, UI React; sin cambios de código en esta revisión.

## Contexto y límites

El prompt solicita mejorar la presentación del panel de pescadores, retirar dos mensajes comerciales de la interfaz y ocultar publicaciones agotadas 30 minutos después de llegar a stock cero, sin borrar datos históricos ni modificar cálculos financieros.

La aplicación ya valida stock en carrito y checkout mediante PostgreSQL. `lots` tiene `stock_units`, `withdrawn_at`, `version` y fechas; no tiene timestamp de agotamiento ni estado de ocultamiento automático. El checkout descuenta unidades con `UPDATE` transaccional. El carrito de compra presenta actualmente ambos mensajes en `src/buyer/BuyerDialogs.tsx`. La tabla administrativa actual usa scroll/card responsive y acciones flexibles en `src/admin/FisherAccounts.tsx`, pero todavía requiere ajuste de densidad/espaciado.

No se autoriza por esta spec ejecutar DDL, cambiar datos remotos ni publicar/desplegar. Migración, permisos de Supabase y recuperación requieren aprobación operativa independiente.

## Actores

- Administrador: consulta/gestiona pescadores y usa el resto del dashboard.
- Cliente: consulta catálogo, mantiene carrito y confirma compras.
- Pescador: publica o repone lotes propios.
- Backend/PostgreSQL: autoridad de stock, instante de agotamiento y visibilidad pública.

## Requisitos EARS

- **RF-CUI-01 — Panel responsive:** CUANDO administración consulte la gestión de pescadores o una sección del dashboard con tabla/acciones, EL SISTEMA ofrecerá filtros diferenciados de nombre, correo y documento junto con estado, zona y fechas; alineará filtros/columnas, limitará espacios innecesarios y distribuirá acciones con tamaños/espaciado consistentes, adaptándose a escritorio, tableta y móvil sin desbordamiento horizontal innecesario.
- **RF-CUI-02 — Retirar mensajes:** CUANDO un cliente consulte canasta, resumen o confirmación de compra, EL SISTEMA no presentará «Tu compra llega a las manos correctas», el desglose promocional de ingresos por familias ni «Intermediación evitada estimada» ni sus variantes. La lógica de cálculo, persistencia financiera y recibos se conservarán.
- **RF-CUI-03 — Inicio del plazo:** CUANDO un lote pase de stock mayor que cero a cero por venta o edición autorizada, EL SISTEMA registrará una sola vez el instante de agotamiento usando el reloj de PostgreSQL. Si el lote nace en cero, su política de visibilidad debe estar explícitamente resuelta antes de implementación.
- **RF-CUI-04 — Estado agotado:** MIENTRAS un lote tenga stock cero y no hayan transcurrido 30 minutos desde su agotamiento, EL SISTEMA podrá mostrarlo en el catálogo público con estado claramente «Agotado» y no permitirá incorporarlo ni aumentar su cantidad en carrito.
- **RF-CUI-05 — Expiración pública:** CUANDO hayan transcurrido 30 minutos desde `out_of_stock_at`, EL SISTEMA retirará el lote de publicaciones y consultas públicas automáticamente según hora de PostgreSQL, sin borrado físico ni dependencia de temporizadores del navegador.
- **RF-CUI-06 — Reposición temprana:** SI un lote recupera stock antes de la expiración, ENTONCES EL SISTEMA borrará el timestamp de agotamiento y restablecerá su disponibilidad, cancelando el ocultamiento programado.
- **RF-CUI-06a — Retiro manual:** CUANDO el pescador retire manualmente una publicación, EL SISTEMA conservará el retiro manual existente, independientemente del temporizador de agotamiento; no borrará el lote ni el historial.
- **RF-CUI-07 — Checkout concurrente:** CUANDO un cliente intente confirmar una línea cuyo stock sea cero o cuyo lote ya expiró/esté oculto, EL SISTEMA rechazará la operación dentro de la transacción y conservará pedido, stock e historial sin cambios parciales.
- **RF-CUI-08 — Retención histórica:** MIENTRAS se oculte un lote agotado, EL SISTEMA conservará la fila y las relaciones de pedidos/recibos; ocultamiento no será `DELETE` físico ni alterará snapshots históricos.
- **RF-CUI-09 — Reposición posterior:** SI el lote ya fue retirado automáticamente por superar 30 minutos, EL SISTEMA lo mantendrá oculto aunque luego se intente reponer stock; el pescador deberá publicar un lote nuevo.

## Reglas y datos

- Unidad de stock mantiene los contratos existentes: kg enteros o peces enteros según modalidad.
- El tiempo de agotamiento es un evento persistido; refrescos, reinicios de instancia y consultas no reinician el plazo.
- El plazo exacto se evalúa con el reloj SQL de PostgreSQL. La programación de cualquier proceso periódico no puede hacer visible un lote después del límite.
- Ocultar publicaciones no retira productos de recibos ni destruye líneas de pedido.
- No cambiar importes COP, redondeos ni distribución de ingreso.
- No se inferirá timestamp histórico para lotes que ya estén en cero; estrategia de migración/backfill requiere decisión en el plan y evidencia.

## Aceptación verificable

1. Filtros, columnas y acciones se verifican en viewports escritorio/tableta/móvil; teclado y accesibilidad se mantienen.
2. Los textos eliminados no aparecen en vistas de compra/confirmación, pero los importes y recibos siguen correctos.
3. Prueba PostgreSQL confirma timestamp al llegar a cero y que una actualización reiterada a cero no reinicia el instante.
4. Antes de 30 minutos el lote queda visible como agotado, pero add-to-cart y checkout rechazan venta.
5. Después de 30 minutos desaparece de consultas públicas aunque no haya un navegador abierto; acceso directo por ID tampoco lo expone.
6. Reposición antes del límite restaura catálogo y compra y elimina vencimiento pendiente.
7. Una confirmación concurrente no deja stock negativo ni pedido parcial.
8. Borrado de lote no ocurre; historial de compras queda sin cambios.
9. Migración/rollback, recuperación, grants/RLS y pruebas PostgreSQL se validan en entorno aislado autorizado; no en demo.

## Decisión pendiente

El usuario aprobó conservar el estado agotado durante 30 minutos y luego retirar la publicación automáticamente; el pescador también conserva la opción de retirarla manualmente antes. Tras expiración, una reposición no reabre el lote: se requiere publicar uno nuevo. Lotes preexistentes con stock cero se ocultarán inmediatamente al aplicar la migración, sin inventar su timestamp histórico y conservando las filas.

## Inspección inicial

Rutas revisadas: `src/admin/FisherAccounts.tsx`, `src/styles.css`, `src/buyer/BuyerDialogs.tsx`, `src/Checkout.tsx`, `src/PlataformaPescaFrontend.tsx`, `server/services/catalog.ts`, `server/services/carts.ts`, `server/services/checkout.ts`, `server/prisma/schema.prisma` y migración base. Sin cambios de aplicación, consultas remotas ni escrituras.
