import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { THEME } from '../../../theme.config';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- QA-ADM-004: layout responsive
         Mobile  (<lg): columna — top bar horizontal
         Desktop (≥lg): fila — sidebar izquierdo clásico -->
    <div class="flex flex-col lg:flex-row h-screen bg-gray-50 overflow-hidden">

      <!-- Sidebar / Top bar -->
      <aside class="shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-gray-100
                    flex flex-col lg:w-56">

        <!-- Header: siempre visible. En mobile incluye botón de logout -->
        <div class="flex items-center justify-between px-4 lg:px-5 py-3 lg:py-4 border-b border-gray-100">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-gray-900 leading-none truncate">{{ storeName }}</p>
            @if (auth.currentUser(); as user) {
              <p class="text-xs text-gray-400 mt-1 truncate hidden lg:block">{{ user.email }}</p>
            }
          </div>
          <!-- Botón logout solo en mobile -->
          <button (click)="auth.logout()"
                  class="lg:hidden p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors shrink-0">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </button>
        </div>

        <!-- Nav: horizontal+scrollable en mobile, vertical en desktop -->
        <nav class="flex lg:flex-col px-2 lg:px-3 py-2 lg:py-3 gap-0.5
                    overflow-x-auto lg:overflow-x-visible flex-1">
          @for (link of navLinks; track link.path) {
            <a
              [routerLink]="link.path"
              routerLinkActive="bg-gray-100 text-gray-900"
              [routerLinkActiveOptions]="{ exact: link.exact }"
              class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600
                     hover:bg-gray-50 hover:text-gray-900 transition-colors
                     whitespace-nowrap lg:whitespace-normal shrink-0 lg:shrink"
            >
              {{ link.label }}
            </a>
          }
        </nav>

        <!-- Footer: solo en desktop -->
        <div class="hidden lg:block px-3 py-3 border-t border-gray-100">
          <button
            (click)="auth.logout()"
            class="w-full flex items-center px-3 py-2 rounded-lg text-sm text-gray-500
                   hover:bg-gray-50 hover:text-gray-700 transition-colors text-left"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <!-- Contenido principal -->
      <main class="flex-1 overflow-auto">
        <router-outlet />
      </main>

    </div>
  `,
})
export class AdminShellComponent {
  readonly auth = inject(AuthService);
  readonly storeName = THEME.store.name;

  readonly navLinks = [
    { label: 'Dashboard', path: '/admin', exact: true },
    { label: 'Productos', path: '/admin/productos', exact: false },
    { label: 'Turnos', path: '/admin/turnos', exact: false },
    { label: 'Horarios', path: '/admin/horarios', exact: false },
    { label: 'Configuración', path: '/admin/configuracion', exact: false },
  ];
}
