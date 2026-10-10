
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { pages, normalizePath } from './dist/seo.js';
import {
  adminConfigurationStatus,
  handleAdminApi
} from './admin-api.mjs';

import './env.mjs';

const root = path.resolve('dist');

const routes = new Set(pages.map(page => page.path));

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.json': 'application/json; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8'
};

export function createServer() {
  return http.createServer((req, res) => {
    let url;
    let pathname;

    try {
      url = new URL(
        req.url,
        `http://${req.headers.host || 'localhost'}`
      );

      pathname = decodeURIComponent(url.pathname);
    } catch {
      res.writeHead(400, {
        'Content-Type': 'text/plain; charset=utf-8'
      });
      res.end('Solicitud inválida.');
      return;
    }

    // Las solicitudes administrativas se gestionan en el backend.
    if (pathname.startsWith('/api/')) {
      Promise.resolve(handleAdminApi(req, res, url)).catch(error => {
        console.error('Error en la API administrativa:', error);

        if (!res.headersSent) {
          res.writeHead(500, {
            'Content-Type': 'application/json; charset=utf-8'
          });
        }

        if (!res.writableEnded) {
          res.end(JSON.stringify({
            error: 'Error interno del servidor.'
          }));
        }
      });

      return;
    }

    // Solo se permiten solicitudes de lectura para los archivos públicos.
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, {
        Allow: 'GET, HEAD',
        'Content-Type': 'text/plain; charset=utf-8'
      });
      res.end('Método no permitido.');
      return;
    }

    const clean = normalizePath(
      pathname.replace(/\/index\.html$/, '')
    );

    // Normaliza las URL de las páginas existentes.
    if (routes.has(clean) && pathname !== clean) {
      res.writeHead(308, {
        Location: clean + url.search
      });
      res.end();
      return;
    }

    let status = 200;

    let file = routes.has(clean)
      ? path.join(root, clean, 'index.html')
      : path.resolve(root, '.' + pathname);

    // Si la ruta apunta a una carpeta, busca su index.html.
    if (
      fs.existsSync(file) &&
      fs.statSync(file).isDirectory()
    ) {
      file = path.join(file, 'index.html');
    }

    // Evita que se acceda a archivos fuera de dist.
    if (file !== root && !file.startsWith(root + path.sep)) {
      res.writeHead(403, {
        'Content-Type': 'text/plain; charset=utf-8'
      });
      res.end('Acceso denegado.');
      return;
    }

    // Responde con la página 404 cuando no existe el archivo.
    if (
      !fs.existsSync(file) ||
      !fs.statSync(file).isFile()
    ) {
      status = 404;
      file = path.join(root, '404.html');
    }

    const contentType =
      mime[path.extname(file).toLowerCase()] ||
      'application/octet-stream';

    res.writeHead(status, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
      ...(status === 404
        ? { 'X-Robots-Tag': 'noindex, follow' }
        : {})
    });

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    const stream = fs.createReadStream(file);

    stream.on('error', error => {
      console.error('Error al leer archivo:', error.message);

      if (!res.headersSent) {
        res.writeHead(500, {
          'Content-Type': 'text/plain; charset=utf-8'
        });
      }

      if (!res.writableEnded) {
        res.end('Error al cargar la página.');
      }
    });

    stream.pipe(res);
  });
}

// Inicia el servidor cuando este archivo se ejecuta directamente.
const currentFile = fileURLToPath(import.meta.url);

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === currentFile
) {
  const port = Number(process.env.PORT || 4173);

  // Render necesita que el servicio escuche en una interfaz accesible.
  const host = process.env.HOST || '0.0.0.0';

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error('Error: el puerto configurado no es válido.');
    process.exit(1);
  }

  const server = createServer();

  server.listen(port, host, () => {
    console.log(`Servidor iniciado en ${host}:${port}`);

    const configurationError = adminConfigurationStatus();

    if (configurationError) {
      console.error(
        `AVISO: El panel administrativo permanecerá bloqueado. ${configurationError}`
      );
    } else {
      console.log('Configuración administrativa detectada.');
    }
  });

  server.on('error', error => {
    console.error('No se pudo iniciar el servidor:', error.message);
    process.exitCode = 1;
  });
}
