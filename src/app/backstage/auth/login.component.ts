import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="tda-login-page d-flex align-items-center justify-content-center">
      <div class="tda-login-card">

        <!-- Brand -->
        <div class="text-center mb-5">
          <h1 class="tda-login-brand mb-1">The Daily <span>Array</span></h1>
          <p class="tda-login-sub mb-0">Backstage access</p>
        </div>

        <!-- Form -->
        <form (ngSubmit)="signIn()" #loginForm="ngForm">

          <div class="mb-3">
            <label class="tda-field-label">Email address</label>
            <input
              type="email"
              class="form-control tda-input"
              [(ngModel)]="email"
              name="email"
              placeholder="you@example.com"
              required
              autocomplete="email"
            />
          </div>

          <div class="mb-4">
            <label class="tda-field-label">Password</label>
            <input
              type="password"
              class="form-control tda-input"
              [(ngModel)]="password"
              name="password"
              placeholder="••••••••"
              required
              autocomplete="current-password"
            />
          </div>

          @if (error()) {
            <div class="tda-login-error mb-3">
              <i class="bi bi-exclamation-circle me-2"></i>{{ error() }}
            </div>
          }

          <button
            type="submit"
            class="btn tda-btn-login w-100"
            [disabled]="loading()">
            @if (loading()) {
              <span class="spinner-border spinner-border-sm me-2"></span>
              Signing in...
            } @else {
              Sign in
            }
          </button>

        </form>

        <p class="tda-login-footer mt-4 text-center">
          <a href="/" class="tda-login-back">
            <i class="bi bi-arrow-left me-1"></i>Back to site
          </a>
        </p>

      </div>
    </div>
  `,
  styles: [`
    .tda-login-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #fdf8ef 0%, #f5ede0 100%);
      padding: 2rem;
    }
    .tda-login-card {
      background: #fff;
      border: 1px solid #f0ead8;
      border-radius: 4px;
      padding: 3rem 2.5rem;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 8px 48px rgba(0,0,0,0.08);
    }
    .tda-login-brand {
      font-family: 'Cormorant Garamond', serif;
      font-size: 2rem;
      font-weight: 500;
      color: #1a1a1a;
      letter-spacing: 0.01em;
    }
    .tda-login-brand span { color: #b5832a; }
    .tda-login-sub {
      font-size: 0.8125rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #b5832a;
      font-weight: 500;
    }
    .tda-field-label {
      font-size: 0.6875rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #888;
      display: block;
      margin-bottom: 6px;
    }
    .tda-input {
      border: 1px solid #f0ead8;
      border-radius: 2px;
      padding: 0.625rem 0.875rem;
      font-size: 0.9rem;
      color: #1a1a1a;
      background: #fdf8ef;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .tda-input:focus {
      border-color: #b5832a;
      box-shadow: 0 0 0 3px rgba(181,131,42,0.1);
      background: #fff;
    }
    .tda-btn-login {
      background: #1a1a2e;
      color: #fff;
      border: none;
      border-radius: 2px;
      padding: 0.75rem;
      font-size: 0.875rem;
      font-weight: 500;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      transition: background 0.2s;
    }
    .tda-btn-login:hover:not(:disabled) { background: #b5832a; }
    .tda-btn-login:disabled { opacity: 0.7; cursor: not-allowed; }
    .tda-login-error {
      font-size: 0.8125rem;
      color: #dc3545;
      background: #fff5f5;
      border: 1px solid #ffd7d7;
      border-radius: 2px;
      padding: 0.625rem 0.875rem;
    }
    .tda-login-back {
      font-size: 0.8125rem;
      color: #888;
      text-decoration: none;
      transition: color 0.2s;
    }
    .tda-login-back:hover { color: #b5832a; }
    .tda-login-footer { border-top: 1px solid #f0ead8; padding-top: 1.25rem; }
  `]
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  async signIn(): Promise<void> {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.error.set(null);

    const { error } = await this.auth.signIn(this.email, this.password);

    if (error) {
      this.error.set('Invalid email or password. Please try again.');
      this.loading.set(false);
      return;
    }

    await this.router.navigate(['/backstage/dashboard']);
  }
}
