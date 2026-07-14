import { Camera } from "lucide-react";
import type { Section } from "../App";
import type { PriceHistoryEntry, Product, Promotion } from "../types";
import { money } from "../utils";
import { Stat } from "./Stat";

interface Props {
  products: Product[];
  lowStock: Product[];
  history: PriceHistoryEntry[];
  promotions: Promotion[];
  onGo: (section: Section) => void;
}

export function Dashboard({
  products,
  lowStock,
  history,
  promotions,
  onGo,
}: Props) {
  const active = products.filter((p) => p.active).length;
  return (
    <>
      <section className="hero">
        <div>
          <span className="eyebrow light">Панель управления</span>
          <h2>Всё хозяйство в одном месте</h2>
          <p>
            Обновляйте цены, контролируйте остатки и создавайте готовые прайсы.
          </p>
        </div>
        <button className="hero-button" onClick={() => onGo("generator")}>
          <Camera size={20} /> Создать картинку
        </button>
      </section>
      <section className="stats-grid">
        <Stat
          label="Товаров"
          value={active}
          note="активных позиций"
          icon="📦"
        />
        <Stat
          label="Мало на складе"
          value={lowStock.length}
          note="требуют внимания"
          icon="⚠️"
        />
        <Stat
          label="Изменений"
          value={history.length}
          note="в истории цен"
          icon="📈"
        />
        <Stat
          label="Акций"
          value={promotions.filter((p) => p.active).length}
          note="сейчас активны"
          icon="🎁"
        />
      </section>
      <section className="two-col">
        <div className="card">
          <div className="section-head">
            <div>
              <span className="eyebrow">Контроль</span>
              <h2>Низкие остатки</h2>
            </div>
          </div>
          {lowStock.slice(0, 6).map((p) => (
            <div className="alert-row" key={p.id}>
              <div>
                <strong>{p.name}</strong>
                <span>{money(p.price)}</span>
              </div>
              <b>{p.stock}</b>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="section-head">
            <div>
              <span className="eyebrow">Последнее</span>
              <h2>Изменения цен</h2>
            </div>
          </div>
          {history.slice(0, 6).map((h) => (
            <div className="change-row" key={h.id}>
              <div>
                <strong>{h.productName}</strong>
                <span>{new Date(h.changedAt).toLocaleString("ru-RU")}</span>
              </div>
              <p>
                <s>{h.oldPrice}</s> → <b>{h.newPrice}</b>
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
