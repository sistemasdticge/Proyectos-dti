import { Component, input } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'lib-eliminar',
  imports: [ButtonModule],
  templateUrl: './eliminar.html',
  styleUrl: './eliminar.css',
})
export class Eliminar {
  label = input('Eliminar');
}

