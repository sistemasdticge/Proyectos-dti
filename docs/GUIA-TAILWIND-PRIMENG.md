# Guía práctica: Tailwind + PrimeNG (Proyectos DTI)

Esta guía está pensada para modificar y crear componentes de forma consistente en este monorepo.

## 1) Regla principal de arquitectura

- Los componentes reutilizables se crean en `libs/shared-ui`.
- Se prueban en `apps/testing/pruebasdti`.
- Se promueven a `apps/production/Proyectos-dti` cuando están aprobados.

---

## 2) Dónde se configura PrimeNG y Tailwind en este repo

### PrimeNG (tema)

Se configura por provider (enfoque moderno):

- `apps/testing/pruebasdti/src/app/app.config.ts`
- `apps/production/Proyectos-dti/src/app/app.config.ts`

Patrón actual:

- `providePrimeNG({ theme: { preset: Aura } })`
- `provideAnimationsAsync()`

### Tailwind (utilidades)

- `apps/testing/pruebasdti/tailwind.config.js`
- `apps/production/Proyectos-dti/tailwind.config.js`

Estilos globales:

- `apps/testing/pruebasdti/src/styles.scss`
- `apps/production/Proyectos-dti/src/styles.scss`

---

## 3) Colores y bordes en Tailwind (guía rápida)

## 3.1 Escala de color más usada

- `50-100`: fondo muy claro
- `200-300`: bordes suaves / estados disabled
- `400-500`: color base medio
- `600`: color principal de acción
- `700`: hover
- `800-900`: textos oscuros / estados fuertes

## 3.2 Mapa semántico recomendado

### Acción positiva (aceptar/guardar)

- Fondo: `bg-emerald-600`
- Hover: `hover:bg-emerald-700`
- Borde: `border-emerald-600`
- Hover borde: `hover:border-emerald-700`
- Texto: `text-white`

### Acción destructiva (eliminar)

- Fondo: `bg-red-600`
- Hover: `hover:bg-red-700`
- Borde: `border-red-600`
- Hover borde: `hover:border-red-700`
- Texto: `text-white`

### Acción neutra (cancelar)

- Fondo: `bg-slate-500`
- Hover: `hover:bg-slate-600`
- Borde: `border-slate-500`
- Hover borde: `hover:border-slate-600`
- Texto: `text-white`

### Información / navegación secundaria

- Fondo: `bg-blue-600`
- Hover: `hover:bg-blue-700`
- Borde: `border-blue-600`
- Hover borde: `hover:border-blue-700`
- Texto: `text-white`

## 3.3 Bordes y radios recomendados

- Borde base: `border`
- Borde visible medio: `border-2`
- Redondeo normal: `rounded-md`
- Redondeo alto: `rounded-lg`
- Redondeo píldora: `rounded-full`

## 3.4 Estados visuales útiles

- Focus accesible: `focus:outline-none focus:ring-2 focus:ring-emerald-300`
- Disabled: `opacity-60 cursor-not-allowed`
- Sombra ligera: `shadow-sm`

---

## 4) Cómo estilizar PrimeNG con Tailwind

PrimeNG expone `styleClass` en muchos componentes. Ahí pasas utilidades Tailwind.

Ejemplo real de botón:

```html
<p-button
  [label]="label()"
  styleClass="bg-red-600 border-red-600 hover:bg-red-700 hover:border-red-700 text-white font-semibold"
/>
```

### Reglas prácticas

1. Mantén semántica por tipo de acción (no mezclar rojo para aceptar).
2. Usa `font-semibold` para botones principales.
3. Define una convención y repítela en toda la librería.

---

## 5) Plantillas listas para copiar

## 5.1 Botón Aceptar

```html
<p-button
  [label]="label()"
  styleClass="bg-emerald-600 border-emerald-600 hover:bg-emerald-700 hover:border-emerald-700 text-white font-semibold"
/>
```

## 5.2 Botón Eliminar

```html
<p-button
  [label]="label()"
  styleClass="bg-red-600 border-red-600 hover:bg-red-700 hover:border-red-700 text-white font-semibold"
/>
```

## 5.3 Botón Cancelar

```html
<p-button
  [label]="label()"
  styleClass="bg-slate-500 border-slate-500 hover:bg-slate-600 hover:border-slate-600 text-white font-semibold"
/>
```

---

## 6) Crear y modificar componentes (flujo recomendado)

## 6.1 Crear componente

```bash
npm run g:shared-ui -- --categoria=buttons --tipo=editar --nombre=editar
```

## 6.2 Editar lógica

Archivo:

- `libs/shared-ui/src/lib/components/buttons/editar/editar.ts`

Patrón base:

- Importar módulo PrimeNG necesario (ej. `ButtonModule`)
- Definir inputs con `input()`

## 6.3 Editar template y estilo

Archivo:

- `libs/shared-ui/src/lib/components/buttons/editar/editar.html`

Aplicar `styleClass` con utilidades Tailwind según semántica.

## 6.4 Probar en laboratorio

1. Importar en:
   - `apps/testing/pruebasdti/src/app/app.ts`
2. Usar selector en:
   - `apps/testing/pruebasdti/src/app/app.html`
3. Ejecutar:

```bash
npx nx serve pruebasdti
```

## 6.5 Validar calidad

```bash
npx nx lint shared-ui
npx nx test shared-ui
```

---

## 7) Errores comunes al personalizar estilos

### Error: color inconsistente por botón

Motivo: cada dev usa clases distintas sin convención.

Solución: usar mapa semántico del punto 3.2.

### Error: PrimeNG no refleja estilos

Motivo: clase puesta en elemento equivocado o componente no usa `styleClass`.

Solución: revisar API del componente PrimeNG y pasar clases en `styleClass`.

### Error: componente compila pero no se puede importar

Motivo: falta export en `libs/shared-ui/src/index.ts`.

Solución: agregar export manual o generar con script `g:shared-ui`.

### Error: estilo viejo persiste

Motivo: caché / server previo vivo.

Solución rápida:

1. parar servidor anterior
2. limpiar `.angular/cache`
3. volver a correr `npx nx serve pruebasdti`

---

## 8) Checklist de aprobación visual

Antes de pasar componente a producción, validar:

- Color correcto según semántica
- Hover correcto
- Contraste de texto legible
- Estado disabled visible
- Consistencia con otros componentes del mismo tipo
- Prueba en `pruebasdti` OK
