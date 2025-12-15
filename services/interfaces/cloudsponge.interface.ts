/**
 * TypeScript declarations for CloudSponge Widget API
 */

export interface CloudSpongeContact {
  first_name?: string;
  last_name?: string;
  email?: string[];
  phone?: Array<{ number: string }>;
  photos?: Array<{ value: string }>;
  selectedEmail: () => string;
  primaryEmail: () => string;
  fullName: () => string;
}

export interface CloudSpongeOwner {
  email?: string;
  name?: string;
}

export interface CloudSpongeOptions {
  sources?: string[];
  css?: {
    primaryColor?: string;
  };
  selectionLimit?: number;
  filter?: (contact: CloudSpongeContact) => boolean;
  afterInit?: () => void;
  beforeDisplayContacts?: (
    contacts: CloudSpongeContact[],
    source: string,
    owner: CloudSpongeOwner
  ) => void;
  afterSubmitContacts?: (
    contacts: CloudSpongeContact[],
    source: string,
    owner: CloudSpongeOwner
  ) => void;
  beforeClosing?: () => void;
}

export interface CloudSponge {
  init: (options: CloudSpongeOptions) => void;
  launch: (source?: string) => void;
}

declare global {
  interface Window {
    cloudsponge?: CloudSponge;
  }
  const cloudsponge: CloudSponge | undefined;
}
