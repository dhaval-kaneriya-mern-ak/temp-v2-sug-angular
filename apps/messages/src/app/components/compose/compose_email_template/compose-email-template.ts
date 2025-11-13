import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import {
  SugUiRadioCheckboxButtonComponent,
  RadioCheckboxChangeEvent,
  SugUiButtonComponent,
  SugUiTooltipComponent,
  SugUiMultiSelectDropdownComponent,
} from '@lumaverse/sug-ui';
import { ISelectOption } from '@lumaverse/sug-ui';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { ComposeService } from '../compose.service';
import { Subject, takeUntil } from 'rxjs';
import { UserStateService } from '@services/user-state.service';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MemberProfile } from '@services/interfaces';
import { NgxCaptchaModule } from 'ngx-captcha';
import { environment } from '@environments/environment';
import { HelpDialogComponent } from '../../utils/help-dialog/help-dialog.component';
import { FileSelectionDialogComponent } from '../../utils/file-selection-dialog/file-selection-dialog.component';

@Component({
  selector: 'sug-compose-email-template',
  standalone: true,
  imports: [
    CommonModule,
    SugUiRadioCheckboxButtonComponent,
    SugUiButtonComponent,
    SugUiTooltipComponent,
    ButtonModule,
    BadgeModule,
    SugUiMultiSelectDropdownComponent,
    ReactiveFormsModule,
    FileSelectionDialogComponent,
    NgxCaptchaModule,
    HelpDialogComponent,
  ],
  templateUrl: './compose-email-template.html',
  styleUrls: ['./compose-email-template.scss'],
})
export class ComposeEmailTemplateComponent implements OnInit, OnDestroy {
  composeService = inject(ComposeService);
  protected readonly userStateService = inject(UserStateService);
  private fb = inject(FormBuilder);
  reminderEmailForm!: FormGroup;
  confirmationEmailForm!: FormGroup;
  isLoading = false;
  private readonly destroy$ = new Subject<void>();
  userProfile: MemberProfile | null = null;
  @Input() readonly siteKey: string = environment.siteKey;
  isSelectFileDialogVisible = false;
  isHelpDialogVisible = false;
  subAdminsData: ISelectOption[] = [];
  assignToData: ISelectOption[] = [];
  // Options for the dialog select box when first radio option is selected
  signUpOptions: ISelectOption[] = [];
  defaultSignUpOption: ISelectOption = this.signUpOptions[0];
  showRadioButtons = true;
  radioOptions = [
    { label: 'Create a reminder email template', value: 'emailoptionone' },
    {
      label: 'Create a confirmation email template',
      value: 'emailoptiontwo',
    },
  ];
  selectedValue: string | null = null;

  ngOnInit(): void {
    this.initializeForms();
  }

  handleSelection(event: RadioCheckboxChangeEvent) {
    this.selectedValue = event.value; // Update the selected size
    this.showRadioButtons = false; // Hide the radio buttons
  }

  showOptionsAgain() {
    this.showRadioButtons = true;
    this.selectedValue = null; // Reset the selected size
    this.reminderEmailForm.reset();
    this.confirmationEmailForm.reset();
    this.loadUserProfile();
  }

  // Methods for "Select File" dialog
  openSelectFileDialog() {
    this.isSelectFileDialogVisible = true;
  }

  closeSelectFileDialog() {
    this.isSelectFileDialogVisible = false;
  }

  // Methods for "Help" dialog
  openHelpDialog() {
    this.isHelpDialogVisible = true;
  }

  closeHelpDialog() {
    this.isHelpDialogVisible = false;
  }

  sendEmail() {
    // In a real app, you would gather form data and send it.
    // alert('Email sent! (Check the console)');
  }

  private initializeForms(): void {
    // Create form for reminder email template
    this.reminderEmailForm = this.fb.group({
      fromName: ['', Validators.required],
      replyTo: [''],
      subject: ['', Validators.required],
      message: ['', Validators.required],
      token: ['', Validators.required],
      assignTo: [''],
    });

    // Create form for confirmation email template
    this.confirmationEmailForm = this.fb.group({
      fromName: ['', Validators.required],
      replyTo: [''],
      subject: ['', Validators.required],
      message: ['', Validators.required],
      token: ['', Validators.required],
      assignTo: [''],
    });
    this.getSubAdmins();
  }

  // Get current form based on selected template type
  get currentEmailForm(): FormGroup {
    return this.selectedValue === 'emailoptionone'
      ? this.reminderEmailForm
      : this.confirmationEmailForm;
  }

  handleReset(): void {
    this.currentEmailForm.get('token')?.reset();
  }

  handleExpire(): void {
    this.currentEmailForm.get('token')?.setValue(null);
  }

  handleSuccess(token: string): void {
    this.currentEmailForm.get('token')?.setValue(token);
  }

  getSignUpList() {
    this.composeService.getSignUpList().subscribe({
      next: (apiResponse) => {
        if (apiResponse && apiResponse.success) {
          this.signUpOptions = apiResponse.data.map((signup) => ({
            label: signup.title,
            value: signup.signupid?.toString() || '',
          }));
        }
        this.loadUserProfile();
      },
      error: (error) => {
        console.error('Error fetching signup list:', error);
      },
    });
  }

  getSubAdmins() {
    this.isLoading = true;
    this.composeService
      .getSubAdmins()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (apiResponse) => {
          if (apiResponse && apiResponse.data) {
            this.subAdminsData = apiResponse.data.map((admin) => ({
              label: `${admin.firstname} ${admin.lastname} (${admin.email})`,
              value: admin.id.toString(),
            }));
          }
          this.isLoading = false;
          this.getSignUpList();
        },
        error: () => {
          this.isLoading = false;
          this.subAdminsData = [];
        },
      });
  }

  private loadUserProfile(): void {
    this.userStateService.userProfile$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          this.userProfile = profile;
          if (profile) {
            const fullName = `${profile.firstname || ''} ${
              profile.lastname || ''
            }`.trim();
            if (this.reminderEmailForm) {
              this.reminderEmailForm.patchValue({ fromName: fullName });
            }
            if (this.confirmationEmailForm) {
              this.confirmationEmailForm.patchValue({ fromName: fullName });
            }
          }
        },
        error: () => {
          // Error loading user profile
        },
      });
  }
  /**
   * Cleanup subscriptions on component destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
