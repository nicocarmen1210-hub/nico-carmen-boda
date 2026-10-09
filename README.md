# Carmen & Nico · 27.08.27

Web de una sola página para GitHub Pages. El formulario RSVP usa Google Apps Script como backend y Google Sheets como almacenamiento; no se descargan filas de invitados al publicar la web.

## Estructura de Google Sheets

La pestaña `Invitados` debe tener estas columnas, en este orden:

`id | grupoId | nombre | confirmado | alergias | autobusIda | autobusVuelta | mensaje | fechaRespuesta`

`confirmado` acepta `pendiente`, `si` o `no`. No añadas invitados desde la web: cada respuesta actualiza la fila del `id` existente.

Para una respuesta pendiente o una corrección, el formulario empieza vacío y el campo de alergias contiene `Ninguna`; se puede sustituir o borrar. Los autobuses y las alergias solo se solicitan para quien confirma asistencia.

Al volver a buscar un grupo, el servidor devuelve para cada integrante únicamente su `id`, nombre y si ya respondió. No devuelve asistencia, alergias, autobuses, mensajes ni fechas. Una persona que ya respondió verá **Corregir mi respuesta** y **Volver**; corregir abre un formulario vacío y actualiza la fila existente. La consulta emite un token temporal de grupo; los envíos solo se aceptan para IDs que pertenecen al grupo asociado a ese token.

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
9. En **Implementar > Gestionar implementaciones**, edita la implementación web y publica una nueva versión con el código actualizado. Copia la URL `/exec` que muestre esa implementación y comprueba que `API_URL` en `index.html` usa esa dirección; no reutilices una URL antigua si creaste una implementación nueva.

El código de Apps Script usa la autorización de la persona que lo despliega; no se incluyen credenciales de Google ni una clave de escritura en el HTML. La URL del servicio será visible en la web. El token temporal impide que un envío modifique IDs ajenos al grupo autorizado, y el backend nunca añade filas. Como la búsqueda por nombre es pública, esto no autentica la identidad del invitado; cualquiera que conozca un nombre podría consultar el grupo. Antes de considerar seguras las respuestas privadas, añade un código secreto por invitación (almacenado y validado en el servidor, no publicado en el HTML) o una autenticación equivalente.

## Probar antes de publicar la web

1. Despliega Apps Script y configura su URL `/exec` en `index.html`.
2. Abre la preview local del sitio y busca `Carmen Pérez`.
3. Selecciona la invitación de `INV001`. El backend debe recuperar las filas del mismo `grupoId`; en el caso de `GRUPO001`, deben aparecer solamente los registros que ya existan en ese grupo.
4. Antes de guardar, copia temporalmente los valores actuales de las celdas de `INV001` en las columnas D:I. Prueba una respuesta afirmativa para Carmen, eligiendo un autobús de ida y uno de vuelta. Comprueba que se actualizan `confirmado`, `alergias`, `autobusIda`, `autobusVuelta`, `mensaje` y `fechaRespuesta` en su propia fila.
5. Cambia esa misma respuesta y envíala otra vez. Debe actualizar la misma fila de `INV001`, sin crear otra.
6. Si hay otra persona en el grupo, responde por separado y comprueba que su fila conserva un estado independiente.
7. Prueba una respuesta `no`: se guarda `no` y la fecha para esa persona, se ocultan los campos de asistencia y no se cuenta como pasajera en `Resumen`.
8. Para una respuesta ya guardada, confirma que el navegador solo recibe `id`, nombre y el indicador de respuesta. Pulsa **Corregir mi respuesta**; todos los campos deben empezar vacíos salvo `Ninguna`. Guarda y comprueba que solo cambia la fila individual y que la fecha avanza. **Volver** y una consulta no deben escribir en la hoja.

Al terminar, restaura en la fila `INV001` los valores D:I que copiaste antes de la prueba. No crees invitados adicionales para probar; las pruebas anteriores al guardado (búsqueda y carga del grupo) no modifican la hoja.

## Publicación de GitHub Pages

Después de probar el backend, publica `index.html`, `style.css`, `google-apps-script.gs`, `README.md` y los recursos de `images` en el repositorio y activa GitHub Pages desde **Settings > Pages**.

El backend no está conectado hasta desplegar la aplicación web, pegar su URL `/exec` en `index.html` y probar una respuesta satisfactoria desde la preview. Cada cambio en `google-apps-script.gs` requiere desplegar una nueva versión de la aplicación web.
