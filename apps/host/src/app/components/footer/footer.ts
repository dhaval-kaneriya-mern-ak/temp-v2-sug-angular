import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

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

  footerData: FooterColumn[] = [
    {
      title: 'Use It For',
      links: [
        { label: 'School Sign Ups', href: '/how-to-use/schools' },
        { label: 'Business Schedules', href: '/how-to-use/businesses' },
        {
          label: 'Volunteer Sign Ups',
          href: '/how-to-use/nonprofit-volunteer-management',
        },
        { label: 'Potluck Invites', href: '/how-to-use/potluck' },
        { label: 'Fundraising', href: '/how-to-use/collect-money' },
        { label: 'Sports Events', href: '/how-to-use/sportsteams' },
        { label: 'Church & Temple', href: '/how-to-use/churches' },
        { label: 'College Activities', href: '/how-to-use/colleges' },
        { label: 'Scouting Events', href: '/how-to-use/scouts' },
        {
          label: 'School Spirit Wear',
          href: '/how-to-use/school-spirit-wear-sales-software',
        },
        { label: 'Online Auctions', href: '#', target: '_blank' },
        { label: 'Donations Campaigns', href: '#', target: '_blank' },
        { label: 'Ticket Management', href: '#', target: '_blank' },
      ],
    },
    {
      title: 'Helpful For',
      links: [
        {
          label: 'Event Registrations',
          href: '/how-to-use/event-registration-software',
        },
        {
          label: 'Lessons & Camp Sign Ups',
          href: '/how-to-use/lessons-tutoring-registration-software',
        },
        {
          label: 'Parent Teacher Conferences',
          href: '/how-to-use/parent-teacher-conferences',
        },
        {
          label: 'Meal Sign Ups',
          href: '/how-to-use/online-meal-volunteer-sheets',
        },
        { label: 'School Fundraising', href: '/how-to-use/school-payments' },
        {
          label: 'Festivals & Carnivals',
          href: '/how-to-use/event-registration-software',
        },
        { label: 'Book Fair Volunteers', href: '/how-to-use/bookfair' },
        {
          label: 'Dance Class Registrations',
          href: '/how-to-use/dance-studio-registration-software',
        },
        { label: 'Direct Sales Businesses', href: '/how-to-use/collect-money' },
        {
          label: 'Photography Sessions',
          href: '/how-to-use/photo-session-registration-software',
        },
      ],
    },
    {
      title: 'About SignUpGenius',
      links: [
        {
          label: 'Getting Started with Sign Ups',
          href: '/how-to-use/starterkit',
        },
        { label: 'Features', href: '/how-to-use/features' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'Enterprise', href: '/enterprise' },
        { label: 'Collect Money', href: '/how-to-use/collect-money' },
        { label: 'Reviews', href: '/case-studies' },
        { label: 'About Us', href: '/about' },
        { label: 'Press Releases', href: '/news' },
        { label: 'Press Kit', href: '/press-kit' },
        { label: 'Careers', href: '/careers' },
        { label: 'Advertise with Us', href: '/advertisewithus' },
      ],
    },
    {
      title: 'Resources & Tips',
      links: [
        { label: 'Sign Up Designs', href: '/themes' },
        { label: 'Planning Ideas', href: '/resources' },
        { label: 'Blog', href: '/blog' },
        { label: 'Case Studies', href: '/case-studies' },
        { label: 'Videos', href: '/videos' },
        { label: 'Printables', href: '/printables' },
        { label: 'Giving Back', href: '/how-to-use/giving-back' },
        { label: 'API Docs', href: 'https://developer.signupgenius.com/' },
        { label: 'Help', href: '/support' },
        { label: 'Contact Us', href: '/help' },
      ],
    },
    {
      title: 'Get Started',
      buttons: [
        {
          label: 'Create a Sign Up',
          variant: 'primary',
          href: '/index.cfm?go=w.Welcome&prior=w.createSignUp&formName=registerForm',
        },
        {
          label: 'Find a Sign Up',
          variant: 'primary',
          href: '/findasignup',
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
