import { Injectable } from '@angular/core';
import {
  Auth,
  updateEmail,
  updateProfile,
} from '@angular/fire/auth';
import {
  DocumentData,
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { User, UserProfileUpdate } from '../shared/interfaces/users.interface';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(
    private readonly firestore: Firestore,
    private readonly auth: Auth,
  ) {}

  async register(uid: string, user: User): Promise<void> {
    try {
      const newUser = doc(this.firestore, 'users', uid);

      await setDoc(newUser, {
        name: user.name,
        email: user.email,
        birthDay: user.birthDay,
        phone: this.normalizePhone(user.phone),
        wallet: 0,
        income: user.income ?? 0,
        createdAt: new Date().toISOString(),
        updatedAt: null,
      });
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  }

  async getUser(uid: string): Promise<User | null> {
    try {
      const usuarioRef = doc(this.firestore, 'users', uid);
      const docSnap = await getDoc(usuarioRef);

      if (!docSnap.exists()) {
        return null;
      }

      return this.mapUser(docSnap.id, docSnap.data());
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
      throw error;
    }
  }

  async updateProfile(uid: string, data: UserProfileUpdate): Promise<void> {
    const userRef = doc(this.firestore, 'users', uid);
    const phone = this.normalizePhone(data.phone);

    await updateDoc(userRef, {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      birthDay: data.birthDay,
      phone,
      income: data.income ?? 0,
      updatedAt: new Date().toISOString(),
    });

    const currentAuthUser = this.auth.currentUser;
    if (!currentAuthUser || currentAuthUser.uid !== uid) {
      return;
    }

    await updateProfile(currentAuthUser, {
      displayName: data.name.trim(),
    });

    if (currentAuthUser.email !== data.email.trim().toLowerCase()) {
      await updateEmail(currentAuthUser, data.email.trim().toLowerCase());
    }
  }

  private mapUser(id: string, data: DocumentData): User {
    return {
      id,
      name: String(data['name'] ?? ''),
      email: String(data['email'] ?? ''),
      birthDay: this.toDate(data['birthDay']),
      phone: this.normalizePhone(data['phone']),
      wallet: typeof data['wallet'] === 'number' ? data['wallet'] : undefined,
      income: typeof data['income'] === 'number' ? data['income'] : undefined,
      createdAt:
        (data['createdAt'] as string | undefined) ??
        (data['created_at'] as string | undefined),
      updatedAt:
        (data['updatedAt'] as string | null | undefined) ??
        (data['updated_at'] as string | null | undefined) ??
        null,
    };
  }

  private toDate(value: unknown): Date {
    if (!value) {
      return new Date();
    }

    if (value instanceof Date) {
      return value;
    }

    if (
      typeof value === 'object' &&
      value !== null &&
      'toDate' in value &&
      typeof (value as { toDate: () => Date }).toDate === 'function'
    ) {
      return (value as { toDate: () => Date }).toDate();
    }

    const parsed = new Date(value as string | number);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  private normalizePhone(phone: unknown): string {
    return String(phone ?? '').replace(/\D/g, '');
  }
}
