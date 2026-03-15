# Miss Express

Sitio web oficial de **Miss Express**, servicio de mensajería local en Liberia, Guanacaste.

## Mejoras incluidas

- Diseño más visual con secciones tipo tarjeta, gradientes y mejor jerarquía de contenido.
- Experiencia móvil mejorada.
- Conversión a **PWA** con:
  - `manifest.webmanifest`
  - `service worker` (`sw.js`)
  - meta tags para instalación en Android/iOS

## Cómo probar en Visual Studio Code

1. Abre la carpeta del proyecto en VS Code.
2. Instala la extensión **Live Server** (si no la tienes).
3. Clic derecho en `index.html` → **Open with Live Server**.
4. Abre DevTools en el navegador y revisa:
   - **Application > Manifest**
   - **Application > Service Workers**
5. Para instalar la app, usa la opción *Instalar app* del navegador (si aparece).

## Archivos clave

- `index.html`: estructura visual y etiquetas PWA.
- `style.css`: estilos del rediseño.
- `script.js`: animaciones ligeras y registro del service worker.
- `manifest.webmanifest`: metadata de instalación PWA.
- `sw.js`: cache básico offline.
