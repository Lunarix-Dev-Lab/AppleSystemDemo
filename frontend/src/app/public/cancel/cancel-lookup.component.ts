import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cancel-lookup',
  standalone: true,
  imports: [RouterLink, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div class="w-full max-w-sm">
        <div class="bg-white rounded-3xl border border-gray-100 p-8">

          <!-- Header -->
          <div class="mb-7">
            <div class="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-5">
              <svg class="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <h1 class="text-xl font-semibold text-gray-900">Gestionar mi turno</h1>
            <p class="mt-1.5 text-sm text-gray-400 leading-relaxed">
              Ingresá el código que recibiste al reservar para ver o cancelar tu turno.
            </p>
          </div>

          <!-- Formulario -->
          <div class="space-y-4">
            <div>
              <label for="token-input" class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Código de turno
              </label>
              <input
                id="token-input"
                type="text"
                [ngModel]="token()"
                (ngModelChange)="token.set($event)"
                (keydown.enter)="search()"
                placeholder="Pegá o escribí tu código aquí"
                maxlength="32"
                autocomplete="off"
                autocorrect="off"
                autocapitalize="none"
                spellcheck="false"
                class="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-mono
                       placeholder:text-gray-300 placeholder:font-sans
                       focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
                       transition"
              />
              @if (showError()) {
                <p class="mt-2 text-xs text-red-400">Ingresá un código válido.</p>
              }
            </div>

            <button
              type="button"
              (click)="search()"
              class="w-full py-3 bg-black text-white text-sm font-medium rounded-xl
                     hover:bg-gray-800 transition-colors min-h-[48px]"
            >
              Ver mi turno
            </button>
          </div>

          <!-- Divider -->
          <div class="flex items-center gap-3 my-6">
            <div class="flex-1 h-px bg-gray-100"></div>
            <span class="text-xs text-gray-300">o</span>
            <div class="flex-1 h-px bg-gray-100"></div>
          </div>

          <!-- Acciones secundarias -->
          <div class="space-y-3 text-center">
            <p class="text-xs text-gray-400 leading-relaxed">
              El código está en el email de confirmación que te enviamos al reservar.
            </p>
            <a routerLink="/reservar"
               class="block py-2.5 rounded-xl border border-gray-200 text-sm font-medium
                      text-gray-600 hover:bg-gray-50 transition-colors min-h-[44px]
                      flex items-center justify-center">
              Hacer una nueva reserva
            </a>
          </div>

        </div>
      </div>
    </div>
  `,
})
export class CancelLookupComponent {
  private readonly router = inject(Router);

  readonly token = signal('');
  readonly showError = signal(false);

  search(): void {
    const t = this.token().trim();
    if (!t) {
      this.showError.set(true);
      return;
    }
    this.showError.set(false);
    this.router.navigate(['/turnos/cancelar', t]);
  }
}
