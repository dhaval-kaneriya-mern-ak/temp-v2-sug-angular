import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { Sent } from './sent';

// Mock ResizeObserver for PrimeNG components
(
  global as unknown as { ResizeObserver: typeof ResizeObserver }
).ResizeObserver = class ResizeObserver {
  observe(): void {
    // Mock implementation
  }

  disconnect(): void {
    // Mock implementation
  }

  unobserve(): void {
    // Mock implementation
  }

  constructor() {
    // Mock constructor
  }
};

@Component({
  template: '<router-outlet></router-outlet>',
  standalone: true,
})
class MockRouterOutlet {}

describe('Sent', () => {
  let component: Sent;
  let fixture: ComponentFixture<Sent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Sent,
        RouterTestingModule.withRoutes([
          { path: 'message-details', component: MockRouterOutlet },
          { path: 'analytics', component: MockRouterOutlet },
        ]),
        MockRouterOutlet,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(Sent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
