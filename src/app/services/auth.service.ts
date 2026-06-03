import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);

  // Signal-based auth state — Angular 21 style
  readonly isLoggedIn = signal(false);
  readonly userEmail = signal<string | null>(null);
  readonly loading = signal(true);

  constructor() {
    this.initAuth();
  }

  private async initAuth(): Promise<void> {
    // Check existing session on app load
    const { data } = await this.supabase.getSession();
    this.isLoggedIn.set(!!data.session);
    this.userEmail.set(data.session?.user?.email ?? null);
    this.loading.set(false);

    // Listen for auth state changes
    this.supabase.onAuthStateChange((event, session) => {
      this.isLoggedIn.set(!!session);
      this.userEmail.set(session?.user?.email ?? null);
    });
  }

  async signIn(email: string, password: string): Promise<{ error: string | null }> {
    const { error } = await this.supabase.signIn(email, password);
    if (error) return { error: error.message };
    this.isLoggedIn.set(true);
    return { error: null };
  }

  async signOut(): Promise<void> {
    await this.supabase.signOut();
    this.isLoggedIn.set(false);
    this.userEmail.set(null);
    await this.router.navigate(['/backstage']);
  }
}
