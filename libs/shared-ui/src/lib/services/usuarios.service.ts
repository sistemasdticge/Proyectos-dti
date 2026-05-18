import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UsuarioCreateDTO, UsuarioDTO } from '../models/usuario.model';
import { ApiBaseService } from './api-base.service';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly apiBase = inject(ApiBaseService);

  getAll(): Observable<UsuarioDTO[]> {
    return this.apiBase.get<UsuarioDTO[]>('Usuarios');
  }

  getById(id: string, userName?: string): Observable<UsuarioDTO> {
    const query = userName?.trim() ? `?userName=${encodeURIComponent(userName.trim())}` : '';
    return this.apiBase.get<UsuarioDTO>(`Usuarios/${encodeURIComponent(id)}${query}`);
  }

  create(payload: UsuarioCreateDTO): Observable<UsuarioDTO> {
    return this.apiBase.post<UsuarioDTO>('Usuarios', payload);
  }

  delete(id: string): Observable<UsuarioDTO> {
    return this.apiBase.delete<UsuarioDTO>(`Usuarios/${encodeURIComponent(id)}`);
  }
}
