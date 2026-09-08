import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const gestorGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.autenticado() && authService.role() === 'GESTOR') {
    return true;
  }

  router.navigateByUrl('/dashboard');
  return false;
};
