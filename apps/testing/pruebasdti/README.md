# pruebasdti (Laboratorio UI)

Este proyecto se creó para validar el flujo de trabajo de la fábrica de componentes dentro del monorepo Nx.

## ¿Qué se hizo en este proyecto?

1. **Creación del laboratorio**
   - Se generó inicialmente con:
     - `npx nx g @nx/angular:application pruebasdti --no-interactive`

2. **Integración con la librería compartida**
   - Se importaron componentes clasificados (`Aceptar`, `Eliminar`, `Cancelar`) desde el alias:
     - `@proyectos-dti/shared-ui`
   - Archivo de uso principal:
     - `apps/pruebasdti/src/app/app.ts`

3. **Organización por carpetas en fábrica (`shared-ui`)**
   - Los botones quedaron clasificados en:
     - `libs/shared-ui/src/lib/components/buttons/aceptar`
     - `libs/shared-ui/src/lib/components/buttons/eliminar`
     - `libs/shared-ui/src/lib/components/buttons/cancelar`

4. **Pantalla de prueba mínima**
   - Se reemplazó la plantilla inicial por una vista simple para pruebas visuales.
   - Archivo:
     - `apps/pruebasdti/src/app/app.html`

5. **Configuración moderna de PrimeNG (v21+)**
   - Se configuró PrimeNG por provider (no por imports legacy de `resources`).
   - Archivo:
     - `apps/pruebasdti/src/app/app.config.ts`
   - Providers aplicados:
     - `provideAnimationsAsync()`
     - `providePrimeNG({ theme: { preset: Aura } })`

6. **Estilos globales del laboratorio**
   - Se mantuvo Tailwind y `primeicons` en:
     - `apps/pruebasdti/src/styles.scss`

7. **Pruebas y validación**
   - Lint:
     - `npx nx lint pruebasdti --skip-nx-cache`
   - Unit test:
     - `npx nx test pruebasdti --skip-nx-cache`
   - Build:
     - `npx nx build pruebasdti --configuration=development --skip-nx-cache`

## Movimiento a carpeta apps/

Originalmente el proyecto se creó en raíz por el valor de `directory` del generador.
Luego se movió correctamente con Nx:

- `npx nx g @nx/workspace:move --projectName=pruebasdti --destination=apps/pruebasdti --no-interactive`

## Flujo de uso diario

1. Fabricar componente en `libs/shared-ui`.
2. Exportarlo en `libs/shared-ui/src/index.ts`.
3. Probarlo en este laboratorio (`apps/pruebasdti`).
4. Si se aprueba, usarlo en `apps/Proyectos-dti`.
