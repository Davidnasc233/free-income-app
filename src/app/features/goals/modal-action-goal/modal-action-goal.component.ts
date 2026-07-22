import { CommonModule } from '@angular/common';
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
import { GoalsService } from '../../../services/goals.service';
import { GoalListItem } from '../../../services/goals-modal.service';

type GoalActionMode = 'create' | 'edit';
type GoalResult = 'created' | 'updated';
type GoalIcon = { id: string; visual: string; label: string };

@Component({
  selector: 'app-modal-action-goal',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modal-action-goal.component.html',
  styleUrl: './modal-action-goal.component.css',
})
export class ModalActionGoalComponent {
  private readonly activeModal = inject(NgbActiveModal, { optional: true });

  mode: GoalActionMode = 'create';
  goalToEdit: GoalListItem | null = null;
  isSubmitting = false;
  submitError: string | null = null;

  readonly icons: GoalIcon[] = [
    { id: 'ph-target', visual: '🎯', label: 'Meta' },
    { id: 'ph-airplane-tilt', visual: '✈️', label: 'Viagem' },
    { id: 'ph-house', visual: '🏠', label: 'Casa' },
    { id: 'ph-laptop', visual: '💻', label: 'Tecnologia' },
    { id: 'ph-book-open-text', visual: '📚', label: 'Estudo' },
  ];

  goalForm = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    targetValue: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1)],
    }),
    limitDate: new FormControl('', {
      nonNullable: true,
    }),
    icon: new FormControl('ph-target', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor(
    private readonly goalsService: GoalsService,
    private readonly auth: Auth,
  ) {}

  configureForCreate(): void {
    this.mode = 'create';
    this.goalToEdit = null;
    this.submitError = null;
    this.goalForm.reset({
      title: '',
      targetValue: null,
      limitDate: '',
      icon: 'ph-target',
    });
  }

  configureForEdit(goal: GoalListItem): void {
    this.mode = 'edit';
    this.goalToEdit = goal;
    this.submitError = null;
    this.goalForm.reset({
      title: goal.title,
      targetValue: goal.targetValue,
      limitDate: this.toInputDate(goal.limitDate),
      icon: goal.icon || 'ph-target',
    });
  }

  closeModal(): void {
    this.activeModal?.dismiss();
  }

  selectIcon(iconId: string): void {
    this.goalForm.controls.icon.setValue(iconId);
    this.goalForm.controls.icon.markAsDirty();
  }

  async onSubmit(): Promise<void> {
    this.submitError = null;

    if (this.goalForm.invalid) {
      this.goalForm.markAllAsTouched();
      return;
    }

    await this.auth.authStateReady();
    const userId = this.auth.currentUser?.uid;

    if (!userId) {
      this.submitError = 'Voce precisa estar logado para salvar metas.';
      return;
    }

    const payload = this.goalForm.getRawValue();
    const title = payload.title.trim();
    const icon = payload.icon || 'ph-target';
    const targetValue = Number(payload.targetValue);
    const limitDate = this.parseLimitDate(payload.limitDate);

    try {
      this.isSubmitting = true;

      if (this.mode === 'edit' && this.goalToEdit) {
        await this.goalsService.updateGoal(this.goalToEdit.id, {
          userId,
          title,
          targetValue,
          actualValue: this.goalToEdit.actualValue,
          limitDate,
          icon,
        });

        this.activeModal?.close('updated' as GoalResult);
        return;
      }

      await this.goalsService.addGoal({
        userId,
        title,
        targetValue,
        actualValue: 0,
        limitDate,
        icon,
      });

      this.activeModal?.close('created' as GoalResult);
    } catch (error) {
      console.error('Erro ao salvar meta', error);
      this.submitError = this.mapSubmitError(error);
    } finally {
      this.isSubmitting = false;
    }
  }

  private parseLimitDate(rawDate: string): Date {
    if (!rawDate) {
      return new Date();
    }

    const normalized = new Date(rawDate);
    if (Number.isNaN(normalized.getTime())) {
      return new Date();
    }

    return normalized;
  }

  private toInputDate(date: Date): string {
    const value = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(value.getTime())) {
      return '';
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private mapSubmitError(error: unknown): string {
    if (!(error instanceof FirebaseError)) {
      return 'Nao foi possivel salvar a meta. Tente novamente.';
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
        return 'Nao foi possivel salvar a meta. Tente novamente.';
    }
  }
}
