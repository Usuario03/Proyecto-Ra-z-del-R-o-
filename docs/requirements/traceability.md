# Trazabilidad inicial — pendiente de ERS

Fuente: «Documento grado final 8 oct.docx», revisado en esta sesión; objetivos, metodología y Fase 2.
Estos identificadores son de trabajo, no los números de una ERS oficial. Confirmar y enlazar la ERS cuando se reciba.

| ID | Necesidad y fuente | Situación | Próxima evidencia |
| --- | --- | --- | --- |
| TEC-01 | Next.js API + DB, objetivo específico 3 | Next.js/PostgreSQL confirmados por usuario; backend pendiente | Spec de entorno y API desplegada |
| RF-ID-01 | Identidad, roles y propiedad, diseño de seguridad | Simulación local | Spec de autenticación; pruebas de aislamiento servidor |
| RF-CAT-01 | Catálogo y origen, objetivo 2 y casos de uso | Frontend local | Contrato API y E2E con DB |
| RF-LOT-01 | Publicación con foto, talla y modalidad, Fase 2 | Dominio local | API de captura y reglas servidor |
| RF-INV-01 | Evitar sobreventa concurrente, diseño de datos | Pendiente de servidor | Integración concurrente PostgreSQL |
| RF-PED-01 | Pedido atómico e histórico, arquitectura lógica | Estado React local | Transacción, rollback y recibo inmutable |
| RF-AMB-01 | Reglas con vigencia, fuente y auditoría, Fase 2 | Parámetros demo | Spec ambiental y pruebas de fechas |
| RF-ALT-01 | Alertas automatizadas, objetivo 3 | Bloqueos locales | Aclarar canales y calendario |
| RF-PAG-01 | Gestión de ventas/pagos, objetivo 3 y Fase 2 | Simulación | Aclarar sandbox/real/contraentrega |
| RNF-ACC-01 | Interfaz inclusiva, objetivo 2 | Playwright/axe existentes | Conservar flujos y validar con usuarios |
| RNF-DAT-01 | Privacidad, HTTPS y copias, diseño de seguridad | Backend pendiente | Permisos, backups y recuperación comprobada |
| VAL-01 | Pruebas técnicas y piloto, objetivo 4 | Pruebas frontend; piloto no acreditado | Integración y resultados UAT reales |

## Aclaraciones pendientes
- Solicitar ERS / «Análisis y Requerimientos FASE1».
- Tabla de casos de uso presenta resultados aparentemente desplazados entre roles; no convertirlos automáticamente en requisitos.
- Jest aparece en metodología, pero pruebas actuales usan Node Test Runner/tsx: resolver en decisión técnica.
- Vercel es objetivo confirmado; Netlify conserva configuración estática legada, no compatible con el build Next actual sin adaptación.
- Validar qué datos del prototipo se preservan al introducir backend.
