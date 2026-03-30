# AI Validator — проверка документов с искусственным интеллектом

Сервис для валидации документов с использованием искусственного интеллекта. Поддерживает PDF, DOCX, TXT и изображения (с OCR-распознаванием).

## 🚀 Возможности

- 🔐 **Аутентификация** — JWT токены с refresh-ротацией
- 👥 **Роли** — user, moderator, admin (RBAC)
- 📄 **Проверка документов** — PDF, DOCX, TXT
- 🖼️ **OCR изображений** — распознавание текста через Aspose Cloud
- 📦 **Облачное хранилище** — MinIO для файлов
- 📊 **История проверок** — фильтрация, поиск, пагинация
- 🐳 **Docker** — полная контейнеризация

## 🛠 Технологии

| Стек | Технологии |
|------|------------|
| **Backend** | FastAPI, SQLAlchemy, PostgreSQL, MinIO, JWT, pytest |
| **Frontend** | React, TypeScript, Vite, Vitest, Playwright |
| **AI/OCR** | Ollama (qwen2.5:3b-instruct), Aspose Cloud |

## 👥 Роли и права доступа

| Роль | Свои документы | Чужие документы | Удаление | Управление пользователями |
|------|----------------|-----------------|----------|--------------------------|
| **User** | ✅ | ❌ | ✅ (свои) | ❌ |
| **Moderator** | ✅ | ✅ (только просмотр) | ❌ | ❌ |
| **Admin** | ✅ | ✅ | ✅ | ✅ |

## 🚀 Быстрый старт

### Требования
- Docker Desktop

### Запуск

```bash
# Клонируем репозиторий
git clone https://github.com/ViktoriaKropivka/DocumentValidationSite.git
cd DocumentValidationSite

# Запускаем все контейнеры
docker-compose up -d

# Создаем тестовых пользователей
docker exec -it doc_backend python create_users_fixed.py
```

### Данные для входа

| Роль | Email | Пароль |
|------|-------|--------|
| 👑 Администратор | admin@test.com | admin123 |
| 🛡️ Модератор | moderator@test.com | moder123 |
| 👤 Пользователь | user@test.com | user123 |

### Доступ к сервисам

| Сервис | URL |
|--------|-----|
| Frontend | http://localhost |
| API Docs (Swagger) | http://localhost:8000/docs |
| MinIO Console | http://localhost:9001 |

*MinIO Console: логин `minioadmin`, пароль `minioadmin`*

## 📁 Структура проекта

```
FullStack/
├── backend/
│   ├── api/
│   │   └── endpoints/          # API маршруты
│   │       ├── auth.py         # Регистрация, логин, logout
│   │       ├── admin.py        # Управление пользователями
│   │       ├── documents.py    # История проверок
│   │       ├── document_file.py # Загрузка файлов + MinIO
│   │       ├── rules.py        # Генерация правил
│   │       ├── ocr.py          # OCR эндпоинты
│   │       ├── users.py        # Профиль пользователя
│   │       └── seo.py          # sitemap.xml, robots.txt
│   ├── database/
│   │   ├── models.py           # User, DocumentValidation, ValidationRule
│   │   ├── session.py          # Подключение к БД
│   │   └── base.py             # Base для моделей
│   ├── services/
│   │   ├── ai_service.py       # AI валидация через Ollama
│   │   ├── ocr_service.py      # Aspose OCR
│   │   └── minio_service.py    # MinIO (upload, download, delete)
│   ├── dependencies/
│   │   └── roles_bac.py        # Проверка прав доступа
│   ├── tests/                  # 27 модульных тестов
│   ├── main.py                 # Точка входа
│   ├── auth.py                 # JWT, хеширование паролей
│   ├── config.py               # Переменные окружения
│   ├── schemas.py              # Pydantic схемы
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/         # React компоненты
│   │   │   ├── Header/         # Шапка с навигацией по ролям
│   │   │   ├── AuthModal/      # Модалка входа/регистрации
│   │   │   ├── DocumentInput/  # Загрузка файлов и текста
│   │   │   ├── RuleGenerator/  # Генерация правил
│   │   │   └── ValidationResults/ # Результаты проверки
│   │   ├── pages/
│   │   │   ├── HistoryPage/    # История проверок (фильтры, пагинация)
│   │   │   ├── AdminUserPage/  # Управление пользователями
│   │   │   └── NotFoundPage/   # 404 страница
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx # Аутентификация + роли
│   │   │   └── NotificationContext.tsx
│   │   ├── services/
│   │   │   └── api.ts          # Axios + interceptor для refresh token
│   │   ├── hooks/
│   │   │   └── useDebounce.ts  # Дебаунс для поиска
│   │   ├── types/
│   │   │   └── index.ts        # TypeScript типы
│   │   └── App.tsx             # Главный компонент
│   ├── e2e/                    # 7 E2E тестов (Playwright)
│   ├── nginx/
│   │   └── nginx.conf          # Reverse proxy для API
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   └── playwright.config.ts
│
├── docker-compose.yml
├── .env
└── README.md
```

## 🔌 API Эндпоинты

### Аутентификация

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| POST | `/api/v1/register/` | Регистрация |
| POST | `/api/v1/login/` | Вход (возвращает access + refresh токены) |
| POST | `/api/v1/refresh` | Обновление access токена |
| POST | `/api/v1/logout` | Выход (отзыв refresh токена) |
| GET | `/api/v1/users/me/` | Профиль текущего пользователя |
| PUT | `/api/v1/users/me` | Обновление профиля |
| DELETE | `/api/v1/users/me` | Удаление аккаунта |

### Документы и валидация

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| POST | `/api/v1/validate-file` | Загрузка и проверка файла (PDF, DOCX, TXT, изображения) |
| POST | `/api/v1/validate-document` | Проверка текста |
| GET | `/api/v1/validation-history` | История проверок (с фильтрацией, сортировкой, пагинацией) |
| DELETE | `/api/v1/validation-history/{id}` | Удаление проверки |
| GET | `/api/v1/documents/{id}/download` | Скачивание файла из MinIO |

### Правила

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| POST | `/api/v1/generate-checks` | AI-генерация правил |

### Администрирование (только admin)

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| GET | `/api/v1/admin/users` | Список всех пользователей |
| PUT | `/api/v1/admin/users/{id}/role` | Изменение роли |
| PUT | `/api/v1/admin/users/{id}/toggle-block` | Блокировка/разблокировка |

### SEO

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| GET | `/sitemap.xml` | Карта сайта |
| GET | `/robots.txt` | Правила для поисковиков |

## 🧪 Тестирование

### Backend (27 тестов)
```bash
cd backend
pytest tests/ -v
```

### Frontend (21 тест)
```bash
cd frontend
npm run test
```

### E2E (7 тестов)
```bash
cd frontend
npx playwright test
```

## 🔧 Переменные окружения

Создайте файл `.env` в корне проекта:

```env
# PostgreSQL
POSTGRES_USER=docuser
POSTGRES_PASSWORD=docpassword
POSTGRES_DB=doc_validator

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_BUCKET=user-documents
MINIO_ENDPOINT=http://minio:9000
MINIO_ENDPOINT_EXTERNAL=http://localhost:9000

# JWT
SECRET_KEY=your-secret-key-change-me-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# CORS
CORS_ORIGINS=http://localhost,http://localhost:80,http://frontend

# OCR (Aspose)
OCR_API_KEY=your-aspose-api-key
```

## 🐳 Команды Docker

```bash
# Запуск всех сервисов
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка всех сервисов
docker-compose down

# Пересборка и запуск
docker-compose up -d --build

# Вход в контейнер бэкенда
docker exec -it doc_backend /bin/bash

# Вход в PostgreSQL
docker exec -it doc_postgres psql -U docuser -d doc_validator
```

## 📝 Лицензия

MIT

## 👩‍💻 Автор

Viktoria Kropivka
```