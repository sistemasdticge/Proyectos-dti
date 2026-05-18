import { Route } from '@angular/router';

export const appRoutes: Route[] = [
	{
		path: '',
		loadComponent: () => import('./pages/login-page/login-page').then((m) => m.LoginPage),
	},
	{
		path: 'app',
		loadComponent: () =>
			import('./pages/private-layout-page/private-layout-page').then((m) => m.PrivateLayoutPage),
		children: [
			{ path: '', pathMatch: 'full', redirectTo: 'dashboard' },
			{
				path: 'dashboard',
				loadComponent: () => import('./pages/dashboard-page/dashboard-page').then((m) => m.DashboardPage),},
			{
				path: 'usuarios',
				loadComponent: () => import('./pages/usuarios-page').then((m) => m.UsuariosPage),},
			{
				path: 'temas',
				loadComponent: () => import('./pages/temas-page/temas-page').then((m) => m.TemasPage),},
			{
				path: 'catalogos',
				loadComponent: () => import('./pages/catalogos-page/catalogos-page').then((m) => m.CatalogosPage),},
			{
				path: 'seguimientos/:turnoId',
				loadComponent: () =>
					import('./pages/seguimientos-page/detalle-tarea-page').then((m) => m.DetalleTareaPage),},
			{
				path: 'seguimientos',
				loadComponent: () => import('./pages/seguimientos-page/seguimientos-page').then((m) => m.SeguimientosPage),},
			{
				path: 'historial',
				loadComponent: () => import('./pages/historial-page/historial-page').then((m) => m.HistorialPage),},
			{
				path: 'configuracion',
				loadComponent: () => import('./pages/configuracion-page/configuracion-page').then((m) => m.ConfiguracionPage),},
			{
				path: 'reportes',
				redirectTo: 'catalogos',
				pathMatch: 'full',},
		],
	},
	{ path: 'dashboard', redirectTo: 'app/dashboard', pathMatch: 'full' },
	{ path: 'usuarios', redirectTo: 'app/usuarios', pathMatch: 'full' },
	{ path: 'catalogos', redirectTo: 'app/catalogos', pathMatch: 'full' },
	{ path: 'reportes', redirectTo: 'app/catalogos', pathMatch: 'full' },
	{ path: 'configuracion', redirectTo: 'app/configuracion', pathMatch: 'full' },
	{ path: 'temas', redirectTo: 'app/temas', pathMatch: 'full' },
	{ path: 'seguimientos', redirectTo: 'app/seguimientos', pathMatch: 'full' },
	{ path: 'historial', redirectTo: 'app/historial', pathMatch: 'full' },
	{
		path: '**',
		redirectTo: '',
	},
];
