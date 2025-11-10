import {
  Component,
  Output,
  EventEmitter,
  inject,
  signal,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MemberProfile, UserRole } from '@services/interfaces';
import { environment } from '@environments/environment';
import { Subject, takeUntil } from 'rxjs';
import { UserStateService } from '@services/user-state.service';

@Component({
  selector: 'sug-mobile-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styleUrls: ['./mobile-menu.scss'],
  templateUrl: './mobile-menu.html',
})
export class MobileMenuComponent implements OnInit, OnDestroy {
  @Output() closeMenuRequested = new EventEmitter<void>();
  @Output() linkClick = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  private userStateService = inject(UserStateService);

  private destroy$ = new Subject<void>();

  isLoading = signal(false);
  userProfile = signal<MemberProfile | null>(null);
  userRoles = signal<UserRole[]>([]);
  environment = environment;

  ngOnInit() {
    this.subscribeToUserState();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToUserState() {
    // Only subscribe to reactive updates - NO API call triggered
    this.userStateService.userProfile$
      .pipe(takeUntil(this.destroy$))
      .subscribe((profile) => {
        this.userProfile.set(profile);
        // Update loading state based on whether we have data
        this.isLoading.set(!profile);
      });
  }

  handleLogout() {
    // Implement logout logic
    console.log('Logging out...');
    this.userStateService.clearUserProfile();
    this.userProfile.set(null);
    this.userRoles.set([]);
    // Redirect or call logout service
  }

  closeMenu() {
    // Emit event to parent component instead of direct DOM manipulation
    this.closeMenuRequested.emit();
  }

  onLinkClick() {
    // Emit event when a link is clicked
    this.linkClick.emit();
  }

  onLogout() {
    // Emit event for logout
    this.logout.emit();
  }

  // Utility methods
  getProfileDisplay(): string {
    const profile = this.userProfile();
    return profile?.profilepicture?.text || '';
  }

  getProfileImage(): string {
    const profile = this.userProfile();
    return profile?.profilepicture?.small || '';
  }
}
