import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { THEME } from '../../../theme.config';
import { LegalShellComponent } from './legal-shell.component';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [LegalShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-legal-shell title="Términos y Condiciones">

      <section>
        <p>
          Estos Términos y Condiciones regulan el uso del sitio web de
          {{ companyName }} (en adelante, "el Sitio"). Al navegar o utilizar el Sitio,
          aceptás estos términos en su totalidad. Si no estás de acuerdo, te pedimos
          que no utilices el Sitio.
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-gray-900 mb-3">1. Objeto del Sitio</h2>
        <p>
          El Sitio funciona como una vitrina informativa de productos y un sistema de
          reserva de turnos para atención presencial en el local. <strong>El Sitio no es
          una tienda online:</strong> no se realizan ventas, compras ni pagos a través de
          él. Toda operación se concreta de forma presencial en el local del comercio.
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-gray-900 mb-3">2. Productos, precios y disponibilidad</h2>
        <p>
          La información de los productos (modelos, características, precios, colores,
          capacidad y estado) se publica con fines orientativos y puede contener errores
          o estar desactualizada. Las imágenes son ilustrativas y pueden no coincidir
          exactamente con la unidad física. Los precios y el stock están sujetos a cambios
          sin previo aviso. El precio, la condición y la disponibilidad finales se
          confirman en el local al momento de la operación.
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-gray-900 mb-3">3. Reserva de turnos</h2>
        <ul class="list-disc pl-5 space-y-1.5">
          <li>La reserva de un turno está sujeta a disponibilidad y constituye una
            solicitud de atención, no una obligación de compra.</li>
          <li>Te comprometés a brindar datos de contacto veraces y actualizados.</li>
          <li>{{ companyName }} podrá confirmar, reprogramar o cancelar un turno por
            motivos operativos, notificándote por los medios que dejaste.</li>
          <li>Podés cancelar tu turno en cualquier momento desde el enlace que recibís
            al reservar.</li>
        </ul>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-gray-900 mb-3">4. Uso permitido</h2>
        <p>
          Te comprometés a utilizar el Sitio de forma lícita y a no realizar acciones que
          puedan dañarlo, sobrecargarlo, vulnerar su seguridad o afectar su normal
          funcionamiento, ni a utilizar sistemas automatizados para extraer información
          de forma masiva.
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-gray-900 mb-3">5. Propiedad intelectual</h2>
        <p>
          Los contenidos del Sitio (textos, diseño, logos y demás elementos) pertenecen a
          {{ companyName }} o a sus respectivos titulares y están protegidos por la
          normativa de propiedad intelectual. "iPhone" y "Apple" son marcas registradas de
          Apple Inc. Este Sitio y {{ companyName }} no están asociados, afiliados ni
          patrocinados por Apple Inc.
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-gray-900 mb-3">6. Limitación de responsabilidad</h2>
        <p>
          El Sitio se ofrece "tal cual" y según disponibilidad. En la medida permitida por
          la ley, {{ companyName }} no será responsable por daños derivados del uso o la
          imposibilidad de uso del Sitio, ni por la exactitud de la información publicada
          con fines orientativos.
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-gray-900 mb-3">7. Enlaces a terceros</h2>
        <p>
          El Sitio puede contener enlaces a sitios de terceros (por ejemplo, WhatsApp o
          Instagram). No somos responsables del contenido ni de las políticas de privacidad
          de esos sitios.
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-gray-900 mb-3">8. Defensa del consumidor</h2>
        <p>
          Se dejan a salvo los derechos que la Ley 24.240 de Defensa del Consumidor reconoce
          a los consumidores y usuarios. Ante cualquier conflicto, podés acudir a la
          autoridad de aplicación correspondiente.
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-gray-900 mb-3">9. Modificaciones</h2>
        <p>
          Podemos actualizar estos Términos en cualquier momento. La versión vigente es la
          publicada en esta página, con su fecha de última actualización.
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-gray-900 mb-3">10. Ley aplicable y jurisdicción</h2>
        <p>
          Estos Términos se rigen por las leyes de la República Argentina. Ante cualquier
          controversia, las partes se someten a los tribunales ordinarios de
          {{ jurisdiction }}, salvo disposición legal en contrario en favor del consumidor.
        </p>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-gray-900 mb-3">11. Contacto</h2>
        <p>
          Por cualquier consulta sobre estos Términos, escribinos a
          <a [href]="'mailto:' + email" class="text-gray-900 underline">{{ email }}</a>{{ contactExtra }}.
        </p>
      </section>

    </app-legal-shell>
  `,
})
export class TermsComponent {
  readonly companyName = THEME.legal.companyName || THEME.store.name;
  readonly jurisdiction = THEME.legal.jurisdiction;
  readonly email = THEME.store.email;
  readonly contactExtra = THEME.store.address
    ? ` o acercate a ${THEME.store.address}${THEME.store.city ? ', ' + THEME.store.city : ''}`
    : '';

  constructor() {
    inject(Title).setTitle('Términos y Condiciones · ' + (THEME.legal.companyName || THEME.store.name));
    inject(Meta).updateTag({ name: 'description', content: 'Términos y condiciones de uso del sitio.' });
  }
}
