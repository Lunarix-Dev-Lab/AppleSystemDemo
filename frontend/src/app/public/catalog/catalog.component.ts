import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { forkJoin } from 'rxjs';

import { THEME } from '../../../theme.config';

import { Product, ProductImage } from '../../core/product.models';
import { ProductService } from '../../core/product.service';
import { AppointmentService } from '../../core/appointment.service';

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
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            @for (_ of skeleton; track $index) {
              <div class="rounded-3xl bg-gray-100 animate-pulse" style="aspect-ratio:3/4;"></div>
            }
          </div>

        } @else if (loadingError()) {
          <div class="flex flex-col items-center justify-center py-32 text-center">
            <svg class="w-12 h-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p class="text-sm font-medium text-gray-500 mb-1">No se pudo cargar el catálogo</p>
            <p class="text-xs text-gray-400 mb-5">Verificá tu conexión e intentá de nuevo.</p>
            <button (click)="reloadProducts()"
                    class="px-5 py-2.5 bg-black text-white text-sm font-medium rounded-xl
                           hover:bg-gray-800 transition-colors min-h-[44px]">
              Reintentar
            </button>
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

              <article
                class="group flex flex-col rounded-3xl overflow-hidden border border-gray-100
                       transition-shadow duration-300"
                [class]="product.stock === 0
                  ? 'opacity-70'
                  : 'hover:shadow-2xl hover:shadow-gray-200/70'"
              >
                <!-- Image area -->
                <div class="relative flex items-center justify-center bg-gray-50 overflow-hidden"
                     style="aspect-ratio:4/5;">

                  @if (product.stock === 0) {
                    <span class="absolute top-3 left-3 z-10 text-xs font-semibold px-2.5 py-1
                                 bg-gray-900 text-white rounded-full">
                      Sin Stock
                    </span>
                  }

                  @if (product.is_sealed) {
                    <span class="absolute top-3 right-3 z-10 text-xs font-semibold px-2.5 py-1
                                 bg-black text-white rounded-full tracking-wide">
                      Sellado
                    </span>
                  } @else if (product.battery_health) {
                    <span class="absolute top-3 right-3 z-10 inline-flex items-center gap-1
                                 text-xs font-semibold px-2.5 py-1 bg-green-500 text-white rounded-full">
                      <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <rect x="2" y="7" width="16" height="11" rx="2"/>
                        <path d="M22 11v3" stroke-linecap="round"/>
                        <path d="M6 12h8" stroke-linecap="round"/>
                      </svg>
                      {{ product.battery_health }}%
                    </span>
                  }

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
                    <svg class="w-20 h-20 text-gray-200" fill="none" viewBox="0 0 24 24"
                         stroke="currentColor" stroke-width="0.8">
                      <path stroke-linecap="round" stroke-linejoin="round"
                        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                    </svg>
                  }
                </div>

                <!-- Info area -->
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

                  <!-- Price + CTA -->
                  <div class="flex items-center justify-between mt-auto pt-1">
                    <div>
                      <p class="text-xs text-gray-400">Desde</p>
                      <p class="text-xl font-semibold text-gray-900">
                        {{ formatPrice(product.price) }}
                      </p>
                    </div>

                    @if (product.stock > 0) {
                      <a
                        [routerLink]="['/reservar']"
                        [queryParams]="{ product: product.id }"
                        class="min-h-[44px] px-5 py-2.5 bg-black text-white text-sm font-medium
                               rounded-full hover:bg-gray-800 active:scale-95
                               transition-all duration-150 ease-out flex items-center justify-center"
                      >
                        Consultar
                      </a>
                    } @else {
                      <span class="min-h-[44px] px-5 py-2.5 border border-gray-200 text-gray-400
                                   text-sm font-medium rounded-full flex items-center justify-center
                                   cursor-not-allowed">
                        Sin Stock
                      </span>
                    }
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
  private readonly productService = inject(ProductService);
  private readonly appointmentService = inject(AppointmentService);

  readonly storeName = THEME.store.name;
  readonly tagline = THEME.store.tagline;

  readonly products = signal<Product[]>([]);
  readonly currency = signal<'ARS' | 'USD'>('ARS');
  readonly usdRate = signal(1000);
  readonly loading = signal(true);
  readonly loadingError = signal(false);
  readonly skeleton = Array(6);

  constructor() {
    const pageTitle = `Catálogo — ${THEME.store.name}`;
    inject(Title).setTitle(pageTitle);
    inject(Meta).updateTag({ name: 'description', content: THEME.meta.description });
    inject(Meta).updateTag({ property: 'og:title', content: pageTitle });

    afterNextRender(() => this._load());
  }

  ngOnInit(): void {}

  reloadProducts(): void {
    this._load();
  }

  private _load(): void {
    this.loading.set(true);
    this.loadingError.set(false);
    forkJoin({
      products: this.productService.list(),
      schedule: this.appointmentService.getSchedule(),
    }).subscribe({
      next: ({ products, schedule }) => {
        this.products.set(products);
        this.currency.set(schedule.config.display_currency);
        this.usdRate.set(schedule.config.usd_rate);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.loadingError.set(true); },
    });
  }

  primaryImage(product: Product): ProductImage | undefined {
    return product.images.find(i => i.is_primary) ?? product.images[0];
  }

  formatPrice(price: number): string {
    const p = Number(price);
    if (this.currency() === 'USD') {
      const usd = Math.round(p / this.usdRate());
      return `USD ${usd.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
    }
    return `$${p.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
  }
}
