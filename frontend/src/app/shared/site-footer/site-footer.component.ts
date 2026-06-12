import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { THEME } from '../../../theme.config';
import { ConsentService } from '../../core/consent/consent.service';

/**
 * Pie de página con enlaces legales. Reutilizable en páginas públicas.
 */
@Component({
  selector: 'app-site-footer',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="border-t border-gray-100 bg-white">
      <div class="max-w-4xl mx-auto px-6 py-6 flex flex-col items-center gap-3 text-center">
        <nav class="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
          <a routerLink="/terminos" class="text-gray-500 hover:text-gray-900 transition-colors">
            Términos y Condiciones
          </a>
          <span class="text-gray-200" aria-hidden="true">·</span>
          <a routerLink="/privacidad" class="text-gray-500 hover:text-gray-900 transition-colors">
            Política de Privacidad
          </a>
          <span class="text-gray-200" aria-hidden="true">·</span>
          <a routerLink="/cookies" class="text-gray-500 hover:text-gray-900 transition-colors">
            Política de Cookies
          </a>
          <span class="text-gray-200" aria-hidden="true">·</span>
          <button
            type="button"
            (click)="configurarCookies()"
            class="text-gray-500 hover:text-gray-900 transition-colors"
          >
            Configurar cookies
          </button>
        </nav>

        <p class="text-xs text-gray-400">
          © {{ year }} {{ companyName }}. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  `,
})
export class SiteFooterComponent {
  private readonly consent = inject(ConsentService);

  readonly year = new Date().getFullYear();
  readonly companyName = THEME.legal.companyName || THEME.store.name;

  configurarCookies(): void {
    this.consent.reopen();
  }
}
