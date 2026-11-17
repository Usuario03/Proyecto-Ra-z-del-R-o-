# Raíz del Río

### Comercio electrónico para la pesca artesanal de Barrancabermeja

Prototipo académico de una plataforma de comercio directo entre familias pescadoras y compradores del Magdalena Medio, con una experiencia móvil inclusiva y controles ambientales de demostración.

**Proyecto de grado · Ingeniería de Sistemas · Universidad de Investigación y Desarrollo — UDI**

[Ejecutar el proyecto](#ejecutar) · [Recorrido de demostración](#recorrido-completo-para-la-sustentación) · [Arquitectura](#arquitectura) · [Pruebas](#pruebas) · [Créditos](#créditos)

## Acerca del proyecto

**Raíz del Río** es el prototipo funcional de la investigación "Desarrollo de una plataforma de comercio electrónico para la comercialización de pesca artesanal en Barrancabermeja". Propone un canal digital propio para acercar la oferta de pesca artesanal a los consumidores, facilitar la gestión de capturas e inventario y visibilizar el aporte económico a las familias pescadoras.

La experiencia considera la diversidad de habilidades digitales de la población ribereña: utiliza selección visual de especies, controles táctiles amplios, escritura directa de cantidades, lectura de instrucciones y opciones de tamaño de letra. El flujo comercial se acompaña de información sobre consumo responsable, vedas y tallas mínimas.

## Funcionalidades principales

| Perfil | Funcionalidades |
| --- | --- |
| **Visitante** | Catálogo público, búsqueda y filtros, canasta temporal e información del proyecto y de pesca responsable. |
| **Cliente** | Registro e inicio de sesión, perfil editable, compras por kilos o peces de peso uniforme, checkout, seguimiento, historial y recibos imprimibles. |
| **Pescador** | Acceso inclusivo por perfil/PIN, registro de capturas en cinco pasos, foto obligatoria, inventario, eliminación de publicaciones, métricas y preparación/envío de pedidos. |
| **Administrador** | Acceso independiente, configuración simulada de vedas y tallas por especie y registro de cambios ambientales. |

### Aspectos destacados

- **Catálogo local:** Bocachico, Bagre rayado, Bagre pintado, Nicuro, Dorada y Blanquillo.
- **Comercio justo:** desglose del ingreso directo por familia pescadora.
- **Consumo responsable:** bloqueo de publicación y compra según las reglas ambientales configuradas en la demostración.
- **Pagos colombianos simulados:** PSE, Nequi, Daviplata y tarjetas; resultados exitosos/rechazados sin cobros reales.
- **Persistencia centralizada en PostgreSQL:** cuentas de demostración, publicaciones, canastas, pedidos, reglas ambientales y preferencias sincronizados mediante rutas API de Next.js (`/api/*`) hacia PostgreSQL (ver [`server/README.md`](server/README.md)).
- **Diseño responsive:** vistas adaptadas a móviles y escritorio, con pruebas automatizadas de flujos, accesibilidad y desbordamientos.

## Tecnología y alcance

Prototipo académico de demostración para comercio directo de pesca artesanal de Barrancabermeja. Abre en un **inicio público con catálogo**, con **autenticación/registro voluntarios** y **Portal Pescador**, sincronizados mediante un estado React compartido (`StoreContext.tsx`) conectado a las rutas HTTP `/api/*` y base de datos relacional PostgreSQL.

**Next.js 16.4.0 (App Router y Route Handlers API) · React 19.3.0 · TypeScript estricto · Tailwind CSS · PostgreSQL (`pg` 8.23.1) · lucide-react.** No hay pasarelas bancarias comerciales reales; la gestión de ventas y estados de pago opera transaccionalmente en el servidor sobre PostgreSQL con cobros simulados.

Las cuentas incluidas, las transacciones y los parámetros regulatorios son de demostración académica; no representa un servicio bancario, una certificación AUNAP ni una integración oficial con FEDEPESAN.

## Ejecutar

### Ejecutar el prototipo

Entorno de referencia: Node.js 24.14.1 y npm 11.11.0 (ver `.nvmrc`). Configura `DATABASE_URL`, `DIRECT_URL` y `JWT_SECRET` en `.env.local` (o levanta el entorno contenerizado con `docker compose up -d --build`):

```sh
npm ci
npm run db:migrate
npm run dev:next
```

Para compilar y servir en producción con Next.js:

```sh
npm run build
npm run preview
```

`build` ejecuta `next build` y `preview` ejecuta `next start` con salida estándar en `.next/`.

## Despliegue

El prototipo completo (Frontend + 21 rutas `/api/*`) se despliega en **Vercel** conectado mediante TLS a **PostgreSQL en Supabase** (`DATABASE_URL`, `DIRECT_URL` y `JWT_SECRET`). Consulta [despliegue](docs/deployment.md) y la documentación del modelo de base de datos en [`server/README.md`](server/README.md).

## Recorrido completo para la sustentación

1. La página abre directamente en el inicio y el catálogo, sin pedir una cuenta. En el encabezado pulsa **Iniciar sesión** y selecciona **Pescador Artesanal**. El registro está en la pestaña **Registro de Usuario**. Puedes cancelar con **Volver al inicio**.
2. Elige **Don Pedro**. Entra con un toque simulado o con el PIN **1234**; el teclado grande admite también teclado físico.
3. Revisa el panel de ingresos, kilos y pedidos pendientes. **Escuchar ayuda** utiliza una voz española local del navegador cuando existe; de lo contrario muestra la guía escrita.
4. Pulsa **REGISTRAR Y SUBIR NUEVA PESCA**.
5. Selecciona Nicuro y elige **Por kilos** o **Peces del mismo peso**. En el segundo caso, indica peso por pez (gramos), cantidad de peces y confirma que todos pesan lo mismo. Ajusta el precio por kilo, compara la talla, elige zona/método y revisa las fechas de captura y desembarque.
6. Puedes indicar un costo de faena por kg para calcular un resultado estimado. El indicador de ingreso directo continúa siendo bruto: precio × kilos, sin comisión.
7. Toma o carga una foto JPG/PNG/WebP del pescado. **La foto es obligatoria para nuevas publicaciones**: ya no hay cámara simulada ni opción de publicar sin imagen. Se ajusta proporcionalmente a un marco de 960 × 720 px, sin estirar ni recortar el pescado, antes de guardarse localmente.
8. Publica y pulsa **Ver en la tienda**. El nuevo lote aparece en el catálogo público con el nombre del pescador, sus datos de captura y su imagen. El logotipo del encabezado también permite volver al inicio desde el portal.
9. Cierra la sesión de pescador desde **Mi cuenta** e inicia como cliente con **Ingreso Rápido Cliente Demo**, o registra un comprador. Añade el lote a la canasta y compra. También se permite preparar una canasta como invitado e iniciar sesión al continuar; los productos se conservan. Completa datos ficticios de entrega en Barrancabermeja.
10. Selecciona **Pago rechazado**, intenta pagar y verifica que se conservan productos, nombre, dirección, teléfono y selección bancaria.
11. Cambia a **Pago exitoso** y confirma. Se crea un pedido y una transacción, se descuenta inventario y se vacía la canasta.
12. Cierra la sesión de cliente e inicia como el pescador que publicó el lote. Abre **Mis pedidos**: el importe y los kilos están reflejados en el dashboard. Marca **Pedido preparado en puerto** y después **Enviado con domiciliario**.
13. Vuelve a entrar como cliente. **Mi cuenta → Mis compras** abre el dashboard de compras: historial, búsqueda, filtros, seguimiento y recibos. Una vez enviado todo el pedido puedes **Confirmar recepción**. Recarga para comprobar que se conserva; la visita vuelve al inicio público y mantiene tu sesión activa.

### Autenticación y registro V4

**Navegación pública y encabezado único**

- Inicio, catálogo, búsqueda y contenido del proyecto son accesibles sin sesión. Se retiraron el botón/modal «Ver origen y captura» y la franja de indicadores del inicio; las reglas ambientales siguen funcionando internamente.
- Un solo encabezado reúne logotipo, **Inicio**, navegación, texto grande, canasta e **Iniciar sesión**. Inicio tiene el mismo aspecto que los demás enlaces, sin icono ni borde propio. En teléfonos los enlaces se distribuyen en dos filas para conservar áreas de toque amplias.
- **Mi cuenta** muestra únicamente las opciones del rol activo: cliente → compras y perfil; pescador → panel de pesca; administrador → administración ambiental. Todos incluyen **Cerrar sesión**. No hay acceso cruzado ni opción «Iniciar con otra cuenta» dentro de los menús.
- Se puede preparar y conservar una canasta como invitado. Iniciar sesión para comprar transfiere sus productos una sola vez, manteniendo las validaciones de stock y veda.
- **Cerrar sesión** vuelve al catálogo público y guarda la canasta privada en su cuenta; no se muestra a otro visitante.

**Cliente / Comprador**

- Inicio con correo personal y contraseña; el correo se normaliza para evitar duplicados por mayúsculas o espacios.
- Cuenta de evaluación: **comprador@gmail.com**, contraseña **Demo1234**. El botón de ingreso rápido activa esa misma cuenta sin escribir los datos.
- Registro con nombre, correo, móvil, dirección en Barrancabermeja y creación/confirmación de contraseña (8–128 caracteres).
- Al registrar se abre la tienda y se guardan los datos del perfil. El checkout los precarga y permite ajustarlos para cada pedido.
- Cada cliente conserva su propia canasta y ve sus propios pedidos/transacciones. El catálogo y el inventario permanecen compartidos.
- **Mi cuenta → Mi perfil** permite editar nombre, correo, teléfono y dirección de entrega, guardar o descartar cambios. Se valida que el correo no pertenezca a otra cuenta y que celular/dirección sean válidos. Cambiar el correo modifica el acceso futuro, conservando la misma contraseña e identidad.
- La actualización se aplica a próximos checkouts y al encabezado; no reescribe las direcciones, nombres ni importes de pedidos anteriores. También funciona en la cuenta Cliente Demo y persiste al recargar. Si se modifica el correo demo, la pantalla de acceso muestra el correo actualizado para esa cuenta local.
- Su dashboard muestra compras realizadas, pedidos en seguimiento y total comprado. Permite buscar por especie/pescador/pedido, filtrar compras recibidas o activas y consultar el avance de cada familia pescadora. Un pedido de varias familias solo se marca recibido cuando todas han enviado su parte.

**Pescador Artesanal — FEDEPESAN**

- Correos/perfiles seleccionables por lista o tarjetas: por ejemplo, `don.pedro.fedepesan@pescabarranca.co` (Muelle) y `dona.maria.fedepesan@pescabarranca.co` (El Llanito).
- Acceso por PIN con teclado grande o un toque simulado. Los perfiles iniciales usan **1234**.
- Solicitud local con nombre, cédula sin puntos (6–12 dígitos) y puerto: Muelle, La Rampa o El Llanito.
- Se asignan correo único y PIN de cuatro dígitos; aparecen al terminar y en **Mi perfil**. Los nombres repetidos reciben un sufijo en el correo; una cédula duplicada se rechaza.
- La solicitud abre el portal inmediatamente para probar publicaciones y pedidos. No verifica afiliación real ni crea un buzón de correo.

**Sesiones excluyentes:** solo existe una identidad activa. Entrar como cliente cierra la identidad de pescador/administrador, y viceversa. Para cambiar de cuenta se debe cerrar sesión y acceder nuevamente. Las sesiones mixtas guardadas por versiones anteriores se migran conservando solo el rol activo. Las cuentas, canastas privadas, lotes e historial se mantienen. Al recargar siempre se presenta el inicio público y el menú de la sesión guardada. Pescadores y administradores pueden consultar el catálogo, pero la canasta y la compra corresponden a clientes/invitados.

Las contraseñas de cliente y PINs no se guardan en texto plano: en el servidor se almacena un hash `scrypt` con sal aleatoria por usuario en `auth_credentials` y sesiones JWT `HttpOnly` (`server/security/`). Para registro e ingreso con contraseña usa **localhost o HTTPS**.

### Casos ambientales e inventario

- Accede desde **Iniciar sesión → Administración**, con **jairoleal@admin.com** y contraseña de prueba **Admin1234**. No hay registro público de administradores.
- El panel **Gestión ambiental AUNAP** permite activar/desactivar vedas de las seis especies y ajustar sus tallas mínimas ilustrativas. La medida se aplica por especie a todos sus lotes, incluidos los nuevos. Conserva el historial de los últimos 50 cambios en PostgreSQL (`environmental_audit`).
- Solo la sesión administradora puede modificar estos parámetros: se valida en la interfaz, en las funciones de dominio y mediante control de acceso por rol (`RBAC`) en el servidor. No existen interruptores ambientales en los menús de clientes o pescadores ni en el pie de página público.
- El wizard impide avanzar/publicar con talla insuficiente o veda activa y el servidor vuelve a validar al publicar (`POST /api/lots`).
- Dentro del panel administrativo se puede simular Bocachico de 22 cm, comparándolo con la talla mínima configurada (25 cm por defecto).
- **Mi pesca** permite pausar lotes, escribir directamente la cantidad o usar los botones −/+. El rango es 0–500 kg para ventas por kilos, o 0–500 peces para lotes de peso uniforme. El dueño de otro perfil no puede modificar ni eliminar esos lotes.
- Si se restringe una captura que ya estaba en una canasta, se conserva visible con la explicación del bloqueo y no puede pagarse.
- Bagre rayado comienza en veda. El lote inicial de Bagre pintado está retenido por talla.

### Cantidad de peces, kilos y eliminación de publicaciones

- El **Paso 2. Cantidad y precio** reúne tres bloques: forma de venta, cantidad disponible y precio por kilo. Las opciones de venta son tarjetas seleccionables; los campos numéricos muestran su unidad junto al valor y admiten escritura o botones −/+. Hay accesos rápidos a pesos de 250 g, 500 g, 1 kg y 2 kg, y precios de referencia para cada especie.
- Un resumen muestra los kilos totales, el valor de cada pez cuando corresponde y el ingreso bruto si se vende todo. El cálculo de costos queda en un apartado opcional desplegable.
- **Por kilos:** mantiene el comportamiento de publicaciones existentes, en kilogramos enteros. No se inventa un número de peces para lotes que no lo registraron.
- **Peces del mismo peso:** cada pez es una unidad indivisible. Registra su peso entre 1 y 50.000 gramos y la cantidad de peces (1–500 al publicar). Se exige confirmar que todos los ejemplares tienen ese peso. Si hay pesos diferentes, se publican lotes separados.
- Ejemplo: **4 peces de 500 g = 2 kg**. Con precio de **$16.000/kg**, cada pez cuesta **$8.000**; comprar **2 peces** representa **1 kg y $16.000**.
- El cliente elige peces completos en la canasta. Catálogo, recibos y pedidos muestran cantidad, peso por ejemplar y kilos totales. El precio base continúa expresado por kg.
- En **Mi pesca** se distinguen **Disponible para vender**, **Cantidad vendida de este lote** e **Ingreso de ventas confirmadas**. Los controles editan lo disponible; las cantidades vendidas se calculan desde los pedidos y no son editables.
- **Eliminar publicación** retira el lote de inventario, catálogo y todas las canastas mediante baja lógica (`withdrawn_at` en `lots`). Los recibos y pedidos confirmados se conservan, y el pescador puede seguir preparándolos y enviándolos. La eliminación persiste al recargar, incluidos los lotes iniciales.
- El peso por pez de una publicación ya creada no se modifica. Para un peso diferente se registra un lote nuevo, evitando alterar una selección o compra anterior.

### Nuestra comunidad y educación ambiental

El enlace **Nuestra comunidad** lleva a la presentación de las familias y a una sección educativa que explica qué es una veda, para qué sirven las tallas mínimas y por qué una tienda debe aplicar estos controles. Incluye el papel de la AUNAP y sus resoluciones, el marco ambiental del Decreto 2811 de 1974, el contexto social de la Ley 2268 de 2022 y los ODS 12/14.

La comunidad puede consultar estados de veda y tallas de prueba por especie, sin modificarlos. El contenido distingue el contexto normativo de los parámetros ilustrativos: no presenta la Ley 2268 como una tabla de tallas ni la simulación como calendario oficial.

### Pagos

| Método | Simulación |
| --- | --- |
| PSE | Banco, persona natural/jurídica y autorización modal; esos datos acompañan al recibo. |
| Nequi/Daviplata | Celular, notificación animada y plazo de 60 segundos; vencimiento registrado sin descontar stock. |
| Visa/Mastercard | Máscara, Luhn, vencimiento y giro visual al ingresar CVV. |

Tarjeta de prueba: **4242 4242 4242 4242**, vencimiento **12/30**, CVV **123**. Elige una fecha posterior si ejecutas la aplicación después de 2030.

Cerrar el checkout durante el procesamiento cancela la operación pendiente. Los campos sensibles permanecen únicamente en memoria y se destruyen al cerrar el checkout. El recibo confirmado se recupera desde **Mis compras**.

## Arquitectura

```text
app/
  layout.tsx                  Layout Next en español
  page.tsx                    Entrada App Router
  api/                        21 Route Handlers REST (/api/auth, /catalog, /lots, /cart, /checkout, /orders, /environment, /me)
server/
  README.md                   Diccionario de las 15 tablas PostgreSQL, relaciones PK/FK y flujos de negocio
  api/                        Controladores HTTP
  contracts/                  Validación de entradas y contratos DTO
  db/                         Pool PostgreSQL (db.ts) y ejecutor de migraciones (migrate.ts)
  domain/                     Reglas puras de comercio y control ambiental en servidor
  prisma/migrations/          Esquema SQL de 15 tablas y semillas idempotentes
  security/                   JWT HS256, scrypt, RBAC, protección CSRF Origin y Rate Limiting
  services/                   Servicios transaccionales sobre PostgreSQL
src/
  client/                     Cliente HTTP hacia /api/* (api.ts, session.ts, catalog.ts, cart.ts) y PrototypeShell.tsx
  PlataformaPescaDual.tsx      Navegación pública, accesos y continuidad del checkout
  SiteHeader.tsx              Encabezado único y menú de cuenta
  StoreContext.tsx            Estado compartido sincronizado con el backend /api/*
  domain.ts                   Tipos, modelos de demostración y reglas de dominio
  auth/                       Módulos de acceso y registro por rol
  PlataformaPescaFrontend.tsx Tienda, catálogo y filtros
  admin/AdminDashboard.tsx    Vedas, tallas, simulación y registro de cambios
  buyer/                      Hero, canasta, dashboard de compras, perfil y educación ambiental
  fisher/                     Portal inclusivo, asistente de captura en 5 pasos, inventario y ayudas
  Checkout.tsx                Máquina de estados de pagos conectada a /api/checkout/attempts
  Orders.tsx                  Recibos imprimibles de compras confirmadas
  accessibility/              Controles de texto, voz y retroalimentación accesible
e2e/                          24 escenarios E2E en Playwright (escritorio y móvil)
```

### Comunicación de los perfiles

`StoreProvider` sincroniza el estado del catálogo, reglas ambientales, sesiones, canastas y órdenes con los endpoints `/api/*` sobre PostgreSQL. Cada `Product` tiene un `id` de lote, un `speciesId` y un `fisherId`. La veda se consulta por **especie**; el stock y la canasta por **lote**; ingresos y preparación por **pescador**.

Un pedido guarda en PostgreSQL (`orders`, `order_lines` y `order_fulfillments`) instantáneas históricas independientes (`*_snapshot`) de sus líneas, importe, datos ficticios de entrega, método y estado logístico de cada familia. Cambiar inventario o retirar publicaciones posteriormente no modifica el recibo histórico.

## Persistencia

Toda la persistencia de negocio reside de forma centralizada en **PostgreSQL** a través de 15 tablas relacionales documentadas en [`server/README.md`](server/README.md):

- **Usuarios y credenciales (`profiles`, `auth_credentials`, `fisher_details`, `media_assets`):** perfiles por rol, contraseñas/PINs derivados con `scrypt` y fichas de pescadores FEDEPESAN.
- **Catálogo y control ambiental (`species`, `environmental_rules`, `environmental_audit`, `lots`):** especies, vedas, tallas mínimas, bitácora administrativa e inventario de capturas con control de versiones (`version`) y baja lógica (`withdrawn_at`).
- **Canastas (`carts`, `cart_lines`, `cart_merges`):** canastas privadas por cliente e incorporación idempotente de la canasta temporal de invitado al iniciar sesión.
- **Gestión de ventas y despacho (`checkout_attempts`, `orders`, `order_lines`, `order_fulfillments`):** registro de intentos de pago (`exitoso`, `rechazado`, `vencido`), órdenes confirmadas en aislamiento `SERIALIZABLE`, instantáneas de precio/origen y seguimiento de entrega independiente por familia pescadora.

**No guarda** contraseñas en texto plano, número de tarjeta, CVV ni credenciales bancarias reales. El formulario del wizard sin publicar permanece solo en memoria y se descarta al salir.

## Accesibilidad

- **Clientes e invitados:** el botón **T** del encabezado amplía o restablece el texto. No abre un panel de opciones.
- **Pescadores:** **Ayudas para tu jornada** contiene únicamente **Tamaño de las letras** (Normal / Grande / Muy grande) y **Leer instrucciones**. El selector de letras tiene botones uniformes y la lectura se activa con un interruptor. En escritorio hay dos bloques alineados; en móvil se apilan sin desbordarse.
- Se retiraron el icono anterior, el botón «FACILITAR USO» y el modo fácil con sus pantallas alternativas. El registro conserva sus cinco pasos. Preferencias antiguas de modo fácil se ignoran al cargar.
- Las ayudas del pescador y el botón T del cliente son independientes. El tamaño de letra configurado en el portal no se traslada a una cuenta cliente al cerrar sesión.
- En pantallas pequeñas las ayudas se organizan en una columna con espacios independientes para icono, texto y casilla. Las palabras de las opciones de letra se mantienen completas. Se reducen márgenes anidados, se ajustan tarjetas/fechas y se distribuyen botones de acciones sin recortar contenido.
- Los estilos de los botones −/+ se limitan al contador. Se prueban tarjetas y texto dentro de sus límites, no solo el ancho global de la página.
- Controles táctiles con acciones claras, selección visual de especies y campos numéricos con unidades explícitas. Las dos preferencias de ayuda se mantienen al recargar.
- **Leer instrucciones** habilita botones de audio, no reproducción continua automática. Se utiliza voz local en español cuando está disponible; siempre hay texto alternativo. La tarjeta de ayuda está fuera del flujo de la página: pulsar una o varias veces no cambia la posición del botón ni el desplazamiento.
- Se retiraron **Ver mejor** y **Dictar cantidades**, junto con el reconocimiento de voz para llenar campos. Sus valores antiguos en `localStorage` se descartan para que no vuelvan a activar estilos ni controles retirados. Las cantidades se introducen escribiendo o con −/+; la lectura en voz alta permanece disponible.
- Confirmaciones como **PESCA REGISTRADA**, **CAMBIO GUARDADO** y **NO SE PUEDE PUBLICAR** combinan iconos, texto, un tono local breve cuando la lectura está activada y un botón para escuchar el mensaje. Las alertas de veda incluyen explicación accesible.
- Foto del producto obligatoria al publicar, vista previa proporcional y selectores separados de cámara/archivo. Las publicaciones iniciales antiguas conservan sus ilustraciones; las nuevas necesitan una imagen cargada por el usuario.
- Foco visible, etiquetas, alertas y mensajes de estado.
- Modales con foco inicial, ciclo de Tab, cierre con Escape y retorno al disparador.
- Foco en el encabezado al cambiar de paso; inicio de página al entrar/cambiar de perfil.
- Compatibilidad con `prefers-reduced-motion` y lectura local opcional.
- Pestañas de autenticación con flechas, Inicio/Fin y selección anunciada; en móvil se prioriza el formulario sobre el contenido de presentación.
- Comprobación automatizada de contraste y otras reglas WCAG A/AA mediante axe en autenticación, vista cliente y dashboard. No sustituye una evaluación manual integral con usuarios y tecnologías de asistencia.

## Pruebas

```sh
npm test
npm run env:check
npm run harness:check
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

Las pruebas de dominio cubren cantidades y unidades, fotografía obligatoria, preferencias de ayuda, confirmación de recepción, pesos uniformes, cobro por gramos, redondeo COP, sobreventa, eliminación con conservación de pedidos, tallas, veda, publicación, autorización por perfil, pedidos multifamilia, métricas, recibos inmutables, edición del perfil propio, correos duplicados y persistencia/migración, incluida la cuenta demo y el descarte de preferencias retiradas.

Los recorridos Playwright se ejecutan con Chromium en escritorio y emulación móvil Pixel 7. Además de autenticación, compra, publicación, inventario y administración, verifican las ayudas disponibles, lectura opcional sin desplazamientos, foto obligatoria, paso 2, cálculos, preferencias por rol y dashboard del cliente. Las pruebas específicas del portal recorren inventario, perfil, pedidos y los cinco pasos a **320, 360 y 768 px**, con texto normal/grande/muy grande; comprueban que tarjetas, botones y fragmentos de texto no salgan de sus cajas. Se revisan edición del perfil cliente, reingreso con correo modificado, precarga de entrega e Inicio con estilos iguales al resto de enlaces. Incluyen teclado y análisis axe. Las capturas quedan en `test-results/`; los fallos generan trazas para diagnóstico.

## Datos y contexto académico

### Fotografía del inicio

El banner muestra **Atardecer en el Muelle de Barrancabermeja**, de **Renato Revueltas**, con licencia **CC BY-SA 4.0**. Se seleccionó una fotografía original de **4000 × 5901 px** del río Magdalena, recortada para destacar el atardecer y la embarcación.

Se sirve desde `public/images/` en WebP de **1920 × 1440 px** (aprox. 91 KiB) y **960 × 720 px** (aprox. 36 KiB), con `srcSet`, recorte adaptativo y prioridad de carga. No depende de un servicio externo de imágenes al visitar la página.

Fuente, licencia y adaptaciones: [`public/images/ATTRIBUTION.md`](public/images/ATTRIBUTION.md). El script `scripts/prepare-hero.py` reproduce la optimización desde el original descargado (Python + Pillow). La atribución es visible en el banner.

Los perfiles son **ficticios**, con retratos ilustrados locales sustituibles. No se presentan como pescadores reales verificados. Para una versión institucional se deben aportar perfiles y fotografías autorizados de FEDEPESAN.

Las tallas, horarios, temperaturas, stock y vedas iniciales son educativos. Las referencias a AUNAP, Ley 2268 de 2022, Decreto 2811 de 1974 y ODS 12/14 no certifican cumplimiento normativo real. La especie comercial “Bagre pintado” usa `Pseudoplatystoma sp.` y requiere identificación taxonómica local. La aplicación no simula cifras de ahorro de carbono ni confunde ingreso bruto con utilidad neta.

### Créditos

**Desarrollo de una plataforma de comercio electrónico para la comercialización de pesca artesanal en Barrancabermeja**. Ingeniería de Sistemas, Universidad de Investigación y Desarrollo — UDI.

- **Jairo Arturo Leal Moreno** — desarrollo frontend.
- **Gabriel Mauricio Ortega Montes** — desarrollo backend de la investigación.
- **Ing. Reinaldo Guerra De La Rosa** — director.
- **Ing. Andrés Sneyder Salom Díaz** — codirector.

Prototipo independiente sin afiliación oficial con asociaciones, autoridades o marcas financieras mencionadas.
