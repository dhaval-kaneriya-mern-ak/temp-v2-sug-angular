import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComposeTextMessageComponent } from './compose-text-message';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TOAST_CONFIG, DefaultGlobalConfig, ToastrService } from 'ngx-toastr';

class MockToastrService {
  success() {
    /* mock success */
  }
  error() {
    /* mock error */
  }
  info() {
    /* mock info */
  }
  warning() {
    /* mock warning */
  }
}

describe('ComposeTextMessageComponent', () => {
  let component: ComposeTextMessageComponent;
  let fixture: ComponentFixture<ComposeTextMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComposeTextMessageComponent, HttpClientTestingModule],
      providers: [
        { provide: TOAST_CONFIG, useValue: DefaultGlobalConfig },
        { provide: ToastrService, useClass: MockToastrService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ComposeTextMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
