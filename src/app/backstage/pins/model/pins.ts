export interface PinterestPin {
  id: string;
  product_id: string | null;
  category_id: string | null;
  board_name: string;
  pin_title: string;
  pin_description: string;
  alt_text:string,
  destination_url: string;
  image_url: string | null;
  is_amazon_redirect: boolean;
  status: "draft" | "scheduled" | "posted" | "failed";
  pinterest_pin_id: string | null;
  error_message: string | null;
  created_at: string;
  product?: { name: string };
  category?: { name: string };
  is_ai_generated: boolean;
  publish_at: string;
  board_id:string;
    cloudinary_public_id: string | null;

}
