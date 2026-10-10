# Dulce Momento

Tienda responsive de demostración, en español y soles peruanos. Sin instalación de dependencias. Para probar solo la tienda, ejecutar `node server.mjs` desde esta carpeta y abrir http://127.0.0.1:4173.

## Editar

- `dist/data.js`: catálogo de 16 productos, precios, opciones, ingredientes, categorías, tarifas, FAQ y configuración comercial. Las imágenes son ilustraciones fotográficas generadas.
- `dist/store.js`: carrito global, persistencia y cálculo centralizado de precios.
- `dist/app.js`: rutas, checkout, confirmación, asistente basado en reglas, formularios y WebMCP.
- `dist/admin-panel.js`: vistas y acciones del panel administrativo, autenticado exclusivamente por el backend.
- `dist/marketing.js`: perfiles, selección de audiencia, procesamiento interno y métricas compartidas.
- `dist/marketing-views.js`: directorio, editor, vista previa e historial usando los estilos actuales.
- `admin-api.mjs`: API de administración, clientes y campañas; Resend se invoca exclusivamente desde el servidor.
- `server.mjs` y `env.mjs`: servidor estático, API `/api` y carga de configuración desde `.env` antes de aceptar solicitudes.
- `dist/style.css`: identidad visual, accesibilidad, móvil y animaciones.

Tras cambiar rutas o textos de productos: `node prepare-routes.mjs`. Verificar: `node --check dist/app.js`, `node --check dist/admin-panel.js`, `node --check admin-api.mjs`, `node check.mjs`, `node check-admin.mjs`, `node check-admin-api.mjs`, `node check-crm.mjs`, `node check-contact-form.mjs` y `node check-seo.mjs`. `node check-admin-api.mjs` usa almacenamiento temporal y nunca llama a Resend.

## Panel administrativo

El panel y sus vistas están en `/admin`, `/admin/contactos`, `/admin/clientes`, `/admin/campanas`, `/admin/pedidos` y `/admin/configuracion`. Las rutas se generan con `node prepare-routes.mjs` y permanecen fuera del sitemap.

Las rutas administrativas requieren autenticación del servidor y una cookie de sesión `HttpOnly`; no hay credenciales predeterminadas ni acceso de demostración local. Los ocho perfiles iniciales usan direcciones reservadas `@example.com`. Son elegibles únicamente para procesamiento interno conforme a su perfil de autorización; nunca para entrega externa.

### Backend para administración y campañas

El servidor Node integrado ofrece una API para clientes y campañas, con autenticación mediante cookie `HttpOnly`, límite de intentos, datos JSON locales y solicitudes server-to-server a Resend. El login exige `ADMIN_USERNAME`, `ADMIN_PASSWORD` (8 caracteres como mínimo), `ADMIN_EMAIL` (correo válido) y `SESSION_SECRET` (32 caracteres como mínimo). Si falta alguna variable, el servidor lo indica en la consola y la pantalla de acceso y mantiene bloqueadas las rutas privadas.

El archivo `.env` es local, se carga automáticamente y está excluido de Git por el `.gitignore` de la raíz. Nunca subas ese archivo ni incluyas sus valores en el frontend.

### Windows (PowerShell)

Desde la raíz del repositorio, crea tu configuración privada y edítala:

```powershell
Copy-Item .\dulce-momento\.env.example .\dulce-momento\.env
notepad .\dulce-momento\.env
```

Define un nombre de usuario, una contraseña única de al menos 12 caracteres, tu correo administrativo y un secreto de sesión aleatorio de al menos 32 caracteres. Puedes generar el secreto sin instalar dependencias:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Copia el resultado de forma privada a `SESSION_SECRET` en `.env`. Luego inicia el servidor:

```powershell
Set-Location .\dulce-momento
node .\server.mjs
```

Abre http://127.0.0.1:4173/admin e inicia sesión con las credenciales que configuraste. Detén el servidor con Ctrl+C.

### GitHub Codespaces

En el terminal Linux del Codespace, desde la raíz del repositorio, crea y edita la configuración:

```sh
cp dulce-momento/.env.example dulce-momento/.env
nano dulce-momento/.env
```

Configura los mismos cuatro valores obligatorios descritos arriba y usa `HOST=0.0.0.0` para que el reenvío de puertos de Codespaces pueda acceder al servidor. Genera un `SESSION_SECRET` nuevo dentro del Codespace y mantén privado el puerto reenviado. Después ejecuta `cd dulce-momento && node server.mjs` y abre el puerto 4173 desde la pestaña **Ports**. Para un entorno persistente, configura estas variables como secretos del entorno/backend en vez de depender de un `.env` de desarrollo; no publiques credenciales en el repositorio.

Los datos se inicializan en `data/admin-data.json` con las ocho fichas ficticias y tres campañas borrador. Ese archivo está ignorado por Git. Haz copias seguras del archivo en entornos persistentes; el almacenamiento JSON y las sesiones en memoria son para una instancia Node de demostración, no una base de datos adecuada para varias instancias ni un servicio serverless.

No hay clave de Resend en el repositorio. Configura `RESEND_API_KEY` únicamente en las variables secretas del backend. Resend requiere verificar un dominio propio y enviar desde una dirección de ese dominio. Configura `RESEND_FROM_EMAIL` con una dirección de ese dominio verificado. El envío de prueba solo acepta la dirección configurada en `ADMIN_EMAIL`. Resend confirma aceptación con un ID, no entrega; el panel no afirma que un correo se haya entregado. La integración no incluye webhooks de entrega/rebote todavía.

El botón Procesar campaña requiere confirmación y registra la audiencia, exclusiones, errores y una copia del contenido en el servidor. Una campaña procesada se conserva sin modificaciones; Duplicar crea un nuevo borrador sin historial. Las bajas siguen bloqueadas incluso al borrar y volver a crear una ficha.

GitHub Pages solo publica frontend estático; no mantiene este backend ni sus datos. Para conectar Pages a un backend HTTPS persistente, configura `DM_ADMIN_API_URL` como variable de repositorio de Actions, `FRONTEND_ORIGIN` con el origen exacto de Pages (por ejemplo `https://mary123987.github.io`) y `PUBLIC_API_URL` con el origen HTTPS del backend. Regenera/despliega el frontend tras configurar `DM_ADMIN_API_URL`. El backend debe permitir credenciales CORS solo desde ese origen y ofrecer cookies seguras. Se requiere desplegar/monitorizar por separado ese servicio Node y migrar el JSON y las sesiones a almacenamiento persistente antes de operar con clientes reales. Con backend configurado, el formulario público guarda contactos y consultas en el servidor. Sin backend se guarda únicamente una demostración local, indicada al visitante.

## Probar

Cupones DULCE10 y MOMENTO15. Tarjeta exclusivamente de prueba: 4242 4242 4242 4242, vencimiento 12/30, CVV 123. Yape usa QR no operativo y número ficticio. Pago al recoger solo aparece para recojo. Fechas desde cuatro horas después de la hora local.

## Persistencia y límites

Carrito, favoritos, cupón y pedidos de demostración se guardan solo en localStorage. La confirmación muestra únicamente el pedido más reciente que se registró y se puede verificar en ese navegador; recargar la página no vuelve a crear el pedido. Los pedidos no se envían al backend ni al negocio. No hay cobros reales ni HubSpot; tarjeta y Yape conservan un estado simulado y «Pago al recoger» permanece pendiente. El asistente recomienda únicamente productos del catálogo mediante reglas, sin IA externa. No se guardan campos de tarjeta. Los testimonios, tarifas y catálogo son ejemplos. El formulario guarda contacto e historial por correo normalizado; utiliza el servidor cuando está configurado y almacenamiento local en la demostración. No se promete confirmación por correo ni se envía una automáticamente. WhatsApp: +51 964 900 999; correo: dulce_momento@gmail.com; redes: Dulcemomento. El punto de recojo sigue pendiente.

Para ventas reales, configurar contacto y dirección, validar catálogo/alérgenos/precios, añadir recepción de pedidos en servidor, validar precios en servidor, integrar una pasarela con campos alojados/tokenización y reemplazar los términos de demostración. La estructura del pedido y las funciones centralizadas permiten esas integraciones.

## SEO local

`dist/seo.js` contiene las 28 páginas, 84 candidatas y decisiones SEO. `shell.html` es la plantilla; los index.html se generan con contenido inicial y metadata por ruta mediante `node prepare-routes.mjs`. No editar los index.html generados directamente. Tras modificar textos, rutas o vistas, regenerar. Ejecutar `node check-seo.mjs`; con servidor activo, `node check-http.mjs`. Ambos guardan evidencia en ../outputs.

Seis páginas noindex: carrito, checkout, confirmación, favoritos, términos y privacidad. Sitemap: 22 páginas públicas. Robots permite rastreo para leer noindex. El servidor devuelve 404 real y normaliza variantes con 308. Schema descriptivo, sin ofertas ni reseñas simuladas.

GitHub Actions publica la demostración en https://mary123987.github.io/Dulcemomento/ al actualizar `main`. El workflow genera las rutas con el prefijo de GitHub Pages y usa ese origen en canonical, datos estructurados y sitemap. En local, `SEO_ORIGIN` sigue siendo http://127.0.0.1:4173. Indexable significa elegibilidad técnica propuesta, no indexación o posicionamiento acreditados. Las fotos usan un mosaico recortado; falta preparar archivos individuales y una imagen social si se lanza el negocio.

## Contactos, compradores y consentimiento

### Operación de campañas

Las pantallas usan Clientes, Campañas, Procesada, Pendiente de proveedor, Excluido y Error. El flujo normal es crear o editar un borrador, revisar HTML/texto y audiencia, guardar y pulsar **Procesar campaña**. Funciona sin Resend. El directorio admite alta, edición, búsqueda por nombre/correo, filtros por segmento/estado/consentimiento, CSV y eliminación lógica. El borrado conserva pedidos e historial y persiste mediante una lista de identidades retiradas; una recarga no recrea fichas borradas.

El servidor incorpora una sola vez ocho perfiles iniciales (marketingVersion=2). Conserva isDemo/provenance en los datos internos. Su historial se guarda en referenceOrders, separado de orders; su autorización se guarda en eligibilityProfile, separada de marketingConsent/consentDate reales, que permanecen desactivados/vacíos. Las campañas internas usan esos escenarios y las fichas reales autorizadas. El adaptador externo excluye siempre los perfiles iniciales y los dominios example.com. Los cambios antiguos de la colección local dm-marketing-demo-v1 no se importan como eventos reales. La migración de la versión 1 conserva las fichas e historial y corrige únicamente fechas de alta posteriores a las compras de referencia.

Con los datos iniciales y un umbral de 180 días hay cuatro destinatarios internos autorizados para Todos con consentimiento, uno para Nuevo, dos para Recurrente y uno para Inactivo. Los segmentos se calculan a partir del historial correspondiente; crear un contacto o editar un segmento en el payload nunca genera compras.

Cada ejecución se registra en sendHistory y en el historial de la campaña y de los perfiles, con identificador, clave de idempotencia, fechas, snapshot del contenido y resultados por correo. Los autorizados quedan pending_provider, los excluidos incluyen su motivo y los registros importados inválidos producen failed. También se registra una audiencia vacía. La escritura es atómica y se serializan las mutaciones de la instancia Node; un doble clic o reintento no duplica el procesamiento. Un fallo de disco se informa como error, nunca como operación guardada.

Resumen y Campañas muestran perfiles, compradores, suscriptores activos, campañas, procesamientos, pendientes, exclusiones, errores, aceptaciones del proveedor y entregas confirmadas. El procesamiento interno no crea IDs del proveedor ni eventos de entrega. La vista previa usa iframes sin permisos y una política que bloquea scripts y recursos remotos.

### Activar correo externo más adelante

EXTERNAL_EMAIL_ENABLED=false es el valor predeterminado. La presencia de RESEND_API_KEY por sí sola no habilita ninguna llamada al proveedor. El panel solicita siempre transport=internal, sin una cola que se despache automáticamente al configurar Resend. Las claves permanecen en el servidor.

Para activar intencionadamente el adaptador existente: configurar RESEND_API_KEY, RESEND_FROM_EMAIL de un dominio confirmado por el proveedor, RESEND_REPLY_TO, PUBLIC_API_URL HTTPS y EXTERNAL_EMAIL_ENABLED=true. Verificar primero el correo administrativo con /api/admin/test-email. Una solicitud externa a /api/admin/send-campaign requiere transport=external, confirmed=true, una clave de idempotencia y destinatarios reales autorizados. El remitente solicitado maryrojascordova20@gmail.com no se marca verificado por existir en la configuración; el panel distingue el remitente solicitado del realmente configurado/verificado.

La interfaz de esta entrega utiliza exclusivamente el procesamiento interno. Antes de habilitar controles de entrega externa en producción faltan conectar esa acción explícita, webhooks autenticados de entrega/rebote, tratamiento de rebotes y almacenamiento/sesiones aptos para despliegue multiinstancia. Una respuesta aceptada de Resend no se presenta como entrega confirmada. No se han enviado correos en la validación.

### Verificación del módulo

Ejecutar node check-marketing-api.mjs y node check-marketing-panel.mjs: cubren CRUD, deduplicación, consentimientos/bajas, segmentos, vista previa, duplicación, audiencia vacía, errores de importación, concurrencia/idempotencia, métricas, persistencia tras reiniciar y ausencia de llamadas externas. Mantener también check-admin-api.mjs, check-admin.mjs, check-crm.mjs, check-contact-form.mjs, check-marketing-demo.mjs, check.mjs y check-seo.mjs. Las pruebas usan datos aislados temporales.

El formulario conserva nombre, apellido, correo, celular opcional, tipo de consulta y mensaje. El consentimiento está desmarcado; solo un valor booleano explícito lo activa y registra fecha del servidor y fuente. Una consulta posterior sin marcar la casilla conserva un consentimiento previo válido, pero no reactiva una baja. Los consentimientos antiguos sin fecha/fuente verificable no son elegibles.

La identidad se vincula por correo normalizado (sin espacios exteriores y en minúsculas). Cada consulta añade una entrada al historial de ese contacto; las fichas antiguas repetidas se consolidan preservando los mensajes. Contactos muestra por defecto quienes no tienen compras y permite consultar también mensajes de compradores. Clientes permite distinguir compradores y fichas sin compras mediante el filtro de segmento. Los perfiles iniciales utilizan exclusivamente su historial de referencia para el procesamiento interno.

La regla común de frontend y API cuenta pedidos únicos por orderId, ligados por customer.email, con isDemo:false. Excluye pagos simulados/fallidos/reembolsados y pedidos cancelados/reembolsados. Una compra registrada da el segmento nuevo; dos o más, recurrente; cero, consulta. Se cuentan pedidos registrados, incluidos los pendientes de pago; no se afirma que sean ingresos cobrados. El historial confiable de ventas reales debe estar en orders del almacenamiento del servidor. Los pedidos de demostración del checkout en dm-orders no se comparten con el panel ni cuentan como compras de clientes. La API pública de contacto no acepta pedidos, segmentos ni totales. Este proyecto no tiene una pasarela ni un flujo de ventas reales: no se crean compras para llenar segmentos.

La inactividad es independiente: al menos 180 días desde createdAt de la última compra por defecto, configurable entre 1 y 3650 en Administración → Configuración. No sustituye el segmento ni cambia el consentimiento o la habilitación manual de la ficha. Sin fecha de compra válida no se afirma inactividad.

Las campañas excluyen bajas, falta de autorización y fichas desactivadas. El transporte externo añade la exclusión absoluta de datos ficticios. “Todos con consentimiento” puede incluir personas que solo consultaron y aceptaron promociones; “Nuevo”, “Recurrente” e “Inactivo” requieren compras. Las bajas guardan su propia fecha y no se reactivan al volver a enviar el formulario. No se envían correos durante las pruebas.
