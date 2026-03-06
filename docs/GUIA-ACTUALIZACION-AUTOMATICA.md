# Guía de actualización automática (Node + Nx + Angular + dependencias)

Esta guía deja el workspace actualizado con un flujo automático y controlado por PR.

## Qué se configuró

- Versionado de Node en `.nvmrc`.
- Restricción de versiones en `package.json` (`engines`).
- `Dependabot` semanal para dependencias npm y GitHub Actions.
- Workflow mensual de migraciones Nx/Angular con PR automático.

## Paso a paso para usarlo

1. **Asegura GitHub Actions habilitado en el repositorio**
   - GitHub Repo -> `Settings` -> `Actions` -> permitir ejecución de workflows.

2. **Sube estos cambios al repositorio remoto**
   - Crea rama y push.
   - Abre PR y haz merge.

3. **Verifica Dependabot**
   - GitHub Repo -> `Insights` -> `Dependency graph` -> `Dependabot`.
   - Debe empezar a abrir PRs semanales automáticamente.

4. **Ejecuta el workflow manualmente la primera vez**
   - GitHub Repo -> `Actions` -> `Monthly Nx and Angular Migrate`.
   - Click en `Run workflow`.

5. **Revisa el PR automático de migraciones**
   - Confirma que el PR creado por el workflow tiene cambios en dependencias/migrations.
   - Valida CI del PR.

6. **Mergea el PR si todo está en verde**
   - Esto aplica migraciones de Nx/Angular sin hacerlo manual cada mes.

## Comandos locales útiles

- Generar plan de migración:
  - `npm run update:nx:latest`
- Ejecutar migraciones pendientes:
  - `npm run update:nx:run-migrations`
- Validar workspace completo:
  - `npm run verify:workspace`

## Recomendación operativa

- Deja `Dependabot` para updates frecuentes (parches/minors).
- Deja el workflow mensual para cambios con migraciones de Nx/Angular.
- Nunca hagas update masivo directo a `main`; usa siempre PR y CI.
