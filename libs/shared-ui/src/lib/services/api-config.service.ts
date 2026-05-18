import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ApiConfigService {
  private readonly storageKey = 'sisar.apiBaseUrl';

  readonly urlOptions = [
    { label: 'API (actual)', value: 'http://svr-apps1/sisarback.test/api' },
    { label: 'OPI', value: 'http://svr-apps1/sisarback.test/opi' },
    { label: 'API v1', value: 'http://svr-apps1/sisarback.test/api/v1' },
    { label: 'Service/API', value: 'http://svr-apps1/sisarback.test/service/api' },
    { label: 'SISAR/API', value: 'http://svr-apps1/sisarback.test/sisar/api' },
  ];

  apiBaseUrl = signal<string>(this.getInitialApiUrl());

  setApiBaseUrl(url: string): void {
    const normalized = this.normalizeApiUrl(url);
    this.apiBaseUrl.set(normalized);
    this.persistApiUrl(normalized);
    console.log(`API URL changed to: ${normalized}`);
  }

  getApiBaseUrl(): string {
    return this.apiBaseUrl();
  }

  private getInitialApiUrl(): string {
    const fallback = this.urlOptions[0].value;
    if (typeof window === 'undefined') {
      return fallback;
    }

    try {
      const stored = localStorage.getItem(this.storageKey)?.trim();
      if (!stored) {
        return fallback;
      }

      const normalizedStored = this.normalizeApiUrl(stored, fallback);
      if (normalizedStored !== stored) {
        this.persistApiUrl(normalizedStored);
      }
      return normalizedStored;
    } catch {
      return fallback;
    }
  }

  private normalizeApiUrl(rawUrl: string, fallback = this.urlOptions[0].value): string {
    const trimmed = rawUrl.trim();
    if (!trimmed) {
      return fallback;
    }

    // Permite ingresar "svr-apps1/..." y lo normaliza a "http://svr-apps1/...".
    const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;

    try {
      const parsed = new URL(candidate);
      const normalizedPath = parsed.pathname.replace(/\/+$/, '');
      return `${parsed.protocol}//${parsed.host}${normalizedPath}`;
    } catch {
      return fallback;
    }
  }

  private persistApiUrl(url: string): void {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(this.storageKey, url);
    } catch {
      // Ignorar storage bloqueado.
    }
  }
}
