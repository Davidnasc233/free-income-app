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
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth as firebaseAuth } from '../../../firebase.config';

@Component({
  selector: 'app-auth-login',
  standalone: true,
  imports: [
    CommonModule,
    GoogleSigninButtonModule,
    SocialLoginModule,
    ReactiveFormsModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class AuthLoginComponent {
  private readonly router: Router;
  private auth = firebaseAuth;
  isPasswordVisible = false;
  errorMessage: string | null = null;

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

  constructor(router: Router) {
    this.router = router;
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
      this.errorMessage = null;
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password,
      );

      console.log(userCredential);
      this.router.navigate(['/dashboard']);
    } catch (error) {
      throw error;
    }
  }
}
