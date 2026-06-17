import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
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

      <!-- Sidebar (desktop) / Barra superior + menú colapsable (mobile) -->
      <aside class="shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-gray-100
                    flex flex-col lg:w-56">

        <!-- Barra superior: siempre visible -->
        <div class="flex items-center justify-between px-4 lg:px-5 py-3 lg:py-4 border-b border-gray-100">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-gray-900 leading-none truncate">{{ storeName }}</p>
            @if (auth.currentUser(); as user) {
              <p class="text-xs text-gray-400 mt-1 truncate hidden lg:block">{{ user.email }}</p>
            }
          </div>
          <!-- Botón hamburguesa (solo mobile) -->
          <button (click)="menuOpen.set(!menuOpen())"
                  class="lg:hidden p-2 -mr-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
                  [attr.aria-label]="menuOpen() ? 'Cerrar menú' : 'Abrir menú'"
                  [attr.aria-expanded]="menuOpen()">
            @if (menuOpen()) {
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            } @else {
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            }
          </button>
        </div>

        <!-- Navegación: colapsable en mobile (hamburguesa), columna fija en desktop -->
        <nav class="flex-col gap-0.5 px-2 lg:px-3 py-2 lg:py-3 flex-1 overflow-y-auto lg:flex"
             [class.flex]="menuOpen()"
             [class.hidden]="!menuOpen()">
          @for (link of navLinks; track link.path) {
            <a
              [routerLink]="link.path"
              routerLinkActive="bg-gray-100 text-gray-900"
              [routerLinkActiveOptions]="{ exact: link.exact }"
              (click)="menuOpen.set(false)"
              class="flex items-center px-3 py-2.5 rounded-lg text-sm text-gray-600
                     hover:bg-gray-50 hover:text-gray-900 transition-colors min-h-[44px]"
            >
              {{ link.label }}
            </a>
          }

          <!-- Cerrar sesión dentro del menú (solo mobile) -->
          <button (click)="auth.logout()"
                  class="lg:hidden flex items-center px-3 py-2.5 mt-1 pt-3 border-t border-gray-100
                         rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700
                         transition-colors text-left min-h-[44px]">
            Cerrar sesión
          </button>
        </nav>

        <!-- Footer: cerrar sesión (solo desktop) -->
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
  readonly menuOpen = signal(false);

  readonly navLinks = [
    { label: 'Dashboard', path: '/admin', exact: true },
    { label: 'Productos', path: '/admin/productos', exact: false },
    { label: 'Turnos', path: '/admin/turnos', exact: false },
    { label: 'Horarios', path: '/admin/horarios', exact: false },
    { label: 'Configuración', path: '/admin/configuracion', exact: false },
  ];
}
