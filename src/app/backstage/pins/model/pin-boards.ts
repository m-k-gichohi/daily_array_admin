export interface PinterestBoard {
    follower_count?:         number;
    pin_count?:              number;
    collaborator_count?:     number;
    is_ads_only?:            boolean;
    id?:                     string;
    created_at?:             Date;
    media?:                  Media;
    privacy?:                string;
    name?:                   string;
    board_pins_modified_at?: Date;
    owner?:                  Owner;
    description?:            string;
}

export interface Media {
    pin_thumbnail_urls?: string[];
    image_cover_url?:    string;
}

export interface Owner {
    username?: string;
}


export interface PinterestBoardsResponse {
  items: PinterestBoard[];
  bookmark?: string; // For pagination
}