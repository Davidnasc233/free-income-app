import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../services/user.service';

export const authGuard: CanActivateFn = async (_, state) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const userService = inject(UserService);

  await auth.authStateReady();

  const currentUser = auth.currentUser;

  if (!currentUser) {
    return router.createUrlTree(['/auth/login']);
  }

  const goingToSettings = state.url.startsWith('/settings');

  if (goingToSettings) {
    return true;
  }

  const isComplete = await userService.isProfileComplete(currentUser.uid);

  if (isComplete) {
    return true;
  }

  return router.createUrlTree(['/settings'], {
    queryParams: { completeProfile: '1' },
  });
};
