import { Component, inject, Input } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxCurrencyDirective } from 'ngx-currency';
import { FirebaseError } from 'firebase/app';
import { ToastService } from '../../../services/toast.service';
import { TransactionService } from '../../../services/transaction.service';
import { TransactionType } from '../../../shared/enum/transaction-type.enum';
import { TRANSACTION_CATEGORIES } from '../../../shared/constants/categories.constants';

@Component({
  selector: 'app-transaction-form-modal',
  imports: [ReactiveFormsModule, NgSelectModule, NgxCurrencyDirective],
  templateUrl: './transaction-form-modal.component.html',
  styleUrl: './transaction-form-modal.component.css',
})
export class TransactionFormModalComponent {
  private readonly activeModal = inject(NgbActiveModal, { optional: true });
  readonly transactionType = TransactionType;
  isSubmitting = false;
  submitError: string | null = null;

  @Input() editMode = false;
  @Input() transactionId: string | null = null;

  readonly typeOptions: Array<{ value: TransactionType; label: string }> = [
    { value: TransactionType.EXPENSE, label: 'Despesa' },
    { value: TransactionType.INCOME, label: 'Receita' },
  ];

  readonly categories = TRANSACTION_CATEGORIES;

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
      this.submitError = 'Você precisa estar logado para adicionar transações.';
      this.toast.error(this.submitError);
      return;
    }

    try {
      this.isSubmitting = true;
      const payload = this.transactionForm.getRawValue();

      if (this.editMode && this.transactionId) {
        await this.transactionService.updateTransaction(this.transactionId, {
          description: payload.description,
          value: Number(payload.value),
          type: payload.type,
          categoryId: payload.categoryId,
        });
        this.activeModal?.close('updated');
      } else {
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
      }
    } catch (error) {
      console.error('Erro ao adicionar transação', error);
      this.submitError = this.mapSubmitError(error);
      this.toast.error(this.submitError);
    } finally {
      this.isSubmitting = false;
    }
  }

  private mapSubmitError(error: unknown): string {
    if (!(error instanceof FirebaseError)) {
      return 'Não foi possível adicionar a transação. Tente novamente.';
    }

    switch (error.code) {
      case 'permission-denied':
        return 'Sem permissão para salvar. Verifique as regras do Firebase.';
      case 'unauthenticated':
        return 'Sua sessão expirou. Faça login novamente.';
      case 'unavailable':
        return 'Firebase indisponível no momento. Tente novamente em instantes.';
      case 'failed-precondition':
        return 'Índice do Firestore ausente. Crie o índice sugerido no console.';
      default:
        return 'Não foi possível adicionar a transação. Tente novamente.';
    }
  }
}
