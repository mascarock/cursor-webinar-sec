# Gastos Familiares


<img width="484" height="692" alt="image" src="https://github.com/user-attachments/assets/d7a8618f-f9b7-4f59-a9ef-ef502f7d5091" />

App estilo **Tricount** para dividir gastos en grupos: registrá lo que pagó cada uno y la app calcula automáticamente quién le debe a quién (con la mínima cantidad de transferencias). Soporta varias monedas (COP, USD, EUR, MXN, ARS, BRL, CLP, PEN).

> ⚠️ Esta app fue construida para un **webinar de demostración**. Tiene fallas de seguridad **a propósito** y **no debe usarse en producción**.

## Stack

- **Backend:** NestJS + TypeScript + MongoDB
- **Frontend:** HTML/CSS/JS estático (servido aparte)
- **DB:** MongoDB (con fallback automático a base en memoria — no requiere instalación)

## Estructura

```
.
├── backend/    # API NestJS (puerto 3001)
└── frontend/   # Sitio estático (puerto 5173)
```

## Requisitos

- [Node.js](https://nodejs.org) 18 o superior (incluye `npm`).

No necesitás instalar MongoDB.

## Instalación

```bash
npm install
```

(Esto instala dependencias del backend y del frontend.)

## Ejecutar

```bash
npm start
```

Esto levanta backend + frontend en paralelo:

- Frontend: http://localhost:5173
- API: http://localhost:3001

Funciona igual en **Windows**, **macOS** y **Linux**.

## Configuración opcional

Si querés usar tu propia base MongoDB en modo dev, definí la variable de entorno antes de `npm start`:

- macOS / Linux: `MONGODB_URI=mongodb://localhost:27017 npm start`
- Windows (PowerShell): `$env:MONGODB_URI="mongodb://localhost:27017"; npm start`

## Docker (producción / Coolify)

Para correr la app como se desplegaría en producción (con MongoDB de verdad y nginx sirviendo el frontend), usá Docker Compose:

```bash
docker compose -f docker-compose.yaml -f docker-compose.local.yaml up --build
```

Abrí: http://localhost:8080

> El override `docker-compose.local.yaml` solo expone el puerto `8080` para acceder desde tu máquina. En Coolify no se usa: el reverse proxy se conecta al contenedor por la red interna.

Esto levanta tres servicios:

- **mongo** — base de datos persistente (volumen `mongo_data`)
- **backend** — NestJS (interno, no expuesto)
- **frontend** — nginx que sirve los estáticos y proxea `/api` al backend

### Deploy en Coolify

1. Conectá tu repo en Coolify y elegí el tipo **Docker Compose**.
2. Coolify detecta `docker-compose.yaml` automáticamente.
3. Configurá las variables de entorno (opcional):
   - `JWT_SECRET` — secreto para firmar JWT (default `secret123`, **cambialo**)
   - `CORS_ORIGIN` — origen permitido para CORS (default `*`)
4. Apuntá tu dominio al servicio `frontend` (puerto `80`).
5. Coolify se encarga del HTTPS automáticamente con Let's Encrypt.
