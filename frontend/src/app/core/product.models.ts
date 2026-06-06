export interface ProductImage {
  id: number;
  url: string;
  order: number;
  is_primary: boolean;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  colors: string[];
  storage_options: string[];
  stock: number;
  is_active: boolean;
  is_sealed: boolean;
  battery_health: number | null;
  created_at: string;
  updated_at: string;
  images: ProductImage[];
}

export interface ProductCreate {
  name: string;
  description?: string | null;
  price: number;
  colors: string[];
  storage_options: string[];
  stock: number;
  is_active: boolean;
  is_sealed: boolean;
  battery_health: number | null;
}

export type ProductUpdate = Partial<ProductCreate>;
