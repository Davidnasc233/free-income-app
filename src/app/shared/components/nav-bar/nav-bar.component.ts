import { Component, HostListener, TemplateRef } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { UserToolbarComponent } from '../user-toolbar/user-toolbar.component';

@Component({
  selector: 'app-nav-bar',
  imports: [UserToolbarComponent, RouterModule],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.css',
})
export class NavBarComponent {
  private activeModalRef: NgbModalRef | null = null;
  private activeAnchorElement: HTMLElement | null = null;

  constructor(private readonly modalService: NgbModal) {}

  openUserToolbarModal(
    content: TemplateRef<unknown>,
    anchorElement: HTMLElement,
  ) {
    this.activeAnchorElement = anchorElement;
    this.updateModalAnchorPosition();

    this.activeModalRef = this.modalService.open(content, {
      centered: false,
      windowClass: 'user-toolbar-modal',
      modalDialogClass: 'user-toolbar-dialog',
      backdropClass: 'user-toolbar-backdrop',
    });

    setTimeout(() => this.updateModalAnchorPosition());

    this.activeModalRef.closed.subscribe(() => this.clearModalState());
    this.activeModalRef.dismissed.subscribe(() => this.clearModalState());
  }

  @HostListener('window:resize')
  @HostListener('window:scroll')
  keepModalAligned() {
    if (this.activeModalRef && this.activeAnchorElement) {
      this.updateModalAnchorPosition();
    }
  }

  closeUserToolbarModal(): void {
    this.activeModalRef?.close();
  }

  private clearModalState() {
    this.activeModalRef = null;
    this.activeAnchorElement = null;
  }

  private updateModalAnchorPosition() {
    if (!this.activeAnchorElement) {
      return;
    }

    const anchorRect = this.activeAnchorElement.getBoundingClientRect();
    const modalWidth = 280;
    const modalHeight = 260;
    const viewportPadding = 12;
    const offset = 8;

    const maxLeft = window.innerWidth - modalWidth - viewportPadding;
    const preferredLeft = anchorRect.right - modalWidth;
    const left = Math.min(Math.max(viewportPadding, preferredLeft), maxLeft);

    const hasSpaceBelow =
      window.innerHeight - anchorRect.bottom >= modalHeight + offset;
    const top = hasSpaceBelow
      ? anchorRect.bottom + offset
      : Math.max(viewportPadding, anchorRect.top - modalHeight - offset);

    document.documentElement.style.setProperty(
      '--user-toolbar-left',
      `${left}px`,
    );
    document.documentElement.style.setProperty(
      '--user-toolbar-top',
      `${top}px`,
    );
  }
}
