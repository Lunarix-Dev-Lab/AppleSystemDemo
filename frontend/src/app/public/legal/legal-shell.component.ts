import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { THEME } from '../../../theme.config';
import { SiteFooterComponent } from '../../shared/site-footer/site-footer.component';

/**
 * Layout común para las páginas legales: link de volver, título,
 * fecha de actualización, contenido proyectado y pie con enlaces legales.
 */
@Component({
  selector: 'app-legal-shell',
  standalone: true,
  imports: [RouterLink, SiteFooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-white flex flex-col">
      <div class="flex-1 w-full">
        <div class="max-w-3xl mx-auto px-6 py-12 sm:py-16">
          <a
            routerLink="/"
            class="inline-flex items-center gap-1.5 text-sm text-gray-400
                   hover:text-gray-700 transition-colors mb-8"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Volver al inicio
          </a>

          <h1 class="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900">
            {{ title }}
          </h1>
          <p class="mt-2 text-sm text-gray-400">Última actualización: {{ lastUpdated }}</p>

          <div class="mt-10 space-y-8 text-[15px] leading-relaxed text-gray-600">
            <ng-content />
          </div>
        </div>
      </div>

      <app-site-footer />
    </div>
  `,
})
export class LegalShellComponent {
  @Input() title = '';
  readonly lastUpdated = THEME.legal.lastUpdated;
}
