import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  GoogleSigninButtonModule,
  SocialLoginModule,
} from '@abacritt/angularx-social-login';

@Component({
  selector: 'app-auth-register',
  standalone: true,
  imports: [CommonModule, GoogleSigninButtonModule, SocialLoginModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class AuthRegisterComponent {
  private readonly router: Router;
  isPasswordVisible = false;

  constructor(router: Router) {
    this.router = router;
  }

  changePasswordVisibility() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }

  register() {
    // TODO: conectar com fluxo real de cadastro.
  }
}
