import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  ReauthModalComponent,
  ReauthModalData,
  ReauthModalResult,
} from '../shared/components/reauth-modal/reauth-modal.component';

@Injectable({
  providedIn: 'root',
})
export class ReauthModalService {
  constructor(private readonly modalService: NgbModal) {}

  async prompt(data: ReauthModalData): Promise<ReauthModalResult | null> {
    const modalRef = this.modalService.open(ReauthModalComponent, {
      centered: true,
      backdropClass: 'user-toolbar-backdrop',
      windowClass: 'confirmation-modal-window',
    });

    modalRef.componentInstance.configure(data);

    try {
      return (await modalRef.result) as ReauthModalResult;
    } catch {
      return null;
    }
  }
}
