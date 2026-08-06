import { Injectable } from '@angular/core';
import { Firestore, addDoc, collection } from '@angular/fire/firestore';
import { FirebaseError } from 'firebase/app';
import { CreateContactMessagePayload } from '../shared/interfaces/contact-message.interface';

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  constructor(private readonly firestore: Firestore) {}

  async createMessage(payload: CreateContactMessagePayload): Promise<void> {
    const contactMessagesRef = collection(this.firestore, 'contactMessages');

    try {
      await addDoc(contactMessagesRef, {
        ...payload,
        createdAt: new Date(),
      });
    } catch (error) {
      if (this.isPermissionDenied(error)) {
        throw new Error(
          'Permissão negada para enviar mensagem. Atualize as regras do Firestore e tente novamente.',
        );
      }

      console.error('Falha ao salvar mensagem de contato', {
        payload,
        error,
      });
      throw error;
    }
  }

  private isPermissionDenied(error: unknown): boolean {
    return error instanceof FirebaseError && error.code === 'permission-denied';
  }
}
