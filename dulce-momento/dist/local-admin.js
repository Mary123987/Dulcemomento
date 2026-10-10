import {BASE_PATH} from './seo.js';
import {recordInquiry,mergeContacts} from './crm.js';
import {initializeMarketing,marketingPeople,marketingMetrics,processInternalCampaign} from './marketing.js';

// Public presentation credentials, never a production authentication boundary.
export const presentationAccess={username:'admin',password:'presentacion'};
export const localMode=()=>globalThis.DM_ADMIN_STORAGE==='local'||(!globalThis.DM_ADMIN_API_URL&&!globalThis.document?.querySelector('meta[name="admin-api-origin"]')?.content&&globalThis.location?.hostname?.endsWith('.github.io'));
export const localKey='dm-presentation-v1:'+BASE_PATH;
const sessionKey=localKey+':session';
const email=value=>String(value||'').trim().toLowerCase();
const uuid=()=>globalThis.crypto.randomUUID();
export function readLocal(){
 const raw=localStorage.getItem(localKey);
 if(raw){const data=JSON.parse(raw);if(data.version!==1)throw Error('Versión de almacenamiento local no compatible.');return data;}
 const data=initializeMarketing({version:1,customers:[],contacts:[],orders:[],campaigns:[],settings:{inactivityDays:180},sendHistory:[],unsubscribedEmails:[]});
 recordInquiry(data,{name:'Elena',surname:'Santos',email:'elena.santos@example.com',queryType:'Personalización',message:'Quisiera conocer las opciones para una celebración.',marketingConsent:false});
 data.orders=structuredClone(data.referenceOrders).map(order=>({...order,status:'Pedido recibido',items:order.items||[],total:order.total||85}));
 data.campaigns=[{id:uuid(),name:'Novedades dulces',subject:'Descubre nuestros sabores',html:'<h1>Dulce Momento</h1><p>Descubre nuestros kekes artesanales.</p>',text:'Descubre nuestros kekes artesanales.',segment:'todos_consentidos',status:'borrador',createdAt:new Date().toISOString(),sendHistory:[]}];
 writeLocal(data);return data;
}
export function writeLocal(data){localStorage.setItem(localKey,JSON.stringify(data));}
export function saveLocalInquiry(input){const data=readLocal();recordInquiry(data,input);writeLocal(data);}
export function localAuthenticated(){return sessionStorage.getItem(sessionKey)==='open';}
export function localRequest(endpoint,options={}){
 const method=options.method||'GET';const input=JSON.parse(options.body||'{}');
 if(endpoint==='/api/email/status')return {backendAvailable:false,backendConfigured:false,mode:'local',externalEnabled:false,senderVerified:false,providerConfigured:false,requestedSender:'maryrojascordova20@gmail.com',reason:'Datos en este navegador. Sin conexión con un servidor ni envío de correos.'};
 if(endpoint==='/api/admin/login'){
  const access=globalThis.DM_PRESENTATION_ACCESS||presentationAccess;
  if(input.username!==access.username||input.password!==access.password)throw Error('Credenciales de presentación incorrectas.');
  readLocal();sessionStorage.setItem(sessionKey,'open');return {authenticated:true};
 }
 if(endpoint==='/api/admin/logout'){sessionStorage.removeItem(sessionKey);return {loggedOut:true};}
 if(!localAuthenticated())throw Error('Inicia sesión para abrir el panel local.');
 const data=readLocal();let result={};
 if(endpoint==='/api/admin/data')return {...data,marketing:{people:marketingPeople(data),metrics:marketingMetrics(data)}};
 const match=endpoint.match(/^\/api\/admin\/(customers|campaigns|contacts|orders)(?:\/([^/]+))?$/);
 if(endpoint==='/api/admin/settings'){
  if(!Number.isInteger(input.inactivityDays)||input.inactivityDays<1||input.inactivityDays>3650)throw Error('Plazo inválido.');
  data.settings.inactivityDays=input.inactivityDays;result=data.settings;
 }else if(endpoint==='/api/admin/send-campaign'){
  if(input.transport==='external'||input.confirmed!==true)throw Error('Solo se permite el procesamiento local confirmado.');
  const campaign=data.campaigns.find(item=>item.id===input.campaignId);
  if(!campaign||campaign.sendHistory?.length||data.sendHistory.some(run=>run.idempotencyKey===input.idempotencyKey))throw Error('La campaña ya fue procesada o no existe.');
  result={run:processInternalCampaign(data,campaign,{id:uuid(),key:input.idempotencyKey})};
 }else if(match){
  const [,kind,encoded]=match;const id=encoded?decodeURIComponent(encoded):null;
  const old=data[kind].find(item=>(kind==='orders'?item.orderId:item.id)===id);
  if(id&&!old)throw Error('Registro no encontrado.');
  if(method==='DELETE'){
   if(kind==='campaigns'&&old.sendHistory?.length)throw Error('La campaña tiene historial; se debe conservar.');
   if(kind==='customers')data.deletedCustomerEmails.push(email(old.email));
   data[kind]=data[kind].filter(item=>item!==old);
  }else if(kind==='contacts'){
   const existing=input.id&&data.contacts.find(item=>item.id===input.id);
   if(existing){if(email(input.email)!==email(existing.email))throw Error('Conserva el correo vinculado al historial.');Object.assign(existing,{name:input.name,surname:input.surname,status:input.status,message:input.message,queryType:input.queryType});}
   else{const contact=recordInquiry(data,{...input,marketingConsent:false});contact.status=input.status||'Nueva';}
   data.contacts=mergeContacts(data.contacts);
  }else if(kind==='orders'){
   if(!['Pedido recibido','Pago confirmado','En preparación','Listo','En camino','Entregado'].includes(input.status))throw Error('Estado inválido.');
   old.status=input.status;old.lastUpdatedAt=new Date().toISOString();
  }else if(kind==='customers'){
   const address=email(input.email);
   if(!input.name?.trim()||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address))throw Error('Revisa nombre y correo.');
   if(data.customers.some(item=>email(item.email)===address&&item!==old)||data.contacts.some(item=>email(item.email)===address&&(!old||email(old.email)!==address)))throw Error('Ya existe una ficha con ese correo.');
   if(old&&email(old.email)!==address)throw Error('Conserva el correo vinculado al historial.');
   const sample=old?.isDemo||address.endsWith('@example.com');
   const unsubscribed=Boolean(old?.unsubscribed||input.unsubscribed||data.unsubscribedEmails.includes(address));
   const consent=input.marketingConsent===true&&!unsubscribed&&!sample;
   if(consent&&(!Number.isFinite(Date.parse(input.consentDate))||!input.consentSource?.trim()))throw Error('Registra fecha y fuente del consentimiento.');
   if(unsubscribed)data.unsubscribedEmails=[...new Set([...data.unsubscribedEmails,address])];
   const customer={...old,...input,id:old?.id||uuid(),email:address,isDemo:Boolean(sample),unsubscribed,marketingConsent:consent,consentDate:consent?input.consentDate:null,consentSource:consent?input.consentSource:null,registeredAt:old?.registeredAt||input.registeredAt||new Date().toISOString(),campaignHistory:old?.campaignHistory||[]};
   if(sample)customer.eligibilityProfile={consent:input.marketingConsent===true,unsubscribed};
   data.customers=old?data.customers.map(item=>item===old?customer:item):[...data.customers,customer];
   data.deletedCustomerEmails=data.deletedCustomerEmails.filter(value=>value!==address);result={customer};
  }else if(kind==='campaigns'){
   if(old?.sendHistory?.length)throw Error('Duplica la campaña procesada para editarla.');
   if(!['name','subject','html','text'].every(key=>String(input[key]||'').trim())||!['todos_consentidos','nuevo','recurrente','inactivo','consulta'].includes(input.segment))throw Error('Completa todos los campos de campaña.');
   const campaign={...old,...input,id:old?.id||uuid(),status:'borrador',createdAt:old?.createdAt||new Date().toISOString(),sendHistory:[]};
   data.campaigns=old?data.campaigns.map(item=>item===old?campaign:item):[campaign,...data.campaigns];result={campaign};
  }
 }else throw Error('Operación no disponible en el almacenamiento local.');
 writeLocal(data);return result;
}
