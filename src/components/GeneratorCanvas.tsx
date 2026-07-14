import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Circle,
  Group,
  Image as KonvaImage,
  Layer,
  Line,
  Rect,
  Stage,
  Text,
  Transformer,
} from 'react-konva';
import useImage from 'use-image';
import type {
  CanvasElementSettings,
  DeliverySettings,
  GeneratorSettings,
  Product,
} from '../types';

interface Props {
  products: Product[];
  delivery: DeliverySettings;
  category: 'raw' | 'ready';
  stageRef: React.RefObject<any>;
  settings: GeneratorSettings;
  onSettingsChange: (settings: GeneratorSettings) => void;
}

type ElementKey = 'title' | 'list' | 'cities' | 'phone';

const WIDTH = 1080;
const HEIGHT = 1440;

function estimateLines(text: string, fontSize: number, width: number) {
  const charsPerLine = Math.max(
    10,
    Math.floor(width / (fontSize * 0.52)),
  );

  const words = text.split(/\s+/);

  let lines = 1;
  let current = 0;

  for (const word of words) {
    const next = current
      ? current + word.length + 1
      : word.length;

    if (next > charsPerLine) {
      lines += 1;
      current = word.length;
    } else {
      current = next;
    }
  }

  return lines;
}

function Selection({
  selected,
  nodeRef,
}: {
  selected: boolean;
  nodeRef: React.RefObject<any>;
}) {
  const transformer = useRef<any>(null);

  useEffect(() => {
    if (
      selected
      && transformer.current
      && nodeRef.current
    ) {
      transformer.current.nodes([nodeRef.current]);
      transformer.current.getLayer()?.batchDraw();
    }
  }, [selected, nodeRef]);

  if (!selected) {
    return null;
  }

  return (
    <Transformer
      ref={transformer}
      rotateEnabled={false}
      flipEnabled={false}
      boundBoxFunc={(oldBox: any, box: any) => {
        if (box.width < 120 || box.height < 50) {
          return oldBox;
        }

        return box;
      }}
    />
  );
}

export function GeneratorCanvas({
  products,
  delivery,
  category,
  stageRef,
  settings,
  onSettingsChange,
}: Props) {
  const [image] = useImage(
    settings.backgroundImage || '/assets/turkey-bg.jpg',
    'anonymous',
  );

  const [scale, setScale] = useState(1);
  const [isScaleReady, setIsScaleReady] = useState(false);
  const [selected, setSelected] = useState<ElementKey | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);

  const refs = {
    title: useRef<any>(null),
    list: useRef<any>(null),
    cities: useRef<any>(null),
    phone: useRef<any>(null),
  };

  const active = useMemo(
    () => products.filter(
      (product) => (
        product.category === category
        && product.active
      ),
    ),
    [products, category],
  );

  const titleText = category === 'raw'
    ? 'Сырая продукция:'
    : 'Готовая продукция:';

  const fontSize = Math.round(
    37 * settings.fontScale / 100,
  );

  const titleFontSize = Math.round(
    44 * settings.fontScale / 100,
  );

  const fontStyle = settings.textStyle === 'italic'
    ? 'bold italic'
    : 'bold';

  const rows = useMemo(() => {
    let y = 72;

    return active.map((item) => {
      const text = `${item.name} — ${item.price} руб. (${item.unit})`;

      const lines = estimateLines(
        text,
        fontSize,
        settings.list.width - 94,
      );

      const height = Math.max(
        48,
        Math.ceil(lines * fontSize * 1.14),
      );

      const row = {
        item,
        text,
        y,
        height,
      };

      y += height + 9;

      return row;
    });
  }, [
    active,
    fontSize,
    settings.list.width,
  ]);

  const listContentHeight = useMemo(() => {
    if (rows.length === 0) {
      return 130;
    }

    const lastRow = rows[rows.length - 1];

    // Нижняя координата последней строки + нижний внутренний отступ.
    return lastRow.y + lastRow.height + 28;
  }, [rows]);

  const patchElement = (
    key: ElementKey,
    patch: Partial<CanvasElementSettings>,
  ) => {
    onSettingsChange({
      ...settings,
      [key]: {
        ...settings[key],
        ...patch,
      },
    });
  };

  const bind = (key: ElementKey) => ({
    draggable: true,

    onClick: () => setSelected(key),
    onTap: () => setSelected(key),

    onDragEnd: (event: any) => {
      patchElement(key, {
        x: event.target.x(),
        y: event.target.y(),
      });
    },

    onTransformEnd: () => {
      const node = refs[key].current;

      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      const width = Math.max(
        120,
        node.width() * scaleX,
      );

      const height = Math.max(
        50,
        node.height() * scaleY,
      );

      node.scaleX(1);
      node.scaleY(1);

      if (key === 'list') {
        patchElement(key, {
          x: node.x(),
          y: node.y(),
          width,
          height: listContentHeight,
        });

        return;
      }

      patchElement(key, {
        x: node.x(),
        y: node.y(),
        width,
        height,
      });
    },
  });

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;

    if (!wrapper) {
      return;
    }

    /*
    * Измеряем родительскую preview-card, а не сам canvas-wrap.
    * Размер Stage больше не сможет влиять на измеряемую ширину.
    */
    const sizeSource = wrapper.parentElement;

    if (!sizeSource) {
      return;
    }

    let animationFrame = 0;

    const resize = () => {
      cancelAnimationFrame(animationFrame);

      animationFrame = requestAnimationFrame(() => {
        const parentRect = sizeSource.getBoundingClientRect();
        const wrapperStyles = window.getComputedStyle(wrapper);

        const horizontalPadding =
          Number.parseFloat(wrapperStyles.paddingLeft || "0")
          + Number.parseFloat(wrapperStyles.paddingRight || "0");

        /*
        * На мобильном visualViewport точнее window.innerWidth,
        * особенно при масштабировании браузера.
        */
        const viewportWidth =
          window.visualViewport?.width
          ?? document.documentElement.clientWidth
          ?? window.innerWidth;

        /*
        * Не позволяем Canvas быть шире ни карточки,
        * ни фактической ширины экрана.
        */
        const availableWidth = Math.max(
          1,
          Math.min(parentRect.width, viewportWidth) - horizontalPadding,
        );

        const nextScale = Math.min(
          availableWidth / WIDTH,
          0.75,
        );

        setScale((currentScale) => {
          /*
          * Защита от бесконечных микроскопических обновлений
          * из-за дробных пикселей браузера.
          */
          if (Math.abs(currentScale - nextScale) < 0.001) {
            return currentScale;
          }

          return nextScale;
        });

        setIsScaleReady(true);
      });
    };

    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(sizeSource);

    window.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();

      window.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("resize", resize);
    };
  }, []);

  return (
  <div
    className={`canvas-wrap ${isScaleReady ? "canvas-ready" : ""}`}
    ref={wrapperRef}
  >
    <div className="canvas-tip">
      Нажмите на блок, затем двигайте или растягивайте за маркеры
    </div>

    <div
      className="canvas-stage-container"
      style={{
        width: WIDTH * scale,
        height: HEIGHT * scale,
      }}
    >
      <Stage
        ref={stageRef}
        width={WIDTH * scale}
        height={HEIGHT * scale}
        scaleX={scale}
        scaleY={scale}
        onMouseDown={(event: any) => {
          if (event.target === event.target.getStage()) {
            setSelected(null);
          }
        }}
        onTouchStart={(event: any) => {
          if (event.target === event.target.getStage()) {
            setSelected(null);
          }
        }}
      >
        <Layer>
          <KonvaImage
            image={image}
            width={WIDTH}
            height={HEIGHT}
          />

          {/* Main title */}
          <Group
            ref={refs.title}
            x={settings.title.x}
            y={settings.title.y}
            width={settings.title.width}
            height={settings.title.height}
            {...bind('title')}
          >
            <Rect
              width={settings.title.width}
              height={settings.title.height}
              fill={settings.plateColor}
              cornerRadius={26}
            />

            <Text
              x={24}
              y={0}
              width={settings.title.width - 48}
              height={settings.title.height}
              text="Цены индейка 🦃"
              fontFamily="Arial"
              fontSize={51}
              fontStyle="bold italic"
              fill="white"
              align="center"
              verticalAlign="middle"
              wrap="none"
            />
          </Group>

          <Selection
            selected={selected === 'title'}
            nodeRef={refs.title}
          />

          {/* Product list */}
          <Group
            ref={refs.list}
            x={settings.list.x}
            y={settings.list.y}
            width={settings.list.width}
            height={listContentHeight}
            {...bind('list')}
          >
            <Rect
              width={settings.list.width}
              height={listContentHeight}
              fill="white"
              opacity={0.96}
              cornerRadius={18}
            />

            <Text
              x={30}
              y={22}
              width={settings.list.width - 60}
              text={titleText}
              fontFamily="Arial"
              fontSize={titleFontSize}
              fontStyle={fontStyle}
              fill="#111"
            />

            {rows.map(({
              item,
              text,
              y,
              height,
            }) => {
              /*
              * Пин привязывается к верхней части первой строки,
              * а не к математическому центру lineHeight.
              */
              const pinX = 38;
              const pinRadius = 7;

              // Верх кружка будет примерно на одной линии с верхом букв.
              const pinCenterY = 13;

              // Ножка всегда одинаковая и не зависит от количества строк.
              const pinStemStartY = pinCenterY + pinRadius - 1;
              const pinStemEndY = pinStemStartY + 25;

              return (
                <Group
                  key={item.id}
                  y={y}
                >
                  <Line
                    points={[
                      pinX,
                      pinStemStartY,
                      pinX,
                      pinStemEndY,
                    ]}
                    stroke="#8c8c8c"
                    strokeWidth={3}
                    lineCap="round"
                  />

                  <Circle
                    x={pinX}
                    y={pinCenterY}
                    radius={pinRadius}
                    fill="#e53935"
                    shadowColor="rgba(90, 0, 0, 0.4)"
                    shadowBlur={3}
                    shadowOffsetY={1}
                  />

                  <Circle
                    x={pinX - 2.5}
                    y={pinCenterY - 2.5}
                    radius={2}
                    fill="#ffd4d1"
                  />

                  <Text
                    x={68}
                    y={0}
                    width={settings.list.width - 94}
                    height={height}
                    text={text}
                    fontFamily="Arial"
                    fontSize={fontSize}
                    fontStyle={fontStyle}
                    fill="#111"
                    lineHeight={1.14}
                    wrap="word"
                    verticalAlign="top"
                  />
                </Group>
              );
            })}
          </Group>

          <Selection
            selected={selected === 'list'}
            nodeRef={refs.list}
          />

          {/* Cities */}
          <Group
            ref={refs.cities}
            x={settings.cities.x}
            y={settings.cities.y}
            width={settings.cities.width}
            height={settings.cities.height}
            {...bind('cities')}
          >
            <Rect
              width={settings.cities.width}
              height={settings.cities.height}
              fill={settings.plateColor}
              cornerRadius={20}
            />

            <Text
              x={20}
              y={0}
              width={settings.cities.width - 40}
              height={settings.cities.height}
              text={delivery.cities}
              fontFamily="Arial"
              fontSize={38}
              fontStyle="bold italic"
              fill="white"
              align="center"
              verticalAlign="middle"
              wrap="none"
            />
          </Group>

          <Selection
            selected={selected === 'cities'}
            nodeRef={refs.cities}
          />

          {/* Phone */}
          <Group
            ref={refs.phone}
            x={settings.phone.x}
            y={settings.phone.y}
            width={settings.phone.width}
            height={settings.phone.height}
            {...bind('phone')}
          >
            <Rect
              width={settings.phone.width}
              height={settings.phone.height}
              fill={settings.plateColor}
              cornerRadius={18}
            />

            <Text
              x={18}
              y={0}
              width={settings.phone.width - 36}
              height={settings.phone.height}
              text={delivery.phone}
              fontFamily="Arial"
              fontSize={38}
              fontStyle="bold italic"
              fill="white"
              align="center"
              verticalAlign="middle"
              wrap="none"
            />
          </Group>

          <Selection
            selected={selected === 'phone'}
            nodeRef={refs.phone}
          />
        </Layer>
      </Stage>
    </div>
  </div>
);
}