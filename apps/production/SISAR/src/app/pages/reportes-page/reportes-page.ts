import { Component } from '@angular/core';
import { pageSectionEnterAnimation } from '@proyectos-dti/shared-ui';

@Component({
  selector: 'app-reportes-page',
  standalone: true,
  templateUrl: './reportes-page.html',
  styleUrl: './reportes-page.scss',
  animations: [pageSectionEnterAnimation],
})
export class ReportesPage {}
