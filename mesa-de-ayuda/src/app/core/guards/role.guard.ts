import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Rol } from '../models';

export function roleGuard(...roles: Rol[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const toast = inject(ToastService);

    if (auth.hasRole(...roles)) {
      return true;
    }

    toast.warning('No tiene permisos para acceder a esta sección.');
    router.navigate(['/dashboard']);
    return false;
  };
}
