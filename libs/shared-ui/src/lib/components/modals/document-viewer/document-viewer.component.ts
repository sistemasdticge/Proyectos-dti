import { Component, computed, inject, input, output } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DialogModule } from 'primeng/dialog';

// Componente reutilizable para previsualizar y descargar documentos.
//
// CÓMO USARLO:
//   1. Importa DocumentViewerComponent en tu componente padre.
//   2. Pasa los datos con inputs:
//      <lib-document-viewer
//        [open]="modalAbierto()"
//        [loading]="cargando()"
//        [error]="errorMensaje()"
//        [blobUrl]="urlBlob()"
//        [mimeType]="blob?.type"
//        [fileName]="nombreArchivo()"
//        (closeModal)="cerrarModal()"
//        (download)="descargar()"
//      />
//
// RESPONSABILIDAD DEL PADRE:
//   - Llamar a la API y obtener el Blob.
//   - Crear la blobUrl con URL.createObjectURL(blob).
//   - Liberar la blobUrl cuando cierre con URL.revokeObjectURL(url).
//
// RESPONSABILIDAD DE ESTE COMPONENTE:
//   - Sanitizar la blobUrl internamente para el iframe/object.
//   - Mostrar los estados: cargando / error / preview / no previsualizable.
//   - Emitir eventos cuando el usuario quiere cerrar o descargar.

@Component({
  standalone: true,
  selector: 'lib-document-viewer',
  templateUrl: './document-viewer.component.html',
  styleUrls: ['./document-viewer.component.scss'],
  imports: [DialogModule],
})
export class DocumentViewerComponent {
  private readonly sanitizer = inject(DomSanitizer);

  // --- INPUTS ---

  /** Controla si el modal está visible. */
  readonly open = input<boolean>(false);

  /** Muestra el spinner de carga mientras se obtiene el documento. */
  readonly loading = input<boolean>(false);

  /** Mensaje de error a mostrar si la carga falla. Null = sin error. */
  readonly error = input<string | null>(null);

  /**
   * URL de tipo blob (ej. "blob:http://...") creada con URL.createObjectURL().
   * El componente la sanitiza internamente para usarla en el iframe.
   */
  readonly blobUrl = input<string | null>(null);

  /** Nombre del archivo que se muestra en el encabezado del modal. */
  readonly fileName = input<string>('');

  /** Tipo MIME del archivo, usado para elegir iframe, imagen o mensaje fallback. */
  readonly mimeType = input<string>('');

  // --- OUTPUTS ---

  /** Se emite cuando el usuario hace clic en ✕ o en el backdrop. */
  readonly closeModal = output<void>();

  /** Se emite cuando el usuario hace clic en "Descargar". */
  readonly download = output<void>();

  // --- COMPUTED ---

  /** URL sanitizada lista para el [src] del iframe. */
  readonly safeUrl = computed((): SafeResourceUrl | null => {
    const url = this.blobUrl();
    if (!url) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  readonly canPreview = computed(() => this.isPdf() || this.isImage());

  readonly isPdf = computed(() => {
    const mime = this.mimeType().toLowerCase();
    const name = this.fileName().toLowerCase();
    return mime.includes('pdf') || name.endsWith('.pdf');
  });

  readonly isImage = computed(() => {
    const mime = this.mimeType().toLowerCase();
    const name = this.fileName().toLowerCase();
    return (
      mime.startsWith('image/') ||
      name.endsWith('.png') ||
      name.endsWith('.jpg') ||
      name.endsWith('.jpeg') ||
      name.endsWith('.webp')
    );
  });

  // --- HANDLERS ---

  onBackdropClick(event: MouseEvent): void {
    // Solo cierra si se hizo clic directamente en el backdrop, no en el panel interior.
    if (event.target === event.currentTarget) {
      this.closeModal.emit();
    }
  }
}
