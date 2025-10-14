import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { MobileMenuComponent } from './mobile-menu';
import { HeaderService } from './header.service';
import { environment } from '@environments/environment';
import { MemberProfile, UserRole } from '@services/interfaces';

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

  // Inject services
  private headerService = inject(HeaderService);

  // State signals
  isVisible = signal(false);
  moreMenu = signal(false);
  moreLoginMenu = signal(false);
  mobileMenu = signal(false);
  isLoading = signal(false);
  auctionUrl = 'https://auction.signupgenius.com';
  donationUrl = 'https://giving.signupgenius.com';
  ticketUrl = 'https://tickets.signupgenius.com';
  // // User data - these would typically come from a service
  userProfile = signal<MemberProfile | null>(null);
  userRoles = signal<UserRole[]>([]);
  environment = environment;
  private destroy$ = new Subject<void>();

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

  private loadUserRole() {
    this.headerService.getUserRole().subscribe({
      next: (response) => {
        this.userRoles.set(response.data ? response.data : []);
        this.isLoading.set(false);
      },
      error: () => {
        this.handleLogout();
        this.isLoading.set(false);
      },
    });
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
      },
      error: () => {
        this.handleLogout();
        this.isLoading.set(false);
      },
    });
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
