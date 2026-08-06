import { Routes } from '@angular/router';
import { AuthComponent } from './features/auth/auth.component';
import { AuthLoginComponent } from './features/auth/login/login.component';
import { AuthRegisterComponent } from './features/auth/register/register.component';
import { AuthForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { GoalsComponent } from './features/goals/goals.component';
import { HomeComponent } from './features/home/home.component';
import { TransactionsComponent } from './features/transactions/transactions.component';
import { GraphicsComponent } from './features/graphics/graphics.component';
import { UserSettingsComponent } from './features/user-settings/user-settings.component';
import { ContactComponent } from './features/contact/contact.component';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'auth/login' },
  {
    path: 'auth',
    component: AuthComponent,
    canActivate: [guestGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'login' },
      { path: 'login', component: AuthLoginComponent },
      { path: 'register', component: AuthRegisterComponent },
      { path: 'forgot-password', component: AuthForgotPasswordComponent },
    ],
  },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'goals', component: GoalsComponent, canActivate: [authGuard] },
  {
    path: 'transactions',
    component: TransactionsComponent,
    canActivate: [authGuard],
  },
  {
    path: 'graphics',
    component: GraphicsComponent,
    canActivate: [authGuard],
  },
  {
    path: 'settings',
    component: UserSettingsComponent,
    canActivate: [authGuard],
  },
  {
    path: 'contact',
    component: ContactComponent,
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: 'auth/login' },
];
