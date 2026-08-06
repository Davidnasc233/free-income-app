import { CurrencyPipe } from '@angular/common';
import { Component } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { TransactionService } from '../../../services/transaction.service';
import { TransactionType } from '../../enum/transaction-type.enum';

@Component({
  selector: 'app-balance',
  imports: [CurrencyPipe],
  templateUrl: './balance.component.html',
  styleUrl: './balance.component.css',
})
export class BalanceComponent {
  totalBalance = 0;
  totalIncome = 0;
  totalExpense = 0;
  isLoading = false;

  constructor(
    private readonly transactionService: TransactionService,
    private readonly auth: Auth,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.refreshBalance();
  }

  async refreshBalance(): Promise<void> {
    await this.loadBalance();
  }

  private async loadBalance(): Promise<void> {
    this.isLoading = true;
    await this.auth.authStateReady();
    const uid = this.auth.currentUser?.uid;

    if (!uid) {
      this.resetTotals();
      this.isLoading = false;
      return;
    }

    try {
      const [incomeTransactions, expenseTransactions] = await Promise.all([
        this.transactionService.getByUserId(uid, {
          type: TransactionType.INCOME,
          maxItems: 500,
        }),
        this.transactionService.getByUserId(uid, {
          type: TransactionType.EXPENSE,
          maxItems: 500,
        }),
      ]);

      this.totalIncome = incomeTransactions.reduce(
        (acc, item) => acc + item.value,
        0,
      );
      this.totalExpense = expenseTransactions.reduce(
        (acc, item) => acc + item.value,
        0,
      );
      this.totalBalance = this.totalIncome - this.totalExpense;
    } catch (error) {
      console.error('Erro ao carregar resumo financeiro', error);
      this.resetTotals();
    } finally {
      this.isLoading = false;
    }
  }

  private resetTotals(): void {
    this.totalBalance = 0;
    this.totalIncome = 0;
    this.totalExpense = 0;
  }
}
