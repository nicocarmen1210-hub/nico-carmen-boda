# Carmen & Nico · 27.08.27

Web de una sola página para GitHub Pages, con menú de tres puntos, scroll por secciones y RSVP conectado a Google Sheets mediante Google Apps Script.

## Google Sheet

Crea una pestaña llamada `Invitados` con estas columnas:

`id | nombre | maxGuests | confirmado | acompañante | alergias | mensaje | fechaRespuesta`

Ejemplo:

`001 | Carmen García López | 2 | | | | |`

## Google Apps Script

1. Abre la hoja > Extensiones > Apps Script.
2. Pega `google-apps-script.gs`.
3. Sustituye `PEGA_AQUI_EL_ID_DE_TU_GOOGLE_SHEET` por el ID de la hoja.
4. Implementa > Nueva implementación > Aplicación web.
5. Ejecutar como: tú.
6. Acceso: cualquiera.
7. Copia la URL que termina en `/exec`.
8. En `index.html`, sustituye `PEGA_AQUI_LA_URL_DE_GOOGLE_APPS_SCRIPT` por esa URL.

## GitHub Pages

Sube `index.html`, `style.css`, `google-apps-script.gs`, `README.md` y la carpeta `images` a un repositorio. Después activa GitHub Pages desde Settings > Pages.

La lista de invitados NO está dentro del HTML público; se consulta desde Google Sheets a través de Apps Script. Para máxima privacidad, podemos cambiar el buscador por un código individual de invitación.
