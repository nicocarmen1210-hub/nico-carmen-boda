// Backend RSVP para la hoja Carmen & Nico.
// Columnas de Invitados: id | grupoId | nombre | confirmado | alergias |
// autobusIda | autobusVuelta | mensaje | fechaRespuesta

const SHEET_ID = "1E4yLV9r-cFbCYhPUNUFoxZ15fqGWPelCy5MsZWPmSKc";
const GUESTS_SHEET_NAME = "Invitados";
const SUMMARY_SHEET_NAME = "Resumen";
const GUEST_HEADERS = [
  "id",
  "grupoId",
  "nombre",
  "confirmado",
  "alergias",
  "autobusIda",
  "autobusVuelta",
  "mensaje",
  "fechaRespuesta"
];
const VALID_ATTENDANCE = ["si", "no"];
const VALID_OUTBOUND_BUS = ["moncloa", "las_rozas", "no"];
const VALID_RETURN_BUS = ["las_rozas", "moncloa", "no"];

function doGet(e) {
  const callback = e && e.parameter ? e.parameter.callback : "";

  try {
    const action = String((e.parameter && e.parameter.action) || "").toLowerCase();
    const sheet = guestsSheet_();
    const values = readGuests_(sheet);

    if (action === "search") {
      const query = normalize_(e.parameter.q || "");
      if (query.length < 3) {
        return respond_({ ok: true, guests: [] }, callback);
      }

      const matches = values.rows
        .filter(row => normalize_(row[values.columns.nombre]).includes(query))
        .slice(0, 10)
        .map(row => ({
          id: String(row[values.columns.id]),
          name: String(row[values.columns.nombre])
        }));

      return respond_({ ok: true, guests: matches }, callback);
    }

    if (action === "group") {
      const guestId = String((e.parameter && e.parameter.guestId) || "").trim();
      const selected = findUniqueGuest_(values.rows, values.columns, guestId);
      if (!selected) {
        return respond_({ ok: false, error: "No hemos encontrado esa invitación." }, callback);
      }

      const groupId = String(selected[values.columns.grupoId] || "").trim();
      if (!groupId) {
        return respond_({ ok: false, error: "La invitación no tiene un grupo asignado." }, callback);
      }

      const guests = values.rows
        .filter(row => String(row[values.columns.grupoId] || "").trim() === groupId)
        .map(row => ({
          id: String(row[values.columns.id]),
          name: String(row[values.columns.nombre]),
          attendance: String(row[values.columns.confirmado] || "pendiente").toLowerCase(),
          allergies: String(row[values.columns.alergias] || ""),
          outboundBus: String(row[values.columns.autobusIda] || ""),
          returnBus: String(row[values.columns.autobusVuelta] || ""),
          message: String(row[values.columns.mensaje] || "")
        }));

      return respond_({ ok: true, guests: guests }, callback);
    }

    return respond_({ ok: false, error: "Acción no válida." }, callback);
  } catch (error) {
    console.error(error);
    return respond_({ ok: false, error: "No se pudo consultar la hoja. Comprueba su configuración." }, callback);
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (data.action !== "rsvp") {
      return json_({ ok: false, error: "Acción no válida." });
    }

    const guestId = String(data.guestId || "").trim();
    const attendance = String(data.attendance || "").toLowerCase();
    const requestId = String(data.requestId || "").trim();
    if (!guestId || !VALID_ATTENDANCE.includes(attendance) ||
        !/^[a-zA-Z0-9-]{8,100}$/.test(requestId)) {
      return json_({ ok: false, error: "Faltan datos válidos para guardar la respuesta." });
    }

    let allergies = "";
    let outboundBus = "";
    let returnBus = "";
    let message = "";

    if (attendance === "si") {
      outboundBus = String(data.outboundBus || "").toLowerCase();
      returnBus = String(data.returnBus || "").toLowerCase();
      if (!VALID_OUTBOUND_BUS.includes(outboundBus) || !VALID_RETURN_BUS.includes(returnBus)) {
        return json_({ ok: false, error: "Selecciona una opción válida para cada trayecto de autobús." });
      }
      allergies = sheetText_(data.allergies || "");
      message = sheetText_(data.message || "");
    }

    if (allergies.length > 1000 || message.length > 2000) {
      return json_({ ok: false, error: "El texto indicado es demasiado largo." });
    }

    if (!lock.tryLock(10000)) {
      return json_({ ok: false, error: "Hay otra respuesta guardándose. Inténtalo de nuevo." });
    }

    const cache = CacheService.getScriptCache();
    const cacheKey = "rsvp:" + requestId;
    const previousResponse = cache.get(cacheKey);
    if (previousResponse) {
      const previous = JSON.parse(previousResponse);
      const fingerprint = JSON.stringify([
        guestId, attendance, allergies, outboundBus, returnBus, message
      ]);
      if (previous.fingerprint !== fingerprint) {
        return json_({ ok: false, error: "Este envío ya se utilizó con otros datos. Vuelve a intentarlo." });
      }
      return json_(previous.response);
    }

    const sheet = guestsSheet_();
    const values = readGuests_(sheet);
    const selected = findUniqueGuest_(values.rows, values.columns, guestId);
    if (!selected) {
      return json_({ ok: false, error: "No hemos encontrado a esa persona en la hoja." });
    }

    const rowNumber = selected._rowNumber;
    sheet.getRange(rowNumber, values.columns.confirmado + 1, 1, 6).setValues([[
      attendance,
      allergies,
      outboundBus,
      returnBus,
      message,
      new Date()
    ]]);
    SpreadsheetApp.flush();

    const response = { ok: true, message: "Respuesta guardada." };
    const fingerprint = JSON.stringify([
      guestId, attendance, allergies, outboundBus, returnBus, message
    ]);
    cache.put(cacheKey, JSON.stringify({ fingerprint: fingerprint, response: response }), 21600);
    return json_(response);
  } catch (error) {
    console.error(error);
    return json_({ ok: false, error: "No se pudo guardar la respuesta. Inténtalo de nuevo." });
  } finally {
    if (lock.hasLock()) {
      lock.releaseLock();
    }
  }
}

function setupResumen() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  readGuests_(guestsSheet_());
  const summary = spreadsheet.getSheetByName(SUMMARY_SHEET_NAME) ||
    spreadsheet.insertSheet(SUMMARY_SHEET_NAME);

  summary.getRange("A1:B3").setValues([
    ["Estado de invitaciones", "Personas"],
    ["Confirmados", ""],
    ["Pendientes", ""]
  ]);
  summary.getRange("B2:B3").setFormulas([
    ['=COUNTIF(Invitados!D2:D,"si")'],
    ['=COUNTIF(Invitados!D2:D,"pendiente")']
  ]);

  summary.getRange("A5:B9").setValues([
    ["Trayecto", "Pasajeros confirmados"],
    ["Ida · Moncloa", ""],
    ["Ida · Las Rozas", ""],
    ["Vuelta · Las Rozas", ""],
    ["Vuelta · Moncloa", ""]
  ]);
  summary.getRange("B6:B9").setFormulas([
    ['=COUNTIFS(Invitados!D2:D,"si",Invitados!F2:F,"moncloa")'],
    ['=COUNTIFS(Invitados!D2:D,"si",Invitados!F2:F,"las_rozas")'],
    ['=COUNTIFS(Invitados!D2:D,"si",Invitados!G2:G,"las_rozas")'],
    ['=COUNTIFS(Invitados!D2:D,"si",Invitados!G2:G,"moncloa")']
  ]);
  summary.getRange("A1:B1").setFontWeight("bold");
  summary.getRange("A5:B5").setFontWeight("bold");
  summary.autoResizeColumns(1, 2);
}

function guestsSheet_() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(GUESTS_SHEET_NAME);
  if (!sheet) {
    throw new Error('No existe la pestaña "' + GUESTS_SHEET_NAME + '".');
  }
  return sheet;
}

function readGuests_(sheet) {
  const data = sheet.getDataRange().getValues();
  const headers = (data[0] || []).map(value => String(value).trim());
  if (GUEST_HEADERS.some((header, index) => headers[index] !== header)) {
    throw new Error("Las columnas de Invitados no coinciden con el esquema esperado.");
  }

  const columns = {};
  GUEST_HEADERS.forEach((header, index) => {
    columns[header] = index;
  });

  return {
    columns: columns,
    rows: data.slice(1).map((row, index) => {
      const values = row.slice();
      values._rowNumber = index + 2;
      return values;
    })
  };
}

function findUniqueGuest_(rows, columns, guestId) {
  const matches = rows.filter(row => String(row[columns.id]).trim() === guestId);
  if (matches.length > 1) {
    throw new Error("El identificador de invitado está duplicado en la hoja.");
  }
  return matches[0] || null;
}

function normalize_(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function sheetText_(value) {
  const text = String(value).trim();
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function respond_(value, callback) {
  if (callback) {
    if (!/^cb_[a-f0-9]+$/.test(callback)) {
      return ContentService
        .createTextOutput("/* callback no válido */")
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService
      .createTextOutput(callback + "(" + JSON.stringify(value) + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return json_(value);
}

function json_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
