import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class VerificationModalService {
  private _showModal = signal<boolean>(false);
  private _pendingRoute = signal<string | null>(null); // Add this

  readonly showModal = this._showModal.asReadonly();
  readonly pendingRoute = this._pendingRoute.asReadonly();

  open(returnUrl?: string): void {
    if (returnUrl) this._pendingRoute.set(returnUrl);
    this._showModal.set(true);
  }

  close(): void {
    this._showModal.set(false);
    this._pendingRoute.set(null);
  }
}
