import { Injectable } from '@angular/core';
import {
  Firestore,
  QueryConstraint,
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from '@angular/fire/firestore';
import { FirebaseError } from 'firebase/app';
import { Goals } from '../shared/interfaces/goals.interface';

type GoalListItem = Goals & { id: string };

@Injectable({
  providedIn: 'root',
})
export class GoalsService {
  constructor(private readonly firestore: Firestore) {}

  async addGoal(
    payload: Omit<Goals, 'createdAt' | 'updatedAt'>,
  ): Promise<void> {
    const goalsRef = collection(this.firestore, 'goals');

    await addDoc(goalsRef, {
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async getRecentByUserId(
    userId: string,
    maxItems = 3,
  ): Promise<GoalListItem[]> {
    return this.getByUserId(userId, maxItems);
  }

  async getByUserId(userId: string, maxItems = 50): Promise<GoalListItem[]> {
    const goalsRef = collection(this.firestore, 'goals');
    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(maxItems),
    ];
    const sortedQuery = query(goalsRef, ...constraints);

    try {
      const snapshot = await getDocs(sortedQuery);
      return this.mapGoals(snapshot.docs);
    } catch (error) {
      if (!this.isIndexRelatedError(error)) {
        throw error;
      }

      const fallbackQuery = query(
        goalsRef,
        where('userId', '==', userId),
        limit(Math.max(200, maxItems * 5)),
      );
      const fallbackSnapshot = await getDocs(fallbackQuery);

      return this.mapGoals(fallbackSnapshot.docs)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, maxItems);
    }
  }

  private mapGoals(
    docs: Array<{ id: string; data: () => Record<string, unknown> }>,
  ): GoalListItem[] {
    return docs.map((document) => {
      const data = document.data() as Record<string, unknown>;

      return {
        id: document.id,
        userId: String(data['userId'] ?? ''),
        title: String(data['title'] ?? ''),
        targetValue: Number(data['targetValue'] ?? 0),
        actualValue: Number(data['actualValue'] ?? 0),
        limitDate: this.toDate(data['limitDate']),
        icon: String(data['icon'] ?? 'ph-target'),
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
