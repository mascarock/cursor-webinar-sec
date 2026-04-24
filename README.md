# Gastos Familiares

App para registrar gastos de la familia (en pesos colombianos 🇨🇴).

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

Si querés usar tu propia base MongoDB, definí la variable de entorno antes de `npm start`:

- macOS / Linux: `MONGODB_URI=mongodb://localhost:27017 npm start`
- Windows (PowerShell): `$env:MONGODB_URI="mongodb://localhost:27017"; npm start`
