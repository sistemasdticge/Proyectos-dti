import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TablaUsuarios } from './usuarios';

describe('TablaUsuarios', () => {
  let component: TablaUsuarios;
  let fixture: ComponentFixture<TablaUsuarios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablaUsuarios],
    }).compileComponents();

    fixture = TestBed.createComponent(TablaUsuarios);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
