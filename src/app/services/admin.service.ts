import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  Category, Product,
  DashboardStats, ProductAnalytics, DailyStat, TrafficSource
} from '../models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly db = inject(SupabaseService);

  // ════════════════════════════════════
  // CATEGORIES
  // ════════════════════════════════════

  async getAllCategories(): Promise<Category[]> {
    const { data, error } = await this.db.db
      .from('categories')
      .select('*')
      .order('display_order');
    if (error) throw error;
    return data ?? [];
  }

  async createCategory(cat: Partial<Category>): Promise<void> {
    const { error } = await this.db.db.from('categories').insert(cat);
    if (error) throw error;
  }

  async updateCategory(id: string, data: Partial<Category>): Promise<void> {
    const { error } = await this.db.db
      .from('categories')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }

  async deleteCategory(id: string): Promise<void> {
    const { error } = await this.db.db
      .from('categories').delete().eq('id', id);
    if (error) throw error;
  }

  // ════════════════════════════════════
  // PRODUCTS
  // ════════════════════════════════════

  async getAllProducts(): Promise<Product[]> {
    const { data, error } = await this.db.db
      .from('products')
      .select('*, category:categories(name, slug)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async getProductById(id: string): Promise<Product | null> {
    const { data } = await this.db.db
      .from('products')
      .select('*, category:categories(*)')
      .eq('id', id)
      .single();
    return data ?? null;
  }

  async createProduct(product: Partial<Product>): Promise<string> {
    const { category, related_products, ...productData } = product as any;
    const { data, error } = await this.db.db
      .from('products')
      .insert(productData)
      .select()
      .single();
    if (error) throw error;
    const productId = data.id;

  

    return productId;
  }

  async updateProduct(id: string, product: Partial<Product>): Promise<void> {
    const { category, related_products, ...productData } = product as any;
    const { error } = await this.db.db
      .from('products')
      .update({ ...productData, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }

  async deleteProduct(id: string): Promise<void> {
    const { error } = await this.db.db
      .from('products').delete().eq('id', id);
    if (error) throw error;
  }

  async toggleFeatured(id: string, isFeatured: boolean): Promise<void> {
    await this.db.db.from('products')
      .update({ is_featured: isFeatured }).eq('id', id);
  }

  async toggleActive(id: string, isActive: boolean): Promise<void> {
    await this.db.db.from('products')
      .update({ is_active: isActive }).eq('id', id);
  }



  // ════════════════════════════════════
  // ANALYTICS
  // ════════════════════════════════════

  async getDashboardStats(): Promise<DashboardStats> {
    const { data } = await this.db.db.rpc('get_dashboard_stats');
    return data?.[0] ?? { total_views: 0, total_clicks: 0, total_products: 0, overall_ctr: 0 };
  }

  async getProductAnalytics(): Promise<ProductAnalytics[]> {
    const { data } = await this.db.db.rpc('get_product_analytics');
    return data ?? [];
  }

  async getDailyClicks(): Promise<DailyStat[]> {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await this.db.db
      .from('amazon_clicks')
      .select('clicked_at')
      .gte('clicked_at', since);

    const grouped: Record<string, number> = {};
    for (const row of data ?? []) {
      const day = row.clicked_at.substring(0, 10);
      grouped[day] = (grouped[day] ?? 0) + 1;
    }
    return Object.entries(grouped)
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => a.day.localeCompare(b.day));
  }

  async getDailyViews(): Promise<DailyStat[]> {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await this.db.db
      .from('product_views')
      .select('viewed_at')
      .gte('viewed_at', since);

    const grouped: Record<string, number> = {};
    for (const row of data ?? []) {
      const day = row.viewed_at.substring(0, 10);
      grouped[day] = (grouped[day] ?? 0) + 1;
    }
    return Object.entries(grouped)
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => a.day.localeCompare(b.day));
  }

  async getTrafficSources(): Promise<TrafficSource[]> {
    const { data } = await this.db.db.rpc('get_traffic_sources');
    return data ?? [];
  }

    // ════════════════════════════════════
  // PINTEREST PINS (scheduling, pending API access)
  // ════════════════════════════════════

  async getAllPins(): Promise<any[]> {
    const { data, error } = await this.db.db
      .from('pinterest_pins')
      .select('*, product:products(name)')
      .order('post_date', { ascending: true, nullsFirst: false });
    if (error) throw error;
    return data ?? [];
  }

  async createPin(pin: Record<string, any>): Promise<void> {
    const { error } = await this.db.db.from('pinterest_pins').insert(pin);
    if (error) throw error;
  }

  async updatePin(id: string, pin: Record<string, any>): Promise<void> {
    const { error } = await this.db.db
      .from('pinterest_pins')
      .update(pin)
      .eq('id', id);
    if (error) throw error;
  }

  async deletePin(id: string): Promise<void> {
    const { error } = await this.db.db
      .from('pinterest_pins').delete().eq('id', id);
    if (error) throw error;
  }
}
