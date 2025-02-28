import { Routes } from '@angular/router';
import { Component } from '@angular/core';

// Componente vacío para la ruta raíz
@Component({
  template: ''
})
export class EmptyComponent {}

export const routes: Routes = [
  // Ruta raíz usa un componente vacío para evitar renderización duplicada
  { path: '', component: EmptyComponent, pathMatch: 'full' },

  // Módulo de autenticación
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  },

  // Ruta de fallback para cualquier ruta no definida
  { path: '**', redirectTo: '' }
];
