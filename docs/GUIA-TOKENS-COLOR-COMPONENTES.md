# Guía práctica: Tokens de color + creación de componentes (IVAIhistorico)

Objetivo:
- Cambiar la paleta en **un solo archivo**.
- Crear componentes nuevos que hereden esos colores sin repetir códigos HEX.

---

## 1) Archivo único de colores (fuente de verdad)

Actualmente la paleta institucional está centralizada en:

- `apps/production/IVAIhistorico/src/styles.scss`

Ahí encontrarás variables como:

- `--ivai-color-wine`
- `--ivai-color-brown`
- `--ivai-color-gold`
- `--ivai-gradient-primary`
- `--ivai-gradient-header`

### Regla de oro

✅ **Siempre** cambia colores ahí.

⛔ No pongas `#8c143f`, `#5c3327`, etc. directo en templates/components.

---

## 2) Cómo cambiar colores (paso a paso)

1. Abre `apps/production/IVAIhistorico/src/styles.scss`.
2. En `:root`, ajusta los valores `--ivai-*`.
3. Guarda.
4. Levanta la app y valida visualmente.

Ejemplo (cambio rápido del vino):

```scss
:root {
  --ivai-color-wine: #7f1238;
  --ivai-color-wine-strong: #6d0f30;
  --ivai-color-wine-soft: #943052;
}
```

Con eso se actualiza automáticamente:
- Tabs de años
- Botón Ver Documento
- Tabla y paginación
- Modal visor de documento

---

## 3) Estructura recomendada para nuevos tokens

Dentro de `:root` mantén este orden:

1. **Base institucional**
   - `--ivai-color-wine`
   - `--ivai-color-brown`
   - `--ivai-color-gold`
2. **Superficies y bordes**
   - `--ivai-color-white`
   - `--ivai-color-surface-soft`
   - `--ivai-color-border-soft`
3. **Derivados y gradientes**
   - `--ivai-gradient-primary`
   - `--ivai-gradient-primary-hover`
   - `--ivai-gradient-header`

Tip: crea tokens semánticos antes que colores sueltos.

---

## 4) Cómo crear componentes nuevos usando tokens

## 4.1 Generar componente

Ejemplo:

```bash
npm run g:shared-ui -- --categoria=buttons --tipo=descargar --nombre=descargar
```

## 4.2 Template limpio (sin HEX)

`descargar.html`

```html
<button type="button" class="doc-action-button" (click)="onClick()">
  Descargar
</button>
```

## 4.3 Estilos con variables

`descargar.css`

```css
.doc-action-button {
  border: 1px solid var(--ivai-color-wine);
  background: var(--ivai-gradient-primary);
  color: var(--ivai-color-white);
  border-radius: 0.375rem;
  padding: 0.4rem 0.8rem;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 180ms ease-out;
}

.doc-action-button:hover {
  background: var(--ivai-gradient-primary-hover);
}

.doc-action-button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--ivai-color-ring-soft);
}
```

---

## 5) Patrón recomendado: clases semánticas

Usa clases que expresen intención, no color:

✅ `document-button`, `table-control`, `pager-item--active`, `year-chip--active`

⛔ `button-wine-500`, `border-brown`, `bg-8c143f`

Ventaja: cambias tema sin renombrar clases.

---

## 6) Checklist antes de cerrar un componente

- [ ] No hay HEX hardcodeado en `.html` ni `.css` del componente.
- [ ] Todos los colores vienen de `var(--ivai-...)`.
- [ ] Hover/focus/disabled definidos.
- [ ] Estados activos/inactivos visibles.
- [ ] Test del proyecto pasa (`shared-ui` y/o app).

Comandos:

```bash
npx nx test shared-ui
npx nx test IVAIhistorico
```

---

## 7) Convención para futuros cambios de tema

Cuando pidan “cambiar identidad visual”, haz este flujo:

1. Editar únicamente `apps/production/IVAIhistorico/src/styles.scss`.
2. Ajustar tokens base (`wine`, `brown`, `gold`) y gradientes.
3. Validar componentes principales:
   - Tabs
   - Tabla
   - Botones
   - Modal visor
4. Correr tests.

---

## 8) Errores comunes y solución

### Error: “No cambia el color aunque edité el componente”
Causa: color hardcodeado en otro archivo.

Solución: busca `#` en el componente y reemplaza por `var(--ivai-...)`.

### Error: “El hover se ve muy fuerte”
Causa: gradiente hover saturado.

Solución: ajusta solo `--ivai-gradient-primary-hover` en `styles.scss`.

### Error: “En otro app no toma tokens”
Causa: ese app no define/importa los tokens globales.

Solución: copiar/importar el bloque `:root` en el `styles.scss` de ese app.

---

## 9) Mini plantilla reutilizable (copiar/pegar)

```css
.component-shell {
  border: 1px solid var(--ivai-color-border-soft);
  background: var(--ivai-color-white);
  color: var(--ivai-color-brown);
}

.component-shell--active {
  border-color: var(--ivai-color-wine);
  background: var(--ivai-gradient-primary);
  color: var(--ivai-color-white);
}

.component-shell:focus-within {
  box-shadow: 0 0 0 2px var(--ivai-color-ring-soft);
}
```

Con esta guía ya puedes pedir componentes así:

> “Créame un componente X con estilo minimal institucional usando tokens `--ivai-*`, sin HEX hardcodeado, con estados hover/focus/disabled y gradiente primary.”
