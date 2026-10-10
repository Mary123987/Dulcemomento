import {directory,normalizeEmail,inactivityDays} from './crm.js';
import {createMarketingDemo} from './marketing-demo.js';

export function initializeMarketing(data,now=Date.now()){
 data.referenceOrders??=[];data.deletedCustomerEmails??=[];
 if(data.marketingVersion===2)return data;
 if(data.marketingVersion===1){
  for(const person of data.customers.filter(person=>person.provenance==='sample-fixture-v1')){
   const dates=data.referenceOrders.filter(order=>normalizeEmail(order.customer?.email)===normalizeEmail(person.email)).map(order=>Date.parse(order.createdAt)).filter(Number.isFinite);
   if(dates.length&&Date.parse(person.registeredAt)>Math.min(...dates))person.registeredAt=new Date(Math.min(...dates)-86400000).toISOString();
  }
  data.marketingVersion=2;return data;
 }
 const examples=createMarketingDemo(now);
 for(const example of examples.customers){
  const slug=example.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replaceAll(' ','.');
  const email=slug+'@example.com';
  let person=data.customers.find(item=>normalizeEmail(item.email)===email);
  if(person&&!person.isDemo)continue;
  if(!person){person={id:example.id,name:example.name,email,registeredAt:example.registeredAt,campaignHistory:[]};data.customers.push(person);}
  Object.assign(person,{isDemo:true,provenance:'sample-fixture-v1',registeredAt:example.registeredAt,status:example.status,marketingConsent:false,consentDate:null,consentSource:null,eligibilityProfile:{consent:example.marketingConsent,unsubscribed:example.unsubscribed}});
  for(const order of examples.orders.filter(order=>order.customer.email===example.email))data.referenceOrders.push({...order,customer:{name:person.name,email},provenance:'sample-fixture-v1'});
 }
 data.marketingVersion=2;return data;
}

export function marketingPeople(data,now=Date.now()){
 const removed=new Set((data.deletedCustomerEmails||[]).map(normalizeEmail));
 return directory(data.customers,data.contacts,data.orders,data.settings?.inactivityDays).filter(person=>!removed.has(person.email)).map(person=>{
  let stats={purchaseCount:person.purchaseCount,segment:person.segment,lastPurchaseAt:person.lastPurchaseAt,inactive:person.inactive};
  if(person.isDemo){
   const orders=(data.referenceOrders||[]).filter(order=>order.isDemo===true&&normalizeEmail(order.customer?.email)===person.email);
   const unique=[...new Map(orders.map(order=>[order.orderId,order])).values()];
   const last=unique.length?Math.max(...unique.map(order=>Date.parse(order.createdAt)).filter(Number.isFinite)):null;
   stats={purchaseCount:unique.length,segment:unique.length>1?'recurrente':unique.length?'nuevo':'consulta',lastPurchaseAt:Number.isFinite(last)?new Date(last).toISOString():null,inactive:Number.isFinite(last)&&now-last>=inactivityDays(data.settings?.inactivityDays)*86400000};
  }
  const unsubscribed=Boolean(person.unsubscribed||person.eligibilityProfile?.unsubscribed||(data.unsubscribedEmails||[]).map(normalizeEmail).includes(person.email));
  const consentAllowed=!unsubscribed&&(person.isDemo?person.eligibilityProfile?.consent===true:person.marketingConsent===true);
  return {...person,...stats,consentAllowed,unsubscribed};
 });
}

export function campaignAudience(data,campaign){
 return marketingPeople(data).map(person=>{
  const invalid=!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email);
  const reason=invalid?'Correo inválido':person.unsubscribed?'Baja de suscripción':!person.consentAllowed?'Sin consentimiento comercial':person.status!=='activo'?'Ficha desactivada':campaign.segment!=='todos_consentidos'&&!(campaign.segment==='inactivo'?person.inactive:campaign.segment===person.segment)?'Fuera del segmento':null;
  return {customerId:person.id,name:person.name,email:person.email,eligible:!reason,error:invalid?reason:null,reason};
 });
}

export function marketingMetrics(data){
 const people=marketingPeople(data);
 const runs=(data.sendHistory||[]).filter(run=>run.type==='campaign');
 const results=runs.flatMap(run=>run.results||[]);
 return {profiles:people.length,buyers:people.filter(person=>person.purchaseCount>0).length,subscribers:people.filter(person=>person.consentAllowed&&person.status==='activo').length,campaigns:(data.campaigns||[]).length,processed:runs.length,pending:results.filter(item=>item.status==='pending_provider').length,excluded:results.filter(item=>item.status==='excluded').length,errors:results.filter(item=>item.status==='failed').length,accepted:results.filter(item=>item.status==='accepted_by_provider').length,delivered:results.filter(item=>item.status==='delivered'&&item.deliveryConfirmedAt).length};
}

export function processInternalCampaign(data,campaign,{id,key,now=new Date().toISOString()}){
 const results=campaignAudience(data,campaign).map(person=>({...person,status:person.error?'failed':person.eligible?'pending_provider':'excluded',processedAt:now,providerId:null}));
 const run={id,type:'campaign',transport:'internal',campaignId:campaign.id,idempotencyKey:key,startedAt:now,finishedAt:now,status:results.some(item=>item.error)?'procesada_con_errores':'procesada',recipientCount:results.filter(item=>item.eligible).length,excludedCount:results.filter(item=>!item.eligible&&!item.error).length,results,snapshot:{name:campaign.name,subject:campaign.subject,html:campaign.html,text:campaign.text,segment:campaign.segment}};
 data.sendHistory.unshift(run);
 campaign.status=run.status;campaign.updatedAt=now;campaign.sendHistory=[...(campaign.sendHistory||[]),run];
 for(const result of results){const person=data.customers.find(person=>person.id===result.customerId);if(person)person.campaignHistory=[...(person.campaignHistory||[]),{campaignId:campaign.id,runId:id,status:result.status,processedAt:now}];}
 return run;
}
