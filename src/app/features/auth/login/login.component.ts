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
  private readonly router: Router;
  private readonly auth: Auth;
  isPasswordVisible = false;
  isGoogleLoading = false;
  authError: unknown = null;

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

  async onSubmit() {
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

      await this.redirectAfterAuthentication(credentials.user.uid);
    } catch (error) {
      this.authError = error;
    }
  }

  async onGoogleLogin(): Promise<void> {
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

      await this.userService.ensureGoogleUserProfile(credentials.user);
      await this.redirectAfterAuthentication(credentials.user.uid);
    } catch (error) {
      this.authError = error;
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
}
