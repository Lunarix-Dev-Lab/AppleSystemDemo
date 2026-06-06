import { Routes } from '@angular/router';

import { gateGuard } from './gate/gate.guard';

export const routes: Routes = [
  // Pantalla de acceso (sin guard)
  {
    path: 'acceso',
    loadComponent: () =>
      import('./gate/gate.component').then(m => m.GateComponent),
  },

  // Todas las rutas protegidas por contraseña
  {
    path: '',
    canActivate: [gateGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./public/home/home.component').then(m => m.HomeComponent),
      },
      {
        path: 'catalogo',
        loadComponent: () =>
          import('./public/catalog/catalog.component').then(m => m.CatalogComponent),
      },
      {
        path: 'reservar',
        loadComponent: () =>
          import('./public/booking/booking.component').then(m => m.BookingComponent),
      },
      {
        path: 'reservar/confirmado',
        loadComponent: () =>
          import('./public/booking/booking-confirm.component').then(m => m.BookingConfirmComponent),
      },
      {
        path: 'turnos/cancelar',
        loadComponent: () =>
          import('./public/cancel/cancel-lookup.component').then(m => m.CancelLookupComponent),
      },
      {
        path: 'turnos/cancelar/:token',
        loadComponent: () =>
          import('./public/cancel/cancel.component').then(m => m.CancelComponent),
      },
      {
        path: 'admin',
        loadChildren: () =>
          import('./admin/admin.routes').then(m => m.adminRoutes),
      },
      {
        path: '**',
        loadComponent: () =>
          import('./public/not-found/not-found.component').then(m => m.NotFoundComponent),
      },
    ],
  },
];
