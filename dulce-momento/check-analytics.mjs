import assert from 'node:assert/strict';
import fs from 'node:fs';

const template=fs.readFileSync('./shell.html','utf8');
const builtHtml=fs.readFileSync('./dist/index.html','utf8');
assert.equal((template.match(/gtag\('config','G-ZRBWXC7BSP'/g)||[]).length,1,'the shared template configures the measurement ID once');
assert.match(template,/type="text\/plain" data-src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-ZRBWXC7BSP"/,'the official tag URL is present but inert before consent');
assert.match(builtHtml,/gtag\('config','G-ZRBWXC7BSP'/,'the generated Pages HTML includes the measurement ID');

const values=new Map();
const timers=[];
const listeners={document:{},window:{}};
const scripts=[];
const banner={hidden:true};
const tagSource={dataset:{src:'https://www.googletagmanager.com/gtag/js?id=G-ZRBWXC7BSP'}};
const location={href:'https://dulcemomento.test/?ga_debug=1',pathname:'/',search:'?ga_debug=1',hash:''};

globalThis.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
globalThis.location=location;
globalThis.setTimeout=callback=>{timers.push(callback);return timers.length};
globalThis.window={dataLayer:[],addEventListener:(name,callback)=>(listeners.window[name]||=[]).push(callback)};
globalThis.window.gtag=function(){window.dataLayer.push(arguments)};
window.gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied'});
window.gtag('js',new Date());
window.gtag('config','G-ZRBWXC7BSP',{send_page_view:false,debug_mode:true});
globalThis.document={title:'Dulce Momento',head:{appendChild:script=>scripts.push(script)},createElement:tag=>({tag}),querySelector:selector=>selector==='#analytics-consent'?banner:selector==='#ga4-tag-source'?tagSource:null,addEventListener:(name,callback)=>(listeners.document[name]||=[]).push(callback)};
globalThis.history={pushState(_state,_title,url){const next=new URL(url,location.href);location.pathname=next.pathname;location.search=next.search;location.hash=next.hash;location.href=next.href}};

const {track}=await import('./dist/analytics.js?check=1');
assert.equal(banner.hidden,false,'unanswered consent is shown');
assert.equal(scripts.length,0,'tag is not requested before consent');
track('before_consent');
assert.equal(window.dataLayer.filter(command=>command[0]==='event').length,0,'events are not queued before consent');

const accept={dataset:{analyticsChoice:'granted'}};
listeners.document.click[0]({target:{closest:selector=>selector==='[data-analytics-choice]'?accept:null}});
assert.equal(banner.hidden,true,'accepted consent hides the banner');
assert.equal(scripts.length,1,'acceptance requests exactly one gtag script');
assert.equal(scripts[0].src,'https://www.googletagmanager.com/gtag/js?id=G-ZRBWXC7BSP');
assert.equal(window.dataLayer.filter(command=>command[0]==='config').length,1,'the template configures GA4 once');
assert.equal(window.dataLayer.filter(command=>command[0]==='consent'&&command[1]==='default')[0][2].analytics_storage,'denied','analytics consent defaults to denied');
assert.equal(window.dataLayer.filter(command=>command[0]==='config')[0][2].send_page_view,false,'automatic pageviews are disabled');
assert.equal(scripts[0].src,'https://www.googletagmanager.com/gtag/js?id=G-ZRBWXC7BSP','the consented loader uses the template source');
while(timers.length)timers.shift()();
assert.equal(window.dataLayer.filter(command=>command[0]==='event'&&command[1]==='page_view').length,1,'initial route gets one page_view');

track('add_to_cart',{currency:'PEN'});
history.pushState({},'','/catalogo');
while(timers.length)timers.shift()();
history.pushState({},'','/catalogo');
while(timers.length)timers.shift()();
assert.equal(window.dataLayer.filter(command=>command[0]==='event'&&command[1]==='page_view').length,2,'SPA route change is tracked once per URL');
history.pushState({},'','/admin/');
while(timers.length)timers.shift()();
assert.equal(window.dataLayer.filter(command=>command[0]==='event'&&command[1]==='page_view').length,2,'administrative routes are excluded');

const eventCount=window.dataLayer.filter(command=>command[0]==='event').length;
const reject={dataset:{analyticsChoice:'denied'}};
listeners.document.click[0]({target:{closest:selector=>selector==='[data-analytics-choice]'?reject:null}});
track('after_rejection');
assert.equal(window.dataLayer.filter(command=>command[0]==='event').length,eventCount,'rejected consent blocks subsequent events');
assert.equal(scripts.length,1,'consent changes never insert a duplicate tag');
console.log('PASS: consentimiento, carga única, DebugView y pageviews SPA sin duplicados.');
