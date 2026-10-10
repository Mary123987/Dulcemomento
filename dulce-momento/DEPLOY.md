# Publicación del servidor y conexión con GitHub Pages

La tienda está en https://mary123987.github.io/Dulcemomento/. El archivo
`render.yaml` de la raíz permite desplegar el servidor Node existente en Render.
Crear el Blueprint contrata un servicio Starter con disco persistente: revisar
el coste que muestre Render antes de confirmar. No usar un servicio gratuito
con almacenamiento efímero para este archivo de clientes y campañas.

## Crear el servidor

1. Crear una cuenta en https://dashboard.render.com/ y conectar GitHub.
2. Elegir **New > Blueprint** y el repositorio `Mary123987/Dulcemomento`, rama `main`.
3. Render leerá `render.yaml`. Introducir la contraseña administrativa acordada
   en `ADMIN_PASSWORD`, exclusivamente en Render. El usuario es `admin`.
   La clave de sesión se genera automáticamente. No subir el archivo `.env`.
4. Revisar el plan y disco de 1 GB antes de confirmar la creación.
5. Esperar que termine el despliegue y copiar el origen HTTPS asignado al servicio.
6. En Environment del servicio, añadir `PUBLIC_API_URL` con ese origen, sin `/`
   final. Conservar `EXTERNAL_EMAIL_ENABLED=false` y no añadir claves de Resend.
7. Abrir ese origen seguido de `/admin` e iniciar sesión. Esta es la dirección
   preferida para administrar: el panel y la API comparten origen y no dependen
   de cookies de terceros. Los datos iniciales se crean al primer acceso.

## Conectar la tienda publicada

En GitHub, abrir **Settings > Secrets and variables > Actions > Variables**.
Crear la variable de repositorio `DM_ADMIN_API_URL` con el origen HTTPS del
servidor, sin ruta ni barra final. No es un secreto.

Ejecutar **Actions > Deploy GitHub Pages > Run workflow** en `main`.
La tienda conservará su dirección. Su formulario enviará consultas a la API.
Si el navegador bloquea las cookies entre GitHub Pages y Render, acceder al
panel por la dirección `/admin` del servidor. Una vez conocida su URL se puede
actualizar el enlace administrativo de la tienda para abrir esa dirección.

## Comprobaciones después del despliegue

- `/api/email/status` debe devolver `backendConfigured: true` y
  `externalEnabled: false`.
- Crear un contacto desde la tienda, repetir su correo con otra consulta y
  comprobar en el panel que se conservan ambos mensajes sin duplicar la ficha.
- Crear y editar una ficha, guardar una campaña, revisar destinatarios y vista
  previa, duplicarla y procesar una copia. No debe haber entregas confirmadas.
- Recargar, cerrar sesión e iniciar sesión: los cambios deben conservarse.
- Reiniciar el servicio desde Render y comprobar que fichas, campañas e historial
  siguen disponibles. Las sesiones en memoria requieren iniciar sesión de nuevo.

El disco guarda `/var/data/admin-data.json`. Usar una sola instancia del servidor;
el bloqueo de escrituras y las sesiones actuales viven en ese proceso. Los datos
del ordenador no se copian automáticamente. Si se necesitan, transferir el JSON
de forma privada al disco con el servicio detenido; nunca publicarlo en GitHub.
Mantener copias de seguridad privadas antes de migrar datos.

El procesamiento interno no confirma entregas. Activar un proveedor de correo
real es una configuración independiente y permanece deshabilitado.

Referencias: https://render.com/docs/blueprint-spec y https://render.com/docs/disks.
