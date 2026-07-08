import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment.development';
import { Category, Product, DashboardStats, ProductAnalytics, DailyStat, TrafficSource } from '../models';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly db: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseKey
  );

  // ── AUTH ──
  async signIn(email: string, password: string) {
    return await this.db.auth.signInWithPassword({ email, password });
  }

  async signOut() {
    return await this.db.auth.signOut();
  }

  async getSession() {
    return await this.db.auth.getSession();
  }

  getUser() {
    return this.db.auth.getUser();
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.db.auth.onAuthStateChange(callback);
  }

  async getUserId(): Promise<string | null> {
    const user = await this.getUser();
    return user?.data?.user?.id ?? null;
  }

  async getPinterestToken(): Promise<any | null> {
    const userId = await this.getUserId();
    if (!userId) return null;

    const { data, error } = await this.db
      .from('pinterest_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && (error as any).code !== 'PGRST116') throw error;
    return data ?? null;
  }

  async upsertPinterestToken(token: Record<string, any>): Promise<void> {
    const userId = await this.getUserId();

    if (!userId) throw new Error('Not authenticated');

    const payload: Record<string, any> = { user_id: userId, ...token };
    const expiresAt = payload['expires_at'];
    if (expiresAt instanceof Date) {
      payload['expires_at'] = expiresAt.toISOString();
    } else if (typeof expiresAt === 'number') {
      payload['expires_at'] = new Date(expiresAt).toISOString();
    }

    const { error } = await this.db
      .from('pinterest_tokens')
      .upsert(payload, { onConflict: 'user_id' });

    if (error) throw error;
  }

  async deletePinterestToken(): Promise<void> {
    const userId = await this.getUserId();
    if (!userId) return;

    const { error } = await this.db
      .from('pinterest_tokens')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  }

  // ── PUBLIC: CATEGORIES ──
  async getCategories(): Promise<Category[]> {
    const { data, error } = await this.db
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order');
    if (error) throw error;
    return data ?? [];
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const { data } = await this.db
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();
    return data ?? null;
  }

  // ── PUBLIC: PRODUCTS ──
  // async getFeaturedProducts(): Promise<Product[]> {
  //   const { data, error } = await this.db
  //     .from('products')
  //     .select('*, category:categories(*), specs:product_specs(*), features:product_features(*)')
  //     .eq('is_featured', true)
  //     .eq('is_active', true)
  //     .order('display_order')
  //     .limit(6);
  //   if (error) throw error;
  //   return data ?? [];
  // }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    const { data, error } = await this.db
      .from('products')
      .select('*, category:categories(*), specs:product_specs(*), features:product_features(*)')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('display_order');
    if (error) throw error;
    return data ?? [];
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const { data } = await this.db
      .from('products')
      .select('*, category:categories(*), specs:product_specs(*), features:product_features(*)')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();
    if (data) {
      const { data: related } = await this.db
        .from('related_products')
        .select('related_product:products!related_product_id(*, category:categories(*))')
        .eq('product_id', data.id)
        .limit(3);
      data.related_products = related?.map((r: any) => r.related_product) ?? [];
    }
    return data ?? null;
  }

  // ── TRACKING ──
  async trackProductView(productId: string): Promise<void> {
    try {
      await this.db.from('product_views').insert({
        product_id: productId,
        referrer: document.referrer || '',
        device: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop',
        session_id: this.getSessionId()
      });
    } catch { }
  }

  async trackAmazonClick(productId: string): Promise<void> {
    try {
      await this.db.from('amazon_clicks').insert({
        product_id: productId,
        referrer: document.referrer || '',
        device: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop',
        session_id: this.getSessionId()
      });
    } catch { }
  }

  private getSessionId(): string {
    let id = sessionStorage.getItem('tda_sid');
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem('tda_sid', id);
    }
    return id;
  }
}


