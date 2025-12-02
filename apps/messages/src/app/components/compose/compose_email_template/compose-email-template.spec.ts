import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { ComposeEmailTemplateComponent } from './compose-email-template';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TOAST_CONFIG, ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';

describe('ComposeEmailTemplateComponent', () => {
  let component: ComposeEmailTemplateComponent;
  let fixture: ComponentFixture<ComposeEmailTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComposeEmailTemplateComponent, HttpClientTestingModule],
      providers: [
        ToastrService,
        {
          provide: TOAST_CONFIG,
          useValue: {
            default: {
              iconClasses: {
                error: 'toast-error',
                info: 'toast-info',
                success: 'toast-success',
                warning: 'toast-warning',
              },
            },
            config: {},
          },
        },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ComposeEmailTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
