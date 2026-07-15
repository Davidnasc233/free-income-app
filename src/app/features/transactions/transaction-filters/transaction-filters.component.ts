import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { TransactionType } from '../../../shared/enum/transaction-type.enum';
import {
  PeriodFilter,
  TransactionFilterType,
  TransactionSortOrder,
} from './transaction-filters.types';

@Component({
  selector: 'app-transaction-filters',
  standalone: true,
  imports: [FormsModule, NgSelectModule],
  templateUrl: './transaction-filters.component.html',
  styleUrl: './transaction-filters.component.css',
})
export class TransactionFiltersComponent {
  @Input() selectedType: TransactionFilterType = 'all';
  @Input() selectedPeriod: PeriodFilter = 30;
  @Input() searchTerm = '';
  @Input() sortOrder: TransactionSortOrder = 'recent';
  @Input() customStartDate = '';
  @Input() customEndDate = '';

  @Output() readonly typeChange = new EventEmitter<TransactionFilterType>();
  @Output() readonly periodChange = new EventEmitter<PeriodFilter>();
  @Output() readonly searchChange = new EventEmitter<string>();
  @Output() readonly sortOrderChange = new EventEmitter<TransactionSortOrder>();
  @Output() readonly customStartDateChange = new EventEmitter<string>();
  @Output() readonly customEndDateChange = new EventEmitter<string>();
  @Output() readonly applyCustomRange = new EventEmitter<void>();

  readonly transactionType = TransactionType;
  readonly filterTypes: TransactionFilterType[] = [
    'all',
    TransactionType.INCOME,
    TransactionType.EXPENSE,
  ];
  readonly periodOptions: Array<30 | 60 | 90> = [30, 60, 90];

  onTypeClick(type: TransactionFilterType): void {
    this.typeChange.emit(type);
  }

  onPeriodClick(period: PeriodFilter): void {
    this.periodChange.emit(period);
  }

  onSearchInput(value: string): void {
    this.searchChange.emit(value);
  }

  onSortChange(value: string): void {
    this.sortOrderChange.emit(value as TransactionSortOrder);
  }

  onCustomStartDateChange(value: string): void {
    this.customStartDateChange.emit(value);
  }

  onCustomEndDateChange(value: string): void {
    this.customEndDateChange.emit(value);
  }

  onApplyCustomRange(): void {
    this.applyCustomRange.emit();
  }
}
