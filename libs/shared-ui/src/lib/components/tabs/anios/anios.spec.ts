import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Anios } from './anios';

describe('Anios', () => {
  let component: Anios;
  let fixture: ComponentFixture<Anios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Anios],
    }).compileComponents();

    fixture = TestBed.createComponent(Anios);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
