import { Component, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FirebaseError } from 'firebase/app';
import { ToastService } from '../../../services/toast.service';
import { TransactionService } from '../../../services/transaction.service';
import { TransactionType } from '../../../shared/enum/transaction-type.enum';

@Component({
  selector: 'app-transaction-form-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './transaction-form-modal.component.html',
  styleUrl: './transaction-form-modal.component.css',
})
export class TransactionFormModalComponent {
  private readonly activeModal = inject(NgbActiveModal, { optional: true });
  readonly transactionType = TransactionType;
  isSubmitting = false;
  submitError: string | null = null;

  readonly categories = [
    { id: 'outro', label: 'Outro' },
    { id: 'alimentacao', label: 'Alimentação' },
    { id: 'moradia', label: 'Moradia' },
    { id: 'transporte', label: 'Transporte' },
    { id: 'saude', label: 'Saúde' },
  ];

  transactionForm = new FormGroup({
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    value: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0.01)],
    }),
    type: new FormControl<TransactionType>(TransactionType.EXPENSE, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    categoryId: new FormControl('outro', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor(
    private readonly transactionService: TransactionService,
    private readonly auth: Auth,
    private readonly toast: ToastService,
  ) {}

  closeModal() {
    this.activeModal?.dismiss();
  }

  async onSubmit() {
    this.submitError = null;

    if (this.transactionForm.invalid) {
      this.transactionForm.markAllAsTouched();
      return;
    }

    const userId = this.auth.currentUser?.uid;

    if (!userId) {
      this.submitError = 'Voce precisa estar logado para adicionar transacoes.';
      this.toast.error(this.submitError);
      return;
    }

    try {
      this.isSubmitting = true;
      const payload = this.transactionForm.getRawValue();

      await this.transactionService.addTransaction({
        userId,
        description: payload.description,
        value: Number(payload.value),
        type: payload.type,
        categoryId: payload.categoryId,
        fixedExpense: false,
        transactionDate: new Date(),
      });

      this.transactionForm.reset({
        description: '',
        value: null,
        type: TransactionType.EXPENSE,
        categoryId: 'outro',
      });

      this.activeModal?.close('created');
    } catch (error) {
      console.error('Erro ao adicionar transacao', error);
      this.submitError = this.mapSubmitError(error);
      this.toast.error(this.submitError);
    } finally {
      this.isSubmitting = false;
    }
  }

  private mapSubmitError(error: unknown): string {
    if (!(error instanceof FirebaseError)) {
      return 'Nao foi possivel adicionar a transacao. Tente novamente.';
    }

    switch (error.code) {
      case 'permission-denied':
        return 'Sem permissao para salvar. Verifique as regras do Firebase.';
      case 'unauthenticated':
        return 'Sua sessao expirou. Faca login novamente.';
      case 'unavailable':
        return 'Firebase indisponivel no momento. Tente novamente em instantes.';
      case 'failed-precondition':
        return 'Indice do Firestore ausente. Crie o indice sugerido no console.';
      default:
        return 'Nao foi possivel adicionar a transacao. Tente novamente.';
    }
  }
}
