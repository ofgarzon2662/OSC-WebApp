import {
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ToastrService } from 'ngx-toastr';

export const authInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const authService = inject(AuthService);
  const toastr = inject(ToastrService);

  // Only attach token and handle 401 for our own API
  const apiBaseUrl = window.__RUNTIME_CONFIG__?.['API_BASE_URL'] as
    string | undefined;
  const isInternalRequest =
    !request.url.startsWith('http') ||
    request.url.startsWith(window.location.origin) ||
    request.url.startsWith('/api/') ||
    (!!apiBaseUrl && request.url.startsWith(apiBaseUrl));

  if (isInternalRequest) {
    const token = authService.getToken();
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  }

  const isAuthenticationRequest =
    request.url.endsWith('/users/login') ||
    request.url.endsWith('/users/logout');

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error.status === 401 &&
        isInternalRequest &&
        !isAuthenticationRequest &&
        !!authService.getToken()
      ) {
        authService.expireSession();
        toastr.error(
          'Session expired. Please sign in again.',
          'Authentication Error',
        );
      }
      return throwError(() => error);
    }),
  );
};
