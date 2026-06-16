# LearnHub — Full-Stack E-Learning Platform

> **Lab Course 2 — University Project 2025–2026**
> Stack: **FastAPI + React + PostgreSQL + MongoDB + Redis**
> Dataset: [Udemy Online Education Courses](https://www.kaggle.com/datasets/yusufdelikkaya/udemy-online-education-courses) (Kaggle)

---

## Project Overview

LearnHub is a production-ready e-learning platform seeded with real Udemy course data from Kaggle (5,000+ courses across 10+ categories with ratings, enrollments, and pricing data).

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11+, FastAPI, SQLAlchemy 2.0 (async) |
| Database | PostgreSQL (primary), MongoDB (analytics), Redis (caching) |
| Auth | JWT (access + refresh tokens), bcrypt, RBAC |
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| State | Zustand + TanStack React Query |
| Real-time | WebSocket (FastAPI native) |
| Charts | Recharts |
| Dataset | Kaggle — Udemy Online Education Courses |

---

## Database Schema (24 Tables — 3NF)

### Mandatory (10)
`users` · `roles` · `user_roles` · `permissions` · `role_permissions` · `refresh_tokens` · `audit_logs` · `notifications` · `settings` · `files`

### Domain — E-Learning (14)
`categories` · `courses` · `tags` · `course_tags` · `modules` · `lessons` · `enrollments` · `lesson_progress` · `reviews` · `payments` · `chat_rooms` · `chat_messages` · `coupons` · `certificates`

---

## Additional Features (5 implemented)

| # | Feature | Details |
|---|---|---|
| 1 | **Advanced Search** | 7 filters: keyword, category, level, min/max price, language, min rating + sorting + pagination |
| 2 | **Data Export / Import** | CSV, Excel, JSON for 7 lists (courses, enrollments, users, reviews, payments, categories, audit_logs) + Kaggle CSV import |
| 3 | **Online Payments** | Stripe-ready checkout, auto-enroll on success |
| 4 | **Real-Time Communication** | WebSocket chat rooms + per-user live notifications |
| 5 | **CMS** | Admin settings editor (site_name, hero content, etc.) stored in DB |

---

## Setup & Run

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- (Optional) MongoDB, Redis

### Backend

```bash
cd backend

# 1. Copy env
cp .env.example .env
# Edit .env — set DATABASE_URL at minimum

# 2. Install dependencies
pip install -r requirements.txt

# 3. (Optional) Place Kaggle CSV
# Download: https://www.kaggle.com/datasets/yusufdelikkaya/udemy-online-education-courses
# Place at: backend/scripts/udemy_courses.csv

# 4. Seed database (creates tables + admin user + imports courses)
python -m scripts.seed_kaggle

# 5. Start API server
uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
```

App: http://localhost:5173

---

## Default Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@learnhub.com | Admin1234! |
| System Instructor | system@learnhub.com | System1234! |

---

## API Endpoints

| Group | Prefix | Description |
|---|---|---|
| Auth | `/api/v1/auth` | register, login, refresh, me |
| Courses | `/api/v1/courses` | CRUD + popular + search |
| Categories | `/api/v1/categories` | list, create |
| Enrollments | `/api/v1/enrollments` | enroll, my enrollments |
| Reviews | `/api/v1/reviews` | list, add |
| Notifications | `/api/v1/notifications` | list, mark read |
| Export | `/api/v1/export` | export 7 lists, import CSV |
| Admin | `/api/v1/admin` | stats, users, audit logs, settings |
| Payments | `/api/v1/payments` | Stripe checkout |
| WebSocket | `/ws/chat/{room_id}` | Real-time chat |
| WebSocket | `/ws/notifications/{user_id}` | Live notifications |

---

## Roles & Permissions

| Role | Permissions |
|---|---|
| Admin | Full access |
| Manager | Manage courses, export data |
| Instructor | Create/edit own courses |
| User | Browse, enroll, review |

---

## Kaggle Dataset Mapping

| CSV Column | Database Field |
|---|---|
| `course_title` | `courses.title` |
| `subject` | `categories.name` |
| `level` | `courses.level` (enum) |
| `price` | `courses.price` |
| `num_subscribers` | `courses.num_subscribers` |
| `avg_rating` | `courses.avg_rating` |
| `num_reviews` | `courses.num_reviews` |
| `content_length_min` | `courses.duration_hours` (÷60) |
| `headline` | `courses.description` |
| `language` | `courses.language` |

---

## Project Structure

```
project/
├── backend/
│   ├── main.py                        # FastAPI app entrypoint
│   ├── requirements.txt
│   ├── .env.example
│   ├── scripts/
│   │   └── seed_kaggle.py             # DB seed + Kaggle import
│   └── app/
│       ├── api/v1/routes.py           # All routers
│       ├── core/
│       │   ├── config.py              # Settings (env vars)
│       │   ├── security.py            # JWT + bcrypt
│       │   ├── dependencies.py        # Auth dependencies, RBAC
│       │   └── websocket_manager.py   # WS connection manager
│       ├── db/
│       │   ├── database.py            # PostgreSQL async engine
│       │   └── nosql.py               # MongoDB + Redis
│       ├── models/models.py           # 24 SQLAlchemy models
│       ├── schemas/schemas.py         # Pydantic schemas
│       └── services/
│           ├── auth_service.py        # Register, login, refresh
│           ├── course_service.py      # Search + CRUD
│           └── export_service.py      # Export/import
└── frontend/
    ├── src/
    │   ├── api/client.ts              # Axios + interceptors
    │   ├── store/store.ts             # Zustand stores
    │   ├── hooks/useWebSocket.ts      # WS hooks
    │   ├── components/
    │   │   ├── layout/Layout.tsx
    │   │   ├── layout/AdminLayout.tsx
    │   │   └── course/CourseCard.tsx
    │   └── pages/
    │       ├── Home.tsx
    │       ├── Courses.tsx            # Advanced search
    │       ├── CourseDetail.tsx
    │       ├── Dashboard.tsx
    │       ├── Profile.tsx
    │       ├── Chat.tsx               # Real-time WebSocket
    │       └── admin/
    │           ├── AdminDashboard.tsx # Stats + Recharts
    │           ├── AdminCourses.tsx
    │           ├── AdminUsers.tsx
    │           ├── AdminExport.tsx    # Export + Kaggle import
    │           └── AdminSettings.tsx  # CMS editor
    └── package.json
```

---

## Requirements Compliance (Kërkesat Teknike)

| Requirement | Implementation |
|---|---|
| Stack #5: Python + React | FastAPI + React/Vite + PostgreSQL + Redis/MongoDB, Tailwind CSS |
| 24 tables, 10 mandatory, 3NF | `backend/app/models/models.py` — FKs, indexes, audit columns |
| Layered architecture | Controllers (`api/v1/routes.py`) → Services (`services/`) → Repositories/ORM |
| JWT access + refresh | `core/security.py` (bcrypt hashing, PyJWT), role-protected endpoints |
| Input validation / SQLi protection | Pydantic schemas + SQLAlchemy parameterized queries |
| CORS + .env secrets | `core/config.py` reads `.env`; CORS restricted to allowed origins |
| State mgmt / lazy loading / code splitting | Zustand + React Query; `React.lazy` route-based splitting in `App.tsx` |
| Real-time (WebSocket) | Live chat rooms + real-time notifications (`/ws/chat`, `/ws/notifications`) |
| API documentation | Swagger UI auto-generated at `http://localhost:8000/docs` |
| ERD | `docs/ERD.md` (Mermaid) |

**UI:** Full dark mode — toggle in the navbar (moon/sun icon), persists in localStorage, respects system preference. The entire palette is CSS-variable driven so every page adapts.

**Dataset:** `backend/scripts/udemy_courses.csv` — 3,683 real Udemy courses (Kaggle). The seeder imports them automatically, mapped into categories, on top of 32 hand-crafted featured courses.

### Additional Features (4 implemented, min. 3 required)
1. **Advanced Search** — text search + filters on **5 lists**: Courses (q, category, level, price, rating, sort), Reviews (q, min_rating), Users (q, is_active), Audit Logs (q, entity), Categories (q)
2. **CMS** — Admin → Settings edits hero title/subtitle/tagline; the public homepage reads these live from `/settings/public` (no code or business-data changes)
3. **Data Export/Import** — 7 lists (courses, enrollments, users, reviews, payments, categories, audit logs) × CSV/Excel/JSON + Kaggle CSV import
4. **Online Payments** — Stripe integration with transaction validation, error handling, and payment logs
