import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VerDocumento } from './ver-documento';

describe('VerDocumento', () => {
  let component: VerDocumento;
  let fixture: ComponentFixture<VerDocumento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerDocumento],
    }).compileComponents();

    fixture = TestBed.createComponent(VerDocumento);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
