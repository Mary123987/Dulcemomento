import {initializeMarketing,marketingPeople,campaignAudience,marketingMetrics,processInternalCampaign} from './dist/marketing.js';
import {mergeContacts,recordInquiry,directory,purchaseStats,eligibleRecipients,inactivityDays} from './dist/crm.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import './env.mjs';

const DATA_FILE=path.resolve(process.env.ADMIN_DATA_FILE||'data/admin-data.json');
const sessions=new Map();
const loginAttempts=new Map();
const activeCampaignSends=new Set();
const activeTestSends=new Set();
let dataWriteLock=Promise.resolve();
const REQUESTED_FROM='maryrojascordova20@gmail.com';
const DEMO_CUSTOMERS=[
 {id:'demo-ana-torres',name:'Ana Torres',email:'ana.torres@example.com',registeredAt:'2026-01-10T10:00:00.000Z',status:'activo',segment:'nuevo',marketingConsent:false,consentDate:null,consentSource:null,campaignHistory:[],isDemo:true},
 {id:'demo-lucia-perez',name:'Lucía Pérez',email:'lucia.perez@example.com',registeredAt:'2026-01-12T10:00:00.000Z',status:'activo',segment:'recurrente',marketingConsent:false,consentDate:null,consentSource:null,campaignHistory:[],isDemo:true},
 {id:'demo-carla-mendoza',name:'Carla Mendoza',email:'carla.mendoza@example.com',registeredAt:'2026-01-15T10:00:00.000Z',status:'activo',segment:'nuevo',marketingConsent:false,consentDate:null,consentSource:null,campaignHistory:[],isDemo:true},
 {id:'demo-sofia-ramirez',name:'Sofía Ramírez',email:'sofia.ramirez@example.com',registeredAt:'2026-01-18T10:00:00.000Z',status:'activo',segment:'inactivo',marketingConsent:false,consentDate:null,consentSource:null,campaignHistory:[],isDemo:true},
 {id:'demo-valeria-castro',name:'Valeria Castro',email:'valeria.castro@example.com',registeredAt:'2026-01-20T10:00:00.000Z',status:'activo',segment:'recurrente',marketingConsent:false,consentDate:null,consentSource:null,campaignHistory:[],isDemo:true},
 {id:'demo-diego-flores',name:'Diego Flores',email:'diego.flores@example.com',registeredAt:'2026-01-23T10:00:00.000Z',status:'inactivo',segment:'inactivo',marketingConsent:false,consentDate:null,consentSource:null,campaignHistory:[],isDemo:true},
 {id:'demo-camila-vega',name:'Camila Vega',email:'camila.vega@example.com',registeredAt:'2026-01-25T10:00:00.000Z',status:'activo',segment:'nuevo',marketingConsent:false,consentDate:null,consentSource:null,campaignHistory:[],isDemo:true},
 {id:'demo-andrea-ruiz',name:'Andrea Ruiz',email:'andrea.ruiz@example.com',registeredAt:'2026-01-28T10:00:00.000Z',status:'activo',segment:'recurrente',marketingConsent:false,consentDate:null,consentSource:null,campaignHistory:[],isDemo:true}
];
const emailCard=(heading,content)=>`<div style="margin:0;background:#fbf6ee;padding:24px 12px"><div style="max-width:600px;margin:0 auto;background:#fffaf2;padding:32px 24px;border-radius:16px;color:#493329;font:16px/1.6 Arial,sans-serif"><p style="color:#b55740;font:600 13px Arial,sans-serif;letter-spacing:2px">DULCE MOMENTO</p><h1 style="color:#493329;font:600 28px/1.2 Georgia,serif">${heading}</h1>${content}</div></div>`;
const DEMO_CAMPAIGNS=[
 {id:'template-welcome',name:'Bienvenida',subject:'¡Bienvenido a Dulce Momento!',html:emailCard('¡Bienvenido a Dulce Momento!','<p>Gracias por acompañarnos. Descubre nuestros kekes artesanales y encuentra inspiración para tu próximo momento especial.</p>'),text:'¡Bienvenido a Dulce Momento! Gracias por acompañarnos. Descubre nuestros kekes artesanales.',segment:'nuevo',status:'borrador',createdAt:'2026-01-01T00:00:00.000Z',isDemo:true},
 {id:'template-news',name:'Novedades dulces',subject:'Descubre nuestros sabores favoritos.',html:emailCard('Novedades dulces','<p>Explora el catálogo de Dulce Momento y descubre opciones para compartir en tus celebraciones.</p>'),text:'Explora el catálogo de Dulce Momento y descubre nuestros sabores.',segment:'todos_consentidos',status:'borrador',createdAt:'2026-01-01T00:00:00.000Z',isDemo:true},
 {id:'template-returning',name:'Clientes recurrentes',subject:'Tenemos algo especial para ti.',html:emailCard('Gracias por volver','<p>Gracias por elegir Dulce Momento para tus celebraciones. Nos alegra ser parte de esos momentos especiales.</p>'),text:'Gracias por volver a elegir Dulce Momento. Nos alegra acompañar tus momentos especiales.',segment:'recurrente',status:'borrador',createdAt:'2026-01-01T00:00:00.000Z',isDemo:true}
];

const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));};
const text=(res,status,value)=>{res.writeHead(status,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(value);};
const normalizeEmail=value=>String(value||'').trim().toLowerCase();
const isDemoEmail=email=>/@(?:[^@]+\.)?example\.com$/i.test(email);
const safeError=error=>String(error?.message||error||'Error interno').slice(0,500);

function seedData(){
 return initializeMarketing({contacts:[],orders:[],settings:{inactivityDays:180},customers:DEMO_CUSTOMERS.map(person=>({...person,segment:'consulta'})),campaigns:structuredClone(DEMO_CAMPAIGNS),sendHistory:[],unsubscribedEmails:[]});
}
async function readData(){
 try{
  const data=JSON.parse(await fs.readFile(DATA_FILE,'utf8'));
  const normalized={marketingVersion:data.marketingVersion,referenceOrders:data.referenceOrders||[],deletedCustomerEmails:data.deletedCustomerEmails||[],contacts:mergeContacts(Array.isArray(data.contacts)?data.contacts:[]),orders:Array.isArray(data.orders)?data.orders:[],settings:{inactivityDays:inactivityDays(data.settings?.inactivityDays)},customers:Array.isArray(data.customers)?data.customers:[],campaigns:Array.isArray(data.campaigns)?data.campaigns:[],sendHistory:Array.isArray(data.sendHistory)?data.sendHistory:[],unsubscribedEmails:Array.isArray(data.unsubscribedEmails)?data.unsubscribedEmails:[]};
  normalized.customers=directory(normalized.customers,normalized.contacts,normalized.orders,normalized.settings.inactivityDays).filter(person=>!normalized.deletedCustomerEmails.includes(normalizeEmail(person.email)));
  const migration=normalized.marketingVersion!==2;initializeMarketing(normalized);if(migration)await writeData(normalized);
  return normalized;
 }catch(error){
  if(error.code!=='ENOENT')throw error;
  const data=seedData();
  await writeData(data);
  return data;
 }
}
async function writeData(data){
 await fs.mkdir(path.dirname(DATA_FILE),{recursive:true});
 const temp=`${DATA_FILE}.${process.pid}.${crypto.randomUUID()}.tmp`;
 await fs.writeFile(temp,JSON.stringify(data,null,2),{mode:0o600});
 await fs.rename(temp,DATA_FILE);
}
async function acquireDataLock(){
 let release;
 const previous=dataWriteLock;
 dataWriteLock=new Promise(resolve=>{release=resolve;});
 await previous;
 return release;
}
async function storeTestResult(record){
 const data=await readData();
 const historyIndex=data.sendHistory.findIndex(item=>item.id===record.id);
 if(historyIndex<0)data.sendHistory.unshift(record);
 else data.sendHistory[historyIndex]=record;
 const campaign=data.campaigns.find(item=>item.id===record.campaignId);
 if(campaign){
  const summary={runId:record.id,finishedAt:record.finishedAt,status:record.status,recipientCount:1,results:[{email:record.recipient,status:record.status,providerId:record.providerId,error:record.error}]};
  const index=(campaign.sendHistory||[]).findIndex(item=>item.runId===record.id);
  if(index<0)campaign.sendHistory=[...(campaign.sendHistory||[]),summary];
  else campaign.sendHistory[index]=summary;
 }
 await writeData(data);
}
function parseCookies(header=''){
 const cookies={};
 for(const part of header.split(';')){
  const separator=part.indexOf('=');
  if(separator<0)continue;
  cookies[part.slice(0,separator).trim()]=part.slice(separator+1).trim();
 }
 return cookies;
}
function getSession(req){
 const token=parseCookies(req.headers.cookie||'').dm_admin_session;
 const session=token&&sessions.get(token);
 if(!session||session.expiresAt<Date.now()){if(token)sessions.delete(token);return null;}
 return session;
}
function originAllowed(req){
 const allowed=process.env.FRONTEND_ORIGIN;
 const origin=req.headers.origin;
 if(!origin)return true;
 try{
  const parsed=new URL(origin);
  if(allowed&&origin===allowed)return true;
  return parsed.host===req.headers.host;
 }catch{return false;}
}
function corsHeaders(req,res){
 const origin=req.headers.origin;
 if(!origin)return true;
 if(!originAllowed(req))return false;
 res.setHeader('Access-Control-Allow-Origin',origin);
 res.setHeader('Access-Control-Allow-Credentials','true');
 res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, DELETE, OPTIONS');
 res.setHeader('Access-Control-Allow-Headers','Content-Type');
 res.setHeader('Vary','Origin');
 return true;
}
async function bodyJson(req){
 let data='';
 for await(const chunk of req){
  data+=chunk;
  if(data.length>1_000_000)throw Object.assign(new Error('Solicitud demasiado grande.'),{status:413});
 }
 try{
  const value=JSON.parse(data||'{}');
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Se esperaba un objeto JSON.');
  return value;
 }catch{throw Object.assign(new Error('JSON inválido: se esperaba un objeto.'),{status:400});}
}
async function bodyForm(req){let value='';for await(const chunk of req){value+=chunk;if(value.length>10000)throw Object.assign(Error('Solicitud demasiado grande.'),{status:413});}return new URLSearchParams(value);}
function adminConfigurationError(){
 const missing=[];
 if(!process.env.ADMIN_USERNAME?.trim())missing.push('ADMIN_USERNAME');
 if(!process.env.ADMIN_PASSWORD||process.env.ADMIN_PASSWORD.length<8)missing.push('ADMIN_PASSWORD (mínimo 8 caracteres)');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.ADMIN_EMAIL||''))missing.push('ADMIN_EMAIL (correo válido)');
 if(!process.env.SESSION_SECRET||process.env.SESSION_SECRET.length<32)missing.push('SESSION_SECRET (mínimo 32 caracteres)');
 return missing.length?`Configura estas variables del servidor: ${missing.join(', ')}.`:null;
}
function adminConfigured(){
 return adminConfigurationError()===null;
}
export function adminConfigurationStatus(){
 return adminConfigurationError();
}
const externalEnabled=()=>process.env.EXTERNAL_EMAIL_ENABLED==='true';
async function resendDomains(){
 if(!externalEnabled())return {configured:false,verified:false,reason:'El transporte externo no está habilitado.'};
 if(!process.env.RESEND_API_KEY)return {configured:false,verified:false,reason:'Falta RESEND_API_KEY.'};
 const response=await fetch('https://api.resend.com/domains',{headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`},signal:AbortSignal.timeout(10000)});
 const result=await response.json().catch(()=>({}));
 if(!response.ok)return {configured:false,verified:false,reason:`Resend respondió HTTP ${response.status}; revisa la clave API del servidor.`};
 const fromEmail=normalizeEmail(process.env.RESEND_FROM_EMAIL||REQUESTED_FROM);
 const domain=fromEmail.split('@')[1]||'';
 const matching=(result.data||[]).find(item=>String(item.name||'').toLowerCase()===domain);
 return {configured:Boolean(matching&&matching.status==='verified'),verified:Boolean(matching&&matching.status==='verified'),reason:matching?.status==='verified'?null:`El dominio ${domain||'(remitente inválido)'} no aparece como verificado en Resend.`,fromEmail,domainStatus:matching?.status||'not_found'};
}
function requireAdmin(req,res){
 const configurationError=adminConfigurationError();
 if(configurationError){json(res,503,{error:`Backend administrativo no configurado. ${configurationError}`});return false;}
 if(!originAllowed(req)){json(res,403,{error:'Origen no autorizado.'});return false;}
 if(!getSession(req)){json(res,401,{error:'Sesión de administración requerida.'});return false;}
 return true;
}
function cookieSite(req){
 const protocol=req.socket.encrypted||req.headers['x-forwarded-proto']==='https'?'https:':'http:';
 const host=String(req.headers.host||'').replace(/:\d+$/,'');
 try{
  const frontend=new URL(process.env.FRONTEND_ORIGIN||`${protocol}//${req.headers.host}`);
  return {crossSite:frontend.protocol!==protocol||frontend.hostname!==host,secure:frontend.protocol==='https:'||Boolean(req.socket.encrypted)||process.env.COOKIE_SECURE==='true'};
 }catch{return {crossSite:false,secure:Boolean(req.socket.encrypted)||process.env.COOKIE_SECURE==='true'};}
}
function cookieAttributes(req,token){
 const {crossSite,secure}=cookieSite(req);
 return `dm_admin_session=${encodeURIComponent(token)}; Path=/api; HttpOnly; SameSite=${crossSite?'None':'Strict'}; Max-Age=${8*60*60}${secure?'; Secure':''}`;
}
function expiredCookie(req){
 const {crossSite,secure}=cookieSite(req);
 return `dm_admin_session=; Path=/api; HttpOnly; SameSite=${crossSite?'None':'Strict'}; Max-Age=0${secure?'; Secure':''}`;
}
function validCustomer(customer){
 return customer&&typeof customer==='object'&&String(customer.name||'').trim().length>=2&&String(customer.name).length<=120&&String(customer.email||'').length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(customer.email))&&['activo','inactivo'].includes(customer.status)&&(!customer.registeredAt||Number.isFinite(Date.parse(customer.registeredAt)))&&(!customer.marketingConsent||(Number.isFinite(Date.parse(customer.consentDate))&&String(customer.consentSource||'').trim().length>=2&&String(customer.consentSource).length<=200));
}
function validCampaign(campaign){
 return campaign&&typeof campaign==='object'&&String(campaign.name||'').trim().length>0&&String(campaign.name).length<=120&&String(campaign.subject||'').trim().length>0&&String(campaign.subject).length<=160&&String(campaign.html||'').trim().length>0&&String(campaign.html).length<=100000&&String(campaign.text||'').trim().length>0&&String(campaign.text).length<=100000&&['nuevo','recurrente','inactivo','consulta','todos_consentidos'].includes(campaign.segment);
}
function eligibleCustomers(data,campaign){return eligibleRecipients(data,campaign);}
async function providerSend({to,subject,html,text,replyTo,idempotencyKey,readiness:knownReadiness}){
 if(!externalEnabled())throw Object.assign(new Error('El transporte externo no está habilitado.'),{code:'PROVIDER_NOT_READY'});
 const readiness=knownReadiness||await resendDomains();
 if(!readiness.configured)throw Object.assign(new Error(readiness.reason||'Resend no está configurado.'),{code:'PROVIDER_NOT_READY'});
 const fromEmail=normalizeEmail(process.env.RESEND_FROM_EMAIL||REQUESTED_FROM);
 const fromName=String(process.env.RESEND_FROM_NAME||'Dulce Momento').replace(/[\r\n<>]/g,'').slice(0,100);
 const replyAddress=normalizeEmail(replyTo||process.env.RESEND_REPLY_TO||process.env.ADMIN_EMAIL);
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyAddress))throw Object.assign(new Error('RESEND_REPLY_TO debe contener un correo válido.'),{code:'INVALID_CONFIGURATION'});
 const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':idempotencyKey},body:JSON.stringify({from:`${fromName} <${fromEmail}>`,to:[to],subject,html,text,reply_to:replyAddress}),signal:AbortSignal.timeout(10000)});
 const result=await response.json().catch(()=>({}));
 if(!response.ok)throw Object.assign(new Error(`Resend HTTP ${response.status}: ${safeError(result.message||result.name||'falló la solicitud')}`),{code:'RESEND_REJECTED',httpStatus:response.status});
 if(!result.id)throw Object.assign(new Error('Resend no confirmó un identificador para el mensaje.'),{code:'RESEND_UNCONFIRMED'});
 return {id:result.id};
}
function campaignHtml(campaign,unsubscribeUrl){
 const html=String(campaign.html||'').slice(0,100000);
 return `${html}<hr><p style="font:14px Arial,sans-serif;color:#756b62">Has recibido este correo porque aceptaste comunicaciones comerciales de Dulce Momento. <a href="${unsubscribeUrl}">Cancelar suscripción</a>.</p>`;
}
function unsubscribeToken(email){
 const encoded=Buffer.from(normalizeEmail(email)).toString('base64url');
 const signature=crypto.createHmac('sha256',process.env.SESSION_SECRET).update(encoded).digest('base64url');
 return `${encoded}.${signature}`;
}
async function handleUnsubscribe(req,res,url){
 const token=url.searchParams.get('token')||'';
 if(req.method==='GET'){
  if(!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)){text(res,400,'Enlace de cancelación inválido.');return;}
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cancelar suscripción</title><body style="font:16px Arial,sans-serif;max-width:38rem;margin:4rem auto;padding:1rem;color:#493329"><h1>Cancelar suscripción</h1><p>Confirma que ya no deseas recibir comunicaciones comerciales de Dulce Momento.</p><form method="post" action="/api/unsubscribe"><input type="hidden" name="token" value="${token}"><button style="padding:.75rem 1rem;background:#b55740;color:white;border:0;border-radius:8px">Confirmar cancelación</button></form></body></html>`);
  return;
 }
 const postBody=await bodyForm(req);
 const postedToken=String(postBody.get('token')||'');
 const [encoded,provided]=(postedToken||token).split('.');
 if(!encoded||!provided||!process.env.SESSION_SECRET){text(res,400,'Enlace de cancelación inválido.');return;}
 const expected=crypto.createHmac('sha256',process.env.SESSION_SECRET).update(encoded).digest();
 let actual;try{actual=Buffer.from(provided,'base64url')}catch{text(res,400,'Enlace de cancelación inválido.');return;}
 if(actual.length!==expected.length||!crypto.timingSafeEqual(actual,expected)){text(res,400,'Enlace de cancelación inválido.');return;}
 let email;try{email=normalizeEmail(Buffer.from(encoded,'base64url').toString())}catch{text(res,400,'Enlace de cancelación inválido.');return;}
 const data=await readData();
 if(!data.unsubscribedEmails.includes(email))data.unsubscribedEmails.push(email);
 data.customers=data.customers.map(customer=>normalizeEmail(customer.email)===email?{...customer,marketingConsent:false,consentDate:null,consentSource:null,unsubscribedAt:new Date().toISOString(),unsubscribed:true}:customer);
 await writeData(data);
 text(res,200,'La suscripción comercial de este correo fue cancelada.');
}

export async function handleAdminApi(req,res,url){
 let activeSendId=null;
 let activeTestKey=null;
 let releaseDataLock=null;
 try{
  if(!corsHeaders(req,res)){json(res,403,{error:'Origen no autorizado.'});return;}
  if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
  if(req.method==='GET'&&url.pathname==='/api/admin/data')releaseDataLock=await acquireDataLock();
  const writesData=req.method==='POST'||req.method==='PUT'||req.method==='DELETE';
  if(writesData&&(url.pathname==='/api/contacts'||url.pathname.startsWith('/api/admin/contacts')||url.pathname==='/api/admin/settings'||url.pathname.startsWith('/api/admin/orders/')||url.pathname==='/api/unsubscribe'||url.pathname.startsWith('/api/admin/customers')||url.pathname.startsWith('/api/admin/campaigns')||url.pathname==='/api/admin/test-email'||url.pathname==='/api/admin/send-campaign'))releaseDataLock=await acquireDataLock();
  if(url.pathname==='/api/email/status'&&req.method==='GET'){
   const provider=getSession(req)?await resendDomains().catch(error=>({configured:false,verified:false,reason:`No se pudo consultar Resend: ${safeError(error)}`})):{configured:false,verified:false,reason:process.env.RESEND_API_KEY?'Inicia sesión para consultar el estado de Resend.':'Falta RESEND_API_KEY.'};
   json(res,200,{backendAvailable:true,backendConfigured:adminConfigured(),configurationError:adminConfigurationError(),providerConfigured:provider.configured,senderVerified:provider.verified,senderEmail:provider.fromEmail||normalizeEmail(process.env.RESEND_FROM_EMAIL||REQUESTED_FROM),replyTo:process.env.RESEND_REPLY_TO||process.env.ADMIN_EMAIL||'',requestedSender:REQUESTED_FROM,domainStatus:provider.domainStatus||'not_checked',reason:provider.reason||null,externalEnabled:externalEnabled(),mode:provider.configured?'external':'internal',apiKeyConfigured:Boolean(process.env.RESEND_API_KEY)});
   return;
  }
  if(url.pathname==='/api/unsubscribe'&&(req.method==='GET'||req.method==='POST')){await handleUnsubscribe(req,res,url);return;}
  if(url.pathname==='/api/contacts'&&req.method==='POST'){
   if(!adminConfigured()){json(res,503,{error:'Servicio de contacto no configurado.'});return;}
   const input=await bodyJson(req);const data=await readData();recordInquiry(data,input);await writeData(data);json(res,201,{received:true});return;
  }
  if(!url.pathname.startsWith('/api/admin/')){json(res,404,{error:'Endpoint no encontrado.'});return;}
  if(!originAllowed(req)){json(res,403,{error:'Origen no autorizado.'});return;}
  if(url.pathname==='/api/admin/login'&&req.method==='POST'){
   const configurationError=adminConfigurationError();
   if(configurationError){json(res,503,{error:`Backend administrativo no configurado. ${configurationError}`});return;}
   const ip=req.socket.remoteAddress||'unknown';const attempts=loginAttempts.get(ip)||{count:0,until:0};
   if(attempts.until>Date.now()){json(res,429,{error:'Demasiados intentos. Espera cinco minutos.'});return;}
   const data=await bodyJson(req);
   const valid=String(data.username||'')===process.env.ADMIN_USERNAME&&crypto.timingSafeEqual(crypto.createHash('sha256').update(String(data.password||'')).digest(),crypto.createHash('sha256').update(process.env.ADMIN_PASSWORD).digest());
   if(!valid){attempts.count++;if(attempts.count>=5){attempts.count=0;attempts.until=Date.now()+5*60*1000;}loginAttempts.set(ip,attempts);json(res,401,{error:'Usuario o contraseña incorrectos.'});return;}
   loginAttempts.delete(ip);
   const token=crypto.randomBytes(32).toString('base64url');
   sessions.set(token,{expiresAt:Date.now()+8*60*60*1000});
   res.setHeader('Set-Cookie',cookieAttributes(req,token));
   json(res,200,{authenticated:true});
   return;
  }
  if(url.pathname==='/api/admin/logout'&&req.method==='POST'){
   const token=parseCookies(req.headers.cookie||'').dm_admin_session;
   if(token)sessions.delete(token);
   res.setHeader('Set-Cookie',expiredCookie(req));
   json(res,200,{loggedOut:true});return;
  }
  if(!requireAdmin(req,res))return;
  if(url.pathname==='/api/admin/data'&&req.method==='GET'){const data=await readData();json(res,200,{...data,marketing:{people:marketingPeople(data),metrics:marketingMetrics(data)}});return;}
  if(url.pathname==='/api/admin/settings'&&req.method==='PUT'){
   const input=await bodyJson(req);if(!Number.isInteger(input.inactivityDays)||input.inactivityDays<1||input.inactivityDays>3650){json(res,400,{error:'El plazo debe ser de 1 a 3650 días.'});return;}
   const data=await readData();data.settings={inactivityDays:input.inactivityDays};await writeData(data);json(res,200,data.settings);return;
  }
  if(url.pathname==='/api/admin/contacts'&&req.method==='POST'){
   const input=await bodyJson(req);const data=await readData();
   const existing=data.contacts.find(item=>item.id===input.id);
   if(existing&&normalizeEmail(input.email)!==normalizeEmail(existing.email)){json(res,400,{error:'El correo vinculado al historial no puede modificarse.'});return;}
   const contact=recordInquiry(data,{...input,surname:input.surname||'Sin apellido',marketingConsent:false});
   contact.status=['Nueva','Pendiente','Atendida','En seguimiento'].includes(input.status)?input.status:'Nueva';
   await writeData(data);json(res,200,{contact});return;
  }
  const orderMatch=url.pathname.match(/^\/api\/admin\/orders\/([^/]+)$/);
  if(orderMatch&&req.method==='PUT'){
   const input=await bodyJson(req);const data=await readData();const order=data.orders.find(item=>item.orderId===decodeURIComponent(orderMatch[1]));
   if(!order){json(res,404,{error:'Pedido no encontrado.'});return;}
   if(!['Pedido recibido','Pago confirmado','En preparación','Listo','En camino','Entregado'].includes(input.status)){json(res,400,{error:'Estado inválido.'});return;}
   order.status=input.status;order.lastUpdatedAt=new Date().toISOString();await writeData(data);json(res,200,{order});return;
  }
  const contactMatch=url.pathname.match(/^\/api\/admin\/contacts\/([^/]+)$/);
  if(contactMatch&&req.method==='DELETE'){const data=await readData();data.contacts=data.contacts.filter(item=>item.id!==decodeURIComponent(contactMatch[1]));await writeData(data);json(res,200,{deleted:true});return;}
  const customerMatch=url.pathname.match(/^\/api\/admin\/customers\/([^/]+)$/);
  if((url.pathname==='/api/admin/customers'&&req.method==='POST')||customerMatch){
   const data=await readData();const id=customerMatch?decodeURIComponent(customerMatch[1]):null;
   const old=id?data.customers.find(person=>person.id===id):null;
   if(id&&!old){json(res,404,{error:'Cliente no encontrado.'});return;}
   if(req.method==='DELETE'){
    data.deletedCustomerEmails=[...new Set([...data.deletedCustomerEmails,normalizeEmail(old.email)])];
    data.customers=data.customers.filter(person=>person.id!==id);await writeData(data);json(res,200,{deleted:true});return;
   }
   if(!['POST','PUT'].includes(req.method)){json(res,405,{error:'Método no permitido.'});return;}
   const input=await bodyJson(req);const email=normalizeEmail(input.email);const sample=old?old.isDemo===true:isDemoEmail(email);
   if(old&&sample!==isDemoEmail(email)){json(res,400,{error:'El dominio de correo no es compatible con esta ficha.'});return;}
   if(!validCustomer({...input,marketingConsent:sample?false:input.marketingConsent})){json(res,400,{error:'Revisa nombre, correo, estado y evidencia del consentimiento.'});return;}
   if(data.customers.some(person=>person.id!==id&&normalizeEmail(person.email)===email)){json(res,409,{error:'Ya existe un cliente con este correo.'});return;}
   const changed=old&&normalizeEmail(old.email)!==email;
   const unsubscribed=Boolean(old?.unsubscribed||data.unsubscribedEmails.includes(email)||input.unsubscribed===true);
   if(unsubscribed)data.unsubscribedEmails=[...new Set([...data.unsubscribedEmails,email])];
   const consent=!sample&&!changed&&!unsubscribed&&input.marketingConsent===true;
   const stored={...old,id:id||crypto.randomUUID(),name:String(input.name).trim(),email,status:input.status,registeredAt:old?.registeredAt||input.registeredAt||new Date().toISOString(),isDemo:sample,marketingConsent:consent,consentDate:consent?input.consentDate:null,consentSource:consent?String(input.consentSource).trim():null,unsubscribed,campaignHistory:old?.campaignHistory||[]};
   if(sample)stored.eligibilityProfile={consent:input.marketingConsent===true,unsubscribed:Boolean(old?.eligibilityProfile?.unsubscribed||input.unsubscribed===true)};
   if(changed){
    for(const order of [...data.orders,...data.referenceOrders])if(normalizeEmail(order.customer?.email)===normalizeEmail(old.email))order.customer.email=email;
    for(const contact of data.contacts)if(normalizeEmail(contact.email)===normalizeEmail(old.email)){contact.email=email;contact.marketingConsent=false;contact.consentDate=null;contact.consentSource=null;}
    if(unsubscribed)data.unsubscribedEmails=[...new Set([...data.unsubscribedEmails,email])];
   }
   data.deletedCustomerEmails=data.deletedCustomerEmails.filter(address=>address!==email);
   data.customers=old?data.customers.map(person=>person.id===id?stored:person):[...data.customers,stored];
   await writeData(data);json(res,old?200:201,{customer:{...stored,...purchaseStats(email,data.orders,data.settings.inactivityDays)}});return;
  }
  if(url.pathname==='/api/admin/campaigns'&&req.method==='POST'){
   const campaign=await bodyJson(req);const data=await readData();
   if(!validCampaign(campaign)){json(res,400,{error:'Campaña inválida: nombre, asunto, contenido HTML, texto alternativo y segmento válidos son obligatorios.'});return;}
   const now=new Date().toISOString();const stored={id:crypto.randomUUID(),name:String(campaign.name).trim(),subject:String(campaign.subject).trim(),html:String(campaign.html),text:String(campaign.text),segment:campaign.segment,status:'borrador',createdAt:now,updatedAt:now,isDemo:false,sendHistory:[]};
   data.campaigns.unshift(stored);await writeData(data);json(res,201,{campaign:stored});return;
  }
  const campaignMatch=url.pathname.match(/^\/api\/admin\/campaigns\/([^/]+)$/);
  if(campaignMatch){
   const id=decodeURIComponent(campaignMatch[1]);const data=await readData();const index=data.campaigns.findIndex(campaign=>campaign.id===id);
   if(index<0){json(res,404,{error:'Campaña no encontrada.'});return;}
   if(req.method==='PUT'){
    if(['procesada','procesada_con_errores','processing','enviado_al_proveedor'].includes(data.campaigns[index].status)){json(res,409,{error:'Duplica la campaña para preparar una nueva versión.'});return;}
    const update=await bodyJson(req);
    if(!validCampaign(update)){json(res,400,{error:'Campaña inválida: nombre, asunto, contenido HTML, texto alternativo y segmento válidos son obligatorios.'});return;}
    data.campaigns[index]={...data.campaigns[index],name:String(update.name).trim(),subject:String(update.subject).trim(),html:String(update.html),text:String(update.text),segment:update.segment,updatedAt:new Date().toISOString()};await writeData(data);json(res,200,{campaign:data.campaigns[index]});return;
   }
   if(req.method==='DELETE'){
    if(data.campaigns[index].sendHistory?.length){json(res,409,{error:'No se puede eliminar una campaña con historial de envío.'});return;}
    data.campaigns.splice(index,1);await writeData(data);json(res,200,{deleted:true});return;
   }
  }
  if(url.pathname==='/api/admin/test-email'&&req.method==='POST'){
   const data=await bodyJson(req);const recipient=normalizeEmail(process.env.ADMIN_EMAIL);
   const allowed=normalizeEmail(data.to)===recipient;
   if(!allowed){json(res,403,{error:'La vista previa se limita al correo autorizado de administración.'});return;}
   const idempotencyKey=String(data.idempotencyKey||`test/${crypto.randomUUID()}`);
   if(idempotencyKey.length<8||idempotencyKey.length>120){json(res,400,{error:'Clave de idempotencia inválida.'});return;}
   const previous=(await readData()).sendHistory.find(item=>item.idempotencyKey===idempotencyKey);
   if(previous){json(res,409,{error:'Esta operación ya fue procesada.',result:previous});return;}
   if(activeTestSends.has(idempotencyKey)){json(res,409,{error:'Esta operación ya está en curso.'});return;}
   activeTestSends.add(idempotencyKey);activeTestKey=idempotencyKey;
   const record={id:crypto.randomUUID(),idempotencyKey,type:'test',campaignId:String(data.campaignId||''),recipient,subject:String(data.subject||'Prueba | Dulce Momento').slice(0,160),requestedAt:new Date().toISOString(),status:'processing',providerId:null,error:null};
   await storeTestResult(record);
   let sendError=null;
   try{
    const sent=await providerSend({to:recipient,subject:record.subject,html:String(data.html||'<p>Correo de prueba de Dulce Momento.</p>').slice(0,100000),text:String(data.text||'Correo de prueba de Dulce Momento.').slice(0,100000),replyTo:process.env.RESEND_REPLY_TO||recipient,idempotencyKey});
    record.status='accepted_by_provider';record.providerId=sent.id;
   }catch(error){record.status='failed';record.error=safeError(error);sendError=error;}
   record.finishedAt=new Date().toISOString();
   await storeTestResult(record);
   activeTestSends.delete(idempotencyKey);activeTestKey=null;
   if(sendError){json(res,sendError.code==='PROVIDER_NOT_READY'?503:502,{error:safeError(sendError),status:'failed'});return;}
   json(res,200,{status:record.status,providerId:record.providerId,recipient});
   return;
  }
  if(url.pathname==='/api/admin/send-campaign'&&req.method==='POST'){
   const request=await bodyJson(req);const data=await readData();const campaign=data.campaigns.find(item=>item.id===request.campaignId);
   if(!campaign){json(res,404,{error:'Campaña no encontrada.'});return;}
   if(request.transport!=='external'){
    if(request.confirmed!==true){json(res,400,{error:'Confirma el procesamiento de la campaña.'});return;}
    if(typeof request.idempotencyKey!=='string'||request.idempotencyKey.length<8||request.idempotencyKey.length>120){json(res,400,{error:'Falta una clave de operación válida.'});return;}
    const prior=data.sendHistory.find(run=>run.idempotencyKey===request.idempotencyKey);
    if(prior){json(res,409,{error:'Esta operación ya fue registrada.',run:prior});return;}
    if(['procesada','procesada_con_errores','processing','enviado_al_proveedor'].includes(campaign.status)){json(res,409,{error:'Esta campaña ya fue procesada. Duplica el borrador para una nueva operación.'});return;}
    if(!validCampaign(campaign)){json(res,400,{error:'Completa nombre, asunto, HTML, texto alternativo y segmento antes de procesar.'});return;}
    const run=processInternalCampaign(data,campaign,{id:crypto.randomUUID(),key:request.idempotencyKey});
    await writeData(data);json(res,200,{run,metrics:marketingMetrics(data)});return;
   }
   if(!externalEnabled()){json(res,403,{error:'El transporte externo no está habilitado.'});return;}
   if(campaign.isDemo){json(res,403,{error:'Duplica la plantilla antes de utilizar el transporte externo.'});return;}
   if(request.confirmed!==true){json(res,400,{error:'Se requiere confirmación explícita antes del envío.'});return;}
   if(!data.sendHistory.some(item=>item.type==='test'&&item.status==='accepted_by_provider')){json(res,403,{error:'Primero verifica la vista previa en el correo de administración.'});return;}
   if(activeCampaignSends.has(campaign.id)){json(res,409,{error:'Ya hay un envío de esta campaña en curso.'});return;}
   if(typeof request.idempotencyKey!=='string'||request.idempotencyKey.length<8||request.idempotencyKey.length>120){json(res,400,{error:'Falta una clave de idempotencia válida.'});return;}
   const prior=data.sendHistory.find(item=>item.idempotencyKey===request.idempotencyKey);
   if(prior){json(res,409,{error:'Esta solicitud ya fue procesada.',result:prior});return;}
   if(['enviado_al_proveedor','processing','procesada','procesada_con_errores'].includes(campaign.status)){json(res,409,{error:'Esta campaña ya inició un envío. Duplica el borrador para evitar reenvíos accidentales.'});return;}
   const recipients=eligibleCustomers(data,campaign);
   if(!recipients.length){json(res,400,{error:'No hay destinatarios reales activos con consentimiento para ese segmento.'});return;}
   const providerStatus=await resendDomains();
   if(!providerStatus.configured){json(res,503,{error:providerStatus.reason||'Resend no está preparado para enviar.'});return;}
   activeCampaignSends.add(campaign.id);
   activeSendId=campaign.id;
   const run={id:crypto.randomUUID(),type:'campaign',transport:'external',campaignId:campaign.id,idempotencyKey:request.idempotencyKey,startedAt:new Date().toISOString(),recipientCount:recipients.length,status:'processing',results:[]};
   campaign.status='processing';
   data.sendHistory.unshift(run);await writeData(data);
   for(const customer of recipients){
    const entry={email:customer.email,status:'failed',providerId:null,attemptedAt:new Date().toISOString(),error:null};
    try{
     const token=unsubscribeToken(customer.email);
     const base=process.env.PUBLIC_API_URL||`http://${req.headers.host}`;
     const unsubscribeUrl=`${base}/api/unsubscribe?token=${encodeURIComponent(token)}`;
     const sent=await providerSend({to:customer.email,subject:campaign.subject,html:campaignHtml(campaign,unsubscribeUrl),text:`${campaign.text}\n\nCancelar suscripción: ${unsubscribeUrl}`,replyTo:process.env.RESEND_REPLY_TO||process.env.ADMIN_EMAIL,idempotencyKey:`${campaign.id}/${run.id}/${customer.id}`,readiness:providerStatus});
     entry.status='accepted_by_provider';entry.providerId=sent.id;
     const storedCustomer=data.customers.find(item=>normalizeEmail(item.email)===customer.email);
     if(storedCustomer)storedCustomer.campaignHistory=[...(storedCustomer.campaignHistory||[]),{campaignId:campaign.id,acceptedAt:entry.attemptedAt,status:entry.status,providerId:sent.id}];
    }catch(error){entry.error=safeError(error);}
    run.results.push(entry);await writeData(data);
   }
   run.finishedAt=new Date().toISOString();
   const accepted=run.results.filter(result=>result.status==='accepted_by_provider').length;
   run.status=accepted===run.results.length?'accepted_by_provider':accepted?'partial_failure':'failed';
   campaign.sendHistory=[...(campaign.sendHistory||[]),{runId:run.id,finishedAt:run.finishedAt,status:run.status,recipientCount:run.recipientCount,results:run.results}];
   campaign.status=accepted?'enviado_al_proveedor':'fallido';await writeData(data);
   activeCampaignSends.delete(campaign.id);
   activeSendId=null;
   json(res,200,{run});
   return;
  }
  json(res,405,{error:'Método no permitido.'});
 }catch(error){
  if(activeSendId)activeCampaignSends.delete(activeSendId);
  if(activeTestKey)activeTestSends.delete(activeTestKey);
  json(res,error.status||500,{error:safeError(error)});
 }finally{releaseDataLock?.();}
}
