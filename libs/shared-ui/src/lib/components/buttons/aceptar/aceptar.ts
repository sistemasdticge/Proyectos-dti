import { Component, input } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'lib-aceptar',
  imports: [ButtonModule],
  templateUrl: './aceptar.html',
  styleUrl: './aceptar.css',
})
export class Aceptar {
  label = input('Aceptar');
}
