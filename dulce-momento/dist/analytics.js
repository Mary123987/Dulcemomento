const consentKey='dm-analytics-consent-v1';
let consent=readConsent();
let tagLoaded=false;
let lastPage='';

function readConsent(){
 try{const value=localStorage.getItem(consentKey);return value==='granted'||value==='denied'?value:null}catch{return null}
}

function saveConsent(value){
 consent=value;
 try{localStorage.setItem(consentKey,value)}catch{}
 updateBanner();
 if(value==='granted')loadTag();
 else if(tagLoaded)window.gtag('consent','update',{analytics_storage:'denied'});
}

function updateBanner(){
 const banner=document.querySelector('#analytics-consent');
 if(banner)banner.hidden=consent==='granted'||consent==='denied';
}

function loadTag(){
 if(typeof window==='undefined'||typeof document==='undefined')return;
 if(tagLoaded){window.gtag('consent','update',{analytics_storage:'granted'});schedulePageView();return}
 const source=document.querySelector('#ga4-tag-source')?.dataset.src;
 if(!source||typeof window.gtag!=='function')return;
 window.gtag('consent','update',{analytics_storage:'granted'});
 const script=document.createElement('script');
 script.async=true;
 script.src=source;
 document.head.appendChild(script);
 tagLoaded=true;
 schedulePageView(true);
}

function schedulePageView(force=false){
 setTimeout(()=>{
  if(consent!=='granted'||typeof window.gtag!=='function')return;
  const page=`${location.pathname}${location.search}${location.hash}`;
    if(/(?:^|\/)admin(?:\/|$)/.test(location.pathname))return;
  if(!force&&page===lastPage)return;
  lastPage=page;
  window.gtag('event','page_view',{page_location:location.href,page_title:document.title});
 },0);
}

export function track(name,parameters={}){
 if(consent!=='granted'||typeof window==='undefined'||typeof window.gtag!=='function')return;
 window.gtag('event',name,parameters);
}

export function analyticsConsent(){return consent}

if(typeof document!=='undefined'){
 document.addEventListener('click',event=>{
  const choice=event.target.closest('[data-analytics-choice]');
  if(choice){saveConsent(choice.dataset.analyticsChoice);return}
  if(event.target.closest('[data-analytics-settings]')){
   consent=null;
   try{localStorage.removeItem(consentKey)}catch{}
    if(tagLoaded)window.gtag('consent','update',{analytics_storage:'denied'});
   updateBanner();
   document.querySelector('#analytics-consent button[data-analytics-choice]')?.focus();
  }
 });
 window.addEventListener('popstate',()=>schedulePageView());
 const pushState=history.pushState;
 history.pushState=function(...args){const result=pushState.apply(this,args);schedulePageView();return result};
 updateBanner();
 if(consent==='granted')loadTag();
 else if(consent!=='denied')updateBanner();
}