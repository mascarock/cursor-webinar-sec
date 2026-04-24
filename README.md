# Gastos Familiares

App simple para registrar gastos de la familia (en pesos colombianos 🇨🇴).

> ⚠️ Esta app fue construida para un **webinar de demostración**. Tiene fallas de seguridad **a propósito** y **no debe usarse en producción**.

## Requisitos

- [Node.js](https://nodejs.org) 18 o superior (incluye `npm`).

No necesitas instalar MongoDB: la app levanta una base de datos en memoria automáticamente.

## Instalación

```bash
npm install
```

## Ejecutar

```bash
npm start
```

Abrí el navegador en: http://localhost:3000

Funciona igual en **Windows**, **macOS** y **Linux**.

## Uso

1. Creá una cuenta desde el formulario de registro.
2. Iniciá sesión.
3. Agregá, listá y eliminá tus gastos.

## Configuración opcional

Si querés usar tu propia base MongoDB, definí la variable de entorno:

- macOS / Linux: `MONGODB_URI=mongodb://localhost:27017 npm start`
- Windows (PowerShell): `$env:MONGODB_URI="mongodb://localhost:27017"; npm start`
