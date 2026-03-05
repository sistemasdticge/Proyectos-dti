import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should render main heading', async () => {
    const fixture = TestBed.createComponent(App);

    const carpetasRequest = httpMock.expectOne(
      '/api/Files/carpetas',
    );
    carpetasRequest.flush([{ nombreCarpeta: '2025' }, { nombreCarpeta: '2024' }]);

    const archivosRequest = httpMock.expectOne(
      '/api/Files/2025/Archivos',
    );
    archivosRequest.flush(['IVAI-REV-001-2025.pdf']);

    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain(
      'Consulta Histórica de Resoluciones',
    );
  });
});
