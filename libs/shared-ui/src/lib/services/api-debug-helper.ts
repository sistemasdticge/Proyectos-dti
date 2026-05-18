/**
 * ⚙️ Helper para debugging de API en consola del navegador
 *
 * USO EN CONSOLA (F12):
 *
 * 1. Ver URL actual:
 *    window.apiDebug.getCurrentUrl()
 *
 * 2. Cambiar a /api:
 *    window.apiDebug.useApi()
 *
 * 3. Cambiar a /opi:
 *    window.apiDebug.useOpi()
 *
 * 4. Ver todas las opciones:
 *    window.apiDebug.listOptions()
 *
 * 5. Cambiar a URL personalizada:
 *    window.apiDebug.setUrl('http://svr-apps1/sisarback.test/api')
 */

import { ApiConfigService } from './api-config.service';

declare global {
  interface Window {
    apiDebug: ApiDebugHelper;
  }
}

export class ApiDebugHelper {
  private apiConfig: ApiConfigService;

  constructor(apiConfig: ApiConfigService) {
    this.apiConfig = apiConfig;
  }

  getCurrentUrl(): string {
    console.log('📍 URL Actual:', this.apiConfig.getApiBaseUrl());
    return this.apiConfig.getApiBaseUrl();
  }

  useApi(): void {
    const url = 'http://svr-apps1/sisarback.test/api';
    this.apiConfig.setApiBaseUrl(url);
    console.log(`✅ Cambiado a /api: ${url}`);
  }

  useOpi(): void {
    const url = 'http://svr-apps1/sisarback.test/opi';
    this.apiConfig.setApiBaseUrl(url);
    console.log(`✅ Cambiado a /opi: ${url}`);
  }

  setUrl(url: string): void {
    this.apiConfig.setApiBaseUrl(url);
    console.log(`✅ URL actualizada: ${url}`);
  }

  listOptions(): void {
    console.log('%c🔧 OPCIONES DE API DISPONIBLES:', 'font-size:14px;font-weight:bold;color:#8B1A2E;');
    this.apiConfig.urlOptions.forEach((opt: { label: string; value: string }, idx: number) => {
      const isCurrent = opt.value === this.getCurrentUrl() ? ' ✅ ACTUAL' : '';
      console.log(`  ${idx + 1}. ${opt.label}${isCurrent}\n     ${opt.value}`);
    });
  }

  help(): void {
    console.log(`
%c⚙️ API DEBUG HELPER - COMANDOS DISPONIBLES

%cVer URL actual:%c
  window.apiDebug.getCurrentUrl()

%cListar opciones:%c
  window.apiDebug.listOptions()

%cCambiar a /api:%c
  window.apiDebug.useApi()

%cCambiar a /opi:%c
  window.apiDebug.useOpi()

%cCambiar a URL personalizada:%c
  window.apiDebug.setUrl('http://svr-apps1/sisarback.test/tu-endpoint')

%cLuego intenta crear un tema nuevamente y chequea la consola para ver el resultado.
`,
      'font-size:14px;font-weight:bold;color:#8B1A2E;',
      'font-weight:bold;',
      'color:gray;',
      'font-weight:bold;',
      'color:gray;',
      'font-weight:bold;',
      'color:gray;',
      'font-weight:bold;',
      'color:gray;',
      'font-weight:bold;',
      'color:gray;',
      'font-style:italic;color:#666;'
    );
  }
}

/**
 * Registrar el helper en window cuando la app inicia
 * Llamar esto desde app.config.ts o main.ts
 */
export function registerApiDebugHelper(apiConfig: ApiConfigService): void {
  if (!window.apiDebug) {
    window.apiDebug = new ApiDebugHelper(apiConfig);
    console.log('%c✅ API Debug Helper registrado. Escribe: window.apiDebug.help()', 'color:#28a745;font-weight:bold;');
  }
}
