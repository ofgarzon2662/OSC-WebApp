import { Routes } from '@angular/router';
import { AppComponent } from './app.component';

export const routes: Routes = [
  // Ruta raíz redirige a home
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // Ruta home usa AppComponent como página de inicio
  { path: 'home', component: AppComponent },

  // Módulo de autenticación
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  },

  // Ruta de fallback para cualquier ruta no definida
  { path: '**', redirectTo: 'home' }
];
