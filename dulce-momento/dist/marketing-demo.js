// Synthetic fixtures are isolated from CRM records, real segments and delivery APIs.
export const DEMO_STORAGE_KEY='dm-marketing-demo-v1';
export function createMarketingDemo(now=Date.now()){
 const date=days=>new Date(now-days*86400000).toISOString();
 const scenarios=[
  ['ana','Ana Torres',[7],true,false,'activo'],
  ['lucia','Lucía Pérez',[40,3],true,false,'activo'],
  ['sofia','Sofía Ramírez',[400,250],true,false,'activo'],
  ['carla','Carla Mendoza',[10],false,false,'activo'],
  ['diego','Diego Flores',[50,5],false,true,'activo'],
  ['valeria','Valeria Castro',[30,2],true,false,'inactivo'],
  ['camila','Camila Vega',[],true,false,'activo'],
  ['andrea','Andrea Ruiz',[],false,false,'activo']
 ];
 const customers=scenarios.map(([key,name,ages,consent,unsubscribed,status])=>({id:`marketing-demo-${key}`,name,email:`${key}.prueba@example.com`,isDemo:true,status,marketingConsent:consent,consentDate:consent?date(450):null,consentSource:consent?'Consentimiento ficticio para simulación':null,unsubscribed,unsubscribedAt:unsubscribed?date(1):null,registeredAt:date(450)}));
 const orders=scenarios.flatMap(([key,name,ages])=>ages.map((days,index)=>({orderId:`MARKETING-DEMO-${key}-${index+1}`,customer:{name,email:`${key}.prueba@example.com`},isDemo:true,createdAt:date(days),total:75+index*20,status:'Entregado',payment:{status:'simulated'}})));
 return {version:1,createdAt:new Date(now).toISOString(),customers,orders,runs:[]};
}
export function demoPeople(data,days=180,now=Date.now()){
 return data.customers.map(person=>{
  const orders=data.orders.filter(order=>order.isDemo===true&&order.customer.email===person.email);
  const last=orders.length?Math.max(...orders.map(order=>Date.parse(order.createdAt))):null;
  return {...person,orders,purchaseCount:orders.length,segment:orders.length>1?'recurrente':orders.length?'nuevo':'consulta',inactive:last!==null&&now-last>=days*86400000};
 });
}
export function simulateMarketing(data,campaign,days=180,now=Date.now()){
 const results=demoPeople(data,days,now).map(person=>{
  const reason=person.unsubscribed?'Se dio de baja':!person.marketingConsent||!person.consentDate||!person.consentSource?'Sin consentimiento':person.status!=='activo'?'Ficha desactivada':campaign.segment!=='todos_consentidos'&&!(campaign.segment==='inactivo'?person.inactive:campaign.segment===person.segment)?'Fuera del segmento':'Incluido en la simulación';
  return {...person,eligible:reason==='Incluido en la simulación',reason};
 });
 return {campaignId:campaign.id,name:campaign.name||campaign.title,segment:campaign.segment,createdAt:new Date(now).toISOString(),status:'simulado_sin_envio',results};
}
