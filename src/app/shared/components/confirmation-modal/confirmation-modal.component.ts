import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

export type ConfirmationModalType =
  | 'confirmation'
  | 'warning'
  | 'info'
  | 'danger';

export interface ConfirmationModalData {
  type?: ConfirmationModalType;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

@Component({
  selector: 'app-confirmation-modal',
  imports: [CommonModule],
  templateUrl: './confirmation-modal.component.html',
  styleUrl: './confirmation-modal.component.css',
})
export class ConfirmationModalComponent {
  private readonly activeModal = inject(NgbActiveModal, { optional: true });

  type: ConfirmationModalType = 'confirmation';
  title = '';
  description = '';
  confirmLabel = 'Confirmar';
  cancelLabel = 'Cancelar';

  configure(data: ConfirmationModalData): void {
    this.type = data.type ?? 'confirmation';
    this.title = data.title;
    this.description = data.description;
    this.confirmLabel = data.confirmLabel ?? 'Confirmar';
    this.cancelLabel = data.cancelLabel ?? 'Cancelar';
  }

  closeModal(): void {
    this.activeModal?.dismiss('cancel');
  }

  confirm(): void {
    this.activeModal?.close('confirm');
  }
}
