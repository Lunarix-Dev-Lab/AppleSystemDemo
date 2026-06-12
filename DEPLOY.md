# Guía de despliegue — SistemaApple

Guía paso a paso para subir el sistema a un VPS con Docker. Pensada para
hacerse una sola vez; al final hay una sección de **actualizaciones** para los
siguientes deploys.

---

## 0. Requisitos en el VPS

- Docker y Docker Compose v2 instalados.
- Puerto **80** abierto (HTTP). Si vas a usar dominio + HTTPS, también el **443**.
- (Opcional) Un dominio apuntando a la IP del VPS.

La app queda accesible en `http://<IP-del-VPS>` aunque no tengas dominio.

---

## 1. Subir el código

```bash
git clone <tu-repo> sistemaapple
cd sistemaapple
```

(o `git pull` si ya estaba clonado).

---

## 2. Configurar variables de entorno (`.env`)

```bash
cp .env.example .env
nano .env
```

Completá estos valores (los marcados con ⚠️ son obligatorios para producción):

| Variable | Qué poner |
|----------|-----------|
| ⚠️ `SECRET_KEY` | Generala con `openssl rand -hex 32` |
| `DEBUG` | `false` (la app se niega a arrancar en prod con la clave de demo) |
| ⚠️ `ALLOWED_ORIGINS` | Tu origen público en JSON, ej. `["https://tutienda.com"]` o `["http://190.123.45.67"]` |
| ⚠️ `ALLOWED_SSR_HOSTS` | Tu dominio o IP, ej. `tutienda.com,www.tutienda.com` (para SEO) |
| ⚠️ `POSTGRES_PASSWORD` | Una contraseña fuerte para la base |
| ⚠️ `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Credenciales del admin (8+ caracteres) |
| `FRONTEND_URL` | URL pública, ej. `https://tutienda.com` (va en los links de los emails) |
| `SMTP_*` | Datos de tu proveedor de email (Resend, Gmail, etc.) para enviar confirmaciones |
| `BUSINESS_PHONE` | (Opcional) WhatsApp del dueño que recibe aviso de nuevos turnos |

> El `.env` está en `.gitignore`: **nunca** se sube al repo.

---

## 3. Personalizar el negocio (`frontend/src/theme.config.ts`)

Editá **un solo archivo** con los datos reales del cliente:

- `store.*` — nombre, email, dirección, teléfono, WhatsApp, Instagram.
- `legal.*` — razón social, CUIT, jurisdicción (aparecen en Términos/Privacidad).
- `analytics.googleAnalyticsId` — tu ID de Google Analytics (`G-XXXXXXXXXX`). Vacío = sin analítica.
- `gate.password` — dejalo **vacío** (`''`) para que el sitio sea público.

> Estos valores se compilan en el frontend, así que cambiarlos requiere
> reconstruir la imagen (paso 4).

---

## 4. Construir y levantar

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Esto levanta 4 contenedores: `nginx` (puerto 80), `frontend`, `backend` y
`postgres`. Solo nginx queda expuesto al exterior.

---

## 5. Migraciones de la base de datos

Crea las tablas y los datos base (horarios y configuración):

```bash
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

---

## 6. Crear el usuario administrador

Usa las credenciales de `ADMIN_EMAIL` / `ADMIN_PASSWORD` del `.env`:

```bash
docker compose -f docker-compose.prod.yml exec backend python create_admin.py
```

Es idempotente: para **cambiar la contraseña** después, editá `ADMIN_PASSWORD`
y volvé a correrlo.

---

## 7. (Opcional) Cargar productos de ejemplo

Carga los 8 iPhones de muestra con sus imágenes. **Seguro**: solo inserta si no
hay productos; no toca usuarios ni turnos.

```bash
docker compose -f docker-compose.prod.yml exec backend python seed_products.py
```

> Conviene configurar el tipo de cambio en `/admin/configuracion` **antes**, ya
> que el precio se guarda como `USD × tipo de cambio`. De todos modos son
> ejemplos: editalos o borralos desde el panel.
>
> ⚠️ No uses `seed.py` (el viejo) en producción: ese **borra todos los datos**.

---

## 8. Verificar

```bash
# API saludable
curl http://localhost/api/health        # {"status":"ok",...}

# Productos cargados
curl http://localhost/api/v1/products
```

Y abrí `http://<IP-o-dominio>` en el navegador. Entrá al panel en `/admin/login`
con las credenciales del paso 6.

---

## HTTPS (recomendado para producción real)

Sin HTTPS, la contraseña del admin viaja en texto plano. Dos opciones:

- **Cloudflare (más fácil):** poné el dominio detrás de Cloudflare con SSL
  "Flexible/Full". Bonus: absorbe ataques DDoS reales.
- **Certbot + nginx:** emití un certificado Let's Encrypt y agregá un `server`
  en `nginx/nginx.conf` escuchando en 443. Cambiá `server_name _;` por tu dominio.

---

## Actualizaciones (próximos deploys)

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
# Si hubo nuevas migraciones:
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

Los datos (postgres y las imágenes subidas) persisten en volúmenes Docker, así
que no se pierden al reconstruir.

---

## Backups

Los datos viven en dos volúmenes: `postgres_data` (base) y `media_data` (fotos).

```bash
# Backup de la base
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U apple sistemaapple > backup_$(date +%F).sql

# Backup de las fotos subidas
docker run --rm -v sistemaapple_media_data:/data -v "$PWD":/out alpine \
  tar czf /out/media_$(date +%F).tar.gz -C /data .
```

---

## Checklist final antes de salir a producción

- [ ] `SECRET_KEY` regenerada (no la de demo)
- [ ] `POSTGRES_PASSWORD` fuerte
- [ ] `ADMIN_PASSWORD` fuerte (cambiada respecto de desarrollo)
- [ ] `ALLOWED_ORIGINS`, `ALLOWED_SSR_HOSTS` y `FRONTEND_URL` con tu dominio/IP
- [ ] `theme.config.ts` con datos reales y `gate.password` vacío
- [ ] SMTP configurado y probado (sacá un turno de prueba y revisá el email)
- [ ] HTTPS configurado (Cloudflare o certbot)
- [ ] Backups programados
