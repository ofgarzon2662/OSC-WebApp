import { Routes } from '@angular/router';

export const routes: Routes = [
  // Root path
  { path: '', pathMatch: 'full', children: [] },

  // Módulo de autenticación
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  },

  // Ruta de fallback para cualquier ruta no definida
  { path: '**', redirectTo: '' }
];
