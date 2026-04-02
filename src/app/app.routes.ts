import { Routes } from '@angular/router';
import { Component } from '@angular/core';
import { canCreateArtifactGuard } from './guards/role.guard';
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

  // list artifacts
  {
    path: 'list-artifacts',
    loadComponent: () => import('./artifacts/list-artifact/list-artifact.component').then(m => m.ListArtifactComponent)
  },

  // list workflows
  {
    path: 'list-workflows',
    loadComponent: () => import('./components/list-workflows/list-workflows.component').then(m => m.ListWorkflowsComponent)
  },

  // Workflow detail
  {
    path: 'workflows/:id',
    loadComponent: () => import('./components/workflow-detail/workflow-detail.component').then(m => m.WorkflowDetailComponent)
  },

  // Create workflow
  {
    path: 'create-workflow',
    loadComponent: () => import('./components/create-workflow/create-workflow.component').then(m => m.CreateWorkflowComponent),
    canActivate: [canCreateArtifactGuard]
  },

  // Update workflow
  {
    path: 'update-workflow/:id',
    loadComponent: () => import('./components/update-workflow/update-workflow.component').then(m => m.UpdateWorkflowComponent),
    canActivate: [canCreateArtifactGuard]
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

  // Artifact detail
  {
    path: 'artifacts/:id',
    loadComponent: () => import('./artifacts/detail-artifact/detail-artifact.component').then(m => m.DetailArtifactComponent)
  },
  // Artifact history (standalone component)
  {
    path: 'artifacts/:id/history',
    loadComponent: () => import('./artifacts/get-history/get-history.component').then(m => m.GetHistoryComponent),
    canActivate: [authGuard]
  },
  // History detail snapshot
  {
    path: 'artifacts/:id/history/:txId',
    loadComponent: () => import('./artifacts/history-detail/history-detail.component').then(m => m.HistoryDetailComponent),
    canActivate: [authGuard]
  },
  // Update artifact
  {
    path: 'update-artifact/:id',
    loadComponent: () => import('./artifacts/update-artifact/update-artifact.component').then(m => m.UpdateArtifactComponent),
    canActivate: [canCreateArtifactGuard]
  },

  // Ruta de fallback para cualquier ruta no definida
  { path: '**', redirectTo: '' }
];
