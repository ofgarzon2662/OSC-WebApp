import { Routes } from '@angular/router';
import { Component } from '@angular/core';
import { canCreateArtifactGuard } from './guards/role.guard';

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

  // Ruta protegida para crear artefactos (verifica autenticación y rol)
  {
    path: 'contribute',
    loadComponent: () => import('./artifacts/create-artifact/create-artifact.component').then(m => m.CreateArtifactComponent),
    canActivate: [canCreateArtifactGuard]
  },

  // Ruta para la página de acceso prohibido
  {
    path: 'forbidden',
    loadComponent: () => import('./auth/auth-forbidden/auth-forbidden.component').then(m => m.AuthForbiddenComponent)
  },

  // Ruta de fallback para cualquier ruta no definida
  { path: '**', redirectTo: '' }
];
