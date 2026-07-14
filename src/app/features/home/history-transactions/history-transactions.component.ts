import { Component } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { TransactionService } from '../../../services/transaction.service';
import { Transaction } from '../../../shared/interfaces/transaction.interface';

type TransactionListItem = Transaction & { id: string; category: string };

@Component({
  selector: 'app-history-transactions',
  imports: [CurrencyPipe],
  templateUrl: './history-transactions.component.html',
  styleUrl: './history-transactions.component.css',
})
export class HistoryTransactionsComponent {
  data: TransactionListItem[] = [];

  constructor(
    private readonly transactionService: TransactionService,
    private readonly auth: Auth,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadTransactions();
  }

  private async loadTransactions(): Promise<void> {
    const uid = this.auth.currentUser?.uid;

    if (!uid) {
      this.data = [];
      return;
    }

    try {
      const transactions = await this.transactionService.getRecentByUserId(uid);

      this.data = transactions.map((item) => ({
        ...item,
        category: item.categoryId || 'Sem categoria',
      }));
    } catch (error) {
      console.error('Erro ao carregar transacoes', error);
      this.data = [];
    }
  }
}
