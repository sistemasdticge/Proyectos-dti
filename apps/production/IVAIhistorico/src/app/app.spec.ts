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

  it('should load all resolutions on init and show all years label', async () => {
    const fixture = TestBed.createComponent(App);

    const allArchivosRequest = httpMock.expectOne('/api/Files');
    allArchivosRequest.flush([
      { nombreCarpeta: '2025', nombreArchivo: 'IVAI-REV-001-2025.pdf' },
      { nombreCarpeta: '2024', nombreArchivo: 'IVAI-REV-001-2024.pdf' },
    ]);

    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain('Resoluciones de todos los años');
  });
});
