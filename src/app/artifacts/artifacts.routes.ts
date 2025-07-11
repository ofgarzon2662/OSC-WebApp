import { Routes } from '@angular/router';

export const artifactsRoutes: Routes = [
  {
    path: 'create',
    redirectTo: '/contribute',
    pathMatch: 'full'
  }
]; 