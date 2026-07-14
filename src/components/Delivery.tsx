import { Save } from "lucide-react";
import type { DeliverySettings } from "../types";

interface Props {
  delivery: DeliverySettings;
  setDelivery: (delivery: DeliverySettings) => void;
  notify: (text: string) => void;
}

const fields: [string, keyof Omit<DeliverySettings, "details">][] = [
  ["Города", "cities"],
  ["Телефон", "phone"],
  ["Доплата за доставку", "deliverySurcharge"],
];

export function Delivery({ delivery, setDelivery, notify }: Props) {
  return (
    <section className="card form-card">
      <span className="eyebrow">Контакты</span>
      <h2>Доставка</h2>
      {fields.map(([label, key]) => (
        <label key={key}>
          {label}
          <input
            value={delivery[key]}
            onChange={(e) =>
              setDelivery({ ...delivery, [key]: e.target.value })
            }
          />
        </label>
      ))}
      <label>
        Описание
        <textarea
          rows={5}
          value={delivery.details}
          onChange={(e) =>
            setDelivery({ ...delivery, details: e.target.value })
          }
        />
      </label>
      <button className="primary" onClick={() => notify("Сохранено")}>
        <Save size={18} /> Сохранить
      </button>
    </section>
  );
}
