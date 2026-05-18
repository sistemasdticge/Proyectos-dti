// Importa el decorador Component para declarar un componente standalone.
import { Component } from '@angular/core';
// Importa RouterModule para habilitar router-outlet y funcionalidades de rutas en la plantilla.
import { RouterModule } from '@angular/router';
// Importa el sidebar reutilizable y su tipo de datos de item desde la libreria shared-ui.
import { SidebarComponent, SidebarItem } from '@proyectos-dti/shared-ui';

// Componente raiz del proyecto pruebasejs.
// Este archivo actua como CONTENEDOR: aqui vive la logica de negocio,
// mientras que el componente de shared-ui se queda con logica visual/reutilizable.
@Component({
  // standalone permite usar imports locales sin crear un NgModule.
  standalone: true,
  // Dependencias que la plantilla necesita (router-outlet y lib-sidebar).
  imports: [RouterModule, SidebarComponent],
  // Selector del componente raiz.
  selector: 'app-root',
  // Plantilla HTML asociada.
  templateUrl: './app.html',
  // Estilos SCSS asociados.
  styleUrl: './app.scss',
})
export class App {
  // Nombre interno del proyecto/componente raiz.
  protected title = 'pruebasejs';

  // ---------------------------------------------------------------------------
  // PERSONALIZACION DEL SIDEBAR PARA TU PROYECTO (ESTE ARCHIVO: app.ts)
  // ---------------------------------------------------------------------------
  // Aqui defines los datos que se envian al <lib-sidebar> en app.html.
  // En cada proyecto cambia estos valores sin tocar la libreria shared-ui.

  // Nombre visible del sistema en el encabezado del sidebar.
  protected readonly sidebarTitle = 'SISAR';

  // Fallback de texto del logo cuando no se envia imagen.
  protected readonly sidebarLogoText = 'PE';

  // Ruta del logo por proyecto.
  // Como este proyecto usa carpeta public, la ruta web queda: 'images/logo_sistema.png'.
  // Si dejas null, el componente usa sidebarLogoText.
  protected readonly sidebarLogoSrc: string | null = 'images/logo_sistema.png';

  // Texto alternativo del logo (accesibilidad).
  protected readonly sidebarLogoAlt = 'Logo de Pruebas EJS';

  // Configuracion opcional de la tarjeta "Estado del Sistema".
  protected readonly showSystemStatus = true;
  protected readonly systemStatusTitle = 'Estado del Sistema';
  protected readonly systemStatusMessage = 'Capacidad utilizada al 60%';
  protected readonly systemStatusPercentage = 60;
  protected readonly systemStatusIcon = 'pi pi-exclamation-circle';

  // Estado del sidebar compartido con el contenedor.
  // Al usar [(collapsed)] en el HTML, este valor y el del sidebar
  // se mantienen sincronizados en ambas direcciones:
  // - Cuando el sidebar se colapsa internamente, este valor se actualiza.
  // - Cuando el contenedor cambia este valor, el sidebar reacciona.
  protected isSidebarCollapsed = false;

  // Datos del menu lateral.
  // Esta configuracion SI pertenece al contenedor porque puede depender de permisos,
  // roles, respuestas de API o reglas del proyecto.
  protected readonly sidebarItems: SidebarItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'pi pi-home' },
    { label: 'Usuarios', route: '/usuarios', icon: 'pi pi-users' },
    { label: 'Reportes', route: '/reportes', icon: 'pi pi-chart-line' },
    { label: 'Configuracion', route: '/configuracion', icon: 'pi pi-cog' },

    ];

  // Manejador del evento emitido por <lib-sidebar> cuando se selecciona un item.
  // Punto ideal para logica de negocio del contenedor:
  // - auditoria / tracking
  // - validaciones de permisos
  // - persistencia de preferencias
  // - llamadas a servicios
  protected onSidebarItemSelected(item: SidebarItem): void {
    console.log('Item seleccionado desde sidebar:', item);
  }
}
