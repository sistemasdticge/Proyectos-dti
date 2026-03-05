import { Component, input, output } from '@angular/core';

@Component({
  selector: 'lib-ver-documento',
  imports: [],
  templateUrl: './ver-documento.html',
  styleUrl: './ver-documento.css',
})
export class VerDocumento {
  label = input('Ver Documento');
  disabled = input(false);

  clicked = output<void>();

  onClick(): void {
    this.clicked.emit();
  }
}
