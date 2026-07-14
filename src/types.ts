export type ProductCategory = 'raw' | 'ready';

export interface Product {
  id: string;
  name: string;
  price: string;
  unit: string;
  category: ProductCategory;
  stock: number;
  lowStockAt: number;
  active: boolean;
}

export interface PriceHistoryEntry {
  id: string;
  productId: string;
  productName: string;
  oldPrice: string;
  newPrice: string;
  changedAt: string;
}

export interface DeliverySettings {
  cities: string;
  phone: string;
  details: string;
  deliverySurcharge: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  active: boolean;
}

export interface CanvasElementSettings {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GeneratorSettings {
  plateColor: string;
  textStyle: 'italic' | 'normal';
  fontScale: number;
  backgroundImage: string;
  title: CanvasElementSettings;
  list: CanvasElementSettings;
  cities: CanvasElementSettings;
  phone: CanvasElementSettings;
}

export interface CrmState {
  products: Product[];
  delivery: DeliverySettings;
  history: PriceHistoryEntry[];
  promotions: Promotion[];
  generatorSettings: GeneratorSettings;
}
