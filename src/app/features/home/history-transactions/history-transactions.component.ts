import { Component, EventEmitter, Output } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { TransactionService } from '../../../services/transaction.service';
import { Transaction } from '../../../shared/interfaces/transaction.interface';
import { PageStateComponent } from '../../../shared/components/page-state/page-state.component';

type TransactionListItem = Transaction & { id: string; category: string };

@Component({
  selector: 'app-history-transactions',
  imports: [CurrencyPipe, DatePipe, PageStateComponent],
  templateUrl: './history-transactions.component.html',
  styleUrl: './history-transactions.component.css',
})
export class HistoryTransactionsComponent {
  @Output() viewAll = new EventEmitter<void>();

  data: TransactionListItem[] = [];
  isLoading = false;
  loadError: string | null = null;

  constructor(
    private readonly transactionService: TransactionService,
    private readonly auth: Auth,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.refreshTransactions();
  }

  async refreshTransactions(): Promise<void> {
    await this.loadTransactions();
  }

  onViewAll(): void {
    this.viewAll.emit();
  }

  private async loadTransactions(): Promise<void> {
    this.isLoading = true;
    this.loadError = null;
    await this.auth.authStateReady();
    const uid = this.auth.currentUser?.uid;

    if (!uid) {
      this.data = [];
      this.isLoading = false;
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
      this.loadError =
        'Nao foi possivel carregar as transacoes. Tente novamente.';
      this.data = [];
    } finally {
      this.isLoading = false;
    }
  }
}
