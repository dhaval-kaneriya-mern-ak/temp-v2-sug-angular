import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { environment } from '@environments/environment';

interface FooterColumn {
  title: string;
  links?: { label: string; href: string; target?: string }[];
  buttons?: { label: string; variant: string; href: string }[];
  search?: { placeholder: string; buttonLabel: string };
  socialIcons?: { icon: string; href: string; target?: string }[];
}

@Component({
  selector: 'sug-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './footer.html',
  styleUrls: ['./footer.scss'],
})
export class FooterComponent implements OnInit {
  isCollapsed = false;
  searchQuery = '';
  currentYear = new Date().getFullYear();
  environment = environment;
  footerData: FooterColumn[] = [
    {
      title: 'Use It For',
      links: [
        {
          label: 'School Sign Ups',
          href: environment.SITE_URL + '/how-to-use/schools',
        },
        {
          label: 'Business Schedules',
          href: environment.SITE_URL + '/how-to-use/businesses',
        },
        {
          label: 'Volunteer Sign Ups',
          href:
            environment.SITE_URL + '/how-to-use/nonprofit-volunteer-management',
        },
        {
          label: 'Potluck Invites',
          href: environment.SITE_URL + '/how-to-use/potluck',
        },
        {
          label: 'Fundraising',
          href: environment.SITE_URL + '/how-to-use/collect-money',
        },
        {
          label: 'Sports Events',
          href: environment.SITE_URL + '/how-to-use/sportsteams',
        },
        {
          label: 'Church & Temple',
          href: environment.SITE_URL + '/how-to-use/churches',
        },
        {
          label: 'College Activities',
          href: environment.SITE_URL + '/how-to-use/colleges',
        },
        {
          label: 'Scouting Events',
          href: environment.SITE_URL + '/how-to-use/scouts',
        },
        {
          label: 'School Spirit Wear',
          href:
            environment.SITE_URL +
            '/how-to-use/school-spirit-wear-sales-software',
        },
        {
          label: 'Online Auctions',
          href: environment.AUCTION_SITE_URL,
          target: '_blank',
        },
        {
          label: 'Donations Campaigns',
          href: environment.DONATIONS_SITE_URL,
          target: '_blank',
        },
        {
          label: 'Ticket Management',
          href: environment.TICKETS_SITE_URL,
          target: '_blank',
        },
      ],
    },
    {
      title: 'Helpful For',
      links: [
        {
          label: 'Event Registrations',
          href:
            environment.SITE_URL + '/how-to-use/event-registration-software',
        },
        {
          label: 'Lessons & Camp Sign Ups',
          href:
            environment.SITE_URL +
            '/how-to-use/lessons-tutoring-registration-software',
        },
        {
          label: 'Parent Teacher Conferences',
          href: environment.SITE_URL + '/how-to-use/parent-teacher-conferences',
        },
        {
          label: 'Meal Sign Ups',
          href:
            environment.SITE_URL + '/how-to-use/online-meal-volunteer-sheets',
        },
        {
          label: 'School Fundraising',
          href: environment.SITE_URL + '/how-to-use/school-payments',
        },
        {
          label: 'Festivals & Carnivals',
          href:
            environment.SITE_URL + '/how-to-use/event-registration-software',
        },
        {
          label: 'Book Fair Volunteers',
          href: environment.SITE_URL + '/how-to-use/bookfair',
        },
        {
          label: 'Dance Class Registrations',
          href:
            environment.SITE_URL +
            '/how-to-use/dance-studio-registration-software',
        },
        {
          label: 'Direct Sales Businesses',
          href: environment.SITE_URL + '/how-to-use/collect-money',
        },
        {
          label: 'Photography Sessions',
          href:
            environment.SITE_URL +
            '/how-to-use/photo-session-registration-software',
        },
      ],
    },
    {
      title: 'About SignUpGenius',
      links: [
        {
          label: 'Getting Started with Sign Ups',
          href: environment.SITE_URL + '/how-to-use/starterkit',
        },
        {
          label: 'Features',
          href: environment.SITE_URL + '/how-to-use/features',
        },
        { label: 'Pricing', href: environment.SITE_URL + '/pricing' },
        {
          label: 'Enterprise',
          href: environment.SITE_URL + '/enterprise',
        },
        {
          label: 'Collect Money',
          href: environment.SITE_URL + '/how-to-use/collect-money',
        },
        { label: 'Reviews', href: environment.SITE_URL + '/case-studies' },
        { label: 'About Us', href: environment.SITE_URL + '/about' },
        { label: 'Press Releases', href: environment.SITE_URL + '/news' },
        { label: 'Press Kit', href: environment.SITE_URL + '/press-kit' },
        { label: 'Careers', href: environment.SITE_URL + '/careers' },
        {
          label: 'Advertise with Us',
          href: environment.SITE_URL + '/advertisewithus',
        },
      ],
    },
    {
      title: 'Resources & Tips',
      links: [
        {
          label: 'Sign Up Designs',
          href: environment.SITE_URL + '/themes',
        },
        {
          label: 'Planning Ideas',
          href: environment.SITE_URL + '/resources',
        },
        { label: 'Blog', href: environment.SITE_URL + '/blog' },
        {
          label: 'Case Studies',
          href: environment.SITE_URL + '/case-studies',
        },
        { label: 'Videos', href: environment.SITE_URL + '/videos' },
        {
          label: 'Printables',
          href: environment.SITE_URL + '/printables',
        },
        {
          label: 'Giving Back',
          href: environment.SITE_URL + '/how-to-use/giving-back',
        },
        { label: 'API Docs', href: 'https://developer.signupgenius.com/' },
        { label: 'Help', href: 'https://support.signupgenius.com/' },
        { label: 'Contact Us', href: environment.SITE_URL + '/help' },
      ],
    },
    {
      title: 'Get Started',
      buttons: [
        {
          label: 'Create a Sign Up',
          variant: 'primary',
          href:
            environment.SITE_URL +
            'index.cfm?go=w.Welcome&prior=w.createSignUp&formName=registerForm',
        },
        {
          label: 'Find a Sign Up',
          variant: 'primary',
          href: environment.SITE_URL + 'findasignup',
        },
      ],
      search: { placeholder: 'Search Resources', buttonLabel: 'Search' },
    },
  ];

  ngOnInit(): void {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    this.isCollapsed = window.innerWidth < 767;
  }

  toggleCollapse(): void {
    if (window.innerWidth < 767) {
      this.isCollapsed = !this.isCollapsed;
    }
  }

  clickOnLinkHandle(): void {
    if (window.innerWidth < 767) {
      this.isCollapsed = true;
    }
  }

  onSearchClick(): void {
    console.log('Search clicked with query:', this.searchQuery);
    // Implement search functionality here
  }
}
