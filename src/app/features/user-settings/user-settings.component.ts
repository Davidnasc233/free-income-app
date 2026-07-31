import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { ConfirmationModalService } from '../../services/confirmation-modal.service';
import { ReauthModalService } from '../../services/reauth-modal.service';
import { ToastService } from '../../services/toast.service';
import { UserService } from '../../services/user.service';
import { PageStateComponent } from '../../shared/components/page-state/page-state.component';
import { PhoneMaskDirective } from '../../shared/directive/phone-mask.directive';
import { User } from '../../shared/interfaces/users.interface';
import { ReauthMode } from '../../shared/components/reauth-modal/reauth-modal.component';

@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PhoneMaskDirective,
    PageStateComponent,
  ],
  templateUrl: './user-settings.component.html',
  styleUrl: './user-settings.component.css',
})
export class UserSettingsComponent implements OnInit {
  private readonly phonePattern = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;

  user: User | null = null;
  isLoading = true;
  isSaving = false;
  loadError: string | null = null;

  settingsForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    birthDay: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, this.minimumAgeValidator(13)],
    }),
    phone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(this.phonePattern)],
    }),
    income: new FormControl<number | null>(null, {
      validators: [Validators.min(0)],
    }),
  });

  constructor(
    private readonly auth: Auth,
    private readonly userService: UserService,
    private readonly router: Router,
    private readonly toast: ToastService,
    private readonly confirmationModal: ConfirmationModalService,
    private readonly reauthModal: ReauthModalService,
  ) {}

  ngOnInit(): void {
    void this.loadCurrentUser();
  }

  async onSubmit(): Promise<void> {
    if (this.settingsForm.invalid) {
      this.settingsForm.markAllAsTouched();
      return;
    }

    await this.auth.authStateReady();
    const uid = this.auth.currentUser?.uid;

    if (!uid || !this.user) {
      this.toast.error('Sessão expirada. Faça login novamente.');
      return;
    }

    const formValue = this.settingsForm.getRawValue();
    const nextEmail = formValue.email.trim().toLowerCase();
    const emailChanged = this.user.email.trim().toLowerCase() !== nextEmail;

    if (emailChanged) {
      const confirmed = await this.confirmationModal.confirm({
        type: 'warning',
        title: 'Alterar e-mail',
        description:
          'Você precisará confirmar sua identidade. Continuar com a troca de e-mail?',
        confirmLabel: 'Continuar',
        cancelLabel: 'Cancelar',
      });

      if (!confirmed) {
        this.toast.info('Alteracao de e-mail cancelada.');
        return;
      }

      const reauthed = await this.ensureRecentLogin();
      if (!reauthed) {
        return;
      }
    }

    this.isSaving = true;

    try {
      await this.userService.updateProfile(uid, {
        name: formValue.name,
        email: formValue.email,
        birthDay: new Date(formValue.birthDay),
        phone: formValue.phone,
        income: formValue.income ?? 0,
      });

      await this.loadCurrentUser();
      this.toast.success('Perfil atualizado com sucesso.');
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);

      if (this.getErrorCode(error) === 'auth/requires-recent-login') {
        const reauthed = await this.ensureRecentLogin();
        if (reauthed) {
          try {
            await this.userService.updateProfile(uid, {
              name: formValue.name,
              email: formValue.email,
              birthDay: new Date(formValue.birthDay),
              phone: formValue.phone,
              income: formValue.income ?? 0,
            });
            await this.loadCurrentUser();
            this.toast.success('Perfil atualizado com sucesso.');
            return;
          } catch (retryError) {
            console.error('Erro ao salvar perfil após reauth:', retryError);
            this.toast.error(this.resolveSaveError(retryError));
            return;
          }
        }
        return;
      }

      this.toast.error(this.resolveSaveError(error));
    } finally {
      this.isSaving = false;
    }
  }

  goBack(): void {
    void this.router.navigateByUrl('/home');
  }

  private async ensureRecentLogin(): Promise<boolean> {
    const mode = this.resolveReauthMode();
    if (!mode) {
      this.toast.error(
        'Não foi possível confirmar sua identidade. Saia e entre novamente.',
      );
      return false;
    }

    const result = await this.reauthModal.prompt({
      mode,
      title: 'Confirme sua identidade',
      description:
        'Por segurança, confirme sua conta antes de alterar o e-mail.',
    });

    if (!result) {
      return false;
    }

    try {
      if (result.method === 'password') {
        await this.userService.reauthenticateWithPassword(result.password);
      } else {
        await this.userService.reauthenticateWithGoogle();
      }
      return true;
    } catch (error) {
      console.error('Falha na reautenticação:', error);
      this.toast.error(this.resolveReauthError(error));
      return false;
    }
  }

  private resolveReauthMode(): ReauthMode | null {
    const hasPassword = this.userService.hasPasswordProvider();
    const hasGoogle = this.userService.hasGoogleProvider();

    if (hasPassword && hasGoogle) {
      return 'both';
    }
    if (hasPassword) {
      return 'password';
    }
    if (hasGoogle) {
      return 'google';
    }
    return null;
  }

  private async loadCurrentUser(): Promise<void> {
    this.isLoading = true;
    this.loadError = null;

    try {
      await this.auth.authStateReady();
      const uid = this.auth.currentUser?.uid;

      if (!uid) {
        this.loadError = 'Usuário não autenticado.';
        return;
      }

      const userData = await this.userService.getUser(uid);

      if (!userData) {
        this.loadError = 'Perfil não encontrado.';
        return;
      }

      this.user = userData;
      this.settingsForm.patchValue({
        name: userData.name,
        email: userData.email,
        birthDay: this.toDateInputValue(userData.birthDay),
        phone: this.formatPhoneDisplay(userData.phone),
        income: userData.income ?? null,
      });
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      this.loadError = 'Não foi possível carregar suas configurações.';
    } finally {
      this.isLoading = false;
    }
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

  private toDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatPhoneDisplay(phone: string): string {
    let value = phone.replace(/\D/g, '').slice(0, 11);

    if (value.length > 10) {
      return value.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    }
    if (value.length > 6) {
      return value.replace(/^(\d{2})(\d{4})(\d{1,4})$/, '($1) $2-$3');
    }
    if (value.length > 2) {
      return value.replace(/^(\d{2})(\d{1,4})$/, '($1) $2');
    }
    if (value.length > 0) {
      return value.replace(/^(\d{1,2})$/, '($1');
    }
    return '';
  }

  private getErrorCode(error: unknown): string | null {
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

  private resolveSaveError(error: unknown): string {
    const code = this.getErrorCode(error);

    if (code === 'auth/requires-recent-login') {
      return 'É necessário confirmar sua identidade para alterar o e-mail.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'Este e-mail já está em uso por outra conta.';
    }
    if (code === 'auth/invalid-email') {
      return 'E-mail inválido.';
    }
    if (code === 'auth/operation-not-allowed') {
      return 'A alteração de e-mail não está disponível para este tipo de conta.';
    }

    return 'Não foi possível salvar as alterações. Tente novamente.';
  }

  private resolveReauthError(error: unknown): string {
    const code = this.getErrorCode(error);

    if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      return 'Senha incorreta. Tente novamente.';
    }
    if (code === 'auth/too-many-requests') {
      return 'Muitas tentativas. Aguarde um momento e tente de novo.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Confirmação cancelada.';
    }

    return 'Não foi possível confirmar sua identidade. Tente novamente.';
  }
}
