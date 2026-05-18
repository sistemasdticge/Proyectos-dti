import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'lib-config-section-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './config-section-card.component.html',
  styleUrl: './config-section-card.component.scss',
})
export class ConfigSectionCardComponent {
  @Input() title = 'Seccion';
  @Input() subtitle = '';
  @Input() icon = 'pi pi-sliders-h';
}
