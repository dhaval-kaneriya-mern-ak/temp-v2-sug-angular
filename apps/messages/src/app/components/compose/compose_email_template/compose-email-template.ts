import { CommonModule } from '@angular/common';
import {
  Component,
  ChangeDetectionStrategy,
  inject,
  Input,
  OnDestroy,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import {
  SugUiRadioCheckboxButtonComponent,
  RadioCheckboxChangeEvent,
  SugUiButtonComponent,
  SugUiTooltipComponent,
  SugUiMultiSelectDropdownComponent,
  SugUiLoadingSpinnerComponent,
  ISelectOption,
} from '@lumaverse/sug-ui';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { ComposeService } from '../compose.service';
import { Subject, takeUntil, finalize } from 'rxjs';
import { UserStateService } from '@services/user-state.service';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  IMessagePreviewRequest,
  IMessagePreviewResponse,
  ISignUpItem,
  ISubAdmin,
  ICreateMessageRequest,
  MessageStatus,
  SentTo,
  SendToType,
  SignUPType,
} from '@services/interfaces/messages-interface/compose.interface';
import { MemberProfile } from '@services/interfaces/member-profile.interface';
import { NgxCaptchaModule } from 'ngx-captcha';
import { environment } from '@environments/environment';
import { HelpDialogComponent } from '../../utils/help-dialog/help-dialog.component';
import { FileSelectionDialogComponent } from '../../utils/file-selection-dialog/file-selection-dialog.component';
import { ActivatedRoute, Router } from '@angular/router';
import { PreviewEmailComponent } from '../../utils/preview-email/preview-email.component';
import { stripHtml } from '../../utils/services/draft-message.util';

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
    SugUiLoadingSpinnerComponent,
    SugUiMultiSelectDropdownComponent,
    ReactiveFormsModule,
    FileSelectionDialogComponent,
    NgxCaptchaModule,
    HelpDialogComponent,
    PreviewEmailComponent,
    SugUiLoadingSpinnerComponent,
  ],
  templateUrl: './compose-email-template.html',
  styleUrls: ['./compose-email-template.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ComposeEmailTemplateComponent implements OnInit, OnDestroy {
  composeService = inject(ComposeService);
  protected readonly userStateService = inject(UserStateService);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  reminderEmailForm!: FormGroup;
  confirmationEmailForm!: FormGroup;
  isLoading = false;
  private readonly destroy$ = new Subject<void>();
  userProfile: MemberProfile | null = null;
  @Input() readonly siteKey: string = environment.siteKey;
  isSelectFileDialogVisible = false;
  isHelpDialogVisible = false;
  subAdminsApiData: ISubAdmin[] = [];
  signupOptionApiData: ISignUpItem[] = [];
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
  formValidationErrors: string[] = [];
  selectedValue: string | null = null;
  isPreviewVisible = false;
  emailHtmlPreview = '';
  availableThemes: Array<number> = [1];
  messageStatus = MessageStatus;
  ngOnInit(): void {
    this.initializeForms();

    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const messageId = Number(params['id']);

        if (!isNaN(messageId) && messageId > 0) {
          this.getMessageById(messageId);
        }
      });
  }

  handleSelection(event: RadioCheckboxChangeEvent) {
    this.selectedValue = event.value; // Update the selected size
    this.showRadioButtons = false; // Hide the radio buttons
  }

  showOptionsAgain() {
    this.showRadioButtons = true;
    this.selectedValue = null; // Reset the selected size
    this.reminderEmailForm.reset({
      themeid: 1,
    });
    this.confirmationEmailForm.reset({
      themeid: 1,
    });
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

  private initializeForms(): void {
    // Create form for reminder email template
    this.reminderEmailForm = this.fb.group({
      fromName: ['', Validators.required],
      replyTo: [[]], // Changed to array for multi-select dropdown
      subject: ['', Validators.required],
      message: ['', Validators.required],
      token: ['', Validators.required],
      assignTo: [''],
      themeid: [1],
    });

    // Create form for confirmation email template
    this.confirmationEmailForm = this.fb.group({
      fromName: ['', Validators.required],
      replyTo: [[]], // Changed to array for multi-select dropdown
      subject: ['', Validators.required],
      message: ['', Validators.required],
      token: ['', Validators.required],
      assignTo: [''],
      themeid: [1],
    });
    this.getSubAdmins();
  }

  onThemeChange(themeId: number): void {
    this.currentEmailForm.get('themeid')?.setValue(themeId || 1);
    this.onPreviewAndSend(this.currentEmailForm);
  }

  onSaveDraft(status: MessageStatus): void {
    this.isLoading = true;
    const form = this.currentEmailForm.value;
    const payload: ICreateMessageRequest = {
      subject: form.subject,
      body: form.message,
      sentto: SentTo.ALL,
      sendtotype: SendToType.PEOPLE_IN_GROUPS,
      status: status,
      messagetypeid: this.selectedValue === 'emailoptionone' ? 8 : 2,
      sendasemail: true,
      sendastext: false,
      themeid: form.themeid,
      contactname: form.fromName,
      replytoids: form.replyTo.map((id: string) => Number(id)),
      signupids: form.assignTo.map((id: string) => Number(id)),
    };

    this.composeService.createMessage(payload).subscribe({
      next: (response) => {
        if (response.success === true && response.data) {
          // const array = this.signupOptionApiData.filter((su) =>
          //   form.assignTo.includes(String(su.signupid))
          // );
          this.composeService.triggerSuccessPage('custom', []);
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        // this.toastr.error(err.error.message[0]?.details, 'Error');
        err?.error?.message?.forEach((element: { details: string }) => {
          this.formValidationErrors.push(element.details);
        });
        this.onPreviewAndSend(this.currentEmailForm);
      },
    });
  }

  onPreviewAndSend(form: FormGroup): void {
    this.isLoading = true;
    const selectedSignups = this.signupOptionApiData
      .filter((su) => form.value.assignTo.includes(String(su.signupid)))
      .map((su) => ({
        id: su.signupid,
        title: su.title,
        themeid: su.themeid ?? 1,
      }));
    const payload: IMessagePreviewRequest = {
      fromname: form.value.fromName,
      replyto: this.subAdminsApiData
        .filter((su) => form.value.replyTo.includes(String(su.id)))
        .map((su) => su.email),
      subject: form.value.subject,
      message: form.value.message,
      emailtype: this.selectedValue === 'emailoptionone' ? '8' : '2',
      themeid: form.value.themeid ?? 1,
      signuptype: SignUPType.SIGNUP,
      signupids: selectedSignups.map((su) => su.id),
    };
    this.availableThemes = [
      1,
      ...(selectedSignups || []).map((su) => su.themeid),
    ];
    // Load signups
    this.composeService
      .messagePreview(payload)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (response: IMessagePreviewResponse) => {
          if (response?.success && response.data?.textpreview?.length > 0) {
            this.emailHtmlPreview = response.data.htmlpreview;
            this.isPreviewVisible = true;
            this.currentEmailForm
              .get('token')
              ?.removeValidators(Validators.required);
            this.currentEmailForm.get('token')?.updateValueAndValidity();
          }
        },
        error: (err) => {
          this.isPreviewVisible = false;
          // this.toastr.error(
          //   err?.error?.message?.[0]?.details || 'Failed to load preview',
          //   'Error'
          // );
          err?.error?.message?.forEach((element: { details: string }) => {
            this.formValidationErrors.push(element.details);
          });
        },
      });
  }

  /**
   * Called when preview dialog is closed. Reset preview related state so
   * reopening the dialog shows default values (themeid=1 and empty preview).
   */
  onPreviewClose(): void {
    // Ensure the dialog visibility flag is false
    this.isPreviewVisible = false;

    // Reset the preview HTML shown in the dialog
    this.emailHtmlPreview = '';

    // Reset available themes and form theme to default (1)
    this.availableThemes = [1];
    this.currentEmailForm.get('themeid')?.setValue(1);
    this.currentEmailForm.get('token')?.addValidators(Validators.required);
    this.currentEmailForm.get('token')?.updateValueAndValidity();
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
    this.isLoading = true;
    this.composeService.getSignUpList().subscribe({
      next: (apiResponse) => {
        if (apiResponse && apiResponse.success) {
          this.signupOptionApiData = apiResponse.data;
          this.signUpOptions = apiResponse.data.map((signup) => ({
            label: signup.title,
            value: signup.signupid?.toString() || '',
          }));
        }
        this.loadUserProfile();
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
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
            this.subAdminsApiData = apiResponse.data;
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

  getMessageById(id: number) {
    this.isLoading = true;

    type ReplyToItem = { memberid: number; email: string };

    const optionOne = 8;
    const optionTwo = 2;

    this.composeService
      .getMessageById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (!response.success) {
            this.isLoading = false;
            // this.toastr.error(
            //   'Failed to load message. Invalid message ID.',
            //   'Error'
            // );
            this.formValidationErrors = [
              'Failed to load message. Invalid message ID.',
            ];
            this.router.navigate(['/messages/compose']);
            return;
          }

          if (response.data.messagetypeid == optionOne) {
            this.selectedValue = 'emailoptionone';

            this.showRadioButtons = false;

            this.loadUserProfile();

            const replyToMemberIds = (
              (response.data.replyto as ReplyToItem[]) || []
            ).map((item) => String(item.memberid));

            this.reminderEmailForm.patchValue({
              subject: response.data.subject,
              message: stripHtml(response.data.body),
            });

            setTimeout(() => {
              this.reminderEmailForm.get('replyTo')?.setValue(replyToMemberIds);
              this.reminderEmailForm.get('replyTo')?.updateValueAndValidity();
            }, 0);

            this.isLoading = false;
          } else if (response.data.messagetypeid == optionTwo) {
            this.selectedValue = 'emailoptiontwo';

            this.showRadioButtons = false;

            this.loadUserProfile();

            const replyToMemberIds = (
              (response.data.replyto as ReplyToItem[]) || []
            ).map((item) => String(item.memberid));

            this.confirmationEmailForm.patchValue({
              subject: response.data.subject,
              message: stripHtml(response.data.body),
            });

            setTimeout(() => {
              this.confirmationEmailForm
                .get('replyTo')
                ?.setValue(replyToMemberIds);
              this.confirmationEmailForm
                .get('replyTo')
                ?.updateValueAndValidity();
            }, 0);

            this.isLoading = false;
          } else {
            this.isLoading = false;
            // this.toastr.error(
            //   `This message type (${response.data.messagetypeid}) cannot be edited in this form.`,
            //   'Unsupported Message Type'
            // );
            this.formValidationErrors = [
              `This message type (${response.data.messagetypeid}) cannot be edited in this form.`,
            ];
            this.router.navigate(['/messages/compose']);
          }
        },

        error: (error) => {
          this.isLoading = false;
          // console.error('Failed to load message', error);
          // this.toastr.error(
          //   'Failed to load message. Please try again.',
          //   'Error'
          // );
          this.formValidationErrors = [
            'Failed to load message. Please try again.',
          ];
          this.router.navigate(['/messages/compose']);
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
