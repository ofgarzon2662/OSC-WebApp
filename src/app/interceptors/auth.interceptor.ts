import {
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { ToastrService } from 'ngx-toastr';

export const authInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastr = inject(ToastrService);

  // Only attach token and handle 401 for our own API (relative URLs or same-origin absolute URLs)
  const isInternalRequest = !request.url.startsWith('http')
    || request.url.startsWith(window.location.origin)
    || request.url.startsWith('/api/');

  if (isInternalRequest) {
    const token = authService.getToken();
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && isInternalRequest && !request.url.endsWith('/logout')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.navigate(['/auth/sign-in']);
        toastr.error('Session expired. Please sign in again.', 'Authentication Error');
      }
      return throwError(() => error);
    })
  );
};
