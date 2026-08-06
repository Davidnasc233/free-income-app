import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ContactService } from '../../services/contact.service';
import { ToastService } from '../../services/toast.service';
import { UserService } from '../../services/user.service';
import { PageStateComponent } from '../../shared/components/page-state/page-state.component';
import { ContactMessageCategory } from '../../shared/interfaces/contact-message.interface';

@Component({
  selector: 'app-contact',
  imports: [CommonModule, ReactiveFormsModule, PageStateComponent, NgSelectModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css',
})
export class ContactComponent implements OnInit {
  readonly categories: Array<{ value: ContactMessageCategory; label: string }> =
    [
      { value: 'duvida', label: 'Dúvida' },
      { value: 'sugestao', label: 'Sugestão' },
      { value: 'erro', label: 'Reportar erro' },
      { value: 'parceria', label: 'Parceria' },
      { value: 'outro', label: 'Outro assunto' },
    ];

  isLoading = true;
  isSubmitting = false;
  loadError: string | null = null;

  contactForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    category: new FormControl<ContactMessageCategory>('duvida', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    subject: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
    message: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(20)],
    }),
  });

  constructor(
    private readonly auth: Auth,
    private readonly userService: UserService,
    private readonly contactService: ContactService,
    private readonly toast: ToastService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    void this.prefillCurrentUser();
  }

  get messageLength(): number {
    return this.contactForm.controls.message.value.length;
  }

  async submit(): Promise<void> {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    await this.auth.authStateReady();
    const uid = this.auth.currentUser?.uid;

    if (!uid) {
      this.toast.error('Sessão expirada. Faça login novamente.');
      return;
    }

    this.isSubmitting = true;

    try {
      const formValue = this.contactForm.getRawValue();

      await this.contactService.createMessage({
        userId: uid,
        name: formValue.name.trim(),
        email: formValue.email.trim().toLowerCase(),
        category: formValue.category,
        subject: formValue.subject.trim(),
        message: formValue.message.trim(),
      });

      this.toast.success('Mensagem enviada com sucesso!');
      this.contactForm.patchValue({
        category: 'duvida',
        subject: '',
        message: '',
      });
      this.contactForm.markAsPristine();
      this.contactForm.markAsUntouched();
    } catch (error) {
      console.error('Erro ao enviar mensagem de contato', error);
      this.toast.error(this.resolveSubmitError(error));
    } finally {
      this.isSubmitting = false;
    }
  }

  goBack(): void {
    void this.router.navigateByUrl('/home');
  }

  private async prefillCurrentUser(): Promise<void> {
    this.isLoading = true;
    this.loadError = null;

    try {
      await this.auth.authStateReady();
      const uid = this.auth.currentUser?.uid;

      if (!uid) {
        this.loadError = 'Usuário não autenticado.';
        return;
      }

      const user = await this.userService.getUser(uid);

      if (!user) {
        this.loadError = 'Perfil não encontrado.';
        return;
      }

      this.contactForm.patchValue({
        name: user.name,
        email: user.email,
      });
    } catch (error) {
      console.error('Erro ao carregar dados para contato', error);
      this.loadError = 'Não foi possível carregar os dados da tela.';
    } finally {
      this.isLoading = false;
    }
  }

  private resolveSubmitError(error: unknown): string {
    if (error instanceof Error) {
      if (error.message.includes('Permissão negada')) {
        return error.message;
      }
    }

    return 'Não foi possível enviar sua mensagem. Tente novamente.';
  }
}
