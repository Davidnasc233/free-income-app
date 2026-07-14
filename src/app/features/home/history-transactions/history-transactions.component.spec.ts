import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';

import { HistoryTransactionsComponent } from './history-transactions.component';
import { TransactionService } from '../../../services/transaction.service';

describe('HistoryTransactionsComponent', () => {
  let component: HistoryTransactionsComponent;
  let fixture: ComponentFixture<HistoryTransactionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryTransactionsComponent],
      providers: [
        {
          provide: TransactionService,
          useValue: {
            getRecentByUserId: jasmine
              .createSpy('getRecentByUserId')
              .and.resolveTo([]),
          },
        },
        {
          provide: Auth,
          useValue: {
            currentUser: { uid: 'test-user' },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HistoryTransactionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
