# IVAIhistorico - Paso 1: Diseño de componentes reutilizables (nivel principiante)

Objetivo de este paso:
- Definir qué componentes serán universales.
- Definir contratos (inputs y outputs) antes de programar.
- Dejar una base que puedas usar en otros proyectos.

---

## 1) ¿Conviene crear componentes primero?

Sí, pero con una condición:
- Primero definimos el contrato de cada componente (qué recibe y qué emite).
- Después lo implementamos.

Regla clave:
- Si un componente depende de un endpoint específico, NO es universal.
- Lo universal vive en shared-ui y recibe datos por inputs.

✅ Importante (tu duda):
- Sí, en `libs/shared-ui` deben vivir componentes reutilizables (presentacionales).
- La lógica de negocio, llamadas HTTP, transformación de datos y reglas del sistema viven en la app (ej. IVAIhistorico).
- En otras palabras: `shared-ui` dibuja la UI; la app decide qué datos mostrar y cuándo pedirlos.

---

## 2) Componentes universales recomendados para esta pantalla

Para replicar tu sistema y reutilizar en otros proyectos, empezaremos con 3:

1. Tabs de años
- Nombre sugerido: ui-tabs-anios
- Uso: mostrar lista de años y seleccionar uno.

2. Tabla de archivos
- Nombre sugerido: ui-tabla-archivos
- Uso: mostrar nombre de archivo, fecha y acción.

3. Botón ver documento
- Nombre sugerido: ui-btn-ver-documento
- Uso: botón de acción estándar para abrir documento.

Para tu versión "completa/cool" añadiremos 2 componentes más:

4. Barra de filtros avanzada
- Nombre sugerido: ui-filtros-archivos
- Uso: filtro por múltiples años, nombre y rango de fecha.

5. Paginador universal
- Nombre sugerido: ui-paginador
- Uso: paginación consistente con tamaño por defecto 20.

Nota:
- El contenedor de página (Consulta Histórica) NO debe ir en shared-ui.
- Ese contenedor vive en la app y consume estos componentes.

---

## 3) Contratos (sin código todavía)

### 3.1 Tabs de años

Inputs:
- items: string[]  (ejemplo: 2025, 2024, 2023)
- selected: string | null

Outputs:
- selectedChange: string

Comportamiento esperado:
- Renderiza chips o pestañas.
- Al hacer click, emite el año seleccionado.

### 3.2 Tabla de archivos

Inputs:
- rows: ArchivoRow[]
- loading: boolean
- pageSize: number (default recomendado: 20)

Outputs:
- verDocumento: ArchivoRow
- busquedaChange: string
- pageChange: { page: number, pageSize: number }

Modelo base ArchivoRow:
- nombreArchivo: string
- fechaPublicacion?: string
- carpeta?: string

### 3.3 Filtros avanzados

Inputs:
- aniosDisponibles: string[]
- filtrosIniciales: FiltrosArchivos

Outputs:
- filtrosChange: FiltrosArchivos
- limpiar: void

Modelo FiltrosArchivos:
- anios: string[]
- nombre: string
- fechaInicio: string | null
- fechaFin: string | null

### 3.4 Paginador universal

Inputs:
- totalRegistros: number
- page: number
- pageSize: number (default: 20)
- pageSizeOptions: number[] (default sugerido: [20, 50, 100])

Outputs:
- pageChange: { page: number, pageSize: number }

### 3.5 Botón ver documento

Inputs:
- label: string (default: Ver Documento)
- disabled: boolean

Outputs:
- clicked: void

Comportamiento esperado:
- Estilo rojo semántico (según guía de Tailwind del repo).
- Botón consistente entre proyectos.

---

## 4) Estructura de carpetas objetivo

En la librería shared-ui:

- libs/shared-ui/src/lib/components/tabs/anios/
- libs/shared-ui/src/lib/components/tables/archivos/
- libs/shared-ui/src/lib/components/buttons/ver-documento/
- libs/shared-ui/src/lib/components/filters/archivos/
- libs/shared-ui/src/lib/components/paginators/base/

Y recuerda exportarlos en:
- libs/shared-ui/src/index.ts

---

## 5) Checklist de fin del Paso 1

Marca esto antes de programar:

- Ya decidí nombres finales de los 3 componentes.
- Ya decidí si haré versión básica (3 componentes) o completa (5 componentes).
- Ya definí inputs y outputs de cada uno.
- Ya definí qué componente es visual y cuál será contenedor en la app.
- Ya tengo clara la estructura de carpetas en shared-ui.

---

## 6) Qué haremos en el Paso 2

En el Paso 2 vamos a crear el primero (Tabs de años) con:
- comando de generación,
- archivo por archivo,
- explicación simple de cada línea,
- y prueba visual en la app de testing.

No avanzaremos al siguiente hasta que este quede funcionando.

---

## 7) Roadmap recomendado (para que quede completo)

Orden de implementación sugerido:

1. `ui-tabs-anios`
2. `ui-btn-ver-documento`
3. `ui-tabla-archivos`
4. `ui-filtros-archivos` (multi-año + nombre + fechas)
5. `ui-paginador` (20 por defecto)
6. Integración final en la app `IVAIhistorico`

Con este orden tendrás valor rápido y luego mejoras UX sin romper lo anterior.

---

## 8) Paso 2.1 (primera acción real): crear Tabs de años

Ejecuta este comando en la raíz del workspace:

```bash
npm run g:shared-ui -- --categoria=tabs --tipo=anios --nombre=anios
```

Qué debe pasar:
- Se crea una carpeta en `libs/shared-ui/src/lib/components/tabs/anios/`.
- Se generan archivos `anios.ts`, `anios.html`, `anios.css`, `anios.spec.ts`.

Si sale error:
- Copia y pega el error completo en el chat y lo corregimos juntos.

Cuando esto esté listo, seguimos con Paso 2.2:
- Definir `inputs/outputs` del componente `ui-tabs-anios`.

### 8.1 Si el script `g:shared-ui` falla

En algunos casos el script personalizado puede fallar sin mostrar detalle.
Usa este comando directo de Nx:

```bash
npx nx g @nx/angular:component libs/shared-ui/src/lib/components/tabs/anios/anios --export --no-interactive
```

Este comando ya crea:
- `anios.ts`
- `anios.html`
- `anios.css`
- `anios.spec.ts`

Y actualiza export en `libs/shared-ui/src/index.ts`.

---

## 9) Paso 2.2 (edición manual): contrato del componente `anios`

Ahora sí, edita estos 2 archivos:

1) `libs/shared-ui/src/lib/components/tabs/anios/anios.ts`
- Agregar inputs: `items`, `selected`
- Agregar output: `selectedChange`
- Crear método `onSelect(item: string)`

2) `libs/shared-ui/src/lib/components/tabs/anios/anios.html`
- Hacer un `@for` para pintar cada año
- Marcar visualmente el seleccionado
- En click llamar `onSelect(item)`

Objetivo visual mínimo:
- Botones tipo pill
- seleccionado en azul
- no seleccionado con borde y fondo claro

Cuando termines esta parte, me pegas el contenido de `anios.ts` y `anios.html` y te doy corrección puntual (línea por línea) antes de pasar al siguiente componente.
