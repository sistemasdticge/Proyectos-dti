import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
// API base de Angular para declarar componentes y manejar estado reactivo con signals.
import {
  // Define un componente de Angular.
  Component,
  // Crea eventos personalizados para comunicacion hijo -> padre.
  EventEmitter,
  // Declara propiedades de entrada desde el contenedor.
  Input,
  // Ciclo de vida para ejecutar limpieza al destruir el componente.
  OnDestroy,
  // Declara propiedades de salida (eventos) hacia el contenedor.
  Output,
  // Crea valores derivados reactivos a partir de signals.
  computed,
  // Inyeccion funcional de dependencias.
  inject,
  // Crea inputs como signals (Angular moderno).
  input,
  // model() es como signal() pero con canal de entrada Y salida:
  // el contenedor puede leer y escribir el valor con [(collapsed)].
  model,
  // Crea estado local reactivo (signal simple, sin canal externo).
  signal,
} from '@angular/core';
// Servicio de Angular Router para navegar por rutas.
import { NavigationEnd, Router } from '@angular/router';
import { BadgeModule } from 'primeng/badge';
import { RippleModule } from 'primeng/ripple';
import { Subscription, filter } from 'rxjs';

// Contrato de cada opcion del menu lateral.
export interface SidebarItem {
  // Texto visible del item (obligatorio).
  label: string;
  // Ruta de navegacion opcional. Si existe, el sidebar navega automaticamente.
  route?: string;
  // Clase de icono opcional (ej: pi pi-home).
  icon?: string;
  // Etiqueta opcional para notificaciones/estado.
  badge?: string;
}

// Entrada global del contenedor lateral.
const sidebarPanelEnterAnimation = trigger('sidebarPanelEnter', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(-10px)' }),
    animate('360ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'translateX(0)' })),
  ]),
]);

// Aparicion escalonada para las opciones del menu.
const sidebarItemsEnterAnimation = trigger('sidebarItemsEnter', [
  transition(':enter', [
    query(
      '.sidebar-nav-item',
      [
        style({ opacity: 0, transform: 'translateX(-8px)' }),
        stagger(45, [animate('280ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))]),
      ],
      { optional: true }
    ),
  ]),
]);

// Componente independiente para la tarjeta de estado del sistema.
// Se deja en el mismo archivo para evitar problemas de resolucion del analizador,
// pero sigue siendo standalone y reutilizable.
@Component({
  standalone: true,
  selector: 'lib-sidebar-status',
  // Plantilla inline con Tailwind para mantener la migracion completa en este archivo.
  template: `
    <footer
      class="mt-auto rounded-2xl border border-[#e7eaf1] bg-[#f7f8fb] p-3 transition-all duration-300"
      [style.padding]="collapsed() ? '0.5rem' : '0.75rem'"
    >
      <div class="flex items-center gap-2 text-slate-700" [style.justify-content]="collapsed() ? 'center' : 'flex-start'">
        <i class="pi text-xs text-[#a21f3d]" [class]="icon() + ' pi text-xs text-[#a21f3d]' "></i>

        @if (!collapsed()) {
          <strong class="whitespace-nowrap text-[0.87rem]">{{ title() }}</strong>
        }
      </div>

      @if (!collapsed()) {
        <div class="mt-2 h-[0.34rem] w-full overflow-hidden rounded-full bg-[#e1e6ef]">
          <span
            class="block h-full origin-left rounded-full bg-gradient-to-r from-[#bc2b4d] to-[#8f1734] transition-[width] duration-700 ease-out"
            [style.width]="progressWidth()"
          ></span>
        </div>

        <small class="mt-1.5 block text-[0.68rem] leading-tight text-slate-400">{{ message() }}</small>
      }
    </footer>
  `,
  styles: [':host { display: block; margin-top: auto; }'],
})
export class SidebarStatusComponent {
  // Indica si el sidebar principal esta colapsado.
  // true  -> muestra version compacta del estado.
  // false -> muestra titulo, barra y texto completo.
  readonly collapsed = input<boolean>(false);

  // Titulo principal de la tarjeta.
  // Se personaliza desde la app: [systemStatusTitle]="..."
  readonly title = input<string>('Estado del Sistema');

  // Texto descriptivo bajo la barra de progreso.
  // Se personaliza desde la app: [systemStatusMessage]="..."
  readonly message = input<string>('Capacidad utilizada al 85%');

  // Porcentaje usado para dibujar la barra de progreso.
  // Espera valor entre 0 y 100 (si llega otro valor lo ajustamos abajo).
  readonly percentage = input<number>(85);

  // Icono de PrimeIcons que aparece junto al titulo.
  // Ejemplo: 'pi pi-check-circle', 'pi pi-info-circle'.
  readonly icon = input<string>('pi pi-exclamation-circle');

  // Valor derivado reactivo para el ancho de la barra.
  // - Lee percentage()
  // - Valida que sea numerico
  // - Lo limita entre 0 y 100
  // - Devuelve una cadena CSS (ej: '85%')
  readonly progressWidth = computed(() => {
    const rawValue = this.percentage();
    const safeValue = Number.isFinite(rawValue) ? rawValue : 0;
    const clampedValue = Math.max(0, Math.min(100, safeValue));
    return `${clampedValue}%`;
  });
}

// Metadatos del componente reutilizable del sidebar.
@Component({
  // Indica que no depende de NgModule; se importa directo en otros componentes.
  standalone: true,
  // Selector HTML para usar este componente: <lib-sidebar></lib-sidebar>.
  selector: 'lib-sidebar',
  // Importamos subcomponentes y directivas PrimeNG usadas en la plantilla:
  // - SidebarStatusComponent: tarjeta inferior de estado del sistema.
  // - RippleModule: efecto visual pRipple en botones.
  // - BadgeModule: badge visual para notificaciones de items.
  imports: [SidebarStatusComponent, RippleModule, BadgeModule],
  // Plantilla HTML asociada.
  templateUrl: './sidebar.component.html',
  // Hoja de estilos del componente.
  styleUrl: './sidebar.component.css',
  // Triggers de animacion para entrada del panel y listado del menu.
  animations: [sidebarPanelEnterAnimation, sidebarItemsEnterAnimation],
})
export class SidebarComponent implements OnDestroy {
  // ---------------------------------------------------------------------------
  // GUIA RAPIDA PARA CONSUMIR ESTE COMPONENTE DESDE CUALQUIER APP
  // ---------------------------------------------------------------------------
  // Puedes personalizar desde tu app (contenedor):
  // 1) title: nombre del modulo/sistema que se ve en el encabezado.
  // 2) logoText: letra o sigla de respaldo cuando no usas imagen.
  // 3) logoSrc: imagen del logo por proyecto (por ejemplo assets/images/logo.png).
  // 4) logoAlt: texto alternativo del logo para accesibilidad.
  // 5) items: opciones del menu (texto, icono, ruta, badge).
  // 6) animationDurationMs: velocidad de abrir/cerrar.
  // 7) [(collapsed)]: estado inicial o control externo del colapso.
  // 8) (itemSelected): evento para auditoria, permisos o tracking.
  //
  // Ejemplo de consumo:
  // <lib-sidebar
  //   [title]="'IVAI Historico'"
  //   [logoSrc]="'assets/images/logo-ivai.png'"
  //   [logoAlt]="'Logo IVAI Historico'"
  //   [items]="sidebarItems"
  //   [animationDurationMs]="300"
  //   [(collapsed)]="isSidebarCollapsed"
  //   (itemSelected)="onSidebarItemSelected($event)"
  // ></lib-sidebar>

  // Router interno para la navegacion por URL.
  // Se usa en onItemClick() para navegar cuando el item trae route.
  private readonly router = inject(Router);
  private readonly routerEventsSubscription: Subscription;

  // Referencia al timer de animacion para poder cancelarlo y evitar memory leaks.
  // Guardamos el id para poder hacer clearTimeout en destroy o antes de crear otro.
  private animationTimerId: number | null = null;

  // Duracion de la animacion del sidebar en milisegundos.
  // Se modifica desde tu app con: [animationDurationMs]="300".
  @Input() animationDurationMs = 250;

  // Evento que expone al contenedor que item fue seleccionado.
  // Se usa desde tu app con: (itemSelected)="onSidebarItemSelected($event)".
  // El contenedor decide la logica de negocio (auditoria, permisos, etc).
  @Output() itemSelected = new EventEmitter<SidebarItem>();

  // Evento para cerrar sesion; el contenedor decide la accion real
  // (limpiar token, llamar API, redirigir a /login, etc).
  @Output() logoutRequested = new EventEmitter<void>();

  // Titulo visible en el encabezado del sidebar.
  // Se modifica desde tu app con: [title]="'Nombre del sistema'".
  readonly title = input<string>('Panel de Control');

  // Texto del logo cuando NO se envia imagen (logoSrc).
  // Se modifica desde tu app con: [logoText]="'IVAI'".
  readonly logoText = input<string>('DTI');

  // Ruta opcional de imagen de logo.
  // Se modifica desde tu app con: [logoSrc]="'assets/images/logo.png'".
  // Cuando existe, reemplaza el avatar de letra para mostrar el logo real del sistema.
  readonly logoSrc = input<string | null>(null);

  // Texto alternativo del logo para accesibilidad.
  // Se modifica desde tu app con: [logoAlt]="'Logo del sistema X'".
  readonly logoAlt = input<string>('Logo del sistema');

  // Lista de elementos a renderizar. Normalmente viene del contenedor.
  // Se modifica desde tu app con: [items]="sidebarItems".
  readonly items = input<SidebarItem[]>([
    { label: 'Dashboard', route: '/dashboard', icon: 'pi pi-home' },
    { label: 'Usuarios', route: '/usuarios', icon: 'pi pi-users' },
    { label: 'Configuracion', route: '/configuracion', icon: 'pi pi-cog', badge: 'Nuevo' },
  ]);

  // Estado visual principal del componente.
  // false: expandido, true: colapsado.
  //
  // Usamos model() en lugar de signal() para que el contenedor (app)
  // pueda controlar este valor desde afuera con [(collapsed)].
  // Cuando el usuario hace click en el boton interno, model() emite
  // automaticamente el nuevo valor al contenedor para que se sincronice.
  readonly collapsed = model(false);

  // Permite mostrar u ocultar la tarjeta de estado desde cada proyecto.
  // Uso en app: [showSystemStatus]="false" si no deseas renderizarla.
  readonly showSystemStatus = input<boolean>(true);

  // Permite mostrar u ocultar el bloque de cerrar sesion.
  // Uso en app: [showLogoutButton]="false" si quieres moverlo al navbar.
  readonly showLogoutButton = input<boolean>(true);

  // Texto del boton de cerrar sesion.
  readonly logoutLabel = input<string>('Cerrar sesion');

  // Icono PrimeIcons del boton de cerrar sesion.
  readonly logoutIcon = input<string>('pi pi-sign-out');

  // Contenido configurable de la tarjeta de estado para cada proyecto.
  readonly systemStatusTitle = input<string>('Estado del Sistema');
  readonly systemStatusMessage = input<string>('Capacidad utilizada al 85%');
  readonly systemStatusPercentage = input<number>(85);
  readonly systemStatusIcon = input<string>('pi pi-exclamation-circle');

  // Estado visual: indica si actualmente esta en transicion.
  // Se usa para bloquear interacciones mientras termina el colapso/expansion.
  readonly animating = signal(false);

  // Guarda la ruta actualmente activa para marcar visualmente el item seleccionado.
  // Sirve para aplicar clase is-active en la plantilla.
  readonly activeRoute = signal<string | null>(null);

  constructor() {
    // Sincroniza la ruta activa inicial con la URL actual.
    // Esto evita que al recargar la pagina el estado visual quede desfasado.
    this.activeRoute.set(this.resolveActiveRoute(this.router.url ?? null));
    this.routerEventsSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.activeRoute.set(this.resolveActiveRoute(event.urlAfterRedirects));
      });
  }

  // Alterna el estado colapsado/expandido.
  // Si ya esta animando, ignoramos clicks repetidos para evitar parpadeos.
  toggleCollapse(): void {
    if (this.animating()) {
      // Si ya hay animacion en curso, no hacemos nada para evitar doble click rapido.
      return;
    }

    // Inicia bandera de animacion y cambia estado visual.
    // update() toma el valor anterior y devuelve el nuevo.
    this.animating.set(true);
    this.collapsed.update((value) => !value);

    // Limpia timer anterior (si existe) y programa fin de animacion.
    // Esto evita tener varios timers superpuestos.
    this.clearAnimationTimer();
    this.animationTimerId = window.setTimeout(() => {
      // Al terminar la animacion, desbloquea interacciones.
      this.animating.set(false);
      this.animationTimerId = null;
    }, this.animationDurationMs);
  }

  // Maneja click de un item del menu.
  // 1) Emite evento al contenedor para logica de negocio.
  // 2) Si el item tiene route, navega dentro de la app.
  onItemClick(item: SidebarItem): void {
    // Permite al contenedor reaccionar (tracking, permisos, guardado de estado, etc).
    this.itemSelected.emit(item);

    if (item.route) {
      // Actualiza estado visual del item activo.
      this.activeRoute.set(item.route);
      // Dispara navegacion real.
      this.router.navigateByUrl(item.route);
    }
  }

  // Util para plantilla: saber si un item es el activo actual.
  isItemActive(item: SidebarItem): boolean {
    // Si no hay ruta asociada no puede considerarse item navegable activo.
    if (!item.route) {
      return false;
    }

    // Compara la ruta del item con el estado activo actual.
    return this.activeRoute() === item.route;
  }

  // Accesibilidad: permite colapsar/expandir con teclado (Enter/Espacio).
  onToggleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      // Evita el comportamiento por defecto (scroll en espacio, por ejemplo).
      event.preventDefault();
      this.toggleCollapse();
    }
  }

  // Emite evento para que la app consumidora cierre sesion.
  onLogoutClick(): void {
    this.logoutRequested.emit();
  }

  // Limpia recursos para evitar timers vivos al destruir componente.
  ngOnDestroy(): void {
    this.clearAnimationTimer();
    this.routerEventsSubscription.unsubscribe();
  }

  private resolveActiveRoute(url: string | null): string | null {
    if (!url) {
      return null;
    }

    return url.split('?')[0].split('#')[0];
  }

  // Encapsula limpieza del timer para no repetir codigo.
  private clearAnimationTimer(): void {
    if (this.animationTimerId !== null) {
      // Cancela el timer pendiente si aun no termina.
      window.clearTimeout(this.animationTimerId);
      this.animationTimerId = null;
    }
  }
}


