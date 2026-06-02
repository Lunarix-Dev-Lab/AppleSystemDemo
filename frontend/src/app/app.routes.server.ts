import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Pantalla de acceso: CSR (form, sin SEO)
  { path: 'acceso', renderMode: RenderMode.Client },
  // Panel admin: SPA pura, sin SSR
  { path: 'admin', renderMode: RenderMode.Client },
  { path: 'admin/**', renderMode: RenderMode.Client },
  // Booking y cancelación: dinámicos, sin SSR
  { path: 'reservar', renderMode: RenderMode.Client },
  { path: 'reservar/**', renderMode: RenderMode.Client },
  { path: 'turnos/**', renderMode: RenderMode.Client },
  // Vitrina pública: SSR para SEO
  { path: '**', renderMode: RenderMode.Server },
];
