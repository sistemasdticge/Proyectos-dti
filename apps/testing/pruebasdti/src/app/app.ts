import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TablaUsuarios, type UsuarioRow } from '@proyectos-dti/shared-ui';

// Componente raíz del laboratorio.
// Su propósito es demostrar el consumo real de componentes de la librería
// `shared-ui` mediante el alias `@proyectos-dti/shared-ui`.
@Component({
  // Importamos la tabla reutilizable para validar el flujo "fábrica -> laboratorio".
  imports: [RouterModule, TablaUsuarios],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  // Título de referencia del laboratorio.
  protected title = 'pruebasdti';

  usuarios: UsuarioRow[] = [
    {
      nombre: 'Juan Pérez',
      correo: 'juan.perez@empresa.com',
      area: 'IT & Operations',
      tipoUsuario: 'Admin',
      estado: 'Activo',
      iniciales: 'JP',
    },
    {
      nombre: 'María García',
      correo: 'm.garcia@empresa.com',
      area: 'Human Resources',
      tipoUsuario: 'Viewer',
      estado: 'Activo',
      iniciales: 'MG',
    },
    {
      nombre: 'Carlos López',
      correo: 'c.lopez@empresa.com',
      area: 'Sales & Marketing',
      tipoUsuario: 'Editor',
      estado: 'Inactivo',
      iniciales: 'CL',
    },
    {
      nombre: 'Ana Martínez',
      correo: 'ana.mtz@empresa.com',
      area: 'Finance',
      tipoUsuario: 'Admin',
      estado: 'Activo',
      iniciales: 'AM',
    },
  ];

  onEditar(usuario: UsuarioRow): void {
    console.log('Editar usuario:', usuario);
  }

  onToggleEstado(usuario: UsuarioRow): void {
    this.usuarios = this.usuarios.map((row) => {
      if (row.correo !== usuario.correo) {
        return row;
      }

      return {
        ...row,
        estado: row.estado === 'Activo' ? 'Inactivo' : 'Activo',
      };
    });
  }
}
