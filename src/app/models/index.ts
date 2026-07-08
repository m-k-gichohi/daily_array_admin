// ── PUBLIC MODELS ──

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  meta_description: string;
  hero_tagline: string;
  subdomain:string,
  hero_html:string,
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}





export interface Product {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  amazon_url: string;
  asin:string,
  image_url: string;
  is_featured: boolean;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
  category?: Category;
  related_products?: Product[];
}

// ── ANALYTICS MODELS ──

export interface DashboardStats {
  total_views: number;
  total_clicks: number;
  total_products: number;
  overall_ctr: number;
}

export interface ProductAnalytics {
  name: string;
  slug: string;
  price_approx: number;
  page_views: number;
  amazon_clicks: number;
  ctr_percent: number;
}

export interface DailyStat {
  day: string;
  count: number;
}

export interface TrafficSource {
  source: string;
  visits: number;
}


