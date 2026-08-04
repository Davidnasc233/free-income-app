import { Injectable } from '@angular/core';
import {
  Auth,
  EmailAuthProvider,
  GoogleAuthProvider,
  User as AuthUser,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
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

  async ensureGoogleUserProfile(authUser: AuthUser): Promise<void> {
    const uid = authUser.uid;
    const userRef = doc(this.firestore, 'users', uid);
    const docSnap = await getDoc(userRef);

    const displayName = authUser.displayName?.trim() ?? '';
    const email = authUser.email?.trim().toLowerCase() ?? '';

    if (!docSnap.exists()) {
      await setDoc(userRef, {
        name: displayName,
        email,
        birthDay: null,
        phone: '',
        wallet: 0,
        income: 0,
        createdAt: new Date().toISOString(),
        updatedAt: null,
      });
      return;
    }

    const currentData = docSnap.data();
    const patch: Record<string, unknown> = {};

    if (!this.isNonEmptyString(currentData['name']) && displayName) {
      patch['name'] = displayName;
    }

    if (!this.isNonEmptyString(currentData['email']) && email) {
      patch['email'] = email;
    }

    if (Object.keys(patch).length > 0) {
      patch['updatedAt'] = new Date().toISOString();
      await updateDoc(userRef, patch);
    }
  }

  async isProfileComplete(uid: string): Promise<boolean> {
    const userRef = doc(this.firestore, 'users', uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      return false;
    }

    const data = docSnap.data();

    return (
      this.isNonEmptyString(data['name'], 3) &&
      this.isValidEmail(data['email']) &&
      this.isValidBirthDay(data['birthDay']) &&
      this.isValidPhone(data['phone'])
    );
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

  hasPasswordProvider(): boolean {
    return (
      this.auth.currentUser?.providerData.some(
        (provider) => provider.providerId === 'password',
      ) ?? false
    );
  }

  hasGoogleProvider(): boolean {
    return (
      this.auth.currentUser?.providerData.some(
        (provider) => provider.providerId === 'google.com',
      ) ?? false
    );
  }

  async reauthenticateWithPassword(password: string): Promise<void> {
    const currentUser = this.auth.currentUser;
    if (!currentUser?.email) {
      throw new Error('Usuário não autenticado.');
    }

    const credential = EmailAuthProvider.credential(
      currentUser.email,
      password,
    );
    await reauthenticateWithCredential(currentUser, credential);
  }

  async reauthenticateWithGoogle(): Promise<void> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      throw new Error('Usuário não autenticado.');
    }

    await reauthenticateWithPopup(currentUser, new GoogleAuthProvider());
  }

  async updateProfile(uid: string, data: UserProfileUpdate): Promise<void> {
    const currentAuthUser = this.auth.currentUser;
    if (!currentAuthUser || currentAuthUser.uid !== uid) {
      throw new Error('Usuário não autenticado.');
    }

    const nextEmail = data.email.trim().toLowerCase();
    const currentEmail = (currentAuthUser.email ?? '').toLowerCase();
    const emailChanged = currentEmail !== nextEmail;

    // Auth first so Firestore never diverges if email update fails.
    if (emailChanged) {
      await updateEmail(currentAuthUser, nextEmail);
    }

    await updateProfile(currentAuthUser, {
      displayName: data.name.trim(),
    });

    const userRef = doc(this.firestore, 'users', uid);
    const phone = this.normalizePhone(data.phone);

    await updateDoc(userRef, {
      name: data.name.trim(),
      email: nextEmail,
      birthDay: data.birthDay,
      phone,
      income: data.income ?? 0,
      updatedAt: new Date().toISOString(),
    });
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

  private isNonEmptyString(value: unknown, minLength = 1): boolean {
    return typeof value === 'string' && value.trim().length >= minLength;
  }

  private isValidEmail(value: unknown): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  private isValidPhone(value: unknown): boolean {
    const digits = this.normalizePhone(value);
    return digits.length === 10 || digits.length === 11;
  }

  private isValidBirthDay(value: unknown): boolean {
    const date = this.toDateOrNull(value);

    if (!date) {
      return false;
    }

    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < date.getDate())
    ) {
      age--;
    }

    return age >= 13;
  }

  private toDateOrNull(value: unknown): Date | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    if (
      typeof value === 'object' &&
      value !== null &&
      'toDate' in value &&
      typeof (value as { toDate: () => Date }).toDate === 'function'
    ) {
      const parsedFromTimestamp = (value as { toDate: () => Date }).toDate();
      return Number.isNaN(parsedFromTimestamp.getTime())
        ? null
        : parsedFromTimestamp;
    }

    const parsed = new Date(value as string | number);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
}
