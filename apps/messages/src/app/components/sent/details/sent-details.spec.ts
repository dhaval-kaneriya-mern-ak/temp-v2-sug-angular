import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { SentDetails } from './sent-details';

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

describe('SentDetails', () => {
  let component: SentDetails;
  let fixture: ComponentFixture<SentDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SentDetails],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SentDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
