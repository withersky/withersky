# 🛠️ Разработка и устройство проекта

Этот сайт — **Cloudflare Worker** (Workers Builds), а не Pages. Он подключается
к репозиторию, при каждом коммите автоматически собирается (`node build.js`)
и деплоится (`npx wrangler deploy`).

Данные о проектах генерируются автоматически из GitHub API — вручную
редактировать их не нужно.

## 🗂️ Структура файлов

| Файл | Что это |
| :--- | :--- |
| `index.html`, `style.css`, `main.js` | Фронтенд сайта (сама страница) |
| `repos.json` | **Твой входной файл.** Только список репозиториев `owner/repo` |
| `build.js` | Скрипт сборки: читает `repos.json`, дёргает GitHub API, пишет `projects.json` |
| `projects.json` | Сгенерированный файл с данными. **Не хранится в git** (см. `.gitignore`) |
| `wrangler.toml` | Конфиг воркера: точка входа, статика, cron-расписание |
| `src/index.js` | Код воркера: раздаёт статику + ночной `scheduled`-обработчик |
| `favicon.svg` | Иконка сайта |

## 🔄 Как обновляются данные

```
repos.json (ты редактируешь)
      ↓
build.js (при сборке) → запрос в GitHub API
      ↓
projects.json (генерируется, не в git)
      ↓
main.js (в браузере) → загружает projects.json
```

### Добавить/убрать проект

Достаточно отредактировать `repos.json` — добавить или удалить строку
`"withersky/имя-репо"`. Остальное подтянется автоматически при следующем
деплое.

## 🌙 Ночная пересборка (cron)

Чтобы статистика (звёзды, даты) обновлялась каждый день, воркер пересобирает
проект по расписанию:

1. **`wrangler.toml`** задаёт cron:
   ```toml
   [triggers]
   crons = ["0 0 * * *"]   # каждый день в 00:00 UTC (03:00 МСК)
   ```
2. **`src/index.js`** в `scheduled`-обработчике вызывает деплой-хук:
   ```js
   async scheduled(event, env) {
     const hook = env.DEPLOY_HOOK_URL;
     if (!hook) { console.error('DEPLOY_HOOK_URL не задан'); return; }
     const res = await fetch(hook, { method: 'POST' });
   }
   ```
3. Деплой-хук запускает новую сборку → `node build.js` тянет свежие данные →
   сайт обновляется.

> **Важно:** URL деплой-хука нужно один раз задать как секрет воркера
> `DEPLOY_HOOK_URL` (см. ниже).

### Как настроить ночную пересборку (разово)

1. В Cloudflare: **Workers & Pages → свой проект → Settings → Deploy hooks**
   → создать хук → скопировать URL.
2. Добавить URL как секрет воркера:
   - через дашборд: **Settings → Variables and Secrets → Add → Secret**,
     имя `DEPLOY_HOOK_URL`;
   - или через CLI:
     ```sh
     npx wrangler secret put DEPLOY_HOOK_URL
     ```

## 🚀 Деплой

Сборкой и деплоем занимается Workers Builds при каждом пуше в репозиторий:
- **Build command:** `node build.js`
- **Deploy command:** `npx wrangler deploy`

Локально можно собрать данные вручную:
```sh
node build.js
```

## 🔑 GitHub Token

Без токена GitHub API даёт 60 запросов в час — для небольшого списка этого
хватает. Чтобы не упираться в лимит, задай переменную окружения `GITHUB_TOKEN`
в **Settings → Build variables** воркера. Токен создаётся в GitHub →
Settings → Developer settings → Personal access tokens. Достаточно скоупа
`public_repo` (только чтение публичных репозиториев).
