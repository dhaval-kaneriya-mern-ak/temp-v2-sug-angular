import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'sug-home',
  imports: [CommonModule, RouterModule],
  template: `
    <div class="home-content">
      <div class="welcome-section">
        <h1>Hello there,</h1>
        <h2>Welcome to SignUpGenius 👋</h2>

        <div class="status-card">
          <div class="status-icon">✅</div>
          <div class="status-content">
            <h3>You're up and running</h3>
            <p>Your microfrontend application is ready with the new layout!</p>
            <button class="whats-next-btn">What's next?</button>
          </div>
          <div class="nx-logo">
            <div class="nx-brand">SUG</div>
          </div>
        </div>
      </div>

      <div class="quick-actions">
        <h3>Quick Actions</h3>
        <div class="action-grid">
          <div class="action-card" routerLink="/messages">
            <div class="action-icon">✉️</div>
            <h4>Messages</h4>
            <p>Manage your message campaigns and communications</p>
          </div>

          <div class="action-card" routerLink="/reports">
            <div class="action-icon">📊</div>
            <h4>Reports</h4>
            <p>View analytics and generate detailed reports</p>
          </div>

          <div class="action-card">
            <div class="action-icon">📝</div>
            <h4>Create Sign Up</h4>
            <p>Start a new sign up form for your event</p>
          </div>

          <div class="action-card">
            <div class="action-icon">👥</div>
            <h4>Manage Groups</h4>
            <p>Organize and manage your participant groups</p>
          </div>
        </div>
      </div>

      <div class="features-section">
        <h3>Platform Features</h3>
        <div class="features-grid">
          <div class="feature-item">
            <div class="feature-icon">🎯</div>
            <h4>Event Management</h4>
            <p>Organize events with ease using our comprehensive tools</p>
          </div>

          <div class="feature-item">
            <div class="feature-icon">💬</div>
            <h4>Communication</h4>
            <p>Keep participants informed with automated messaging</p>
          </div>

          <div class="feature-item">
            <div class="feature-icon">📈</div>
            <h4>Analytics</h4>
            <p>Track engagement and measure success with detailed reports</p>
          </div>

          <div class="feature-item">
            <div class="feature-icon">🔒</div>
            <h4>Secure Platform</h4>
            <p>Your data is protected with enterprise-grade security</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .home-content {
        padding: 2rem 0;
        max-width: 1000px;
        margin: 0 auto;
      }

      .welcome-section {
        text-align: center;
        margin-bottom: 3rem;

        h1 {
          font-size: 2rem;
          color: var(--text-dark);
          margin-bottom: 0.5rem;
          font-weight: 400;
        }

        h2 {
          font-size: 2.5rem;
          color: var(--text-dark);
          margin-bottom: 2rem;
          font-weight: 600;
        }
      }

      .status-card {
        background: #1e3a8a;
        color: white;
        border-radius: 16px;
        padding: 2rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        max-width: 600px;
        margin: 0 auto 3rem;
        position: relative;

        .status-icon {
          font-size: 2rem;
          margin-right: 1rem;
        }

        .status-content {
          flex: 1;
          text-align: left;

          h3 {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
            font-weight: 600;
          }

          p {
            margin-bottom: 1rem;
            opacity: 0.9;
          }

          .whats-next-btn {
            background: white;
            color: #1e3a8a;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s ease;

            &:hover {
              transform: translateY(-1px);
            }
          }
        }

        .nx-logo {
          font-size: 3rem;
          font-weight: bold;
          opacity: 0.1;
          position: absolute;
          right: 2rem;
          top: 50%;
          transform: translateY(-50%);
        }
      }

      .quick-actions,
      .features-section {
        margin-bottom: 3rem;

        h3 {
          font-size: 1.5rem;
          color: var(--text-dark);
          margin-bottom: 1.5rem;
          text-align: center;
          font-weight: 600;
        }
      }

      .action-grid,
      .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
        margin-top: 1.5rem;
      }

      .action-card {
        background: white;
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 1.5rem;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
        text-decoration: none;
        color: inherit;

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          border-color: var(--primary-orange);
        }

        .action-icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }

        h4 {
          font-size: 1.2rem;
          color: var(--text-dark);
          margin-bottom: 0.5rem;
          font-weight: 600;
        }

        p {
          color: var(--text-muted);
          font-size: 0.9rem;
          line-height: 1.5;
        }
      }

      .feature-item {
        background: white;
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 1.5rem;
        text-align: center;

        .feature-icon {
          font-size: 2rem;
          margin-bottom: 1rem;
        }

        h4 {
          font-size: 1.1rem;
          color: var(--text-dark);
          margin-bottom: 0.5rem;
          font-weight: 600;
        }

        p {
          color: var(--text-muted);
          font-size: 0.9rem;
          line-height: 1.5;
        }
      }

      @media (max-width: 768px) {
        .home-content {
          padding: 1rem;
        }

        .welcome-section {
          h1 {
            font-size: 1.5rem;
          }

          h2 {
            font-size: 2rem;
          }
        }

        .status-card {
          flex-direction: column;
          text-align: center;
          padding: 1.5rem;

          .status-content {
            text-align: center;
          }

          .nx-logo {
            position: static;
            transform: none;
            margin-top: 1rem;
            opacity: 0.2;
          }
        }

        .action-grid,
        .features-grid {
          grid-template-columns: 1fr;
          gap: 1rem;
        }
      }
    `,
  ],
})
export class HomeComponent {}
