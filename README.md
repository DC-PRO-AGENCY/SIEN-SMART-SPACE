# SIEN Smart Space · sitio v2 (RC4)

Prototipo estático (HTML + CSS + JS, sin build) para revisión de SIEN en dominio provisional de Hostinger.

- **Publicación:** cada merge a `main` se sube por FTP a Hostinger con GitHub Actions (`.github/workflows/publicar-hostinger.yml`). Secretos: `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`.
- **Flujo de cambios:** rama + Pull Request; ver `FLUJO_GIT_DC_PRO.md` de DC PRO.
- **Origen:** carpeta «sitio (subir al servidor)» de Drive (DCPRO AGENCY → 19.- SIEN SMART SPACES → WEB RC4 prototipo), idéntica a `web/` de `SIEN_SmartSpace_Web_RC4_fuente.zip`.

## A propósito, no tocar en esta revisión

- `noindex` en todas las páginas: el dominio provisional no debe indexarse.
- `canonical` y `og:image` con `PENDIENTE-DOMINIO`: se regeneran con el dominio definitivo.
- CSP en `<meta>`: **no instalar GTM** sin añadir la huella SHA-256 del snippet o servirlo con nonce (ver ficha de implementación RC3.2).
- `aviso-de-privacidad.html` y `terminos.html` aún no existen (404 esperado).
- `iconografia.html` es hoja de referencia interna; nadie la enlaza. Pendiente decidir si se quita.

## Caché (Hostinger CDN)

Hostinger cachea CSS/JS 7 días. Los HTML los piden con `?v=AAAAMMDD` (p. ej. `sh.css?v=20261105`): **cada vez que cambie un .css o .js, sube ese número en los 8 HTML** o los visitantes seguirán viendo la versión anterior. Si algo no se actualiza, en hPanel: Rendimiento → CDN → Purgar caché.
