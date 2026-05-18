# Guia: Sidebar reusable (consumo y personalizacion)

Esta guia explica como consumir y personalizar el componente `lib-sidebar` desde una app, sin modificar la libreria.

## 1) Donde esta el componente

- Componente: `libs/shared-ui/src/lib/components/navigation/sidebar/sidebar.component.ts`
- Template: `libs/shared-ui/src/lib/components/navigation/sidebar/sidebar.component.html`
- Estilo host minimo: `libs/shared-ui/src/lib/components/navigation/sidebar/sidebar.component.css`
- API publica (export): `libs/shared-ui/src/index.ts`

---

## 2) Regla de uso

Personaliza siempre desde tu app (contenedor):

- Datos y estado en `app.ts`
- Bindings en `app.html`

No cambies la libreria para ajustes de datos por proyecto.

---

## 3) Paso a paso para consumirlo

## 3.1 Importar el sidebar en tu app

En `app.ts`:

```ts
import { SidebarComponent, SidebarItem } from '@proyectos-dti/shared-ui';

@Component({
  standalone: true,
  imports: [RouterModule, SidebarComponent],
  // ...
})
export class App {}
```

## 3.2 Definir datos personalizables en app.ts

```ts
// Marca
protected readonly sidebarTitle = 'Mi Sistema';
protected readonly sidebarLogoText = 'MS';
protected readonly sidebarLogoSrc: string | null = 'images/logo_sistema.png';
protected readonly sidebarLogoAlt = 'Logo Mi Sistema';

// Estado del sidebar
protected isSidebarCollapsed = false;

// Navegacion
protected readonly sidebarItems: SidebarItem[] = [
  { label: 'Dashboard', route: '/dashboard', icon: 'pi pi-home' },
  { label: 'Usuarios', route: '/usuarios', icon: 'pi pi-users' },
  { label: 'Reportes', route: '/reportes', icon: 'pi pi-chart-line' },
  { label: 'Configuracion', route: '/configuracion', icon: 'pi pi-cog' },
];

// Tarjeta de estado (opcional)
protected readonly showSystemStatus = true;
protected readonly systemStatusTitle = 'Estado del Sistema';
protected readonly systemStatusMessage = 'Capacidad utilizada al 85%';
protected readonly systemStatusPercentage = 85;
protected readonly systemStatusIcon = 'pi pi-exclamation-circle';

protected onSidebarItemSelected(item: SidebarItem): void {
  console.log('Item seleccionado:', item);
}
```

## 3.3 Conectar bindings en app.html

```html
<lib-sidebar
  [title]="sidebarTitle"
  [logoText]="sidebarLogoText"
  [logoSrc]="sidebarLogoSrc"
  [logoAlt]="sidebarLogoAlt"
  [items]="sidebarItems"
  [showSystemStatus]="showSystemStatus"
  [systemStatusTitle]="systemStatusTitle"
  [systemStatusMessage]="systemStatusMessage"
  [systemStatusPercentage]="systemStatusPercentage"
  [systemStatusIcon]="systemStatusIcon"
  [animationDurationMs]="300"
  [(collapsed)]="isSidebarCollapsed"
  (itemSelected)="onSidebarItemSelected($event)"
></lib-sidebar>
```

---

## 4) Que puedes personalizar

## 4.1 Inputs principales

- `title`: titulo del sidebar
- `logoText`: fallback de letra/sigla
- `logoSrc`: ruta de imagen del logo
- `logoAlt`: texto alternativo del logo
- `items`: arreglo de opciones del menu
- `animationDurationMs`: duracion de colapso/expansion
- `showSystemStatus`: mostrar/ocultar tarjeta de estado
- `systemStatusTitle`: titulo de la tarjeta
- `systemStatusMessage`: mensaje de la tarjeta
- `systemStatusPercentage`: porcentaje (0-100)
- `systemStatusIcon`: icono PrimeIcons
- `collapsed` (two-way): estado abierto/cerrado

## 4.2 Output

- `itemSelected`: emite el item seleccionado

---

## 5) Estructura de SidebarItem

```ts
export interface SidebarItem {
  label: string;
  route?: string;
  icon?: string;
  badge?: string;
}
```

Notas:

- `label` es obligatorio.
- Si `route` existe, el sidebar navega automaticamente.
- `badge` es opcional (si no quieres notificaciones, no lo mandes).

---

## 6) Ruta de imagen cuando el logo esta en public

Si tu archivo esta en:

- `apps/testing/pruebasejs/public/images/logo_sistema.png`

La ruta a usar en `sidebarLogoSrc` es:

- `images/logo_sistema.png`

No uses `public/...` ni `assets/...` en este caso.

---

## 7) Troubleshooting rapido

### El logo no se ve

1. Verifica que exista en `public/...`
2. Verifica ruta web correcta (ej: `images/logo_sistema.png`)
3. Prueba recarga dura del navegador

### El item no navega

1. Revisa que el item tenga `route`
2. Revisa que la ruta exista en `app.routes.ts`

### Aparecen badges no deseados

Quita la propiedad `badge` del item en `sidebarItems`.

---

## 8) Convencion para guias futuras

Cada componente nuevo de `shared-ui` debe tener su guia en `docs/` con este formato:

- Nombre sugerido: `GUIA-<NOMBRE-COMPONENTE>-CONSUMO-PERSONALIZACION.md`
- Contenido minimo:
  1. DondE esta el componente
  2. Como importarlo
  3. Inputs/outputs
  4. Ejemplo en `app.ts`
  5. Ejemplo en `app.html`
  6. Troubleshooting



Existe la parte de en el sidebar agregar otro apartado por ejemplo en de ayuyda
1-Lo primero que se debe hacer es irte a apps
y en esta parte:
protected readonly sidebarItems: SidebarItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'pi pi-home' },
    { label: 'Usuarios', route: '/usuarios', icon: 'pi pi-users' },
    { label: 'Reportes', route: '/reportes', icon: 'pi pi-chart-line' },
    { label: 'Configuracion', route: '/configuracion', icon: 'pi pi-cog' },

    ];

aqui agregaras un label, por ejemplo el de ayuda, configuras el icon y la ruta algo asi:
 {label: "Ayuda", route: "/ayuda", icon: "pi pi-cog"}

Una vez que se da de alta aqui se visualizara pero nose vera a donde navega, aqui hay que creart el componente 
routes quedaria algo asi: 

@Component({
	standalone: true,
	template: `
		<h2 class="mb-2 text-xl font-semibold text-slate-800">Usuarios</h2>
		<p class="text-sm text-slate-600">Aqui podrias listar usuarios del sistema.</p>
	`,
})
class UsuariosPageComponent {}
