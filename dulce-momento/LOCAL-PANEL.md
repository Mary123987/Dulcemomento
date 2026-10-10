# Panel local para presentaciones

En GitHub Pages, si no está configurado `DM_ADMIN_API_URL`, el panel usa
`dist/local-admin.js`. Acceso público de presentación: usuario `admin`, clave
`presentacion`. Puedes cambiar `presentationAccess` en ese archivo. No pongas
contraseñas reales: cualquiera puede leer o saltarse este acceso.

Clientes, consultas, pedidos de ejemplo, campañas, historial y configuración
se guardan en una única estructura versionada de localStorage, separada por
prefijo de publicación. Se inicializa una sola vez. La sesión usa sessionStorage.
No hay sincronización entre dispositivos ni con `data/admin-data.json`; borrar
los datos del navegador elimina estos registros. No almacenar datos sensibles.
Los ejemplos están marcados internamente y nunca cuentan como compras reales.
Las operaciones de campaña registran procesamiento pendiente de proveedor,
exclusiones y errores; no hacen solicitudes de envío ni confirman entregas.

La consulta pública se guarda en el mismo navegador y lo informa al completarla.
Solo aparece en el panel de ese navegador y origen. El consentimiento requiere
marcar la casilla; no se obtiene consentimiento real de los registros de ejemplo.

El backend existente permanece intacto. Configurar `DM_ADMIN_API_URL` al generar
el sitio selecciona la API HTTPS; sus errores no se ocultan con una copia local.
Para pruebas de desarrollo puede establecerse `globalThis.DM_ADMIN_STORAGE='local'`
antes de cargar los módulos. No hay migración automática entre ambos almacenes.

## Publicar en GitHub Pages

1. Mantener vacía/eliminar la variable Actions `DM_ADMIN_API_URL` para esta presentación.
2. Guardar y subir los cambios a `main`: `git add .`, `git commit -m Panel-local`,
   `git push origin main`. Revisar los archivos antes de añadirlos; `.env` y los
   datos privados deben permanecer ignorados.
3. Esperar que **Deploy GitHub Pages** termine correctamente. El workflow genera
   las rutas con `BASE_PATH=/Dulcemomento` y publica `dulce-momento/dist`.
4. Abrir `https://mary123987.github.io/Dulcemomento/admin/` y actualizar con Ctrl+F5.

Validación local: `node check-local-admin.mjs`, `node check-marketing-panel.mjs`,
`node check-marketing-api.mjs`, `node check-contact-form.mjs`, `node check.mjs`
y `node check-seo.mjs`, ejecutados dentro de `dulce-momento`.
