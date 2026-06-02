import { ChangeDetectionStrategy, Component, PLATFORM_ID, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

import { THEME } from '../theme.config';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<router-outlet />`,
})
export class AppComponent {
  constructor() {
    // Inyectar las CSS custom properties del tema en :root (solo en browser)
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      const root = document.documentElement;
      root.style.setProperty('--color-primary', THEME.colors.primary);
      root.style.setProperty('--color-accent', THEME.colors.accent);
    }
  }
}
