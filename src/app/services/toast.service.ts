import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private nextId = 1;
  private readonly toastsSignal = signal<ToastMessage[]>([]);
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  readonly toasts = this.toastsSignal.asReadonly();

  success(message: string, durationMs = 3500): void {
    this.show(message, 'success', durationMs);
  }

  error(message: string, durationMs = 4500): void {
    this.show(message, 'error', durationMs);
  }

  info(message: string, durationMs = 3500): void {
    this.show(message, 'info', durationMs);
  }

  warning(message: string, durationMs = 4000): void {
    this.show(message, 'warning', durationMs);
  }

  dismiss(id: number): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }

    this.toastsSignal.update((items) => items.filter((item) => item.id !== id));
  }

  private show(message: string, type: ToastType, durationMs: number): void {
    const id = this.nextId++;
    this.toastsSignal.update((items) => [...items, { id, type, message }]);

    const timer = setTimeout(() => this.dismiss(id), durationMs);
    this.timers.set(id, timer);
  }
}
