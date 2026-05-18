export interface UsuarioDTO {
  id?: string;
  nombre?: string;
  userName?: string;
  tipoUsuarioId?: string;
  tipoUsuario?: string;
  areaId?: string;
  area?: string;
  activo?: number | boolean;
}

export interface UsuarioCreateDTO {
  nombre: string;
  userName: string;
  tipoUsuarioId: string;
  areaId: string;
  password: string;
}
