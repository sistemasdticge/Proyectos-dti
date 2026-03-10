# Proyectos DTI - Manual Detallado (Paso a Paso)

## Objetivo de esta arquitectura

1. Construir componentes UI reutilizables en la fábrica: `libs/shared-ui`
2. Probar esos componentes primero en laboratorio: `apps/testing/pruebasdti`
3. Usarlos en la app oficial cuando estén aprobados: `apps/production/Proyectos-dti`


## 1) Estructura del monorepo (qué es cada carpeta)

### `apps/`

Aquí viven aplicaciones ejecutables.


### `libs/`

Aquí vive código compartido.


## Guías complementarias

- Guía de estilos y personalización de componentes (Tailwind + PrimeNG): `docs/GUIA-TAILWIND-PRIMENG.md`
- Guía para actualizaciones futuras de Nx y Angular: `docs/GUIA-ACTUALIZACION-DEPENDENCIAS.md`

---

## 2) Reglas importantes antes de empezar

1. **No crear componentes reutilizables dentro de `apps/`**.
2. Los componentes de negocio compartidos se crean en `libs/shared-ui`.
3. Todo componente nuevo debe exportarse en `libs/shared-ui/src/index.ts`.
4. Todo componente nuevo debe probarse primero en `pruebasdti`.

---

## 3) Cómo crear una app nueva (explicación línea por línea)

### 3.1 Crear una app de laboratorio

```bash
npx nx g @nx/angular:application apps/testing/<NOMBRE_APP_TEST> --no-interactive
```

#### Qué debes cambiar

- Reemplaza `<NOMBRE_APP_TEST>` por el nombre real.
  - Ejemplo: `<NOMBRE_APP_TEST>` → `laboratorio-finanzas`

#### Qué significa cada parte del comando

- `npx nx g` → ejecuta un generador de Nx
- `@nx/angular:application` → tipo de proyecto: app Angular
- `apps/testing/...` → ruta donde se creará (entorno testing)
- `--no-interactive` → evita preguntas en consola (útil para estandarizar)

### 3.2 Crear una app oficial de producción

```bash
npx nx g @nx/angular:application apps/production/<NOMBRE_APP_PROD> --no-interactive
```

#### Qué debes cambiar

- Reemplaza `<NOMBRE_APP_PROD>` por el nombre real de tu app oficial.

### 3.3 Verificar que Nx sí registró el proyecto

```bash
npx nx show projects
```

Si quieres revisar un proyecto puntual:

```bash
npx nx show project <NOMBRE_PROYECTO>
```

---

## 4) Cómo crear un componente en la fábrica (muy detallado)

### 4.1 Dónde se crean

Todos los componentes compartidos deben vivir dentro de:

`libs/shared-ui/src/lib/components`

### 4.2 Organización por carpetas (convención del equipo)

- `buttons/`
- `inputs/`
- `tables/`
- `selects/`
- `cards/`
- `badges/`
- `modals/`

### 4.2.1 Crear carpetas de categorías (PASO A PASO)

Si la carpeta de categoría **no existe**, tienes dos opciones:

#### Opción A (manual en VS Code)

1. Ir a `libs/shared-ui/src/lib/components`
2. Clic derecho → **New Folder**
3. Crear carpeta con nombre en minúsculas (ejemplo: `inputs`)

#### Opción B (automática por script)

No necesitas crearla manualmente. Si ejecutas:

```bash
npm run g:shared-ui -- --categoria=inputs --tipo=fecha --nombre=fecha
```

El script crea `inputs/` automáticamente si no existe.

### 4.2.2 Crear subcarpeta por tipo de componente

Dentro de cada categoría, usamos una carpeta por tipo.

Ejemplo para botones:

- `buttons/aceptar/`
- `buttons/eliminar/`
- `buttons/cancelar/`

Esto permite orden y control por funcionalidad.

### 4.3 Crear componente botón (plantilla)

```bash
npx nx g @nx/angular:component libs/shared-ui/src/lib/components/buttons/<TIPO_BOTON>/<NOMBRE_COMPONENTE> --export --no-interactive
```

#### Qué debes cambiar

- `<TIPO_BOTON>`: carpeta funcional (ej. `eliminar`, `aceptar`, `guardar`)
- `<NOMBRE_COMPONENTE>`: nombre del componente (normalmente igual a la carpeta)

#### Ejemplo real

```bash
npx nx g @nx/angular:component libs/shared-ui/src/lib/components/buttons/eliminar/eliminar --export --no-interactive
```

#### Qué hace `--export`

Le indica a Nx que agregue la exportación automáticamente en `libs/shared-ui/src/index.ts`.

### 4.4 Automatización del equipo (recomendada)

Se agregó un script para estandarizar la creación de componentes y evitar errores de ruta:

```bash
npm run g:shared-ui -- --categoria=<CATEGORIA> --tipo=<TIPO> --nombre=<NOMBRE_COMPONENTE>
```

#### Qué debes cambiar

- `<CATEGORIA>`: carpeta principal de componentes
	- ejemplos: `buttons`, `inputs`, `tables`, `selects`
- `<TIPO>`: subcarpeta funcional del componente
	- ejemplos: `eliminar`, `aceptar`, `fecha`, `estado`
- `<NOMBRE_COMPONENTE>`: nombre técnico del componente
	- recomendación: usar el mismo valor que `<TIPO>`

#### Ejemplo real (botón eliminar)

```bash
npm run g:shared-ui -- --categoria=buttons --tipo=eliminar --nombre=eliminar
```

#### Qué hace esta automatización

1. Valida nombres (solo minúsculas, números y guiones).
2. Crea la carpeta de categoría si no existe.
3. Ejecuta el generador Nx en la ruta correcta.
4. Fuerza exportación al `index.ts` usando `--export`.
5. Verifica que el export exista en `libs/shared-ui/src/index.ts`.

### 4.6 Flujo guiado “desde cero” (copiar y ejecutar)

Si la persona no sabe nada, puede seguir exactamente estos pasos:

1. Verificar que está en la raíz del repo (donde está `package.json`).
2. Instalar dependencias:

```bash
npm install
```

3. Crear componente de ejemplo (botón eliminar):

```bash
npm run g:shared-ui -- --categoria=buttons --tipo=eliminar --nombre=eliminar
```

4. Confirmar que existe la carpeta y archivos:

- `libs/shared-ui/src/lib/components/buttons/eliminar/eliminar.ts`
- `libs/shared-ui/src/lib/components/buttons/eliminar/eliminar.html`
- `libs/shared-ui/src/lib/components/buttons/eliminar/eliminar.css`
- `libs/shared-ui/src/lib/components/buttons/eliminar/eliminar.spec.ts`

5. Confirmar export en `libs/shared-ui/src/index.ts`.
6. Importar componente en `apps/testing/pruebasdti/src/app/app.ts`.
7. Usarlo en `apps/testing/pruebasdti/src/app/app.html`.
8. Validar:

```bash
npx nx lint shared-ui
npx nx test shared-ui
npx nx serve pruebasdti
```

#### Ayuda del script

```bash
npm run g:shared-ui:help
```

### 4.5 Estructura final esperada por componente

Para `buttons/eliminar/eliminar`, debes ver:

- `libs/shared-ui/src/lib/components/buttons/eliminar/eliminar.ts`
- `libs/shared-ui/src/lib/components/buttons/eliminar/eliminar.html`
- `libs/shared-ui/src/lib/components/buttons/eliminar/eliminar.css`
- `libs/shared-ui/src/lib/components/buttons/eliminar/eliminar.spec.ts`

---

## 5) Cómo importar el componente en una app

### 5.1 Verifica exportación en la librería

En `libs/shared-ui/src/index.ts` debe existir una línea como:

```ts
export * from './lib/components/buttons/eliminar/eliminar';
```

### 5.2 Importar en el componente de la app

Archivo típico: `apps/testing/pruebasdti/src/app/app.ts`

```ts
import { Eliminar } from '@proyectos-dti/shared-ui';
```

#### Importante

- `@proyectos-dti/shared-ui` es un alias configurado en `tsconfig.base.json`.
- No importes usando rutas largas de `../../../../libs/...`.

### 5.3 Agregarlo al arreglo `imports` del `@Component`

```ts
@Component({
  imports: [Eliminar],
  ...
})
```

### 5.4 Usarlo en el HTML

Archivo típico: `apps/testing/pruebasdti/src/app/app.html`

```html
<lib-eliminar label="Eliminar"></lib-eliminar>
```

---

## 6) Plantilla completa para crear cualquier componente reutilizable

Usa este bloque como checklist:

1. Elegir categoría:
	- `buttons`, `inputs`, `tables`, etc.
2. Crear componente:

```bash
npx nx g @nx/angular:component libs/shared-ui/src/lib/components/<CATEGORIA>/<NOMBRE>/<NOMBRE> --export --no-interactive
```

3. Implementar lógica y vista (`.ts` + `.html`).
4. Confirmar exportación en `libs/shared-ui/src/index.ts`.
5. Importar en `apps/testing/pruebasdti`.
6. Probar visualmente y con tests.
7. Si está aprobado, consumir en `apps/production/Proyectos-dti`.

### 6.1 Plantilla con script automatizado (preferida)

```bash
npm run g:shared-ui -- --categoria=<CATEGORIA> --tipo=<TIPO> --nombre=<NOMBRE>
```

Ejemplos:

```bash
npm run g:shared-ui -- --categoria=buttons --tipo=aceptar --nombre=aceptar
npm run g:shared-ui -- --categoria=inputs --tipo=fecha --nombre=fecha
npm run g:shared-ui -- --categoria=tables --tipo=basica --nombre=basica
```

---

## 7) Ejemplo comentado de nombres a reemplazar

### Caso: quieres crear un input de fecha

Comando plantilla:

```bash
npx nx g @nx/angular:component libs/shared-ui/src/lib/components/inputs/<TIPO_INPUT>/<NOMBRE_COMPONENTE> --export --no-interactive
```

Reemplazo real:

- `<TIPO_INPUT>` → `fecha`
- `<NOMBRE_COMPONENTE>` → `fecha`

Comando final:

```bash
npx nx g @nx/angular:component libs/shared-ui/src/lib/components/inputs/fecha/fecha --export --no-interactive
```

---

## 8) Comandos de validación (siempre después de cambios)

### Validar la librería compartida

```bash
npx nx lint shared-ui
npx nx test shared-ui
```

### Validar laboratorio

```bash
npx nx lint pruebasdti
npx nx test pruebasdti
npx nx build pruebasdti --configuration=development
```

### Levantar laboratorio

```bash
npx nx serve pruebasdti
```

---

## 9) Troubleshooting detallado

### Problemas comunes al crear componentes y cómo resolverlos

#### Error 1: `The provided directory ... does not exist under any project root`

Motivo:

- El comando se lanzó con una ruta incompleta, por ejemplo `components/mi-boton`.

Solución:

- Usa ruta completa de la librería:

```bash
npx nx g @nx/angular:component libs/shared-ui/src/lib/components/buttons/<TIPO>/<NOMBRE> --export --no-interactive
```

- O usa el script del equipo:

```bash
npm run g:shared-ui -- --categoria=buttons --tipo=<TIPO> --nombre=<NOMBRE>
```

#### Error 2: el componente se creó pero no aparece en `index.ts`

Motivo:

- El comando se ejecutó sin `--export` o hubo un fallo de proceso.

Solución:

1. Revisar `libs/shared-ui/src/index.ts`.
2. Si falta, agregar manualmente:

```ts
export * from './lib/components/<CATEGORIA>/<TIPO>/<NOMBRE>';
```

3. Para evitarlo, usar siempre el script automatizado.

#### Error 2.1: la carpeta de categoría no existe

Motivo:

- Se intenta crear componente en una categoría nueva (`chips`, `alerts`, etc.).

Solución:

- O crear carpeta manualmente en `libs/shared-ui/src/lib/components`.
- O dejar que el script la cree automáticamente:

```bash
npm run g:shared-ui -- --categoria=<CATEGORIA_NUEVA> --tipo=<TIPO> --nombre=<NOMBRE>
```

#### Error 3: nombres inválidos de componente

Motivo:

- Se usaron mayúsculas, espacios o símbolos (`Mi Botón`, `Boton#1`).

Solución:

- Usar formato kebab-case en minúsculas:
	- ✅ `boton-eliminar`
	- ❌ `BotonEliminar`

#### Error 4: no encuentra imports de `@proyectos-dti/shared-ui`

Motivo:

- Falta export en `index.ts` o import incorrecto.

Solución:

1. Validar export en `libs/shared-ui/src/index.ts`.
2. Importar así en la app:

```ts
import { Eliminar } from '@proyectos-dti/shared-ui';
```

3. Ejecutar lint/test para confirmar:

```bash
npx nx lint shared-ui
npx nx test shared-ui
```

### Problema: error de ruta vieja de estilos (ejemplo `apps/pruebasdti/src/styles.scss`)

Esto suele pasar por caché o proceso viejo.

#### Paso 1: cerrar proceso que ocupa el puerto 4200

```powershell
Get-NetTCPConnection -LocalPort 4200 -State Listen
Stop-Process -Id <PID> -Force
```

Reemplaza `<PID>` por el número real del proceso.

#### Paso 2: limpiar caché Angular

```powershell
if (Test-Path .angular\cache) { Remove-Item .angular\cache -Recurse -Force }
```

#### Paso 3: arrancar sin daemon de Nx

```powershell
$env:NX_DAEMON='false'; npx nx serve pruebasdti --configuration=development --port=4200
```

---

## 10) Recomendaciones de equipo (muy importantes)

1. Mantener separación por entorno:
	- `apps/production`
	- `apps/testing`
2. No mezclar código experimental directo en la app oficial.
3. Documentar en cada PR:
	- componente creado
	- ruta del componente
	- ruta del export en `index.ts`
	- evidencia en `pruebasdti`
4. Si un componente aún no está aprobado, no promoverlo a producción.

5. Convención de nombres:
	- carpetas y archivos en minúsculas + guiones (kebab-case)
	- ejemplos válidos: `boton-primario`, `tabla-usuarios`, `input-fecha`

---

## 11) Mini glosario rápido

- **Monorepo**: varios proyectos en un solo repositorio.
- **Nx**: herramienta para orquestar apps/libs y comandos.
- **Librería (`libs`)**: código reutilizable.
- **Aplicación (`apps`)**: proyecto ejecutable.
- **E2E**: pruebas de flujo completo de usuario.
- **Alias**: nombre corto para importar (`@proyectos-dti/shared-ui`).
