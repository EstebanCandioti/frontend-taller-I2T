import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.currentUser && !auth.isTokenExpired()) {
    return true;
  }

  auth.logout();
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};
