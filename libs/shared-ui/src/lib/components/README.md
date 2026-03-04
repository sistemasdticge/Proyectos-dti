# Componentes Shared UI (Fábrica)

Este documento describe la nueva organización por carpetas y cómo crear componentes clasificados.

## Estructura adoptada

- `libs/shared-ui/src/lib/components/buttons/aceptar`
- `libs/shared-ui/src/lib/components/buttons/eliminar`
- `libs/shared-ui/src/lib/components/buttons/cancelar`

La idea es clasificar por tipo de acción para mantener orden, trazabilidad y escalabilidad.

## Cómo se crearon los botones clasificados

### 1) Generación base con Nx

- `npx nx g @nx/angular:component libs/shared-ui/src/lib/components/buttons/aceptar --export --no-interactive`
- `npx nx g @nx/angular:component libs/shared-ui/src/lib/components/buttons/eliminar --export --no-interactive`
- `npx nx g @nx/angular:component libs/shared-ui/src/lib/components/buttons/cancelar --export --no-interactive`

### 2) Adaptación funcional

Cada botón se adaptó para:

- Importar `ButtonModule` de PrimeNG.
- Exponer un `input()` para personalizar etiqueta.
- Renderizar `p-button` con `styleClass` para aplicar utilidades Tailwind según el tipo de acción.

### 3) Export público

Los componentes quedan exportados desde:

- `libs/shared-ui/src/index.ts`

Esto permite importar limpio con:

- `import { Aceptar, Eliminar, Cancelar } from '@proyectos-dti/shared-ui';`

### 4) Consumo en laboratorio

Uso real en:

- `apps/pruebasdti/src/app/app.ts`
- `apps/pruebasdti/src/app/app.html`

### 5) Validación

- `npx nx lint shared-ui --skip-nx-cache`
- `npx nx test shared-ui --skip-nx-cache`

## Plantilla recomendada para nuevos componentes

1. Definir categoría (por ejemplo `buttons`, `forms`, `tables`).
2. Generar en su carpeta:
  - `npx nx g @nx/angular:component libs/shared-ui/src/lib/components/<categoria>/<nombre> --export`
3. Implementar lógica/UI.
4. Probar en `apps/pruebasdti`.
5. Aprobar y consumir en `apps/Proyectos-dti`.
