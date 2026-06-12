import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface SlotConfig {
  id: number;
  slot_duration_minutes: number;
  max_per_slot: number;
  max_advance_days: number;
  display_currency: 'ARS' | 'USD';
  usd_rate: number;
}

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-4 sm:p-8 max-w-xl">

      <div class="mb-8">
        <h1 class="text-2xl font-semibold text-gray-900">Configuración de turnos</h1>
        <p class="text-sm text-gray-400 mt-1">
          Afecta la disponibilidad de nuevas reservas.
        </p>
      </div>

      @if (loading()) {
        <div class="space-y-4">
          @for (_ of [1,2,3,4,5]; track $index) {
            <div class="h-20 rounded-2xl bg-gray-100 animate-pulse"></div>
          }
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="save()" class="space-y-5">

          <!-- Duración del turno -->
          <div class="bg-white rounded-2xl border border-gray-100 p-5">
            <label for="duration" class="block text-sm font-semibold text-gray-900 mb-0.5">
              Duración del turno
            </label>
            <p class="text-xs text-gray-400 mb-3">Tiempo que dura cada franja de atención.</p>
            <div class="flex items-center gap-3">
              <input
                id="duration"
                name="slot_duration_minutes"
                formControlName="slot_duration_minutes"
                type="number"
                min="15"
                max="240"
                step="15"
                (keydown)="$event.key === '.' || $event.key === ',' ? $event.preventDefault() : null"
                class="w-28 px-4 py-2.5 rounded-xl border border-gray-200 text-sm
                       focus:outline-none focus:ring-2 focus:ring-black transition"
              />
              <span class="text-sm text-gray-500">minutos</span>
            </div>
            <p class="mt-2 text-xs text-gray-400">Mínimo: 15 min · Incrementos de 15 recomendados</p>
          </div>

          <!-- Máx por turno -->
          <div class="bg-white rounded-2xl border border-gray-100 p-5">
            <label for="max_per_slot" class="block text-sm font-semibold text-gray-900 mb-0.5">
              Personas por turno
            </label>
            <p class="text-xs text-gray-400 mb-3">Cuántas reservas se aceptan en el mismo horario.</p>
            <div class="flex items-center gap-3">
              <input
                id="max_per_slot"
                name="max_per_slot"
                formControlName="max_per_slot"
                type="number"
                min="1"
                max="20"
                step="1"
                (keydown)="$event.key === '.' || $event.key === ',' ? $event.preventDefault() : null"
                class="w-28 px-4 py-2.5 rounded-xl border border-gray-200 text-sm
                       focus:outline-none focus:ring-2 focus:ring-black transition"
              />
              <span class="text-sm text-gray-500">persona(s) máximo</span>
            </div>
          </div>

          <!-- Anticipación -->
          <div class="bg-white rounded-2xl border border-gray-100 p-5">
            <label for="max_advance" class="block text-sm font-semibold text-gray-900 mb-0.5">
              Anticipación máxima
            </label>
            <p class="text-xs text-gray-400 mb-3">Con cuántos días de anticipación se puede reservar.</p>
            <div class="flex items-center gap-3">
              <input
                id="max_advance"
                name="max_advance_days"
                formControlName="max_advance_days"
                type="number"
                min="1"
                max="365"
                step="1"
                (keydown)="$event.key === '.' || $event.key === ',' ? $event.preventDefault() : null"
                class="w-28 px-4 py-2.5 rounded-xl border border-gray-200 text-sm
                       focus:outline-none focus:ring-2 focus:ring-black transition"
              />
              <span class="text-sm text-gray-500">días de anticipación</span>
            </div>
          </div>

          <!-- Tipo de cambio -->
          <div class="bg-white rounded-2xl border border-gray-100 p-5">
            <p class="text-sm font-semibold text-gray-900 mb-0.5">Tipo de cambio</p>
            <p class="text-xs text-gray-400 mb-3">Usado para convertir precios ARS ↔ USD en el catálogo.</p>
            <div class="flex items-center gap-3">
              <span class="text-sm text-gray-500 shrink-0">1 USD =</span>
              <input
                formControlName="usd_rate"
                type="number"
                min="1"
                step="1"
                class="w-36 px-4 py-2.5 rounded-xl border border-gray-200 text-sm
                       focus:outline-none focus:ring-2 focus:ring-black transition"
              />
              <span class="text-sm text-gray-500 shrink-0">ARS</span>
            </div>
          </div>

          <!-- Moneda del catálogo -->
          <div class="bg-white rounded-2xl border border-gray-100 p-5">
            <p class="text-sm font-semibold text-gray-900 mb-0.5">Moneda del catálogo</p>
            <p class="text-xs text-gray-400 mb-3">
              Los clientes verán los precios en esta moneda en el catálogo público.
            </p>
            <div class="flex gap-2">
              <button
                type="button"
                (click)="form.patchValue({ display_currency: 'ARS' })"
                class="flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all min-h-[44px]"
                [class]="form.controls.display_currency.value === 'ARS'
                  ? 'border-black bg-black text-white'
                  : 'border-gray-200 text-gray-500 hover:border-gray-400'"
              >
                $ Pesos (ARS)
              </button>
              <button
                type="button"
                (click)="form.patchValue({ display_currency: 'USD' })"
                class="flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all min-h-[44px]"
                [class]="form.controls.display_currency.value === 'USD'
                  ? 'border-black bg-black text-white'
                  : 'border-gray-200 text-gray-500 hover:border-gray-400'"
              >
                USD Dólares
              </button>
            </div>
            <p class="mt-2 text-xs text-gray-400">
              El tipo de cambio se configura en
              <code class="font-mono bg-gray-100 px-1 rounded">theme.config.ts › locale.usdRate</code>
            </p>
          </div>

          @if (successMsg()) {
            <div class="flex items-center gap-2 text-sm text-green-600
                        bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
              Configuración guardada correctamente.
            </div>
          }

          @if (errorMsg()) {
            <p class="text-sm text-red-400 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {{ errorMsg() }}
            </p>
          }

          <button
            type="submit"
            [disabled]="saving() || form.invalid"
            class="w-full py-3 bg-black text-white text-sm font-medium rounded-xl
                   hover:bg-gray-800 disabled:opacity-40 transition-colors min-h-[48px]"
          >
            {{ saving() ? 'Guardando…' : 'Guardar configuración' }}
          </button>

        </form>
      }
    </div>
  `,
})
export class ConfigComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly platform = inject(PLATFORM_ID);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly successMsg = signal(false);
  readonly errorMsg = signal('');

  readonly form = this.fb.group({
    slot_duration_minutes: [30, [Validators.required, Validators.min(15), Validators.max(240)]],
    max_per_slot: [1, [Validators.required, Validators.min(1), Validators.max(50)]],
    max_advance_days: [30, [Validators.required, Validators.min(1), Validators.max(365)]],
    usd_rate: [1000, [Validators.required, Validators.min(1), Validators.max(9_999_999)]],
    display_currency: ['ARS' as 'ARS' | 'USD'],
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platform)) return;
    this.http.get<SlotConfig>('/api/v1/config').subscribe({
      next: c => {
        this.form.patchValue({
          slot_duration_minutes: c.slot_duration_minutes,
          max_per_slot: c.max_per_slot,
          max_advance_days: c.max_advance_days,
          usd_rate: c.usd_rate,
          display_currency: c.display_currency,
        });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.successMsg.set(false);
    this.errorMsg.set('');

    const raw = this.form.getRawValue();
    const payload = {
      slot_duration_minutes: raw.slot_duration_minutes!,
      max_per_slot: raw.max_per_slot!,
      max_advance_days: raw.max_advance_days!,
      usd_rate: raw.usd_rate!,
      display_currency: (raw.display_currency ?? 'ARS') as 'ARS' | 'USD',
    };

    this.http.put<SlotConfig>('/api/v1/config', payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.successMsg.set(true);
        setTimeout(() => this.successMsg.set(false), 3000);
      },
      error: err => {
        this.saving.set(false);
        this.errorMsg.set(err.error?.detail ?? 'Error al guardar');
        setTimeout(() => this.errorMsg.set(''), 4000);
      },
    });
  }
}
