import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

import { THEME } from '../../../theme.config';

import { Product, ProductImage } from '../../core/product.models';
import { ProductService } from '../../core/product.service';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-white">

      <!-- Hero -->
      <header class="px-6 pt-24 pb-14 max-w-[1200px] mx-auto">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-4">Catálogo</p>
        <h1 class="text-5xl sm:text-6xl font-semibold tracking-tight text-gray-900 leading-none">
          {{ storeName }}
        </h1>
        <p class="mt-4 text-lg text-gray-400 max-w-md leading-relaxed">
          {{ tagline }}
        </p>
      </header>

      <!-- Grid -->
      <main class="max-w-[1200px] mx-auto px-6 pb-28">

        @if (loading()) {
          <!-- Skeleton (ui-ux-pro-max §3: skeleton screens para operaciones >300ms) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            @for (_ of skeleton; track $index) {
              <div class="rounded-3xl bg-gray-100 animate-pulse" style="aspect-ratio:3/4;"></div>
            }
          </div>

        } @else if (products().length === 0) {
          <div class="flex flex-col items-center justify-center py-32 text-center">
            <svg class="w-14 h-14 text-gray-200 mb-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
            <p class="text-base font-medium text-gray-300">Sin productos disponibles</p>
          </div>

        } @else {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            @for (product of products(); track product.id) {

              <!-- Card
                   ui-ux-pro-max §4: style-match (minimalism, Apple aesthetic)
                   ui-ux-pro-max §7: animation transform/opacity, 300ms ease-out
              -->
              <article
                class="group flex flex-col rounded-3xl overflow-hidden
                       border border-gray-100
                       hover:shadow-2xl hover:shadow-gray-200/70
                       transition-shadow duration-300"
              >
                <!-- Image area -->
                <div class="relative flex items-center justify-center bg-gray-50 overflow-hidden"
                     style="aspect-ratio:4/5;">

                  @if (primaryImage(product); as img) {
                    <img
                      [src]="img.url"
                      [alt]="product.name"
                      loading="lazy"
                      class="w-3/4 h-3/4 object-contain select-none
                             group-hover:scale-[1.04]
                             transition-transform duration-500 ease-out"
                    />
                  } @else {
                    <!-- Placeholder: phone outline -->
                    <svg class="w-20 h-20 text-gray-200" fill="none" viewBox="0 0 24 24"
                         stroke="currentColor" stroke-width="0.8">
                      <path stroke-linecap="round" stroke-linejoin="round"
                        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                    </svg>
                  }
                </div>

                <!-- Info area (ui-ux-pro-max §6: type scale, §5: spacing 8px grid) -->
                <div class="flex flex-col flex-1 px-6 pt-5 pb-6 bg-white gap-3">

                  <div>
                    <h2 class="text-[17px] font-semibold text-gray-900 leading-snug">
                      {{ product.name }}
                    </h2>

                    @if (product.colors.length) {
                      <p class="mt-1 text-sm text-gray-400 leading-snug">
                        {{ product.colors.join(' · ') }}
                      </p>
                    }
                  </div>

                  @if (product.storage_options.length) {
                    <div class="flex flex-wrap gap-1.5">
                      @for (opt of product.storage_options; track opt) {
                        <span class="text-xs font-medium px-2.5 py-1 rounded-full
                                     border border-gray-200 text-gray-500">
                          {{ opt }}
                        </span>
                      }
                    </div>
                  }

                  <!-- Price + CTA
                       ui-ux-pro-max §2: touch target min 44px (py-3 + text = ~44px)
                       ui-ux-pro-max §8: primary-action one per card
                  -->
                  <div class="flex items-center justify-between mt-auto pt-1">
                    <div>
                      <p class="text-xs text-gray-400">Desde</p>
                      <p class="text-xl font-semibold text-gray-900">
                        {{ formatPrice(product.price) }}
                      </p>
                    </div>

                    <a
                      [routerLink]="['/reservar']"
                      [queryParams]="{ product: product.id }"
                      class="min-h-[44px] px-5 py-2.5 bg-black text-white text-sm font-medium
                             rounded-full hover:bg-gray-800
                             active:scale-95
                             transition-all duration-150 ease-out
                             flex items-center justify-center"
                    >
                      Consultar
                    </a>
                  </div>

                </div>
              </article>

            }
          </div>
        }

      </main>
    </div>
  `,
})
export class CatalogComponent implements OnInit {
  private readonly platform = inject(PLATFORM_ID);
  private readonly productService = inject(ProductService);

  readonly storeName = THEME.store.name;
  readonly tagline = THEME.store.tagline;

  constructor() {
    const pageTitle = `Catálogo — ${THEME.store.name}`;
    inject(Title).setTitle(pageTitle);
    inject(Meta).updateTag({ name: 'description', content: THEME.meta.description });
    inject(Meta).updateTag({ property: 'og:title', content: pageTitle });
  }

  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly skeleton = Array(6);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platform)) {
      this.loading.set(false);
      return;
    }
    this.productService.list().subscribe({
      next: p => { this.products.set(p); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  primaryImage(product: Product): ProductImage | undefined {
    return product.images.find(i => i.is_primary) ?? product.images[0];
  }

  formatPrice(price: number): string {
    return `$${Number(price).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
  }
}
