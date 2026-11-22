# Общие тестовые данные

Одни и те же данные используются в трёх местах: в **макете**, в **подменных ответах сервера в тестах** (MSW) и в **настоящем демо** (`backend/scripts/dev.sh --seed`). Поэтому макет, тесты и работающий интерфейс совпадают.

Данные повторяют демо-набор бэкенда (`backend/scripts/seed.py`). Фиксированная «сегодня» для макета и тестов: **2026-11-23**.

## Пользователь

| Поле | Значение |
|---|---|
| email | `demo@example.com` |
| пароль | `demo-password` |
| валюта (`default_currency`) | `USD` |

## Валюта

Суммы в API не имеют своей валюты: валюта одна на пользователя, поле `default_currency` из `GET /api/auth/me` (по умолчанию `USD`). Интерфейс берёт её оттуда и форматирует по правилам `ru-RU` (`Intl.NumberFormat`): `15,49 $`. Захардкоженного значка валюты в коде быть не должно. У демо-пользователя `USD`, поэтому на макете суммы в долларах.

## Список подписок (ответ `GET /api/subscriptions`)

| id | name | amount | billing_cycle | custom_interval_days | is_active | start_date | next_billing_date | monthly_cost | charge_date | days_until |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Netflix | `"15.49"` | monthly | null | true | 2026-01-25 | 2026-11-25 | `"15.49"` | 2026-11-25 | 2 |
| 2 | Spotify | `"10.99"` | monthly | null | true | 2026-01-02 | 2026-12-02 | `"10.99"` | 2026-12-02 | 9 |
| 3 | iCloud+ (annual) | `"35.88"` | yearly | null | true | 2026-03-23 | 2027-03-23 | `"2.99"` | 2027-03-23 | 120 |
| 4 | Gym pass | `"6.00"` | weekly | null | true | 2026-01-05 | 2026-11-24 | `"26.00"` | 2026-11-24 | 1 |
| 5 | VPN (every 90 days) | `"19.90"` | custom_days | 90 | true | 2026-09-19 | 2026-12-18 | `"6.63"` | 2026-12-18 | 25 |

Для тестов, где нужна новая подписка (сценарий добавления), берётся:

| id | name | amount | billing_cycle | start_date | next_billing_date | monthly_cost | days_until |
|---|---|---|---|---|---|---|---|
| 6 | Dropbox Plus | `"11.99"` | monthly | 2026-12-07 | 2026-12-07 | `"11.99"` | 14 |

Для тестов статуса «Приостановлена» добавляется запись с `is_active: false`, в данных макета её нет.

## Как это показывается

| Поле API | Показ |
|---|---|
| `amount`, `monthly_cost` | `15,49 $`, `2,99 $` |
| `billing_cycle` | `monthly` — «каждый месяц», `yearly` — «каждый год», `weekly` — «каждую неделю», `custom_days` — «каждые 90 дней» |
| `charge_date` и `days_until` | «списание 25 нояб., через 2 дня» (склонение: 1 день, 2 дня, 9 дней, 120 дней) |
| `monthly_cost` | вторая строка справа: «15,49 $ в месяц» |

## Ответы для проверки ошибок

| Ситуация | Статус | Тело |
|---|---|---|
| неверный вход | 401 | `{"detail": "Incorrect email or password"}` |
| email занят | 409 | `{"detail": "Email already registered"}` |
| ошибка валидации | 422 | `{"detail": [{"loc": ["body", "amount"], "msg": "...", "type": "..."}]}` |
| сбой сервера | 500 | `{"detail": "Internal Server Error"}` |
| пустой список | 200 | `[]` |

## Данные обзора (ответы `GET /api/stats/*` и `GET /api/subscriptions/upcoming?days=7`)

Для набора из пяти подписок выше (сегодня 2026-11-23):

```json
// GET /api/stats/summary
{"monthly_total": "62.10", "yearly_total": "745.20", "currency": "USD"}

// GET /api/subscriptions/upcoming?days=7  (сортировка по дате)
[
  {"id": 4, "name": "Gym pass", "amount": "6.00", "billing_cycle": "weekly", "charge_date": "2026-11-24", "days_until": 1},
  {"id": 1, "name": "Netflix", "amount": "15.49", "billing_cycle": "monthly", "charge_date": "2026-11-25", "days_until": 2}
]

// GET /api/stats/breakdown
{
  "currency": "USD",
  "monthly_total": "62.10",
  "by_subscription": [
    {"id": 4, "name": "Gym pass", "billing_cycle": "weekly", "monthly_cost": "26.00", "share_percent": "41.87"},
    {"id": 1, "name": "Netflix", "billing_cycle": "monthly", "monthly_cost": "15.49", "share_percent": "24.94"},
    {"id": 2, "name": "Spotify", "billing_cycle": "monthly", "monthly_cost": "10.99", "share_percent": "17.70"},
    {"id": 5, "name": "VPN (every 90 days)", "billing_cycle": "custom_days", "monthly_cost": "6.63", "share_percent": "10.68"},
    {"id": 3, "name": "iCloud+ (annual)", "billing_cycle": "yearly", "monthly_cost": "2.99", "share_percent": "4.81"}
  ],
  "by_cycle": [
    {"billing_cycle": "monthly", "subscription_count": 2, "monthly_cost": "26.48", "share_percent": "42.64"},
    {"billing_cycle": "weekly", "subscription_count": 1, "monthly_cost": "26.00", "share_percent": "41.87"},
    {"billing_cycle": "custom_days", "subscription_count": 1, "monthly_cost": "6.63", "share_percent": "10.68"},
    {"billing_cycle": "yearly", "subscription_count": 1, "monthly_cost": "2.99", "share_percent": "4.81"}
  ]
}
```

Формат сверен с настоящим ответом бэкенда (тексты сумм, имена полей, порядок сортировки).
