import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr/node';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './main.server';

export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');
  const apiTarget = process.env['API_URL'] ?? 'http://localhost:8000';

  const allowedHosts = (process.env['ALLOWED_SSR_HOSTS'] ?? 'localhost,127.0.0.1')
    .split(',')
    .map(h => h.trim());

  const commonEngine = new CommonEngine({ allowedHosts });

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // Proxy /api/** → backend preservando el path completo
  server.use(
    createProxyMiddleware({
      target: apiTarget,
      changeOrigin: true,
      pathFilter: ['/api/**', '/media/**'],
    }),
  );

  // Assets estáticos
  server.get(
    '**',
    express.static(browserDistFolder, {
      maxAge: '1y',
      index: false,
      redirect: false,
    }),
  );

  // SSR con fallback a CSR si el render falla
  server.get('**', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;
    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then(html => res.send(html))
      .catch(() => {
        // SSR falló → servir el template base para que Angular haga CSR
        res.sendFile(indexHtml);
      });
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
