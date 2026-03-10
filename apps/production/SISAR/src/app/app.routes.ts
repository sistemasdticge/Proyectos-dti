import { Route } from '@angular/router';

export const appRoutes: Route[] = [
	{
		path: '',
		loadComponent: () => import('./pages/login-page/login-page').then((m) => m.LoginPage),
	},
	{
		path: 'dashboard',
		loadComponent: () => import('./pages/dashboard-page/dashboard-page').then((m) => m.DashboardPage),
	},
	{
		path: '**',
		redirectTo: '',
	},
];
