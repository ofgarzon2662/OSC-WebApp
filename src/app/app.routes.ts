import { Routes } from '@angular/router';
import { Component } from '@angular/core';

// Componente vacío para la ruta raíz
@Component({
  template: ''
})
export class EmptyComponent {}

export const routes: Routes = [
  // Root path
  { path: '', pathMatch: 'full', children: [] },

  // Módulo de autenticación
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  },

  // Artifacts module
  {
    path: 'artifacts',
    loadChildren: () => import('./artifacts/artifacts.module').then(m => m.ArtifactsModule)
  },

  // Ruta de fallback para cualquier ruta no definida
  { path: '**', redirectTo: '' }
];
