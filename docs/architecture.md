# Arquitectura y selección de contexto

## Actual — comprobado en el repositorio
Shell Next.js 16.4.0 / React 19.3.0 declarados en package.json; TypeScript estricto, Tailwind 3 y lucide-react. Vite 6 permanece durante la transición.
Next: `src/app/page.tsx` → `src/client/PrototypeShell.tsx` (dynamic, ssr:false) → `PlataformaPescaDual.tsx` → `StoreProvider` → vistas por rol. Entrada Vite conservada: `src/main.tsx`.
`npm run dev` sigue usando Vite; `dev:next`, `build` y `preview` usan Next. Shell implementado no equivale a T01 aceptada: continúa BLOQUEADA por reproducibilidad/revisión.
La navegación usa estado React, sin router. `StoreContext.tsx` ofrece store/setStore/getStore y escribe en localStorage.
`domain.ts` agrupa tipos, semillas, cálculos, inventario, pedidos, reglas ambientales y migración V1/V2 a V4 (`raiz-rio-demo-v4`).
`auth/authDomain.ts` implementa identidades excluyentes y canastas por cuenta. La autenticación es de demostración.
`Checkout.tsx` simula pagos. `Chat.tsx` responde de forma determinista, sin LLM.
Imágenes locales y fotos reducidas en el navegador. No hay API de negocio ni sincronización entre dispositivos.

## Contexto por tarea — leer por necesidad
| Tarea | Entradas de código | Verificación existente |
| --- | --- | --- |
| Stock, unidades, captura, venta | `src/domain.ts`, `src/fisher/InventoryItem.tsx`, `src/fisher/CaptureWizard.tsx` | `src/domain.test.ts`, `e2e/inventory.spec.ts` |
| Identidad y perfil | `src/auth/authDomain.ts`, `src/auth/`, `src/buyer/CustomerProfile.tsx` | `src/auth/authDomain.test.ts`, `e2e/auth.spec.ts`, `e2e/profile.spec.ts` |
| Compra y recibos | `src/Checkout.tsx`, `src/Orders.tsx`, `src/buyer/BuyerDialogs.tsx` | `e2e/dual.spec.ts` y pruebas de dominio |
| Reglas ambientales | `src/admin/AdminDashboard.tsx`, símbolos ambientales de `src/domain.ts` | `e2e/admin.spec.ts` y pruebas de autorización |
| Accesibilidad y responsive | `src/accessibility/`, `src/components.tsx`, secciones de `src/styles.css` | `e2e/accessibility.spec.ts`, `e2e/fisher-layout.spec.ts` |
| Navegación y estado | `src/PlataformaPescaDual.tsx`, `src/SiteHeader.tsx`, `src/StoreContext.tsx` | `e2e/navigation.ts`, flujos afectados |
| Harness | `AGENTS.md`, `docs/ai-workflow.md`, perfil/comando/skill afectado | `npm run harness:check` |

`domain.ts`, `styles.css`, `StoreContext.tsx` y `PlataformaPescaDual.tsx` son puntos compartidos: un escritor a la vez.
Buscar símbolos antes de leer archivos completos. Algunas líneas JSX contienen componentes extensos.

## Objetivo confirmado — backend aún no implementado
Rutas HTTP Next.js → servicios de aplicación → PostgreSQL. Vercel ejecuta la aplicación; la base requiere proveedor independiente.
Monolito modular propuesto: identidad, catálogo/capturas, inventario, pedidos/pagos y reglas ambientales.
Las rutas validan entradas/sesión y traducen errores HTTP; los servicios aplican reglas y transacciones.
Fotografías en almacenamiento de objetos; PostgreSQL guarda referencias.
Contratos API explícitos; no exponer modelos de persistencia completos al cliente.

## Decisiones aprobadas y pendientes
- Spec 002: frontend integrado, Prisma 7 y Better Auth en la aplicación; Supabase Free para PostgreSQL/fotos (no Supabase Auth), Vercel Hobby condicionado a uso académico personal no comercial. ORM/auth aún no implementados.
- Simulación persistida sin cobros, datos ficticios sin importación de credenciales locales, avisos ambientales internos; no reservas/cancelaciones nuevas ni notificaciones externas.
- R4 elimina Docker/PostgreSQL local: pruebas backend aisladas en Supabase dev; nunca pruebas destructivas en demo. Proyectos creados según usuario, conexión no verificada.
- Pendientes: G1/H2, matriz operación/destino/rol/autorización sin redefinir guardas; versión efectiva PostgreSQL, condiciones Hobby y ERS/fuentes normativas. T01 sigue bloqueada; versionado separado no habilita backend.

## Fuentes
README y código actuales; documento de grado «Documento grado final 8 oct.docx», objetivos y Fase 2.
El documento académico no equivale a una ERS aprobada. Ver `docs/requirements/traceability.md`.
