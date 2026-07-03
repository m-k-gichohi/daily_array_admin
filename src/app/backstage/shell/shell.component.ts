import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="tda-shell d-flex">

      <!-- ── SIDEBAR ── -->
      <aside class="tda-sidebar d-flex flex-column" [class.tda-sidebar--collapsed]="collapsed()">

        <!-- Brand -->
        <div class="tda-sidebar-brand px-3 py-4">
          @if (!collapsed()) {
            <a routerLink="/" class="tda-brand-link">
              The Daily <span>Array</span>
            </a>
            <p class="tda-brand-sub mb-0">Backstage</p>
          } @else {
            <a routerLink="/" class="tda-brand-icon">TDA</a>
          }
        </div>

        <hr class="tda-sidebar-divider mx-3 my-0">

        <!-- Nav links -->
        <nav class="tda-sidebar-nav flex-grow-1 px-2 py-3">
          <a routerLink="/backstage/dashboard" routerLinkActive="active"
            class="tda-nav-link d-flex align-items-center gap-3">
            <i class="bi bi-grid-1x2-fill tda-nav-icon"></i>
            @if (!collapsed()) { <span>Dashboard</span> }
          </a>
          <a routerLink="/backstage/products" routerLinkActive="active"
            class="tda-nav-link d-flex align-items-center gap-3">
            <i class="bi bi-box-seam-fill tda-nav-icon"></i>
            @if (!collapsed()) { <span>Products</span> }
          </a>
          <a routerLink="/backstage/categories" routerLinkActive="active"
            class="tda-nav-link d-flex align-items-center gap-3">
            <i class="bi bi-collection-fill tda-nav-icon"></i>
            @if (!collapsed()) { <span>Categories</span> }
          </a>
          <a routerLink="/backstage/analytics" routerLinkActive="active"
            class="tda-nav-link d-flex align-items-center gap-3">
            <i class="bi bi-bar-chart-fill tda-nav-icon"></i>
            @if (!collapsed()) { <span>Analytics</span> }
          </a>

          <hr class="tda-sidebar-divider mx-1 my-2">

          <a routerLink="/" target="_blank"
            class="tda-nav-link d-flex align-items-center gap-3">
            <i class="bi bi-box-arrow-up-right tda-nav-icon"></i>
            @if (!collapsed()) { <span>View site</span> }
          </a>

             <a routerLink="/backstage/pins" routerLinkActive="active"
            class="tda-nav-link d-flex align-items-center gap-3">
            <i class="bi bi-pin-angle-fill tda-nav-icon"></i>
            @if (!collapsed()) { <span>Pins</span> }
          </a>
        </nav>

        <!-- User + Sign out -->
        <div class="tda-sidebar-footer px-3 py-3">
          <hr class="tda-sidebar-divider mb-3">
          @if (!collapsed()) {
            <p class="tda-user-email mb-2">{{ auth.userEmail() }}</p>
          }
          <button class="tda-signout-btn d-flex align-items-center gap-2 w-100"
            (click)="signOut()">
            <i class="bi bi-box-arrow-left"></i>
            @if (!collapsed()) { <span>Sign out</span> }
          </button>
        </div>

        <!-- Collapse toggle -->
        <button class="tda-collapse-btn" (click)="collapsed.update(v => !v)"
          [title]="collapsed() ? 'Expand' : 'Collapse'">
          <i class="bi" [class.bi-chevron-left]="!collapsed()" [class.bi-chevron-right]="collapsed()"></i>
        </button>

      </aside>

      <!-- ── MAIN CONTENT ── -->
      <main class="tda-main flex-grow-1">

        <!-- Top bar -->
        <div class="tda-topbar d-flex align-items-center justify-content-between px-4">
          <button class="tda-mobile-menu d-lg-none" (click)="mobileOpen.update(v => !v)">
            <i class="bi bi-list fs-5"></i>
          </button>
          <div class="ms-auto d-flex align-items-center gap-3">
            <span class="tda-topbar-user d-none d-md-block">{{ auth.userEmail() }}</span>
            <div class="tda-topbar-avatar">
              {{ initials() }}
            </div>
          </div>
        </div>

        <!-- Page content -->
        <div class="tda-page-content">
          <router-outlet />
        </div>

      </main>

    </div>

    <!-- Mobile overlay -->
    @if (mobileOpen()) {
      <div class="tda-mobile-overlay" (click)="mobileOpen.set(false)"></div>
    }
  `,
  styles: [`
    .tda-shell {
      min-height: 100vh;
      background: #f8f5ef;
    }

    /* ── SIDEBAR ── */
    .tda-sidebar {
      width: 240px;
      min-height: 100vh;
      background: #1a1a2e;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: visible;
      flex-shrink: 0;
      transition: width 0.25s cubic-bezier(.25,.46,.45,.94);
      align-self: flex-start;
    }
    .tda-sidebar--collapsed { width: 72px; }

    .tda-brand-link {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.35rem;
      font-weight: 500;
      color: #f5f0e8;
      text-decoration: none;
      display: block;
    }
    .tda-brand-link span { color: #c9a84c; }
    .tda-brand-icon {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1rem;
      font-weight: 600;
      color: #c9a84c;
      text-decoration: none;
      display: block;
      text-align: center;
    }
    .tda-brand-sub {
      font-size: 0.625rem;
      font-weight: 600;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #c9a84c;
      margin-top: 2px;
    }
    .tda-sidebar-divider {
      border-color: rgba(255,255,255,0.08);
    }

    /* ── NAV LINKS ── */
    .tda-nav-link {
      display: flex;
      align-items: center;
      padding: 0.625rem 0.875rem;
      border-radius: 4px;
      color: #a0a8b8;
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 400;
      margin-bottom: 2px;
      transition: all 0.15s;
      white-space: nowrap;
      overflow: hidden;
    }
    .tda-nav-link:hover { background: rgba(255,255,255,0.06); color: #f5f0e8; }
    .tda-nav-link.active { background: rgba(201,168,76,0.12); color: #c9a84c; }
    .tda-nav-link.active .tda-nav-icon { color: #c9a84c; }
    .tda-nav-icon { font-size: 1rem; flex-shrink: 0; color: #a0a8b8; transition: color 0.15s; }
    .tda-nav-link:hover .tda-nav-icon { color: #f5f0e8; }

    /* ── SIDEBAR FOOTER ── */
    .tda-user-email {
      font-size: 0.75rem;
      color: #a0a8b8;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .tda-signout-btn {
      background: none;
      border: none;
      color: #a0a8b8;
      font-size: 0.8125rem;
      padding: 0.5rem 0.875rem;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.15s;
      text-align: left;
    }
    .tda-signout-btn:hover { background: rgba(255,255,255,0.06); color: #f5f0e8; }

    /* ── COLLAPSE BTN ── */
    .tda-collapse-btn {
      position: absolute;
      top: 50%;
      right: -12px;
      transform: translateY(-50%);
      width: 24px;
      height: 24px;
      background: #1a1a2e;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 50%;
      color: #a0a8b8;
      font-size: 0.625rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 10;
      transition: all 0.15s;
    }
    .tda-collapse-btn:hover { background: #c9a84c; color: #1a1a2e; border-color: #c9a84c; }

    /* ── MAIN ── */
    .tda-main {
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    /* ── TOPBAR ── */
    .tda-topbar {
      height: 60px;
      background: #fff;
      border-bottom: 1px solid #f0ead8;
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .tda-topbar-user { font-size: 0.8125rem; color: #888; }
    .tda-topbar-avatar {
      width: 34px;
      height: 34px;
      background: #fdf8ef;
      border: 1px solid #f0ead8;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
      color: #b5832a;
    }
    .tda-mobile-menu { background: none; border: none; color: #1a1a1a; cursor: pointer; }

    /* ── PAGE CONTENT ── */
    .tda-page-content { padding: 2rem; }

    /* ── MOBILE OVERLAY ── */
    .tda-mobile-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      z-index: 40;
    }

    @media (max-width: 768px) {
      .tda-sidebar { display: none; }
      .tda-page-content { padding: 1rem; }
    }
  `]
})
export class ShellComponent {
  readonly auth = inject(AuthService);
  readonly collapsed = signal(false);
  readonly mobileOpen = signal(false);

  initials(): string {
    const email = this.auth.userEmail();
    if (!email) return 'A';
    return email.charAt(0).toUpperCase();
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
  }
}
