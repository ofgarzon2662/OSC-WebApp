import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { authInterceptor } from './interceptors/auth.interceptor';
import { ToastrModule } from 'ngx-toastr';
import { loadRuntimeConfig } from './config/runtime-config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    provideAnimations(),
    provideClientHydration(),
    importProvidersFrom(
      ToastrModule.forRoot({
        positionClass: 'toast-bottom-right',
        preventDuplicates: true,
        timeOut: 3000
      })
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => loadRuntimeConfig(),
      multi: true
    }
  ]
};
