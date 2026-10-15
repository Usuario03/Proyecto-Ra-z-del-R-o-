---
name: Reglas de pesca y comercio
description: Cambiar cálculos COP, kilos/peces, stock, capturas, pedidos históricos o reglas ambientales de Raíz del Río.
---
# Contratos de dominio

Referencia actual desde raíz: src/domain.ts y src/auth/authDomain.ts; tests asociados. Consultar símbolos relevantes, no copiar el módulo completo.
- Product.id identifica lote; speciesId identifica especie; fisherId identifica propietario.
- Stock y canasta cuentan unidades enteras: kg si no hay pieceWeightGrams, peces completos si lo hay.
- Peso por pez en gramos; importe redondeado por línea a COP. Reutilizar weightKg/lineAmount o su sucesor aprobado.
- Foto obligatoria para nuevas capturas; preservar ilustraciones de semillas antiguas en modo demo.
- Veda/talla se revalidan al publicar y confirmar compra. Un carrito previo no autoriza una venta restringida.
- Pedido guarda instantáneas; retirar lote o modificar perfil no altera recibos anteriores.
- Preparación por pescador y recepción únicamente por comprador cuando todas las partes están enviadas.
- Canastas e historial separados por cuenta; cerrar sesión no expone datos privados.
- El acceso actual es simulado. Backend debe reemplazarlo por sesión verificable, no trasladar identidades de localStorage como autoridad.
- Ingreso bruto no es utilidad; los indicadores se derivan de pedidos confirmados.
- Vedas/tallas iniciales son educativas. Para reglas reales registrar fuente, vigencia y ámbito, sin inventar disposiciones.
- Instantes de eventos en UTC y visualización local; fechas/calendarios en zona de negocio explícita, propuesta America/Bogota. No prohibir globalmente toISOString.
- Requisitos nuevos deben resolver pago, reservas, cancelaciones y recuperación antes de modificar esos estados.
