import type { PriceHistoryEntry } from "../types";
import { money } from "../utils";

interface Props {
  history: PriceHistoryEntry[];
}

export function History({ history }: Props) {
  return (
    <section className="card">
      <span className="eyebrow">Архив</span>
      <h2>История цен</h2>
      {history.map((h) => (
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
