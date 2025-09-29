import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: Record<string, unknown>;
  }
}

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  private readonly configUrl = 'assets/runtime-config.json';

  constructor(private readonly http: HttpClient) {}

  async load(): Promise<void> {
    try {
      const config = await firstValueFrom(
        this.http.get<Record<string, unknown>>(this.configUrl).pipe(
          catchError(() => of({}))
        )
      );
      window.__RUNTIME_CONFIG__ = config ?? {};
    } catch {
      window.__RUNTIME_CONFIG__ = {};
    }
  }

  get<T = unknown>(key: string, defaultValue?: T): T | undefined {
    const value = window.__RUNTIME_CONFIG__?.[key] as T | undefined;
    return value ?? defaultValue;
  }
}


