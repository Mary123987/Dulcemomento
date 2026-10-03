# Dulce Momento

Tienda responsive de demostración, en español y soles peruanos. Sin instalación de dependencias. Ejecutar `node server.mjs` desde esta carpeta y abrir http://127.0.0.1:4173.

## Editar

- `dist/data.js`: catálogo de 16 productos, precios, opciones, ingredientes, categorías, tarifas, FAQ y configuración comercial. Las imágenes son ilustraciones fotográficas generadas.
- `dist/store.js`: carrito global, persistencia y cálculo centralizado de precios.
- `dist/app.js`: rutas, checkout, confirmación, asistente basado en reglas, formularios y WebMCP.
- `dist/style.css`: identidad visual, accesibilidad, móvil y animaciones.

Tras cambiar rutas o textos de productos: `node prepare-routes.mjs`. Verificar: `node --check dist/app.js` y `node check.mjs`.

## Probar

Cupones DULCE10 y MOMENTO15. Tarjeta exclusivamente de prueba: 4242 4242 4242 4242, vencimiento 12/30, CVV 123. Yape usa QR no operativo y número ficticio. Pago al recoger solo aparece para recojo. Fechas desde cuatro horas después de la hora local.

## Persistencia y límites

Carrito, favoritos, cupón, último pedido y solicitudes se guardan solo en localStorage. No hay envío al negocio, administración, cobros reales ni HubSpot. El asistente recomienda únicamente productos del catálogo mediante reglas, sin IA externa. No se guardan campos de tarjeta. Los testimonios, tarifas y catálogo son ejemplos. El formulario de contacto simula la consulta sin guardarla ni enviarla. WhatsApp: +51 964 900 999; correo: dulce_momento@gmail.com; redes: Dulcemomento. El punto de recojo sigue pendiente.

Para ventas reales, configurar contacto y dirección, validar catálogo/alérgenos/precios, añadir recepción de pedidos en servidor, validar precios en servidor, integrar una pasarela con campos alojados/tokenización y reemplazar los términos de demostración. La estructura del pedido y las funciones centralizadas permiten esas integraciones.

## SEO local

`dist/seo.js` contiene las 28 páginas, 84 candidatas y decisiones SEO. `shell.html` es la plantilla; los index.html se generan con contenido inicial y metadata por ruta mediante `node prepare-routes.mjs`. No editar los index.html generados directamente. Tras modificar textos, rutas o vistas, regenerar. Ejecutar `node check-seo.mjs`; con servidor activo, `node check-http.mjs`. Ambos guardan evidencia en ../outputs.

Seis páginas noindex: carrito, checkout, confirmación, favoritos, términos y privacidad. Sitemap: 22 páginas públicas. Robots permite rastreo para leer noindex. El servidor devuelve 404 real y normaliza variantes con 308. Schema descriptivo, sin ofertas ni reseñas simuladas.

No se publicó el sitio. SEO_ORIGIN es http://127.0.0.1:4173: canonical y sitemap son locales y no deben enviarse a Google. Solo ante una publicación futura autorizada, reemplazar por un dominio HTTPS confirmado y regenerar. Indexable significa elegibilidad técnica propuesta, no indexación o posicionamiento acreditados. Las fotos usan un mosaico recortado; falta preparar archivos individuales y una imagen social si se lanza el negocio.
