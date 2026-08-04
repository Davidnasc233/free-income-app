export type ContactMessageCategory =
  | 'duvida'
  | 'sugestao'
  | 'erro'
  | 'parceria'
  | 'outro';

export interface ContactMessage {
  userId: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  category: ContactMessageCategory;
  createdAt: Date;
}

export type CreateContactMessagePayload = Omit<ContactMessage, 'createdAt'>;
