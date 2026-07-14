import { useEffect, useMemo, useRef, useState } from 'react';
import { Archive, BadgePercent, BarChart3, Camera, ChevronRight, ClipboardList, Cloud, Download, LogIn, LogOut, Menu, Package, Plus, Save, Settings, ShoppingBasket, Truck, X } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { defaultDelivery, defaultProducts, defaultPromotions } from './data/defaults';
import { useLocalStorage } from './hooks';
import { supabase, supabaseEnabled } from './lib-supabase';
import type { CrmState, DeliverySettings, GeneratorSettings, PriceHistoryEntry, Product, ProductCategory, Promotion } from './types';
import { GeneratorCanvas } from './components/GeneratorCanvas';
import './styles.css';

type Section = 'dashboard' | 'prices' | 'delivery' | 'generator' | 'history' | 'analytics' | 'stock' | 'promotions' | 'settings';
const nav: { id: Section; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'dashboard', label: 'Главная', icon: BarChart3 },
  { id: 'prices', label: 'Цены', icon: ShoppingBasket },
  { id: 'delivery', label: 'Доставка', icon: Truck },
  { id: 'generator', label: 'Генератор', icon: Camera },
  { id: 'history', label: 'История', icon: Archive },
  { id: 'analytics', label: 'Аналитика', icon: ClipboardList },
  { id: 'stock', label: 'Остатки', icon: Package },
  { id: 'promotions', label: 'Акции', icon: BadgePercent },
  { id: 'settings', label: 'Настройки', icon: Settings },
];
const defaultGenerator: GeneratorSettings = {
  plateColor: '#fa5045', textStyle: 'italic', fontScale: 92, backgroundImage: '',
  title: { x: 230, y: 52, width: 620, height: 112 }, list: { x: 36, y: 282, width: 948, height: 690 },
  cities: { x: 394, y: 1237, width: 642, height: 91 }, phone: { x: 620, y: 1338, width: 416, height: 76 },
};
const money = (v: string) => `${v} руб.`;

export default function App() {
  const [section, setSection] = useState<Section>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [products, setProducts] = useLocalStorage<Product[]>('turkey-products-v2', defaultProducts);
  const [delivery, setDelivery] = useLocalStorage<DeliverySettings>('turkey-delivery-v2', defaultDelivery);
  const [history, setHistory] = useLocalStorage<PriceHistoryEntry[]>('turkey-history-v2', []);
  const [promotions, setPromotions] = useLocalStorage<Promotion[]>('turkey-promotions-v2', defaultPromotions);
  const [generatorSettings, setGeneratorSettings] = useLocalStorage<GeneratorSettings>('turkey-generator-v2', defaultGenerator);
  const [generatorCategory, setGeneratorCategory] = useState<ProductCategory>('raw');
  const [toast, setToast] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [cloudState, setCloudState] = useState<'local' | 'saving' | 'synced' | 'error'>('local');
  const stageRef = useRef<any>(null);
  const hydrated = useRef(false);

  const crmState: CrmState = { products, delivery, history, promotions, generatorSettings };
  const lowStock = useMemo(() => products.filter((p) => p.active && p.stock <= p.lowStockAt), [products]);
  const notify = (text: string) => { setToast(text); window.setTimeout(() => setToast(''), 2200); };

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !session || hydrated.current) return;
    supabase.from('crm_state').select('data').eq('user_id', session.user.id).maybeSingle().then(({ data, error }) => {
      if (error) { setCloudState('error'); return; }
      if (data?.data) {
        const saved = data.data as CrmState;
        setProducts(saved.products ?? defaultProducts); setDelivery(saved.delivery ?? defaultDelivery);
        setHistory(saved.history ?? []); setPromotions(saved.promotions ?? defaultPromotions);
        setGeneratorSettings(saved.generatorSettings ?? defaultGenerator);
      }
      hydrated.current = true; setCloudState('synced');
    });
  }, [session]);

  useEffect(() => {
    const client = supabase;
    if (!client || !session || !hydrated.current) return;
    setCloudState('saving');
    const timer = window.setTimeout(async () => {
      const { error } = await client.from('crm_state').upsert({ user_id: session.user.id, data: crmState, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      setCloudState(error ? 'error' : 'synced');
    }, 700);
    return () => window.clearTimeout(timer);
  }, [products, delivery, history, promotions, generatorSettings, session]);

  const updateProduct = (id: string, patch: Partial<Product>) => setProducts((items) => items.map((p) => {
    if (p.id !== id) return p;
    if (patch.price !== undefined && patch.price !== p.price) setHistory((h) => [{ id: crypto.randomUUID(), productId: p.id, productName: p.name, oldPrice: p.price, newPrice: patch.price!, changedAt: new Date().toISOString() }, ...h].slice(0, 500));
    return { ...p, ...patch };
  }));
  const addProduct = (category: ProductCategory) => setProducts((p) => [...p, { id: crypto.randomUUID(), name: 'Новый товар', price: '0', unit: '1 кг', category, stock: 0, lowStockAt: 2, active: true }]);
  const exportImage = () => {
    const stage = stageRef.current; if (!stage) return;
    const uri = stage.toDataURL({ pixelRatio: 2 / (stage.scaleX?.() || 1) });
    const a = document.createElement('a'); a.href = uri; a.download = `цены-индейка-${generatorCategory}-${new Date().toISOString().slice(0, 10)}.png`; a.click(); notify('PNG сохранён');
  };
  const pageTitle = nav.find((n) => n.id === section)?.label ?? 'Главная';

  return <div className="shell">
    <aside className={menuOpen ? 'sidebar open' : 'sidebar'}>
      <div className="brand"><span className="brand-mark">🦃</span><div><strong>Индейка</strong><small>семейная CRM</small></div></div>
      <button className="mobile-close" onClick={() => setMenuOpen(false)}><X /></button>
      <nav>{nav.map(({ id, label, icon: Icon }) => <button key={id} className={section === id ? 'nav-item active' : 'nav-item'} onClick={() => { setSection(id); setMenuOpen(false); }}><Icon size={20} /><span>{label}</span><ChevronRight size={16} /></button>)}</nav>
      <div className="sidebar-note"><Cloud size={18} /><span>{supabaseEnabled ? (session ? 'Облачная синхронизация включена.' : 'Войдите, чтобы синхронизировать данные.') : 'Сейчас данные сохраняются на этом устройстве.'}</span></div>
    </aside>
    <main>
      <header className="topbar"><button className="menu-button" onClick={() => setMenuOpen(true)}><Menu /></button><div><p>Домашнее хозяйство</p><h1>{pageTitle}</h1></div><div className={`status ${cloudState}`}><span />{cloudState === 'saving' ? 'Сохраняем…' : cloudState === 'synced' ? 'Синхронизировано' : cloudState === 'error' ? 'Ошибка облака' : 'Данные сохранены'}</div></header>
      <div className="content">
        {section === 'dashboard' && <Dashboard products={products} lowStock={lowStock} history={history} promotions={promotions} onGo={setSection} />}
        {section === 'prices' && <Prices products={products} updateProduct={updateProduct} addProduct={addProduct} />}
        {section === 'delivery' && <Delivery delivery={delivery} setDelivery={setDelivery} notify={notify} />}
        {section === 'generator' && <Generator products={products} delivery={delivery} category={generatorCategory} setCategory={setGeneratorCategory} settings={generatorSettings} setSettings={setGeneratorSettings} stageRef={stageRef} exportImage={exportImage} onPrices={() => setSection('prices')} />}
        {section === 'history' && <History history={history} />}
        {section === 'analytics' && <Analytics products={products} history={history} />}
        {section === 'stock' && <Stock products={products} updateProduct={updateProduct} />}
        {section === 'promotions' && <Promotions promotions={promotions} setPromotions={setPromotions} />}
        {section === 'settings' && <SettingsPage session={session} notify={notify} />}
      </div>
    </main>
    {toast && <div className="toast">{toast}</div>}{menuOpen && <div className="backdrop" onClick={() => setMenuOpen(false)} />}
  </div>;
}

function Generator({ products, delivery, category, setCategory, settings, setSettings, stageRef, exportImage, onPrices }: any) {
  const reset = () => setSettings(defaultGenerator);
  return <section className="generator-layout"><div className="card generator-controls"><span className="eyebrow">Редактор</span><h2>Создать прайс</h2><div className="segmented"><button className={category === 'raw' ? 'selected' : ''} onClick={() => setCategory('raw')}>Сырая</button><button className={category === 'ready' ? 'selected' : ''} onClick={() => setCategory('ready')}>Готовая</button></div><p className="hint">На холсте можно двигать и растягивать заголовок, белый блок, города и телефон.</p><button className="primary wide" onClick={exportImage}><Download size={18} /> Скачать PNG</button><button className="secondary wide" onClick={onPrices}>Изменить цены</button><details className="design-settings" open><summary>Оформление</summary><div className="settings-grid"><label>Цвет плашек<input type="color" value={settings.plateColor} onChange={(e) => setSettings({ ...settings, plateColor: e.target.value })} /></label><label>Стиль текста<select value={settings.textStyle} onChange={(e) => setSettings({ ...settings, textStyle: e.target.value })}><option value="italic">Наклонный жирный</option><option value="normal">Прямой жирный</option></select></label></div><label className="range-label"><span>Размер текста <b>{settings.fontScale}%</b></span><input type="range" min="65" max="112" value={settings.fontScale} onChange={(e) => setSettings({ ...settings, fontScale: Number(e.target.value) })} /></label><label className="background-picker"><span>Собственный фон</span><input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setSettings({ ...settings, backgroundImage: String(reader.result) }); reader.readAsDataURL(file); }} /><em>Выбрать фотографию</em></label><button className="secondary wide" onClick={reset}>Сбросить расположение</button></details></div><div className="card preview-card"><GeneratorCanvas stageRef={stageRef} products={products} delivery={delivery} category={category} settings={settings} onSettingsChange={setSettings} /></div></section>;
}

function Dashboard({ products, lowStock, history, promotions, onGo }: any) { const active = products.filter((p: Product) => p.active).length; return <><section className="hero"><div><span className="eyebrow light">Панель управления</span><h2>Всё хозяйство в одном месте</h2><p>Обновляйте цены, контролируйте остатки и создавайте готовые прайсы.</p></div><button className="hero-button" onClick={() => onGo('generator')}><Camera size={20} /> Создать картинку</button></section><section className="stats-grid"><Stat label="Товаров" value={active} note="активных позиций" icon="📦"/><Stat label="Мало на складе" value={lowStock.length} note="требуют внимания" icon="⚠️"/><Stat label="Изменений" value={history.length} note="в истории цен" icon="📈"/><Stat label="Акций" value={promotions.filter((p: Promotion) => p.active).length} note="сейчас активны" icon="🎁"/></section><section className="two-col"><div className="card"><div className="section-head"><div><span className="eyebrow">Контроль</span><h2>Низкие остатки</h2></div></div>{lowStock.slice(0,6).map((p: Product) => <div className="alert-row" key={p.id}><div><strong>{p.name}</strong><span>{money(p.price)}</span></div><b>{p.stock}</b></div>)}</div><div className="card"><div className="section-head"><div><span className="eyebrow">Последнее</span><h2>Изменения цен</h2></div></div>{history.slice(0,6).map((h: PriceHistoryEntry) => <div className="change-row" key={h.id}><div><strong>{h.productName}</strong><span>{new Date(h.changedAt).toLocaleString('ru-RU')}</span></div><p><s>{h.oldPrice}</s> → <b>{h.newPrice}</b></p></div>)}</div></section></>; }
function Stat({ label, value, note, icon }: any) { return <div className="stat card"><span className="stat-icon">{icon}</span><div><p>{label}</p><strong>{value}</strong><small>{note}</small></div></div>; }
function Prices({ products, updateProduct, addProduct }: any) { return <div className="stack">{(['raw','ready'] as const).map((category) => <section className="card" key={category}><div className="section-head"><div><span className="eyebrow">Категория</span><h2>{category === 'raw' ? 'Сырая продукция' : 'Готовая продукция'}</h2></div><button className="secondary" onClick={() => addProduct(category)}><Plus size={17}/> Добавить</button></div><div className="table-wrap"><table><thead><tr><th>Вкл.</th><th>Название</th><th>Цена</th><th>Единица</th></tr></thead><tbody>{products.filter((p: Product) => p.category === category).map((p: Product) => <tr key={p.id}><td><input type="checkbox" checked={p.active} onChange={(e) => updateProduct(p.id,{active:e.target.checked})}/></td><td><input value={p.name} onChange={(e)=>updateProduct(p.id,{name:e.target.value})}/></td><td><input className="price-input" value={p.price} onChange={(e)=>updateProduct(p.id,{price:e.target.value})}/></td><td><input value={p.unit} onChange={(e)=>updateProduct(p.id,{unit:e.target.value})}/></td></tr>)}</tbody></table></div></section>)}</div>; }
function Delivery({ delivery, setDelivery, notify }: any) { return <section className="card form-card"><span className="eyebrow">Контакты</span><h2>Доставка</h2>{[['Города','cities'],['Телефон','phone'],['Доплата за доставку','deliverySurcharge']].map(([label,key])=><label key={key}>{label}<input value={delivery[key]} onChange={(e)=>setDelivery({...delivery,[key]:e.target.value})}/></label>)}<label>Описание<textarea rows={5} value={delivery.details} onChange={(e)=>setDelivery({...delivery,details:e.target.value})}/></label><button className="primary" onClick={()=>notify('Сохранено')}><Save size={18}/> Сохранить</button></section>; }
function History({ history }: any) { return <section className="card"><span className="eyebrow">Архив</span><h2>История цен</h2>{history.map((h: PriceHistoryEntry)=><div className="history-item" key={h.id}><div><strong>{h.productName}</strong><span>{new Date(h.changedAt).toLocaleString('ru-RU')}</span></div><p><s>{money(h.oldPrice)}</s><b>{money(h.newPrice)}</b></p></div>)}</section>; }
function Analytics({ products, history }: any) { const raw=products.filter((p:Product)=>p.category==='raw').length, ready=products.length-raw, avg=(products.reduce((s:number,p:Product)=>s+(parseFloat(p.price.replace(',','.'))||0),0)/Math.max(products.length,1)).toFixed(1); return <div className="stack"><section className="stats-grid"><Stat label="Сырая продукция" value={raw} note="позиций" icon="🥩"/><Stat label="Готовая продукция" value={ready} note="позиций" icon="🍲"/><Stat label="Средняя цена" value={avg} note="рублей" icon="💰"/><Stat label="Правок цен" value={history.length} note="за всё время" icon="✏️"/></section><section className="card"><span className="eyebrow">Динамика</span><h2>Последние изменения</h2><div className="bars">{history.slice(0,12).reverse().map((h:PriceHistoryEntry)=><div className="bar-row" key={h.id}><span>{h.productName}</span><div><i style={{width:`${Math.min(100,(parseFloat(h.newPrice.replace(',','.'))||1)*2.2)}%`}}/></div><b>{h.newPrice}</b></div>)}</div></section></div>; }
function Stock({ products, updateProduct }: any) { return <section className="card"><span className="eyebrow">Склад</span><h2>Остатки</h2><div className="stock-grid">{products.map((p:Product)=><div className={p.stock<=p.lowStockAt?'stock-card low':'stock-card'} key={p.id}><strong>{p.name}</strong><span>{p.category==='raw'?'Сырая':'Готовая'}</span><label>Количество<input type="number" value={p.stock} onChange={(e)=>updateProduct(p.id,{stock:Number(e.target.value)})}/></label><label>Минимум<input type="number" value={p.lowStockAt} onChange={(e)=>updateProduct(p.id,{lowStockAt:Number(e.target.value)})}/></label></div>)}</div></section>; }
function Promotions({ promotions, setPromotions }: any) { const update=(id:string,patch:any)=>setPromotions((x:Promotion[])=>x.map(p=>p.id===id?{...p,...patch}:p)); return <section className="card"><div className="section-head"><div><span className="eyebrow">Маркетинг</span><h2>Акции</h2></div><button className="secondary" onClick={()=>setPromotions((p:Promotion[])=>[...p,{id:crypto.randomUUID(),title:'Новая акция',description:'',active:false}])}><Plus size={17}/> Добавить</button></div><div className="promo-grid">{promotions.map((p:Promotion)=><div className={p.active?'promo active':'promo'} key={p.id}><label className="switch-line"><span>Активна</span><input type="checkbox" checked={p.active} onChange={(e)=>update(p.id,{active:e.target.checked})}/></label><input value={p.title} onChange={(e)=>update(p.id,{title:e.target.value})}/><textarea rows={4} value={p.description} onChange={(e)=>update(p.id,{description:e.target.value})}/></div>)}</div></section>; }
function SettingsPage({ session, notify }: {session: Session|null; notify:(s:string)=>void}) { const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const signIn=async()=>{if(!supabase)return; const {error}=await supabase.auth.signInWithPassword({email,password}); error?notify(error.message):notify('Вход выполнен');}; const signOut=async()=>{await supabase?.auth.signOut(); notify('Вы вышли');}; return <section className="card form-card"><span className="eyebrow">Облако</span><h2>Синхронизация и вход</h2>{!supabaseEnabled?<div className="notice"><Cloud/><div><strong>Supabase ещё не подключён</strong><p>Добавьте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в Vercel. Инструкция и SQL лежат в проекте.</p></div></div>:session?<><div className="notice success"><Cloud/><div><strong>Вход выполнен</strong><p>{session.user.email}</p></div></div><button className="secondary" onClick={signOut}><LogOut size={18}/> Выйти</button></>:<><label>Email<input type="email" value={email} onChange={(e)=>setEmail(e.target.value)}/></label><label>Пароль<input type="password" value={password} onChange={(e)=>setPassword(e.target.value)}/></label><button className="primary" onClick={signIn}><LogIn size={18}/> Войти</button></>}</section>; }
