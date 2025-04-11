import { Routes } from '@angular/router';
import { authGuard } from '../guards/auth.guard';

export const artifactsRoutes: Routes = [
  {
    path: 'create',
    redirectTo: '/contribute',
    pathMatch: 'full'
  }
]; 