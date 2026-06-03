import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="lda-hero">
      <div class="lda-card">
        <div class="lda-logo">TDA</div>
        <h1 class="lda-title">The Daily Array</h1>
        <p class="lda-sub">Manage site content and products.</p>
        <a routerLink="/backstage" class="btn tda-btn-primary lda-cta">Sign in</a>
      </div>
    </div>
  `,
  styles: [`
    .lda-hero {
      min-height: 70vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(180deg, #fffaf0 0%, #f8f5ef 100%);
      padding: 3rem 1rem;
    }
    .lda-card {
      background: #ffffff;
      border: 1px solid #f0ead8;
      padding: 2.25rem 2rem;
      border-radius: 12px;
      box-shadow: 0 8px 30px rgba(22, 22, 35, 0.06);
      text-align: center;
      max-width: 520px;
      width: 100%;
    }
    .lda-logo {
      width: 64px;
      height: 64px;
      margin: 0 auto 0.75rem auto;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: #fff;
      background: linear-gradient(135deg, #b5832a 0%, #8a5a1a 100%);
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.25rem;
    }
    .lda-title { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; margin: 0.25rem 0 0.5rem 0; color: #1a1a1a; }
    .lda-sub { color: #666; margin-bottom: 1.25rem; }
    .lda-cta { padding: 0.6rem 1.25rem; font-weight: 600; }
    @media (max-width: 480px) {
      .lda-card { padding: 1.25rem; border-radius: 10px; }
      .lda-title { font-size: 1.25rem; }
    }
  `]
})
export class LandingComponent {} 
