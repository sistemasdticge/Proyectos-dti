import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Aceptar } from './aceptar';

describe('Aceptar', () => {
  let component: Aceptar;
  let fixture: ComponentFixture<Aceptar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Aceptar],
    }).compileComponents();

    fixture = TestBed.createComponent(Aceptar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
