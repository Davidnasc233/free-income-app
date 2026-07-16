import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { GoalsService } from '../../services/goals.service';
import { Goals } from '../../shared/interfaces/goals.interface';

type GoalListItem = Goals & { id: string };

@Component({
  selector: 'app-goals',
  imports: [CommonModule],
  templateUrl: './goals.component.html',
  styleUrl: './goals.component.css',
})
export class GoalsComponent {
  goals: GoalListItem[] = [];
  isLoading = false;

  constructor(
    private readonly goalsService: GoalsService,
    private readonly auth: Auth,
    private readonly router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadGoals();
  }

  async loadGoals(): Promise<void> {
    this.isLoading = true;
    await this.auth.authStateReady();
    const uid = this.auth.currentUser?.uid;

    if (!uid) {
      this.goals = [];
      this.isLoading = false;
      return;
    }

    try {
      this.goals = await this.goalsService.getByUserId(uid, 100);
    } catch (error) {
      console.error('Erro ao carregar metas', error);
      this.goals = [];
    } finally {
      this.isLoading = false;
    }
  }

  onCreateGoal(): void {
    void this.router.navigate(['/goals'], {
      queryParams: { create: 'true' },
    });
  }

  getProgressPercent(goal: GoalListItem): number {
    if (goal.targetValue <= 0) {
      return 0;
    }

    const percent = (goal.actualValue / goal.targetValue) * 100;
    return Math.max(0, Math.min(100, Math.round(percent)));
  }
}
