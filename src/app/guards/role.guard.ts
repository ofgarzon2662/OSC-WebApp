import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { ToastrService } from 'ngx-toastr';

/**
 * Guard para verificar si un usuario puede crear artifacts
 * Solo usuarios con roles COLLABORATOR o PI pueden crear artifacts
 */
export const canCreateArtifactGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastr = inject(ToastrService);

  // Primero verificamos autenticación
  if (!authService.isAuthenticated()) {
    toastr.info("Please sign in to access this page", "Authentication Required");
    router.navigate(['/auth/sign-in']);
    return false;
  }

  // Luego verificamos permisos
  if (!authService.canCreateArtifact()) {
    toastr.warning(
      "Only members of the organization can submit artifacts",
      "Access Denied"
    );
    router.navigate(['/forbidden']);
    return false;
  }

  return true;
}; 