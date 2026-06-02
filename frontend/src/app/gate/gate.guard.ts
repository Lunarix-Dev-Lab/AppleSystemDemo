import { PLATFORM_ID, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

import { THEME } from '../../theme.config';

export const gateGuard: CanActivateFn = () => {
  const password = THEME.gate.password;

  // Gate deshabilitado → acceso libre
  if (!password) return true;

  // En SSR no hay sessionStorage → dejar pasar (el browser lo chequeará)
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return true;

  if (sessionStorage.getItem('sa_gate') === password) return true;

  return inject(Router).createUrlTree(['/acceso']);
};
