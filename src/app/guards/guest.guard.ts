import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../services/user.service';

export const guestGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);
  const userService = inject(UserService);

  await auth.authStateReady();

  if (auth.currentUser) {
    const isComplete = await userService.isProfileComplete(
      auth.currentUser.uid,
    );

    if (!isComplete) {
      return router.createUrlTree(['/settings'], {
        queryParams: { completeProfile: '1' },
      });
    }

    return router.createUrlTree(['/home']);
  }

  return true;
};
