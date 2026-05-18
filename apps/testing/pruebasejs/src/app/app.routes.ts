// Importa Component para declarar paginas standalone de prueba.
import { Component } from '@angular/core';
// Importa el tipo Route para tipar el arreglo de rutas de Angular.
import { Route } from '@angular/router';

// Pagina de ejemplo para la ruta /dashboard.
@Component({
	// Componente standalone, util para prototipos rapidos sin modulo.
	standalone: true,
	// Plantilla minima de la pagina.
	template: `
		<h2 class="mb-2 text-xl font-semibold text-slate-800">Dashboard</h2>
		<p class="text-sm text-slate-600">Vista de inicio para probar el sidebar.</p>
	`,
})
class DashboardPageComponent {}

// Pagina de ejemplo para la ruta /usuarios.
@Component({
	standalone: true,
	template: `
		<h2 class="mb-2 text-xl font-semibold text-slate-800">Usuarios</h2>
		<p class="text-sm text-slate-600">Aqui podrias listar usuarios del sistema.</p>
	`,
})
class UsuariosPageComponent {}

// Pagina de ejemplo para la ruta /reportes.
@Component({
	standalone: true,
	template: `
		<h2 class="mb-2 text-xl font-semibold text-slate-800">Reportes</h2>
		<p class="text-sm text-slate-600">Seccion para reportes y metricas.</p>
	`,
})
class ReportesPageComponent {}

// Pagina de ejemplo para la ruta /configuracion.
@Component({
	standalone: true,
	template: `
		<h2 class="mb-2 text-xl font-semibold text-slate-800">Configuracion</h2>
		<p class="text-sm text-slate-600">Preferencias generales de la aplicacion.</p>
	`,
})
class ConfiguracionPageComponent {}


// Tabla de rutas de la app.
// Cada "path" debe coincidir con las rutas de sidebarItems en app.ts.
export const appRoutes: Route[] = [
	// Cuando entras a la raiz '', redirige automaticamente a /dashboard.
	{ path: '', pathMatch: 'full', redirectTo: 'dashboard' },
	// Rutas de prueba para validar navegacion desde el sidebar.
	{ path: 'dashboard', component: DashboardPageComponent },
	{ path: 'usuarios', component: UsuariosPageComponent },
	{ path: 'reportes', component: ReportesPageComponent },
	{ path: 'configuracion', component: ConfiguracionPageComponent },
];
