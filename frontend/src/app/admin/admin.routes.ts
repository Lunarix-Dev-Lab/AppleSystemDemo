import { Routes } from '@angular/router';

import { authGuard } from '../core/auth/auth.guard';

export const adminRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shell/admin-shell.component').then(m => m.AdminShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'productos',
        loadComponent: () =>
          import('./products/products.component').then(m => m.ProductsComponent),
      },
      {
        path: 'turnos',
        loadComponent: () =>
          import('./appointments/appointments.component').then(m => m.AppointmentsComponent),
      },
      {
        path: 'horarios',
        loadComponent: () =>
          import('./schedules/schedules.component').then(m => m.SchedulesComponent),
      },
      {
        path: 'configuracion',
        loadComponent: () =>
          import('./config/config.component').then(m => m.ConfigComponent),
      },
    ],
  },
];
