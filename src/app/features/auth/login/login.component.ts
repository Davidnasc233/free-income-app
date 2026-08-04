import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  GoogleSigninButtonModule,
  SocialLoginModule,
} from '@abacritt/angularx-social-login';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  Auth,
  GoogleAuthProvider,
  browserLocalPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  setPersistence,
} from '@angular/fire/auth';
import { FirebaseAuthErrorComponent } from '../../../shared/components/firebase-auth-error/firebase-auth-error.component';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-auth-login',
  standalone: true,
  imports: [
    CommonModule,
    GoogleSigninButtonModule,
    SocialLoginModule,
    ReactiveFormsModule,
    FirebaseAuthErrorComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class AuthLoginComponent {
  private readonly maxFailedAttempts = 5;
  private readonly lockDurationMs = 60_000;
  private readonly router: Router;
  private readonly auth: Auth;
  isPasswordVisible = false;
  isGoogleLoading = false;
  authError: unknown = null;
  failedAttempts = 0;
  lockedUntil = 0;

  loginForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
  });

  constructor(
    router: Router,
    auth: Auth,
    private readonly userService: UserService,
  ) {
    this.router = router;
    this.auth = auth;
  }

  changePasswordVisibility() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  goToRegister() {
    this.router.navigate(['/auth/register']);
  }

  goToForgotPassword(): void {
    void this.router.navigate(['/auth/forgot-password']);
  }

  get isLocked(): boolean {
    return Date.now() < this.lockedUntil;
  }

  get lockRemainingSeconds(): number {
    if (!this.isLocked) {
      return 0;
    }

    return Math.max(1, Math.ceil((this.lockedUntil - Date.now()) / 1000));
  }

  async onSubmit() {
    if (this.isLocked) {
      this.authError = `Muitas tentativas. Aguarde ${this.lockRemainingSeconds}s para tentar novamente.`;
      return;
    }

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.getRawValue();

    try {
      this.authError = null;
      await setPersistence(this.auth, browserLocalPersistence);
      const credentials = await signInWithEmailAndPassword(
        this.auth,
        email,
        password,
      );

      this.failedAttempts = 0;
      this.lockedUntil = 0;

      await this.redirectAfterAuthentication(credentials.user.uid);
    } catch (error) {
      this.authError = error;
      this.failedAttempts++;
      this.applyLockIfNeeded(error);
    }
  }

  async onGoogleLogin(): Promise<void> {
    if (this.isLocked) {
      this.authError = `Muitas tentativas. Aguarde ${this.lockRemainingSeconds}s para tentar novamente.`;
      return;
    }

    if (this.isGoogleLoading) {
      return;
    }

    this.authError = null;
    this.isGoogleLoading = true;

    try {
      await setPersistence(this.auth, browserLocalPersistence);
      const credentials = await signInWithPopup(
        this.auth,
        new GoogleAuthProvider(),
      );

      this.failedAttempts = 0;
      this.lockedUntil = 0;
      await this.userService.ensureGoogleUserProfile(credentials.user);
      await this.redirectAfterAuthentication(credentials.user.uid);
    } catch (error) {
      this.authError = error;
      this.failedAttempts++;
      this.applyLockIfNeeded(error);
    } finally {
      this.isGoogleLoading = false;
    }
  }

  private async redirectAfterAuthentication(uid: string): Promise<void> {
    const profileComplete = await this.userService.isProfileComplete(uid);

    if (profileComplete) {
      await this.router.navigate(['/home']);
      return;
    }

    await this.router.navigate(['/settings'], {
      queryParams: { completeProfile: '1' },
    });
  }

  private applyLockIfNeeded(error: unknown): void {
    const code = this.extractAuthErrorCode(error);
    const reachedMaxAttempts = this.failedAttempts >= this.maxFailedAttempts;

    if (code === 'auth/too-many-requests' || reachedMaxAttempts) {
      this.lockedUntil = Date.now() + this.lockDurationMs;
      this.authError = `Muitas tentativas. Aguarde ${this.lockRemainingSeconds}s para tentar novamente.`;
      this.failedAttempts = 0;
    }
  }

  private extractAuthErrorCode(error: unknown): string | null {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof (error as { code: unknown }).code === 'string'
    ) {
      return (error as { code: string }).code;
    }

    return null;
  }
}
