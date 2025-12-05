import {
  Observable,
  takeUntil,
  switchMap,
  tap,
  of,
  catchError,
  forkJoin,
} from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { ISaveDraftMessagePayload, IFileItem } from '@services/interfaces';
import {
  IFileDetailsData,
  SendToType,
  SentTo,
} from '@services/interfaces/messages-interface/compose.interface';
import { ComposeService } from '../../compose/compose.service';
import { ComposeEmailStateService } from './compose-email-state.service';
import { environment } from '@environments/environment';

/**
 * Utility functions for draft message operations and recipient mapping
 * Consolidated utilities for composing, editing, and managing draft messages
 * Shared across compose-text-message, compose-email, and compose-email-template components
 */

// ============================================================================
// DRAFT MESSAGE OPERATIONS
// ============================================================================

/**
 * Response structure from save draft API
 */
interface SaveDraftResponse {
  success: boolean;
  data: {
    data: number;
  };
}

/**
 * Options for saving a draft message
 */
interface SaveDraftOptions {
  messageId: number;
  payload: ISaveDraftMessagePayload;
  composeService: ComposeService;
  toastr: ToastrService;
  destroy$: Observable<void>;
  onSuccess?: (messageId: number) => void;
  onError?: () => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

/**
 * Options for handling draft load errors
 */
interface DraftLoadErrorOptions {
  toastr: ToastrService;
  router: Router;
  stateService: ComposeEmailStateService;
  onCleanup?: () => void;
}

/**
 * Saves a draft message to the API
 * Handles loading state, success/error messages, and callbacks
 */
export function saveDraftMessage(options: SaveDraftOptions): void {
  const {
    messageId,
    payload,
    composeService,
    toastr,
    destroy$,
    onSuccess,
    onError,
    onLoadingChange,
  } = options;

  if (onLoadingChange) {
    onLoadingChange(true);
  }

  composeService
    .saveDraftMessage(messageId, payload)
    .pipe(takeUntil(destroy$))
    .subscribe({
      next: (response: SaveDraftResponse) => {
        if (onLoadingChange) {
          onLoadingChange(false);
        }

        if (response.success) {
          toastr.success('Draft message saved successfully!', 'Success');

          if (onSuccess) {
            onSuccess(response.data.data);
          }
        } else {
          const errorMessage = parseApiErrorMessage(
            response as any,
            'Failed to save draft'
          );
          toastr.error(errorMessage, 'Error');

          if (onError) {
            onError();
          }
        }
      },
      error: (error) => {
        if (onLoadingChange) {
          onLoadingChange(false);
        }
        console.error('Error saving draft:', error);

        const errorMessage = parseApiErrorMessage(
          error,
          'Failed to save draft. Please try again.'
        );
        toastr.error(errorMessage, 'Error');

        if (onError) {
          onError();
        }
      },
    });
}

/**
 * Handles draft load error by cleaning up state and navigating away
 * Common error handling for getMessageById failures
 */
export function handleDraftLoadError(options: DraftLoadErrorOptions): void {
  const { toastr, router, stateService, onCleanup } = options;

  stateService.setDraftEditMode(false);

  if (onCleanup) {
    onCleanup();
  }

  toastr.error('Failed to load message. Invalid message ID.', 'Error');
  router.navigate(['/messages/compose']);
}

/**
 * Initializes draft edit mode state
 * Common state setup when loading a draft for editing
 */
export function initializeDraftEditMode(
  id: number,
  stateService: ComposeEmailStateService,
  sendtotype: string,
  sendastext: boolean | undefined,
  sendasemail: boolean | undefined,
  onStateUpdate: (data: {
    isEditingExistingDraft: boolean;
    currentDraftMessageId: number;
    currentSendToType: string;
    originalSendAsText: boolean;
    originalSendAsEmail: boolean;
  }) => void
): void {
  stateService.setDraftEditMode(true);

  onStateUpdate({
    isEditingExistingDraft: true,
    currentDraftMessageId: id,
    currentSendToType: sendtotype || '',
    originalSendAsText: sendastext || false,
    originalSendAsEmail: sendasemail || false,
  });
}

// ============================================================================
// RECIPIENT MAPPING UTILITIES
// ============================================================================

/**
 * Maps UI selectedValue back to API sentto/sendtotype values
 * This is used when saving drafts
 *
 * @param selectedValue - The selectedValue from people selection dialog
 * @param includeNonGroupMembers - Whether to include non-group members (for group selections)
 * @returns Object with sentto and sendtotype values for API
 */
export function mapSelectedValueToApi(
  selectedValue: string,
  includeNonGroupMembers = false
): { sentto: string; sendtotype: string } {
  switch (selectedValue) {
    case 'peopleWhoSignedUp':
      return { sentto: SentTo.SIGNED_UP, sendtotype: SendToType.SIGNED_UP };

    case 'peopleOnWaitlist':
      return { sentto: SentTo.WAITLIST, sendtotype: SendToType.WAITLIST };

    case 'peopleSignedUpAndWaitlist':
      return {
        sentto: SentTo.SIGNED_UP_AND_WAITLIST,
        sendtotype: SendToType.SIGNUP_WAITLIST,
      };

    case 'peopleWhoNotSignedUp':
      return {
        sentto: SentTo.NOT_SIGNED_UP,
        sendtotype: SendToType.PEOPLE_IN_GROUPS,
      };

    case 'sendMessagePeopleRadio':
    case 'peopleingroups':
      return {
        sentto: includeNonGroupMembers
          ? SentTo.INCLUDE_NON_GROUP_MEMBERS
          : SentTo.ALL,
        sendtotype: SendToType.PEOPLE_IN_GROUPS,
      };

    case 'specificRsvpResponse':
      return { sentto: 'rsvp:', sendtotype: SendToType.SPECIFIC_RSVP_RESPONSE };

    case 'ManuallyEnterEmail':
      return { sentto: SentTo.MANUAL, sendtotype: SendToType.CUSTOM };

    case 'ImportEmailFromProvider':
      return { sentto: SentTo.IMPORT, sendtotype: SendToType.CUSTOM };

    default:
      return { sentto: SentTo.ALL, sendtotype: SendToType.SIGNED_UP };
  }
}

/**
 * Maps API response (sentto, sendtotype) to the selectedValue for people selection dialog
 *
 * @param sentto - The sentto value from API response
 * @param sendtotype - The sendtotype value from API response
 * @returns The selectedValue to use in people selection dialog, or null if no mapping found
 */
export function mapApiToSelectedValue(
  sentto: string,
  sendtotype: string
): string | null {
  const normalizedSentTo = sentto?.toLowerCase() || '';
  const normalizedSendToType = sendtotype?.toLowerCase() || '';

  if (
    normalizedSendToType === SendToType.SPECIFIC_RSVP ||
    normalizedSentTo.startsWith('rsvp:')
  ) {
    return 'specificRsvpResponse';
  }

  if (
    normalizedSentTo === SentTo.SIGNED_UP &&
    normalizedSendToType === SendToType.SIGNED_UP
  ) {
    return 'peopleWhoSignedUp';
  }

  if (
    normalizedSentTo === SentTo.WAITLIST &&
    normalizedSendToType === SendToType.WAITLIST
  ) {
    return 'peopleOnWaitlist';
  }

  if (
    normalizedSentTo === SentTo.SIGNED_UP_AND_WAITLIST &&
    normalizedSendToType === SendToType.SIGNUP_WAITLIST
  ) {
    return 'peopleSignedUpAndWaitlist';
  }

  if (
    normalizedSentTo === SentTo.NOT_SIGNED_UP &&
    normalizedSendToType === SendToType.PEOPLE_IN_GROUPS
  ) {
    return 'peopleWhoNotSignedUp';
  }

  if (normalizedSendToType === SendToType.PEOPLE_IN_GROUPS) {
    if (
      normalizedSentTo === SentTo.ALL ||
      normalizedSentTo === SentTo.INCLUDE_NON_GROUP_MEMBERS ||
      normalizedSentTo === SentTo.ALL_INCLUDE_NON_GROUP_MEMBERS
    ) {
      return 'sendMessagePeopleRadio';
    }

    if (normalizedSentTo === SentTo.ALL) {
      return 'sendMessagePeopleRadio';
    }
  }

  if (
    normalizedSendToType === SendToType.MANUAL ||
    normalizedSentTo === SentTo.MANUAL
  ) {
    return 'ManuallyEnterEmail';
  }

  // if (normalizedSendToType === 'importfromprovider') {
  //   return 'ImportEmailFromProvider';
  // }

  if (normalizedSendToType === SendToType.SPECIFIC_DATE_SLOT) {
    return 'sendMessagePeopleIselect';
  }

  if (normalizedSendToType === SendToType.CUSTOM) {
    return 'sendMessagePeopleIselect';
  }

  if (normalizedSendToType === SendToType.PEOPLE_IN_GROUPS) {
    return 'peopleingroups';
  }

  return null;
}

/**
 * Extracts additional selection data from API response
 * For example: RSVP responses, group IDs, custom user IDs, etc.
 *
 * @param sentto - The sentto value from API response
 * @param sendtotype - The sendtotype value from API response
 * @returns Object containing additional form data to restore
 */
export function extractPeopleSelectionData(
  sentto: string,
  sendtotype: string
): {
  rsvpResponses?: {
    yes: boolean;
    no: boolean;
    maybe: boolean;
    noresponse: boolean;
  };
  includeNonGroupMembers?: boolean;
  customUserIds?: string[];
} {
  const normalizedSentTo = sentto?.toLowerCase() || '';
  const normalizedSendToType = sendtotype?.toLowerCase() || '';

  const data: ReturnType<typeof extractPeopleSelectionData> = {};

  if (
    normalizedSendToType === SendToType.SPECIFIC_RSVP ||
    normalizedSentTo.startsWith('rsvp:')
  ) {
    const rsvpPart = normalizedSentTo.replace('rsvp:', '');
    const responses = rsvpPart.split(',').map((r) => r.trim());

    data.rsvpResponses = {
      yes: responses.includes('yes'),
      no: responses.includes('no'),
      maybe: responses.includes('maybe'),
      noresponse: responses.includes('nr') || responses.includes('noresponse'),
    };
  }

  if (
    normalizedSentTo === SentTo.INCLUDE_NON_GROUP_MEMBERS ||
    normalizedSentTo === SentTo.ALL_INCLUDE_NON_GROUP_MEMBERS
  ) {
    data.includeNonGroupMembers = true;
  }

  if (normalizedSendToType === SendToType.CUSTOM && sentto) {
    const userIds = sentto
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    if (userIds.length > 0) {
      data.customUserIds = userIds;
    }
  }

  return data;
}

/**
 * Strips HTML tags from a string
 * Used to convert HTML message body to plain text
 *
 * @param html - HTML string to strip
 * @returns Plain text string
 */
export function stripHtml(html: string): string {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
}

/**
 * Gets the display label for a selected recipient value
 * Used to show the user-friendly label in the "To" field
 *
 * @param selectedValue - The selected value from people selection dialog
 * @returns Display label string
 */
export function getLabelForSelectedValue(selectedValue: string): string {
  switch (selectedValue) {
    case 'peopleWhoSignedUp':
      return 'People who have signed up';

    case 'peopleOnWaitlist':
      return 'People who are on a waitlist';

    case 'peopleSignedUpAndWaitlist':
      return 'People who have signed up and people who are on a waitlist';

    case 'peopleWhoNotSignedUp':
      return 'Group members who have not signed up';

    case 'sendMessagePeopleRadio':
    case 'peopleingroups':
      return 'People in specific group(s)';

    case 'specificRsvpResponse':
      return 'Specific RSVP Responses';

    case 'sendMessagePeopleIselect':
      return 'Custom Selection';

    case 'ManuallyEnterEmail':
      return 'Manual entry';

    case 'ImportEmailFromProvider':
      return 'Import from provider';

    default:
      return 'Selected people';
  }
}

/**
 * Parses manual email string into array of emails
 * Handles comma-separated email lists
 *
 * @param emailString - Comma-separated email string
 * @returns Array of trimmed email addresses
 */
export function parseManualEmails(emailString: string): string[] {
  if (!emailString || !emailString.trim()) {
    return [];
  }

  return emailString
    .split(',')
    .map((email) => email.trim())
    .filter((email) => email.length > 0);
}

/**
 * Applies backend workarounds for known API inconsistencies
 * Fixes issues where backend doesn't send expected values
 *
 * @param sentto - Original sentto value
 * @param sendtotype - Original sendtotype value
 * @returns Corrected sentto and sendtotype values
 */
export function applyBackendWorkarounds(
  sentto: string,
  sendtotype: string
): { sentto: string; sendtotype: string } {
  let correctedSentto = sentto;
  const correctedSendtotype = sendtotype;

  if (
    sendtotype?.toLowerCase() === SendToType.MANUAL &&
    (!sentto || sentto.trim() === '')
  ) {
    correctedSentto = SentTo.MANUAL;
  }

  return {
    sentto: correctedSentto,
    sendtotype: correctedSendtotype,
  };
}

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

/**
 * Error message format from API
 */
interface ApiErrorMessage {
  details?: string;
  message?: string;
}

/**
 * Error response structure from API
 */
interface ApiErrorResponse {
  message?: string | ApiErrorMessage[];
  error?: {
    message?: string | ApiErrorMessage[];
  };
}

/**
 * Parses API error messages into user-friendly strings
 * Handles different error message formats from the API
 *
 * @param error - Error object from API response
 * @param defaultMessage - Default message if parsing fails
 * @returns Formatted error message string
 */
export function parseApiErrorMessage(
  error: ApiErrorResponse,
  defaultMessage = 'An error occurred'
): string {
  if (Array.isArray(error?.message)) {
    const parsed = error.message
      .map((msg: string | ApiErrorMessage) =>
        typeof msg === 'string' ? msg : msg.details || ''
      )
      .filter((msg: string) => msg.length > 0)
      .join(', ');

    return parsed || defaultMessage;
  }

  if (error?.error?.message && Array.isArray(error.error.message)) {
    const parsed = error.error.message
      .map((msg: string | ApiErrorMessage) =>
        typeof msg === 'string' ? msg : msg.details || ''
      )
      .filter((msg: string) => msg.length > 0)
      .join(', ');

    return parsed || defaultMessage;
  }

  if (typeof error?.error?.message === 'string') {
    return error.error.message;
  }

  if (typeof error?.message === 'string') {
    return error.message;
  }

  return defaultMessage;
}

/**
 * Builds people selection data object for state restoration
 * Creates the data structure needed by people selection dialog
 *
 * @param selectedValue - The selected value from mapping
 * @param additionalData - Additional data extracted from API response
 * @param manualEmails - Manual email string (optional)
 * @returns Complete people selection data object
 */
export function buildPeopleSelectionData(
  selectedValue: string,
  additionalData: ReturnType<typeof extractPeopleSelectionData>,
  manualEmails?: string
): {
  selectedValue: string;
  selectedGroups: string[];
  manualEmails: string;
  groupEmailAlias: string;
  useGroupAlias: boolean;
  includeNonGroupMembers: boolean;
  includeNonGroupMembersForPeople: boolean;
  manualEmailsGroup: string[];
  rsvpResponseyes: boolean;
  rsvpResponseno: boolean;
  rsvpResponsemaybe: boolean;
  rsvpResponsenoresponse: boolean;
} {
  return {
    selectedValue: selectedValue,
    selectedGroups: [],
    manualEmails: manualEmails || '',
    groupEmailAlias: '',
    useGroupAlias: false,
    includeNonGroupMembers: additionalData.includeNonGroupMembers || false,
    includeNonGroupMembersForPeople:
      additionalData.includeNonGroupMembers || false,
    manualEmailsGroup: [],
    rsvpResponseyes: additionalData.rsvpResponses?.yes || false,
    rsvpResponseno: additionalData.rsvpResponses?.no || false,
    rsvpResponsemaybe: additionalData.rsvpResponses?.maybe || false,
    rsvpResponsenoresponse: additionalData.rsvpResponses?.noresponse || false,
  };
}

/**
 * Determines if group restoration should be skipped for certain scenarios
 * Some scenarios should show labels instead of group names in the "To" field
 *
 * @param sendtotype - The sendtotype value from API
 * @param sentto - The sentto value from API
 * @returns True if group restoration should be skipped
 */
export function shouldSkipGroupRestoration(
  sendtotype: string,
  sentto: string
): boolean {
  const sendtotypeLower = sendtotype?.toLowerCase() || '';
  const senttoLower = sentto?.toLowerCase() || '';

  return (
    (sendtotypeLower === SendToType.SIGNED_UP &&
      senttoLower === SentTo.SIGNED_UP) ||
    (sendtotypeLower === SendToType.PEOPLE_IN_GROUPS &&
      senttoLower === SentTo.NOT_SIGNED_UP) ||
    sendtotypeLower === SendToType.MANUAL
  );
}

// ============================================================================
// WAITLIST DETECTION UTILITIES
// ============================================================================

/**
 * Checks if a message is waitlist-related based on sendToType and sentTo values
 * Used to determine if waitlist options should be shown or if draft contains waitlist data
 *
 * @param sendToType - The sendToType value from the message
 * @param sentTo - The sentTo value from the message
 * @returns true if the message is waitlist-related, false otherwise
 */
export function isWaitlistRelatedMessage(
  sendToType: string,
  sentTo: string
): boolean {
  const sendToTypeLower = sendToType?.toLowerCase() || '';
  const sentToLower = sentTo?.toLowerCase() || '';

  return (
    (sendToTypeLower === SendToType.WAITLIST &&
      sentToLower === SentTo.WAITLIST) ||
    (sendToTypeLower === SendToType.SIGNUP_WAITLIST &&
      sentToLower === SentTo.SIGNED_UP_AND_WAITLIST)
  );
}

/**
 * Options for checking waitlist slots
 */
interface CheckWaitlistSlotsOptions {
  signupId: number;
  composeService: ComposeService;
  destroy$: Observable<void>;
  onResult: (hasWaitlistSlots: boolean) => void;
}

/**
 * Checks if the selected signup has any waitlist-enabled slots
 * Used to conditionally show waitlist options in people selection dialog
 * Shared by both compose-email and compose-text-message components
 *
 * @param options - Configuration object with signup ID, services, and callback
 */
export function checkForWaitlistSlots(
  options: CheckWaitlistSlotsOptions
): void {
  const { signupId, composeService, destroy$, onResult } = options;

  const payload = {
    includeSignedUpMembers: true,
  };

  composeService
    .getDateSlots(signupId, payload)
    .pipe(takeUntil(destroy$))
    .subscribe({
      next: (response) => {
        if (response && response.success && response.data) {
          const hasWaitlistSlots = response.data.some(
            (item) => item.waitlist === true
          );
          onResult(hasWaitlistSlots);
        } else {
          onResult(false);
        }
      },
      error: (error) => {
        console.error(
          'Failed to fetch waitlist slots for signup:',
          signupId,
          error
        );
        onResult(false);
      },
    });
}

// ============================================================================
// ATTACHMENT RESTORATION UTILITIES
// ============================================================================

/**
 * Attachment from API response
 */
export interface ApiAttachment {
  fileid: number;
  fileurl: string;
}

/**
 * Options for restoring attachments from draft
 */
export interface RestoreAttachmentsOptions {
  attachments: ApiAttachment[];
  composeService: ComposeService;
  destroy$: Observable<void>;
  onSuccess: (attachments: IFileItem[]) => void;
  onError?: (error: unknown) => void;
}

/**
 * Restores attachments from draft message
 * Fetches file details for each attachment and transforms them to IFileItem format
 * This is a shared utility to avoid code duplication between components
 *
 * @param options - Configuration object with attachments, services, and callbacks
 */
export function restoreAttachments(options: RestoreAttachmentsOptions): void {
  const { attachments, composeService, destroy$, onSuccess, onError } = options;

  if (!attachments || attachments.length === 0) {
    onSuccess([]);
    return;
  }

  // Fetch file details for all attachments in parallel
  const fileDetailRequests = attachments.map((attachment) =>
    composeService.getFileDetails(attachment.fileid).pipe(
      catchError((error) => {
        if (!environment.production) {
          console.error(
            `Failed to fetch file details for file ID ${attachment.fileid}:`,
            error
          );
        }
        return of(null);
      })
    )
  );

  forkJoin(fileDetailRequests)
    .pipe(takeUntil(destroy$))
    .subscribe({
      next: (fileDetailsResponses) => {
        const fileDetailsMap = new Map<number, IFileDetailsData>();

        // Build map of file ID to file details
        fileDetailsResponses.forEach((response, index) => {
          if (response && response.success && response.data) {
            fileDetailsMap.set(attachments[index].fileid, response.data);
          }
        });

        // Transform attachments to IFileItem format
        const transformedAttachments = transformAttachmentsToFileItems(
          attachments,
          fileDetailsMap
        );

        onSuccess(transformedAttachments);
      },
      error: (error) => {
        if (!environment.production) {
          console.error('Failed to restore attachments:', error);
        }
        if (onError) {
          onError(error);
        } else {
          onSuccess([]);
        }
      },
    });
}

/**
 * Transforms API attachments to IFileItem format
 * Converts the attachment format from getMessageById to the format used by the attachment UI
 *
 * @param apiAttachments - Array of attachments from getMessageById API
 * @param fileDetailsMap - Map of file ID to file details data
 * @returns Array of IFileItem objects for use in the attachment UI
 */
export function transformAttachmentsToFileItems(
  apiAttachments: ApiAttachment[],
  fileDetailsMap: Map<number, IFileDetailsData>
): IFileItem[] {
  const items: IFileItem[] = [];

  for (const attachment of apiAttachments) {
    const fileDetails = fileDetailsMap.get(attachment.fileid);

    if (!fileDetails) {
      if (!environment.production) {
        console.warn(
          `File details not found for file ID: ${attachment.fileid}`
        );
      }
      continue;
    }

    // Try multiple property names for the file URL (API might use different names)
    const fileUrl =
      fileDetails.s3Presignedurl ||
      fileDetails.fileurl ||
      fileDetails.s3presignedurl;

    if (!fileUrl) {
      if (!environment.production) {
        console.error(`No file URL found for file ${attachment.fileid}`);
      }
      continue;
    }

    if (!environment.production) {
      console.log(`File ${attachment.fileid} details:`, {
        filename: fileDetails.filename,
        hasUrl: !!fileUrl,
        urlSource: fileDetails.s3Presignedurl
          ? 's3Presignedurl'
          : fileDetails.fileurl
          ? 'fileurl'
          : fileDetails.s3presignedurl
          ? 's3presignedurl'
          : 'none',
      });
    }

    items.push({
      id: attachment.fileid,
      filename: fileDetails.filename,
      filesizekb: fileDetails.filesizekb || 0,
      isfolder: false,
      filedescription: fileDetails.filedescription,
      fileurl: fileUrl,
    });
  }

  return items;
}

// ============================================================================
// FILE DOWNLOAD UTILITIES
// ============================================================================

/**
 * Constants for file download operations
 */
const BLOB_URL_CLEANUP_DELAY_MS = 100;
const DEFAULT_FILENAME = 'download';

/**
 * MIME type mapping for file extensions
 * Used to set correct MIME type for downloaded files
 */
const MIME_TYPE_MAP: Record<string, string> = {
  // Images
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  webp: 'image/webp',

  // Documents
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  csv: 'text/csv',
  rtf: 'application/rtf',

  // Archives
  zip: 'application/zip',
  rar: 'application/x-rar-compressed',
  '7z': 'application/x-7z-compressed',
  tar: 'application/x-tar',
  gz: 'application/gzip',

  // Media
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  avi: 'video/x-msvideo',
  mov: 'video/quicktime',
  wav: 'audio/wav',

  // Web
  html: 'text/html',
  css: 'text/css',
  js: 'application/javascript',
  json: 'application/json',
  xml: 'application/xml',
};

/**
 * Options for downloading a file
 */
export interface DownloadFileOptions {
  file: IFileItem;
  composeService: ComposeService;
  toastr: ToastrService;
  destroy$: Observable<void>;
  httpClient: HttpClient;
}

/**
 * Downloads a file using file URL if available, otherwise fetches file details first
 * - For draft messages: Uses cached file URL (no API call needed)
 * - For new messages: Fetches file details to get the URL (API call required)
 * Uses Angular HttpClient for HTTP requests (proper Angular way)
 * Shared utility for compose-email and compose-email-template components
 *
 * @param options - Configuration object with file, services, and observables
 */
export function downloadFile(options: DownloadFileOptions): void {
  const { file, composeService, toastr, destroy$, httpClient } = options;

  // If file URL is already available (from draft restore), use it directly
  if (file.fileurl) {
    if (!environment.production) {
      console.log('Using cached file URL for download (no API call)');
    }
    downloadFileFromUrl({
      fileUrl: file.fileurl,
      filename: file.filename || DEFAULT_FILENAME,
      toastr,
      httpClient,
      destroy$,
    });
    return;
  }

  // Otherwise, fetch file details to get the URL (for new messages with file picker attachments)
  if (!environment.production) {
    console.log('File URL not cached, fetching file details from API');
  }

  if (!file.id) {
    toastr.error('File ID is missing', 'Error');
    return;
  }

  composeService
    .getFileDetails(file.id)
    .pipe(
      takeUntil(destroy$),
      switchMap((detailsResponse) => {
        if (
          !detailsResponse ||
          !detailsResponse.success ||
          !detailsResponse.data
        ) {
          throw new Error('Failed to fetch file details');
        }

        const fileDetails = detailsResponse.data;
        const filename =
          fileDetails.filename || file.filename || DEFAULT_FILENAME;
        const fileUrl =
          fileDetails.fileurl ||
          fileDetails.s3Presignedurl ||
          fileDetails.s3presignedurl;

        if (!fileUrl) {
          throw new Error('File URL not available');
        }

        if (!environment.production) {
          console.log('Fetched file details for download:', filename);
        }

        downloadFileFromUrl({
          fileUrl,
          filename,
          toastr,
          httpClient,
          destroy$,
        });
        return of(null);
      }),
      catchError((error) => {
        if (!environment.production) {
          console.error('Error fetching file details for download:', error);
        }
        toastr.error('Failed to download file', 'Error');
        return of(null);
      })
    )
    .pipe(takeUntil(destroy$))
    .subscribe();
}

/**
 * Options for downloading file from URL
 */
interface DownloadFileFromUrlOptions {
  fileUrl: string;
  filename: string;
  toastr: ToastrService;
  httpClient: HttpClient;
  destroy$: Observable<void>;
}

/**
 * Helper function to download file from a URL using Angular HttpClient
 * Handles the actual HTTP request and browser download logic
 * Uses HttpClient instead of fetch API for proper Angular integration
 *
 * @param options - Configuration object with URL, filename, and services
 */
function downloadFileFromUrl(options: DownloadFileFromUrlOptions): void {
  const { fileUrl, filename, toastr, httpClient, destroy$ } = options;

  if (!environment.production) {
    console.log('Downloading file:', filename);
  }

  httpClient
    .get(fileUrl, { responseType: 'blob', observe: 'response' })
    .pipe(
      takeUntil(destroy$),
      tap((response) => {
        const blob = response.body;

        if (!blob) {
          throw new Error('No blob received from server');
        }

        if (!environment.production) {
          console.log('Blob received from URL:', {
            type: blob.type,
            size: blob.size,
            filename: filename,
          });
        }

        // Determine MIME type from filename if blob type is generic or missing
        let mimeType = blob.type;
        if (
          !mimeType ||
          mimeType === 'application/octet-stream' ||
          mimeType === 'binary/octet-stream'
        ) {
          mimeType = getMimeTypeFromFilename(filename);
          if (!environment.production) {
            console.log('Using derived MIME type:', mimeType);
          }
        }

        // Create a new blob with correct MIME type
        const typedBlob = new Blob([blob], { type: mimeType });

        // Create blob URL and trigger download
        const blobUrl = window.URL.createObjectURL(typedBlob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up blob URL after a short delay
        setTimeout(() => {
          window.URL.revokeObjectURL(blobUrl);
        }, BLOB_URL_CLEANUP_DELAY_MS);

        toastr.success(
          `File "${filename}" downloaded successfully`,
          'Download Complete'
        );
      }),
      catchError((error) => {
        if (!environment.production) {
          console.error('Error downloading file:', error);
        }
        toastr.error('Failed to download file', 'Error');
        return of(null);
      })
    )
    .subscribe();
}

/**
 * Helper function to get MIME type from filename extension
 * @param filename - The filename to extract MIME type from
 * @returns MIME type string
 */
function getMimeTypeFromFilename(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  return MIME_TYPE_MAP[extension] || 'application/octet-stream';
}
