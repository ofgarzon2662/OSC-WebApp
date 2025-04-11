import { Routes } from '@angular/router';

export const artifactsRoutes: Routes = [
  {
    path: 'create',
    loadComponent: () => import('./create-artifact/create-artifact.component').then(m => m.CreateArtifactComponent)
  }
]; 