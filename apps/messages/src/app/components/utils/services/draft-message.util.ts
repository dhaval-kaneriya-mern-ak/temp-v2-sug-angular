import { Observable, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { ISaveDraftMessagePayload } from '@services/interfaces';
import { ComposeService } from '../../compose/compose.service';
import { ComposeEmailStateService } from './compose-email-state.service';

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
      return { sentto: 'signedup', sendtotype: 'signedup' };

    case 'peopleOnWaitlist':
      return { sentto: 'waitlisted', sendtotype: 'waitlisted' };

    case 'peopleSignedUpAndWaitlist':
      return {
        sentto: 'signedupandwaitlisted',
        sendtotype: 'signedupandwaitlisted',
      };

    case 'peopleWhoNotSignedUp':
      return { sentto: 'notsignedup', sendtotype: 'peopleingroups' };

    case 'sendMessagePeopleRadio':
    case 'peopleingroups':
      return {
        sentto: includeNonGroupMembers ? 'includenongroupmembers' : 'all',
        sendtotype: 'peopleingroups',
      };

    case 'specificRsvpResponse':
      return { sentto: 'rsvp:', sendtotype: 'specificrsvpresponse' };

    case 'ManuallyEnterEmail':
      return { sentto: 'manual', sendtotype: 'custom' };

    case 'ImportEmailFromProvider':
      return { sentto: 'import', sendtotype: 'custom' };

    default:
      return { sentto: 'all', sendtotype: 'signedup' };
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
    normalizedSendToType === 'specificrsvp' ||
    normalizedSentTo.startsWith('rsvp:')
  ) {
    return 'specificRsvpResponse';
  }

  if (normalizedSentTo === 'signedup' && normalizedSendToType === 'signedup') {
    return 'peopleWhoSignedUp';
  }

  if (
    normalizedSentTo === 'waitlisted' &&
    normalizedSendToType === 'waitlisted'
  ) {
    return 'peopleOnWaitlist';
  }

  if (
    normalizedSentTo === 'signedupandwaitlisted' &&
    normalizedSendToType === 'signedupandwaitlisted'
  ) {
    return 'peopleSignedUpAndWaitlist';
  }

  if (
    normalizedSentTo === 'notsignedup' &&
    normalizedSendToType === 'peopleingroups'
  ) {
    return 'peopleWhoNotSignedUp';
  }

  if (
    normalizedSendToType === 'peopleingroups' ||
    normalizedSendToType === 'peoplesingroups'
  ) {
    if (
      normalizedSentTo === 'all' ||
      normalizedSentTo === 'includenongroupmembers' ||
      normalizedSentTo === 'allincludenongroupmembers'
    ) {
      return 'sendMessagePeopleRadio';
    }

    if (normalizedSentTo === 'all') {
      return 'sendMessagePeopleRadio';
    }
  }

  if (normalizedSendToType === 'manual' || normalizedSentTo === 'manual') {
    return 'ManuallyEnterEmail';
  }

  if (normalizedSendToType === 'importfromprovider') {
    return 'ImportEmailFromProvider';
  }

  if (normalizedSendToType === 'specificdateslot') {
    return 'sendMessagePeopleIselect';
  }

  if (
    normalizedSendToType === 'custom' ||
    normalizedSendToType === 'customselection'
  ) {
    return 'sendMessagePeopleIselect';
  }

  if (normalizedSendToType === 'peopleingroups') {
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
    normalizedSendToType === 'specificrsvp' ||
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
    normalizedSentTo === 'includenongroupmembers' ||
    normalizedSentTo === 'allincludenongroupmembers'
  ) {
    data.includeNonGroupMembers = true;
  }

  if (normalizedSendToType === 'custom' && sentto) {
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
    sendtotype?.toLowerCase() === 'manual' &&
    (!sentto || sentto.trim() === '')
  ) {
    correctedSentto = 'manual';
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
    (sendtotypeLower === 'signedup' && senttoLower === 'signedup') ||
    (sendtotypeLower === 'peopleingroups' && senttoLower === 'notsignedup') ||
    sendtotypeLower === 'manual'
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
    (sendToTypeLower === 'waitlisted' && sentToLower === 'waitlisted') ||
    (sendToTypeLower === 'signedupandwaitlisted' &&
      sentToLower === 'signedupandwaitlisted')
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
