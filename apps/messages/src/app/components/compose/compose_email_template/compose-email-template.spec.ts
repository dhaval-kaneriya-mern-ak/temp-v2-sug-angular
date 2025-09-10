import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComposeEmailTemplateComponent } from './compose-email-template';

describe('ComposeEmailTemplateComponent', () => {
  let component: ComposeEmailTemplateComponent;
  let fixture: ComponentFixture<ComposeEmailTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComposeEmailTemplateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ComposeEmailTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
