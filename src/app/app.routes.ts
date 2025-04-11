import { Routes } from '@angular/router';
import { Component } from '@angular/core';
import { authGuard } from './guards/auth.guard';

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

  // Ruta protegida para crear artefactos
  {
    path: 'contribute',
    loadComponent: () => import('./artifacts/create-artifact/create-artifact.component').then(m => m.CreateArtifactComponent),
    canActivate: [authGuard]
  },

  // Ruta de fallback para cualquier ruta no definida
  { path: '**', redirectTo: '' }
];
