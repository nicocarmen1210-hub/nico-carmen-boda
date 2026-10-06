// Google Apps Script para buscar invitados y guardar RSVP.
// Google Sheet: pestaña "Invitados"
// Columnas: id | nombre | maxGuests | confirmado | acompañante | alergias | mensaje | fechaRespuesta

const SHEET_ID = "PEGA_AQUI_EL_ID_DE_TU_GOOGLE_SHEET";
const SHEET_NAME = "Invitados";

function sheet_(){return SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);}

function doGet(e){
  const action=(e.parameter.action||"").toLowerCase();
  if(action!=="search") return json_({ok:false,error:"Acción no válida"});
  const q=normalize_(e.parameter.q||"");
  if(q.length<3) return json_({ok:true,guests:[]});
  const rows=sheet_().getDataRange().getValues(), guests=[];
  for(let i=1;i<rows.length;i++){
    const id=String(rows[i][0]||""), name=String(rows[i][1]||"");
    if(normalize_(name).includes(q)) guests.push({id,name,maxGuests:Number(rows[i][2]||1)});
    if(guests.length>=5) break;
  }
  return json_({ok:true,guests});
}

function doPost(e){
  try{
    const data=JSON.parse(e.postData.contents||"{}");
    if(data.action!=="rsvp") return json_({ok:false,error:"Acción no válida"});
    const sh=sheet_(), rows=sh.getDataRange().getValues();
    let row=-1;
    for(let i=1;i<rows.length;i++) if(String(rows[i][0])===String(data.guestId)){row=i+1;break;}
    if(row===-1) return json_({ok:false,error:"Invitado no encontrado"});
    sh.getRange(row,4,1,5).setValues([[
      data.attendance==="yes"?"Sí":"No",
      data.companion||"",data.allergies||"",data.message||"",new Date()
    ]]);
    return json_({ok:true});
  }catch(err){return json_({ok:false,error:err.message});}
}

function normalize_(v){return String(v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();}
function json_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);}
