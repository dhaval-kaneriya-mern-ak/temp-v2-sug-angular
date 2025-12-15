import { Injectable, signal, computed } from '@angular/core';
import type {
  CloudSpongeContact,
  CloudSpongeOwner,
} from './interfaces/cloudsponge.interface';

@Injectable({
  providedIn: 'root',
})
export class CloudSpongeService {
  // Signals for reactive state management
  private selectedContactsSignal = signal<CloudSpongeContact[]>([]);
  private allContactsSignal = signal<CloudSpongeContact[]>([]);
  private isLoadingSignal = signal<boolean>(false);
  private importSourceSignal = signal<string>('');
  private ownerSignal = signal<CloudSpongeOwner | null>(null);

  // Public readonly signals
  readonly selectedContacts = this.selectedContactsSignal.asReadonly();
  readonly allContacts = this.allContactsSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly importSource = this.importSourceSignal.asReadonly();
  readonly owner = this.ownerSignal.asReadonly();

  // Computed values
  readonly selectedContactCount = computed(
    () => this.selectedContactsSignal().length
  );
  readonly allContactCount = computed(() => this.allContactsSignal().length);
  readonly hasSelectedContacts = computed(
    () => this.selectedContactCount() > 0
  );
  readonly hasAllContacts = computed(() => this.allContactCount() > 0);

  // Get emails as comma-separated string
  readonly contactEmailsString = computed(() =>
    this.selectedContactsSignal()
      .map((c) => c.selectedEmail())
      .filter((email) => email)
      .join(', ')
  );

  // Get emails as array
  readonly contactEmailsArray = computed(() =>
    this.selectedContactsSignal()
      .map((c) => c.selectedEmail())
      .filter((email) => email)
  );

  private isInitialized = false;

  /**
   * Initialize CloudSponge widget
   * @param sources - Array of contact sources to enable (e.g., ['gmail', 'yahoo', 'windowslive'])
   */
  initCloudSponge(
    sources: string[] = [
      'gmail',
      'yahoo',
      'windowslive',
      'office365',
      'icloud',
      'aol',
    ]
  ): void {
    if (this.isInitialized) {
      console.log('CloudSponge already initialized');
      return;
    }

    if (
      typeof window === 'undefined' ||
      typeof window.cloudsponge === 'undefined'
    ) {
      console.error('CloudSponge library not loaded');
      return;
    }

    window.cloudsponge.init({
      sources,
      css: { primaryColor: '#0d6efd' },
      selectionLimit: 50,

      // Filter contacts to only include those with emails
      filter: (contact: CloudSpongeContact) =>
        contact.email !== undefined && contact.email.length > 0,

      afterInit: () => {
        console.log('CloudSponge initialized successfully');
        this.isInitialized = true;
      },

      beforeDisplayContacts: (
        contacts: CloudSpongeContact[],
        source: string,
        owner: CloudSpongeOwner
      ) => {
        console.log('beforeDisplayContacts:', contacts.length);
        this.allContactsSignal.set(contacts);
        this.importSourceSignal.set(source);
        this.ownerSignal.set(owner);
        this.isLoadingSignal.set(false);
      },

      afterSubmitContacts: (
        contacts: CloudSpongeContact[],
        source: string,
        owner: CloudSpongeOwner
      ) => {
        console.log('afterSubmitContacts:', contacts.length);
        this.selectedContactsSignal.set(contacts);
        this.importSourceSignal.set(source);
        this.ownerSignal.set(owner);
      },

      beforeClosing: () => {
        this.isLoadingSignal.set(false);
      },
    });
  }

  /**
   * Launch CloudSponge widget for a specific source
   * @param source - Optional source to launch directly (e.g., 'gmail')
   */
  launch(source?: string): void {
    if (!this.isInitialized) {
      console.error(
        'CloudSponge not initialized. Call initCloudSponge() first.'
      );
      return;
    }

    if (typeof window.cloudsponge === 'undefined') {
      console.error('CloudSponge library not available');
      return;
    }

    this.isLoadingSignal.set(true);

    if (source) {
      window.cloudsponge.launch(source);
    } else {
      window.cloudsponge.launch();
    }
  }

  /**
   * Get initials from a contact for avatar placeholder
   */
  getInitials(contact: CloudSpongeContact): string {
    const first = contact.first_name?.[0] || '';
    const last = contact.last_name?.[0] || '';
    return (first + last).toUpperCase() || '?';
  }

  /**
   * Remove a specific contact from selected contacts
   */
  removeContact(contact: CloudSpongeContact): void {
    const currentContacts = this.selectedContactsSignal();
    const filtered = currentContacts.filter(
      (c) => c.selectedEmail() !== contact.selectedEmail()
    );
    this.selectedContactsSignal.set(filtered);
  }

  /**
   * Clear all selected contacts
   */
  clearSelectedContacts(): void {
    this.selectedContactsSignal.set([]);
  }

  /**
   * Clear all contacts (both selected and all)
   */
  clearAllContacts(): void {
    this.selectedContactsSignal.set([]);
    this.allContactsSignal.set([]);
    this.importSourceSignal.set('');
    this.ownerSignal.set(null);
  }

  /**
   * Reset the service to initial state
   */
  reset(): void {
    this.clearAllContacts();
    this.isLoadingSignal.set(false);
  }
}
