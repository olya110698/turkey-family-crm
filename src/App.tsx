import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  BadgePercent,
  BarChart3,
  Camera,
  ChevronRight,
  ClipboardList,
  Cloud,
  LogIn,
  LogOut,
  Menu,
  Package,
  Plus,
  Settings,
  ShoppingBasket,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import {
  defaultDelivery,
  defaultGenerator,
  defaultProducts,
  defaultPromotions,
} from "./data/defaults";
import { useLocalStorage } from "./hooks";
import { supabase, supabaseEnabled } from "./lib-supabase";
import type {
  CrmState,
  DeliverySettings,
  GeneratorSettings,
  PriceHistoryEntry,
  Product,
  ProductCategory,
  Promotion,
} from "./types";
import { Dashboard } from "./components/Dashboard";
import { Delivery } from "./components/Delivery";
import { Generator } from "./components/Generator";
import { Prices } from "./components/Prices";
import { Stat } from "./components/Stat";
import { money } from "./utils";
import "./styles.css";

export type Section =
  | "dashboard"
  | "prices"
  | "delivery"
  | "generator"
  | "history"
  | "analytics"
  | "stock"
  | "promotions"
  | "settings";
const nav: {
  id: Section;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}[] = [
  { id: "dashboard", label: "Главная", icon: BarChart3 },
  { id: "prices", label: "Цены", icon: ShoppingBasket },
  { id: "delivery", label: "Доставка", icon: Truck },
  { id: "generator", label: "Генератор", icon: Camera },
  { id: "history", label: "История", icon: Archive },
  { id: "analytics", label: "Аналитика", icon: ClipboardList },
  { id: "stock", label: "Остатки", icon: Package },
  { id: "promotions", label: "Акции", icon: BadgePercent },
  { id: "settings", label: "Настройки", icon: Settings },
];

export default function App() {
  const [section, setSection] = useState<Section>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [products, setProducts] = useLocalStorage<Product[]>(
    "turkey-products-v2",
    defaultProducts,
  );
  const [delivery, setDelivery] = useLocalStorage<DeliverySettings>(
    "turkey-delivery-v2",
    defaultDelivery,
  );
  const [history, setHistory] = useLocalStorage<PriceHistoryEntry[]>(
    "turkey-history-v2",
    [],
  );
  const [promotions, setPromotions] = useLocalStorage<Promotion[]>(
    "turkey-promotions-v2",
    defaultPromotions,
  );
  const [generatorSettings, setGeneratorSettings] =
    useLocalStorage<GeneratorSettings>("turkey-generator-v2", defaultGenerator);
  const [generatorCategory, setGeneratorCategory] =
    useState<ProductCategory>("raw");
  const [toast, setToast] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [cloudState, setCloudState] = useState<
    "local" | "saving" | "synced" | "error"
  >("local");
  const stageRef = useRef<any>(null);
  const hydrated = useRef(false);

  const crmState: CrmState = {
    products,
    delivery,
    history,
    promotions,
    generatorSettings,
  };
  const lowStock = useMemo(
    () => products.filter((p) => p.active && p.stock <= p.lowStockAt),
    [products],
  );
  const notify = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(""), 2200);
  };

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) =>
      setSession(next),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !session || hydrated.current) return;
    supabase
      .from("crm_state")
      .select("data")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          setCloudState("error");
          return;
        }
        if (data?.data) {
          const saved = data.data as CrmState;
          setProducts(saved.products ?? defaultProducts);
          setDelivery(saved.delivery ?? defaultDelivery);
          setHistory(saved.history ?? []);
          setPromotions(saved.promotions ?? defaultPromotions);
          setGeneratorSettings(saved.generatorSettings ?? defaultGenerator);
        }
        hydrated.current = true;
        setCloudState("synced");
      });
  }, [session]);

  useEffect(() => {
    const client = supabase;
    if (!client || !session || !hydrated.current) return;
    setCloudState("saving");
    const timer = window.setTimeout(async () => {
      const { error } = await client.from("crm_state").upsert(
        {
          user_id: session.user.id,
          data: crmState,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      setCloudState(error ? "error" : "synced");
    }, 700);
    return () => window.clearTimeout(timer);
  }, [products, delivery, history, promotions, generatorSettings, session]);

  const updateProduct = (id: string, patch: Partial<Product>) =>
    setProducts((items) =>
      items.map((p) => {
        if (p.id !== id) return p;
        if (patch.price !== undefined && patch.price !== p.price)
          setHistory((h) =>
            [
              {
                id: crypto.randomUUID(),
                productId: p.id,
                productName: p.name,
                oldPrice: p.price,
                newPrice: patch.price!,
                changedAt: new Date().toISOString(),
              },
              ...h,
            ].slice(0, 500),
          );
        return { ...p, ...patch };
      }),
    );
  const addProduct = (category: ProductCategory) =>
    setProducts((p) => [
      ...p,
      {
        id: crypto.randomUUID(),
        name: "Новый товар",
        price: "0",
        unit: "1 кг",
        category,
        stock: 0,
        lowStockAt: 2,
        active: true,
      },
    ]);
  const deleteProduct = (id: string) => {
    const product = products.find((item) => item.id === id);

    if (!product) {
      return;
    }

    const confirmed = window.confirm(
      `Удалить товар «${product.name}»? Это действие нельзя отменить.`,
    );

    if (!confirmed) {
      return;
    }

    setProducts((items) => items.filter((item) => item.id !== id));

    setHistory((items) => items.filter((entry) => entry.productId !== id));

    notify("Товар удалён");
  };
  const exportImage = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const uri = stage.toDataURL({ pixelRatio: 2 / (stage.scaleX?.() || 1) });
    const a = document.createElement("a");
    a.href = uri;
    a.download = `цены-индейка-${generatorCategory}-${new Date().toISOString().slice(0, 10)}.png`;
    a.click();
    notify("PNG сохранён");
  };
  const pageTitle = nav.find((n) => n.id === section)?.label ?? "Главная";

  return (
    <div className="shell">
      <aside className={menuOpen ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <span className="brand-mark">🦃</span>
          <div>
            <strong>Индейка</strong>
            <small>семейная CRM</small>
          </div>
        </div>
        <button className="mobile-close" onClick={() => setMenuOpen(false)}>
          <X />
        </button>
        <nav>
          {nav.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={section === id ? "nav-item active" : "nav-item"}
              onClick={() => {
                setSection(id);
                setMenuOpen(false);
              }}
            >
              <Icon size={20} />
              <span>{label}</span>
              <ChevronRight size={16} />
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <Cloud size={18} />
          <span>
            {supabaseEnabled
              ? session
                ? "Облачная синхронизация включена."
                : "Войдите, чтобы синхронизировать данные."
              : "Сейчас данные сохраняются на этом устройстве."}
          </span>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <button className="menu-button" onClick={() => setMenuOpen(true)}>
            <Menu />
          </button>
          <div>
            <p>Домашнее хозяйство</p>
            <h1>{pageTitle}</h1>
          </div>
          <div className={`status ${cloudState}`}>
            <span />
            {cloudState === "saving"
              ? "Сохраняем…"
              : cloudState === "synced"
                ? "Синхронизировано"
                : cloudState === "error"
                  ? "Ошибка облака"
                  : "Данные сохранены"}
          </div>
        </header>
        <div className="content">
          {section === "dashboard" && (
            <Dashboard
              products={products}
              lowStock={lowStock}
              history={history}
              promotions={promotions}
              onGo={setSection}
            />
          )}
          {section === "prices" && (
            <Prices
              products={products}
              updateProduct={updateProduct}
              addProduct={addProduct}
              deleteProduct={deleteProduct}
            />
          )}
          {section === "delivery" && (
            <Delivery
              delivery={delivery}
              setDelivery={setDelivery}
              notify={notify}
            />
          )}
          {section === "generator" && (
            <Generator
              products={products}
              delivery={delivery}
              category={generatorCategory}
              setCategory={setGeneratorCategory}
              settings={generatorSettings}
              setSettings={setGeneratorSettings}
              stageRef={stageRef}
              exportImage={exportImage}
              onPrices={() => setSection("prices")}
            />
          )}
          {section === "history" && <History history={history} />}
          {section === "analytics" && (
            <Analytics products={products} history={history} />
          )}
          {section === "stock" && (
            <Stock products={products} updateProduct={updateProduct} />
          )}
          {section === "promotions" && (
            <Promotions promotions={promotions} setPromotions={setPromotions} />
          )}
          {section === "settings" && (
            <SettingsPage session={session} notify={notify} />
          )}
        </div>
      </main>
      {toast && <div className="toast">{toast}</div>}
      {menuOpen && (
        <div className="backdrop" onClick={() => setMenuOpen(false)} />
      )}
    </div>
  );
}

function History({ history }: any) {
  return (
    <section className="card">
      <span className="eyebrow">Архив</span>
      <h2>История цен</h2>
      {history.map((h: PriceHistoryEntry) => (
        <div className="history-item" key={h.id}>
          <div>
            <strong>{h.productName}</strong>
            <span>{new Date(h.changedAt).toLocaleString("ru-RU")}</span>
          </div>
          <p>
            <s>{money(h.oldPrice)}</s>
            <b>{money(h.newPrice)}</b>
          </p>
        </div>
      ))}
    </section>
  );
}
function Analytics({ products, history }: any) {
  const raw = products.filter((p: Product) => p.category === "raw").length,
    ready = products.length - raw,
    avg = (
      products.reduce(
        (s: number, p: Product) =>
          s + (parseFloat(p.price.replace(",", ".")) || 0),
        0,
      ) / Math.max(products.length, 1)
    ).toFixed(1);
  return (
    <div className="stack">
      <section className="stats-grid">
        <Stat label="Сырая продукция" value={raw} note="позиций" icon="🥩" />
        <Stat
          label="Готовая продукция"
          value={ready}
          note="позиций"
          icon="🍲"
        />
        <Stat label="Средняя цена" value={avg} note="рублей" icon="💰" />
        <Stat
          label="Правок цен"
          value={history.length}
          note="за всё время"
          icon="✏️"
        />
      </section>
      <section className="card">
        <span className="eyebrow">Динамика</span>
        <h2>Последние изменения</h2>
        <div className="bars">
          {history
            .slice(0, 12)
            .reverse()
            .map((h: PriceHistoryEntry) => (
              <div className="bar-row" key={h.id}>
                <span>{h.productName}</span>
                <div>
                  <i
                    style={{
                      width: `${Math.min(100, (parseFloat(h.newPrice.replace(",", ".")) || 1) * 2.2)}%`,
                    }}
                  />
                </div>
                <b>{h.newPrice}</b>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
function Stock({ products, updateProduct }: any) {
  return (
    <section className="card">
      <span className="eyebrow">Склад</span>
      <h2>Остатки</h2>
      <div className="stock-grid">
        {products.map((p: Product) => (
          <div
            className={
              p.stock <= p.lowStockAt ? "stock-card low" : "stock-card"
            }
            key={p.id}
          >
            <strong>{p.name}</strong>
            <span>{p.category === "raw" ? "Сырая" : "Готовая"}</span>
            <label>
              Количество
              <input
                type="number"
                value={p.stock}
                onChange={(e) =>
                  updateProduct(p.id, { stock: Number(e.target.value) })
                }
              />
            </label>
            <label>
              Минимум
              <input
                type="number"
                value={p.lowStockAt}
                onChange={(e) =>
                  updateProduct(p.id, { lowStockAt: Number(e.target.value) })
                }
              />
            </label>
          </div>
        ))}
      </div>
    </section>
  );
}
function Promotions({ promotions, setPromotions, addPromotion }: any) {
  const updatePromotion = (id: string, patch: Record<string, unknown>) => {
    setPromotions((items: any[]) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              ...patch,
            }
          : item,
      ),
    );
  };

  const deletePromotion = (id: string) => {
    const promotion = promotions.find((item: any) => item.id === id);

    if (!promotion) {
      return;
    }

    const confirmed = window.confirm(
      `Удалить акцию «${promotion.title || "Без названия"}»?`,
    );

    if (!confirmed) {
      return;
    }

    setPromotions((items: any[]) => items.filter((item) => item.id !== id));
  };

  return (
    <section className="card">
      <div className="section-head">
        <div>
          <span className="eyebrow">Маркетинг</span>

          <h2>Акции</h2>
        </div>

        <button type="button" className="secondary" onClick={addPromotion}>
          <Plus size={17} />
          Добавить
        </button>
      </div>

      <div className="promotion-grid">
        {promotions.map((promotion: any) => (
          <article className="promotion-card" key={promotion.id}>
            <div className="promotion-card-head">
              <label className="promotion-active">
                <span>Активна</span>

                <input
                  type="checkbox"
                  checked={promotion.active}
                  onChange={(event) =>
                    updatePromotion(promotion.id, {
                      active: event.target.checked,
                    })
                  }
                />
              </label>

              <button
                type="button"
                className="delete-icon-button"
                title={`Удалить акцию ${promotion.title}`}
                aria-label={`Удалить акцию ${promotion.title}`}
                onClick={() => deletePromotion(promotion.id)}
              >
                <Trash2 size={18} />
              </button>
            </div>

            <input
              value={promotion.title}
              placeholder="Название акции"
              onChange={(event) =>
                updatePromotion(promotion.id, {
                  title: event.target.value,
                })
              }
            />

            <textarea
              value={promotion.description}
              placeholder="Описание акции"
              onChange={(event) =>
                updatePromotion(promotion.id, {
                  description: event.target.value,
                })
              }
            />
          </article>
        ))}
      </div>

      {promotions.length === 0 && (
        <div className="empty-state">
          Акций пока нет. Нажмите «Добавить», чтобы создать первую.
        </div>
      )}
    </section>
  );
}
function SettingsPage({
  session,
  notify,
}: {
  session: Session | null;
  notify: (s: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const signIn = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    error ? notify(error.message) : notify("Вход выполнен");
  };
  const signOut = async () => {
    await supabase?.auth.signOut();
    notify("Вы вышли");
  };
  return (
    <section className="card form-card">
      <span className="eyebrow">Облако</span>
      <h2>Синхронизация и вход</h2>
      {!supabaseEnabled ? (
        <div className="notice">
          <Cloud />
          <div>
            <strong>Supabase ещё не подключён</strong>
            <p>
              Добавьте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в Vercel.
              Инструкция и SQL лежат в проекте.
            </p>
          </div>
        </div>
      ) : session ? (
        <>
          <div className="notice success">
            <Cloud />
            <div>
              <strong>Вход выполнен</strong>
              <p>{session.user.email}</p>
            </div>
          </div>
          <button className="secondary" onClick={signOut}>
            <LogOut size={18} /> Выйти
          </button>
        </>
      ) : (
        <>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Пароль
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button className="primary" onClick={signIn}>
            <LogIn size={18} /> Войти
          </button>
        </>
      )}
    </section>
  );
}
