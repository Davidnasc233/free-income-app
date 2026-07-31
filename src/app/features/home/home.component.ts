import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { User } from '../../shared/interfaces/users.interface';
import { Auth } from '@angular/fire/auth';
import { BalanceComponent } from '../../shared/components/balance/balance.component';
import { HistoryTransactionsComponent } from './history-transactions/history-transactions.component';
import { HomeGoalsComponent } from './home-goals/home-goals.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TransactionFormModalComponent } from '../transactions/transaction-form-modal/transaction-form-modal.component';
import { CommonModule } from '@angular/common';
import { PageStateComponent } from '../../shared/components/page-state/page-state.component';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-home',
  imports: [
    BalanceComponent,
    HistoryTransactionsComponent,
    HomeGoalsComponent,
    CommonModule,
    PageStateComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  user: User | null = null;
  today: Date = new Date();
  isLoading = true;
  loadError: string | null = null;
  @ViewChild(BalanceComponent)
  private balanceComponent?: BalanceComponent;
  @ViewChild(HistoryTransactionsComponent)
  private historyTransactionsComponent?: HistoryTransactionsComponent;

  constructor(
    private userService: UserService,
    private auth: Auth,
    private readonly modalService: NgbModal,
    private readonly router: Router,
    private readonly toast: ToastService,
  ) {
    this.auth = auth;
  }

  openAddTransactionModal() {
    const modalRef = this.modalService.open(TransactionFormModalComponent, {
      centered: true,
      backdropClass: 'user-toolbar-backdrop',
      windowClass: 'transaction-modal',
    });

    modalRef.closed.subscribe((result) => {
      if (result === 'created') {
        void this.historyTransactionsComponent?.refreshTransactions();
        void this.balanceComponent?.refreshBalance();
      }
    });
  }

  redirectTo(url: string): void {
    void this.router.navigateByUrl(`/${url}`);
  }

  ngOnInit() {
    this.loadCurrentUser();
  }

  async loadCurrentUser(): Promise<void> {
    this.isLoading = true;
    this.loadError = null;

    await this.auth.authStateReady();
    const uid = this.auth.currentUser?.uid;

    if (!uid) {
      this.loadError = 'Usuario nao autenticado.';
      this.isLoading = false;
      return;
    }

    try {
      const userData = await this.userService.getUser(uid);

      if (!userData) {
        this.loadError = 'Perfil nao encontrado.';
        return;
      }

      this.user = userData;
    } catch (err) {
      console.error('Error fetching user', err);
      this.loadError = 'Nao foi possivel carregar a pagina inicial.';
      this.toast.error('Nao foi possivel carregar a pagina inicial.');
    } finally {
      this.isLoading = false;
    }
  }
}
