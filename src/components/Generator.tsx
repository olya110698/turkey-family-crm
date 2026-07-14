import { Download } from "lucide-react";
import { defaultGenerator } from "../data/defaults";
import type {
  DeliverySettings,
  GeneratorSettings,
  Product,
  ProductCategory,
} from "../types";
import { GeneratorCanvas } from "./GeneratorCanvas";

interface Props {
  products: Product[];
  delivery: DeliverySettings;
  category: ProductCategory;
  setCategory: (category: ProductCategory) => void;
  settings: GeneratorSettings;
  setSettings: (settings: GeneratorSettings) => void;
  stageRef: React.RefObject<any>;
  exportImage: () => void;
  onPrices: () => void;
}

export function Generator({
  products,
  delivery,
  category,
  setCategory,
  settings,
  setSettings,
  stageRef,
  exportImage,
  onPrices,
}: Props) {
  const reset = () => setSettings(defaultGenerator);
  return (
    <section className="generator-layout">
      <div className="card generator-controls">
        <span className="eyebrow">Редактор</span>
        <h2>Создать прайс</h2>
        <div className="segmented">
          <button
            className={category === "raw" ? "selected" : ""}
            onClick={() => setCategory("raw")}
          >
            Сырая
          </button>
          <button
            className={category === "ready" ? "selected" : ""}
            onClick={() => setCategory("ready")}
          >
            Готовая
          </button>
        </div>
        <p className="hint">
          На холсте можно двигать и растягивать заголовок, белый блок, города и
          телефон.
        </p>
        <button className="primary wide" onClick={exportImage}>
          <Download size={18} /> Скачать PNG
        </button>
        <button className="secondary wide" onClick={onPrices}>
          Изменить цены
        </button>
        <details className="design-settings" open>
          <summary>Оформление</summary>
          <div className="settings-grid">
            <label>
              Цвет плашек
              <input
                type="color"
                value={settings.plateColor}
                onChange={(e) =>
                  setSettings({ ...settings, plateColor: e.target.value })
                }
              />
            </label>
            <label>
              Стиль текста
              <select
                value={settings.textStyle}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    textStyle: e.target.value as GeneratorSettings["textStyle"],
                  })
                }
              >
                <option value="italic">Наклонный жирный</option>
                <option value="normal">Прямой жирный</option>
              </select>
            </label>
          </div>
          <label className="range-label">
            <span>
              Размер текста <b>{settings.fontScale}%</b>
            </span>
            <input
              type="range"
              min="65"
              max="112"
              value={settings.fontScale}
              onChange={(e) =>
                setSettings({ ...settings, fontScale: Number(e.target.value) })
              }
            />
          </label>
          <label className="background-picker">
            <span>Собственный фон</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () =>
                  setSettings({
                    ...settings,
                    backgroundImage: String(reader.result),
                  });
                reader.readAsDataURL(file);
              }}
            />
            <em>Выбрать фотографию</em>
          </label>
          <button className="secondary wide" onClick={reset}>
            Сбросить расположение
          </button>
        </details>
      </div>
      <div className="card preview-card">
        <GeneratorCanvas
          stageRef={stageRef}
          products={products}
          delivery={delivery}
          category={category}
          settings={settings}
          onSettingsChange={setSettings}
        />
      </div>
    </section>
  );
}
