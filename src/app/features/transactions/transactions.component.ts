import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TransactionService } from '../../services/transaction.service';
import { TransactionType } from '../../shared/enum/transaction-type.enum';
import { Transaction } from '../../shared/interfaces/transaction.interface';
import { TransactionFiltersComponent } from './transaction-filters/transaction-filters.component';
import {
  PeriodFilter,
  TransactionFilterType,
  TransactionSortOrder,
} from './transaction-filters/transaction-filters.types';
import { TransactionFormModalComponent } from './transaction-form-modal/transaction-form-modal.component';

type TransactionListItem = Transaction & { id: string; category: string };
type TransactionDayGroup = {
  key: string;
  date: Date;
  title: string;
  total: number;
  items: TransactionListItem[];
};

@Component({
  selector: 'app-transactions',
  imports: [CurrencyPipe, DatePipe, TransactionFiltersComponent],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.css',
})
export class TransactionsComponent {
  readonly transactionType = TransactionType;
  selectedType: TransactionFilterType = 'all';
  selectedPeriod: PeriodFilter = 30;
  searchTerm = '';
  sortOrder: TransactionSortOrder = 'recent';
  customStartDate = '';
  customEndDate = '';

  data: TransactionListItem[] = [];
  groupedData: TransactionDayGroup[] = [];
  allFilteredData: TransactionListItem[] = [];
  isLoading = false;
  submitError: string | null = null;
  appliedFilterDescription = 'Ultimos 30 dias';

  readonly categories = [
    { id: 'outro', label: 'Outro' },
    { id: 'alimentacao', label: 'Alimentação' },
    { id: 'moradia', label: 'Moradia' },
    { id: 'transporte', label: 'Transporte' },
    { id: 'saude', label: 'Saúde' },
  ];

  constructor(
    private readonly transactionService: TransactionService,
    private readonly auth: Auth,
    private readonly modalService: NgbModal,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.refreshTransactions();
  }

  async refreshTransactions(): Promise<void> {
    this.submitError = null;
    this.isLoading = true;

    await this.auth.authStateReady();
    const uid = this.auth.currentUser?.uid;

    if (!uid) {
      this.data = [];
      this.isLoading = false;
      return;
    }

    try {
      const { startDate, endDate, description } = this.buildDateFilter();
      this.appliedFilterDescription = description;

      const transactions = await this.transactionService.getByUserId(uid, {
        type: this.selectedType === 'all' ? undefined : this.selectedType,
        startDate,
        endDate,
        maxItems: 200,
      });

      this.allFilteredData = transactions.map((item) => ({
        ...item,
        category: this.getCategoryLabel(item.categoryId),
      }));
      this.applyClientFilters();
    } catch (error) {
      console.error('Erro ao carregar transacoes', error);
      this.submitError = this.mapLoadError(error);
      this.allFilteredData = [];
      this.data = [];
    } finally {
      this.isLoading = false;
    }
  }

  selectType(type: TransactionFilterType): void {
    this.selectedType = type;
    void this.refreshTransactions();
  }

  selectPeriod(period: PeriodFilter): void {
    this.selectedPeriod = period;

    if (period !== 'custom') {
      this.customStartDate = '';
      this.customEndDate = '';
      void this.refreshTransactions();
    }
  }

  applyCustomRange(): void {
    void this.refreshTransactions();
  }

  updateSearchTerm(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.applyClientFilters();
  }

  updateSortOrder(sortOrder: TransactionSortOrder): void {
    this.sortOrder = sortOrder;
    this.applyClientFilters();
  }

  updateCustomStartDate(startDate: string): void {
    this.customStartDate = startDate;
  }

  updateCustomEndDate(endDate: string): void {
    this.customEndDate = endDate;
  }

  openAddTransactionModal(): void {
    const modalRef = this.modalService.open(TransactionFormModalComponent, {
      centered: true,
      backdropClass: 'user-toolbar-backdrop',
      windowClass: 'transaction-modal',
    });

    modalRef.closed.subscribe((result) => {
      if (result === 'created') {
        void this.refreshTransactions();
      }
    });
  }

  trackByTransactionId(_: number, item: TransactionListItem): string {
    return item.id;
  }

  private applyClientFilters(): void {
    const normalizedSearch = this.searchTerm.trim().toLowerCase();

    const filtered = this.allFilteredData.filter((item) => {
      if (!normalizedSearch) {
        return true;
      }

      return (
        item.description.toLowerCase().includes(normalizedSearch) ||
        item.category.toLowerCase().includes(normalizedSearch)
      );
    });

    const sorted = [...filtered].sort((a, b) => {
      const diff = a.transactionDate.getTime() - b.transactionDate.getTime();

      return this.sortOrder === 'oldest' ? diff : -diff;
    });

    this.data = sorted;
    this.groupedData = this.groupTransactionsByDay(sorted);
  }

  trackByGroupKey(_: number, group: TransactionDayGroup): string {
    return group.key;
  }

  getSignedAmount(value: number): string {
    return value > 0 ? '+' : '-';
  }

  private groupTransactionsByDay(
    transactions: TransactionListItem[],
  ): TransactionDayGroup[] {
    const groups: TransactionDayGroup[] = [];
    const groupMap = new Map<string, TransactionDayGroup>();

    for (const item of transactions) {
      const dayDate = new Date(item.transactionDate);
      dayDate.setHours(0, 0, 0, 0);
      const key = this.toDateKey(dayDate);
      const signedValue =
        item.type === TransactionType.INCOME ? item.value : -item.value;

      if (!groupMap.has(key)) {
        const group: TransactionDayGroup = {
          key,
          date: dayDate,
          title: this.formatGroupTitle(dayDate),
          total: signedValue,
          items: [item],
        };

        groupMap.set(key, group);
        groups.push(group);
        continue;
      }

      const existingGroup = groupMap.get(key)!;
      existingGroup.items.push(item);
      existingGroup.total += signedValue;
    }

    return groups;
  }

  private toDateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate(),
    ).padStart(2, '0')}`;
  }

  private formatGroupTitle(date: Date): string {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateLabel = new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'short',
    })
      .format(date)
      .replace('.', '');

    if (date.getTime() === now.getTime()) {
      return `Hoje · ${dateLabel}`;
    }

    if (date.getTime() === yesterday.getTime()) {
      return `Ontem · ${dateLabel}`;
    }

    return dateLabel;
  }

  private buildDateFilter(): {
    startDate?: Date;
    endDate?: Date;
    description: string;
  } {
    const now = new Date();

    if (this.selectedPeriod !== 'custom') {
      const startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      startDate.setDate(now.getDate() - this.selectedPeriod + 1);

      const endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);

      return {
        startDate,
        endDate,
        description: `Ultimos ${this.selectedPeriod} dias`,
      };
    }

    if (!this.customStartDate || !this.customEndDate) {
      throw new Error(
        'Informe a data inicial e final para o periodo customizado.',
      );
    }

    const startDate = new Date(`${this.customStartDate}T00:00:00`);
    const endDate = new Date(`${this.customEndDate}T23:59:59.999`);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new Error('Periodo customizado invalido.');
    }

    if (startDate > endDate) {
      throw new Error('A data inicial deve ser menor ou igual a data final.');
    }

    return {
      startDate,
      endDate,
      description: `${this.customStartDate} ate ${this.customEndDate}`,
    };
  }

  private getCategoryLabel(categoryId: string): string {
    return (
      this.categories.find((item) => item.id === categoryId)?.label ??
      'Sem categoria'
    );
  }

  private mapLoadError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Nao foi possivel carregar as transacoes. Tente novamente.';
  }
}
