import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

export interface UsuarioRow {
  nombre: string;
  correo: string;
  area: string;
  tipoUsuario: 'Admin' | 'Editor' | 'Viewer';
  estado: 'Activo' | 'Inactivo';
  iniciales: string;
}

@Component({
  selector: 'lib-tabla-usuarios',
  imports: [CommonModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class TablaUsuarios {
  rows = input<UsuarioRow[]>([]);

  editar = output<UsuarioRow>();
  toggleEstado = output<UsuarioRow>();

  onEditar(row: UsuarioRow): void {
    this.editar.emit(row);
  }

  onToggleEstado(row: UsuarioRow): void {
    this.toggleEstado.emit(row);
  }

  trackByCorreo(_: number, row: UsuarioRow): string {
    return row.correo;
  }
}
