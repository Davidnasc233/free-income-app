import { Routes } from '@angular/router';
import { AuthComponent } from './features/auth/auth.component';
import { AuthLoginComponent } from './features/auth/login/login.component';
import { AuthRegisterComponent } from './features/auth/register/register.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { HomeComponent } from './features/home/home.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'auth/login' },
  {
    path: 'auth',
    component: AuthComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'login' },
      { path: 'login', component: AuthLoginComponent },
      { path: 'register', component: AuthRegisterComponent },
    ],
  },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'home', component: HomeComponent },
  { path: '**', redirectTo: 'auth/login' },
];
