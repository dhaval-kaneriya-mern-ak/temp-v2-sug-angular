import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { MobileMenuComponent } from './mobile-menu';

// Define interfaces for the component
interface UserProfile {
  profilepicture: {
    text?: string;
    small?: string;
  };
  ispro: boolean;
  isadmin?: boolean;
}

interface UserRole {
  // Define based on your user role structure
  id: string;
  name: string;
  permissions: string[];
}

@Component({
  selector: 'sug-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MobileMenuComponent],
  templateUrl: './header.html',
  styleUrls: ['./header.scss', './mobile-menu.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  @ViewChild('moreMenuRef') moreMenuRef!: ElementRef<HTMLLIElement>;
  @ViewChild('moreLoginMenuRef') moreLoginMenuRef!: ElementRef<HTMLDivElement>;
  @ViewChild('extendedWrapRef') extendedWrapRef!: ElementRef<HTMLDivElement>;

  // State signals
  isVisible = signal(false);
  moreMenu = signal(false);
  moreLoginMenu = signal(false);
  mobileMenu = signal(false);
  isLoading = signal(false);

  // User data - these would typically come from a service
  userProfile = signal<UserProfile | null>(null);
  userRoles = signal<UserRole[]>([]);

  private destroy$ = new Subject<void>();

  // Environment variables - replace with your actual URLs
  auctionUrl = 'https://auction.signupgenius.com';
  donationUrl = 'https://giving.signupgenius.com';
  ticketUrl = 'https://tickets.signupgenius.com';

  ngOnInit() {
    this.setupEventListeners();
    // Initialize user data - replace with actual service calls
    this.loadUserProfile();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupEventListeners() {
    // Handle clicks outside menus
    document.addEventListener('mousedown', this.handleClickOutside.bind(this));
    window.addEventListener('beforeunload', this.handlePageReload.bind(this));
  }

  private loadUserProfile() {
    // Replace with actual user service
    // this.userService.getUserProfile().subscribe(profile => {
    //   this.userProfile.set(profile);
    //   this.isLoading.set(false);
    // });

    // Mock data for demonstration
    this.isLoading.set(false);
    // Uncomment and modify based on your user service
    // this.userProfile.set({
    //   profilepicture: { text: 'JD', small: '' },
    //   ispro: true,
    //   isadmin: false
    // });
  }

  private handleClickOutside(event: MouseEvent) {
    const target = event.target as Node;

    if (
      this.moreMenuRef?.nativeElement &&
      !this.moreMenuRef.nativeElement.contains(target)
    ) {
      this.moreMenu.set(false);
    }

    if (
      this.moreLoginMenuRef?.nativeElement &&
      !this.moreLoginMenuRef.nativeElement.contains(target)
    ) {
      this.moreLoginMenu.set(false);
    }

    if (
      this.extendedWrapRef?.nativeElement &&
      !this.extendedWrapRef.nativeElement.contains(target)
    ) {
      this.isVisible.set(false);
    }
  }

  private handlePageReload() {
    this.moreMenu.set(false);
    this.mobileMenu.set(false);
    this.moreLoginMenu.set(false);
  }

  // Menu toggle methods
  showMoreMenu() {
    this.moreMenu.update((prev) => !prev);
  }

  showLoginMoreMenu() {
    this.moreLoginMenu.update((prev) => !prev);
  }

  openMobileMenu() {
    this.mobileMenu.update((prev) => !prev);
  }

  clickOnLinkHandle() {
    this.mobileMenu.set(false);
  }

  handleCloseMoreMenu() {
    this.moreMenu.set(false);
  }

  handleCloseLoginMoreMenu() {
    this.moreLoginMenu.set(false);
  }

  toggleVisibility() {
    this.isVisible.update((prev) => !prev);
  }

  // Keyboard event handlers for accessibility
  onKeyDown(event: KeyboardEvent, action: () => void) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  }

  handleLogout() {
    // Implement logout logic
    console.log('Logging out...');
    this.userProfile.set(null);
    this.userRoles.set([]);
    // Redirect or call logout service
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

  hasUserRoles(): boolean {
    return this.userRoles().length > 0;
  }

  isUserPro(): boolean {
    return this.userProfile()?.ispro || false;
  }

  isUserAdmin(): boolean {
    return this.userProfile()?.isadmin || false;
  }
}
