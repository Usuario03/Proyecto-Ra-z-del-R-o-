---
name: PostgreSQL y migraciones
description: Modificar o revisar modelos relacionales, migraciones, restricciones y transacciones de PostgreSQL para Raíz del Río.
---
# Datos de Raíz del Río

Leer la spec activa y docs/deployment.md desde la raíz. Proveedor y ORM requieren decisión antes de implementar.
- Versionar migraciones junto al código. Un escritor por esquema/migración; ordenar dependencias antes de integrar.
- Aplicar claves foráneas, unicidad y restricciones de cantidades/precios según contrato.
- Definir representación exacta de dinero/peso; evitar aritmética monetaria imprecisa.
- Confirmar compra con control concurrente de stock y transacción; preservar líneas históricas.
- Probar rollback y dos compradores compitiendo por inventario limitado en PostgreSQL real.
- Diferenciar fechas de calendario de instantes; vigencias ambientales con límites y zona de negocio explícitos.
- Las fotos son objetos externos; DB almacena referencias y metadatos necesarios.
- Pruebas con base aislada y semillas ficticias. No ejecutar resets contra producción.
- Separar conexión de aplicación con pooling y conexión de migración según proveedor/ORM.
- Ensayar migraciones en entorno de prueba; documentar compatibilidad con versión anterior y recuperación.
- Build genera artefactos; migrar producción es una fase de publicación controlada, no un efecto lateral del build.
- Mantener major PostgreSQL alineado entre local, integración y remoto; documentar parches administrados por proveedor.
