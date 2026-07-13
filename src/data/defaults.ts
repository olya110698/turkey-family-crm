import type { DeliverySettings, Product, Promotion } from '../types';

const id = () => crypto.randomUUID();

export const defaultProducts: Product[] = [
  { id: id(), name: 'Тушка индейки (потрошеная)', price: '17,5', unit: '1 кг', category: 'raw', stock: 12, lowStockAt: 3, active: true },
  { id: id(), name: 'Грудка филе', price: '32', unit: '1 кг', category: 'raw', stock: 9, lowStockAt: 3, active: true },
  { id: id(), name: 'Бедро филе / бедро на кости', price: '32 / 25,5', unit: '1 кг', category: 'raw', stock: 7, lowStockAt: 3, active: true },
  { id: id(), name: 'Голень на кости', price: '16,5', unit: '1 кг', category: 'raw', stock: 8, lowStockAt: 3, active: true },
  { id: id(), name: 'Шея', price: '17,5', unit: '1 кг', category: 'raw', stock: 5, lowStockAt: 2, active: true },
  { id: id(), name: 'Крылышки', price: '15', unit: '1 кг', category: 'raw', stock: 4, lowStockAt: 2, active: true },
  { id: id(), name: 'Суповой набор', price: '11', unit: '1 кг', category: 'raw', stock: 3, lowStockAt: 2, active: true },
  { id: id(), name: 'Мышечный желудок', price: '18', unit: '1 кг', category: 'raw', stock: 2, lowStockAt: 2, active: true },
  { id: id(), name: 'Фарш', price: '33', unit: '1 кг', category: 'raw', stock: 10, lowStockAt: 3, active: true },
  { id: id(), name: 'Грудка вяленая', price: '7,4', unit: '100 г', category: 'ready', stock: 18, lowStockAt: 5, active: true },
  { id: id(), name: 'Колбаса с/в «Пальцем пиханная»', price: '22', unit: 'батон 0,33 кг', category: 'ready', stock: 8, lowStockAt: 3, active: true },
  { id: id(), name: 'Колбаса с/в сервелат', price: '22', unit: 'батон 0,33 кг', category: 'ready', stock: 7, lowStockAt: 3, active: true },
  { id: id(), name: 'Тушёнка 0,5 л', price: '20,5', unit: '1 банка', category: 'ready', stock: 15, lowStockAt: 5, active: true },
  { id: id(), name: 'Перец с фаршем и рисом', price: '22', unit: '1 кг', category: 'ready', stock: 4, lowStockAt: 2, active: true },
  { id: id(), name: 'Жир топлёный 0,5 л', price: '18', unit: '1 банка', category: 'ready', stock: 11, lowStockAt: 4, active: true },
  { id: id(), name: 'Бедро в маринаде', price: '38', unit: '1 кг', category: 'ready', stock: 6, lowStockAt: 2, active: true },
  { id: id(), name: 'Грудка в маринаде', price: '38', unit: '1 кг', category: 'ready', stock: 6, lowStockAt: 2, active: true },
  { id: id(), name: 'Голень в маринаде', price: '20', unit: '1 кг', category: 'ready', stock: 5, lowStockAt: 2, active: true },
  { id: id(), name: 'Крылышки в маринаде', price: '18', unit: '1 кг', category: 'ready', stock: 5, lowStockAt: 2, active: true },
];

export const defaultDelivery: DeliverySettings = {
  cities: 'Чисть, Молодечно, Минск',
  phone: '+375447256661',
  details: 'Доставка по согласованию. Заказы принимаются по телефону.',
  deliverySurcharge: '1',
};

export const defaultPromotions: Promotion[] = [
  { id: id(), title: 'Семейный заказ', description: 'Скидка 5% при заказе от 100 руб.', active: false },
];
