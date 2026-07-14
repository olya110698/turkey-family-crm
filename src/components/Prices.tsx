import { Plus, Trash2 } from "lucide-react";
import type { Product, ProductCategory } from "../types";

interface Props {
  products: Product[];
  updateProduct: (id: string, patch: Partial<Product>) => void;
  addProduct: (category: ProductCategory) => void;
  deleteProduct: (id: string) => void;
}

export function Prices({
  products,
  updateProduct,
  addProduct,
  deleteProduct,
}: Props) {
  return (
    <div className="stack">
      {(["raw", "ready"] as const).map((category) => (
        <section className="card" key={category}>
          <div className="section-head">
            <div>
              <span className="eyebrow">Категория</span>

              <h2>
                {category === "raw" ? "Сырая продукция" : "Готовая продукция"}
              </h2>
            </div>

            <button className="secondary" onClick={() => addProduct(category)}>
              <Plus size={17} />
              Добавить
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Вкл.</th>
                  <th>Название</th>
                  <th>Цена</th>
                  <th>Единица</th>
                  <th className="actions-column">Действия</th>
                </tr>
              </thead>

              <tbody>
                {products
                  .filter((product) => product.category === category)
                  .map((product) => (
                    <tr key={product.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={product.active}
                          onChange={(event) =>
                            updateProduct(product.id, {
                              active: event.target.checked,
                            })
                          }
                        />
                      </td>

                      <td>
                        <input
                          value={product.name}
                          onChange={(event) =>
                            updateProduct(product.id, {
                              name: event.target.value,
                            })
                          }
                        />
                      </td>

                      <td>
                        <input
                          className="price-input"
                          value={product.price}
                          onChange={(event) =>
                            updateProduct(product.id, {
                              price: event.target.value,
                            })
                          }
                        />
                      </td>

                      <td>
                        <input
                          value={product.unit}
                          onChange={(event) =>
                            updateProduct(product.id, {
                              unit: event.target.value,
                            })
                          }
                        />
                      </td>

                      <td className="actions-cell">
                        <button
                          type="button"
                          className="delete-button"
                          title={`Удалить ${product.name}`}
                          aria-label={`Удалить ${product.name}`}
                          onClick={() => deleteProduct(product.id)}
                        >
                          <Trash2 size={18} />
                          <span>Удалить</span>
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
