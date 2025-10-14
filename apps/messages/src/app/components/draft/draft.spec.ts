import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Draft } from './draft';

describe('Draft', () => {
  let component: Draft;
  let fixture: ComponentFixture<Draft>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Draft],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Draft);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
