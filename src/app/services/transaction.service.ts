import { Injectable } from '@angular/core';
import {
  Firestore,
  QueryConstraint,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { FirebaseError } from 'firebase/app';
import { TransactionType } from '../shared/enum/transaction-type.enum';
import { Transaction } from '../shared/interfaces/transaction.interface';

interface GetTransactionsOptions {
  maxItems?: number;
  type?: TransactionType;
  startDate?: Date;
  endDate?: Date;
}

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

  async updateTransaction(
    id: string,
    payload: Partial<Omit<Transaction, 'createdAt' | 'updatedAt'>>,
  ): Promise<void> {
    const ref = doc(this.firestore, 'transactions', id);
    await updateDoc(ref, { ...payload, updatedAt: new Date() });
  }

  async deleteTransaction(id: string): Promise<void> {
    const ref = doc(this.firestore, 'transactions', id);
    await deleteDoc(ref);
  }

  async getRecentByUserId(
    userId: string,
    maxItems = 5,
  ): Promise<Array<Transaction & { id: string }>> {
    return this.getByUserId(userId, { maxItems });
  }

  async getByUserId(
    userId: string,
    options: GetTransactionsOptions = {},
  ): Promise<Array<Transaction & { id: string }>> {
    const { maxItems = 100, type, startDate, endDate } = options;
    const transactionsRef = collection(this.firestore, 'transactions');
    const constraints: QueryConstraint[] = [where('userId', '==', userId)];

    if (type) {
      constraints.push(where('type', '==', type));
    }

    if (startDate) {
      constraints.push(where('transactionDate', '>=', startDate));
    }

    if (endDate) {
      constraints.push(where('transactionDate', '<=', endDate));
    }

    constraints.push(orderBy('transactionDate', 'desc'));
    constraints.push(limit(maxItems));

    const sortedQuery = query(transactionsRef, ...constraints);

    try {
      const snapshot = await getDocs(sortedQuery);
      return this.mapTransactions(snapshot.docs);
    } catch (error) {
      if (!this.isIndexRelatedError(error)) {
        throw error;
      }

      const fallbackQuery = query(
        transactionsRef,
        where('userId', '==', userId),
        limit(Math.max(200, maxItems * 5)),
      );
      const fallbackSnapshot = await getDocs(fallbackQuery);

      return this.mapTransactions(fallbackSnapshot.docs)
        .filter((item) => {
          if (type && item.type !== type) {
            return false;
          }

          if (startDate && item.transactionDate < startDate) {
            return false;
          }

          if (endDate && item.transactionDate > endDate) {
            return false;
          }

          return true;
        })
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

  private isIndexRelatedError(error: unknown): boolean {
    if (!(error instanceof FirebaseError)) {
      return false;
    }

    return error.code === 'failed-precondition' && /index/i.test(error.message);
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
