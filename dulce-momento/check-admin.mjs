import assert from 'node:assert/strict';

class MemoryStorage{
 constructor(){this.values=new Map()}
 getItem(key){return this.values.get(key)??null}
 setItem(key,value){this.values.set(key,String(value))}
 removeItem(key){this.values.delete(key)}
}
globalThis.localStorage=new MemoryStorage();
globalThis.sessionStorage=new MemoryStorage();
globalThis.CustomEvent=class CustomEvent{constructor(type){this.type=type}};
globalThis.window={confirm:()=>true,alert:message=>{throw new Error(message)}};
globalThis.fetch=async()=>({ok:false,status:404,json:async()=>({})});
globalThis.FormData=class MockFormData{
 constructor(form){return new Map(Object.entries(form.values||{}))}
};
const message={innerHTML:''},rows={innerHTML:''},pageLabel={textContent:''};
let contactForm,campaignForm,customerForm,filters=[];
let downloaded=false;
globalThis.document={
 addEventListener(){},
 dispatchEvent(){},
 querySelector(selector){return {'#panel-message':message,'#panel-contact-rows':rows,'#panel-page-label':pageLabel,'#panel-contact-form':contactForm,'#panel-campaign-form':campaignForm,'#panel-customer-form':customerForm,'#panel-customer-rows':rows}[selector]||null},
 querySelectorAll(){return filters},
 createElement(){return {click(){downloaded=true},set href(value){this.url=value},set download(value){this.filename=value}}}
};
URL.createObjectURL=()=> 'blob:test';
URL.revokeObjectURL=()=>{};

const {renderAdmin,handleAdminAction,handleAdminChange,handleAdminInput,handleAdminSubmit}=await import('./dist/admin-panel.js');
const initial=renderAdmin('/admin');
assert.ok(initial.includes('id="panel-login-form"'),'first visit shows the login form');
assert.ok(initial.includes('demostración local'),'the local login is clearly scoped to demo use');

const submit=target=>handleAdminSubmit({target,preventDefault(){}});
const action=(name,id='')=>handleAdminAction({target:{closest:()=>({dataset:{panelAction:name,id}})}});
await submit({id:'panel-login-form',values:{username:'admin',password:'incorrect'}});
assert.ok(message.innerHTML.includes('incorrectos'),'failed login reports an error');
await submit({id:'panel-login-form',values:{username:'admin',password:'2026USMP'}});
assert.ok(renderAdmin('/admin').includes('Resumen'),'successful login opens the panel');
assert.ok(localStorage.getItem('dm-admin-config-v3'),'login persists the salted password verifier and lockout state');
localStorage.setItem('dm-contacts',JSON.stringify([{id:'test-1',name:'Ada',surname:'Lovelace',email:'ada@example.test',customerType:'Nuevo',queryType:'Otra consulta',status:'Nueva',message:'Test fixture',marketingConsent:false,createdAt:'2026-01-01T00:00:00.000Z'}]));
localStorage.setItem('dm-campaigns',JSON.stringify([{id:'campaign-1',title:'Fixture',subject:'Subject',body:'Body',segment:'Nuevo',status:'Borrador'}]));
localStorage.setItem('dm-orders',JSON.stringify([{orderId:'DM-000001',customer:{name:'Test',email:'test@example.test'},total:10,paymentMethod:'Yape',payment:{status:'simulated'},status:'Pedido recibido',createdAt:'2026-01-01T00:00:00.000Z'}]));

const routes=[
 ['/admin','Resumen'],
 ['/admin/contactos','Directorio de contactos'],
  ['/admin/clientes','Clientes ficticios de demostración'],
 ['/admin/campanas','Crear o editar campaña'],
 ['/admin/pedidos','Pedidos guardados en este navegador'],
 ['/admin/configuracion','Cambiar contraseña']
];
for(const [path,heading] of routes){
 const html=renderAdmin(path);
 assert.ok(html.includes(heading),`${path} renders its view`);
 assert.ok(html.includes('data-panel-action="logout"'),`${path} offers logout`);
}
const contacts=renderAdmin('/admin/contactos');
for(const action of ['export-contacts','edit-contact','delete-contact'])assert.ok(contacts.includes(action),`contact view supports ${action}`);
const campaigns=renderAdmin('/admin/campanas');
for(const action of ['edit-campaign','delete-campaign'])assert.ok(campaigns.includes(action),`campaign view supports ${action}`);
assert.ok(campaigns.includes('simulate-campaign'),'demo campaign outcomes can be simulated without sending');
for(const email of ['ana.torres@example.com','lucia.perez@example.com','carla.mendoza@example.com','sofia.ramirez@example.com','valeria.castro@example.com','diego.flores@example.com','camila.vega@example.com','andrea.ruiz@example.com'])assert.ok(renderAdmin('/admin/clientes').includes(email),`demo client ${email} is listed`);
assert.ok(renderAdmin('/admin/clientes').includes('data-panel-action="delete-customer"'),'client records can be deleted');
assert.ok(renderAdmin('/admin/clientes').includes('data-panel-action="export-customers"'),'filtered clients can be exported as CSV');
assert.ok(renderAdmin('/admin/pedidos').includes('data-panel-order-status='),'orders expose a status update control');

contactForm={id:'panel-contact-form',values:{id:'',name:'Grace',surname:'Hopper',email:'grace@example.test',customerType:'Nuevo',queryType:'Otra consulta',status:'Nueva',message:'Test contact',marketingConsent:'on'},elements:{id:{value:''},marketingConsent:{checked:true}},reset(){}};
await submit(contactForm);
assert.equal(JSON.parse(localStorage.getItem('dm-contacts')).length,2,'contact create persists');
assert.ok(JSON.parse(localStorage.getItem('dm-contacts'))[0].history.length,'contact history is retained');
const createdContact=JSON.parse(localStorage.getItem('dm-contacts'))[0];
contactForm.elements={id:{value:''},name:{value:''},surname:{value:''},email:{value:''},customerType:{value:''},queryType:{value:''},status:{value:''},message:{value:''},marketingConsent:{checked:false}};
contactForm.scrollIntoView=()=>{};
action('edit-contact',createdContact.id);
assert.equal(contactForm.elements.name.value,'Grace','edit loads existing contact values');
contactForm.values={...contactForm.values,id:createdContact.id,name:'Grace B.',surname:'Hopper'};
await submit(contactForm);
assert.equal(JSON.parse(localStorage.getItem('dm-contacts'))[0].name,'Grace B.','contact edit persists');
filters=[{dataset:{panelFilter:'search'},value:'grace'}];
document.querySelectorAll=()=>filters;
assert.equal(handleAdminInput({target:{matches:selector=>selector==='[data-panel-filter]'}}),true,'search filter is handled');
assert.ok(rows.innerHTML.includes('Grace'),'matching contact is shown');
filters=[];
action('export-contacts');
assert.equal(downloaded,true,'CSV export creates a download');
action('delete-contact','test-1');
assert.equal(JSON.parse(localStorage.getItem('dm-contacts')).length,1,'contact delete persists');

customerForm={id:'panel-customer-form',values:{id:'',name:'Elena Demo',email:'elena.demo@example.com',registeredAt:'2026-02-01',status:'activo',segment:'nuevo',marketingConsent:'',consentDate:'',consentSource:''},elements:{id:{value:''},marketingConsent:{checked:false},consentSource:{disabled:false},registeredAt:{value:''},name:{value:''},email:{value:''},status:{value:''},segment:{value:''}},reset(){}};
await submit(customerForm);
let demoCustomers=JSON.parse(localStorage.getItem('dm-admin-customers'));
assert.equal(demoCustomers.length,9,'demo client create persists');
const createdDemo=demoCustomers.find(client=>client.email==='elena.demo@example.com');
assert.equal(createdDemo.marketingConsent,false,'demo clients have no marketing consent');
action('export-customers');
assert.equal(downloaded,true,'client CSV export creates a download');
customerForm.values={...customerForm.values,email:'ana.torres@example.com'};
await submit(customerForm);
assert.ok(message.innerHTML.includes('Ya existe un cliente'),'duplicate client email is rejected');
customerForm.elements={...customerForm.elements,id:{value:''},name:{value:''},email:{value:''},registeredAt:{value:''},status:{value:''},segment:{value:''},consentSource:{value:''},marketingConsent:{checked:false}};
customerForm.scrollIntoView=()=>{};
action('edit-customer',createdDemo.id);
assert.equal(customerForm.elements.name.value,'Elena Demo','customer edit loads the current record');
customerForm.values={...customerForm.values,id:createdDemo.id,name:'Elena Demo Editada',email:'elena.demo@example.com'};
await submit(customerForm);
demoCustomers=JSON.parse(localStorage.getItem('dm-admin-customers'));
assert.equal(demoCustomers.find(client=>client.id===createdDemo.id).name,'Elena Demo Editada','customer edit persists');
action('delete-customer',createdDemo.id);
await new Promise(resolve=>setTimeout(resolve,0));
assert.equal(JSON.parse(localStorage.getItem('dm-admin-customers')).length,8,'customer delete persists');

campaignForm={id:'panel-campaign-form',values:{id:'',title:'Fixture campaign',subject:'Subject',body:'<p>Body</p>',text:'Body',segment:'nuevo'},elements:{id:{value:''}},reset(){}};
await submit(campaignForm);
assert.equal(JSON.parse(localStorage.getItem('dm-campaigns')).length,2,'campaign create persists');
const createdCampaign=JSON.parse(localStorage.getItem('dm-campaigns'))[0];
campaignForm.elements={id:{value:''},title:{value:''},subject:{value:''},body:{value:''},text:{value:''},segment:{value:''}};
campaignForm.scrollIntoView=()=>{};
action('edit-campaign',createdCampaign.id);
assert.equal(campaignForm.elements.title.value,'Fixture campaign','edit loads existing campaign');
campaignForm.values={...campaignForm.values,id:createdCampaign.id,title:'Updated campaign'};
await submit(campaignForm);
assert.equal(JSON.parse(localStorage.getItem('dm-campaigns'))[0].title,'Updated campaign','campaign edit persists');
action('delete-campaign','campaign-1');
assert.equal(JSON.parse(localStorage.getItem('dm-campaigns')).length,1,'campaign delete persists');

handleAdminChange({target:{matches:()=>false,closest:()=>({dataset:{panelOrderStatus:'DM-000001'},value:'En preparación'})}});
assert.equal(JSON.parse(localStorage.getItem('dm-orders'))[0].status,'En preparación','order status persists');
action('logout');
assert.ok(renderAdmin('/admin').includes('id="panel-login-form"'),'logout closes the session');
console.log('PASS: demo login/logout, six views, contact/client CRUD and duplicate protection, search/CSV, campaign CRUD, and order status persistence.');
