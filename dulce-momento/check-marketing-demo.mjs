import assert from 'node:assert/strict';
import {createMarketingDemo,demoPeople,simulateMarketing,DEMO_STORAGE_KEY} from './dist/marketing-demo.js';
import {directory,eligibleRecipients} from './dist/crm.js';
const now=Date.parse('2026-10-10T12:00:00Z');
const data=createMarketingDemo(now);
assert.equal(data.customers.length,8);
assert.equal(demoPeople(data,180,now).filter(person=>person.purchaseCount>0).length,6);
for(const [segment,count] of [['todos_consentidos',4],['nuevo',1],['recurrente',2],['inactivo',1]]){
 const run=simulateMarketing(data,{id:segment,name:segment,segment},180,now);
 assert.equal(run.results.filter(person=>person.eligible).length,count,segment);
 assert.equal(run.status,'simulado_sin_envio');
}
const all=simulateMarketing(data,{id:'all',segment:'todos_consentidos'},180,now);
assert.equal(all.results.find(person=>person.name==='Diego Flores').reason,'Se dio de baja');
assert.equal(all.results.find(person=>person.name==='Carla Mendoza').reason,'Sin consentimiento');
assert.equal(all.results.find(person=>person.name==='Valeria Castro').reason,'Ficha desactivada');
assert.equal(simulateMarketing(data,{segment:'inactivo'},365,now).results.filter(person=>person.eligible).length,0);
assert.equal(eligibleRecipients(data,{segment:'todos_consentidos'}).length,0,'demo data never qualifies for actual delivery');
assert.ok(directory(data.customers,[],data.orders).every(person=>person.purchaseCount===0),'demo purchases never become real sales');

console.log('PASS: initial fixture segmentation, consent exclusions and external-delivery isolation.');
