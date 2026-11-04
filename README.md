# DRACHIT ∞ 💀

Мемный одностраничный сайт для Vercel. Никаких сборщиков, API и сторонних библиотек.

## Деплой через Vercel CLI

```bash
npm i -g vercel
cd drachit-infinity
vercel login
vercel --prod
```

В CLI отвечайте: Set up and deploy? **Y**; scope — ваш аккаунт; Link to existing project? **N**; project name: `drachit-infinity`; directory: `./`; дополнительных build commands не требуется.

## Деплой через интерфейс

1. Распакуйте папку.
2. Загрузите её как репозиторий GitHub.
3. Vercel → Add New → Project → Import Git Repository.
4. Framework Preset: **Other**. Root Directory: **./**. Build Command: пусто (Override отключено).
5. Нажмите Deploy.

## Локальный запуск

```bash
python -m http.server 8080
```
Откройте http://localhost:8080.

## Функциональность

- Счётчик запускается автоматически и не останавливается, пока открыта вкладка.
- Пауза/продолжение, сброс, скорость от 1 до 100 итераций в секунду.
- Значение счётчика хранится в localStorage браузера.
- В фоне или при закрытой вкладке счётчик не работает; это клиентское приложение, не серверный вечный процесс.
