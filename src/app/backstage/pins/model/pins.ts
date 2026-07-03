


export interface PinterestPin {
  id: string;
  product_id: string | null;
  category_id: string | null;
  board_name: string;
  pin_title: string;
  pin_description: string;
  destination_url: string;
  post_time_est: string | null;
  post_date: string | null;

  
  status: 'draft' | 'scheduled' | 'posted' | 'failed';
  pinterest_pin_id: string | null;
  error_message: string | null;
  created_at: string;
  product?: { name: string };
  category?: { name: string };
}