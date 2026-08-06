import { Component, EventEmitter, Output } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { ConfirmationModalService } from '../../../services/confirmation-modal.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-user-toolbar',
  imports: [],
  templateUrl: './user-toolbar.component.html',
  styleUrl: './user-toolbar.component.css',
})
export class UserToolbarComponent {
  @Output() logoutSuccess = new EventEmitter<void>();
  @Output() closeRequested = new EventEmitter<void>();

  isLoggingOut = false;

  constructor(
    private readonly auth: Auth,
    private readonly router: Router,
    private readonly confirmationModal: ConfirmationModalService,
    private readonly toast: ToastService,
  ) {}

  goToSettings(): void {
    this.closeRequested.emit();
    void this.router.navigateByUrl('/settings');
  }

  goToContact(): void {
    this.closeRequested.emit();
    void this.router.navigateByUrl('/contact');
  }

  async onLogout(): Promise<void> {
    if (this.isLoggingOut) {
      return;
    }

    const confirmed = await this.confirmationModal.confirm({
      type: 'danger',
      title: 'Sair da conta',
      description: 'Deseja realmente encerrar sua sessão agora?',
      confirmLabel: 'Sair',
      cancelLabel: 'Cancelar',
    });

    if (!confirmed) {
      return;
    }

    this.isLoggingOut = true;

    try {
      await this.auth.signOut();
      this.toast.success('Sessão encerrada com sucesso.');
      this.logoutSuccess.emit();
      await this.router.navigateByUrl('/auth/login');
    } catch (error) {
      console.error('Erro ao fazer logout', error);
      this.toast.error('Não foi possível sair. Tente novamente.');
    } finally {
      this.isLoggingOut = false;
    }
  }
}
