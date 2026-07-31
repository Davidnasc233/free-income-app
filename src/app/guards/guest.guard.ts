import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { CanActivateFn, Router } from '@angular/router';

export const guestGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);

  await auth.authStateReady();

  if (auth.currentUser) {
    return router.createUrlTree(['/home']);
  }

  return true;
};
