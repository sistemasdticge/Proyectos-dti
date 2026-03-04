import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Aceptar, Cancelar, Eliminar } from '@proyectos-dti/shared-ui';

// Componente raíz del laboratorio.
// Su propósito es demostrar el consumo real de componentes de la librería
// `shared-ui` mediante el alias `@proyectos-dti/shared-ui`.
@Component({
  // Importamos botones clasificados para validar el flujo "fábrica -> laboratorio".
  imports: [RouterModule, Aceptar, Eliminar, Cancelar],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  // Título de referencia del laboratorio.
  protected title = 'pruebasdti';
}
