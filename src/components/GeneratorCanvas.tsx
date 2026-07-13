import { useEffect, useMemo, useRef, useState } from 'react';
import { Image as KonvaImage, Layer, Rect, Stage, Text } from 'react-konva';
import useImage from 'use-image';
import type { DeliverySettings, GeneratorSettings, Product } from '../types';

interface Props {
  products: Product[];
  delivery: DeliverySettings;
  category: 'raw' | 'ready';
  stageRef: React.RefObject<any>;
  settings: GeneratorSettings;
}

const WIDTH = 1080;
const HEIGHT = 1440;
const CONTENT_X = 70;
const CONTENT_WIDTH = 875;

function estimateLines(text: string, fontSize: number, width: number) {
  const approximateCharWidth = fontSize * 0.54;
  const charsPerLine = Math.max(12, Math.floor(width / approximateCharWidth));
  const words = text.split(/\s+/);
  let lines = 1;
  let current = 0;
  for (const word of words) {
    const next = current ? current + 1 + word.length : word.length;
    if (next > charsPerLine) {
      lines += 1;
      current = word.length;
    } else {
      current = next;
    }
  }
  return lines;
}

export function GeneratorCanvas({ products, delivery, category, stageRef, settings }: Props) {
  const [image] = useImage(settings.backgroundImage || '/assets/turkey-bg.jpg', 'anonymous');
  const active = useMemo(() => products.filter((p) => p.category === category && p.active), [products, category]);
  const title = category === 'raw' ? 'Сырая продукция (цены за 1 кг):' : 'Готовая продукция:';
  const baseFontSize = Math.round(40 * settings.fontScale / 100);
  const titleFontSize = Math.round(46 * settings.fontScale / 100);
  const lineGap = Math.max(10, Math.round(14 * settings.fontScale / 100));
  const fontStyle = settings.textStyle === 'italic' ? 'bold italic' : 'bold';
  const [scale, setScale] = useState(0.52);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const rows = useMemo(() => {
    let y = settings.listY + 72;
    return active.map((item) => {
      const text = `📍 ${item.name} — ${item.price} руб. (${item.unit})`;
      const lines = estimateLines(text, baseFontSize, CONTENT_WIDTH);
      const height = Math.ceil(lines * baseFontSize * 1.16);
      const row = { item, text, y, height };
      y += height + lineGap;
      return row;
    });
  }, [active, baseFontSize, lineGap, settings.listY]);

  const contentBottom = rows.length ? rows[rows.length - 1].y + rows[rows.length - 1].height : settings.listY + 95;
  const maxBottom = 1205;
  const overflow = Math.max(0, contentBottom - maxBottom);
  const adjustedY = settings.listY - overflow;
  const panelHeight = Math.min(885, Math.max(145, contentBottom - settings.listY + 40));

  useEffect(() => {
    const resize = () => {
      if (!wrapperRef.current) return;
      setScale(Math.min(wrapperRef.current.clientWidth / WIDTH, 0.72));
    };
    resize();
    const observer = new ResizeObserver(resize);
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="canvas-wrap" ref={wrapperRef}>
      <Stage ref={stageRef} width={WIDTH * scale} height={HEIGHT * scale} scaleX={scale} scaleY={scale}>
        <Layer>
          <KonvaImage image={image} width={WIDTH} height={HEIGHT} />
          <Rect x={230} y={45} width={620} height={115} fill={settings.plateColor} cornerRadius={25} />
          <Text x={270} y={72} width={540} text="Цены индейка 🦃" fontSize={53} fontStyle="bold italic" fill="white" align="center" />

          <Rect x={35} y={adjustedY - 20} width={950} height={panelHeight} fill="white" opacity={0.96} cornerRadius={20} />
          <Text x={CONTENT_X} y={adjustedY} width={CONTENT_WIDTH} text={title} fontSize={titleFontSize} fontStyle={fontStyle} fill="#111" wrap="word" />

          {rows.map(({ item, text, y, height }) => (
            <Text
              key={item.id}
              x={78}
              y={y - overflow}
              width={865}
              height={height + 4}
              text={text}
              fontSize={baseFontSize}
              fontStyle={fontStyle}
              fill="#111"
              lineHeight={1.16}
              wrap="word"
            />
          ))}

          <Rect x={395} y={1235} width={640} height={92} fill={settings.plateColor} cornerRadius={20} />
          <Text x={425} y={1255} width={580} text={delivery.cities} fontSize={39} fontStyle="bold italic" fill="white" align="center" wrap="word" />
          <Rect x={620} y={1337} width={415} height={78} fill={settings.plateColor} cornerRadius={18} />
          <Text x={650} y={1352} width={355} text={delivery.phone} fontSize={39} fontStyle="bold italic" fill="white" align="center" />
        </Layer>
      </Stage>
    </div>
  );
}
