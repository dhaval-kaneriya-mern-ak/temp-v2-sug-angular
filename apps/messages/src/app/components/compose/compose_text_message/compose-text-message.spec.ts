import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComposeTextMessageComponent } from './compose-text-message';

describe('ComposeTextMessageComponent', () => {
  let component: ComposeTextMessageComponent;
  let fixture: ComponentFixture<ComposeTextMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComposeTextMessageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ComposeTextMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
