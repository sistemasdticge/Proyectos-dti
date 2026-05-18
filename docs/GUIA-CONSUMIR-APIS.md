# Guía: Cómo Consumir las APIs de SISAR en Angular

## 📋 Resumen

Has creado 3 archivos clave para consumir los endpoints del backend SISAR:

### 1. **Modelos/Interfaces** (`tema.model.ts`)
Define los DTOs (Data Transfer Objects) de TypeScript que coinciden con la estructura del Swagger.

### 2. **Servicio Base** (`api-base.service.ts`)
Servicio genérico que maneja:
- Autenticación Bearer JWT
- Peticiones GET, POST, PUT, DELETE
- Multipart/form-data para archivos
- Manejo centralizado de errores

### 3. **Servicio de Tema** (`tema.service.ts`)
Métodos específicos para cada endpoint de Tema, TemaSeguimiento y TemaTurno.

---

## 🚀 Pasos para Usarlo en tu Componente

### Paso 1: Importar el servicio
```typescript
import { TemaService } from '../../../libs/shared-ui/src/lib/services/tema.service';
```

### Paso 2: Inyectar en el componente
```typescript
@Component({...})
export class TuComponente {
  constructor(private temaService: TemaService) {}
}
```

### Paso 3: Usar los métodos

#### **Obtener lista de temas:**
```typescript
this.temaService.getAllTemas().subscribe({
  next: (temas) => {
    console.log('Temas:', temas);
    this.temas = temas;
  },
  error: (err) => {
    console.error('Error:', err);
  },
});
```

#### **Obtener tema por ID:**
```typescript
this.temaService.getTemaById('uuid-del-tema').subscribe({
  next: (tema) => {
    console.log('Detalles:', tema);
  },
  error: (err) => console.error(err),
});
```

#### **Crear un tema (sin archivos):**
```typescript
const nuevoTema = {
  tipoTemaId: '550e8400-e29b-41d4-a716-446655440000',
  tipoPrioridadId: '660e8400-e29b-41d4-a716-446655440001',
  descripcion: 'Mi primer tema',
  numControl: 'CTRL-001',
  fechaVencimiento: new Date().toISOString(),
};

this.temaService.createTema(nuevoTema).subscribe({
  next: (temaCreado) => console.log('Tema creado:', temaCreado),
  error: (err) => console.error('Error:', err),
});
```

#### **Crear un tema con archivos:**
```typescript
const archivos = [file1, file2]; // Array de File objects

this.temaService.createTema(nuevoTema, archivos).subscribe({
  next: (temaCreado) => console.log('Creado con archivos:', temaCreado),
  error: (err) => console.error('Error:', err),
});
```

#### **Actualizar un tema:**
```typescript
const temaActualizado = {
  id: 'uuid-tema',
  tipoTemaId: '...',
  tipoPrioridadId: '...',
  descripcion: 'Descripción actualizada',
  numControl: 'CTRL-001-UPDATED',
  fechaVencimiento: '2025-12-31T23:59:59Z',
};

this.temaService.updateTema('uuid-tema', temaActualizado).subscribe({
  next: (tema) => console.log('Actualizado:', tema),
  error: (err) => console.error('Error:', err),
});
```

#### **Eliminar un tema:**
```typescript
this.temaService.deleteTema('uuid-tema').subscribe({
  next: () => console.log('Tema eliminado'),
  error: (err) => console.error('Error:', err),
});
```

#### **Subir archivo a un tema:**
```typescript
const temaId = 'uuid-tema';
const tipoDocumentoId = 'uuid-tipo-doc';
const file = fileInputElement.files[0];

this.temaService.uploadTemaFile(temaId, tipoDocumentoId, file).subscribe({
  next: (archivoDTO) => console.log('Archivo subido:', archivoDTO),
  error: (err) => console.error('Error:', err),
});
```

---

## 🔄 Métodos de TemaSeguimiento (Seguimiento de Temas)

#### **Obtener seguimiento:**
```typescript
this.temaService.getTemaSeguimientoById('uuid-seguimiento').subscribe({
  next: (seg) => console.log('Seguimiento:', seg),
  error: (err) => console.error('Error:', err),
});
```

#### **Crear seguimiento:**
```typescript
const seguimiento = {
  temaTurnoId: 'uuid-turno',
  fecha: new Date().toISOString(),
  descripcion: 'Primera actualización de seguimiento',
  situacionId: 'uuid-situacion',
};

this.temaService.createTemaSeguimiento(seguimiento).subscribe({
  next: (seg) => console.log('Seguimiento creado:', seg),
  error: (err) => console.error('Error:', err),
});
```

#### **Actualizar seguimiento:**
```typescript
const segActualizado = {
  id: 'uuid-seg',
  tematurnoId: 'uuid-turno',
  fecha: new Date().toISOString(),
  descripcion: 'Seguimiento actualizado',
  situacionId: 'uuid-situacion',
};

this.temaService.updateTemaSeguimiento('uuid-seg', segActualizado).subscribe({
  next: (seg) => console.log('Actualizado:', seg),
  error: (err) => console.error('Error:', err),
});
```

---

## 🎯 Métodos de TemaTurno

#### **Obtener turno:**
```typescript
this.temaService.getTemaTurnoById('uuid-turno').subscribe({
  next: (turno) => console.log('Turno:', turno),
  error: (err) => console.error('Error:', err),
});
```

#### **Obtener turnos por área:**
```typescript
this.temaService.getTemaTurnoByAreaId('uuid-area').subscribe({
  next: (turnos) => console.log('Turnos del área:', turnos),
  error: (err) => console.error('Error:', err),
});
```

#### **Obtener turnos por tema (solventados y pendientes):**
```typescript
this.temaService.getTemaTurnoByTemaId('uuid-tema').subscribe({
  next: (turnos) => console.log('Todos los turnos del tema:', turnos),
  error: (err) => console.error('Error:', err),
});

// Solo solventados (solventado = 1)
this.temaService.getTemaTurnoByTemaAndSolventado('uuid-tema', 1).subscribe({
  next: (turnos) => console.log('Turnos solventados:', turnos),
  error: (err) => console.error('Error:', err),
});
```

#### **Crear turno:**
```typescript
const nuevoTurno = {
  temaId: 'uuid-tema',
  areaId: 'uuid-area',
  area: 'Departamento de TI', // Opcional
};

this.temaService.createTemaTurno(nuevoTurno).subscribe({
  next: (turno) => console.log('Turno creado:', turno),
  error: (err) => console.error('Error:', err),
});
```

---

## 🛡️ Manejo de Errores

Todos los métodos devuelven:
```typescript
{
  status: number;      // HTTP status (400, 404, 500, etc)
  message: string;    // Título del error
  detail: string;     // Detalles adicionales
}
```

**Ejemplo completo con error handling:**
```typescript
this.temaService.getAllTemas().subscribe({
  next: (temas) => {
    this.temas = temas;
    this.loading = false;
  },
  error: (err) => {
    console.error('Status:', err.status);
    console.error('Mensaje:', err.message);
    console.error('Detalle:', err.detail);
    
    this.loading = false;
    this.error = err;
  },
});
```

---

## 💡 Tips Importantes

### 1. **Usar `takeUntil` para evitar memory leaks:**
```typescript
import { takeUntil } from 'rxjs/operators';

export class TuComponente implements OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.temaService
      .getAllTemas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({...});
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### 2. **Transformar datos con `map` (RxJS):**
```typescript
import { map } from 'rxjs/operators';

this.temaService
  .getAllTemas()
  .pipe(
    map((temas) => temas.filter((t) => !t.solventado)),
    takeUntil(this.destroy$)
  )
  .subscribe((temasPendientes) => {
    console.log('Solo temas pendientes:', temasPendientes);
  });
```

### 3. **Combinar múltiples llamadas (forkJoin):**
```typescript
import { forkJoin } from 'rxjs';

forkJoin([
  this.temaService.getAllTemas(),
  this.temaService.getTemaTurnoByAreaId('uuid-area'),
]).subscribe({
  next: ([temas, turnos]) => {
    console.log('Temas:', temas);
    console.log('Turnos:', turnos);
  },
  error: (err) => console.error('Error:', err),
});
```

### 4. **URL Base Configurable:**
Si necesitas cambiar la URL base, edita `api-base.service.ts`:
```typescript
private readonly API_BASE_URL = 'http://svr-apps1/sisarback.test/api';
```

---

## 📝 Estructura de Archivos

```
libs/shared-ui/src/lib/
├── models/
│   └── tema.model.ts          ← DTOs/Interfaces
├── services/
│   ├── api-base.service.ts    ← Servicio base genérico
│   └── tema.service.ts        ← Métodos específicos de Tema
└── components/
    └── ...
```

---

## ✅ Checklist para tu componente de Temas

- [ ] Importar `TemaService` en el componente
- [ ] Inyectar en el constructor
- [ ] Crear `Subject<void>` para unsubscribe
- [ ] Usar `takeUntil` en todas las suscripciones
- [ ] Implementar `OnDestroy`
- [ ] Manejar estados: loading, error, datos
- [ ] Mostrar UI según cada estado
- [ ] Llamar métodos de `TemaService` según acciones del usuario

---

## 🔗 URL de Referencia

**Swagger:** http://svr-apps1/sisarback.test/swagger/index.html  
**API Base:** http://svr-apps1/sisarback.test/api

---

¡Listo! Ya tienes todo el código configurado para consumir las APIs. 🎉
