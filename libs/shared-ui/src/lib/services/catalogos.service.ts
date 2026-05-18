import { inject, Injectable } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import {
  CatalogoApiRecord,
  CatalogoCreateDto,
  CatalogoRecord,
  CatalogoType,
  CatalogoTypeConfig,
  CATALOGO_TYPE_CONFIG,
  CatSituacionCreateDto,
  CatSituacionUpdateDto,
  CatalogoUpdateDto,
} from '../components/catalogos/catalogos.models';
import { ApiBaseService } from './api-base.service';

@Injectable({ providedIn: 'root' })
export class CatalogosService {
  private readonly api = inject(ApiBaseService);

  /** Obtiene todos los registros de un tipo de catálogo */
  getAll(type: CatalogoType): Observable<CatalogoRecord[]> {
    const config = this.config(type);
    return this.api.get<CatalogoApiRecord[]>(config.getEndpoint).pipe(
      map((items) => items.map((item) => this.mapToRecord(item, config)))
    );
  }

  /** Crea un nuevo registro en el catálogo */
  create(type: CatalogoType, descripcion: string): Observable<CatalogoRecord> {
    const config = this.config(type);

    if (config.isCatSituacion) {
      const dto: CatSituacionCreateDto = { descripcion, esSolventado: 0 };
      return this.api
        .post<CatalogoApiRecord>(config.createEndpoint, dto)
        .pipe(map((item) => this.mapToRecord(item, config)));
    }

    const dto: CatalogoCreateDto = {
      nombreCatalogo: config.nombreCatalogo,
      descripcion,
    };
    return this.api
      .post<CatalogoApiRecord>(config.createEndpoint, dto)
      .pipe(map((item) => this.mapToRecord(item, config)));
  }

  /** Activa o inactiva un registro existente */
  toggleActive(type: CatalogoType, record: CatalogoRecord, desiredActive: boolean): Observable<CatalogoRecord> {
    const config = this.config(type);
    const endpoint = `${config.updateEndpointBase}/${record.id}`;
    const nuevoEstatus: 0 | 1 = desiredActive ? 1 : 0;
    const dto: CatalogoUpdateDto | CatSituacionUpdateDto = config.isCatSituacion
      ? {
          id: record.id,
          descripcion: record.descripcion,
          activo: nuevoEstatus,
        }
      : {
          id: record.id,
          nombreCatalogo: config.nombreCatalogo,
          descripcion: record.descripcion,
          activo: nuevoEstatus,
        };

    console.log('[Catalogos] Toggle request', {
      type,
      endpoint,
      currentActive: record.activo,
      desiredActive,
      dto,
    });
    return this.api.put<CatalogoApiRecord>(endpoint, dto).pipe(
      tap((response) => {
        console.log('[Catalogos] Toggle response', {
          type,
          id: record.id,
          response,
          activoEnRespuesta: response?.activo,
          esSolventadoEnRespuesta: response?.esSolventado,
        });
      }),
      map((response) => this.mapToRecord(response, config))
    );
  }

  /** Edita solo la descripcion usando el mismo PUT de catalogos */
  updateDescription(type: CatalogoType, record: CatalogoRecord, descripcion: string): Observable<CatalogoRecord> {
    const config = this.config(type);
    const endpoint = `${config.updateEndpointBase}/${record.id}`;
    const dto: CatalogoUpdateDto | CatSituacionUpdateDto = config.isCatSituacion
      ? {
          id: record.id,
          descripcion,
          activo: record.activo ? 1 : 0,
        }
      : {
          id: record.id,
          nombreCatalogo: config.nombreCatalogo,
          descripcion,
          activo: record.activo ? 1 : 0,
        };

    console.log('[Catalogos] Edit description request', {
      type,
      endpoint,
      dto,
    });
    return this.api.put<CatalogoApiRecord>(endpoint, dto).pipe(
      tap((response) => {
        console.log('[Catalogos] Edit description response', {
          type,
          id: record.id,
          response,
        });
      }),
      map((response) => this.mapToRecord(response, config))
    );
  }


  private config(type: CatalogoType): CatalogoTypeConfig {
    return CATALOGO_TYPE_CONFIG[type];
  }

  private mapToRecord(item: CatalogoApiRecord, config: CatalogoTypeConfig): CatalogoRecord {
    return {
      id: item.id,
      descripcion: item.descripcion,
      activo: (item.activo ?? 1) === 1,
      esSolventado: config.isCatSituacion ? (item.esSolventado ?? 0) === 1 : undefined,
    };
  }
}

