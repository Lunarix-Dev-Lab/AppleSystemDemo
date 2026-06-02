import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

import { THEME } from '../../../theme.config';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-white flex flex-col">

      <!-- Hero -->
      <main class="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">

        <!-- Badge -->
        <span class="inline-flex items-center gap-2 text-xs font-semibold text-gray-400
                     uppercase tracking-[0.2em] mb-8">
          <span class="w-1.5 h-1.5 rounded-full bg-green-400"></span>
          Atención con turno · Garantía oficial
        </span>

        <!-- Store name -->
        <h1 class="text-6xl sm:text-7xl font-semibold tracking-tight text-gray-900 leading-none">
          {{ name }}
        </h1>

        <!-- Tagline -->
        <p class="mt-5 text-xl sm:text-2xl text-gray-400 max-w-lg leading-relaxed">
          {{ tagline }}
        </p>

        <!-- Description -->
        <p class="mt-4 text-base text-gray-400 max-w-md leading-relaxed">
          {{ description }}
        </p>

        <!-- CTAs -->
        <div class="flex flex-col sm:flex-row items-center gap-3 mt-10">
          <a routerLink="/catalogo"
             class="w-full sm:w-auto px-8 py-3.5 bg-black text-white text-sm font-medium
                    rounded-full hover:bg-gray-800 transition-colors duration-200 text-center min-h-[48px]
                    flex items-center justify-center">
            Ver catálogo
          </a>
          <a routerLink="/reservar"
             class="w-full sm:w-auto px-8 py-3.5 border border-gray-200 text-gray-700 text-sm font-medium
                    rounded-full hover:bg-gray-50 transition-colors duration-200 text-center min-h-[48px]
                    flex items-center justify-center">
            Reservar turno
          </a>
        </div>

        <!-- WhatsApp -->
        @if (whatsapp) {
          <a [href]="'https://wa.me/' + whatsapp"
             target="_blank" rel="noopener"
             class="mt-6 flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.107 1.51 5.845L.057 23.786a.5.5 0 0 0 .614.657l6.04-1.456A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.703-.519-5.245-1.424l-.362-.214-3.757.906.938-3.652-.236-.376A9.944 9.944 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            Escribinos por WhatsApp
          </a>
        }

      </main>

      <!-- Contact strip -->
      <footer class="border-t border-gray-100 py-5 px-6">
        <div class="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
          @if (address) {
            <span class="flex items-center gap-1.5 text-sm text-gray-400">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              {{ address }}
            </span>
          }
          @if (phone) {
            <a [href]="'tel:' + phone"
               class="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
              </svg>
              {{ phone }}
            </a>
          }
          @if (instagram) {
            <a [href]="'https://instagram.com/' + instagram"
               target="_blank" rel="noopener"
               class="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors">
              <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              &#64;{{ instagram }}
            </a>
          }
        </div>
      </footer>

    </div>
  `,
})
export class HomeComponent {
  readonly name = THEME.store.name;
  readonly tagline = THEME.store.tagline;
  readonly description = THEME.store.description;
  readonly phone = THEME.store.phone;
  readonly whatsapp = THEME.store.whatsapp;
  readonly address = THEME.store.address;
  readonly instagram = THEME.store.instagram;

  constructor() {
    inject(Title).setTitle(THEME.meta.title);
    inject(Meta).updateTag({ name: 'description', content: THEME.meta.description });
    inject(Meta).updateTag({ property: 'og:title', content: THEME.meta.title });
    inject(Meta).updateTag({ property: 'og:description', content: THEME.meta.description });
  }
}
