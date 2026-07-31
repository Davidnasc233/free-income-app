import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);

  await auth.authStateReady();

  if (auth.currentUser) {
    return true;
  }

  return router.createUrlTree(['/auth/login']);
};
