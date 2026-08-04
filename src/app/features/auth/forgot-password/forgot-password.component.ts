import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Auth, sendPasswordResetEmail } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { FirebaseAuthErrorComponent } from '../../../shared/components/firebase-auth-error/firebase-auth-error.component';

@Component({
  selector: 'app-auth-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FirebaseAuthErrorComponent],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class AuthForgotPasswordComponent {
  authError: unknown = null;
  isSubmitting = false;
  isSuccess = false;

  forgotPasswordForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  constructor(
    private readonly auth: Auth,
    private readonly router: Router,
  ) {}

  async onSubmit(): Promise<void> {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.authError = null;
    this.isSubmitting = true;

    try {
      const { email } = this.forgotPasswordForm.getRawValue();
      await sendPasswordResetEmail(this.auth, email.trim());
      this.isSuccess = true;
    } catch (error) {
      this.authError = error;
      this.isSuccess = false;
    } finally {
      this.isSubmitting = false;
    }
  }

  goToLogin(): void {
    void this.router.navigate(['/auth/login']);
  }
}
