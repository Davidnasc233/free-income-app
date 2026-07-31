import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { ActivatedRoute, Router } from '@angular/router';
import { GoalsService } from '../../services/goals.service';
import {
  GoalListItem,
  GoalsModalService,
} from '../../services/goals-modal.service';
import { ConfirmationModalService } from '../../services/confirmation-modal.service';
import { ToastService } from '../../services/toast.service';
import { Goals } from '../../shared/interfaces/goals.interface';
import { PageStateComponent } from '../../shared/components/page-state/page-state.component';

type GoalItem = Goals & { id: string };

@Component({
  selector: 'app-goals',
  imports: [CommonModule, PageStateComponent],
  templateUrl: './goals.component.html',
  styleUrl: './goals.component.css',
})
export class GoalsComponent {
  goals: GoalItem[] = [];
  isLoading = false;
  loadError: string | null = null;
  private readonly actionInProgress = new Set<string>();

  constructor(
    private readonly goalsService: GoalsService,
    private readonly goalsModalService: GoalsModalService,
    private readonly confirmationModalService: ConfirmationModalService,
    private readonly toast: ToastService,
    private readonly auth: Auth,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadGoals();
    this.handleCreateQueryParam();
  }

  async loadGoals(): Promise<void> {
    this.isLoading = true;
    this.loadError = null;
    await this.auth.authStateReady();
    const uid = this.auth.currentUser?.uid;

    if (!uid) {
      this.goals = [];
      this.loadError = 'Usuário não autenticado.';
      this.isLoading = false;
      return;
    }

    try {
      this.goals = await this.goalsService.getByUserId(uid, 100);
    } catch (error) {
      console.error('Erro ao carregar metas', error);
      this.goals = [];
      this.loadError = 'Não foi possível carregar as metas. Tente novamente.';
    } finally {
      this.isLoading = false;
    }
  }

  onCreateGoal(): void {
    const modalRef = this.goalsModalService.openCreate();
    modalRef.closed.subscribe((result) => {
      if (result === 'created') {
        this.toast.success('Meta criada com sucesso.');
        void this.loadGoals();
      }
    });
  }

  onEditGoal(goal: GoalListItem): void {
    const modalRef = this.goalsModalService.openEdit(goal);
    modalRef.closed.subscribe((result) => {
      if (result === 'updated') {
        this.toast.success('Meta atualizada com sucesso.');
        void this.loadGoals();
      }
    });
  }

  async onAddValue(
    goal: GoalItem,
    amountInput: HTMLInputElement,
  ): Promise<void> {
    if (this.actionInProgress.has(goal.id)) {
      return;
    }

    const amount = this.parseAmount(amountInput.value);
    if (!Number.isFinite(amount) || amount <= 0) {
      this.toast.warning('Informe um valor válido maior que zero.');
      return;
    }

    this.actionInProgress.add(goal.id);

    try {
      const newActualValue = Number((goal.actualValue + amount).toFixed(2));
      await this.goalsService.updateGoal(goal.id, {
        userId: goal.userId,
        title: goal.title,
        targetValue: goal.targetValue,
        actualValue: newActualValue,
        limitDate: goal.limitDate,
        icon: goal.icon,
      });

      amountInput.value = '';
      this.toast.success('Valor guardado na meta.');
      await this.loadGoals();
    } catch (error) {
      console.error('Erro ao adicionar valor na meta', error);
      this.toast.error(
        'Não foi possível guardar esse valor agora. Tente novamente.',
      );
    } finally {
      this.actionInProgress.delete(goal.id);
    }
  }

  async onDeleteGoal(goal: GoalItem): Promise<void> {
    if (this.actionInProgress.has(goal.id)) {
      return;
    }

    const confirmed = await this.confirmationModalService.confirm({
      type: 'danger',
      title: 'Excluir meta',
      description: `Deseja realmente excluir a meta "${goal.title}"? Essa ação não pode ser desfeita.`,
      cancelLabel: 'Retornar',
      confirmLabel: 'Excluir',
    });

    if (!confirmed) {
      return;
    }

    this.actionInProgress.add(goal.id);

    try {
      await this.goalsService.deleteGoal(goal.id);
      this.goals = this.goals.filter((item) => item.id !== goal.id);
      this.toast.success('Meta excluída.');
    } catch (error) {
      console.error('Erro ao excluir meta', error);
      this.toast.error(
        'Não foi possível excluir a meta agora. Tente novamente.',
      );
    } finally {
      this.actionInProgress.delete(goal.id);
    }
  }

  isGoalActionLoading(goalId: string): boolean {
    return this.actionInProgress.has(goalId);
  }

  getProgressPercent(goal: GoalItem): number {
    if (goal.targetValue <= 0) {
      return 0;
    }

    const percent = (goal.actualValue / goal.targetValue) * 100;
    return Math.max(0, Math.min(100, Math.round(percent)));
  }

  private handleCreateQueryParam(): void {
    const shouldOpenCreate =
      this.route.snapshot.queryParamMap.get('create') === 'true';
    if (!shouldOpenCreate) {
      return;
    }

    this.onCreateGoal();

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { create: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private parseAmount(rawValue: string): number {
    const normalized = rawValue.trim().replace(',', '.');
    return Number(normalized);
  }
}
