import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ConsentService } from '../../core/consent/consent.service';

@Component({
  selector: 'app-cookie-banner',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (show()) {
      <div
        class="fixed bottom-0 inset-x-0 z-[60] p-3 sm:p-5"
        role="dialog"
        aria-live="polite"
        aria-label="Aviso de cookies"
      >
        <div
          class="max-w-3xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-2xl
                 shadow-gray-300/40 p-5 sm:p-6 flex flex-col gap-4
                 sm:flex-row sm:items-center sm:justify-between"
        >
          <p class="text-sm text-gray-600 leading-relaxed">
            Usamos cookies necesarias para que el sitio funcione y cookies de
            <span class="font-medium text-gray-800">analítica</span> (Google Analytics)
            para entender cómo se usa la página. Podés aceptarlas o rechazarlas.
            Más información en nuestra
            <a routerLink="/cookies" class="underline hover:text-gray-900">Política de Cookies</a>.
          </p>

          <div class="flex items-center gap-2 shrink-0">
            <button
              type="button"
              (click)="reject()"
              class="px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200
                     text-gray-600 hover:bg-gray-50 transition-colors min-h-[44px]"
            >
              Rechazar
            </button>
            <button
              type="button"
              (click)="accept()"
              class="px-5 py-2.5 text-sm font-medium rounded-xl bg-black text-white
                     hover:bg-gray-800 transition-colors min-h-[44px]"
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class CookieBannerComponent {
  private readonly consent = inject(ConsentService);

  // Solo en browser y mientras no haya una decisión guardada.
  readonly show = computed(() => this.consent.isBrowser && this.consent.consent() === null);

  accept(): void {
    this.consent.accept();
  }

  reject(): void {
    this.consent.reject();
  }
}
