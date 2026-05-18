import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'lib-temas-toolbar',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './temas-toolbar.component.html',
})
export class TemasToolbarComponent {
  @Input() title = 'Temas Activos';
  @Input() subtitle = 'Gestión y seguimiento de los asuntos institucionales en curso.';
  @Input() createLabel = 'Nuevo Tema';
  @Output() create = new EventEmitter<void>();
}
