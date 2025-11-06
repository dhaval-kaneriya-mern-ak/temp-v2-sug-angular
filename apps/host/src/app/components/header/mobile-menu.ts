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
import { HeaderService } from './header.service';
import { MemberProfile, UserRole } from '@services/interfaces';
import { environment } from '@environments/environment';
import { Subject } from 'rxjs';

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

  private headerService = inject(HeaderService);

  private destroy$ = new Subject<void>();

  isLoading = signal(false);
  userProfile = signal<MemberProfile | null>(null);
  userRoles = signal<UserRole[]>([]);
  environment = environment;

  ngOnInit() {
    // Initialize user data - replace with actual service calls
    this.loadUserProfile();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUserProfile() {
    this.isLoading.set(true);
    this.headerService.getUserProfile().subscribe({
      next: (response) => {
        this.userProfile.set(response.data);
        this.isLoading.set(false);
        if (response.success) {
          // this.loadUserRole();
        }
        console.log('user', this.userProfile);
      },
      error: () => {
        this.handleLogout();
        this.isLoading.set(false);
      },
    });
  }

  handleLogout() {
    // Implement logout logic
    console.log('Logging out...');
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
