import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

export type ReauthMode = 'password' | 'google' | 'both';

export interface ReauthModalData {
  mode: ReauthMode;
  title?: string;
  description?: string;
}

export type ReauthModalResult =
  | { method: 'password'; password: string }
  | { method: 'google' };

@Component({
  selector: 'app-reauth-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reauth-modal.component.html',
  styleUrl: './reauth-modal.component.css',
})
export class ReauthModalComponent {
  private readonly activeModal = inject(NgbActiveModal, { optional: true });

  mode: ReauthMode = 'password';
  title = 'Confirme sua identidade';
  description =
    'Por segurança, confirme sua senha antes de alterar o e-mail.';
  submitError: string | null = null;

  form = new FormGroup({
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
  });

  configure(data: ReauthModalData): void {
    this.mode = data.mode;
    this.title = data.title ?? this.title;
    this.description = data.description ?? this.description;
  }

  get showPassword(): boolean {
    return this.mode === 'password' || this.mode === 'both';
  }

  get showGoogle(): boolean {
    return this.mode === 'google' || this.mode === 'both';
  }

  closeModal(): void {
    this.activeModal?.dismiss('cancel');
  }

  confirmPassword(): void {
    this.submitError = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.activeModal?.close({
      method: 'password',
      password: this.form.controls.password.value,
    } satisfies ReauthModalResult);
  }

  confirmGoogle(): void {
    this.activeModal?.close({
      method: 'google',
    } satisfies ReauthModalResult);
  }
}
