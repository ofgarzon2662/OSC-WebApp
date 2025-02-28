import { Routes } from '@angular/router';

export const routes: Routes = [
  // La ruta vacía muestra el contenido principal que ya está en AppComponent
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', redirectTo: '' }, // Redirigir a la raíz en lugar de usar null
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  }
];
