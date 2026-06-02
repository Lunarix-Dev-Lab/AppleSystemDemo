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
    <div class="flex h-screen bg-gray-50 overflow-hidden">

      <!-- Sidebar -->
      <aside class="w-56 bg-white border-r border-gray-100 flex flex-col shrink-0">

        <!-- Header -->
        <div class="px-5 py-4 border-b border-gray-100">
          <p class="text-sm font-semibold text-gray-900 leading-none">{{ storeName }}</p>
          @if (auth.currentUser(); as user) {
            <p class="text-xs text-gray-400 mt-1 truncate">{{ user.email }}</p>
          }
        </div>

        <!-- Nav -->
        <nav class="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          <a
            routerLink="/admin"
            routerLinkActive="bg-gray-100 text-gray-900"
            [routerLinkActiveOptions]="{ exact: true }"
            class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600
                   hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            Dashboard
          </a>
          <a
            routerLink="/admin/productos"
            routerLinkActive="bg-gray-100 text-gray-900"
            class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600
                   hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            Productos
          </a>
          <a
            routerLink="/admin/turnos"
            routerLinkActive="bg-gray-100 text-gray-900"
            class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600
                   hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            Turnos
          </a>
          <a
            routerLink="/admin/horarios"
            routerLinkActive="bg-gray-100 text-gray-900"
            class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600
                   hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            Horarios
          </a>
          <a
            routerLink="/admin/configuracion"
            routerLinkActive="bg-gray-100 text-gray-900"
            class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600
                   hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            Configuración
          </a>
        </nav>

        <!-- Footer -->
        <div class="px-3 py-3 border-t border-gray-100">
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
}
