import assert from 'node:assert/strict';
import {initializeMarketing,processInternalCampaign} from './dist/marketing.js';
let data=initializeMarketing({customers:[],contacts:[],orders:[],campaigns:[{id:'welcome',name:'Bienvenida',subject:'Hola',html:'<h1>Hola</h1>',text:'Hola',segment:'todos_consentidos',status:'borrador'}],sendHistory:[],settings:{inactivityDays:180},unsubscribedEmails:[]});
const storage=new Map();
globalThis.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)};
globalThis.sessionStorage={getItem:()=>JSON.stringify({backend:true,authenticated:true}),removeItem(){}};
globalThis.CustomEvent=class{constructor(type){this.type=type;}};
globalThis.location={pathname:'/admin/clientes'};
globalThis.window={confirm:()=>true,alert:message=>{throw Error(message);}};
globalThis.FormData=class{constructor(form){return new Map(Object.entries(form.values));}};
const message={innerHTML:''},rows={innerHTML:''},audience={innerHTML:''},frames=[{srcdoc:''},{srcdoc:''}];
const search={value:''},status={value:''},segment={value:''},consent={value:''};
let customerForm,campaignForm;
const form=(id,values,names)=>({id,values,elements:Object.fromEntries(names.map(name=>[name,{value:values[name]||'',checked:values[name]===true,disabled:false}])),submit:{disabled:false},querySelector(){return this.submit;},reset(){for(const field of Object.values(this.elements)){field.value='';field.checked=false;}},scrollIntoView(){}});
globalThis.document={addEventListener(){},dispatchEvent(){},querySelector(selector){return {'#panel-message':message,'#panel-customer-rows':rows,'#panel-customer-form':customerForm,'#panel-campaign-form':campaignForm,'#panel-draft-audience':audience,'[data-customer-search]':search,'[data-customer-status]':status,'[data-customer-segment]':segment,'[data-customer-consent]':consent}[selector]||null;},querySelectorAll:selector=>selector.startsWith('iframe')?frames:[]};
let requestLog=[];
globalThis.fetch=async(url,options={})=>{
 requestLog.push({url,options});let result={};const input=options.body?JSON.parse(options.body):{};
 if(url==='/api/admin/data')result=structuredClone(data);
 else if(url==='/api/email/status')result={backendConfigured:true,requestedSender:'maryrojascordova20@gmail.com',senderVerified:false};
 else if(url==='/api/admin/customers'&&options.method==='POST'){data.customers.push({...input,id:'new-profile',isDemo:true,marketingConsent:false,eligibilityProfile:{consent:input.marketingConsent},campaignHistory:[]});}
 else if(url.startsWith('/api/admin/customers/')){const id=url.split('/').at(-1);if(options.method==='DELETE')data.customers=data.customers.filter(person=>person.id!==id);else data.customers=data.customers.map(person=>person.id===id?{...person,...input,marketingConsent:false,eligibilityProfile:{consent:input.marketingConsent}}:person);}
 else if(url==='/api/admin/campaigns'&&options.method==='POST'){data.campaigns.unshift({...input,id:'campaign-'+data.campaigns.length,status:'borrador'});}
 else if(url.startsWith('/api/admin/campaigns/')){const id=url.split('/').at(-1);if(options.method==='DELETE')data.campaigns=data.campaigns.filter(campaign=>campaign.id!==id);else data.campaigns=data.campaigns.map(campaign=>campaign.id===id?{...campaign,...input}:campaign);}
 else if(url==='/api/admin/send-campaign'){assert.equal(input.transport,'internal');result={run:processInternalCampaign(data,data.campaigns.find(campaign=>campaign.id===input.campaignId),{id:'run-panel',key:input.idempotencyKey})};}
 else throw Error('Unexpected endpoint '+url);
 return {ok:true,json:async()=>structuredClone(result)};
};
const {renderAdmin,handleAdminAction,handleAdminSubmit,handleAdminInput,handleAdminChange}=await import('./dist/admin-panel.js');
const action=async(name,id)=>{handleAdminAction({target:{closest:()=>({dataset:{panelAction:name,id}})}});await new Promise(resolve=>setTimeout(resolve,0));};
const submit=target=>handleAdminSubmit({target,preventDefault(){}});
renderAdmin('/admin/clientes');await new Promise(resolve=>setTimeout(resolve,0));
let html=renderAdmin('/admin/clientes');assert.match(html,/ana.torres@example.com/);assert.match(html,/Crear o editar cliente/);
search.value='lucía';handleAdminInput({target:{matches:selector=>selector==='[data-customer-search]'}});assert.match(rows.innerHTML,/Lucía Pérez/);assert.doesNotMatch(rows.innerHTML,/Ana Torres/);search.value='';
consent.value='unsubscribed';handleAdminChange({target:{matches:selector=>selector.includes('[data-customer-consent]')}});assert.match(rows.innerHTML,/Diego Flores/);assert.doesNotMatch(rows.innerHTML,/Ana Torres/);consent.value='';
segment.value='nuevo';handleAdminChange({target:{matches:selector=>selector.includes('[data-customer-segment]')}});assert.match(rows.innerHTML,/Ana Torres/);assert.doesNotMatch(rows.innerHTML,/Lucía Pérez/);segment.value='';
customerForm=form('panel-customer-form',{name:'Elena Vargas',email:'elena@example.com',status:'activo',marketingConsent:true},['id','name','email','registeredAt','status','marketingConsent','unsubscribed','consentDate','consentSource']);
await submit(customerForm);assert.match(renderAdmin('/admin/clientes'),/Elena Vargas/);
await action('edit-customer','new-profile');assert.equal(customerForm.elements.name.value,'Elena Vargas');assert.equal(customerForm.elements.marketingConsent.checked,true);
customerForm.values={...customerForm.values,id:'new-profile',name:'Elena editada'};await submit(customerForm);assert.match(renderAdmin('/admin/clientes'),/Elena editada/);
await action('reset-customer');assert.equal(customerForm.elements.id.value,'');
await action('delete-customer','new-profile');assert.doesNotMatch(renderAdmin('/admin/clientes'),/Elena editada/);
location.pathname='/admin/campanas';
campaignForm=form('panel-campaign-form',{title:'Octubre',subject:'Novedades',body:'<h1>Sabores</h1><script>parent.bad=true</script>',text:'Sabores\nNuevos',segment:'nuevo'},['id','title','subject','body','text','segment']);
await submit(campaignForm);const created=data.campaigns[0];assert.equal(created.text,'Sabores\nNuevos');
await action('edit-campaign',created.id);assert.equal(campaignForm.elements.title.value,'Octubre');assert.match(frames[0].srcdoc,/default-src 'none'/);assert.match(renderAdmin('/admin/campanas'),/sandbox=""/);
handleAdminChange({target:{matches:selector=>selector==='#panel-campaign-form [name="segment"]',value:'recurrente'}});assert.match(audience.innerHTML,/<strong>2<\/strong> elegibles/);
await action('duplicate-campaign',created.id);assert.equal(data.campaigns[0].name,'Octubre (copia)');assert.equal(data.campaigns[0].status,'borrador');
await action('send-campaign',created.id);assert.equal(data.sendHistory.length,1);assert.match(message.innerHTML,/pendientes de proveedor/);assert.match(renderAdmin('/admin/campanas'),/Procesada/);assert.match(renderAdmin('/admin/campanas'),/Pendiente de proveedor/);
await action('edit-campaign',created.id);assert.equal(campaignForm.submit.disabled,true);await action('reset-campaign');assert.equal(campaignForm.submit.disabled,false);assert.equal(campaignForm.elements.id.value,'');
for(const route of ['/admin','/admin/clientes','/admin/campanas','/admin/configuracion']){const visible=renderAdmin(route).replace(/<[^>]*>/g,'');assert.doesNotMatch(visible,/\b(?:demo|ficticio|simulado|prueba)\b/i,route);}
assert.match(renderAdmin('/admin/configuracion'),/Sin verificar/);
assert.ok(!requestLog.some(request=>request.url.includes('resend.com')));
console.log('PASS: panel profile CRUD, search/filters, campaign create/duplicate, safe preview, segment counts, processing, history, metrics and neutral interface copy.');
