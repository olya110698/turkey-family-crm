import { Plus, Trash2 } from "lucide-react";
import type { Promotion } from "../types";

interface Props {
  promotions: Promotion[];
  setPromotions: (
    updater: Promotion[] | ((items: Promotion[]) => Promotion[]),
  ) => void;
  addPromotion: () => void;
}

export function Promotions({ promotions, setPromotions, addPromotion }: Props) {
  const updatePromotion = (id: string, patch: Partial<Promotion>) => {
    setPromotions((items) =>
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
    const promotion = promotions.find((item) => item.id === id);

    if (!promotion) {
      return;
    }

    const confirmed = window.confirm(
      `Удалить акцию «${promotion.title || "Без названия"}»?`,
    );

    if (!confirmed) {
      return;
    }

    setPromotions((items) => items.filter((item) => item.id !== id));
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
        {promotions.map((promotion) => (
          <article className="promotion-card" key={promotion.id}>
            <div className="promotion-card-head">
              <label className="promotion-active">
                <span>{promotion.active ? "Активна" : "Неактивна"}</span>

                <input
                  className="promotion-switch-input"
                  type="checkbox"
                  checked={promotion.active}
                  onChange={(event) =>
                    updatePromotion(promotion.id, {
                      active: event.target.checked,
                    })
                  }
                />

                <span className="promotion-switch" aria-hidden="true">
                  <span className="promotion-switch-thumb" />
                </span>
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
