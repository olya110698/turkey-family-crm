import type { PriceHistoryEntry, Product } from "../types";
import { Stat } from "./Stat";

interface Props {
  products: Product[];
  history: PriceHistoryEntry[];
}

export function Analytics({ products, history }: Props) {
  const raw = products.filter((p) => p.category === "raw").length;
  const ready = products.length - raw;
  const avg = (
    products.reduce(
      (s, p) => s + (parseFloat(p.price.replace(",", ".")) || 0),
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
            .map((h) => (
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
