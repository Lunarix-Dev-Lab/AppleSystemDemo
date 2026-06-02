import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-white flex flex-col items-center justify-center text-center px-6">
      <p class="text-[120px] font-semibold leading-none text-gray-100 select-none">404</p>
      <h1 class="text-2xl font-semibold text-gray-900 -mt-4">Página no encontrada</h1>
      <p class="mt-3 text-gray-400 max-w-xs leading-relaxed">
        El link que seguiste no existe o fue movido.
      </p>
      <div class="flex gap-3 mt-8">
        <a routerLink="/"
           class="px-6 py-2.5 bg-black text-white text-sm font-medium rounded-full
                  hover:bg-gray-800 transition-colors min-h-[44px] flex items-center">
          Ir al inicio
        </a>
        <a routerLink="/catalogo"
           class="px-6 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium
                  rounded-full hover:bg-gray-50 transition-colors min-h-[44px] flex items-center">
          Ver catálogo
        </a>
      </div>
    </div>
  `,
})
export class NotFoundComponent {}
