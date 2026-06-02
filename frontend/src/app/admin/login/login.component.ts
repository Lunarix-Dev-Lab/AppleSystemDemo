import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div class="w-full max-w-sm">

        <div class="text-center mb-8">
          <p class="text-sm text-gray-400">Panel de administración</p>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 class="text-xl font-semibold text-gray-900 mb-6">Iniciar sesión</h1>

          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">

            <!-- Email -->
            <div>
              <label for="login-email" class="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                id="login-email"
                name="email"
                type="email"
                formControlName="email"
                autocomplete="email"
                placeholder="admin@tienda.com"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm
                       placeholder:text-gray-300
                       focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
                       transition"
              />
            </div>

            <!-- Contraseña con toggle -->
            <div>
              <label for="login-password" class="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
              <div class="relative">
                <input
                  id="login-password"
                  name="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  autocomplete="current-password"
                  placeholder="••••••••"
                  class="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-200 text-sm
                         placeholder:text-gray-300
                         focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
                         transition"
                />
                <button
                  type="button"
                  (click)="showPassword.set(!showPassword())"
                  class="absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-400 hover:text-gray-600 transition"
                  [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Ver contraseña'"
                >
                  @if (showPassword()) {
                    <!-- Eye-off -->
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4.5 h-4.5" viewBox="0 0 24 24"
                         fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8
                               a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8
                               a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  } @else {
                    <!-- Eye -->
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4.5 h-4.5" viewBox="0 0 24 24"
                         fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  }
                </button>
              </div>
            </div>

            @if (error()) {
              <p class="text-sm text-red-500 text-center pt-1">{{ error() }}</p>
            }

            <button
              type="submit"
              [disabled]="loading() || form.invalid"
              class="w-full py-2.5 mt-2 bg-black text-white text-sm font-medium
                     rounded-xl hover:bg-gray-800 disabled:opacity-40 transition"
            >
              {{ loading() ? 'Ingresando…' : 'Ingresar' }}
            </button>
          </form>
        </div>

      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly showPassword = signal(false);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');

    const { email, password } = this.form.getRawValue();
    this.auth.login({ email: email!, password: password! }).subscribe({
      next: () => this.router.navigate(['/admin']),
      error: () => {
        this.error.set('Email o contraseña incorrectos');
        this.loading.set(false);
      },
    });
  }
}
