import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { appRoutes } from './app.routes';

// Configuración global de la app de laboratorio `pruebasdti`.
// Aquí centralizamos providers compartidos para que todos los componentes
// de prueba (incluyendo los de `shared-ui`) funcionen con el mismo setup.
export const appConfig: ApplicationConfig = {
  providers: [
    // Manejo de errores globales del navegador.
    provideBrowserGlobalErrorListeners(),
    // Enrutador de Angular (aunque hoy el laboratorio es una sola vista,
    // queda listo para crecer con rutas de demostración por componente).
    provideRouter(appRoutes),
    // Habilita animaciones necesarias para varios componentes PrimeNG.
    provideAnimationsAsync(),
    // Configuración de PrimeNG con tema Aura (modelo moderno PrimeNG v21+).
    providePrimeNG({
      theme: {
        preset: Aura,
      },
    }),
  ],
};
