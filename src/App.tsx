import { useMemo, useRef, useState } from 'react';
import { Archive, BadgePercent, Camera, ChartNoAxesColumnIncreasing, ChevronRight, ClipboardList, Download, Menu, Package, Plus, Save, Settings2, ShoppingBasket, Truck, X } from 'lucide-react';
import { defaultDelivery, defaultProducts, defaultPromotions } from './data/defaults';
import { useLocalStorage } from './hooks';
import type { DeliverySettings, GeneratorSettings, PriceHistoryEntry, Product, ProductCategory, Promotion } from './types';
import { GeneratorCanvas } from './components/GeneratorCanvas';
import './styles.css';

type Section = 'dashboard' | 'prices' | 'delivery' | 'generator' | 'history' | 'changes' | 'stock' | 'promotions';

const nav: { id: Section; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'dashboard', label: 'Главная', icon: ChartNoAxesColumnIncreasing },
  { id: 'prices', label: 'Цены', icon: ShoppingBasket },
  { id: 'delivery', label: 'Доставка', icon: Truck },
  { id: 'generator', label: 'Генератор картинок', icon: Camera },
  { id: 'history', label: 'История цен', icon: Archive },
  { id: 'changes', label: 'Что изменилось', icon: ClipboardList },
  { id: 'stock', label: 'Остатки', icon: Package },
  { id: 'promotions', label: 'Акции', icon: BadgePercent },
];

const money = (value: string) => `${value} руб.`;

export default function App() {
  const [section, setSection] = useState<Section>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [products, setProducts] = useLocalStorage<Product[]>('turkey-products-v1', defaultProducts);
  const [delivery, setDelivery] = useLocalStorage<DeliverySettings>('turkey-delivery-v1', defaultDelivery);
  const [history, setHistory] = useLocalStorage<PriceHistoryEntry[]>('turkey-history-v1', []);
  const [promotions, setPromotions] = useLocalStorage<Promotion[]>('turkey-promotions-v1', defaultPromotions);
  const [generatorCategory, setGeneratorCategory] = useState<ProductCategory>('raw');
  const [generatorSettings, setGeneratorSettings] = useLocalStorage<GeneratorSettings>('turkey-generator-settings-v1', {
    plateColor: '#f55343',
    textStyle: 'italic',
    fontScale: 92,
    listY: 277,
    backgroundImage: '',
  });
  const [toast, setToast] = useState('');
  const stageRef = useRef<any>(null);

  const lowStock = useMemo(() => products.filter((p) => p.active && p.stock <= p.lowStockAt), [products]);
  const recentChanges = history.slice(0, 10);

  const notify = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(''), 2200);
  };

  const updateProduct = (id: string, patch: Partial<Product>) => {
    setProducts((current) => current.map((product) => {
      if (product.id !== id) return product;
      if (patch.price !== undefined && patch.price !== product.price) {
        setHistory((entries) => [{
          id: crypto.randomUUID(),
          productId: product.id,
          productName: product.name,
          oldPrice: product.price,
          newPrice: patch.price ?? product.price,
          changedAt: new Date().toISOString(),
        }, ...entries].slice(0, 300));
      }
      return { ...product, ...patch };
    }));
  };

  const addProduct = (category: ProductCategory) => {
    setProducts((current) => [...current, {
      id: crypto.randomUUID(),
      name: 'Новый товар',
      price: '0',
      unit: '1 кг',
      category,
      stock: 0,
      lowStockAt: 2,
      active: true,
    }]);
  };

  const exportImage = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const uri = stage.toDataURL({ pixelRatio: 2 / (stage.scaleX?.() || 1) });
    const link = document.createElement('a');
    link.download = `цены-индейка-${generatorCategory}-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = uri;
    link.click();
    notify('Изображение сохранено');
  };

  const pageTitle = nav.find((item) => item.id === section)?.label ?? 'Главная';

  return (
    <div className="shell">
      <aside className={menuOpen ? 'sidebar open' : 'sidebar'}>
        <div className="brand"><span className="brand-mark">🦃</span><div><strong>Индейка</strong><small>семейная CRM</small></div></div>
        <button className="mobile-close" onClick={() => setMenuOpen(false)}><X /></button>
        <nav>
          {nav.map(({ id, label, icon: Icon }) => (
            <button key={id} className={section === id ? 'nav-item active' : 'nav-item'} onClick={() => { setSection(id); setMenuOpen(false); }}>
              <Icon size={20} /><span>{label}</span><ChevronRight size={16} />
            </button>
          ))}
        </nav>
        <div className="sidebar-note"><Settings2 size={18} /><span>Все изменения сохраняются на этом устройстве автоматически.</span></div>
      </aside>

      <main>
        <header className="topbar">
          <button className="menu-button" onClick={() => setMenuOpen(true)}><Menu /></button>
          <div><p>Домашнее хозяйство</p><h1>{pageTitle}</h1></div>
          <div className="status"><span></span>Данные сохранены</div>
        </header>

        <div className="content">
          {section === 'dashboard' && <Dashboard products={products} lowStock={lowStock} history={history} promotions={promotions} onGo={setSection} />}
          {section === 'prices' && <Prices products={products} updateProduct={updateProduct} addProduct={addProduct} />}
          {section === 'delivery' && <Delivery delivery={delivery} setDelivery={setDelivery} notify={notify} />}
          {section === 'generator' && (
            <section className="generator-layout">
              <div className="card generator-controls">
                <div className="section-head"><div><span className="eyebrow">Шаблон</span><h2>Создать прайс</h2></div></div>
                <div className="segmented">
                  <button className={generatorCategory === 'raw' ? 'selected' : ''} onClick={() => setGeneratorCategory('raw')}>Сырая продукция</button>
                  <button className={generatorCategory === 'ready' ? 'selected' : ''} onClick={() => setGeneratorCategory('ready')}>Готовая продукция</button>
                </div>
                <p className="hint">На картинку попадают только включённые товары выбранного раздела.</p>
                <button className="primary wide" onClick={exportImage}><Download size={18} /> Скачать PNG</button>
                <button className="secondary wide" onClick={() => setSection('prices')}>Изменить цены</button>
                <details className="design-settings" open>
                  <summary>Настройки оформления</summary>
                  <div className="settings-grid">
                    <label>Цвет плашек<input type="color" value={generatorSettings.plateColor} onChange={(e) => setGeneratorSettings({ ...generatorSettings, plateColor: e.target.value })} /></label>
                    <label>Стиль текста<select value={generatorSettings.textStyle} onChange={(e) => setGeneratorSettings({ ...generatorSettings, textStyle: e.target.value as GeneratorSettings['textStyle'] })}><option value="italic">Наклонный жирный</option><option value="normal">Прямой жирный</option></select></label>
                  </div>
                  <label className="range-label"><span>Размер текста списка <b>{generatorSettings.fontScale}%</b></span><input type="range" min="70" max="110" value={generatorSettings.fontScale} onChange={(e) => setGeneratorSettings({ ...generatorSettings, fontScale: Number(e.target.value) })} /></label>
                  <label className="range-label"><span>Положение списка по вертикали <b>{generatorSettings.listY}</b></span><input type="range" min="210" max="430" value={generatorSettings.listY} onChange={(e) => setGeneratorSettings({ ...generatorSettings, listY: Number(e.target.value) })} /></label>
                  <label className="background-picker"><span>Собственный фон</span><input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setGeneratorSettings({ ...generatorSettings, backgroundImage: String(reader.result) }); reader.readAsDataURL(file); }} /><em>Нажмите, чтобы выбрать фотографию</em></label>
                  <button className="secondary wide" onClick={() => setGeneratorSettings({ ...generatorSettings, backgroundImage: '' })}>Вернуть исходный фон</button>
                </details>
              </div>
              <div className="card preview-card"><GeneratorCanvas stageRef={stageRef} products={products} delivery={delivery} category={generatorCategory} settings={generatorSettings} /></div>
            </section>
          )}
          {section === 'history' && <History history={history} />}
          {section === 'changes' && <Changes changes={recentChanges} />}
          {section === 'stock' && <Stock products={products} updateProduct={updateProduct} />}
          {section === 'promotions' && <Promotions promotions={promotions} setPromotions={setPromotions} />}
        </div>
      </main>
      {toast && <div className="toast">{toast}</div>}
      {menuOpen && <div className="backdrop" onClick={() => setMenuOpen(false)} />}
    </div>
  );
}

function Dashboard({ products, lowStock, history, promotions, onGo }: { products: Product[]; lowStock: Product[]; history: PriceHistoryEntry[]; promotions: Promotion[]; onGo: (s: Section) => void }) {
  const active = products.filter((p) => p.active).length;
  return <>
    <section className="hero"><div><span className="eyebrow light">Панель управления</span><h2>Добро пожаловать! 👋</h2><p>Цены, остатки, акции и готовые картинки — в одном месте.</p></div><button className="hero-button" onClick={() => onGo('generator')}><Camera size={20} /> Создать картинку</button></section>
    <section className="stats-grid">
      <Stat label="Товаров в продаже" value={String(active)} note="активных позиций" icon="📦" />
      <Stat label="Мало на складе" value={String(lowStock.length)} note="требуют внимания" icon="⚠️" />
      <Stat label="Изменений цен" value={String(history.length)} note="сохранено в истории" icon="📈" />
      <Stat label="Активных акций" value={String(promotions.filter((p) => p.active).length)} note="для покупателей" icon="🎁" />
    </section>
    <section className="two-col">
      <div className="card"><div className="section-head"><div><span className="eyebrow">Контроль</span><h2>Низкие остатки</h2></div><button className="link" onClick={() => onGo('stock')}>Все остатки</button></div>{lowStock.length ? lowStock.slice(0, 5).map((p) => <div className="alert-row" key={p.id}><div><strong>{p.name}</strong><span>{money(p.price)}</span></div><b>{p.stock} ед.</b></div>) : <Empty text="Все товары в достаточном количестве" />}</div>
      <div className="card"><div className="section-head"><div><span className="eyebrow">Последнее</span><h2>Изменения цен</h2></div><button className="link" onClick={() => onGo('history')}>История</button></div>{history.length ? history.slice(0, 5).map((h) => <div className="change-row" key={h.id}><div><strong>{h.productName}</strong><span>{new Date(h.changedAt).toLocaleString('ru-RU')}</span></div><p><s>{h.oldPrice}</s> → <b>{h.newPrice}</b></p></div>) : <Empty text="Цены пока не менялись" />}</div>
    </section>
  </>;
}

function Stat({ label, value, note, icon }: { label: string; value: string; note: string; icon: string }) { return <div className="stat card"><span className="stat-icon">{icon}</span><div><p>{label}</p><strong>{value}</strong><small>{note}</small></div></div>; }

function Prices({ products, updateProduct, addProduct }: { products: Product[]; updateProduct: (id: string, patch: Partial<Product>) => void; addProduct: (c: ProductCategory) => void }) {
  return <div className="stack">{(['raw', 'ready'] as const).map((category) => <section className="card" key={category}><div className="section-head"><div><span className="eyebrow">Категория</span><h2>{category === 'raw' ? 'Сырая продукция' : 'Готовая продукция'}</h2></div><button className="secondary" onClick={() => addProduct(category)}><Plus size={17} /> Добавить товар</button></div><div className="table-wrap"><table><thead><tr><th>Показывать</th><th>Название</th><th>Цена, руб.</th><th>Единица</th></tr></thead><tbody>{products.filter((p) => p.category === category).map((p) => <tr key={p.id}><td><input type="checkbox" checked={p.active} onChange={(e) => updateProduct(p.id, { active: e.target.checked })} /></td><td><input value={p.name} onChange={(e) => updateProduct(p.id, { name: e.target.value })} /></td><td><input className="price-input" value={p.price} onChange={(e) => updateProduct(p.id, { price: e.target.value })} /></td><td><input value={p.unit} onChange={(e) => updateProduct(p.id, { unit: e.target.value })} /></td></tr>)}</tbody></table></div></section>)}</div>;
}

function Delivery({ delivery, setDelivery, notify }: { delivery: DeliverySettings; setDelivery: React.Dispatch<React.SetStateAction<DeliverySettings>>; notify: (t: string) => void }) {
  return <section className="card form-card"><div className="section-head"><div><span className="eyebrow">Контакты</span><h2>Настройки доставки</h2></div></div><label>Города<input value={delivery.cities} onChange={(e) => setDelivery({ ...delivery, cities: e.target.value })} /></label><label>Телефон<input value={delivery.phone} onChange={(e) => setDelivery({ ...delivery, phone: e.target.value })} /></label><label>Доплата за доставку, руб.<input value={delivery.deliverySurcharge} onChange={(e) => setDelivery({ ...delivery, deliverySurcharge: e.target.value })} /></label><label>Описание<textarea rows={5} value={delivery.details} onChange={(e) => setDelivery({ ...delivery, details: e.target.value })} /></label><button className="primary" onClick={() => notify('Настройки доставки сохранены')}><Save size={18} /> Сохранить</button></section>;
}

function History({ history }: { history: PriceHistoryEntry[] }) { return <section className="card"><div className="section-head"><div><span className="eyebrow">Архив</span><h2>История изменения цен</h2></div></div>{history.length ? <div className="history-list">{history.map((h) => <div className="history-item" key={h.id}><div><strong>{h.productName}</strong><span>{new Date(h.changedAt).toLocaleString('ru-RU')}</span></div><p><s>{money(h.oldPrice)}</s><b>{money(h.newPrice)}</b></p></div>)}</div> : <Empty text="Изменения появятся после редактирования цен" />}</section>; }
function Changes({ changes }: { changes: PriceHistoryEntry[] }) { return <section className="card"><div className="section-head"><div><span className="eyebrow">Сводка</span><h2>Что изменилось недавно</h2></div></div>{changes.length ? changes.map((h) => <div className="timeline" key={h.id}><span></span><div><strong>{h.productName}</strong><p>Цена изменилась с {money(h.oldPrice)} на {money(h.newPrice)}</p><small>{new Date(h.changedAt).toLocaleString('ru-RU')}</small></div></div>) : <Empty text="Недавних изменений пока нет" />}</section>; }

function Stock({ products, updateProduct }: { products: Product[]; updateProduct: (id: string, patch: Partial<Product>) => void }) { return <section className="card"><div className="section-head"><div><span className="eyebrow">Склад</span><h2>Остатки продукции</h2></div></div><div className="stock-grid">{products.map((p) => <div className={p.stock <= p.lowStockAt ? 'stock-card low' : 'stock-card'} key={p.id}><div><strong>{p.name}</strong><span>{p.category === 'raw' ? 'Сырая' : 'Готовая продукция'}</span></div><label>Количество<input type="number" min="0" value={p.stock} onChange={(e) => updateProduct(p.id, { stock: Number(e.target.value) })} /></label><label>Предупредить при<input type="number" min="0" value={p.lowStockAt} onChange={(e) => updateProduct(p.id, { lowStockAt: Number(e.target.value) })} /></label></div>)}</div></section>; }

function Promotions({ promotions, setPromotions }: { promotions: Promotion[]; setPromotions: React.Dispatch<React.SetStateAction<Promotion[]>> }) {
  const update = (id: string, patch: Partial<Promotion>) => setPromotions((items) => items.map((p) => p.id === id ? { ...p, ...patch } : p));
  return <section className="card"><div className="section-head"><div><span className="eyebrow">Маркетинг</span><h2>Акции</h2></div><button className="secondary" onClick={() => setPromotions((p) => [...p, { id: crypto.randomUUID(), title: 'Новая акция', description: '', active: false }])}><Plus size={17} /> Добавить акцию</button></div><div className="promo-grid">{promotions.map((promo) => <div className={promo.active ? 'promo active' : 'promo'} key={promo.id}><label className="switch-line"><span>Активна</span><input type="checkbox" checked={promo.active} onChange={(e) => update(promo.id, { active: e.target.checked })} /></label><input value={promo.title} onChange={(e) => update(promo.id, { title: e.target.value })} /><textarea rows={4} value={promo.description} onChange={(e) => update(promo.id, { description: e.target.value })} /></div>)}</div></section>;
}

function Empty({ text }: { text: string }) { return <div className="empty"><span>🦃</span><p>{text}</p></div>; }
