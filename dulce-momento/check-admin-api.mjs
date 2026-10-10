import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const dataDir=await fs.mkdtemp(path.join(os.tmpdir(),'dulce-admin-api-'));
process.env.ADMIN_DATA_FILE=path.join(dataDir,'admin-data.json');
process.env.ADMIN_USERNAME='admin';
process.env.ADMIN_PASSWORD='test-only-password-not-for-production';
process.env.ADMIN_EMAIL='maryrojascordova20@gmail.com';
process.env.SESSION_SECRET='test-only-session-secret-longer-than-32-characters';
process.env.RESEND_REPLY_TO='maryrojascordova20@gmail.com';
delete process.env.RESEND_API_KEY;

const {createServer}=await import('./server.mjs');
const server=createServer();
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
process.env.FRONTEND_ORIGIN=origin;
const request=async(endpoint,{cookie,...options}={})=>{
 const headers={...(options.headers||{})};
 if(cookie)headers.Cookie=cookie;
 const response=await fetch(`${origin}${endpoint}`,{...options,headers});
 const body=response.headers.get('content-type')?.includes('json')?await response.json():await response.text();
 return {response,body};
};
const post=(endpoint,value,cookie)=>request(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value),cookie});

try{
 for(const route of ['/admin','/admin/contactos','/admin/clientes','/admin/campanas','/admin/pedidos','/admin/configuracion']){
  const {response}=await request(route);
  assert.equal(response.status,200,`${route} loads directly from the server`);
 }
 const status=await request('/api/email/status');
 assert.equal(status.body.backendAvailable,true);
 assert.equal(status.body.backendConfigured,true);
 assert.equal(status.body.providerConfigured,false);
 assert.equal(status.body.apiKeyConfigured,false);
 assert.match(status.body.reason,/RESEND_API_KEY/);
 const requiredEnvironment={ADMIN_USERNAME:process.env.ADMIN_USERNAME,ADMIN_PASSWORD:process.env.ADMIN_PASSWORD,ADMIN_EMAIL:process.env.ADMIN_EMAIL,SESSION_SECRET:process.env.SESSION_SECRET};
 for(const key of Object.keys(requiredEnvironment))delete process.env[key];
 const missingConfiguration=await request('/api/email/status');
 assert.equal(missingConfiguration.body.backendConfigured,false,'missing required environment variables disable server login');
 assert.match(missingConfiguration.body.configurationError,/ADMIN_PASSWORD/);
 for(const key of Object.keys(requiredEnvironment))assert.match(missingConfiguration.body.configurationError,new RegExp(key),`${key} is named when configuration is incomplete`);
 const deniedMissingConfiguration=await post('/api/admin/login',{username:'admin',password:'anything'});
 assert.equal(deniedMissingConfiguration.response.status,503,'login never falls back to local credentials when configuration is incomplete');
 for(const [key,value] of Object.entries(requiredEnvironment))process.env[key]=value;
 assert.equal((await request('/api/admin/data')).response.status,401,'private data requires server authentication');
 assert.equal((await post('/api/admin/login',{username:'admin',password:'wrong'})).response.status,401,'server rejects an incorrect password');
 const login=await post('/api/admin/login',{username:'admin',password:process.env.ADMIN_PASSWORD});
 assert.equal(login.response.status,200);
 const cookie=login.response.headers.get('set-cookie')?.split(';')[0];
 assert.ok(cookie?.startsWith('dm_admin_session='),'login creates an HttpOnly session cookie');

 const initial=await request('/api/admin/data',{cookie});
 assert.equal(initial.response.status,200);
 assert.equal(initial.body.customers.length,8,'backend seeds the eight fictional clients');
 assert.equal(initial.body.customers.every(customer=>customer.isDemo&&!customer.marketingConsent&&customer.email.endsWith('@example.com')),true,'demo customers are clearly marked and ineligible');
 assert.equal(initial.body.campaigns.length,3,'backend seeds three draft templates');
 assert.ok(initial.body.campaigns.every(campaign=>campaign.status==='borrador'&&campaign.isDemo),'templates remain drafts');

 const customer={name:'Cliente de prueba',email:'cliente@sub.example.com',registeredAt:'2026-02-01T12:00:00.000Z',status:'activo',segment:'nuevo',marketingConsent:false};
 const [created,concurrentDuplicate]=await Promise.all([post('/api/admin/customers',customer,cookie),post('/api/admin/customers',customer,cookie)]);
 assert.equal(created.response.status,201,'customer create persists a test-domain client');
 assert.equal(created.body.customer.isDemo,true,'example.com addresses are marked as demo automatically');
 assert.equal(concurrentDuplicate.response.status,409,'concurrent duplicate normalized emails are rejected');
 const updated=await request(`/api/admin/customers/${created.body.customer.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({...customer,name:'Cliente editado',segment:'recurrente',isDemo:false,campaignHistory:[{status:'entregado'}]}),cookie});
 assert.equal(updated.response.status,200);
 assert.equal(updated.body.customer.name,'Cliente editado');
 assert.equal(updated.body.customer.segment,'consulta','manual segment ignored without real purchases');
 assert.equal(updated.body.customer.isDemo,true,'a demo record cannot be promoted by client-supplied fields');
 assert.equal(updated.body.customer.campaignHistory.length,0,'client-supplied campaign history is ignored');
 const consentAttempt=await request(`/api/admin/customers/${created.body.customer.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({...customer,marketingConsent:true,consentDate:'2026-02-02T00:00:00.000Z',consentSource:'formulario de prueba'}),cookie});
 assert.equal(consentAttempt.response.status,200);
 assert.equal(consentAttempt.body.customer.marketingConsent,false,'sample authorization is stored separately from actual consent');
 assert.equal(consentAttempt.body.customer.eligibilityProfile.consent,true);
 assert.equal((await request(`/api/admin/customers/${created.body.customer.id}`,{method:'DELETE',cookie})).response.status,200);

 const inquiry={name:'María',surname:'Rojas',email:' MARIA@correo.test ',queryType:'Otra consulta',message:'Consulta de sabores y precios.',marketingConsent:false};
 assert.equal((await post('/api/contacts',{...inquiry,phone:'bad'})).response.status,400);
 const firstInquiry=await post('/api/contacts',{...inquiry,segment:'recurrente',purchaseCount:99,orders:[{orderId:'forged'}]});assert.equal(firstInquiry.response.status,201);
 assert.deepEqual(firstInquiry.body,{received:true},'public endpoint does not expose identity or history');
 let contactData=(await request('/api/admin/data',{cookie})).body;
 let person=contactData.customers.find(person=>person.email==='maria@correo.test');
 assert.equal(person.segment,'consulta');assert.equal(person.consentDate,null);assert.equal(person.marketingConsent,false);
 assert.equal(contactData.orders.length,0,'public inquiry cannot create orders');
 await Promise.all([post('/api/contacts',{...inquiry,name:'María Isabel',message:'Una segunda consulta diferente.',marketingConsent:true}),post('/api/contacts',{...inquiry,message:'Una tercera consulta diferente.'})]);
 contactData=(await request('/api/admin/data',{cookie})).body;
 assert.equal(contactData.contacts.filter(person=>person.email==='maria@correo.test').length,1);
 assert.equal(contactData.contacts[0].history.length,3);
 person=contactData.customers.find(person=>person.email==='maria@correo.test');
 assert.equal(person.marketingConsent,true);assert.ok(person.consentDate);
 // Test-only trusted order history, never written to the project's production data.
 const stored=JSON.parse(await fs.readFile(process.env.ADMIN_DATA_FILE,'utf8'));
 stored.orders=[{orderId:'test-real-1',customer:{name:'María',email:person.email},isDemo:false,payment:{status:'confirmed'},status:'Entregado',createdAt:'2026-01-01T00:00:00.000Z'}];
 await fs.writeFile(process.env.ADMIN_DATA_FILE,JSON.stringify(stored));
 contactData=(await request('/api/admin/data',{cookie})).body;
 assert.equal(contactData.customers.find(item=>item.id===person.id).segment,'nuevo');
 stored.orders.push({...stored.orders[0],orderId:'test-real-2'});await fs.writeFile(process.env.ADMIN_DATA_FILE,JSON.stringify(stored));
 contactData=(await request('/api/admin/data',{cookie})).body;
 assert.equal(contactData.customers.find(item=>item.id===person.id).segment,'recurrente');
 assert.equal((await request('/api/admin/orders/test-real-1',{method:'PUT',body:JSON.stringify({status:'En preparación'}),cookie})).response.status,200);
 assert.equal((await request('/api/admin/data',{cookie})).body.orders[0].status,'En preparación');
 assert.equal((await request('/api/admin/settings',{method:'PUT',body:JSON.stringify({inactivityDays:90})})).response.status,401);
 assert.equal((await request('/api/admin/settings',{method:'PUT',body:JSON.stringify({inactivityDays:90}),cookie})).response.status,200);
 assert.equal((await request('/api/admin/settings',{method:'PUT',body:JSON.stringify({inactivityDays:0}),cookie})).response.status,400);
 assert.equal((await request('/api/admin/data',{cookie})).body.settings.inactivityDays,90);
 const encoded=Buffer.from(person.email).toString('base64url');const signature=crypto.createHmac('sha256',process.env.SESSION_SECRET).update(encoded).digest('base64url');const token=encoded+'.'+signature;
 assert.equal((await request('/api/unsubscribe?token='+token)).response.status,200);
 assert.equal((await request('/api/admin/data',{cookie})).body.customers.find(item=>item.id===person.id).marketingConsent,true,'GET does not unsubscribe');
 const unsub=await request('/api/unsubscribe',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({token}).toString()});assert.equal(unsub.response.status,200);
 await post('/api/contacts',{...inquiry,marketingConsent:true});
 person=(await request('/api/admin/data',{cookie})).body.customers.find(item=>item.id===person.id);
 assert.equal(person.marketingConsent,false);assert.equal(person.consentDate,null);assert.ok(person.unsubscribedAt);
 const existingContact=(await request('/api/admin/data',{cookie})).body.contacts[0];
 assert.equal((await post('/api/admin/contacts',{...inquiry,id:existingContact.id,status:'Atendida',message:'Nota administrativa de seguimiento.'},cookie)).response.status,200);
 const savedContact=(await request('/api/admin/data',{cookie})).body.contacts[0];
 assert.equal(savedContact.status,'Atendida');assert.equal(savedContact.history.length,5);assert.equal(savedContact.marketingConsent,false);
 const campaign={name:'Borrador de prueba',subject:'Asunto de prueba',html:'<p>Contenido de prueba.</p>',text:'Contenido de prueba.',segment:'nuevo'};
 const saved=await post('/api/admin/campaigns',campaign,cookie);
 assert.equal(saved.response.status,201);
 assert.equal(saved.body.campaign.status,'borrador');
 const edited=await request(`/api/admin/campaigns/${saved.body.campaign.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({...campaign,name:'Borrador editado'}),cookie});
 assert.equal(edited.response.status,200);
 assert.equal(edited.body.campaign.name,'Borrador editado');
 const templateEdit=await request('/api/admin/campaigns/template-welcome',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({...campaign,name:'Plantilla editada',status:'enviado_al_proveedor',isDemo:false,sendHistory:[]}),cookie});
 assert.equal(templateEdit.response.status,200);
 assert.equal(templateEdit.body.campaign.isDemo,true,'demo template remains non-sendable after editing');
 assert.equal(templateEdit.body.campaign.status,'borrador','campaign status cannot be overwritten by form fields');
 const draftData=await request('/api/admin/data',{cookie});
 assert.ok(draftData.body.campaigns.some(item=>item.id===saved.body.campaign.id&&item.name==='Borrador editado'),'saved campaign reloads from persistent JSON');
 assert.equal(draftData.body.sendHistory.length,0,'saving a draft does not call the provider or create a send');
 assert.equal((await post('/api/admin/send-campaign',{campaignId:'template-welcome',confirmed:true,idempotencyKey:'template-test-key'},cookie)).response.status,200,'templates support internal processing');
 const prematureSend=await post('/api/admin/send-campaign',{campaignId:saved.body.campaign.id,confirmed:true,idempotencyKey:'no-recipient-key'},cookie);
 assert.equal(prematureSend.response.status,200,'internal processing does not require a provider');

 const testMail=await post('/api/admin/test-email',{to:'maryrojascordova20@gmail.com',campaignId:saved.body.campaign.id,subject:campaign.subject,html:campaign.html,text:campaign.text,idempotencyKey:'provider-missing-key-test'},cookie);
 assert.equal(testMail.response.status,503,'missing Resend API key has an explicit service-unavailable response');
 assert.match(testMail.body.error,/transporte externo/);
 const afterTest=await request('/api/admin/data',{cookie});
 assert.equal(afterTest.body.sendHistory.length,3,'test attempt is retained in history');
 assert.equal(afterTest.body.sendHistory[0].status,'failed','failed test is not marked sent');
 assert.equal(afterTest.body.campaigns.find(item=>item.id===saved.body.campaign.id).sendHistory.at(-1).status,'failed','campaign history includes test failure');
 assert.equal((await post('/api/admin/test-email',{to:'someone@example.com',idempotencyKey:'not-admin-test-key'},cookie)).response.status,403,'test send is restricted to the configured admin email');

 const denied=await request('/api/admin/data',{cookie,headers:{Origin:'https://attacker.invalid'}});
 assert.equal(denied.response.status,403,'cross-origin requests are rejected');
 const logout=await post('/api/admin/logout',{},cookie);
 assert.equal(logout.response.status,200,'server accepts logout');
 assert.equal((await request('/api/admin/data',{cookie})).response.status,401,'logout revokes the server session');
 console.log('PASS: direct admin routes, authenticated API, demo fixture safety, customer/campaign persistence, consent and duplicate guards, blocked demo sending, safe missing-key handling, send history, CORS, and logout.');
}finally{
 await new Promise(resolve=>server.close(resolve));
 await fs.rm(dataDir,{recursive:true,force:true});
}
