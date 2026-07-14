# Индейка — семейная CRM v2

React + Vite + Konva + Supabase.

## Что нового

- редактор изображения как Canva: блоки можно двигать и растягивать;
- оформление близко к исходному прайсу;
- адаптивная мобильная версия;
- разделы: главная, цены, доставка, генератор, история, аналитика, остатки, акции, настройки;
- необязательная облачная синхронизация через Supabase;
- вход по email и паролю.

## Локальный запуск

```bash
npm install
npm run dev
```

Проверка сборки:

```bash
npm run build
```

## Подключение Supabase

1. Создайте проект в Supabase.
2. В SQL Editor выполните файл `supabase/setup.sql`.
3. В Authentication → Users создайте два аккаунта: себе и папе.
4. Скопируйте Project URL и publishable/anon key.
5. В Vercel → Project → Settings → Environment Variables добавьте:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

6. Выполните Redeploy.
7. В CRM откройте «Настройки» и войдите.

Каждый аккаунт имеет собственное защищённое состояние благодаря RLS. Чтобы оба устройства видели одни данные, входите на них под одним семейным аккаунтом.

## Обновление Vercel

```bash
git add .
git commit -m "Upgrade CRM editor and cloud sync"
git push
```

Vercel автоматически опубликует новую версию.
