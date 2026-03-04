import { Component, input } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'lib-cancelar',
  imports: [ButtonModule],
  templateUrl: './cancelar.html',
  styleUrl: './cancelar.css',
})
export class Cancelar {
  label = input('Cancelar');
}
