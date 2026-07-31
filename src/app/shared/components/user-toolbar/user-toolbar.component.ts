import { Component, EventEmitter, Output } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';

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
  logoutError: string | null = null;

  constructor(
    private readonly auth: Auth,
    private readonly router: Router,
  ) {}

  goToSettings(): void {
    this.closeRequested.emit();
    void this.router.navigateByUrl('/settings');
  }

  async onLogout(): Promise<void> {
    if (this.isLoggingOut) {
      return;
    }

    this.isLoggingOut = true;
    this.logoutError = null;

    try {
      await this.auth.signOut();
      this.logoutSuccess.emit();
      await this.router.navigateByUrl('/auth/login');
    } catch (error) {
      console.error('Erro ao fazer logout', error);
      this.logoutError = 'Nao foi possivel sair. Tente novamente.';
    } finally {
      this.isLoggingOut = false;
    }
  }
}
