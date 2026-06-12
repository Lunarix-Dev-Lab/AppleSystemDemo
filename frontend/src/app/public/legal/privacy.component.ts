import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { THEME } from '../../../theme.config';
import { LegalShellComponent } from './legal-shell.component';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [LegalShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-legal-shell title="Política de Privacidad">

      <section>
        <p>
          En {{ companyName }} respetamos tu privacidad. Esta política explica qué datos
          personales recopilamos, con qué finalidad, en qué nos basamos para tratarlos y
          qué derechos tenés sobre ellos, conforme a la Ley 25.326 de Protección de los
          Datos Personales de la República Argentina.
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-gray-900 mb-3">1. Responsable del tratamiento</h2>
        <ul class="list-disc pl-5 space-y-1.5">
          <li>Responsable: {{ companyName }}</li>
          @if (cuit) { <li>CUIT: {{ cuit }}</li> }
          @if (domicilio) { <li>Domicilio: {{ domicilio }}</li> }
          <li>Contacto: <a [href]="'mailto:' + email" class="text-gray-900 underline">{{ email }}</a></li>
        </ul>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-gray-900 mb-3">2. Datos que recopilamos</h2>
        <p class="mb-2">Tratamos únicamente los datos necesarios:</p>
        <ul class="list-disc pl-5 space-y-1.5">
          <li><strong>Datos que nos proporcionás</strong> al reservar un turno: nombre,
            correo electrónico, teléfono y, opcionalmente, una nota.</li>
          <li><strong>Datos de navegación</strong>: si aceptás las cookies de analítica,
            recopilamos información estadística y anónima sobre el uso del Sitio mediante
            Google Analytics. Podés consultar el detalle en nuestra
            Política de Cookies.</li>
        </ul>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-gray-900 mb-3">3. Finalidad</h2>
        <ul class="list-disc pl-5 space-y-1.5">
          <li>Gestionar y confirmar tu reserva de turno, y contactarte por ese motivo.</li>
          <li>Responder tus consultas.</li>
          <li>Entender cómo se usa el Sitio para mejorarlo (solo con tu consentimiento).</li>
        </ul>
        <p class="mt-3">
          No vendemos tus datos ni los utilizamos para decisiones automatizadas ni para
          publicidad de terceros.
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-gray-900 mb-3">4. Base legal</h2>
        <p>
          Tratamos tus datos de contacto sobre la base de tu consentimiento y de la
          relación que se genera al solicitar un turno. Las cookies de analítica se tratan
          exclusivamente con tu consentimiento, que podés otorgar o rechazar desde el
          banner de cookies y revocar en cualquier momento.
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-gray-900 mb-3">5. Conservación</h2>
        <p>
          Conservamos tus datos de contacto mientras sean necesarios para la finalidad por
          la que fueron recolectados y durante los plazos legales aplicables. Luego, los
          eliminamos o anonimizamos.
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-gray-900 mb-3">6. Destinatarios y proveedores</h2>
        <p class="mb-2">
          Para prestar el servicio, podemos compartir datos con proveedores que actúan por
          nuestra cuenta:
        </p>
        <ul class="list-disc pl-5 space-y-1.5">
          <li><strong>Proveedor de correo electrónico</strong>, para enviarte las
            confirmaciones y avisos de tu turno.</li>
          <li><strong>Google Analytics</strong> (Google LLC), para la analítica del Sitio,
            solo si aceptaste las cookies.</li>
          <li><strong>Proveedor de hosting</strong>, donde se aloja el Sitio.</li>
        </ul>
        <p class="mt-3">
          Algunos proveedores pueden almacenar información en servidores ubicados fuera de
          la Argentina. En esos casos procuramos que existan garantías adecuadas para la
          protección de tus datos.
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-gray-900 mb-3">7. Seguridad</h2>
        <p>
          Aplicamos medidas técnicas y organizativas razonables para proteger tus datos
          contra el acceso no autorizado, la pérdida o la alteración (entre otras, cifrado
          de credenciales, control de acceso y conexiones seguras).
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-gray-900 mb-3">8. Tus derechos</h2>
        <p>
          Podés ejercer en cualquier momento tus derechos de acceso, rectificación,
          actualización y supresión de tus datos escribiéndonos a
          <a [href]="'mailto:' + email" class="text-gray-900 underline">{{ email }}</a>.
          El titular de los datos tiene derecho a solicitar y obtener información de sus
          datos personales incluidos en bases de datos. La Agencia de Acceso a la
          Información Pública (AAIP), órgano de control de la Ley 25.326, atiende las
          denuncias y reclamos vinculados al incumplimiento de la normativa de protección
          de datos personales.
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-gray-900 mb-3">9. Menores de edad</h2>
        <p>
          El Sitio está dirigido a personas mayores de edad. No recopilamos
          intencionalmente datos de menores.
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-gray-900 mb-3">10. Cambios</h2>
        <p>
          Podemos actualizar esta política. La versión vigente es la publicada en esta
          página, con su fecha de última actualización.
        </p>
      </section>

    </app-legal-shell>
  `,
})
export class PrivacyComponent {
  readonly companyName = THEME.legal.companyName || THEME.store.name;
  readonly cuit = THEME.legal.cuit;
  readonly email = THEME.store.email;
  readonly domicilio = THEME.store.address
    ? `${THEME.store.address}${THEME.store.city ? ', ' + THEME.store.city : ''}`
    : '';

  constructor() {
    inject(Title).setTitle('Política de Privacidad · ' + (THEME.legal.companyName || THEME.store.name));
    inject(Meta).updateTag({ name: 'description', content: 'Cómo tratamos y protegemos tus datos personales.' });
  }
}
