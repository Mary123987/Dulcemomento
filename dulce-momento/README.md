# Dulce Momento

Tienda responsive de demostración, en español y soles peruanos. Sin instalación de dependencias. Para probar solo la tienda, ejecutar `node server.mjs` desde esta carpeta y abrir http://127.0.0.1:4173.

## Editar

- `dist/data.js`: catálogo de 16 productos, precios, opciones, ingredientes, categorías, tarifas, FAQ y configuración comercial. Las imágenes son ilustraciones fotográficas generadas.
- `dist/store.js`: carrito global, persistencia y cálculo centralizado de precios.
- `dist/app.js`: rutas, checkout, confirmación, asistente basado en reglas, formularios y WebMCP.
- `dist/admin-panel.js`: vistas y acciones del panel; el modo local usa almacenamiento del navegador y el modo backend consume la API administrativa.
- `admin-api.mjs`: API de administración, clientes y campañas; Resend se invoca exclusivamente desde el servidor.
- `server.mjs`: servidor estático local y punto de montaje de la API `/api`.
- `dist/style.css`: identidad visual, accesibilidad, móvil y animaciones.

Tras cambiar rutas o textos de productos: `node prepare-routes.mjs`. Verificar: `node --check dist/app.js`, `node --check dist/admin-panel.js`, `node --check admin-api.mjs`, `node check.mjs`, `node check-admin.mjs`, `node check-admin-api.mjs` y `node check-seo.mjs`. `node check-admin-api.mjs` usa almacenamiento temporal y nunca llama a Resend.

## Panel administrativo

El panel y sus vistas están en `/admin`, `/admin/contactos`, `/admin/clientes`, `/admin/campanas`, `/admin/pedidos` y `/admin/configuracion`. Las rutas se generan con `node prepare-routes.mjs` y permanecen fuera del sitemap.

El acceso local de demostración es `admin` / `2026USMP`. Está en código público y **no protege información**. Los ocho clientes `@example.com` son datos ficticios y siempre tienen consentimiento comercial desactivado; nunca son destinatarios elegibles. En modo local puedes mantener clientes y borradores ficticios, pero los cambios solo se guardan en ese navegador y no se envía correo.

### Backend para administración y campañas

El servidor Node integrado añade una API para clientes y campañas, con autenticación mediante cookie `HttpOnly`, límite de intentos, datos JSON locales y solicitudes server-to-server a Resend. Para probarlo:

1. Copia `.env.example` a `.env` dentro de `dulce-momento/`.
2. Sustituye `ADMIN_PASSWORD` por una clave larga y única y `SESSION_SECRET` por al menos 32 caracteres aleatorios. No reutilices la contraseña de demostración. Mantén `ADMIN_EMAIL=maryrojascordova20@gmail.com` para restringir el primer envío de prueba a esa dirección.
3. Ejecuta `node --env-file=.env server.mjs` desde esta carpeta y abre http://127.0.0.1:4173. Con las variables de backend configuradas, el panel usa autenticación y persistencia del servidor; sin ellas, la página estática solo permite el modo local de demostración.
4. Los datos se inicializan en `data/admin-data.json` con las ocho fichas ficticias y tres campañas borrador. Ese archivo está ignorado por Git. Haz copias seguras del archivo en entornos persistentes; el almacenamiento JSON y las sesiones en memoria son para una instancia Node de demostración, no una base de datos adecuada para varias instancias ni un servicio serverless.

No hay clave de Resend en el repositorio. Configura `RESEND_API_KEY` únicamente en las variables secretas del backend. La dirección solicitada `maryrojascordova20@gmail.com` **no se declara verificada**: Resend requiere verificar un dominio propio y enviar desde una dirección de ese dominio. Añade el dominio en Resend y publica los registros DNS (SPF/DKIM y los que indique el panel de Resend); después configura `RESEND_FROM_EMAIL` con una dirección de ese dominio verificado. No se sustituye automáticamente el remitente solicitado. Hasta que se configure un remitente permitido, el backend mantiene bloqueados el envío de prueba y el envío de campañas y muestra el motivo. El envío de prueba solo acepta la dirección configurada como correo administrativo (`maryrojascordova20@gmail.com`). Resend confirma aceptación con un ID, no entrega; el panel no afirma que un correo se haya entregado. La integración no incluye webhooks de entrega/rebote todavía.

El botón de campaña exige confirmación, solo incluye clientes activos con consentimiento, excluye `example.com` y las bajas, registra cada resultado y bloquea reenvíos accidentales de una campaña ya aceptada. Las plantillas se duplican para crear una campaña real; las tres originales son borradores de demostración. Los enlaces de baja requieren confirmación mediante formulario antes de guardar la baja.

GitHub Pages solo publica frontend estático; no mantiene este backend ni sus datos. Para conectar Pages a un backend HTTPS persistente, configura `DM_ADMIN_API_URL` como variable de repositorio de Actions, `FRONTEND_ORIGIN` con el origen exacto de Pages (por ejemplo `https://mary123987.github.io`) y `PUBLIC_API_URL` con el origen HTTPS del backend. Regenera/despliega el frontend tras configurar `DM_ADMIN_API_URL`. El backend debe permitir credenciales CORS solo desde ese origen y ofrecer cookies seguras. Se requiere desplegar/monitorizar por separado ese servicio Node y migrar el JSON y las sesiones a almacenamiento persistente antes de operar con clientes reales. Contactos y pedidos de tienda siguen siendo locales; esta API no los convierte en registros de servidor.

## Probar

Cupones DULCE10 y MOMENTO15. Tarjeta exclusivamente de prueba: 4242 4242 4242 4242, vencimiento 12/30, CVV 123. Yape usa QR no operativo y número ficticio. Pago al recoger solo aparece para recojo. Fechas desde cuatro horas después de la hora local.

## Persistencia y límites

Carrito, favoritos, cupón, último pedido y solicitudes se guardan solo en localStorage. No hay envío al negocio, administración, cobros reales ni HubSpot. El asistente recomienda únicamente productos del catálogo mediante reglas, sin IA externa. No se guardan campos de tarjeta. Los testimonios, tarifas y catálogo son ejemplos. El formulario de contacto simula la consulta sin guardarla ni enviarla. WhatsApp: +51 964 900 999; correo: dulce_momento@gmail.com; redes: Dulcemomento. El punto de recojo sigue pendiente.

Para ventas reales, configurar contacto y dirección, validar catálogo/alérgenos/precios, añadir recepción de pedidos en servidor, validar precios en servidor, integrar una pasarela con campos alojados/tokenización y reemplazar los términos de demostración. La estructura del pedido y las funciones centralizadas permiten esas integraciones.

## SEO local

`dist/seo.js` contiene las 28 páginas, 84 candidatas y decisiones SEO. `shell.html` es la plantilla; los index.html se generan con contenido inicial y metadata por ruta mediante `node prepare-routes.mjs`. No editar los index.html generados directamente. Tras modificar textos, rutas o vistas, regenerar. Ejecutar `node check-seo.mjs`; con servidor activo, `node check-http.mjs`. Ambos guardan evidencia en ../outputs.

Seis páginas noindex: carrito, checkout, confirmación, favoritos, términos y privacidad. Sitemap: 22 páginas públicas. Robots permite rastreo para leer noindex. El servidor devuelve 404 real y normaliza variantes con 308. Schema descriptivo, sin ofertas ni reseñas simuladas.

GitHub Actions publica la demostración en https://mary123987.github.io/Dulcemomento/ al actualizar `main`. El workflow genera las rutas con el prefijo de GitHub Pages y usa ese origen en canonical, datos estructurados y sitemap. En local, `SEO_ORIGIN` sigue siendo http://127.0.0.1:4173. Indexable significa elegibilidad técnica propuesta, no indexación o posicionamiento acreditados. Las fotos usan un mosaico recortado; falta preparar archivos individuales y una imagen social si se lanza el negocio.
