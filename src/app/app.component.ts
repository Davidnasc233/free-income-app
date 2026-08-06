import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NavBarComponent } from './shared/components/nav-bar/nav-bar.component';
import { ToastHostComponent } from './shared/components/toast-host/toast-host.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavBarComponent, ToastHostComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'my-fintech';

  constructor(private router: Router) {}

  showNavbar(): boolean {
    const path = this.router.url.split('?')[0];
    return !path.startsWith('/auth');
  }
}
