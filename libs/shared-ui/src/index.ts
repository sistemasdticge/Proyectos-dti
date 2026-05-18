//Una vez que se creo el componente, se exporta en este index.ts para que pueda ser utilizado en otras partes de la aplicación.
// Este archivo actúa como un punto de entrada para exportar todos los componentes y funcionalidades del módulo shared-ui.
//Este es el paso 1 despues de crear el componente
export * from './lib/shared-ui/shared-ui';
export * from './lib/components/buttons/aceptar/aceptar';
export * from './lib/components/buttons/eliminar/eliminar';
export * from './lib/components/buttons/cancelar/cancelar';
export * from './lib/components/buttons/ver-documento/ver-documento';
export * from './lib/components/cards/login-card/login-card';
export * from './lib/components/cards/dashboard-summary-header/dashboard-summary-header.component';
export * from './lib/components/cards/dashboard-kpi-card/dashboard-kpi-card.component';

export * from './lib/components/tabs/anios/anios';
export * from './lib/components/tables/archivos/archivos';
export * from './lib/components/tables/usuarios/usuarios';
export * from './lib/components/tables/temas-resumen-table/temas-resumen-table.component';


// Nuevo componente de formulario
export * from './lib/components/forms/form-ejemplo/form-ejemplo';

// Componente vacío de carga de documentos
export * from './lib/components/upload/document-upload/document-upload';

///Exportacion de sidebar//
export * from './lib/components/navigation/sidebar/sidebar.component';
// Exportacion de navbar superior reusable
export * from './lib/components/navigation/top-navbar/top-navbar.component';
export * from './lib/components/navigation/top-navbar/top-navbar.models';

// Modal reutilizable para previsualizar y descargar documentos
export * from './lib/components/modals/document-viewer/document-viewer.component';

// Componentes reutilizables de Catálogos
export * from './lib/components/catalogos/catalogos.models';
export * from './lib/components/catalogos/catalogos-header/catalogos-header.component';
export * from './lib/components/catalogos/catalogos-grid/catalogos-grid.component';
export * from './lib/components/catalogos/catalogos-table/catalogos-table.component';
export * from './lib/components/catalogos/catalogos-form-modal/catalogos-form-modal.component';

// Servicios y modelos para consumir API de Temas
export * from './lib/models/tema.model';
export * from './lib/models/usuario.model';
export * from './lib/services/api-base.service';
export * from './lib/services/api-config.service';
export * from './lib/services/api-debug-helper';
export * from './lib/services/catalogos.service';
export * from './lib/services/tema.service';
export * from './lib/services/usuarios.service';
export * from './lib/utils/blob-file.util';
export * from './lib/utils/tema-display.util';

// Componentes reutilizables de la pantalla de Temas
export * from './lib/components/temas/temas.models';
export * from './lib/components/temas/temas-toolbar/temas-toolbar.component';
export * from './lib/components/temas/temas-filters/temas-filters.component';
export * from './lib/components/temas/temas-table/temas-table.component';
export * from './lib/components/temas/temas-pagination/temas-pagination.component';
export * from './lib/components/temas/temas-create-modal/temas-create-modal.component';

// Componentes reutilizables de Configuracion
export * from './lib/components/configuracion/config-section-card/config-section-card.component';

// Animaciones reutilizables
export * from './lib/animations/shared-animations';
