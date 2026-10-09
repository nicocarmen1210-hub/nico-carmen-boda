# Carmen & Nico · 27.08.27

Web de una sola página para GitHub Pages. El formulario RSVP usa Google Apps Script como backend y Google Sheets como almacenamiento; no se descargan filas de invitados al publicar la web.

## Estructura de Google Sheets

La pestaña `Invitados` debe tener estas columnas, en este orden:

`id | grupoId | nombre | confirmado | alergias | autobusIda | autobusVuelta | mensaje | fechaRespuesta`

`confirmado` acepta `pendiente`, `si` o `no`. No añadas invitados desde la web: cada respuesta actualiza la fila del `id` existente.

La hoja configurada en `google-apps-script.gs` es la proporcionada por Carmen y Nico. El script accede a la pestaña por el nombre `Invitados`, nunca por `gid`.

## Preparar y desplegar Google Apps Script

1. Abre la hoja de cálculo y selecciona **Extensiones > Apps Script**.
2. Sustituye el contenido del editor por el código completo de `google-apps-script.gs` y pulsa **Guardar**.
3. En el selector de funciones, elige `setupResumen` y pulsa **Ejecutar**. La primera vez, Google solicitará autorización para leer y actualizar la hoja. Revisa los permisos y autoriza con la cuenta propietaria.
4. Comprueba que `Resumen` contiene los confirmados, los pendientes y los cuatro trayectos de autobús.
5. En Apps Script, pulsa **Implementar > Nueva implementación**.
6. Selecciona el tipo **Aplicación web**. Elige **Ejecutar como: Yo** y **Quién tiene acceso: Cualquier persona** para que el formulario estático pueda llamar al servicio.
7. Pulsa **Implementar** y autoriza los permisos si Google vuelve a solicitarlos.
8. Copia la URL de aplicación web que termina en `/exec`.
9. En `index.html`, sustituye únicamente el texto `PEGA_AQUI_LA_URL_DE_GOOGLE_APPS_SCRIPT` de `API_URL` por la URL copiada. No publiques hasta haber hecho esta configuración.

El código de Apps Script usa la autorización de la persona que lo despliega; no se incluyen credenciales de Google ni una clave de escritura en el HTML. La URL del servicio será visible en la web. Aunque el backend nunca comparte la hoja ni añade filas, el servicio público permite buscar nombres y actualizar una fila existente si se conoce su `id`. Este esquema no autentica de forma segura a cada invitado; para protegerse frente a cambios malintencionados haría falta añadir códigos privados por invitación o interponer un servicio con autenticación.

## Probar antes de publicar la web

1. Despliega Apps Script y configura su URL `/exec` en `index.html`.
2. Abre la preview local del sitio y busca `Carmen Pérez`.
3. Selecciona la invitación de `INV001`. El backend debe recuperar las filas del mismo `grupoId`; en el caso de `GRUPO001`, deben aparecer solamente los registros que ya existan en ese grupo.
4. Antes de guardar, copia temporalmente los valores actuales de las celdas de `INV001` en las columnas D:I. Prueba una respuesta afirmativa para Carmen, eligiendo un autobús de ida y uno de vuelta. Comprueba que se actualizan `confirmado`, `alergias`, `autobusIda`, `autobusVuelta`, `mensaje` y `fechaRespuesta` en su propia fila.
5. Cambia esa misma respuesta y envíala otra vez. Debe actualizar la misma fila de `INV001`, sin crear otra.
6. Si hay otra persona en el grupo, responde por separado y comprueba que su fila conserva un estado independiente.
7. Prueba una respuesta `no`: se guarda `no`, se vacían los datos de asistencia/autobús de esa persona y no se cuenta como pasajera en `Resumen`.

Al terminar, restaura en la fila `INV001` los valores D:I que copiaste antes de la prueba. No crees invitados adicionales para probar; las pruebas anteriores al guardado (búsqueda y carga del grupo) no modifican la hoja.

## Publicación de GitHub Pages

Después de probar el backend, publica `index.html`, `style.css`, `google-apps-script.gs`, `README.md` y los recursos de `images` en el repositorio y activa GitHub Pages desde **Settings > Pages**.

El backend no está conectado hasta desplegar la aplicación web, pegar su URL `/exec` en `index.html` y probar una respuesta satisfactoria desde la preview.
