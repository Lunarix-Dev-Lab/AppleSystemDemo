import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom, forkJoin } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { Product, ProductImage } from '../../core/product.models';
import { ProductService } from '../../core/product.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-4 sm:p-8 max-w-6xl mx-auto">

      <!-- Header -->
      <div class="flex items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">Productos</h1>
          <p class="text-sm text-gray-400 mt-0.5">{{ products().length }} en total</p>
        </div>
        <button
          (click)="openCreate()"
          class="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-medium
                 rounded-xl hover:bg-gray-800 transition-colors min-h-[44px]"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Nuevo producto
        </button>
      </div>

      <!-- Table -->
      @if (loading()) {
        <div class="space-y-3">
          @for (_ of [1,2,3,4]; track $index) {
            <div class="h-16 rounded-xl bg-gray-100 animate-pulse"></div>
          }
        </div>
      } @else if (products().length === 0) {
        <div class="flex flex-col items-center justify-center py-24 bg-gray-50 rounded-2xl text-center">
          <svg class="w-10 h-10 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
          </svg>
          <p class="text-sm font-medium text-gray-400">Sin productos. Crea el primero.</p>
        </div>
      } @else {
        <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden overflow-x-auto">
          <table class="w-full min-w-[640px]">
            <thead>
              <tr class="border-b border-gray-100">
                <th class="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Producto</th>
                <th class="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Storage</th>
                <th class="text-right px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Precio</th>
                <th class="text-center px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Stock</th>
                <th class="text-center px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                <th class="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody>
              @for (product of products(); track product.id) {
                <tr class="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">

                  <!-- Thumbnail + nombre + condición -->
                  <td class="px-5 py-3.5">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                        @if (primaryImage(product); as img) {
                          <img [src]="img.url" [alt]="product.name"
                               class="w-full h-full object-contain p-1"/>
                        } @else {
                          <svg class="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                          </svg>
                        }
                      </div>
                      <div>
                        <p class="text-sm font-medium text-gray-900">{{ product.name }}</p>
                        @if (product.is_sealed) {
                          <p class="text-xs text-gray-400 mt-0.5">Sellado</p>
                        } @else if (product.battery_health) {
                          <p class="text-xs text-green-500 mt-0.5">{{ product.battery_health }}% bat.</p>
                        }
                      </div>
                    </div>
                  </td>

                  <!-- Storage badges -->
                  <td class="px-5 py-3.5 hidden md:table-cell">
                    <div class="flex flex-wrap gap-1">
                      @for (opt of product.storage_options.slice(0, 3); track opt) {
                        <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{{ opt }}</span>
                      }
                      @if (product.storage_options.length > 3) {
                        <span class="text-xs text-gray-400">+{{ product.storage_options.length - 3 }}</span>
                      }
                    </div>
                  </td>

                  <!-- Precio -->
                  <td class="px-5 py-3.5 text-right">
                    <span class="text-sm font-semibold text-gray-900">{{ formatPrice(product.price) }}</span>
                  </td>

                  <!-- Stock -->
                  <td class="px-5 py-3.5 text-center hidden sm:table-cell">
                    <span class="text-sm font-medium"
                          [class]="product.stock === 0 ? 'text-red-400' : 'text-gray-600'">
                      {{ product.stock }}
                    </span>
                  </td>

                  <!-- Estado (toggle inline) -->
                  <td class="px-5 py-3.5 text-center">
                    <button
                      (click)="toggleActive(product)"
                      class="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5
                             rounded-full transition-colors min-h-[32px]"
                      [class]="product.is_active
                        ? 'bg-green-50 text-green-600 hover:bg-green-100'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'"
                    >
                      <span class="w-1.5 h-1.5 rounded-full"
                            [class]="product.is_active ? 'bg-green-500' : 'bg-gray-400'"></span>
                      {{ product.is_active ? 'Activo' : 'Inactivo' }}
                    </button>
                  </td>

                  <!-- Acciones -->
                  <td class="px-5 py-3.5">
                    <div class="flex items-center justify-end gap-1">
                      <button (click)="openEdit(product)"
                              class="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100
                                     transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                      </button>
                      <button (click)="remove(product)"
                              [disabled]="deleting() === product.id"
                              class="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50
                                     transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center
                                     disabled:opacity-40 disabled:cursor-not-allowed">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </td>

                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- ── Modal overlay ───────────────────────────────────────────────────── -->
    @if (showModal()) {
      <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">

        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50" (click)="closeModal()"></div>

        <!-- Panel -->
        <div class="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl
                    max-h-[90vh] overflow-y-auto">

          <!-- Modal header -->
          <div class="flex items-center justify-between px-5 sm:px-7 pt-6 sm:pt-7 pb-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl z-10">
            <h2 class="text-lg font-semibold text-gray-900">
              {{ editing() ? 'Editar producto' : 'Nuevo producto' }}
            </h2>
            <button (click)="closeModal()"
                    class="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors min-h-[36px] min-w-[36px]">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <form [formGroup]="form" (ngSubmit)="save()" class="px-5 sm:px-7 py-6 space-y-5">

            <!-- Nombre * -->
            <div>
              <label for="prod-name" class="block text-sm font-medium text-gray-700 mb-1.5">
                Nombre <span class="text-red-400">*</span>
              </label>
              <input id="prod-name" name="name" formControlName="name" type="text"
                     placeholder="ej. iPhone 15 Pro"
                     class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm
                            placeholder:text-gray-300
                            focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
                            transition"/>
              @if (form.get('name')?.invalid && form.get('name')?.touched) {
                <p class="mt-1.5 text-xs text-red-400">Campo requerido</p>
              }
            </div>

            <!-- Descripción -->
            <div>
              <label for="prod-desc" class="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
              <textarea id="prod-desc" name="description" formControlName="description" rows="2"
                        placeholder="Descripción opcional..."
                        class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm
                               placeholder:text-gray-300 resize-none
                               focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
                               transition"></textarea>
            </div>

            <!-- Condición: Sellado / Usado -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Condición</label>
              <div class="flex gap-2">
                <button
                  type="button"
                  (click)="setSealed(true)"
                  class="flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all min-h-[44px]"
                  [class]="form.controls.is_sealed.value
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 text-gray-500 hover:border-gray-400'">
                  Sellado
                </button>
                <button
                  type="button"
                  (click)="setSealed(false)"
                  class="flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all min-h-[44px]"
                  [class]="!form.controls.is_sealed.value
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 text-gray-500 hover:border-gray-400'">
                  Usado
                </button>
              </div>
            </div>

            <!-- Estado de batería (solo si es usado) -->
            @if (!form.controls.is_sealed.value) {
              <div>
                <label for="prod-battery" class="block text-sm font-medium text-gray-700 mb-1.5">
                  Estado de batería <span class="text-red-400">*</span>
                </label>
                <div class="flex items-center gap-3">
                  <input
                    id="prod-battery"
                    name="battery_health"
                    formControlName="battery_health"
                    type="number"
                    min="1"
                    max="100"
                    placeholder="ej. 87"
                    (keydown)="$event.key === '.' || $event.key === ',' ? $event.preventDefault() : null"
                    class="w-28 px-4 py-2.5 rounded-xl border border-gray-200 text-sm
                           placeholder:text-gray-300
                           focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
                           transition"
                  />
                  <span class="text-sm text-gray-500">%</span>
                </div>
                @if (form.hasError('batteryRequired') && form.controls.battery_health.touched) {
                  <p class="mt-1.5 text-xs text-red-400">Ingresá el porcentaje de batería</p>
                } @else if (form.controls.battery_health.invalid && form.controls.battery_health.touched) {
                  <p class="mt-1.5 text-xs text-red-400">Porcentaje inválido (1–100)</p>
                }
              </div>
            }

            <!-- Precio + Stock -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="prod-price" class="block text-sm font-medium text-gray-700 mb-1.5">
                  Precio (USD) <span class="text-red-400">*</span>
                </label>
                <input id="prod-price" name="price" formControlName="price" type="number" min="0" max="99999999"
                       placeholder="ej. 900"
                       class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm
                              placeholder:text-gray-300
                              focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
                              transition"/>
                @if (form.get('price')?.invalid && form.get('price')?.touched) {
                  <p class="mt-1.5 text-xs text-red-400">Precio inválido (0 – 99,999,999)</p>
                }
              </div>
              <div>
                <label for="prod-stock" class="block text-sm font-medium text-gray-700 mb-1.5">
                  Stock <span class="text-red-400">*</span>
                </label>
                <input id="prod-stock" name="stock" formControlName="stock" type="number" min="0" max="99999"
                       placeholder="0"
                       class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm
                              placeholder:text-gray-300
                              focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
                              transition"/>
                @if (form.get('stock')?.invalid && form.get('stock')?.touched) {
                  <p class="mt-1.5 text-xs text-red-400">Stock inválido (0 – 99,999)</p>
                }
              </div>
            </div>

            <!-- Colores (tag input) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Colores</label>
              <div class="flex flex-wrap gap-1.5 p-2.5 bg-gray-50 border border-gray-200 rounded-xl min-h-[44px]">
                @for (color of formColors(); track color; let i = $index) {
                  <span class="flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200
                               text-gray-700 text-sm rounded-lg">
                    {{ color }}
                    <button type="button" (click)="removeColor(i)"
                            class="text-gray-400 hover:text-gray-700 leading-none ml-0.5">×</button>
                  </span>
                }
                <input
                  type="text"
                  [value]="colorInput()"
                  (input)="colorInput.set($any($event.target).value)"
                  (keydown)="onTagKey($event, 'color')"
                  (blur)="commitTag('color')"
                  placeholder="Escribir y Enter…"
                  class="flex-1 min-w-[120px] bg-transparent text-sm outline-none px-1 py-0.5"/>
              </div>
              <p class="mt-1 text-xs text-gray-400">ej. Negro Titanio, Blanco Titanio</p>
            </div>

            <!-- Almacenamiento (tag input) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Almacenamiento</label>
              <div class="flex flex-wrap gap-1.5 p-2.5 bg-gray-50 border border-gray-200 rounded-xl min-h-[44px]">
                @for (opt of formStorages(); track opt; let i = $index) {
                  <span class="flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200
                               text-gray-700 text-sm rounded-lg">
                    {{ opt }}
                    <button type="button" (click)="removeStorage(i)"
                            class="text-gray-400 hover:text-gray-700 leading-none ml-0.5">×</button>
                  </span>
                }
                <input
                  type="text"
                  [value]="storageInput()"
                  (input)="storageInput.set($any($event.target).value)"
                  (keydown)="onTagKey($event, 'storage')"
                  (blur)="commitTag('storage')"
                  placeholder="Escribir y Enter…"
                  class="flex-1 min-w-[120px] bg-transparent text-sm outline-none px-1 py-0.5"/>
              </div>
              <p class="mt-1 text-xs text-gray-400">ej. 128GB, 256GB, 512GB</p>
            </div>

            <!-- Activo -->
            <div class="flex items-center gap-3 py-1">
              <button type="button"
                      (click)="form.get('is_active')!.setValue(!form.get('is_active')!.value)"
                      class="relative inline-flex h-6 w-11 rounded-full transition-colors duration-200
                             focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                      [class]="form.get('is_active')!.value ? 'bg-black' : 'bg-gray-200'">
                <span class="inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 mt-0.5"
                      [class]="form.get('is_active')!.value ? 'translate-x-5' : 'translate-x-0.5'"></span>
              </button>
              <label class="text-sm font-medium text-gray-700">
                {{ form.get('is_active')!.value ? 'Activo (visible en vitrina)' : 'Inactivo (oculto)' }}
              </label>
            </div>

            <!-- Toast de éxito -->
            @if (savedMsg()) {
              <div class="flex items-center gap-2 text-sm text-green-600
                          bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
                Cambios guardados correctamente.
              </div>
            }

            <!-- Botones -->
            <div class="flex gap-3 pt-2">
              <button type="button" (click)="closeModal()"
                      class="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium
                             text-gray-600 hover:bg-gray-50 transition-colors min-h-[44px]">
                Cancelar
              </button>
              <button type="submit"
                      [disabled]="saving() || form.invalid"
                      class="flex-1 py-2.5 rounded-xl bg-black text-white text-sm font-medium
                             hover:bg-gray-800 disabled:opacity-40 transition-colors min-h-[44px]">
                {{ saving() ? 'Guardando…' : (editing() ? 'Guardar cambios' : 'Crear producto') }}
              </button>
            </div>
          </form>

          <!-- ── Gestión de imágenes (solo en edición) ── -->
          @if (editing(); as product) {
            <div class="px-5 sm:px-7 pb-6 sm:pb-7 border-t border-gray-100 pt-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-semibold text-gray-900">Fotos</h3>
                <label class="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200
                              text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors
                              cursor-pointer min-h-[36px]"
                       [class.opacity-40]="uploading()">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                  </svg>
                  {{ uploading() ? 'Subiendo…' : 'Agregar foto' }}
                  <input #fileInput type="file" accept="image/jpeg,image/png,image/webp"
                         multiple class="hidden" [disabled]="uploading()"
                         (change)="onFileSelect($event, product)"/>
                </label>
              </div>

              @if (product.images.length === 0) {
                <p class="text-sm text-gray-400 text-center py-6 bg-gray-50 rounded-xl">
                  Sin fotos. La primera imagen subida será la principal.
                </p>
              } @else {
                <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  @for (img of product.images; track img.id) {
                    <div class="relative group/img aspect-square rounded-xl overflow-hidden bg-gray-100">
                      <img [src]="img.url" [alt]="'Foto ' + img.order"
                           class="w-full h-full object-contain p-1"/>

                      @if (img.is_primary) {
                        <span class="absolute top-1 left-1 text-[10px] font-bold bg-black text-white
                                     px-1.5 py-0.5 rounded-full leading-none">P</span>
                      }

                      <button (click)="removeImage(img, product)"
                              [disabled]="deletingImage() === img.id"
                              class="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white
                                     opacity-0 group-hover/img:opacity-100 transition-opacity
                                     flex items-center justify-center disabled:opacity-40">
                        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  }
                </div>
                <p class="mt-2 text-xs text-gray-400">La primera imagen (P) es la principal en la vitrina.</p>
              }
            </div>
          }

        </div>
      </div>
    }
  `,
})
export class ProductsComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly platform = inject(PLATFORM_ID);

  readonly products = signal<Product[]>([]);
  readonly usdRate = signal(1000);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly savedMsg = signal(false);
  readonly deleting = signal<number | null>(null);
  readonly showModal = signal(false);
  readonly editing = signal<Product | null>(null);
  readonly uploading = signal(false);
  readonly deletingImage = signal<number | null>(null);

  readonly formColors = signal<string[]>([]);
  readonly formStorages = signal<string[]>([]);
  readonly colorInput = signal('');
  readonly storageInput = signal('');

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', Validators.maxLength(2000)],
    price: [null as number | null, [Validators.required, Validators.min(0), Validators.max(99_999_999)]],
    stock: [0, [Validators.required, Validators.min(0), Validators.max(99_999)]],
    is_active: [true],
    is_sealed: [false],
    battery_health: [null as number | null, [Validators.min(1), Validators.max(100)]],
  }, {
    validators: (group: AbstractControl) => {
      if (!group.get('is_sealed')?.value && !group.get('battery_health')?.value) {
        return { batteryRequired: true };
      }
      return null;
    },
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platform)) return;
    forkJoin({
      products: this.productService.list(false),
      config: this.http.get<{ usd_rate: number }>('/api/v1/config'),
    }).subscribe({
      next: ({ products, config }) => {
        this.products.set(products);
        this.usdRate.set(Number(config.usd_rate));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private _showSaved(): void {
    this.savedMsg.set(true);
    setTimeout(() => this.savedMsg.set(false), 3000);
  }

  setSealed(sealed: boolean): void {
    this.form.controls.is_sealed.setValue(sealed);
    if (sealed) this.form.controls.battery_health.setValue(null);
  }

  openCreate(): void {
    this.editing.set(null);
    this.formColors.set([]);
    this.formStorages.set([]);
    this.colorInput.set('');
    this.storageInput.set('');
    this.form.reset({
      name: '',
      description: '',
      price: null as number | null,
      stock: 0,
      is_active: true,
      is_sealed: false,
      battery_health: null as number | null,
    });
    this.showModal.set(true);
  }

  openEdit(product: Product): void {
    this.editing.set({ ...product, images: [...product.images] });
    this.formColors.set([...product.colors]);
    this.formStorages.set([...product.storage_options]);
    this.colorInput.set('');
    this.storageInput.set('');
    this.form.patchValue({
      name: product.name,
      description: product.description ?? '',
      price: Math.round(product.price / this.usdRate()),
      stock: product.stock,
      is_active: product.is_active,
      is_sealed: product.is_sealed,
      battery_health: product.battery_health,
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editing.set(null);
  }

  save(): void {
    if (this.form.invalid) {
      // Marcar battery_health como touched para mostrar el error
      this.form.controls.battery_health.markAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const payload = {
      name: raw.name!,
      description: raw.description || null,
      price: Math.round(raw.price! * this.usdRate()),
      stock: raw.stock!,
      is_active: raw.is_active!,
      colors: this.formColors(),
      storage_options: this.formStorages(),
      is_sealed: raw.is_sealed ?? false,
      battery_health: raw.is_sealed ? null : raw.battery_health,
    };

    this.saving.set(true);
    const current = this.editing();

    const obs = current
      ? this.productService.update(current.id, payload)
      : this.productService.create(payload);

    obs.subscribe({
      next: updated => {
        if (current) {
          this.editing.set({ ...updated, images: updated.images });
          this.products.update(list => list.map(p => p.id === updated.id ? updated : p));
        } else {
          this.products.update(list => [...list, updated]);
          this.closeModal();
        }
        this.saving.set(false);
        this._showSaved();
      },
      error: () => this.saving.set(false),
    });
  }

  remove(product: Product): void {
    if (!confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return;
    this.deleting.set(product.id);
    this.productService.delete(product.id).subscribe({
      next: () => {
        this.products.update(list => list.filter(p => p.id !== product.id));
        this.deleting.set(null);
      },
      error: () => this.deleting.set(null),
    });
  }

  toggleActive(product: Product): void {
    this.productService.update(product.id, { is_active: !product.is_active }).subscribe(updated => {
      this.products.update(list => list.map(p => p.id === updated.id ? updated : p));
      const current = this.editing();
      if (current?.id === updated.id) this.editing.set({ ...current, is_active: updated.is_active });
    });
  }

  // ── Tag inputs ────────────────────────────────────────────────────────────

  onTagKey(event: KeyboardEvent, type: 'color' | 'storage'): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.commitTag(type);
    } else if (event.key === 'Backspace') {
      const val = type === 'color' ? this.colorInput() : this.storageInput();
      if (!val) {
        type === 'color'
          ? this.formColors.update(l => l.slice(0, -1))
          : this.formStorages.update(l => l.slice(0, -1));
      }
    }
  }

  commitTag(type: 'color' | 'storage'): void {
    const raw = type === 'color' ? this.colorInput() : this.storageInput();
    const value = raw.trim().replace(/,$/, '');
    if (!value) return;
    if (type === 'color') {
      if (!this.formColors().includes(value)) this.formColors.update(l => [...l, value]);
      this.colorInput.set('');
    } else {
      if (!this.formStorages().includes(value)) this.formStorages.update(l => [...l, value]);
      this.storageInput.set('');
    }
  }

  removeColor(index: number): void {
    this.formColors.update(l => l.filter((_, i) => i !== index));
  }

  removeStorage(index: number): void {
    this.formStorages.update(l => l.filter((_, i) => i !== index));
  }

  // ── Image management ──────────────────────────────────────────────────────

  async onFileSelect(event: Event, product: Product): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;

    this.uploading.set(true);
    try {
      for (const file of files) {
        await firstValueFrom(this.productService.uploadImage(product.id, file));
      }
      const updated = await firstValueFrom(this.productService.get(product.id));
      this.editing.set(updated);
      this.products.update(list => list.map(p => p.id === updated.id ? updated : p));
    } finally {
      this.uploading.set(false);
      input.value = '';
    }
  }

  async removeImage(img: ProductImage, product: Product): Promise<void> {
    this.deletingImage.set(img.id);
    try {
      await firstValueFrom(this.productService.deleteImage(product.id, img.id));
      const updated = await firstValueFrom(this.productService.get(product.id));
      this.editing.set(updated);
      this.products.update(list => list.map(p => p.id === updated.id ? updated : p));
    } finally {
      this.deletingImage.set(null);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  primaryImage(product: Product): ProductImage | undefined {
    return product.images.find(i => i.is_primary) ?? product.images[0];
  }

  formatPrice(price: number): string {
    const usd = Math.round(Number(price) / this.usdRate());
    return `USD ${usd.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
  }
}
