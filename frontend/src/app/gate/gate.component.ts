import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { THEME } from '../../theme.config';

@Component({
  selector: 'app-gate',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6">

      <div class="w-full max-w-sm">

        <!-- Phone icon -->
        <div class="flex justify-center mb-8">
          <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10
                      flex items-center justify-center">
            <svg class="w-8 h-8 text-white/60" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
          </div>
        </div>

        <!-- Title -->
        <div class="text-center mb-8">
          <h1 class="text-2xl font-semibold text-white tracking-tight">{{ storeName }}</h1>
          <p class="mt-2 text-sm text-white/40">Vista previa privada</p>
        </div>

        <!-- Form -->
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="space-y-3">
            <div>
              <label for="gate-password" class="sr-only">Contraseña de acceso</label>
              <input
                id="gate-password"
                name="gate-password"
                formControlName="password"
                type="password"
                autocomplete="current-password"
                placeholder="Contraseña de acceso"
                class="w-full px-4 py-3 rounded-xl text-sm
                       bg-white/5 border text-white placeholder:text-white/30
                       focus:outline-none focus:ring-2 focus:ring-white/30 transition"
                [class.border-red-500]="error()"
                [class.border-white-10]="!error()"
                [style.borderColor]="error() ? 'rgb(239 68 68 / 0.5)' : 'rgb(255 255 255 / 0.1)'"
              />
              @if (error()) {
                <p class="mt-2 text-xs text-red-400 text-center">
                  Contraseña incorrecta. Intentá de nuevo.
                </p>
              }
            </div>

            <button
              type="submit"
              [disabled]="form.invalid"
              class="w-full py-3 rounded-xl text-sm font-medium transition
                     bg-white text-gray-900 hover:bg-gray-100
                     disabled:opacity-40 disabled:cursor-not-allowed
                     min-h-[48px]"
            >
              Ingresar
            </button>
          </div>
        </form>

        <!-- Footer -->
        <p class="mt-10 text-center text-xs text-white/20">
          Desarrollado por Lunarix Lab
        </p>

      </div>
    </div>
  `,
})
export class GateComponent {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly storeName = THEME.store.name;
  readonly error = signal(false);

  readonly form = this.fb.group({
    password: ['', Validators.required],
  });

  submit(): void {
    const entered = this.form.getRawValue().password ?? '';
    if (entered === THEME.gate.password) {
      sessionStorage.setItem('sa_gate', entered);
      this.router.navigate(['/']);
    } else {
      this.error.set(true);
      this.form.reset();
    }
  }
}
