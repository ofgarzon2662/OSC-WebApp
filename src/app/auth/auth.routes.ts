import { Routes } from '@angular/router';
import { SignInComponent } from './sign-in/sign-in.component';

export const authRoutes: Routes = [
  { path: '', redirectTo: 'sign-in', pathMatch: 'full' },
  { path: 'sign-in', component: SignInComponent }
];
