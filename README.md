# Mesto

Социальная сеть для публикации фотографий интересных мест.

## Ссылка на проект

https://imanov-sabutay.github.io/mesto-production/

## Репозитории

- **mesto-ad** (приватный) — исходный код и деплой для Практикума.
- **mesto-production** (публичный) — опубликованный сайт на GitHub Pages.

## Технологии

- HTML, CSS (БЭМ)
- JavaScript (ES6 modules)
- Vite
- REST API (https://mesto.nomoreparties.co)

## Команды

```bash
npm install    # установка зависимостей
npm run dev    # запуск локального сервера разработки
npm run build  # сборка проекта в папку dist
npm run deploy # сборка и публикация в mesto-ad (ветка gh-pages)
```

## Как работает публикация

1. **`npm run deploy`** — собирает проект и публикует в **mesto-ad** (ветка `gh-pages`).
   - В **mesto-ad**: Settings → Pages → Branch: `gh-pages`, Folder: `/ (root)`.

2. **`git push origin main`** — запускает GitHub Action **Deploy to Public Pages Repository**.
   - Сборка из `main` копируется в **mesto-production** (ветка `main`).
   - В **mesto-production** появляется deployment; сайт: https://imanov-sabutay.github.io/mesto-production/
   - В **mesto-production**: Settings → Pages → Branch: `main`, Folder: `/ (root)`.

### Секрет для Action

В **mesto-ad** → Settings → Secrets → Actions должен быть секрет **`GH_TOKEN`** — Personal Access Token с правом `repo` для push в `mesto-production`.
