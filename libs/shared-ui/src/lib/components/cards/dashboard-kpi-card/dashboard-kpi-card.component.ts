import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TagModule } from 'primeng/tag';

const kpiCardEnterAnimation = trigger('kpiCardEnter', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(10px) scale(0.99)' }),
    animate('360ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' })),
  ]),
]);

// -----------------------------------------------------------------------------
// MODELO DE DATOS REUSABLE PARA UNA CARD KPI
// -----------------------------------------------------------------------------
// Este contrato define exactamente que datos necesita una tarjeta para pintarse.
// Lo usas desde la app consumidora (por ejemplo en dashboard-page.ts) para crear
// un arreglo de tarjetas con tipado fuerte y sin errores de nombres de campos.
export interface DashboardKpiCardData {
  // Titulo corto que aparece arriba de la card.
  title: string;
  // Numero principal grande (indicador KPI).
  value: number;
  // Texto de variacion/tendencia (ejemplo: +5% desde ayer).
  trendLabel: string;
  // Direccion de tendencia: controla color e iconografia automaticamente.
  trendDirection: 'up' | 'down' | 'neutral';
  // Clase PrimeIcons para el icono de la esquina superior derecha.
  icon: string;
}

@Component({
  selector: 'lib-dashboard-kpi-card',
  standalone: true,
  imports: [CommonModule, TagModule],
  templateUrl: './dashboard-kpi-card.component.html',
  styleUrl: './dashboard-kpi-card.component.scss',
  animations: [kpiCardEnterAnimation],
})
export class DashboardKpiCardComponent {
  // ---------------------------------------------------------------------------
  // GUIA DE CONSUMO DE LA CARD
  // ---------------------------------------------------------------------------
  // Uso recomendado en una app:
  // <lib-dashboard-kpi-card
  //   [title]="card.title"
  //   [value]="card.value"
  //   [trendLabel]="card.trendLabel"
  //   [trendDirection]="card.trendDirection"
  //   [icon]="card.icon"
  // ></lib-dashboard-kpi-card>
  //
  // Donde personalizas valores reales:
  // apps/production/SISAR/src/app/pages/dashboard-page/dashboard-page.ts

  // Texto superior de la tarjeta (ejemplo: Temas Activos).
  @Input({ required: true }) title!: string;

  // Valor principal de la tarjeta.
  @Input({ required: true }) value!: number;

  // Texto de tendencia mostrado en la parte inferior.
  @Input({ required: true }) trendLabel!: string;

  // Sentido de tendencia para color e iconografia.
  @Input() trendDirection: 'up' | 'down' | 'neutral' = 'neutral';

  // Icono PrimeIcons (ejemplo: pi pi-clipboard).
  @Input() icon = 'pi pi-chart-line';

  // Devuelve la severidad PrimeNG del p-tag segun tendencia.
  // - up -> success (verde)
  // - down -> danger (rojo)
  // - neutral -> info (gris/azul)
  protected trendSeverity(): 'success' | 'danger' | 'info' {
    if (this.trendDirection === 'up') {
      return 'success';
    }

    if (this.trendDirection === 'down') {
      return 'danger';
    }

    return 'info';
  }

  // Devuelve el icono de flecha para el p-tag de tendencia.
  protected trendIcon(): string {
    if (this.trendDirection === 'up') {
      return 'pi pi-arrow-up';
    }

    if (this.trendDirection === 'down') {
      return 'pi pi-arrow-down';
    }

    return 'pi pi-minus';
  }

  // Clase de color para el icono superior segun tendencia.
  // Si quieres cambiar la paleta principal, empieza aqui.
  protected iconToneClass(): string {
    if (this.trendDirection === 'up') {
      return 'text-[#2563eb]';
    }

    if (this.trendDirection === 'down') {
      return 'text-[#d97706]';
    }

    return 'text-[#64748b]';
  }

  // Fondo pastel del contenedor del icono superior.
  // Permite tener una lectura visual rapida por color.
  protected iconSurfaceClass(): string {
    if (this.trendDirection === 'up') {
      return 'bg-[#eff6ff]';
    }

    if (this.trendDirection === 'down') {
      return 'bg-[#fff7ed]';
    }

    return 'bg-[#f1f5f9]';
  }

  // Clase CSS aplicada al p-tag para estilos mas finos en SCSS.
  // Estas clases se estilizan en dashboard-kpi-card.component.scss.
  protected trendClass(): string {
    if (this.trendDirection === 'up') {
      return 'kpi-trend-up';
    }

    if (this.trendDirection === 'down') {
      return 'kpi-trend-down';
    }

    return 'kpi-trend-neutral';
  }
}
