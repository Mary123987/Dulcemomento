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
globalThis.fetch=async url=>String(url).endsWith('/api/email/status')
 ?{ok:true,status:200,json:async()=>({backendAvailable:true,backendConfigured:false,configurationError:'Configura estas variables del servidor: ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_EMAIL y SESSION_SECRET.'})}
 :{ok:false,status:404,json:async()=>({error:'Endpoint de prueba no disponible.'})};
globalThis.FormData=class MockFormData{
 constructor(form){return new Map(Object.entries(form.values||{}))}
};
const message={innerHTML:''};
globalThis.document={
 addEventListener(){},
 dispatchEvent(){},
 querySelector(selector){return selector==='#panel-message'?message:null},
 querySelectorAll(){return []}
};

const {renderAdmin,handleAdminSubmit}=await import('./dist/admin-panel.js');
const initial=renderAdmin('/admin');
assert.ok(initial.includes('id="panel-login-form"'),'first visit shows the login form');
assert.ok(initial.includes('Panel administrativo'),'login uses the administrative title');
assert.ok(initial.includes('420px'),'login card is narrow and responsive');

const submit=target=>handleAdminSubmit({target,preventDefault(){}});
await submit({id:'panel-login-form',values:{username:'admin',password:'incorrect'}});
assert.ok(message.innerHTML.includes('ADMIN_PASSWORD'),'missing backend configuration is explained');
await submit({id:'panel-login-form',values:{username:'admin',password:'not-a-real-password'}});
await new Promise(resolve=>setTimeout(resolve,0));
assert.ok(renderAdmin('/admin').includes('id="panel-login-form"'),'the panel stays locked while server credentials are missing');
assert.equal(sessionStorage.getItem('dm-admin-session-v3'),null,'missing credentials never create an authenticated local session');

console.log('PASS: administrative login is server-only, missing configuration is explained, and the login view is responsive.');
