import type { Product } from "../types";

interface Props {
  products: Product[];
  updateProduct: (id: string, patch: Partial<Product>) => void;
}

export function Stock({ products, updateProduct }: Props) {
  return (
    <section className="card">
      <span className="eyebrow">Склад</span>
      <h2>Остатки</h2>
      <div className="stock-grid">
        {products.map((p) => (
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
