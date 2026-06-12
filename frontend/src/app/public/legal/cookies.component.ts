import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { THEME } from '../../../theme.config';
import { ConsentService } from '../../core/consent/consent.service';
import { LegalShellComponent } from './legal-shell.component';

@Component({
  selector: 'app-cookies',
  standalone: true,
  imports: [LegalShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-legal-shell title="Política de Cookies">

      <section>
        <p>
          Esta política explica qué cookies utiliza el sitio de {{ companyName }}, con qué
          finalidad y cómo podés gestionarlas.
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-gray-900 mb-3">¿Qué son las cookies?</h2>
        <p>
          Las cookies son pequeños archivos que un sitio guarda en tu dispositivo al
          navegarlo. Sirven para que el sitio funcione, para recordar preferencias o para
          obtener estadísticas de uso. Tecnologías similares, como el almacenamiento local
          del navegador, cumplen funciones parecidas y se tratan igual en esta política.
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-gray-900 mb-3">Cookies que utilizamos</h2>

        <div class="space-y-4">
          <div class="rounded-2xl border border-gray-100 p-5">
            <p class="font-medium text-gray-900">1. Necesarias (siempre activas)</p>
            <p class="mt-1.5">
              Imprescindibles para el funcionamiento del sitio; no requieren consentimiento.
              Incluyen el almacenamiento local que mantiene la sesión iniciada del panel de
              administración. No se usan para seguirte ni con fines publicitarios.
            </p>
          </div>

          <div class="rounded-2xl border border-gray-100 p-5">
            <p class="font-medium text-gray-900">2. Analíticas (requieren tu consentimiento)</p>
            <p class="mt-1.5">
              Usamos <strong>Google Analytics</strong> para entender de forma estadística y
              anónima cómo se usa el sitio (páginas visitadas, dispositivo aproximado, etc.)
              y así mejorarlo. Estas cookies <strong>solo se activan si las aceptás</strong>
              en el banner. Si las rechazás, no se cargan.
            </p>

            <div class="mt-4 overflow-x-auto">
              <table class="w-full text-sm border-collapse">
                <thead>
                  <tr class="text-left text-gray-500 border-b border-gray-100">
                    <th class="py-2 pr-4 font-medium">Cookie</th>
                    <th class="py-2 pr-4 font-medium">Proveedor</th>
                    <th class="py-2 pr-4 font-medium">Finalidad</th>
                    <th class="py-2 font-medium">Duración</th>
                  </tr>
                </thead>
                <tbody class="text-gray-600">
                  <tr class="border-b border-gray-50">
                    <td class="py-2 pr-4 font-mono text-xs">_ga</td>
                    <td class="py-2 pr-4">Google</td>
                    <td class="py-2 pr-4">Distingue usuarios</td>
                    <td class="py-2">2 años</td>
                  </tr>
                  <tr class="border-b border-gray-50">
                    <td class="py-2 pr-4 font-mono text-xs">_ga_*</td>
                    <td class="py-2 pr-4">Google</td>
                    <td class="py-2 pr-4">Mantiene el estado de la sesión</td>
                    <td class="py-2">2 años</td>
                  </tr>
                  <tr>
                    <td class="py-2 pr-4 font-mono text-xs">_gid</td>
                    <td class="py-2 pr-4">Google</td>
                    <td class="py-2 pr-4">Distingue usuarios</td>
                    <td class="py-2">24 horas</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-gray-900 mb-3">Tu consentimiento</h2>
        <p class="mb-4">
          Al ingresar por primera vez te mostramos un banner para que aceptes o rechaces las
          cookies de analítica. Podés cambiar tu elección cuando quieras desde el siguiente
          botón:
        </p>
        <button
          type="button"
          (click)="configurar()"
          class="px-5 py-2.5 text-sm font-medium rounded-xl bg-black text-white
                 hover:bg-gray-800 transition-colors min-h-[44px]"
        >
          Configurar cookies
        </button>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-gray-900 mb-3">Cómo gestionarlas en tu navegador</h2>
        <p>
          Además, podés bloquear o eliminar las cookies desde la configuración de tu
          navegador. Para no ser rastreado por Google Analytics en ningún sitio, Google
          ofrece un complemento de inhabilitación disponible en
          <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener"
             class="text-gray-900 underline">tools.google.com/dlpage/gaoptout</a>.
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-gray-900 mb-3">Cambios</h2>
        <p>
          Podemos actualizar esta política. La versión vigente es la publicada en esta
          página, con su fecha de última actualización. Ante dudas, escribinos a
          <a [href]="'mailto:' + email" class="text-gray-900 underline">{{ email }}</a>.
        </p>
      </section>

    </app-legal-shell>
  `,
})
export class CookiesComponent {
  private readonly consent = inject(ConsentService);

  readonly companyName = THEME.legal.companyName || THEME.store.name;
  readonly email = THEME.store.email;

  constructor() {
    inject(Title).setTitle('Política de Cookies · ' + (THEME.legal.companyName || THEME.store.name));
    inject(Meta).updateTag({ name: 'description', content: 'Qué cookies usamos y cómo gestionarlas.' });
  }

  configurar(): void {
    this.consent.reopen();
  }
}
