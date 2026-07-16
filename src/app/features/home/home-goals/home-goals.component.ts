import { Component } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { GoalsService } from '../../../services/goals.service';
import { Goals } from '../../../shared/interfaces/goals.interface';

type GoalsList = Goals & { id: string };

@Component({
  selector: 'app-home-goals',
  imports: [],
  templateUrl: './home-goals.component.html',
  styleUrl: './home-goals.component.css',
})
export class HomeGoalsComponent {
  goals: GoalsList[] = [];
  isLoading = false;

  constructor(
    private readonly goalsService: GoalsService,
    private readonly auth: Auth,
    private readonly router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.refreshGoals();
  }

  async refreshGoals(): Promise<void> {
    this.isLoading = true;
    await this.auth.authStateReady();
    const uid = this.auth.currentUser?.uid;

    if (!uid) {
      this.goals = [];
      this.isLoading = false;
      return;
    }

    try {
      this.goals = await this.goalsService.getRecentByUserId(uid, 3);
    } catch (error) {
      console.error('Erro ao carregar metas', error);
      this.goals = [];
    } finally {
      this.isLoading = false;
    }
  }

  onViewAllGoals(): void {
    void this.router.navigateByUrl('/goals');
  }

  onCreateGoal(): void {
    void this.router.navigate(['/goals'], {
      queryParams: { create: 'true' },
    });
  }

  getProgressPercent(goal: GoalsList): number {
    if (goal.targetValue <= 0) {
      return 0;
    }

    const percent = (goal.actualValue / goal.targetValue) * 100;
    return Math.max(0, Math.min(100, Math.round(percent)));
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  formatLimitDate(value: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(value);
  }
}
