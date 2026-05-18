// Contrato de configuracion reusable para el navbar superior.
export interface TopNavbarConfig {
  // Texto del placeholder del buscador.
  searchPlaceholder: string;
  // Numero de notificaciones visibles en el badge.
  notificationCount: number;
  // Nombre del usuario autenticado.
  userName: string;
  // Rol o area del usuario.
  userRole: string;
  // Imagen opcional del avatar.
  avatarUrl?: string;
}

// Evento emitido al escribir en el buscador.
export interface TopNavbarSearchEvent {
  term: string;
}
