import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css',
})
export class AuthComponent {
  isLoginView = true;
  private readonly router: Router;

  constructor(router: Router) {
    this.router = router;
    this.syncView(router.url);

    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
      )
      .subscribe((event) => this.syncView(event.urlAfterRedirects));
  }

  private syncView(url: string) {
    this.isLoginView = url.endsWith('/login') || url === '/auth' || url === '/';
  }
}
