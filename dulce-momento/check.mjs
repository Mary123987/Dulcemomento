import assert from 'node:assert/strict';
import fs from 'node:fs';
globalThis.localStorage={store:new Map(),getItem(k){return this.store.get(k)??null},setItem(k,v){this.store.set(k,v)}};
globalThis.window={dispatchEvent(){}};
const {products}=await import('./dist/data.js');
const {state,addItem,unitPrice,totals,applyCoupon}=await import('./dist/store.js');
assert.equal(products.length,16);assert.equal(new Set(products.map(p=>p.slug)).size,16);
addItem('k1',{size:'Mediano',decoration:'Especial',quantity:2,message:'Demo'});assert.equal(unitPrice(state.cart[0]),95);assert.equal(totals().subtotal,190);
assert.equal(applyCoupon('INVALID'),false);assert.equal(applyCoupon('dulce10'),true);assert.equal(totals().total,171);
state.delivery='Delivery';state.district='Surco';assert.equal(totals().total,189);assert.equal(applyCoupon('MOMENTO15'),true);assert.equal(totals().total,179.5);
addItem('k2',{quantity:1});assert.equal(totals().subtotal,238);assert.equal(totals().total,220.3);
assert.equal(JSON.parse(localStorage.getItem('dm-cart')).length,2);
assert.throws(()=>addItem('missing'));assert.throws(()=>addItem('k1',{size:'Invalid'}));assert.throws(()=>addItem('k1',{quantity:-1}));
for(const p of products){assert.ok(p.flavors.length);assert.ok(p.sizes.length);assert.ok(fs.existsSync('dist'+p.images[0]));}
const app=fs.readFileSync('dist/app.js','utf8');assert.ok(!/localStorage\.setItem\([^\n]*(?:d\.card|d\.cvv|d\.expiry)/.test(app));
console.log('PASS: 16 productos, slugs, imágenes, personalización, cantidades, dos cupones, delivery, totales, persistencia y entradas inválidas.');
