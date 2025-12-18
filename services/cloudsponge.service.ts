import { Injectable, signal, computed } from '@angular/core';
import type {
  CloudSpongeContact,
  CloudSpongeOwner,
} from './interfaces/cloudsponge.interface';
import { environment } from '@environments/environment';

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
  private isScriptLoaded = false;
  private isScriptLoading = false;

  cloudspongeApiKey = environment.CLOUDSPONGE_KEY || '';

  /**
   * Dynamically load CloudSponge script
   */
  private loadCloudSpongeScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // If script is already loaded, resolve immediately
      if (this.isScriptLoaded && typeof window.cloudsponge !== 'undefined') {
        resolve();
        return;
      }

      // If script is currently loading, wait for it
      if (this.isScriptLoading) {
        const checkLoaded = () => {
          if (this.isScriptLoaded) {
            resolve();
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
        return;
      }

      this.isScriptLoading = true;

      const script = document.createElement('script');

      script.src = `https://api.cloudsponge.com/widget/${this.cloudspongeApiKey}.js`;

      script.async = true;
      script.defer = true;

      script.onload = () => {
        console.log('CloudSponge script loaded successfully');
        this.isScriptLoaded = true;
        this.isScriptLoading = false;
        resolve();
      };

      script.onerror = () => {
        console.error('Failed to load CloudSponge script');
        this.isScriptLoading = false;
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Initialize CloudSponge widget
   * @param sources - Array of contact sources to enable (e.g., ['gmail', 'yahoo', 'windowslive'])
   */
  async initCloudSponge(
    sources: string[] = [
      'gmail',
      'yahoo',
      'windowslive',
      'office365',
      'icloud',
      'aol',
    ]
  ): Promise<void> {
    console.log('initCloudSponge called, current isInitialized:', this.isInitialized);
    
    if (this.isInitialized) {
      console.log('CloudSponge already initialized');
      return;
    }

    try {
      console.log('Loading CloudSponge script...');
      // Load the script first
      await this.loadCloudSpongeScript();

      console.log('Script loaded, checking availability...');
      if (
        typeof window === 'undefined' ||
        typeof window.cloudsponge === 'undefined'
      ) {
        throw new Error('CloudSponge library not available after loading script');
      }
    } catch (error) {
      console.error('Failed to load CloudSponge:', error);
      return;
    }

    
    // Create a promise that resolves when CloudSponge is fully initialized
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('CloudSponge initialization timeout'));
      }, 10000); // 10 second timeout

      if (!window.cloudsponge) {
        reject(new Error('CloudSponge not available on window object.'));
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
          this.isInitialized = true;
          clearTimeout(timeout);
          resolve();
        },

        beforeDisplayContacts: (
          contacts: CloudSpongeContact[],
          source: string,
          owner: CloudSpongeOwner
        ) => {
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
          this.selectedContactsSignal.set(contacts);
          this.importSourceSignal.set(source);
          this.ownerSignal.set(owner);
        },

        beforeClosing: () => {
          this.isLoadingSignal.set(false);
        },
      });
    });
  }

  /**
   * Launch CloudSponge widget for a specific source
   * @param source - Optional source to launch directly (e.g., 'gmail')
   */
  async launch(source?: string): Promise<void> {
    try {
      console.log('CloudSponge launch called with source:', source);

      // Always try to initialize if not already done
      await this.initCloudSponge();

      console.log('After initCloudSponge, isInitialized:', this.isInitialized);

      if (typeof window.cloudsponge === 'undefined') {
        console.error('CloudSponge library not available');
        return;
      }

      if (!this.isInitialized) {
        console.error('CloudSponge still not initialized after init call');
        return;
      }

      this.isLoadingSignal.set(true);

      if (source) {
        window.cloudsponge.launch(source);
      } else {
        window.cloudsponge.launch();
      }
    } catch (error) {
      console.error('Failed to launch CloudSponge:', error);
      this.isLoadingSignal.set(false);
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
