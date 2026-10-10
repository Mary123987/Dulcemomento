import {BASE_PATH} from './seo.js';

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
 const customers=DEMO_CUSTOMERS.map(item=>({...item}));
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
 .dm-admin-auth{width:min(480px,calc(100% - 2rem));margin:8vh auto;padding:1.5rem;background:var(--paper);border:1px solid var(--line);border-radius:22px;box-shadow:0 18px 42px rgba(73,51,41,.08)}.dm-admin-auth h1{font-size:2rem}.dm-admin-auth .dm-admin-form{grid-template-columns:1fr}.dm-admin-security-note{padding:.75rem;border-radius:10px;background:#fff1de;color:#704f28;font-size:.9rem}
 @media(max-width:900px){.dm-admin-layout{grid-template-columns:1fr}.dm-admin-sidebar{position:static}.dm-admin-nav{grid-template-columns:repeat(3,minmax(0,1fr))}.dm-admin-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.dm-admin-filters{grid-template-columns:repeat(2,minmax(0,1fr))}}
 @media(max-width:560px){.dm-admin-nav{grid-template-columns:repeat(2,minmax(0,1fr))}.dm-admin-grid,.dm-admin-form,.dm-admin-filters{grid-template-columns:1fr}.dm-admin-card.full,.dm-admin-field.full{grid-column:auto}.dm-admin-heading{align-items:flex-start;flex-direction:column}}
 </style><section class="dm-admin-layout"><aside class="dm-admin-sidebar"><div class="dm-admin-brand"><strong>Dulce Momento</strong><small>Panel administrativo · ${esc(section.label)}</small></div>${nav(path)}</aside><div class="dm-admin-content"><header class="dm-admin-heading"><div><span class="eyebrow">ADMINISTRACIÓN</span><h1>${esc(section.label)}</h1></div><button type="button" class="dm-admin-button" data-panel-action="logout">Cerrar sesión</button></header>${content}</div></section>`;
}
function authView(config){
 return `<section class="dm-admin-auth"><span class="eyebrow">ACCESO ADMINISTRATIVO</span><h1>Iniciar sesión</h1><p class="dm-admin-security-note">Si el backend está configurado, se validará allí y se usará una sesión segura de servidor. Sin backend, el acceso es solo una demostración local, no una protección de producción.</p><form id="panel-login-form" class="dm-admin-form"><div class="dm-admin-field full"><label>Usuario</label><input class="dm-admin-input" name="username" required autocomplete="username"></div><div class="dm-admin-field full"><label>Contraseña</label><input class="dm-admin-input" type="password" name="password" required autocomplete="current-password"></div><button class="dm-admin-button primary" type="submit">Ingresar</button></form><div id="panel-message" aria-live="polite"></div></section>`;
}
function summaryView(){
 const contacts=readList(KEYS.contacts);
 const orders=getOrders();
 const campaigns=readList(KEYS.campaigns);
 const newest=contacts.slice().sort((a,b)=>new Date(b.lastInteractionAt||b.createdAt)-new Date(a.lastInteractionAt||a.createdAt)).slice(0,5);
 const open=contacts.filter(contact=>['Nueva','Pendiente','En seguimiento'].includes(contact.status||'Nueva')).length;
 return `<div class="dm-admin-stats"><article class="dm-admin-stat"><span>Contactos</span><strong>${contacts.length}</strong></article><article class="dm-admin-stat"><span>Consultas abiertas</span><strong>${open}</strong></article><article class="dm-admin-stat"><span>Pedidos locales</span><strong>${orders.length}</strong></article><article class="dm-admin-stat"><span>Campañas guardadas</span><strong>${campaigns.length}</strong></article></div><div class="dm-admin-grid"><section class="dm-admin-card"><h2>Actividad reciente</h2><div class="dm-admin-list">${newest.length?newest.map(contact=>`<div class="dm-admin-list-item"><span><strong>${esc(contact.name)} ${esc(contact.surname)}</strong><br><small>${esc(contact.email)}</small></span><span class="dm-admin-tag ${statusClass(contact.status)}">${esc(contact.status||'Nueva')}</span></div>`).join(''):'<p class="dm-admin-muted">Todavía no hay consultas guardadas en este navegador.</p>'}</div></section><section class="dm-admin-card"><h2>Segmentación de clientes</h2>${['Nuevo','Recurrente','Cliente corporativo','Otro'].map(type=>`<div class="dm-admin-list-item"><span>${esc(type)}</span><strong>${contacts.filter(contact=>contact.customerType===type).length}</strong></div>`).join('')}</section><section class="dm-admin-card full"><h2>Accesos rápidos</h2><div class="dm-admin-actions">${SECTIONS.slice(1).map(section=>`<a class="dm-admin-button" href="${routeUrl(section.path)}" data-link>${esc(section.label)}</a>`).join('')}</div></section></div>`;
}
function contactRows(contacts){
 if(!contacts.length)return '<tr><td colspan="8" class="dm-admin-muted">No hay contactos que coincidan con los filtros.</td></tr>';
 return contacts.map(contact=>`<tr><td>${esc(contact.name)} ${esc(contact.surname)}</td><td>${esc(contact.email)}</td><td>${esc(contact.customerType||'Nuevo')}</td><td>${esc(contact.queryType||'Otra consulta')}</td><td><span class="dm-admin-tag ${statusClass(contact.status)}">${esc(contact.status||'Nueva')}</span></td><td>${contact.marketingConsent?'Sí':'No'}</td><td><details><summary>Ver mensaje</summary><p>${esc(contact.message)}</p><small>Registro: ${esc(contact.createdAt||'—')}<br>Última interacción: ${esc(contact.lastInteractionAt||'—')}</small></details></td><td><div class="dm-admin-actions"><button class="dm-admin-button" type="button" data-panel-action="edit-contact" data-id="${esc(contact.id)}">Editar</button><button class="dm-admin-button danger" type="button" data-panel-action="delete-contact" data-id="${esc(contact.id)}">Eliminar</button></div></td></tr>`).join('');
}
function contactsView(){
 const contacts=readList(KEYS.contacts);
 return `<section class="dm-admin-card"><h2>Directorio de contactos</h2><form id="panel-contact-form" class="dm-admin-form"><input type="hidden" name="id"><div class="dm-admin-field"><label>Nombre</label><input class="dm-admin-input" name="name" minlength="2" required></div><div class="dm-admin-field"><label>Apellido</label><input class="dm-admin-input" name="surname"></div><div class="dm-admin-field"><label>Correo</label><input class="dm-admin-input" type="email" name="email" required></div><div class="dm-admin-field"><label>Tipo de cliente</label><select class="dm-admin-select" name="customerType"><option>Nuevo</option><option>Recurrente</option><option>Cliente corporativo</option><option>Otro</option></select></div><div class="dm-admin-field"><label>Tipo de consulta</label><input class="dm-admin-input" name="queryType" value="Otra consulta" required></div><div class="dm-admin-field"><label>Estado</label><select class="dm-admin-select" name="status">${CONTACT_STATUSES.map(status=>`<option>${status}</option>`).join('')}</select></div><div class="dm-admin-field full"><label>Mensaje / nota administrativa</label><textarea class="dm-admin-textarea" name="message"></textarea></div><label class="dm-admin-label"><input type="checkbox" name="marketingConsent"> Consentimiento comercial</label><div class="dm-admin-actions"><button class="dm-admin-button primary" type="submit">Guardar contacto</button><button class="dm-admin-button" type="reset" data-panel-action="reset-contact">Limpiar</button></div></form><div id="panel-message" aria-live="polite"></div></section><section class="dm-admin-card full" style="margin-top:1rem"><h2>Contactos registrados</h2><div class="dm-admin-filters"><input class="dm-admin-input" type="search" name="search" data-panel-filter="search" placeholder="Nombre, apellido o correo"><select class="dm-admin-select" data-panel-filter="customerType"><option value="">Todos los clientes</option>${['Nuevo','Recurrente','Cliente corporativo','Otro'].map(type=>`<option>${type}</option>`).join('')}</select><input class="dm-admin-input" type="search" data-panel-filter="queryType" placeholder="Tipo de consulta"><select class="dm-admin-select" data-panel-filter="status"><option value="">Todos los estados</option>${CONTACT_STATUSES.map(status=>`<option>${status}</option>`).join('')}</select><select class="dm-admin-select" data-panel-filter="consent"><option value="">Todo consentimiento</option><option value="yes">Aceptado</option><option value="no">No aceptado</option></select><label class="dm-admin-field">Desde<input class="dm-admin-input" type="date" data-panel-filter="from"></label><label class="dm-admin-field">Hasta<input class="dm-admin-input" type="date" data-panel-filter="to"></label><button class="dm-admin-button" type="button" data-panel-action="export-contacts">Exportar CSV</button></div><div class="dm-admin-table-wrap"><table class="dm-admin-table"><thead><tr><th>Nombre</th><th>Correo</th><th>Cliente</th><th>Consulta</th><th>Estado</th><th>Consentimiento</th><th>Detalle</th><th>Acciones</th></tr></thead><tbody id="panel-contact-rows">${contactRows(contacts.slice(0,PAGE_SIZE))}</tbody></table></div><div class="dm-admin-pagination"><button class="dm-admin-button" type="button" data-panel-action="page-prev">Anterior</button><span id="panel-page-label">Página 1</span><button class="dm-admin-button" type="button" data-panel-action="page-next">Siguiente</button></div></section>`;
}
function clientRecords(){
 return apiState.mode?(apiState.data?.customers||[]):readList(KEYS.customers);
}
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
 return clientRecords().filter(customer=>(!query||normalizeEmail(`${customer.name} ${customer.email}`).includes(query))&&(!status||customer.status===status)&&(!segment||customer.segment===segment));
}
function clientRow(customer){
 const history=(customer.campaignHistory||[]).map(entry=>`${esc(entry.campaignId)}: ${esc(entry.status)}`).join('<br>')||'Sin campañas';
 return `<tr><td>${esc(customer.name)}${customer.isDemo?'<br><small>Dato ficticio de demostración</small>':''}</td><td>${esc(customer.email)}</td><td>${esc(customer.registeredAt||'—')}</td><td>${esc(customer.status)}</td><td>${esc(customer.segment)}</td><td>${customer.marketingConsent?'Sí':'No'}${customer.consentDate?`<br><small>${esc(customer.consentDate)} · ${esc(customer.consentSource)}</small>`:''}</td><td>${history}</td><td><div class="dm-admin-actions"><button class="dm-admin-button" type="button" data-panel-action="edit-customer" data-id="${esc(customer.id)}">Editar</button><button class="dm-admin-button danger" type="button" data-panel-action="delete-customer" data-id="${esc(customer.id)}">Eliminar</button></div></td></tr>`;
}
function clientsView(){
 const customers=filteredCustomers();
 return `<section class="dm-admin-card"><h2>${apiState.mode?'Clientes almacenados en el backend':'Clientes ficticios de demostración'}</h2><p class="dm-admin-security-note">${apiState.mode?'Los clientes example.com están identificados como demostración y no son elegibles para envíos.':'Los ocho registros @example.com son datos ficticios. No se envían correos desde este modo.'} ${apiState.mode?'La persistencia usa el archivo JSON configurado en el servidor.':'Los cambios se guardan solo en este navegador.'}</p><form id="panel-customer-form" class="dm-admin-form"><input type="hidden" name="id"><div class="dm-admin-field"><label>Nombre</label><input class="dm-admin-input" name="name" minlength="2" required></div><div class="dm-admin-field"><label>Correo electrónico</label><input class="dm-admin-input" name="email" type="email" required></div><div class="dm-admin-field"><label>Fecha de registro</label><input class="dm-admin-input" name="registeredAt" type="date" required></div><div class="dm-admin-field"><label>Estado</label><select class="dm-admin-select" name="status"><option value="activo">Activo</option><option value="inactivo">Inactivo</option></select></div><div class="dm-admin-field"><label>Segmento</label><select class="dm-admin-select" name="segment"><option value="nuevo">Nuevo</option><option value="recurrente">Recurrente</option><option value="inactivo">Inactivo</option></select></div><div class="dm-admin-field"><label>Fuente del consentimiento (si aplica)</label><input class="dm-admin-input" name="consentSource" placeholder="Formulario, referencia verificable"></div><div class="dm-admin-field"><label>Fecha del consentimiento</label><input class="dm-admin-input" name="consentDate" type="date"></div><label class="dm-admin-label"><input type="checkbox" name="marketingConsent"> Consentimiento comercial registrado</label><div class="dm-admin-actions"><button class="dm-admin-button primary" type="submit">Guardar cliente</button><button class="dm-admin-button" type="reset">Limpiar</button></div></form><div id="panel-message" aria-live="polite"></div></section><section class="dm-admin-card full" style="margin-top:1rem"><h2>Directorio de clientes</h2><div class="dm-admin-filters"><input class="dm-admin-input" type="search" data-customer-search placeholder="Buscar nombre o correo"><select class="dm-admin-select" data-customer-status><option value="">Todos los estados</option><option value="activo">Activo</option><option value="inactivo">Inactivo</option></select><select class="dm-admin-select" data-customer-segment><option value="">Todos los segmentos</option><option value="nuevo">Nuevo</option><option value="recurrente">Recurrente</option><option value="inactivo">Inactivo</option></select><button class="dm-admin-button" type="button" data-panel-action="export-customers">Exportar clientes CSV</button></div><div class="dm-admin-table-wrap"><table class="dm-admin-table"><thead><tr><th>Cliente</th><th>Correo</th><th>Registro</th><th>Estado</th><th>Segmento</th><th>Consentimiento</th><th>Historial de campañas</th><th>Acciones</th></tr></thead><tbody id="panel-customer-rows">${customers.map(clientRow).join('')||'<tr><td colspan="8" class="dm-admin-muted">No hay clientes para estos filtros.</td></tr>'}</tbody></table></div></section>`;
}
function campaignView(){
 const campaigns=apiState.mode?(apiState.data?.campaigns||[]):readList(KEYS.campaigns);
 const status=apiState.status;
 const testAccepted=Boolean(apiState.data?.sendHistory?.some(run=>run.type==='test'&&run.status==='accepted_by_provider'));
 const recipientCount=campaign=>clientRecords().filter(customer=>!customer.isDemo&&!isDemoEmail(customer.email)&&customer.status==='activo'&&customer.marketingConsent===true&&!customer.unsubscribed&&!(apiState.data?.unsubscribedEmails||[]).includes(normalizeEmail(customer.email))&&(campaign.segment==='todos_consentidos'||customer.segment===campaign.segment)).length;
 const renderCampaign=campaign=>{
  const runs=campaign.sendHistory||[];
  const results=runs.flatMap(run=>run.results||[]);
  const canSend=apiState.mode&&testAccepted&&status?.providerConfigured&&!campaign.isDemo&&!['processing','enviado_al_proveedor'].includes(campaign.status);
  return `<article class="dm-admin-list-item"><div><strong>${esc(campaign.name||campaign.title)}</strong><br><small>${esc(campaign.subject||'Sin asunto')} · ${esc(campaign.status||'Borrador')}${campaign.isDemo?' · Plantilla de demostración':''}</small><p>${esc(campaign.text||campaign.body||'')}</p><small>Segmento: ${esc(campaign.segment)} · Destinatarios elegibles: ${recipientCount(campaign)}</small>${runs.map(run=>`<p><small>Envío ${esc(run.finishedAt||run.startedAt)} · ${esc(run.status)} · ${Number(run.recipientCount)||0} destinatarios intentados</small></p>`).join('')}${results.map(result=>`<p class="${result.error?'dm-admin-message error':'dm-admin-muted'}"><small>${esc(result.email)} · ${esc(result.status)}${result.providerId?` · ID Resend: ${esc(result.providerId)}`:''}${result.error?` · ${esc(result.error)}`:''}</small></p>`).join('')}</div><div class="dm-admin-actions"><button class="dm-admin-button" type="button" data-panel-action="edit-campaign" data-id="${esc(campaign.id)}">Editar</button><button class="dm-admin-button" type="button" data-panel-action="duplicate-campaign" data-id="${esc(campaign.id)}">Duplicar</button>${apiState.mode?`<button class="dm-admin-button" type="button" data-panel-action="send-test" data-id="${esc(campaign.id)}">Enviar prueba a administradora</button><button class="dm-admin-button primary" type="button" data-panel-action="send-campaign" data-id="${esc(campaign.id)}" ${canSend?'':'disabled'}>Enviar campaña</button>`:`<button class="dm-admin-button" type="button" data-panel-action="simulate-campaign" data-id="${esc(campaign.id)}">Simular elegibilidad</button>`}<button class="dm-admin-button danger" type="button" data-panel-action="delete-campaign" data-id="${esc(campaign.id)}">Eliminar</button></div></article>`;
 };
 const senderStatus=apiState.mode?`<p class="dm-admin-security-note">Modo ${status?.mode==='real-capable'?'real habilitado':'demostración'} · Remitente solicitado: ${esc(status?.requestedSender||'maryrojascordova20@gmail.com')} · Verificado: ${status?.senderVerified?'sí':'no'} · ${esc(status?.reason||'El dominio del remitente está verificado en Resend.')} ${status?.senderEmail&&status.senderEmail!==status.requestedSender?`Remitente configurado: ${esc(status.senderEmail)}.`:''} ${testAccepted?'Prueba aceptada por Resend.':'Los envíos a clientes requieren primero una prueba aceptada al correo de administración.'}</p>`:'<p class="dm-admin-security-note">Modo demostración: borradores, plantillas y vistas previas no contactan a nadie. Para persistir campañas y habilitar envíos se requiere el backend y un remitente de dominio verificado en Resend.</p>';
 const initialPreview=previewDoc('<div style="background:#fbf6ee;padding:24px;color:#493329;font:18px Georgia,serif">Vista previa de Dulce Momento</div>');
 return `<div class="dm-admin-grid"><section class="dm-admin-card"><h2>Crear o editar campaña</h2>${senderStatus}<form id="panel-campaign-form" class="dm-admin-form"><input type="hidden" name="id"><div class="dm-admin-field full"><label>Nombre</label><input class="dm-admin-input" name="title" required maxlength="120"></div><div class="dm-admin-field full"><label>Asunto</label><input class="dm-admin-input" name="subject" required maxlength="160"></div><div class="dm-admin-field full"><label>Contenido HTML</label><textarea class="dm-admin-textarea" name="body" required maxlength="100000"></textarea></div><div class="dm-admin-field full"><label>Texto alternativo</label><textarea class="dm-admin-textarea" name="text" required maxlength="100000"></textarea></div><div class="dm-admin-field"><label>Segmento</label><select class="dm-admin-select" name="segment"><option value="todos_consentidos">Todos con consentimiento</option><option value="nuevo">Nuevo</option><option value="recurrente">Recurrente</option><option value="inactivo">Inactivo</option></select></div><button class="dm-admin-button primary" type="submit">Guardar borrador</button></form><div id="panel-message" aria-live="polite"></div><h3>Previsualización</h3><div class="dm-admin-actions"><iframe title="Vista previa escritorio" sandbox="" style="width:min(100%,560px);height:260px;border:1px solid var(--line);border-radius:12px;background:#fff" srcdoc="${esc(initialPreview)}"></iframe><iframe title="Vista previa móvil" sandbox="" style="width:220px;height:320px;border:1px solid var(--line);border-radius:18px;background:#fff" srcdoc="${esc(initialPreview)}"></iframe></div></section><section class="dm-admin-card"><h2>Campañas guardadas e historial</h2><div class="dm-admin-list">${campaigns.map(renderCampaign).join('')||'<p class="dm-admin-muted">No hay campañas guardadas.</p>'}</div></section></div>`;
}
function ordersView(){
 const orders=getOrders();
 return `<section class="dm-admin-card"><h2>Pedidos guardados en este navegador</h2><p class="dm-admin-muted">Se muestran los pedidos locales del checkout de demostración; no representan ventas recibidas en un servidor.</p><div class="dm-admin-table-wrap"><table class="dm-admin-table"><thead><tr><th>Número</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Pago</th><th>Estado</th><th>Actualizar</th></tr></thead><tbody>${orders.map(order=>`<tr><td>${esc(order.orderId)}</td><td>${esc(order.customer?.name)}<br><small>${esc(order.customer?.email)}</small></td><td>${esc(order.createdAt||'—')}</td><td>${money(order.total)}</td><td>${esc(order.paymentMethod)} · ${esc(order.payment?.status)}</td><td><span class="dm-admin-tag ${statusClass(order.status)}">${esc(order.status||'Pedido recibido')}</span></td><td><select class="dm-admin-select" data-panel-order-status="${esc(order.orderId)}">${ORDER_STATUSES.map(status=>`<option ${order.status===status?'selected':''}>${status}</option>`).join('')}</select></td></tr>`).join('')||'<tr><td colspan="7" class="dm-admin-muted">No se han guardado pedidos en este navegador.</td></tr>'}</tbody></table></div><div id="panel-message" aria-live="polite"></div></section>`;
}
function settingsView(){
 const config=readConfig();
 const credentialForm=apiState.mode?'<p class="dm-admin-security-note">La cuenta del backend se gestiona mediante ADMIN_USERNAME y ADMIN_PASSWORD en el entorno seguro del servidor; no se almacena ni modifica desde este navegador.</p>':`<form id="panel-password-form" class="dm-admin-form"><div class="dm-admin-field full"><label>Contraseña actual</label><input class="dm-admin-input" type="password" name="currentPassword" required autocomplete="current-password"></div><div class="dm-admin-field"><label>Nueva contraseña (mínimo 12 caracteres)</label><input class="dm-admin-input" type="password" name="newPassword" minlength="12" required autocomplete="new-password"></div><div class="dm-admin-field"><label>Confirmar contraseña</label><input class="dm-admin-input" type="password" name="confirmation" minlength="12" required autocomplete="new-password"></div><button class="dm-admin-button primary" type="submit">Actualizar contraseña local</button></form>`;
 const storageNote=apiState.mode?'Clientes y campañas se guardan en JSON en el servidor; contactos y pedidos de la tienda siguen siendo datos locales de este navegador.':'Modo demostración: los datos se guardan solo en este navegador; no existe autenticación de servidor.';
 return `<div class="dm-admin-grid"><section class="dm-admin-card"><h2>${apiState.mode?'Credenciales del servidor':'Cambiar contraseña de demostración'}</h2>${credentialForm}<div id="panel-message" aria-live="polite"></div></section><section class="dm-admin-card"><h2>Almacenamiento y sesión</h2><p>${apiState.mode?'Sesión autenticada del backend.':'Usuario local: '}<strong>${apiState.mode?'servidor':esc(config?.username||'—')}</strong></p><p>La sesión expira al cerrar la pestaña o al cerrar sesión.</p><p class="dm-admin-security-note">${esc(storageNote)}</p><div class="dm-admin-actions"><button class="dm-admin-button" type="button" data-panel-action="export-contacts">Exportar contactos CSV</button><button class="dm-admin-button" type="button" data-panel-action="logout">Cerrar sesión</button></div></section></div>`;
}
function viewFor(path){
 if(path==='/admin/contactos')return contactsView();
 if(path==='/admin/clientes')return clientsView();
 if(path==='/admin/campanas')return campaignView();
 if(path==='/admin/pedidos')return ordersView();
 if(path==='/admin/configuracion')return settingsView();
 return summaryView();
}
const apiBase=()=>String(globalThis.DM_ADMIN_API_URL||document.querySelector('meta[name="admin-api-origin"]')?.content||'').replace(/\/$/,'');
async function apiRequest(endpoint,options={}){
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
 const customers=readList(KEYS.customers);
 const id=String(fields.id||'');
 const email=normalizeEmail(fields.email);
 if(!isDemoEmail(email)){showMessage('En modo demostración solo se admiten correos de prueba bajo example.com.','error');return;}
 if(customers.some(item=>normalizeEmail(item.email)===email&&item.id!==id)){showMessage('Ya existe un cliente con ese correo.','error');return;}
 const consent=form.elements.marketingConsent.checked;
 if(consent&&isDemoEmail(email)){showMessage('Los correos de prueba example.com no pueden registrar consentimiento comercial.','error');return;}
 if(consent&&(!fields.consentDate||!clean(fields.consentSource))){showMessage('Registra la fecha y la fuente verificable del consentimiento.','error');return;}
 const old=customers.find(item=>item.id===id);
 const now=new Date().toISOString();
 const customer={...old,id:id||`demo-client-${Date.now()}`,name:clean(fields.name),email,registeredAt:fields.registeredAt?new Date(`${fields.registeredAt}T12:00:00`).toISOString():old?.registeredAt||now,status:fields.status,segment:fields.segment,marketingConsent:consent,consentDate:consent?new Date(`${fields.consentDate}T12:00:00`).toISOString():null,consentSource:consent?clean(fields.consentSource):null,campaignHistory:old?.campaignHistory||[],isDemo:true};
 const next=old?customers.map(item=>item.id===id?customer:item):[customer,...customers];
 if(!writeList(KEYS.customers,next))return;
 form.reset();form.elements.id.value='';
 showMessage(old?'Cliente de demostración actualizado.':'Cliente de demostración guardado. No se enviará correo.');
 refreshAdmin();
}
async function saveCustomer(form){
 const fields=Object.fromEntries(new FormData(form));
 const consent=form.elements.marketingConsent.checked;
 if(consent&&(!fields.consentDate||!clean(fields.consentSource))){showMessage('Registra la fecha y la fuente verificable del consentimiento.','error');return;}
 const customer={name:clean(fields.name),email:normalizeEmail(fields.email),registeredAt:fields.registeredAt?new Date(`${fields.registeredAt}T12:00:00`).toISOString():undefined,status:fields.status,segment:fields.segment,marketingConsent:consent,consentDate:consent?new Date(`${fields.consentDate}T12:00:00`).toISOString():null,consentSource:consent?clean(fields.consentSource):null};
 try{
  if(apiState.mode){
   if(fields.id)await apiRequest(`/api/admin/customers/${encodeURIComponent(fields.id)}`,{method:'PUT',body:JSON.stringify(customer)});
   else await apiRequest('/api/admin/customers',{method:'POST',body:JSON.stringify(customer)});
   await loadApiState();showMessage(fields.id?'Cliente actualizado en el servidor.':'Cliente guardado en el servidor.');
  }else{localCustomerSave(form);return;}
  form.reset();form.elements.id.value='';refreshAdmin();
 }catch(error){showMessage(error.message,'error');}
}
function fillCustomerForm(id){
 const customer=clientRecords().find(item=>item.id===id);
 const form=document.querySelector('#panel-customer-form');
 if(!customer||!form)return;
 for(const field of ['id','name','email','registeredAt','status','segment','consentDate','consentSource'])if(form.elements[field])form.elements[field].value=field==='registeredAt'||field==='consentDate'?String(customer[field]||'').slice(0,10):customer[field]||'';
 form.elements.marketingConsent.checked=Boolean(customer.marketingConsent);
 if(customer.isDemo){form.elements.marketingConsent.disabled=true;form.elements.consentSource.disabled=true;}
 form.scrollIntoView({behavior:'smooth',block:'center'});
}
async function deleteCustomer(id){
 if(!window.confirm('¿Eliminar este cliente?'))return;
 try{
  if(apiState.mode){await apiRequest(`/api/admin/customers/${encodeURIComponent(id)}`,{method:'DELETE'});await loadApiState();}
  else{const customers=readList(KEYS.customers);if(!writeList(KEYS.customers,customers.filter(item=>item.id!==id)))return;}
  showMessage('Cliente eliminado.');refreshAdmin();
 }catch(error){showMessage(error.message,'error');}
}
async function deleteCampaign(id){
 if(apiState.mode){
  if(!window.confirm('¿Eliminar esta campaña? Se conservarán las campañas con historial de envío.'))return;
  try{await apiRequest(`/api/admin/campaigns/${encodeURIComponent(id)}`,{method:'DELETE'});await loadApiState();showMessage('Campaña eliminada del servidor.');refreshAdmin();}
  catch(error){showMessage(error.message,'error');}
  return;
 }
 deleteById(KEYS.campaigns,id,'esta campaña');
}
export function renderAdmin(path='/admin'){
 const serverSession=readSession()?.backend===true;
 if(serverSession&&!apiState.mode){
  apiState.mode=true;
  if(!apiState.data)void loadApiState().then(refreshAdmin).catch(error=>{sessionStorage.removeItem(KEYS.session);apiState.mode=false;showMessage(error.message,'error');refreshAdmin();});
 }
 if(!apiState.mode&&(!readConfig()||!isAuthenticated()))return authView(readConfig());
 if(path==='/admin/contactos')contactsPage=0;
 return shell(path,viewFor(path));
}
function currentFilters(){
 return Object.fromEntries([...document.querySelectorAll('[data-panel-filter]')].map(input=>[input.dataset.panelFilter,input.value]));
}
function matchingContacts(){
 const filters=currentFilters();
 const q=normalizeEmail(filters.search||'');
 return readList(KEYS.contacts).filter(contact=>{
  const name=normalizeEmail(`${contact.name||''} ${contact.surname||''} ${contact.email||''}`);
  const date=String(contact.createdAt||'').slice(0,10);
  return (!q||name.includes(q))
   &&(!filters.customerType||contact.customerType===filters.customerType)
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
 const columns=[['Nombre',c=>c.name],['Apellido',c=>c.surname],['Correo',c=>c.email],['Teléfono',c=>c.phone],['Consulta',c=>c.queryType],['Mensaje',c=>c.message],['Tipo de cliente',c=>c.customerType],['Estado',c=>c.status],['Consentimiento',c=>c.marketingConsent?'Sí':'No'],['Registro',c=>c.createdAt],['Última interacción',c=>c.lastInteractionAt]];
 const csv=[columns.map(([label])=>csvValue(label)).join(','),...contacts.map(contact=>columns.map(([,value])=>csvValue(value(contact))).join(','))].join('\r\n');
 const link=document.createElement('a');
 const url=URL.createObjectURL(new Blob(['\ufeff',csv],{type:'text/csv;charset=utf-8'}));
 link.href=url;link.download='contactos-dulce-momento.csv';link.click();URL.revokeObjectURL(url);
 showMessage(`Se exportaron ${contacts.length} contactos filtrados.`);
}
function exportCustomers(){
 const customers=filteredCustomers();
 if(!customers.length){showMessage('No hay clientes que coincidan con los filtros.','error');return;}
 const columns=[['Nombre',customer=>customer.name],['Correo',customer=>customer.email],['Registro',customer=>customer.registeredAt],['Estado',customer=>customer.status],['Segmento',customer=>customer.segment],['Consentimiento',customer=>customer.marketingConsent?'Sí':'No'],['Fecha de consentimiento',customer=>customer.consentDate],['Fuente de consentimiento',customer=>customer.consentSource],['Demostración',customer=>customer.isDemo?'Sí':'No'],['Historial de campañas',customer=>(customer.campaignHistory||[]).map(item=>`${item.campaignId}:${item.status}`).join('; ')]];
 const csv=[columns.map(([label])=>csvValue(label)).join(','),...customers.map(customer=>columns.map(([,value])=>csvValue(value(customer))).join(','))].join('\r\n');
 const link=document.createElement('a');
 const url=URL.createObjectURL(new Blob(['\ufeff',csv],{type:'text/csv;charset=utf-8'}));
 link.href=url;link.download='clientes-dulce-momento.csv';link.click();URL.revokeObjectURL(url);
 showMessage(`Se exportaron ${customers.length} clientes filtrados.`);
}
function fillContactForm(id){
 const contact=readList(KEYS.contacts).find(item=>item.id===id);
 const form=document.querySelector('#panel-contact-form');
 if(!contact||!form)return;
 for(const field of ['id','name','surname','email','customerType','queryType','status','message'])if(form.elements[field])form.elements[field].value=contact[field]||'';
 form.elements.marketingConsent.checked=Boolean(contact.marketingConsent);
 form.scrollIntoView({behavior:'smooth',block:'center'});
}
function saveContact(form){
 const data=Object.fromEntries(new FormData(form));
 const name=clean(data.name),surname=clean(data.surname),email=normalizeEmail(data.email);
 if(!name||!email){showMessage('Nombre y correo son obligatorios.','error');return;}
 const records=readList(KEYS.contacts);
 const id=data.id||`CONTACT-${Date.now()}`;
 const duplicate=records.find(contact=>normalizeEmail(contact.email)===email&&clean(contact.name)===name&&clean(contact.surname)===surname&&contact.id!==id);
 if(duplicate){showMessage('Ya existe otro contacto con ese correo. Revísalo y edita su ficha para preservar el historial.','error');return;}
 const old=records.find(contact=>contact.id===id);
 const now=new Date().toISOString();
 const entry={...old,id,name,surname,email,customerType:clean(data.customerType),queryType:clean(data.queryType),status:CONTACT_STATUSES.includes(data.status)?data.status:'Nueva',message:clean(data.message),marketingConsent:data.marketingConsent==='on',createdAt:old?.createdAt||now,lastInteractionAt:now,history:[...(old?.history||[]),{type:old?'actualización administrativa':'alta administrativa',at:now,summary:'Datos administrativos actualizados'}]};
 const next=old?records.map(contact=>contact.id===id?entry:contact):[entry,...records];
 if(!writeList(KEYS.contacts,next))return;
 form.reset();form.elements.id.value='';refreshContactRows();emitUpdated();showMessage(old?'Contacto actualizado.':'Contacto creado en este navegador.');
}
function deleteById(key,id,label){
 if(!window.confirm(`¿Eliminar ${label}? Esta acción no se puede deshacer.`))return;
 const values=readList(key);
 const next=values.filter(value=>value.id!==id);
 if(next.length===values.length){showMessage('No se encontró el registro que deseas eliminar.','error');return;}
 if(!writeList(key,next))return;
 emitUpdated();showMessage(`${label} eliminado.`);
}
async function saveCampaign(form){
 const data=Object.fromEntries(new FormData(form));
 const title=clean(data.title),subject=clean(data.subject),html=String(data.body||'').trim();
 const text=clean(data.text)||html.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
 const segment=clean(data.segment)||'todos_consentidos';
 if(!title||!subject||!html||!text){showMessage('Nombre, asunto, HTML y texto alternativo son obligatorios.','error');return;}
 if(apiState.mode){
  try{
   const campaign={name:title,subject,html,text,segment};
   if(data.id)await apiRequest(`/api/admin/campaigns/${encodeURIComponent(data.id)}`,{method:'PUT',body:JSON.stringify(campaign)});
   else await apiRequest('/api/admin/campaigns',{method:'POST',body:JSON.stringify(campaign)});
   await loadApiState();form.reset();form.elements.id.value='';refreshAdmin();showMessage('Borrador guardado en el servidor. No se ha enviado ningún mensaje.');
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
 form.scrollIntoView({behavior:'smooth',block:'center'});
}
function refreshCampaignPreview(html){
 document.querySelectorAll('iframe[title^="Vista previa"]').forEach(frame=>{frame.srcdoc=previewDoc(html);});
}
function updateOrderStatus(orderId,status){
 if(!ORDER_STATUSES.includes(status)){showMessage('El estado seleccionado no es válido.','error');return;}
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
 let serverStatus=null;
 const configuredApi=Boolean(apiBase());
 try{
  const response=await fetch(`${apiBase()}/api/email/status`,{credentials:'include'});
  if(response.ok)serverStatus=await response.json();
  else if(configuredApi)throw new Error(`No se pudo consultar el backend (HTTP ${response.status}).`);
 }catch(error){
  if(configuredApi){showMessage(error.message,'error');return;}
  console.info('El backend administrativo no está disponible; se usará el acceso local de demostración.',error);
 }
 if(configuredApi&&!serverStatus?.backendAvailable){showMessage('El origen configurado no ofrece una API administrativa válida.','error');return;}
 if(serverStatus?.backendAvailable&&!serverStatus.backendConfigured){
  showMessage('El backend responde, pero no está configurado. Define credenciales de servidor seguras antes de iniciar sesión.','error');return;
 }
 if(serverStatus?.backendConfigured){
  try{
   apiState.status=serverStatus;
   await apiRequest('/api/admin/login',{method:'POST',body:JSON.stringify({username:String(data.username||''),password:String(data.password||'')})});
   apiState.mode=true;
   await loadApiState();
   sessionStorage.setItem(KEYS.session,JSON.stringify({backend:true,authenticated:true,createdAt:Date.now()}));
   emitUpdated();return;
  }catch(error){showMessage(error.message,'error');return;}
 }
 const config=readConfig();
 if(!config){showMessage('Primero configura el acceso administrativo.','error');return;}
 if((config.lockedUntil||0)>Date.now()){showMessage('Acceso temporalmente bloqueado tras varios intentos. Espera antes de probar de nuevo.','error');return;}
 try{
  const inputHash=await hashPassword(String(data.password||''),bytesFromHex(config.salt));
  if(clean(data.username)===config.username&&inputHash===config.passwordHash){
   config.failedAttempts=0;config.lockedUntil=0;writeConfig(config);
   sessionStorage.setItem(KEYS.session,JSON.stringify({authenticated:true,username:config.username,createdAt:Date.now()}));
   emitUpdated();return;
  }
  config.failedAttempts=(config.failedAttempts||0)+1;
  if(config.failedAttempts>=5){config.failedAttempts=0;config.lockedUntil=Date.now()+5*60*1000;}
  writeConfig(config);showMessage('Usuario o contraseña incorrectos.','error');
 }catch(error){showMessage(`No se pudo validar la sesión: ${error.message}`,'error');}
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
  showMessage('Campaña duplicada como borrador. No se envió ningún correo.');refreshAdmin();
 }catch(error){showMessage(error.message,'error');}
}
async function sendTestCampaign(id){
 if(!apiState.mode){showMessage('El envío de prueba solo está disponible en el backend y se limita al correo autorizado.','error');return;}
 const campaign=apiState.data?.campaigns.find(item=>item.id===id);
 if(!campaign)return;
 try{
  const result=await apiRequest('/api/admin/test-email',{method:'POST',body:JSON.stringify({campaignId:id,to:apiState.status?.requestedSender,subject:campaign.subject,html:campaign.html,text:campaign.text,idempotencyKey:`test-${crypto.randomUUID()}`})});
  await loadApiState();refreshAdmin();
  showMessage(`Resend aceptó el correo de prueba para ${result.recipient}. ID de proveedor: ${result.providerId}. Esto no confirma entrega.`);
 }catch(error){showMessage(error.message,'error');}
}
function simulateCampaign(id){
 if(apiState.mode){showMessage('La simulación solo está disponible en modo demostración.','error');return;}
 const campaign=readList(KEYS.campaigns).find(item=>item.id===id);
 if(!campaign){showMessage('No se encontró la campaña para simular.','error');return;}
 const eligible=clientRecords().filter(customer=>!customer.isDemo&&!isDemoEmail(customer.email)&&customer.status==='activo'&&customer.marketingConsent===true&&(campaign.segment==='todos_consentidos'||customer.segment===campaign.segment)).length;
 showMessage(`Simulación de “${campaign.name||campaign.title}”: ${eligible} destinatarios serían elegibles. No se envió ni guardó ningún correo.`);
}
async function sendCampaign(id){
 if(!apiState.mode){showMessage('El envío real está deshabilitado en modo demostración.','error');return;}
 const campaign=apiState.data?.campaigns.find(item=>item.id===id);
 if(!campaign)return;
 const count=clientRecords().filter(customer=>!customer.isDemo&&!isDemoEmail(customer.email)&&customer.status==='activo'&&customer.marketingConsent===true&&!customer.unsubscribed&&!(apiState.data?.unsubscribedEmails||[]).includes(normalizeEmail(customer.email))&&(campaign.segment==='todos_consentidos'||customer.segment===campaign.segment)).length;
 if(!count){showMessage('No hay destinatarios reales activos con consentimiento y sin baja para esta campaña.','error');return;}
 if(!window.confirm(`Confirmas el envío a ${count} destinatario(s) reales elegibles? Resend solo permite confirmar aceptación, no entrega.`))return;
 try{
  const result=await apiRequest('/api/admin/send-campaign',{method:'POST',body:JSON.stringify({campaignId:id,confirmed:true,idempotencyKey:crypto.randomUUID()})});
  await loadApiState();
  const accepted=result.run.results.filter(item=>item.status==='accepted_by_provider').length;
  const failed=result.run.results.length-accepted;
  showMessage(`Proceso terminado: ${accepted} aceptado(s) por Resend; ${failed} fallido(s). La aceptación no implica entrega.`);
  refreshAdmin();
 }catch(error){showMessage(error.message,'error');}
}
export function handleAdminAction(event){
 const action=event.target.closest('[data-panel-action]')?.dataset.panelAction;
 if(!action)return false;
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
 if(action==='simulate-campaign'){simulateCampaign(event.target.closest('[data-panel-action]').dataset.id);return true;}
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
 if(event.target.matches('[data-customer-status],[data-customer-segment]')){refreshCustomerRows();return true;}
 const control=event.target.closest('[data-panel-order-status]');
 if(control){updateOrderStatus(control.dataset.panelOrderStatus,control.value);return true;}
 return false;
}
export async function handleAdminSubmit(event){
 const form=event.target;
 if(form.id==='panel-login-form'){event.preventDefault();await login(form);return true;}
 if(form.id==='panel-password-form'){event.preventDefault();await changePassword(form);return true;}
 if(form.id==='panel-contact-form'){event.preventDefault();saveContact(form);return true;}
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
