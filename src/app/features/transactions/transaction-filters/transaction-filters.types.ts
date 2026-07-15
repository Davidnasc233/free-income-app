import { TransactionType } from '../../../shared/enum/transaction-type.enum';

export type TransactionFilterType = 'all' | TransactionType;
export type PeriodFilter = 30 | 60 | 90 | 'custom';
export type TransactionSortOrder = 'recent' | 'oldest';
