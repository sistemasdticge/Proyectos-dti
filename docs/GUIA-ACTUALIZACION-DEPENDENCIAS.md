# Guía de actualización de dependencias (Nx + Angular)

Objetivo de esta guía:
- Tener un proceso repetible y seguro para actualizar dependencias del monorepo.
- Minimizar riesgo en producción con validaciones completas.
- Evitar errores ya conocidos en este repositorio.

---

## 1) Alcance y política del equipo

Esta guía cubre:
- Actualización de Nx.
- Actualización de Angular (misma major, por ejemplo 21.1.x -> 21.2.x).
- Actualización de librerías UI relacionadas.
- Validación y publicación por Pull Request.

No cubre (por defecto):
- Cambio de versión de Node.js en el mismo PR de dependencias.

Regla recomendada:
- Node se mantiene estable (actualmente `v24.11.0` en este entorno).
- Si se cambia Node, hacerlo en PR separado.

---

## 2) Preparación (siempre antes de actualizar)

1. Ir a `main` y traer últimos cambios.
2. Crear rama de trabajo nueva.
3. Confirmar versión actual de Node/npm.
4. Verificar que no haya cambios pendientes.

Comandos:

```bash
git checkout main
git pull origin main
git checkout -b chore/update-deps-YYYYMMDD
node --version
npm --version
git status
```

---

## 3) Actualizar Nx (primero)

Comandos:

```bash
npx nx@latest migrate latest
npm install
npx nx migrate --run-migrations --if-exists
```

Notas:
- Si no se genera `migrations.json`, es normal en updates menores.
- Si aparecen conflictos de peer deps, resolver antes de avanzar a Angular.

---

## 4) Actualizar Angular (misma major)

### 4.1 Ver versión objetivo estable

```bash
npm view @angular/core versions --json
```

Elegir la última estable de la major actual.
Ejemplo: `21.2.1`.

### 4.2 Aplicar actualización de paquetes Angular

En este monorepo, usar `npm install` directo en la raíz ha sido el flujo más estable.

```bash
npm install --legacy-peer-deps \
  @angular/animations@21.2.1 \
  @angular/common@21.2.1 \
  @angular/compiler@21.2.1 \
  @angular/core@21.2.1 \
  @angular/forms@21.2.1 \
  @angular/platform-browser@21.2.1 \
  @angular/platform-browser-dynamic@21.2.1 \
  @angular/router@21.2.1 \
  @angular-devkit/core@21.2.1 \
  @angular-devkit/schematics@21.2.1 \
  @angular/build@21.2.1 \
  @angular/cli@21.2.1 \
  @angular/compiler-cli@21.2.1 \
  @angular/language-service@21.2.1 \
  @schematics/angular@21.2.1
```

Después:

```bash
npm install --legacy-peer-deps
```

Importante:
- Los paquetes runtime de Angular (`@angular/core`, `@angular/common`, etc.) deben quedar en `dependencies`.
- Evitar claves duplicadas en `package.json` (ejemplo: `@schematics/angular` duplicado).

---

## 5) Compatibilidad conocida (importante)

Para este repositorio:
- Angular 21 + build actual funciona estable con `tailwindcss@3.4.17`.
- `tailwindcss@4.x` causó ruptura del build en esta base.

Regla práctica:
- No subir a Tailwind 4 en este repo hasta planificar migración específica.

---

## 6) Validación obligatoria

Ejecutar validación completa antes de commit:

```bash
npx nx run-many -t lint,test,build --all --outputStyle=static
```

Si hubo outputs cacheados y quieres confirmar build real:

```bash
npx nx reset
npx nx run IVAIhistorico:build
```

Criterio de aceptación:
- Todos los proyectos en verde (`lint`, `test`, `build`).
- Sin errores nuevos bloqueantes.

---

## 7) Commit, push y PR

```bash
git add .
git commit -m "chore: update dependencies (Nx + Angular)"
git push origin chore/update-deps-YYYYMMDD
```

Crear PR hacia `main` con:
- Qué se actualizó (versiones antes/después).
- Resultado de validación (`lint/test/build`).
- Riesgos o advertencias (si aplica).

---

## 8) Rollback rápido (si algo falla)

Si aún no hiciste push:

```bash
git reset --hard HEAD~1
```

Si ya existe commit y quieres revertir sin reescribir historial:

```bash
git revert <commit_sha>
git push origin <rama>
```

---

## 9) Checklist corta para futuras actualizaciones

- [ ] Crear rama desde `main` actualizado.
- [ ] Actualizar Nx.
- [ ] Actualizar Angular (misma major).
- [ ] Verificar `package.json` sin duplicados.
- [ ] Validar `lint + test + build` en todos los proyectos.
- [ ] Crear PR con resumen técnico.
- [ ] Merge solo cuando todo esté en verde.
