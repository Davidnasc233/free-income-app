import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from '@angular/fire/firestore';
import { Transaction } from '../shared/interfaces/transaction.interface';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  constructor(private readonly firestore: Firestore) {}

  async getRecentByUserId(
    userId: string,
    maxItems = 5,
  ): Promise<Array<Transaction & { id: string }>> {
    const transactionsRef = collection(this.firestore, 'transactions');
    const transactionsQuery = query(
      transactionsRef,
      where('userId', '==', userId),
      orderBy('transactionDate', 'desc'),
      limit(maxItems),
    );

    const snapshot = await getDocs(transactionsQuery);

    return snapshot.docs.map((document) => {
      const data = document.data() as Record<string, unknown>;

      return {
        id: document.id,
        userId: String(data['userId'] ?? ''),
        categoryId: String(data['categoryId'] ?? ''),
        description: String(data['description'] ?? ''),
        value: Number(data['value'] ?? 0),
        type: (data['type'] as Transaction['type']) ?? 'expense',
        fixedExpense: Boolean(data['fixedExpense'] ?? false),
        transactionDate: this.toDate(data['transactionDate']),
        createdAt: this.toDate(data['createdAt']),
        updatedAt: this.toDate(data['updatedAt']),
      };
    });
  }

  private toDate(value: unknown): Date {
    if (!value) {
      return new Date();
    }

    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'object' && value !== null && 'toDate' in value) {
      const timestamp = value as { toDate: () => Date };
      return timestamp.toDate();
    }

    return new Date(String(value));
  }
}
