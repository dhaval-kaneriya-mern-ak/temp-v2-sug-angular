import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'sug-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (imageError() || !src) {
    <div
      class="avatar-placeholder"
      [style.width]="getSize(width)"
      [style.height]="getSize(height)"
      [class.rounded-circle]="roundedCircle"
    >
      {{ getInitials() }}
    </div>
    } @else {
    <img
      [src]="src"
      [alt]="alt"
      [width]="width"
      [height]="height"
      [class.rounded-circle]="roundedCircle"
      class="avatar-image"
      (error)="handleImageError()"
    />
    }
  `,
  styles: [
    `
      .avatar-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #f68b1c 0%, #fccc9e 100%);
        color: white;
        font-weight: 600;
        font-size: 14px;
        text-transform: uppercase;
        user-select: none;
      }

      .avatar-image {
        object-fit: cover;
        display: block;
      }

      .rounded-circle {
        border-radius: 50%;
      }
    `,
  ],
})
export class AvatarComponent {
  @Input() src: string | null | undefined = '';
  @Input() alt = 'User avatar';
  @Input() width: number | string = 34;
  @Input() height: number | string = 34;
  @Input() userName = '';
  @Input() fallbackText = '';
  @Input() roundedCircle = true;

  imageError = signal(false);

  getInitials(): string {
    if (this.fallbackText) return this.fallbackText;

    if (this.userName) {
      const names = this.userName.trim().split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return this.userName.substring(0, 2).toUpperCase();
    }

    return 'U';
  }

  handleImageError(): void {
    this.imageError.set(true);
  }

  getSize(size: number | string): string {
    return typeof size === 'number' ? `${size}px` : size;
  }
}
