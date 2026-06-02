# SistemaApple — Vitrina B2B de iPhones

Plantilla **single-tenant** para mostrar y reservar iPhones. La agencia clona el repositorio, personaliza un archivo y despliega — un proyecto por cliente.

---

## Acceso rápido al demo

| | |
|---|---|
| **Sitio web** | http://localhost:4000 |
| **Contraseña de demo** | `lunarix2025` |
| **Panel admin** | http://localhost:4000/admin/login |
| **Email admin** | `admin@sistemaapple.com` |
| **Contraseña admin** | `Admin2025!` |
| **API Docs** | http://localhost:8000/api/docs |

---

## Tech stack

| Capa | Tecnología |
|---|---|
| **Backend** | Python 3.12 · FastAPI 0.115 · SQLAlchemy 2.0 async · Alembic · asyncpg · PostgreSQL 16 |
| **Frontend** | Angular 19 (standalone + signals) · SSR via @angular/ssr · Tailwind CSS 3 |
| **Auth** | JWT (access + refresh tokens) · bcrypt |
| **Email** | aiosmtplib · compatible con Gmail App Password, Resend, SendGrid |
| **WhatsApp** | Meta Cloud API (stub silencioso si no hay credenciales) |
| **Tests** | pytest · pytest-asyncio · httpx |

---

## Levantar el proyecto

### Con Docker (recomendado)

```bash
# 1. Copiar y completar las variables de entorno
cp .env.example .env

# 2. Levantar todos los servicios
docker-compose up --build

# 3. Correr migraciones (primera vez)
docker-compose exec backend alembic upgrade head

# 4. Cargar datos de demo
docker-compose exec backend python seed.py
```

Servicios disponibles:

| Servicio | URL |
|---|---|
| Frontend (Angular SSR) | http://localhost:4000 |
| Backend (FastAPI) | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/api/docs |
| PostgreSQL | localhost:5432 |

### Sin Docker (desarrollo local)

**Backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Linux/Mac
# .venv\Scripts\activate           # Windows

pip install -r requirements.txt
alembic upgrade head
python seed.py
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
ng serve --port 4000               # Dev server (sin SSR)
# Para SSR completo:
# ng build && node dist/frontend/server/server.mjs
```

---

## Personalizar para un cliente nuevo

**Toda la personalización visual y de contenido está en un solo archivo:**

```
frontend/src/theme.config.ts
```

Lo que se configura desde ahí:

| Sección | Qué controla |
|---|---|
| `store.name` | Nombre del negocio (aparece en header, emails, admin) |
| `store.tagline` | Subtítulo del hero de la home |
| `store.description` | Descripción breve del negocio |
| `store.phone` | Teléfono visible en la home |
| `store.whatsapp` | Número para el botón de WhatsApp (formato: `5491112345678`) |
| `store.email` | Email de contacto público |
| `store.address` | Dirección del local |
| `store.instagram` | Handle de Instagram (sin @) |
| `gate.password` | Contraseña de acceso al demo (`''` = sin restricción) |
| `colors.primary` | Color primario en formato RGB (ej: `'0 0 0'` para negro) |
| `meta.title` | Título de la pestaña del navegador |
| `meta.description` | Meta description para buscadores |

### Pasos para clonar a un cliente nuevo

```bash
# 1. Clonar el repositorio
git clone <repo> nombre-cliente
cd nombre-cliente

# 2. Personalizar contenido
#    Editar: frontend/src/theme.config.ts
#    (nombre, contacto, colores, contraseña de demo)

# 3. Configurar credenciales
cp .env.example .env
#    Editar: SECRET_KEY, DATABASE_URL, SMTP_*, FRONTEND_URL

# 4. Levantar
docker-compose up --build
docker-compose exec backend alembic upgrade head
docker-compose exec backend python seed.py
```

---

## Variables de entorno

Ver `.env.example` para descripción completa de cada variable.

### Requeridas

| Variable | Descripción |
|---|---|
| `SECRET_KEY` | Clave JWT — generá con `openssl rand -hex 32` |
| `DATABASE_URL` | URL PostgreSQL async: `postgresql+asyncpg://user:pass@host/db` |
| `FRONTEND_URL` | URL pública del sitio — usada en links de emails de cancelación |

### Email SMTP

| Variable | Descripción |
|---|---|
| `SMTP_HOST` | Servidor SMTP (`smtp.resend.com`, `smtp.gmail.com`, etc.) |
| `SMTP_PORT` | Puerto (587 para TLS, 465 para SSL) |
| `SMTP_USER` | Usuario SMTP |
| `SMTP_PASSWORD` | Contraseña o API key |
| `SMTP_FROM` | Dirección del remitente (`noreply@tudominio.com`) |
| `SMTP_TLS` | `true` para STARTTLS (recomendado) |

> **Para desarrollo rápido:** crear cuenta en [resend.com](https://resend.com) → API Key → usar `smtp.resend.com`, user `resend`, password = la API key.

### WhatsApp (opcional)

| Variable | Descripción |
|---|---|
| `WHATSAPP_TOKEN` | Token de acceso de Meta Cloud API |
| `WHATSAPP_PHONE_NUMBER_ID` | ID del número de teléfono en Meta |
| `BUSINESS_PHONE` | Número del dueño que recibe avisos de nuevos turnos |

> Si estas variables están vacías, los mensajes se loguean como `[WHATSAPP stub]` y la app funciona normalmente.

---

## Endpoints de la API

### Públicos (sin autenticación)

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/v1/products` | Lista productos activos |
| `GET` | `/api/v1/products/{id}` | Detalle de un producto |
| `GET` | `/api/v1/slots/schedule` | Horarios de atención del local |
| `GET` | `/api/v1/slots?date=YYYY-MM-DD` | Slots disponibles para una fecha |
| `POST` | `/api/v1/appointments` | Crear turno (guest, sin cuenta) |
| `GET` | `/api/v1/appointments/by-token/{token}` | Ver turno por token de email |
| `POST` | `/api/v1/appointments/cancel/{token}` | Cancelar turno por token de email |
| `GET` | `/api/health` | Health check |

### Admin (requieren JWT)

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Iniciar sesión |
| `POST` | `/api/v1/auth/refresh` | Renovar access token |
| `GET` | `/api/v1/auth/me` | Perfil del usuario autenticado |
| `POST/PUT/DELETE` | `/api/v1/products/**` | CRUD de productos |
| `POST` | `/api/v1/products/{id}/images` | Subir imagen (JPEG/PNG/WEBP, max 10 MB) |
| `GET/PUT` | `/api/v1/appointments/**` | Listar y gestionar turnos |
| `GET/PUT` | `/api/v1/schedules/**` | Ver y editar horarios de atención |
| `GET/PUT` | `/api/v1/config` | Configuración de slots (duración, capacidad) |
| `GET` | `/api/v1/stats` | Estadísticas del dashboard |

---

## Panel de administración

Acceso: `http://localhost:4000/admin/login`

| Sección | Ruta | Descripción |
|---|---|---|
| Dashboard | `/admin` | Stats en tiempo real: productos, turnos de hoy, pendientes |
| Productos | `/admin/productos` | CRUD de iPhones con gestión de imágenes |
| Turnos | `/admin/turnos` | Lista con filtros por estado, confirmar / cancelar |
| Horarios | `/admin/horarios` | Editar horarios de atención por día |
| Configuración | `/admin/configuracion` | Duración de slots, capacidad, anticipación máxima |

---

## Sistema de turnos

El calendario de reservas se genera **dinámicamente** — no se guardan slots en la base de datos, solo las reservas confirmadas.

```
BusinessSchedule (horarios)  +  SlotConfig (duración, capacidad)
           ↓
    Slots disponibles generados en runtime
           ↓
    Guest reserva → Appointment guardado en DB
           ↓
    Email de confirmación con link de cancelación único
```

**Configuración por defecto (seed):**
- Lunes a Viernes: 09:00 — 18:00
- Sábado: 10:00 — 14:00
- Domingo: cerrado
- Duración de slot: 30 minutos
- Máximo por slot: 2 personas
- Anticipación máxima: 30 días

---

## Tests

```bash
# Correr todos los tests (desde dentro del contenedor)
docker-compose exec backend pytest tests/ -v

# O localmente (requiere PostgreSQL corriendo)
cd backend
pytest tests/ -v
```

Cobertura actual: **34 tests** distribuidos en:

| Archivo | Tests | Qué cubre |
|---|---|---|
| `test_auth.py` | 7 | Login, refresh, permisos |
| `test_products.py` | 8 | CRUD, upload de imágenes, permisos |
| `test_slots.py` | 6 | Generación de slots, días cerrados, fechas inválidas |
| `test_appointments.py` | 13 | Reservas, cancelaciones, capacidad máxima, admin |

---

## Estructura del proyecto

```
SistemaApple/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── auth.py          # Login, refresh, me
│   │   │       ├── products.py      # CRUD + imágenes
│   │   │       ├── slots.py         # Generación de franjas
│   │   │       ├── appointments.py  # Reservas y cancelaciones
│   │   │       ├── schedules.py     # Horarios + config
│   │   │       └── stats.py         # Dashboard stats
│   │   ├── core/
│   │   │   ├── config.py            # Settings (pydantic-settings)
│   │   │   ├── database.py          # Engine async + get_db
│   │   │   ├── security.py          # JWT + bcrypt
│   │   │   └── notifications.py     # Email + WhatsApp
│   │   ├── models/                  # SQLAlchemy ORM
│   │   └── schemas/                 # Pydantic v2
│   ├── alembic/                     # Migraciones de DB
│   ├── tests/                       # pytest
│   ├── seed.py                      # Datos de demo
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── theme.config.ts          # ← PERSONALIZACIÓN (único archivo)
│       └── app/
│           ├── gate/                # Pantalla de acceso por contraseña
│           ├── public/
│           │   ├── home/            # Landing page
│           │   ├── catalog/         # Vitrina de productos (SSR)
│           │   ├── booking/         # Formulario de reservas
│           │   └── cancel/          # Cancelación por link de email
│           └── admin/
│               ├── login/
│               ├── dashboard/
│               ├── products/
│               ├── appointments/
│               ├── schedules/
│               └── config/
├── docker-compose.yml
└── .env.example
```

---

## Notas para producción

Antes de ir a producción con un cliente real, verificar:

- [ ] `SECRET_KEY` cambiada por un valor seguro (`openssl rand -hex 32`)
- [ ] `FRONTEND_URL` apunta al dominio real (usado en links de emails)
- [ ] `ALLOWED_ORIGINS` incluye el dominio de producción
- [ ] `gate.password` en `theme.config.ts` cambiada o eliminada (`''`)
- [ ] Contraseña del admin cambiada (re-ejecutar seed con credenciales nuevas)
- [ ] HTTPS configurado (nginx o Caddy como reverse proxy)
- [ ] Imágenes de productos en cloud storage (S3, Cloudflare R2) para persistencia
- [ ] SMTP configurado con dominio verificado para enviar a cualquier email

---

## Desarrollado por

**Lunarix Lab** — Software a medida para PyMEs
