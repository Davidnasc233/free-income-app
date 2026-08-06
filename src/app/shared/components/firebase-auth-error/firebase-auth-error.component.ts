import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FirebaseError } from 'firebase/app';

@Component({
  selector: 'app-firebase-auth-error',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="message" class="color-error" role="alert">
      <small>{{ message }}</small>
    </div>
  `,
})
export class FirebaseAuthErrorComponent {
  @Input() error: unknown = null;
  @Input() fallbackMessage =
    'Não foi possível realizar a autenticação. Tente novamente.';

  get message(): string | null {
    if (!this.error) {
      return null;
    }

    const code = this.extractFirebaseErrorCode(this.error);
    if (code) {
      return this.mapFirebaseErrorCodeToMessage(code);
    }

    if (this.error instanceof Error && this.error.message) {
      return this.error.message;
    }

    if (typeof this.error === 'string' && this.error.trim()) {
      return this.error;
    }

    return this.fallbackMessage;
  }

  private extractFirebaseErrorCode(error: unknown): string | null {
    if (error instanceof FirebaseError) {
      return error.code;
    }

    if (error && typeof error === 'object') {
      const maybeCode = (error as { code?: unknown }).code;
      if (typeof maybeCode === 'string' && maybeCode.startsWith('auth/')) {
        return maybeCode;
      }

      const maybeMessage = (error as { message?: unknown }).message;
      if (typeof maybeMessage === 'string') {
        const matchedCode = maybeMessage.match(/auth\/[a-z-]+/i)?.[0];
        if (matchedCode) {
          return matchedCode.toLowerCase();
        }
      }
    }

    if (typeof error === 'string') {
      const matchedCode = error.match(/auth\/[a-z-]+/i)?.[0];
      if (matchedCode) {
        return matchedCode.toLowerCase();
      }
    }

    return null;
  }

  private mapFirebaseErrorCodeToMessage(code: string): string {
    switch (code) {
      case 'auth/invalid-email':
        return 'E-mail inválido.';
      case 'auth/user-disabled':
        return 'Este usuário foi desativado.';
      case 'auth/user-not-found':
        return 'Usuário não encontrado.';
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
      case 'auth/invalid-login-credentials':
        return 'E-mail ou senha incorretos.';
      case 'auth/email-already-in-use':
        return 'Este e-mail já está em uso.';
      case 'auth/weak-password':
        return 'Senha fraca. Use pelo menos 6 caracteres.';
      case 'auth/too-many-requests':
        return 'Muitas tentativas. Tente novamente em alguns minutos.';
      case 'auth/network-request-failed':
        return 'Falha de conexão. Verifique sua internet e tente novamente.';
      default:
        return `Erro ao autenticar (${code}).`;
    }
  }
}
