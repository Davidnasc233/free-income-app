import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { User } from '../../shared/interfaces/users.interface';
import { Auth } from '@angular/fire/auth';
import { BalanceComponent } from '../../shared/components/balance/balance.component';
import { HistoryTransactionsComponent } from './history-transactions/history-transactions.component';
import { HomeGoalsComponent } from './home-goals/home-goals.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TransactionsComponent } from '../transactions/transactions.component';
import { ViewChild } from '@angular/core';

@Component({
  selector: 'app-home',
  imports: [BalanceComponent, HistoryTransactionsComponent, HomeGoalsComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  user: User | null = null;
  @ViewChild(HistoryTransactionsComponent)
  private historyTransactionsComponent?: HistoryTransactionsComponent;

  constructor(
    private userService: UserService,
    private auth: Auth,
    private readonly modalService: NgbModal,
  ) {
    this.auth = auth;
  }

  openAddTransactionModal() {
    const modalRef = this.modalService.open(TransactionsComponent, {
      centered: true,
      backdropClass: 'user-toolbar-backdrop',
      windowClass: 'transaction-modal',
    });

    modalRef.closed.subscribe((result) => {
      if (result === 'created') {
        void this.historyTransactionsComponent?.refreshTransactions();
      }
    });
  }

  ngOnInit() {
    this.loadCurrentUser();
  }

  async loadCurrentUser(): Promise<void> {
    await this.auth.authStateReady();
    const uid = this.auth.currentUser?.uid;

    if (!uid) return;

    try {
      const userData = await this.userService.getUser(uid);
      this.user = userData;
    } catch (err) {
      console.error('Error fetching user', err);
    }
  }
}
