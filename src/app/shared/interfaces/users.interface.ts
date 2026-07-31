export interface User {
  id?: string;
  name: string;
  email: string;
  birthDay: Date;
  /** Dígitos do telefone (ex.: 11999998888). Pode vir como number em docs antigos. */
  phone: string;
  wallet?: number;
  income?: number;
  createdAt?: string;
  updatedAt?: string | null;
}

export type UserProfileUpdate = Pick<
  User,
  'name' | 'email' | 'birthDay' | 'phone' | 'income'
>;
