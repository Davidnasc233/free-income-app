import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { User } from '../../shared/interfaces/users.interface';
import { Auth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { BalanceComponent } from "../../shared/components/balance/balance.component";

@Component({
  selector: 'app-home',
  imports: [BalanceComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  user: User | null = null;
  private userSub!: Subscription;

  constructor(
    private userService: UserService,
    private auth: Auth,
  ) {
    this.auth = auth;
  }

  ngOnInit() {
    this.loadCurrentUser();
  }

  async loadCurrentUser(): Promise<void> {
    const uid = this.auth.currentUser?.uid;

    if (!uid) return;

    try {
      const userData = await this.userService.getUser(uid);
      this.user = userData;
      console.log(this.user);
    } catch (err) {
      console.error('Error fetching user', err);
    }
  }
}
