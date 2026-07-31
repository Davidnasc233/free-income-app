import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { ChartData } from 'chart.js';
import { TransactionService } from '../../services/transaction.service';
import { TransactionType } from '../../shared/enum/transaction-type.enum';
import { Transaction } from '../../shared/interfaces/transaction.interface';
import { BalanceEvolutionLineChartComponent } from './balance-evolution-line-chart/balance-evolution-line-chart.component';
import { ExpensesDoughnutChartComponent } from './expenses-doughnut-chart/expenses-doughnut-chart.component';
import { IncomeExpenseBarChartComponent } from './income-expense-bar-chart/income-expense-bar-chart.component';

@Component({
  selector: 'app-graphics',
  imports: [
    DatePipe,
    ExpensesDoughnutChartComponent,
    IncomeExpenseBarChartComponent,
    BalanceEvolutionLineChartComponent,
  ],
  templateUrl: './graphics.component.html',
  styleUrl: './graphics.component.css',
})
export class GraphicsComponent {
  isLoading = false;
  loadError: string | null = null;
  hasData = false;

  readonly daysWindow = 30;
  periodStart!: Date;
  periodEnd!: Date;

  readonly categories = [
    { id: 'outro', label: 'Outro' },
    { id: 'alimentacao', label: 'Alimentação' },
    { id: 'moradia', label: 'Moradia' },
    { id: 'transporte', label: 'Transporte' },
    { id: 'saude', label: 'Saúde' },
  ];

  expensesByCategoryData: ChartData<'doughnut', number[], string> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [
          '#ff1744',
          '#ff9100',
          '#00e676',
          '#2979ff',
          '#d500f9',
        ],
      },
    ],
  };

  incomeVsExpensesData: ChartData<'bar', number[], string> = {
    labels: ['Receitas', 'Despesas'],
    datasets: [
      {
        label: 'Valor (R$)',
        data: [0, 0],
        backgroundColor: ['#00c853', '#ff3d00'],
      },
    ],
  };

  balanceEvolutionData: ChartData<'line', number[], string> = {
    labels: [],
    datasets: [
      {
        label: 'Saldo acumulado (R$)',
        data: [],
        fill: false,
        borderColor: '#1d3557',
        backgroundColor: '#1d3557',
        tension: 0.25,
      },
    ],
  };

  constructor(
    private readonly transactionService: TransactionService,
    private readonly auth: Auth,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadCharts();
  }

  async loadCharts(): Promise<void> {
    this.isLoading = true;
    this.loadError = null;
    this.hasData = false;

    await this.auth.authStateReady();
    const uid = this.auth.currentUser?.uid;

    if (!uid) {
      this.loadError = 'Voce precisa estar logado para visualizar os graficos.';
      this.isLoading = false;
      return;
    }

    const { startDate, endDate } = this.buildDateRange(this.daysWindow);
    this.periodStart = startDate;
    this.periodEnd = endDate;

    try {
      const transactions = await this.transactionService.getByUserId(uid, {
        startDate,
        endDate,
        maxItems: 500,
      });

      this.buildExpensesByCategoryChart(transactions);
      this.buildIncomeVsExpensesChart(transactions);
      this.buildBalanceEvolutionChart(transactions);
      this.hasData = transactions.length > 0;
    } catch (error) {
      console.error('Erro ao carregar dados dos graficos', error);
      this.loadError = this.mapLoadError(error);
      this.hasData = false;
    } finally {
      this.isLoading = false;
    }
  }

  private buildExpensesByCategoryChart(
    transactions: Array<Transaction & { id: string }>,
  ): void {
    const expenses = transactions.filter(
      (item) => item.type === TransactionType.EXPENSE,
    );

    const grouped = new Map<string, number>();

    for (const item of expenses) {
      const category = this.getCategoryLabel(item.categoryId);
      const previousValue = grouped.get(category) ?? 0;
      grouped.set(category, previousValue + item.value);
    }

    const labels = Array.from(grouped.keys());
    const values = Array.from(grouped.values());

    this.expensesByCategoryData = {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: [
            '#ff1744',
            '#ff9100',
            '#00e676',
            '#2979ff',
            '#d500f9',
          ],
        },
      ],
    };
  }

  private buildIncomeVsExpensesChart(
    transactions: Array<Transaction & { id: string }>,
  ): void {
    const income = transactions
      .filter((item) => item.type === TransactionType.INCOME)
      .reduce((acc, item) => acc + item.value, 0);

    const expense = transactions
      .filter((item) => item.type === TransactionType.EXPENSE)
      .reduce((acc, item) => acc + item.value, 0);

    this.incomeVsExpensesData = {
      labels: ['Receitas', 'Despesas'],
      datasets: [
        {
          label: 'Valor (R$)',
          data: [income, expense],
          backgroundColor: ['#00c853', '#ff3d00'],
        },
      ],
    };
  }

  private buildBalanceEvolutionChart(
    transactions: Array<Transaction & { id: string }>,
  ): void {
    const chronological = [...transactions].sort(
      (a, b) => a.transactionDate.getTime() - b.transactionDate.getTime(),
    );

    let runningBalance = 0;
    const labels: string[] = [];
    const values: number[] = [];

    for (const item of chronological) {
      runningBalance +=
        item.type === TransactionType.INCOME ? item.value : -item.value;

      labels.push(this.formatDayLabel(item.transactionDate));
      values.push(Number(runningBalance.toFixed(2)));
    }

    this.balanceEvolutionData = {
      labels,
      datasets: [
        {
          label: 'Saldo acumulado (R$)',
          data: values,
          fill: false,
          borderColor: '#1d3557',
          backgroundColor: '#1d3557',
          tension: 0.25,
        },
      ],
    };
  }

  private buildDateRange(days: number): { startDate: Date; endDate: Date } {
    const now = new Date();

    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(now.getDate() - days + 1);

    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }

  private getCategoryLabel(categoryId: string): string {
    return (
      this.categories.find((item) => item.id === categoryId)?.label ??
      'Sem categoria'
    );
  }

  private formatDayLabel(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    }).format(date);
  }

  private mapLoadError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Nao foi possivel carregar os graficos. Tente novamente.';
  }
}
