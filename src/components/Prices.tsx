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
    <div className="stack prices-page">
      {(["raw", "ready"] as const).map((category) => {
        const categoryProducts = products.filter(
          (product) => product.category === category,
        );

        return (
          <section
            className="card prices-category"
            key={category}
          >
            <div className="section-head prices-section-head">
              <div>
                <span className="eyebrow">
                  Категория
                </span>

                <h2>
                  {category === "raw"
                    ? "Сырая продукция"
                    : "Готовая продукция"}
                </h2>
              </div>

              <button
                type="button"
                className="secondary prices-add-button"
                onClick={() => addProduct(category)}
              >
                <Plus size={17} />
                Добавить
              </button>
            </div>

            <div className="table-wrap prices-table-wrap">
              <table className="prices-table">
                <thead>
                  <tr>
                    <th>Вкл.</th>
                    <th>Название</th>
                    <th>Цена</th>
                    <th>Единица</th>
                    <th className="actions-column">
                      Действия
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {categoryProducts.map((product) => (
                    <tr
                      className="price-product-row"
                      key={product.id}
                    >
                      <td
                        className="price-active-cell"
                        data-label="Показывать"
                      >
                        <label className="price-active-control">
                          <span className="price-mobile-label">
                            Показывать в прайсе
                          </span>

                          <input
                            type="checkbox"
                            checked={product.active}
                            onChange={(event) =>
                              updateProduct(product.id, {
                                active: event.target.checked,
                              })
                            }
                          />
                        </label>
                      </td>

                      <td data-label="Название">
                        <label className="price-mobile-field">
                          <span className="price-mobile-label">
                            Название
                          </span>

                          <input
                            value={product.name}
                            aria-label="Название товара"
                            onChange={(event) =>
                              updateProduct(product.id, {
                                name: event.target.value,
                              })
                            }
                          />
                        </label>
                      </td>

                      <td data-label="Цена">
                        <label className="price-mobile-field">
                          <span className="price-mobile-label">
                            Цена
                          </span>

                          <input
                            className="price-input"
                            value={product.price}
                            inputMode="decimal"
                            aria-label="Цена товара"
                            onChange={(event) =>
                              updateProduct(product.id, {
                                price: event.target.value,
                              })
                            }
                          />
                        </label>
                      </td>

                      <td data-label="Единица">
                        <label className="price-mobile-field">
                          <span className="price-mobile-label">
                            Единица
                          </span>

                          <input
                            value={product.unit}
                            aria-label="Единица измерения"
                            onChange={(event) =>
                              updateProduct(product.id, {
                                unit: event.target.value,
                              })
                            }
                          />
                        </label>
                      </td>

                      <td className="actions-cell">
                        <button
                          type="button"
                          className="delete-button price-delete-button"
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

            {categoryProducts.length === 0 && (
              <div className="empty-state">
                В этой категории пока нет товаров.
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}