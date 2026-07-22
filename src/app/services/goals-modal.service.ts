import { Injectable } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Goals } from '../shared/interfaces/goals.interface';
import { ModalActionGoalComponent } from '../features/goals/modal-action-goal/modal-action-goal.component';

export type GoalListItem = Goals & { id: string };

@Injectable({
  providedIn: 'root',
})
export class GoalsModalService {
  constructor(private readonly modalService: NgbModal) {}

  openCreate(): NgbModalRef {
    const modalRef = this.modalService.open(ModalActionGoalComponent, {
      centered: true,
      backdropClass: 'user-toolbar-backdrop',
      windowClass: 'goal-action-modal',
    });

    modalRef.componentInstance.configureForCreate();
    return modalRef;
  }

  openEdit(goal: GoalListItem): NgbModalRef {
    const modalRef = this.modalService.open(ModalActionGoalComponent, {
      centered: true,
      backdropClass: 'user-toolbar-backdrop',
      windowClass: 'goal-action-modal',
    });

    modalRef.componentInstance.configureForEdit(goal);
    return modalRef;
  }
}
