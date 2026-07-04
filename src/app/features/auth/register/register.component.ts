import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  GoogleSigninButtonModule,
  SocialLoginModule,
} from '@abacritt/angularx-social-login';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { createUserWithEmailAndPassword, getAuth } from '@angular/fire/auth';
import { UserService } from '../../../services/user.service';
import { PhoneMaskDirective } from '../../../shared/directive/phone-mask.directive';

@Component({
  selector: 'app-auth-register',
  standalone: true,
  imports: [
    CommonModule,
    GoogleSigninButtonModule,
    SocialLoginModule,
    ReactiveFormsModule,
    PhoneMaskDirective
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class AuthRegisterComponent {
  private readonly router: Router;
  private readonly phonePattern = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
  isPasswordVisible = false;
  auth = getAuth();
  errorMessage: string | null = null;

  registerForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
    birthDay: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, this.minimumAgeValidator(13)],
    }),
    phone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(this.phonePattern)],
    }),
    income: new FormControl('', {
      validators: [Validators.min(0)],
    }),
  });

  constructor(
    router: Router,
    private userService: UserService,
  ) {
    this.router = router;
  }

  changePasswordVisibility() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }

  private minimumAgeValidator(minimumAge: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value as string | null;

      if (!value) {
        return null;
      }

      const birthDate = new Date(value);

      if (Number.isNaN(birthDate.getTime())) {
        return { invalidDate: true };
      }

      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      return age >= minimumAge ? null : { minimumAge: true };
    };
  }

  async onSubmit() {
    this.errorMessage = null;

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const formValue = this.registerForm.getRawValue();

    const userCredentials = await createUserWithEmailAndPassword(
      this.auth,
      formValue.email,
      formValue.password,
    );

    const payload = {
      name: formValue.name,
      email: formValue.email,
      birthDay: new Date(formValue.birthDay),
      phone: Number(formValue.phone.replace(/\D/g, '')),
      income: formValue.income ? Number(formValue.income) : undefined,
    };

    try {
      await this.userService.register(userCredentials.user.uid, payload);
      this.router.navigate(['/dashboard']);
    } catch (error) {
      this.errorMessage = 'Nao foi possivel concluir o cadastro. Tente novamente.';
    }
  }
}
