import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  ConfirmationModalComponent,
  ConfirmationModalData,
} from '../shared/components/confirmation-modal/confirmation-modal.component';

@Injectable({
  providedIn: 'root',
})
export class ConfirmationModalService {
  constructor(private readonly modalService: NgbModal) {}

  open(data: ConfirmationModalData) {
    const modalRef = this.modalService.open(ConfirmationModalComponent, {
      centered: true,
      backdropClass: 'user-toolbar-backdrop',
      windowClass: 'confirmation-modal-window',
    });

    modalRef.componentInstance.configure(data);
    return modalRef;
  }

  async confirm(data: ConfirmationModalData): Promise<boolean> {
    const modalRef = this.open(data);

    try {
      const result = await modalRef.result;
      return result === 'confirm';
    } catch {
      return false;
    }
  }
}
