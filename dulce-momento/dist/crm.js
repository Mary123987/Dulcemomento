export const normalizeEmail=value=>String(value||'').trim().toLowerCase();
export const DEFAULT_INACTIVITY_DAYS=180;
export function inactivityDays(value){return Number.isInteger(Number(value))&&Number(value)>0&&Number(value)<=3650?Number(value):DEFAULT_INACTIVITY_DAYS;}
export function mergeContacts(contacts=[]){
 const byEmail=new Map();
 for(const record of contacts){
  const email=normalizeEmail(record.email);if(!email)continue;
  const previous=byEmail.get(email);
  const history=record.history?.length?record.history:record.message?[{type:'contacto',at:record.createdAt,queryType:record.queryType,summary:record.message}]:[];
  if(!previous){byEmail.set(email,{...record,email,history:[...history]});continue;}
  const latest=Date.parse(record.lastInteractionAt||record.createdAt)>Date.parse(previous.lastInteractionAt||previous.createdAt)?record:previous;
  byEmail.set(email,{...previous,...latest,id:previous.id,email,createdAt:previous.createdAt,unsubscribed:Boolean(previous.unsubscribed||record.unsubscribed),history:[...previous.history,...history]});
 }
 return [...byEmail.values()];
}
export function purchaseStats(email,orders=[],days=180,now=Date.now()){
 const seen=new Set();
 const purchases=orders.filter(order=>{
  if(!order.orderId||seen.has(order.orderId)||normalizeEmail(order.customer?.email)!==normalizeEmail(email)||order.isDemo!==false||order.payment?.status==='simulated'||['Cancelado','Reembolsado'].includes(order.status)||['failed','refunded'].includes(order.payment?.status))return false;
  seen.add(order.orderId);return true;
 });
 const dates=purchases.map(order=>Date.parse(order.createdAt)).filter(Number.isFinite);
 const last=dates.length?Math.max(...dates):null;
 return {purchaseCount:purchases.length,segment:purchases.length>1?'recurrente':purchases.length===1?'nuevo':'consulta',lastPurchaseAt:last===null?null:new Date(last).toISOString(),inactive:last!==null&&now-last>=inactivityDays(days)*86400000};
}
export function directory(customers=[],contacts=[],orders=[],days=180){
 const people=new Map();
 for(const record of [...customers,...contacts]){
  const email=normalizeEmail(record.email);if(!email)continue;
  const previous=people.get(email);
  const valid=record.marketingConsent===true&&Number.isFinite(Date.parse(record.consentDate))&&Boolean(record.consentSource);
  const entry={...record,...previous,email};
  entry.status=previous?.status||(['activo','inactivo'].includes(record.status)?record.status:'activo');
  if(!previous){entry.marketingConsent=valid;entry.consentDate=valid?record.consentDate:null;entry.consentSource=valid?record.consentSource:null;}
  entry.unsubscribed=Boolean(previous?.unsubscribed||record.unsubscribed);
  if(entry.unsubscribed)entry.marketingConsent=false;
  people.set(email,entry);
 }
 for(const order of orders){
  const email=normalizeEmail(order.customer?.email);
  if(email&&!people.has(email)&&purchaseStats(email,[order]).purchaseCount)people.set(email,{id:`order-contact-${order.orderId}`,name:order.customer.name,email,phone:order.customer.phone,registeredAt:order.createdAt,status:'activo',marketingConsent:false});
 }
 return [...people.values()].map(person=>({...person,...purchaseStats(person.email,orders,days)}));
}
export function eligibleRecipients(data,campaign){
 return directory(data.customers,data.contacts,data.orders,data.settings?.inactivityDays).filter(person=>!person.isDemo&&!/@(?:[^@]+\.)?example\.com$/i.test(person.email)&&person.status!=='inactivo'&&person.marketingConsent===true&&!person.unsubscribed&&!(data.unsubscribedEmails||[]).map(normalizeEmail).includes(person.email)&&(campaign.segment==='todos_consentidos'||(campaign.segment==='inactivo'?person.inactive:person.segment===campaign.segment)));
}
export function recordInquiry(data,input,now=new Date().toISOString()){
 const email=normalizeEmail(input.email);
 const name=String(input.name||'').trim(),surname=String(input.surname||'').trim(),message=String(input.message||'').trim(),phone=String(input.phone||'').trim(),queryType=String(input.queryType||'').trim();
 if(name.length<3||name.length>100||surname.length<2||surname.length>80||email.length>150||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||message.length<10||message.length>2000||!queryType||queryType.length>100||(phone&&!/^9\d{8}$/.test(phone)))throw Object.assign(new Error('Completa los datos obligatorios y valida correo, celular y mensaje.'),{status:400});
 data.customers??=[];data.contacts=mergeContacts(data.contacts);
 let person=data.customers.find(p=>normalizeEmail(p.email)===email);
 let contact=data.contacts.find(p=>normalizeEmail(p.email)===email);
 if(!person){const existing=directory([],contact?[contact]:[])[0];person={...existing,id:contact?.contactId||contact?.id||crypto.randomUUID(),name,surname,email,phone,registeredAt:contact?.createdAt||now,status:'activo',marketingConsent:existing?.marketingConsent===true,consentDate:existing?.consentDate||null,consentSource:existing?.consentSource||null,campaignHistory:[]};data.customers.push(person);}
 if(!contact){contact={id:person.id,name,surname,email,phone,createdAt:now,history:[]};data.contacts.push(contact);}
 if(!contact.history?.length&&contact.message)contact.history=[{type:'contacto',at:contact.createdAt,summary:contact.message,queryType:contact.queryType}];
 const blocked=person.unsubscribed||contact.unsubscribed||(data.unsubscribedEmails||[]).includes(email);
 if(blocked)Object.assign(person,{marketingConsent:false,consentDate:null,consentSource:null,unsubscribed:true});
 if(input.marketingConsent===true&&!blocked&&!person.isDemo){Object.assign(person,{marketingConsent:true,consentDate:now,consentSource:'contact-form-explicit-v2'});}
 Object.assign(contact,{contactId:person.id,name,surname,phone,queryType,message,status:'Nueva',lastInteractionAt:now,marketingConsent:person.marketingConsent===true,consentDate:person.consentDate||null,consentSource:person.consentSource||null,history:[...(contact.history||[]),{id:crypto.randomUUID(),type:'contacto',at:now,queryType,summary:message}]});
 delete contact.customerType;delete person.segment;
 return contact;
}
