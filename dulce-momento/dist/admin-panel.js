import {localMode,localRequest,localAuthenticated} from './local-admin.js';
import {mergeContacts,directory,purchaseStats,eligibleRecipients,recordInquiry,inactivityDays} from './crm.js';
import {BASE_PATH} from './seo.js';
import {marketingPeople,campaignAudience} from './marketing.js';
import {customersView,customerRow,campaignsView,marketingStatsView,audienceView,transportSettingsView} from './marketing-views.js';

const KEYS={contacts:'dm-contacts',campaigns:'dm-campaigns',orders:'dm-orders',lastOrder:'dm-last-order',customers:'dm-admin-customers',config:'dm-admin-config-v3',session:'dm-admin-session-v3'};
const DEFAULT_ADMIN={username:'admin',salt:'c4b61fc7d84025e891fa23b76d034a2b',passwordHash:'3f1a96f394ba1b68cc2070a10a05699757fec0e55c8e0b919fa7e23d0d8e3dc0',failedAttempts:0,lockedUntil:0,mustChangePassword:false};
const SECTIONS=[
 {path:'/admin',label:'Resumen'},
 {path:'/admin/contactos',label:'Contactos'},
 {path:'/admin/clientes',label:'Clientes'},
 {path:'/admin/campanas',label:'Campañas'},
 {path:'/admin/pedidos',label:'Pedidos'},
 {path:'/admin/configuracion',label:'Configuración'}
];
const ORDER_STATUSES=['Pedido recibido','Pago confirmado','En preparación','Listo','En camino','Entregado'];
const CONTACT_STATUSES=['Nueva','Pendiente','Atendida','En seguimiento'];
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const clean=value=>String(value??'').replace(/\s+/g,' ').trim();
const normalizeEmail=value=>clean(value).toLowerCase();
const isDemoEmail=value=>/@(?:[^@]+\.)?example\.com$/i.test(normalizeEmail(value));
const routeUrl=path=>`${BASE_PATH}${path}`;
let contactsPage=0;
const PAGE_SIZE=10;
const DEMO_CUSTOMERS=[
 ['Ana Torres','ana.torres@example.com','2026-01-10','activo','nuevo'],
 ['Lucía Pérez','lucia.perez@example.com','2026-01-12','activo','recurrente'],
 ['Carla Mendoza','carla.mendoza@example.com','2026-01-15','activo','nuevo'],
 ['Sofía Ramírez','sofia.ramirez@example.com','2026-01-18','activo','inactivo'],
 ['Valeria Castro','valeria.castro@example.com','2026-01-20','activo','recurrente'],
 ['Diego Flores','diego.flores@example.com','2026-01-23','inactivo','inactivo'],
 ['Camila Vega','camila.vega@example.com','2026-01-25','activo','nuevo'],
 ['Andrea Ruiz','andrea.ruiz@example.com','2026-01-28','activo','recurrente']
].map(([name,email,date,status,segment],index)=>({id:`demo-client-${index+1}`,name,email,registeredAt:`${date}T10:00:00.000Z`,status,segment,marketingConsent:false,consentDate:null,consentSource:null,campaignHistory:[],isDemo:true}));
const emailCard=(heading,content)=>`<div style="margin:0;background:#fbf6ee;padding:24px 12px"><div style="max-width:600px;margin:0 auto;background:#fffaf2;padding:32px 24px;border-radius:16px;color:#493329;font:16px/1.6 Arial,sans-serif"><p style="color:#b55740;font:600 13px Arial,sans-serif;letter-spacing:2px">DULCE MOMENTO</p><h1 style="color:#493329;font:600 28px/1.2 Georgia,serif">${heading}</h1>${content}</div></div>`;
const previewDoc=html=>`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'"></head><body style="margin:0">${html}</body></html>`;
const DEMO_CAMPAIGNS=[
 {id:'template-welcome',name:'Bienvenida',subject:'¡Bienvenido a Dulce Momento!',html:emailCard('¡Bienvenido a Dulce Momento!','<p>Gracias por acompañarnos. Descubre nuestros kekes artesanales y encuentra inspiración para tu próximo momento especial.</p>'),text:'¡Bienvenido a Dulce Momento! Gracias por acompañarnos. Descubre nuestros kekes artesanales.',segment:'nuevo',status:'Borrador',isDemo:true},
 {id:'template-news',name:'Novedades dulces',subject:'Descubre nuestros sabores favoritos.',html:emailCard('Novedades dulces','<p>Explora el catálogo de Dulce Momento y descubre opciones para compartir en tus celebraciones.</p>'),text:'Explora el catálogo de Dulce Momento y descubre nuestros sabores.',segment:'todos_consentidos',status:'Borrador',isDemo:true},
 {id:'template-returning',name:'Clientes recurrentes',subject:'Tenemos algo especial para ti.',html:emailCard('Gracias por volver','<p>Gracias por elegir Dulce Momento para tus celebraciones. Nos alegra ser parte de esos momentos especiales.</p>'),text:'Gracias por volver a elegir Dulce Momento. Nos alegra acompañar tus momentos especiales.',segment:'recurrente',status:'Borrador',isDemo:true}
];
const apiState={mode:false,data:null,status:null};

function readList(key){
 try{
  const stored=localStorage.getItem(key);
  if(stored===null){
   if(key===KEYS.customers)return seedCustomers();
   if(key===KEYS.campaigns){localStorage.setItem(key,JSON.stringify(DEMO_CAMPAIGNS));return DEMO_CAMPAIGNS.map(item=>({...item}));}
   return [];
  }
  const value=JSON.parse(stored);
  if(Array.isArray(value))return value;
  console.error(`El contenido guardado en ${key} no tiene el formato esperado.`);
  return [];
 }catch(error){
  console.error(`No se pudo leer ${key} del almacenamiento local.`,error);
  return [];
 }
}
function seedCustomers(){
 const customers=DEMO_CUSTOMERS.map(item=>({...item,segment:'consulta'}));
 try{localStorage.setItem(KEYS.customers,JSON.stringify(customers));}catch(error){console.error('No se pudieron inicializar los clientes demostrativos.',error);}
 return customers;
}
function writeList(key,value){
 try{localStorage.setItem(key,JSON.stringify(value));return true;}
 catch(error){showMessage(`No se pudieron guardar los cambios en este dispositivo: ${error.message}`,'error');return false;}
}
function readConfig(){
 if(typeof localStorage==='undefined')return null;
 try{return JSON.parse(localStorage.getItem(KEYS.config)||'null')||{...DEFAULT_ADMIN};}
 catch(error){console.error('No se pudo leer la configuración administrativa.',error);return null;}
}
function writeConfig(value){
 try{localStorage.setItem(KEYS.config,JSON.stringify(value));return true;}
 catch(error){showMessage(`No se pudo guardar la configuración: ${error.message}`,'error');return false;}
}
function readSession(){
 if(typeof sessionStorage==='undefined')return null;
 try{return JSON.parse(sessionStorage.getItem(KEYS.session)||'null');}
 catch(error){console.error('No se pudo leer la sesión administrativa.',error);return null;}
}
function showMessage(message,type='notice'){
 const target=document.querySelector('#panel-message');
 if(target)target.innerHTML=`<p class="dm-admin-message ${type}">${esc(message)}</p>`;
 else window.alert(message);
}
function emitUpdated(){
 document.dispatchEvent(new CustomEvent('admin-panel-updated'));
}
function hashPassword(password,salt){
 return globalThis.crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits'])
  .then(key=>globalThis.crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new Uint8Array(salt),iterations:180000},key,256))
  .then(bits=>Array.from(new Uint8Array(bits),byte=>byte.toString(16).padStart(2,'0')).join(''));
}
function createSalt(){
 const salt=new Uint8Array(16);
 globalThis.crypto.getRandomValues(salt);
 return Array.from(salt,byte=>byte.toString(16).padStart(2,'0')).join('');
}
function bytesFromHex(value){
 return value.match(/.{2}/g)?.map(byte=>parseInt(byte,16))||[];
}
function isAuthenticated(){
 return Boolean(readSession()?.authenticated);
}
function statusClass(status){
 return status==='Atendida'||status==='Entregado'?'done':status==='Pendiente'||status==='En seguimiento'||status==='En preparación'?'pending':'new';
}
function money(value){
 return `S/ ${Number(value||0).toFixed(2)}`;
}
function getOrders(){
 if(apiState.mode)return [...(apiState.data?.orders||[]),...readList(KEYS.orders).filter(order=>order.isDemo===true&&!(apiState.data?.orders||[]).some(remote=>remote.orderId===order.orderId))];
 const orders=readList(KEYS.orders);
 try{
  const last=JSON.parse(localStorage.getItem(KEYS.lastOrder)||'null');
  return last?.orderId&&!orders.some(order=>order.orderId===last.orderId)?[last,...orders]:orders;
 }catch(error){
  console.error('No se pudo leer el último pedido.',error);
  return orders;
 }
}
function nav(active){
 return `<nav class="dm-admin-nav" aria-label="Navegación administrativa">${SECTIONS.map(section=>`<a class="dm-admin-link ${section.path===active?'active':''}" href="${routeUrl(section.path)}" data-link>${esc(section.label)}</a>`).join('')}<button type="button" class="dm-admin-link" data-panel-action="logout">Cerrar sesión</button></nav>`;
}
function shell(path,content){
 const section=SECTIONS.find(item=>item.path===path)||SECTIONS[0];
 return `<style>
 .dm-admin-layout{display:grid;grid-template-columns:245px minmax(0,1fr);gap:1.25rem;padding:1.5rem clamp(1rem,3vw,2.5rem);min-height:75vh;color:var(--ink)}
 .dm-admin-sidebar,.dm-admin-card,.dm-admin-stat{background:var(--paper);border:1px solid var(--line);border-radius:20px;box-shadow:0 10px 30px rgba(73,51,41,.05)}
 .dm-admin-sidebar{padding:1rem;height:max-content;position:sticky;top:1rem}
 .dm-admin-brand{padding:.8rem .7rem 1.2rem}.dm-admin-brand strong{display:block;font:600 1.35rem var(--serif)}.dm-admin-brand small{color:var(--muted)}
 .dm-admin-nav{display:grid;gap:.35rem}.dm-admin-link{display:block;width:100%;padding:.75rem .85rem;border:0;border-radius:11px;background:transparent;color:var(--ink);font:500 1rem var(--sans);text-align:left;text-decoration:none;cursor:pointer}.dm-admin-link:hover,.dm-admin-link.active{background:var(--peach);color:var(--rust-dark)}
 .dm-admin-content{min-width:0}.dm-admin-heading{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:1rem}.dm-admin-heading h1{margin:.25rem 0;font-size:clamp(1.8rem,3vw,2.5rem)}
 .dm-admin-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}.dm-admin-card{padding:1.15rem;min-width:0}.dm-admin-card h2{margin:.1rem 0 1rem;font-size:1.25rem}.dm-admin-card.full{grid-column:1/-1}
 .dm-admin-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.8rem;margin-bottom:1rem}.dm-admin-stat{padding:1rem}.dm-admin-stat span{display:block;color:var(--muted);font-size:.85rem}.dm-admin-stat strong{display:block;margin-top:.3rem;font:600 1.8rem var(--serif)}
 .dm-admin-form,.dm-admin-filters{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.8rem}.dm-admin-filters{grid-template-columns:repeat(5,minmax(120px,1fr));margin-bottom:1rem}.dm-admin-field{display:grid;gap:.35rem}.dm-admin-field.full{grid-column:1/-1}.dm-admin-field label,.dm-admin-label{font-weight:600}.dm-admin-input,.dm-admin-select,.dm-admin-textarea{width:100%;padding:.68rem .75rem;border:1px solid var(--line);border-radius:10px;background:#fff;color:var(--ink);font:inherit}.dm-admin-textarea{min-height:90px;resize:vertical}
 .dm-admin-actions{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center}.dm-admin-button{padding:.55rem .75rem;border:1px solid var(--line);border-radius:10px;background:#fff;color:var(--ink);font:600 .9rem var(--sans);cursor:pointer}.dm-admin-button:hover{background:var(--peach)}.dm-admin-button.primary{background:var(--rust);border-color:var(--rust);color:white}.dm-admin-button.danger{color:#8e302c}
 .dm-admin-table-wrap{overflow:auto}.dm-admin-table{width:100%;border-collapse:collapse;font-size:.92rem}.dm-admin-table th,.dm-admin-table td{padding:.7rem .55rem;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}.dm-admin-table th{font-size:.78rem;color:var(--muted);text-transform:uppercase;white-space:nowrap}.dm-admin-table td details summary{cursor:pointer;color:var(--rust-dark)}.dm-admin-table td details p{min-width:180px;max-width:360px;white-space:pre-wrap;overflow-wrap:anywhere}
 .dm-admin-tag{display:inline-block;padding:.25rem .6rem;border-radius:999px;background:#fce8e5;font-size:.78rem;font-weight:700;white-space:nowrap}.dm-admin-tag.pending{background:#fff0d8;color:#835512}.dm-admin-tag.done{background:#e1f1e8;color:#286145}
 .dm-admin-list{display:grid;gap:.7rem}.dm-admin-list-item{display:flex;justify-content:space-between;gap:1rem;padding:.75rem 0;border-bottom:1px solid var(--line)}.dm-admin-list-item:last-child{border-bottom:0}.dm-admin-muted{color:var(--muted)}.dm-admin-message{padding:.7rem .85rem;border-radius:10px;background:#e7f4ec}.dm-admin-message.error{background:#fce8e5;color:#8e302c}.dm-admin-pagination{display:flex;align-items:center;justify-content:flex-end;gap:.7rem;margin-top:1rem}
 .dm-admin-auth-stage{min-height:100svh;display:grid;place-items:center;padding:1.25rem;background:var(--bg)}.dm-admin-auth{width:min(420px,100%);min-width:0;margin:0;padding:clamp(1.25rem,5vw,2rem);background:var(--paper);border:1px solid var(--line);border-radius:22px;box-shadow:0 18px 42px rgba(73,51,41,.08)}.dm-admin-auth h1{font-size:2rem}.dm-admin-auth .dm-admin-form{grid-template-columns:minmax(0,1fr);gap:1rem}.dm-admin-auth .dm-admin-field,.dm-admin-auth .dm-admin-input,.dm-admin-auth .dm-admin-button{width:100%;min-width:0}.dm-admin-auth .dm-admin-button{min-height:48px}.dm-admin-auth .dm-admin-security-note{padding:.75rem;border-radius:10px;background:#fff1de;color:#704f28;font-size:.9rem}.dm-admin-auth #panel-message{min-width:0;overflow-wrap:anywhere}
 @media(max-width:900px){.dm-admin-layout{grid-template-columns:1fr}.dm-admin-sidebar{position:static}.dm-admin-nav{grid-template-columns:repeat(3,minmax(0,1fr))}.dm-admin-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.dm-admin-filters{grid-template-columns:repeat(2,minmax(0,1fr))}}
 @media(max-width:560px){.dm-admin-nav{grid-template-columns:repeat(2,minmax(0,1fr))}.dm-admin-grid,.dm-admin-form,.dm-admin-filters{grid-template-columns:1fr}.dm-admin-card.full,.dm-admin-field.full{grid-column:auto}.dm-admin-heading{align-items:flex-start;flex-direction:column}}
 </style><section class="dm-admin-layout"><aside class="dm-admin-sidebar"><div class="dm-admin-brand"><strong>Dulce Momento</strong><small>Panel administrativo · ${esc(section.label)}</small></div>${nav(path)}</aside><div class="dm-admin-content"><header class="dm-admin-heading"><div><span class="eyebrow">ADMINISTRACIÓN</span><h1>${esc(section.label)}</h1></div><button type="button" class="dm-admin-button" data-panel-action="logout">Cerrar sesión</button></header>${content}</div></section>`;
}
function authView(config){
 return `<style>
 .dm-admin-auth-stage{min-height:100vh;min-height:100svh;display:grid;place-items:center;padding:1rem;background:var(--bg,#fcf9f3);color:var(--ink,#493329);font-family:var(--sans,Arial,sans-serif)}
 .dm-admin-auth{box-sizing:border-box;width:min(420px,100%);min-width:0;margin:0;padding:clamp(1.25rem,5vw,2rem);background:var(--paper,#fffdf9);border:1px solid var(--line,#e7dfd3);border-radius:22px;box-shadow:0 18px 42px rgba(73,51,41,.08)}
 .dm-admin-auth h1{margin:.35rem 0 1rem;font:600 clamp(1.8rem,7vw,2.15rem)/1.2 var(--serif,Georgia,serif)}
 .dm-admin-auth .dm-admin-security-note{margin:0 0 1.25rem;padding:.75rem;border-radius:10px;background:#fff1de;color:#704f28;font-size:.9rem;line-height:1.5}
 .dm-admin-auth .dm-admin-form{display:grid;grid-template-columns:minmax(0,1fr);gap:1rem}
 .dm-admin-auth .dm-admin-field{display:grid;gap:.4rem;min-width:0}
 .dm-admin-auth .dm-admin-field label{font-weight:600}
 .dm-admin-auth .dm-admin-input{box-sizing:border-box;width:100%;min-width:0;min-height:46px;padding:.7rem .8rem;border:1px solid var(--line,#e7dfd3);border-radius:10px;background:white;color:var(--ink,#493329);font:inherit}
 .dm-admin-auth .dm-admin-input:focus-visible{outline:3px solid rgba(173,82,60,.25);border-color:var(--rust,#ad523c)}
 .dm-admin-auth .dm-admin-button{width:100%;min-height:48px;padding:.75rem 1rem;border:0;border-radius:11px;background:var(--rust,#ad523c);color:white;font:600 1rem var(--sans,Arial,sans-serif);cursor:pointer}
 .dm-admin-auth .dm-admin-button:hover{background:var(--rust-dark,#8e3e2a)}
 .dm-admin-auth #panel-message{min-width:0;overflow-wrap:anywhere}
 .dm-admin-auth #panel-message .dm-admin-message{margin:.8rem 0 0;padding:.75rem;border-radius:10px;background:#fff1de;color:#704f28}
 .dm-admin-auth #panel-message .dm-admin-message.error{background:#fff0ed;color:#8e302c}
 </style><div class="dm-admin-auth-stage"><section class="dm-admin-auth"><span class="eyebrow">DULCE MOMENTO · ADMINISTRACIÓN</span><h1>Panel administrativo</h1><p class="dm-admin-security-note">${localMode()?'Acceso de presentación. Los datos se guardan solo en este navegador; este acceso no es seguridad de producción.':'Ingresa con las credenciales configuradas en el servidor.'}</p><form id="panel-login-form" class="dm-admin-form"><div class="dm-admin-field full"><label for="panel-username">Usuario</label><input id="panel-username" class="dm-admin-input" name="username" required autocomplete="username"></div><div class="dm-admin-field full"><label for="panel-password">Contraseña</label><input id="panel-password" class="dm-admin-input" type="password" name="password" required autocomplete="current-password"></div><button class="dm-admin-button primary" type="submit">Ingresar</button></form><div id="panel-message" aria-live="polite"></div></section></div>`;
}
function summaryView(){
 const contacts=contactRecords();
 const orders=getOrders();
 const campaigns=apiState.mode?(apiState.data?.campaigns||[]):readList(KEYS.campaigns);
 const newest=contacts.slice().sort((a,b)=>new Date(b.lastInteractionAt||b.createdAt)-new Date(a.lastInteractionAt||a.createdAt)).slice(0,5);
 const open=contacts.filter(contact=>['Nueva','Pendiente','En seguimiento'].includes(contact.status||'Nueva')).length;
 return `<div class="dm-admin-stats"><article class="dm-admin-stat"><span>Contactos</span><strong>${contacts.length}</strong></article><article class="dm-admin-stat"><span>Consultas abiertas</span><strong>${open}</strong></article><article class="dm-admin-stat"><span>Pedidos registrados</span><strong>${orders.length}</strong></article><article class="dm-admin-stat"><span>Campañas guardadas</span><strong>${campaigns.length}</strong></article></div><div class="dm-admin-grid"><section class="dm-admin-card"><h2>Actividad reciente</h2><div class="dm-admin-list">${newest.length?newest.map(contact=>`<div class="dm-admin-list-item"><span><strong>${esc(contact.name)} ${esc(contact.surname)}</strong><br><small>${esc(contact.email)}</small></span><span class="dm-admin-tag ${statusClass(contact.status)}">${esc(contact.status||'Nueva')}</span></div>`).join(''):'<p class="dm-admin-muted">Todavía no hay consultas registradas.</p>'}</div></section><section class="dm-admin-card"><h2>Segmentación de clientes</h2>${['consulta','nuevo','recurrente'].map(type=>`<div class="dm-admin-list-item"><span>${esc(type)}</span><strong>${allPeople().filter(person=>person.segment===type).length}</strong></div>`).join('')}</section><section class="dm-admin-card full"><h2>Accesos rápidos</h2><div class="dm-admin-actions">${SECTIONS.slice(1).map(section=>`<a class="dm-admin-button" href="${routeUrl(section.path)}" data-link>${esc(section.label)}</a>`).join('')}</div></section></div>`;
}
function contactRows(contacts){
 if(!contacts.length)return '<tr><td colspan="8" class="dm-admin-muted">No hay contactos que coincidan con los filtros.</td></tr>';
 return contacts.map(contact=>`<tr><td>${esc(contact.name)} ${esc(contact.surname)}</td><td>${esc(contact.email)}</td><td>${esc(contact.segment==='consulta'?'Solo consulta':contact.segment)}</td><td>${esc(contact.queryType||'Otra consulta')}</td><td><span class="dm-admin-tag ${statusClass(contact.status)}">${esc(contact.status||'Nueva')}</span></td><td>${contact.marketingConsent?'Sí':'No'}</td><td><details><summary>Ver mensaje</summary>${(contact.history?.length?contact.history:[{summary:contact.message,at:contact.createdAt,queryType:contact.queryType}]).map(entry=>`<p>${esc(entry.at)} · ${esc(entry.queryType||entry.type)}<br>${esc(entry.summary)}</p>`).join('')}<small>Registro: ${esc(contact.createdAt||'—')}<br>Última interacción: ${esc(contact.lastInteractionAt||'—')}</small></details></td><td><div class="dm-admin-actions"><button class="dm-admin-button" type="button" data-panel-action="edit-contact" data-id="${esc(contact.id)}">Editar</button><button class="dm-admin-button danger" type="button" data-panel-action="delete-contact" data-id="${esc(contact.id)}">Eliminar</button></div></td></tr>`).join('');
}
function contactsView(){
 const contacts=matchingContacts();
 return `<section class="dm-admin-card"><h2>Directorio de contactos</h2><form id="panel-contact-form" class="dm-admin-form"><input type="hidden" name="id"><div class="dm-admin-field"><label>Nombre</label><input class="dm-admin-input" name="name" minlength="3" required></div><div class="dm-admin-field"><label>Apellido</label><input class="dm-admin-input" name="surname" minlength="2" required></div><div class="dm-admin-field"><label>Correo</label><input class="dm-admin-input" type="email" name="email" required></div><div class="dm-admin-field"><label>Tipo de consulta</label><input class="dm-admin-input" name="queryType" value="Otra consulta" required></div><div class="dm-admin-field"><label>Estado</label><select class="dm-admin-select" name="status">${CONTACT_STATUSES.map(status=>`<option>${status}</option>`).join('')}</select></div><div class="dm-admin-field full"><label>Mensaje / nota administrativa</label><textarea class="dm-admin-textarea" name="message" minlength="10" maxlength="2000" required></textarea></div><p class="dm-admin-muted">El consentimiento se obtiene en el formulario público. Guardar una nota no lo modifica.</p><div class="dm-admin-actions"><button class="dm-admin-button primary" type="submit">Guardar contacto</button><button class="dm-admin-button" type="reset" data-panel-action="reset-contact">Limpiar</button></div></form><div id="panel-message" aria-live="polite"></div></section><section class="dm-admin-card full" style="margin-top:1rem"><h2>Contactos registrados</h2><div class="dm-admin-filters"><input class="dm-admin-input" type="search" name="search" data-panel-filter="search" placeholder="Nombre, apellido o correo"><select class="dm-admin-select" data-panel-filter="relation"><option value="consulta">Solo consultas, sin compras</option><option value="">Todas las consultas</option><option value="comprador">Consultas de compradores</option></select><input class="dm-admin-input" type="search" data-panel-filter="queryType" placeholder="Tipo de consulta"><select class="dm-admin-select" data-panel-filter="status"><option value="">Todos los estados</option>${CONTACT_STATUSES.map(status=>`<option>${status}</option>`).join('')}</select><select class="dm-admin-select" data-panel-filter="consent"><option value="">Todo consentimiento</option><option value="yes">Aceptado</option><option value="no">No aceptado</option></select><label class="dm-admin-field">Desde<input class="dm-admin-input" type="date" data-panel-filter="from"></label><label class="dm-admin-field">Hasta<input class="dm-admin-input" type="date" data-panel-filter="to"></label><button class="dm-admin-button" type="button" data-panel-action="export-contacts">Exportar CSV</button></div><div class="dm-admin-table-wrap"><table class="dm-admin-table"><thead><tr><th>Nombre</th><th>Correo</th><th>Cliente</th><th>Consulta</th><th>Estado</th><th>Consentimiento</th><th>Detalle</th><th>Acciones</th></tr></thead><tbody id="panel-contact-rows">${contactRows(contacts.slice(0,PAGE_SIZE))}</tbody></table></div><div class="dm-admin-pagination"><button class="dm-admin-button" type="button" data-panel-action="page-prev">Anterior</button><span id="panel-page-label">Página 1</span><button class="dm-admin-button" type="button" data-panel-action="page-next">Siguiente</button></div></section>`;
}
function crmData(){return apiState.mode?(apiState.data||{}):{customers:readList(KEYS.customers),contacts:mergeContacts(readList(KEYS.contacts)),orders:getOrders(),settings:{inactivityDays:inactivityDays(readConfig()?.inactivityDays)}};}
function allPeople(){const data=crmData();return marketingPeople(data);}
function contactRecords(){const data=crmData();const people=allPeople();return (data.contacts||[]).map(contact=>{const person=people.find(item=>item.email===normalizeEmail(contact.email));return {...contact,marketingConsent:person?.marketingConsent===true,segment:person?.segment||'consulta',purchaseCount:person?.purchaseCount||0};});}
function campaignRecipients(campaign){return eligibleRecipients(crmData(),campaign);}
function clientRecords(){return allPeople();}
function refreshCustomerRows(){
 const target=document.querySelector('#panel-customer-rows');
 if(!target)return;
 const customers=filteredCustomers();
 target.innerHTML=customers.map(clientRow).join('')||'<tr><td colspan="8" class="dm-admin-muted">No hay clientes para estos filtros.</td></tr>';
}
function filteredCustomers(){
 const query=normalizeEmail(document.querySelector('[data-customer-search]')?.value||'');
 const status=document.querySelector('[data-customer-status]')?.value||'';
 const segment=document.querySelector('[data-customer-segment]')?.value||'';
 const consent=document.querySelector('[data-customer-consent]')?.value||'';
 return clientRecords().filter(customer=>(!consent||(consent==='unsubscribed'?customer.unsubscribed:customer.consentAllowed===(consent==='yes')))&&(!query||normalizeEmail(`${customer.name} ${customer.email}`).includes(query))&&(!status||customer.status===status)&&(!segment||(segment==='inactivo'?customer.inactive:customer.segment===segment)));
}
function clientRow(customer){return customerRow(customer);}
function clientsView(){return customersView(filteredCustomers());}
function campaignView(){return campaignsView(crmData());}
function ordersView(){
 const orders=getOrders();
 return `<section class="dm-admin-card"><h2>${apiState.mode?'Pedidos registrados en el servidor':'Pedidos guardados en este navegador'}</h2><div class="dm-admin-table-wrap"><table class="dm-admin-table"><thead><tr><th>Número</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Pago</th><th>Estado</th><th>Actualizar</th></tr></thead><tbody>${orders.map(order=>`<tr><td>${esc(order.orderId)}</td><td>${esc(order.customer?.name)}<br><small>${esc(order.customer?.email)}</small></td><td>${esc(order.createdAt||'—')}</td><td>${money(order.total)}</td><td>${esc(order.paymentMethod)} · ${esc(order.payment?.status)}</td><td><span class="dm-admin-tag ${statusClass(order.status)}">${esc(order.status||'Pedido recibido')}</span></td><td><select class="dm-admin-select" data-panel-order-status="${esc(order.orderId)}">${ORDER_STATUSES.map(status=>`<option ${order.status===status?'selected':''}>${status}</option>`).join('')}</select></td></tr>`).join('')||'<tr><td colspan="7" class="dm-admin-muted">No se han guardado pedidos en este navegador.</td></tr>'}</tbody></table></div><div id="panel-message" aria-live="polite"></div></section>`;
}
function settingsView(){
 if(localMode())return `<div class="dm-admin-grid"><section class="dm-admin-card"><h2>Almacenamiento local</h2><p>Los cambios se guardan en este navegador. No se sincronizan con un servidor y se pierden si borras los datos del sitio. El acceso de presentación no protege información confidencial.</p><p>Las credenciales públicas se configuran en local-admin.js. No uses contraseñas reales.</p></section><section class="dm-admin-card"><h2>Inactividad de compradores</h2><form id="panel-inactivity-form"><input class="dm-admin-input" name="inactivityDays" type="number" min="1" max="3650" required value="${inactivityDays(crmData().settings?.inactivityDays)}"><button class="dm-admin-button primary">Guardar plazo</button></form><div id="panel-message" aria-live="polite"></div></section></div>`;
 const config=readConfig();
 const credentialForm=apiState.mode?'<p class="dm-admin-security-note">La cuenta del backend se gestiona mediante ADMIN_USERNAME y ADMIN_PASSWORD en el entorno seguro del servidor; no se almacena ni modifica desde este navegador.</p>':`<form id="panel-password-form" class="dm-admin-form"><div class="dm-admin-field full"><label>Contraseña actual</label><input class="dm-admin-input" type="password" name="currentPassword" required autocomplete="current-password"></div><div class="dm-admin-field"><label>Nueva contraseña (mínimo 12 caracteres)</label><input class="dm-admin-input" type="password" name="newPassword" minlength="12" required autocomplete="new-password"></div><div class="dm-admin-field"><label>Confirmar contraseña</label><input class="dm-admin-input" type="password" name="confirmation" minlength="12" required autocomplete="new-password"></div><button class="dm-admin-button primary" type="submit">Actualizar contraseña local</button></form>`;
 const storageNote=apiState.mode?'Contactos, clientes, campañas y pedidos registrados del backend se consultan en el servidor.':'Los datos se guardan en este navegador.';
 return `<div class="dm-admin-grid"><section class="dm-admin-card"><h2>${apiState.mode?'Credenciales del servidor':'Cambiar contraseña'}</h2>${credentialForm}<div id="panel-message" aria-live="polite"></div></section><section class="dm-admin-card"><h2>Inactividad de compradores</h2><form id="panel-inactivity-form" class="dm-admin-form"><label class="dm-admin-field">Días desde la última compra<input class="dm-admin-input" type="number" name="inactivityDays" min="1" max="3650" required value="${inactivityDays(crmData().settings?.inactivityDays)}"></label><button class="dm-admin-button primary">Guardar plazo</button></form><p>La inactividad no cambia el segmento nuevo o recurrente ni el consentimiento comercial.</p><h2>Almacenamiento y sesión</h2><p>${apiState.mode?'Sesión autenticada del backend.':'Usuario local: '}<strong>${apiState.mode?'servidor':esc(config?.username||'—')}</strong></p><p>La sesión expira al cerrar la pestaña o al cerrar sesión.</p><p class="dm-admin-security-note">${esc(storageNote)}</p><div class="dm-admin-actions"><button class="dm-admin-button" type="button" data-panel-action="export-contacts">Exportar contactos CSV</button><button class="dm-admin-button" type="button" data-panel-action="logout">Cerrar sesión</button></div></section></div>`;
}

function viewFor(path){
 if(path==='/admin/contactos')return contactsView();
 if(path==='/admin/clientes')return clientsView();
 if(path==='/admin/campanas')return campaignView();
 if(path==='/admin/pedidos')return ordersView();
 if(path==='/admin/configuracion')return settingsView()+transportSettingsView(apiState.status||{});
 return marketingStatsView(crmData())+summaryView();
}
const apiBase=()=>String(globalThis.DM_ADMIN_API_URL||document.querySelector('meta[name="admin-api-origin"]')?.content||'').replace(/\/$/,'');
async function apiRequest(endpoint,options={}){
 if(localMode())return localRequest(endpoint,options);
 const response=await fetch(`${apiBase()}${endpoint}`,{credentials:'include',...options,headers:{...(options.body?{'Content-Type':'application/json'}:{}),...(options.headers||{})}});
 const result=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(result.error||`El servidor respondió HTTP ${response.status}.`);
 return result;
}
async function loadApiState(){
 const [data,status]=await Promise.all([apiRequest('/api/admin/data'),apiRequest('/api/email/status')]);
 apiState.data=data;
 apiState.status=status;
}
function refreshAdmin(){
 const path=location.pathname.replace(BASE_PATH,'').replace(/\/+$/,'')||'/admin';
 const target=document.querySelector('#main');
 if(target)target.innerHTML=renderAdmin(path);
}
function localCustomerSave(form){
 const fields=Object.fromEntries(new FormData(form));
 const customers=allPeople();
 const id=String(fields.id||'');
 const email=normalizeEmail(fields.email);
 if(customers.some(item=>normalizeEmail(item.email)===email&&item.id!==id)){showMessage('Ya existe un cliente con ese correo.','error');return;}
 const consent=form.elements.marketingConsent.checked&&!customers.find(item=>item.id===id)?.unsubscribed;
 if(consent&&isDemoEmail(email)){showMessage('Este correo no admite comunicaciones comerciales.','error');return;}
 if(consent&&(!fields.consentDate||!clean(fields.consentSource))){showMessage('Registra la fecha y la fuente verificable del consentimiento.','error');return;}
 const old=customers.find(item=>item.id===id);
 if(old&&normalizeEmail(old.email)!==email){showMessage('El correo vinculado al historial no puede modificarse.','error');return;}
 const now=new Date().toISOString();
 const customer={...old,id:id||`demo-client-${Date.now()}`,name:clean(fields.name),email,registeredAt:fields.registeredAt?new Date(`${fields.registeredAt}T12:00:00`).toISOString():old?.registeredAt||now,status:fields.status,segment:fields.segment,marketingConsent:consent,consentDate:consent?new Date(`${fields.consentDate}T12:00:00`).toISOString():null,consentSource:consent?clean(fields.consentSource):null,campaignHistory:old?.campaignHistory||[],isDemo:old?.isDemo===true};
 const next=old?customers.map(item=>item.id===id?customer:item):[customer,...customers];
 if(!writeList(KEYS.customers,next))return;
 form.reset();form.elements.id.value='';
 showMessage(old?'Cliente actualizado.':'Cliente guardado.');
 refreshAdmin();
}
async function saveCustomer(form){
 const fields=Object.fromEntries(new FormData(form));
 const old=clientRecords().find(person=>person.id===fields.id);
 const consent=form.elements.marketingConsent.checked;
 const unsubscribed=form.elements.unsubscribed.checked;
 const sample=old?.isDemo||isDemoEmail(fields.email);
 if(consent&&!unsubscribed&&!sample&&(!fields.consentDate||!clean(fields.consentSource))){showMessage('Registra fecha y fuente verificable del consentimiento.','error');return;}
 const consentDate=consent&&fields.consentDate?(old?.consentDate?.slice(0,10)===fields.consentDate?old.consentDate:new Date(fields.consentDate+'T12:00:00').toISOString()):null;
 const customer={name:clean(fields.name),email:normalizeEmail(fields.email),registeredAt:fields.registeredAt?new Date(fields.registeredAt+'T12:00:00').toISOString():undefined,status:fields.status,marketingConsent:consent&&!unsubscribed,unsubscribed,consentDate,consentSource:consent?clean(fields.consentSource):null};
 try{
  await apiRequest(fields.id?'/api/admin/customers/'+encodeURIComponent(fields.id):'/api/admin/customers',{method:fields.id?'PUT':'POST',body:JSON.stringify(customer)});
  await loadApiState();refreshAdmin();showMessage('Cliente guardado correctamente.');
 }catch(error){showMessage(error.message,'error');}
}
function fillCustomerForm(id){
 const customer=clientRecords().find(item=>item.id===id);
 const form=document.querySelector('#panel-customer-form');
 if(!customer||!form)return;
 for(const field of ['id','name','email','registeredAt','status','segment','consentDate','consentSource'])if(form.elements[field])form.elements[field].value=field==='registeredAt'||field==='consentDate'?String(customer[field]||'').slice(0,10):customer[field]||'';
 form.elements.marketingConsent.checked=Boolean(customer.consentAllowed);
 form.elements.unsubscribed.checked=Boolean(customer.unsubscribed);
 form.elements.unsubscribed.disabled=Boolean(customer.unsubscribed);
 form.elements.marketingConsent.disabled=Boolean(customer.unsubscribed);
 form.elements.consentSource.disabled=Boolean(customer.isDemo||customer.unsubscribed);
 form.scrollIntoView({behavior:'smooth',block:'center'});
}
async function deleteCustomer(id){
 if(!window.confirm('¿Eliminar este cliente?'))return;
 try{
  if(apiState.mode){await apiRequest(`/api/admin/customers/${encodeURIComponent(id)}`,{method:'DELETE'});await loadApiState();}
  else{const customers=readList(KEYS.customers);if(!writeList(KEYS.customers,customers.filter(item=>item.id!==id)))return;}
  refreshAdmin();showMessage('Cliente eliminado.');
 }catch(error){showMessage(error.message,'error');}
}
async function deleteCampaign(id){
 if(apiState.mode){
  if(!window.confirm('¿Eliminar esta campaña? Se conservarán las campañas con historial de envío.'))return;
  try{await apiRequest(`/api/admin/campaigns/${encodeURIComponent(id)}`,{method:'DELETE'});await loadApiState();showMessage('Campaña eliminada.');refreshAdmin();}
  catch(error){showMessage(error.message,'error');}
  return;
 }
 deleteById(KEYS.campaigns,id,'esta campaña');
}
export function renderAdmin(path='/admin'){
 const serverSession=localMode()?localAuthenticated():readSession()?.backend===true;
 if(serverSession&&!apiState.mode){
  apiState.mode=true;
  if(!apiState.data)void loadApiState().then(refreshAdmin).catch(error=>{sessionStorage.removeItem(KEYS.session);apiState.mode=false;showMessage(error.message,'error');refreshAdmin();});
 }
 if(localMode()&&!localAuthenticated())return authView(readConfig());
 if(!apiState.mode&&(!readSession()?.backend||!isAuthenticated()))return authView(readConfig());
 if(path==='/admin/contactos')contactsPage=0;
 return shell(path,viewFor(path));
}
function currentFilters(){
 return Object.fromEntries([...document.querySelectorAll('[data-panel-filter]')].map(input=>[input.dataset.panelFilter,input.value]));
}
function matchingContacts(){
 const filters=currentFilters();
 const q=normalizeEmail(filters.search||'');
 return contactRecords().filter(contact=>{
  const name=normalizeEmail(`${contact.name||''} ${contact.surname||''} ${contact.email||''}`);
  const date=String(contact.createdAt||'').slice(0,10);
  return (!q||name.includes(q))
   &&((filters.relation??'consulta')===''||((filters.relation??'consulta')==='consulta'?contact.purchaseCount===0:contact.purchaseCount>0))
   &&(!filters.queryType||normalizeEmail(contact.queryType).includes(normalizeEmail(filters.queryType)))
   &&(!filters.status||contact.status===filters.status)
   &&(!filters.consent||(Boolean(contact.marketingConsent)===(filters.consent==='yes')))
   &&(!filters.from||date>=filters.from)
   &&(!filters.to||date<=filters.to);
 }).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
}
function refreshContactRows(){
 const tbody=document.querySelector('#panel-contact-rows');
 if(!tbody)return;
 const rows=matchingContacts();
 const pages=Math.max(1,Math.ceil(rows.length/PAGE_SIZE));
 contactsPage=Math.max(0,Math.min(contactsPage,pages-1));
 tbody.innerHTML=contactRows(rows.slice(contactsPage*PAGE_SIZE,(contactsPage+1)*PAGE_SIZE));
 const label=document.querySelector('#panel-page-label');
 if(label)label.textContent=`Página ${contactsPage+1} de ${pages} · ${rows.length} contactos`;
}
function csvValue(value){
 const safe=String(value??'').replace(/"/g,'""');
 return `"${/^[\s]*[=+\-@]/.test(safe)?`'${safe}`:safe}"`;
}
function exportContacts(){
 const contacts=matchingContacts();
 if(!contacts.length){showMessage('No hay contactos que coincidan con los filtros.','error');return;}
 const columns=[['Nombre',c=>c.name],['Apellido',c=>c.surname],['Correo',c=>c.email],['Teléfono',c=>c.phone],['Consulta',c=>c.queryType],['Mensaje',c=>c.message],['Relación',c=>c.segment],['Estado',c=>c.status],['Consentimiento',c=>c.marketingConsent?'Sí':'No'],['Registro',c=>c.createdAt],['Última interacción',c=>c.lastInteractionAt]];
 const csv=[columns.map(([label])=>csvValue(label)).join(','),...contacts.map(contact=>columns.map(([,value])=>csvValue(value(contact))).join(','))].join('\r\n');
 const link=document.createElement('a');
 const url=URL.createObjectURL(new Blob(['\ufeff',csv],{type:'text/csv;charset=utf-8'}));
 link.href=url;link.download='contactos-dulce-momento.csv';link.click();URL.revokeObjectURL(url);
 showMessage(`Se exportaron ${contacts.length} contactos filtrados.`);
}
function exportCustomers(){
 const customers=filteredCustomers();
 if(!customers.length){showMessage('No hay clientes que coincidan con los filtros.','error');return;}
 const columns=[['Nombre',customer=>customer.name],['Correo',customer=>customer.email],['Registro',customer=>customer.registeredAt],['Estado',customer=>customer.status],['Segmento',customer=>customer.segment],['Consentimiento',customer=>customer.consentAllowed?'Sí':'No'],['Fecha de consentimiento',customer=>customer.consentDate],['Fuente de consentimiento',customer=>customer.consentSource],['Historial de campañas',customer=>(customer.campaignHistory||[]).map(item=>`${item.campaignId}:${item.status}`).join('; ')]];
 const csv=[columns.map(([label])=>csvValue(label)).join(','),...customers.map(customer=>columns.map(([,value])=>csvValue(value(customer))).join(','))].join('\r\n');
 const link=document.createElement('a');
 const url=URL.createObjectURL(new Blob(['\ufeff',csv],{type:'text/csv;charset=utf-8'}));
 link.href=url;link.download='clientes-dulce-momento.csv';link.click();URL.revokeObjectURL(url);
 showMessage(`Se exportaron ${customers.length} clientes filtrados.`);
}
function fillContactForm(id){
 const contact=contactRecords().find(item=>item.id===id);
 const form=document.querySelector('#panel-contact-form');
 if(!contact||!form)return;
 for(const field of ['id','name','surname','email','customerType','queryType','status','message'])if(form.elements[field])form.elements[field].value=contact[field]||'';
 form.scrollIntoView({behavior:'smooth',block:'center'});
}
async function saveContact(form){
 const input=Object.fromEntries(new FormData(form));
 try{
  if(apiState.mode){await apiRequest('/api/admin/contacts',{method:'POST',body:JSON.stringify(input)});await loadApiState();}
  else{
   const data=crmData();const old=data.contacts.find(item=>item.id===input.id);
   if(old&&normalizeEmail(old.email)!==normalizeEmail(input.email))throw Error('El correo vinculado al historial no puede modificarse.');
   const contact=recordInquiry(data,{...input,marketingConsent:false});contact.status=CONTACT_STATUSES.includes(input.status)?input.status:'Nueva';
   if(!writeList(KEYS.contacts,data.contacts)||!writeList(KEYS.customers,data.customers))return;
  }
  form.reset();form.elements.id.value='';emitUpdated();showMessage('Contacto e historial guardados.');
 }catch(error){showMessage(error.message,'error');}
}
async function deleteById(key,id,label){
 if(!window.confirm(`¿Eliminar ${label}? Esta acción no se puede deshacer.`))return;
 if(apiState.mode&&key===KEYS.contacts){try{await apiRequest('/api/admin/contacts/'+encodeURIComponent(id),{method:'DELETE'});await loadApiState();emitUpdated();}catch(error){showMessage(error.message,'error');}return;}
 const values=readList(key);
 const next=values.filter(value=>value.id!==id);
 if(next.length===values.length){showMessage('No se encontró el registro que deseas eliminar.','error');return;}
 if(!writeList(key,next))return;
 emitUpdated();showMessage(`${label} eliminado.`);
}
async function saveCampaign(form){
 const data=Object.fromEntries(new FormData(form));
 const title=clean(data.title),subject=clean(data.subject),html=String(data.body||'').trim();
 const text=String(data.text||'').trim();
 const segment=clean(data.segment)||'todos_consentidos';
 if(!title||!subject||!html||!text){showMessage('Nombre, asunto, HTML y texto alternativo son obligatorios.','error');return;}
 if(apiState.mode){
  try{
   const campaign={name:title,subject,html,text,segment};
   if(data.id)await apiRequest(`/api/admin/campaigns/${encodeURIComponent(data.id)}`,{method:'PUT',body:JSON.stringify(campaign)});
   else await apiRequest('/api/admin/campaigns',{method:'POST',body:JSON.stringify(campaign)});
   await loadApiState();form.reset();form.elements.id.value='';refreshAdmin();showMessage('Borrador guardado correctamente.');
  }catch(error){showMessage(error.message,'error');}
  return;
 }
 const campaigns=readList(KEYS.campaigns);
 const id=data.id||`CMP-${Date.now()}`;
 const existing=campaigns.find(campaign=>campaign.id===id);
 const now=new Date().toISOString();
 const campaign={...existing,id,title,name:title,subject,body:html,html,text,segment,status:existing?.status||'Borrador',createdAt:existing?.createdAt||now,updatedAt:now,isDemo:existing?.isDemo??true};
 const next=existing?campaigns.map(item=>item.id===id?campaign:item):[campaign,...campaigns];
 if(!writeList(KEYS.campaigns,next))return;
 form.reset();form.elements.id.value='';emitUpdated();showMessage('Borrador de campaña guardado en este navegador. No se envió ningún correo.');
}
function fillCampaignForm(id){
 const campaign=(apiState.mode?apiState.data?.campaigns||[]:readList(KEYS.campaigns)).find(item=>item.id===id);
 const form=document.querySelector('#panel-campaign-form');
 if(!campaign||!form)return;
 for(const field of ['id','subject','segment','text'])if(form.elements[field])form.elements[field].value=campaign[field]||'';
 if(form.elements.title)form.elements.title.value=campaign.name||campaign.title||'';
 if(form.elements.body)form.elements.body.value=campaign.html||campaign.body||'';
 refreshCampaignPreview(campaign.html||campaign.body||'');
 const target=document.querySelector('#panel-draft-audience');if(target)target.innerHTML=audienceView(crmData(),campaign);
 const submit=form.querySelector('button[type="submit"]');if(submit)submit.disabled=['procesada','procesada_con_errores','processing','enviado_al_proveedor'].includes(campaign.status);
 form.scrollIntoView({behavior:'smooth',block:'center'});
}
function refreshCampaignPreview(html){
 document.querySelectorAll('iframe[title^="Vista previa"]').forEach(frame=>{frame.srcdoc=previewDoc(html);});
}
async function updateOrderStatus(orderId,status){
 if(!ORDER_STATUSES.includes(status)){showMessage('El estado seleccionado no es válido.','error');return;}
 if(apiState.mode&&(apiState.data?.orders||[]).some(order=>order.orderId===orderId)){try{await apiRequest('/api/admin/orders/'+encodeURIComponent(orderId),{method:'PUT',body:JSON.stringify({status})});await loadApiState();emitUpdated();}catch(error){showMessage(error.message,'error');}return;}
 const orders=readList(KEYS.orders);
 let next=orders;
 const found=orders.some(order=>order.orderId===orderId);
 if(found)next=orders.map(order=>order.orderId===orderId?{...order,status,lastUpdatedAt:new Date().toISOString()}:order);
 else{
  const last=getOrders().find(order=>order.orderId===orderId);
  if(!last){showMessage('No se encontró el pedido.','error');return;}
  next=[...orders,{...last,status,lastUpdatedAt:new Date().toISOString()}];
 }
 if(!writeList(KEYS.orders,next))return;
 try{
  const last=JSON.parse(localStorage.getItem(KEYS.lastOrder)||'null');
  if(last?.orderId===orderId)localStorage.setItem(KEYS.lastOrder,JSON.stringify({...last,status,lastUpdatedAt:new Date().toISOString()}));
 }catch(error){console.error('No se pudo actualizar la copia del último pedido.',error);}
 showMessage('Estado del pedido actualizado localmente. No se envió notificación al cliente.');
 emitUpdated();
}
async function login(form){
 const data=Object.fromEntries(new FormData(form));
 if(localMode()){try{await apiRequest('/api/admin/login',{method:'POST',body:JSON.stringify(data)});await loadApiState();apiState.mode=true;emitUpdated();}catch(error){showMessage(error.message,'error');}return;}
 let serverStatus;
 try{
  const response=await fetch(`${apiBase()}/api/email/status`,{credentials:'include'});
  if(!response.ok)throw new Error(`No se pudo consultar el backend (HTTP ${response.status}).`);
  serverStatus=await response.json();
 }catch(error){showMessage(`No se pudo conectar con el servidor administrativo: ${error.message}`,'error');return;}
 if(!serverStatus?.backendAvailable){showMessage('El servidor no ofrece una API administrativa válida.','error');return;}
 if(serverStatus?.backendAvailable&&!serverStatus.backendConfigured){
  showMessage(serverStatus.configurationError||'El servidor administrativo no está configurado. Revisa ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_EMAIL y SESSION_SECRET en .env.','error');return;
 }
 try{
  apiState.status=serverStatus;
  await apiRequest('/api/admin/login',{method:'POST',body:JSON.stringify({username:String(data.username||''),password:String(data.password||'')})});
  apiState.mode=true;
  await loadApiState();
  sessionStorage.setItem(KEYS.session,JSON.stringify({backend:true,authenticated:true,createdAt:Date.now()}));
  emitUpdated();
 }catch(error){showMessage(error.message,'error');}
}
async function changePassword(form){
 const data=Object.fromEntries(new FormData(form));
 const config=readConfig();
 if(!config){showMessage('No existe configuración administrativa.','error');return;}
 try{
  const current=await hashPassword(String(data.currentPassword||''),bytesFromHex(config.salt));
  if(current!==config.passwordHash){showMessage('La contraseña actual no coincide.','error');return;}
  const nextPassword=String(data.newPassword||'');
  if(nextPassword.length<12||nextPassword!==data.confirmation){showMessage('La contraseña nueva debe tener 12 caracteres como mínimo y coincidir con la confirmación.','error');return;}
  const salt=createSalt();
  config.salt=salt;config.passwordHash=await hashPassword(nextPassword,bytesFromHex(salt));
  if(writeConfig(config)){form.reset();showMessage('Contraseña local actualizada.');}
 }catch(error){showMessage(`No se pudo cambiar la contraseña: ${error.message}`,'error');}
}
function logout(){
 if(apiState.mode)void apiRequest('/api/admin/logout',{method:'POST'}).catch(error=>console.error('No se pudo cerrar la sesión del servidor.',error));
 sessionStorage.removeItem(KEYS.session);
 apiState.mode=false;apiState.data=null;apiState.status=null;
 emitUpdated();
}
async function duplicateCampaign(id){
 const campaign=(apiState.mode?apiState.data?.campaigns||[]:readList(KEYS.campaigns)).find(item=>item.id===id);
 if(!campaign){showMessage('No se encontró la campaña para duplicar.','error');return;}
 const payload={name:`${campaign.name||campaign.title} (copia)`,subject:campaign.subject,html:campaign.html||campaign.body,text:campaign.text||campaign.body,segment:campaign.segment||'todos_consentidos'};
 try{
  if(apiState.mode){await apiRequest('/api/admin/campaigns',{method:'POST',body:JSON.stringify(payload)});await loadApiState();}
  else{const copies=readList(KEYS.campaigns);copies.unshift({...payload,id:`CMP-${Date.now()}`,title:payload.name,body:payload.html,status:'Borrador',isDemo:true,createdAt:new Date().toISOString()});if(!writeList(KEYS.campaigns,copies))return;}
  refreshAdmin();showMessage('Campaña duplicada como borrador.');
 }catch(error){showMessage(error.message,'error');}
}
async function sendTestCampaign(id){
 if(!apiState.mode){showMessage('La vista previa por correo requiere el servicio de envío configurado.','error');return;}
 const campaign=apiState.data?.campaigns.find(item=>item.id===id);
 if(!campaign)return;
 try{
  const result=await apiRequest('/api/admin/test-email',{method:'POST',body:JSON.stringify({campaignId:id,to:apiState.status?.requestedSender,subject:campaign.subject,html:campaign.html,text:campaign.text,idempotencyKey:`test-${crypto.randomUUID()}`})});
  await loadApiState();refreshAdmin();
  showMessage(`Resend aceptó la vista previa para ${result.recipient}. ID de proveedor: ${result.providerId}. Esto no confirma entrega.`);
 }catch(error){showMessage(error.message,'error');}
}
const processingCampaigns=new Set();
async function sendCampaign(id){
 if(processingCampaigns.has(id))return;
 const campaign=apiState.data?.campaigns.find(item=>item.id===id);if(!campaign)return;
 const audience=campaignAudience(crmData(),campaign);
 const count=audience.filter(person=>person.eligible).length;
 if(!window.confirm('¿Procesar esta campaña para '+count+' destinatario(s) elegibles?'))return;
 processingCampaigns.add(id);
 try{
  const result=await apiRequest('/api/admin/send-campaign',{method:'POST',body:JSON.stringify({campaignId:id,transport:'internal',confirmed:true,idempotencyKey:crypto.randomUUID()})});
  await loadApiState();refreshAdmin();
  showMessage('Campaña procesada: '+result.run.recipientCount+' pendientes de proveedor, '+result.run.excludedCount+' excluidos y '+result.run.results.filter(item=>item.status==='failed').length+' errores.');
 }catch(error){showMessage(error.message,'error');}
 finally{processingCampaigns.delete(id);}
}
export function handleAdminAction(event){
 const action=event.target.closest('[data-panel-action]')?.dataset.panelAction;
 if(!action)return false;
 if(action==='reset-customer'){const form=document.querySelector('#panel-customer-form');form.reset();form.elements.id.value='';for(const name of ['marketingConsent','consentSource','unsubscribed'])form.elements[name].disabled=false;return true;}
 if(action==='reset-campaign'){const form=document.querySelector('#panel-campaign-form');form.reset();form.elements.id.value='';form.querySelector('button[type="submit"]').disabled=false;refreshCampaignPreview('');const target=document.querySelector('#panel-draft-audience');if(target)target.innerHTML=audienceView(crmData(),{segment:'todos_consentidos'});return true;}
 if(action==='logout'){logout();return true;}
 if(action==='export-contacts'){exportContacts();return true;}
 if(action==='export-customers'){exportCustomers();return true;}
 if(action==='edit-contact'){fillContactForm(event.target.closest('[data-panel-action]').dataset.id);return true;}
 if(action==='delete-contact'){deleteById(KEYS.contacts,event.target.closest('[data-panel-action]').dataset.id,'este contacto');return true;}
 if(action==='edit-customer'){fillCustomerForm(event.target.closest('[data-panel-action]').dataset.id);return true;}
 if(action==='delete-customer'){void deleteCustomer(event.target.closest('[data-panel-action]').dataset.id);return true;}
 if(action==='edit-campaign'){fillCampaignForm(event.target.closest('[data-panel-action]').dataset.id);return true;}
 if(action==='delete-campaign'){void deleteCampaign(event.target.closest('[data-panel-action]').dataset.id);return true;}
 if(action==='duplicate-campaign'){void duplicateCampaign(event.target.closest('[data-panel-action]').dataset.id);return true;}
 if(action==='send-test'){void sendTestCampaign(event.target.closest('[data-panel-action]').dataset.id);return true;}
 if(action==='send-campaign'){void sendCampaign(event.target.closest('[data-panel-action]').dataset.id);return true;}
 if(action==='page-prev'){contactsPage=Math.max(0,contactsPage-1);refreshContactRows();return true;}
 if(action==='page-next'){contactsPage++;refreshContactRows();return true;}
 if(action==='reset-contact'){const form=document.querySelector('#panel-contact-form');if(form)form.elements.id.value='';return true;}
 return false;
}
export function handleAdminInput(event){
 if(event.target.matches('[data-customer-search]')){refreshCustomerRows();return true;}
 if(event.target.matches('#panel-campaign-form [name="body"]')){
  refreshCampaignPreview(event.target.value);
  return true;
 }
 if(!event.target.matches('[data-panel-filter]'))return false;
 contactsPage=0;refreshContactRows();return true;
}
export function handleAdminChange(event){
 if(event.target.matches('#panel-campaign-form [name="segment"]')){const target=document.querySelector('#panel-draft-audience');if(target)target.innerHTML=audienceView(crmData(),{segment:event.target.value});return true;}
 if(event.target.matches('[data-customer-status],[data-customer-segment],[data-customer-consent]')){refreshCustomerRows();return true;}
 const control=event.target.closest('[data-panel-order-status]');
 if(control){updateOrderStatus(control.dataset.panelOrderStatus,control.value);return true;}
 return false;
}
export async function handleAdminSubmit(event){
 const form=event.target;
 if(form.id==='panel-login-form'){event.preventDefault();await login(form);return true;}
 if(form.id==='panel-inactivity-form'){
  event.preventDefault();const days=Number(new FormData(form).get('inactivityDays'));
  if(!Number.isInteger(days)||days<1||days>3650){showMessage('El plazo debe ser de 1 a 3650 días.','error');return true;}
  try{if(apiState.mode){await apiRequest('/api/admin/settings',{method:'PUT',body:JSON.stringify({inactivityDays:days})});await loadApiState();}else if(!writeConfig({...readConfig(),inactivityDays:days}))return true;emitUpdated();showMessage('Plazo de inactividad actualizado.');}catch(error){showMessage(error.message,'error');}return true;
 }
 if(form.id==='panel-password-form'){event.preventDefault();await changePassword(form);return true;}
 if(form.id==='panel-contact-form'){event.preventDefault();await saveContact(form);return true;}
 if(form.id==='panel-customer-form'){event.preventDefault();await saveCustomer(form);return true;}
 if(form.id==='panel-campaign-form'){event.preventDefault();await saveCampaign(form);return true;}
 return false;
}
if(typeof document!=='undefined'){
 document.addEventListener('click',event=>{if(handleAdminAction(event))return;});
 document.addEventListener('input',handleAdminInput);
 document.addEventListener('change',handleAdminChange);
 document.addEventListener('submit',event=>{void handleAdminSubmit(event);});
 document.addEventListener('admin-panel-updated',()=>{
  const path=location.pathname.replace(BASE_PATH,'').replace(/\/+$/,'')||'/admin';
  const target=document.querySelector('#main');
  if(target)target.innerHTML=renderAdmin(path);
 });
}
