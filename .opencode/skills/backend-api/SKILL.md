---
name: Backend API
description: Diseñar, implementar o revisar rutas HTTP Next.js, validación de entradas, autorización y contratos de Raíz del Río.
---
# API de Raíz del Río

Consultar desde la raíz docs/architecture.md y la spec activa. El backend aún es objetivo hasta que la migración esté implementada.
- Usar Route Handlers del App Router según versión aprobada; mantener rutas pequeñas y negocio en servicios.
- Validar entradas en runtime; TypeScript no valida JSON recibido. Establecer límites, paginación y errores consistentes en el contrato.
- Obtener usuario/rol de la sesión de servidor. Verificar propiedad del recurso; no confiar en IDs, roles ni totales enviados por cliente.
- Aplicar stock, precios, tallas y vedas en servidor; usar domain-rules cuando afecte comercio.
- Separar campos públicos de credenciales y datos privados. No serializar directamente entidades completas de DB.
- Definir comportamiento ante reintentos/idempotencia para operaciones comerciales.
- No colocar secretos en NEXT_PUBLIC_*. No persistir PAN, CVV ni credenciales bancarias.
- Prisma, librería de sesión, pagos y respuestas exactas requieren decisiones en plan; no agregarlos por inferencia.
- Verificar camino válido, entradas inválidas, sesión ausente, otro propietario y fallos de persistencia.
- No declarar lista para producción una ruta comprobada solo mediante mocks.
