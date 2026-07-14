import { Injectable } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from '@angular/fire/firestore';
import { FirebaseError } from 'firebase/app';
import { Transaction } from '../shared/interfaces/transaction.interface';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  constructor(private readonly firestore: Firestore) {}

  async addTransaction(
    payload: Omit<Transaction, 'createdAt' | 'updatedAt'>,
  ): Promise<void> {
    const transactionsRef = collection(this.firestore, 'transactions');
    try {
      await addDoc(transactionsRef, {
        ...payload,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Falha ao salvar transacao no Firestore', {
        payload,
        error,
      });
      throw error;
    }
  }

  async getRecentByUserId(
    userId: string,
    maxItems = 5,
  ): Promise<Array<Transaction & { id: string }>> {
    const transactionsRef = collection(this.firestore, 'transactions');
    const sortedQuery = query(
      transactionsRef,
      where('userId', '==', userId),
      orderBy('transactionDate', 'desc'),
      limit(maxItems),
    );

    try {
      const snapshot = await getDocs(sortedQuery);
      return this.mapTransactions(snapshot.docs);
    } catch (error) {
      if (!this.isIndexBuildingError(error)) {
        throw error;
      }

      const fallbackQuery = query(
        transactionsRef,
        where('userId', '==', userId),
        limit(Math.max(50, maxItems * 5)),
      );
      const fallbackSnapshot = await getDocs(fallbackQuery);

      return this.mapTransactions(fallbackSnapshot.docs)
        .sort(
          (a, b) => b.transactionDate.getTime() - a.transactionDate.getTime(),
        )
        .slice(0, maxItems);
    }
  }

  private mapTransactions(
    docs: Array<{ id: string; data: () => Record<string, unknown> }>,
  ): Array<Transaction & { id: string }> {
    return docs.map((document) => {
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

  private isIndexBuildingError(error: unknown): boolean {
    if (!(error instanceof FirebaseError)) {
      return false;
    }

    return (
      error.code === 'failed-precondition' &&
      /index is currently building/i.test(error.message)
    );
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
