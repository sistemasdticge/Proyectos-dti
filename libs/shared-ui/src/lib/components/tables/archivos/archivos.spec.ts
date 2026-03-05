import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TablaArchivos } from './archivos';

describe('TablaArchivos', () => {
  let component: TablaArchivos;
  let fixture: ComponentFixture<TablaArchivos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablaArchivos],
    }).compileComponents();

    fixture = TestBed.createComponent(TablaArchivos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
