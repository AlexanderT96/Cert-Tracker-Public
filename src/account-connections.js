// Cert Tracker — optional external account connections.
// Outlook uses delegated OAuth 2.0 Authorization Code + PKCE. No client secret is used.
// Tokens remain session-only and are never included in tracker backup/device sync.
(function initAccountConnections(global){
  'use strict';
  const CT=global.CertTrackerV3;
  if(!CT)return;

  const CONFIG_KEY='ct5-account-connections-v1';
  const SESSION_KEY='ct5-outlook-session-v1';
  const PKCE_KEY='ct5-outlook-pkce-v1';
  const DEFAULTS=Object.freeze({
    outlook:{clientId:'',tenant:'common',includeMail:false,calendarDaysAhead:365,lastSyncAt:'',lastManagedCount:0}
  });
  let lastSnapshot=null;

  const clone=v=>JSON.parse(JSON.stringify(v));
  const safeJson=(raw,fallback)=>{try{return raw?JSON.parse(raw):fallback;}catch{return fallback;}};
  const storageGet=(store,key)=>{try{return store.getItem(key);}catch{return null;}};
  const storageSet=(store,key,value)=>{try{store.setItem(key,value);return true;}catch{return false;}};
  const storageRemove=(store,key)=>{try{store.removeItem(key);}catch{}}
  const emit=(name,payload)=>{try{CT.events?.emit?.(name,payload);global.dispatchEvent(new CustomEvent(`certtracker:${name}`,{detail:payload}));}catch{}}

  function sanitiseTenant(value){
    const v=String(value||'common').trim();
    if(['common','organizations','consumers'].includes(v))return v;
    if(/^[0-9a-f-]{36}$/i.test(v))return v;
    if(/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(v))return v;
    return 'common';
  }
  function sanitiseClientId(value){const v=String(value||'').trim();return /^[0-9a-f-]{36}$/i.test(v)?v:'';}
  function loadConfig(){
    const raw=safeJson(storageGet(localStorage,CONFIG_KEY),{});
    const o=raw?.outlook||{};
    return {outlook:{...clone(DEFAULTS.outlook),...o,clientId:sanitiseClientId(o.clientId),tenant:sanitiseTenant(o.tenant),includeMail:o.includeMail===true,calendarDaysAhead:Math.max(30,Math.min(730,Number(o.calendarDaysAhead)||365)),lastManagedCount:Math.max(0,Number(o.lastManagedCount)||0)}};
  }
  function saveConfig(patch){
    const current=loadConfig(),next={...current,outlook:{...current.outlook,...(patch?.outlook||{})}};
    next.outlook.clientId=sanitiseClientId(next.outlook.clientId);
    next.outlook.tenant=sanitiseTenant(next.outlook.tenant);
    next.outlook.includeMail=next.outlook.includeMail===true;
    next.outlook.calendarDaysAhead=Math.max(30,Math.min(730,Number(next.outlook.calendarDaysAhead)||365));
    storageSet(localStorage,CONFIG_KEY,JSON.stringify(next));emit('account-connections-changed',status());return next;
  }

  function redirectUri(){
    const url=new URL(global.location.href);
    url.search='';url.hash='';
    if(/\/index\.html$/i.test(url.pathname))url.pathname=url.pathname.replace(/index\.html$/i,'');
    return `${url.origin}${url.pathname}`;
  }
  function requestedScopes(cfg=loadConfig().outlook){
    const scopes=['openid','profile','offline_access','User.Read','Calendars.ReadWrite'];
    if(cfg.includeMail)scopes.push('Mail.Read');
    return scopes;
  }
  function bytes(length=48){const a=new Uint8Array(length);crypto.getRandomValues(a);return a;}
  function base64url(input){
    const bytes=input instanceof Uint8Array?input:new Uint8Array(input);
    let binary='';bytes.forEach(b=>binary+=String.fromCharCode(b));
    return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }
  async function sha256(value){return crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));}

  function session(){
    const row=safeJson(storageGet(sessionStorage,SESSION_KEY),null);
    if(!row||typeof row!=='object'||!row.accessToken)return null;
    return row;
  }
  function saveSession(row){storageSet(sessionStorage,SESSION_KEY,JSON.stringify(row));emit('outlook-session',status());return row;}
  function clearSession(){storageRemove(sessionStorage,SESSION_KEY);storageRemove(sessionStorage,PKCE_KEY);lastSnapshot=null;emit('outlook-session',status());}
  function hasOutlookConfig(){return !!loadConfig().outlook.clientId;}
  function isOutlookConnected(){const s=session();return !!(s?.accessToken||s?.refreshToken);}

  async function connectOutlook(){
    const cfg=loadConfig().outlook;
    if(!cfg.clientId)throw new Error('Add the Microsoft Entra Application (client) ID first.');
    if(!global.crypto?.subtle)throw new Error('This browser does not support the Web Crypto APIs required for secure PKCE sign-in.');
    const verifier=base64url(bytes(64));
    const challenge=base64url(await sha256(verifier));
    const state=base64url(bytes(32));
    const pending={state,verifier,redirectUri:redirectUri(),tenant:cfg.tenant,scopes:requestedScopes(cfg),createdAt:Date.now()};
    storageSet(sessionStorage,PKCE_KEY,JSON.stringify(pending));
    const u=new URL(`https://login.microsoftonline.com/${encodeURIComponent(cfg.tenant)}/oauth2/v2.0/authorize`);
    u.searchParams.set('client_id',cfg.clientId);
    u.searchParams.set('response_type','code');
    u.searchParams.set('redirect_uri',pending.redirectUri);
    u.searchParams.set('response_mode','query');
    u.searchParams.set('scope',pending.scopes.join(' '));
    u.searchParams.set('code_challenge',challenge);
    u.searchParams.set('code_challenge_method','S256');
    u.searchParams.set('state',state);
    global.location.assign(u.toString());
  }

  async function redeemCode(code,pending){
    const cfg=loadConfig().outlook;
    const body=new URLSearchParams({client_id:cfg.clientId,grant_type:'authorization_code',code,redirect_uri:pending.redirectUri,code_verifier:pending.verifier,scope:pending.scopes.join(' ')});
    const r=await fetch(`https://login.microsoftonline.com/${encodeURIComponent(pending.tenant)}/oauth2/v2.0/token`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body,credentials:'omit',referrerPolicy:'no-referrer'});
    const data=await r.json().catch(()=>({}));
    if(!r.ok||!data.access_token)throw new Error(data.error_description||data.error||`Microsoft token exchange failed (${r.status}).`);
    const row={accessToken:data.access_token,refreshToken:data.refresh_token||'',expiresAt:Date.now()+Math.max(60,Number(data.expires_in)||3600)*1000,scope:String(data.scope||''),connectedAt:new Date().toISOString(),account:null};
    saveSession(row);return row;
  }

  function cleanAuthParams(){
    const u=new URL(global.location.href);['code','state','session_state','error','error_description','error_uri'].forEach(k=>u.searchParams.delete(k));
    global.history.replaceState({},document.title,`${u.pathname}${u.search}${u.hash}`);
  }
  async function handleAuthCallback(){
    const u=new URL(global.location.href),code=u.searchParams.get('code'),error=u.searchParams.get('error');
    if(!code&&!error)return false;
    const pending=safeJson(storageGet(sessionStorage,PKCE_KEY),null);
    try{
      if(error)throw new Error(u.searchParams.get('error_description')||error);
      if(!pending||Date.now()-Number(pending.createdAt||0)>10*60*1000)throw new Error('The Outlook sign-in request expired. Start the connection again.');
      if(u.searchParams.get('state')!==pending.state)throw new Error('Outlook sign-in state validation failed.');
      await redeemCode(code,pending);storageRemove(sessionStorage,PKCE_KEY);
      const account=await profile();const s=session();if(s){s.account=account;saveSession(s);}
      emit('outlook-connected',{account});
      return true;
    }finally{cleanAuthParams();}
  }

  async function refreshAccessToken(){
    const cfg=loadConfig().outlook,s=session();
    if(!cfg.clientId||!s?.refreshToken)throw new Error('Outlook session expired. Reconnect Outlook.');
    const body=new URLSearchParams({client_id:cfg.clientId,grant_type:'refresh_token',refresh_token:s.refreshToken,scope:requestedScopes(cfg).join(' ')});
    const r=await fetch(`https://login.microsoftonline.com/${encodeURIComponent(cfg.tenant)}/oauth2/v2.0/token`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body,credentials:'omit',referrerPolicy:'no-referrer'});
    const data=await r.json().catch(()=>({}));
    if(!r.ok||!data.access_token){clearSession();throw new Error(data.error_description||data.error||'Outlook session expired. Reconnect Outlook.');}
    return saveSession({...s,accessToken:data.access_token,refreshToken:data.refresh_token||s.refreshToken,expiresAt:Date.now()+Math.max(60,Number(data.expires_in)||3600)*1000,scope:String(data.scope||s.scope||'')});
  }
  async function accessToken(){const s=session();if(!s)throw new Error('Outlook is not connected.');if(Number(s.expiresAt||0)-Date.now()<120000)return (await refreshAccessToken()).accessToken;return s.accessToken;}

  async function graph(path,options={},retry=true){
    const token=await accessToken();
    const url=/^https:\/\//i.test(path)?path:`https://graph.microsoft.com/v1.0${path}`;
    const headers={Accept:'application/json','Authorization':`Bearer ${token}`,'Prefer':'outlook.body-content-type="text", outlook.timezone="Europe/London"',...(options.headers||{})};
    const r=await fetch(url,{...options,headers,credentials:'omit',referrerPolicy:'no-referrer'});
    if(r.status===401&&retry&&session()?.refreshToken){await refreshAccessToken();return graph(path,options,false);}
    const data=await r.json().catch(()=>null);
    if(!r.ok)throw new Error(data?.error?.message||`Microsoft Graph request failed (${r.status}).`);
    return data;
  }

  async function profile(){return graph('/me?$select=id,displayName,mail,userPrincipalName');}
  async function calendars(){return graph('/me/calendars?$select=id,name,canEdit,isDefaultCalendar,owner');}

  async function calendarView({daysBack=30,daysAhead}={}){
    const cfg=loadConfig().outlook,ahead=Math.max(1,Math.min(730,Number(daysAhead)||cfg.calendarDaysAhead));
    const start=new Date(Date.now()-Math.max(0,Number(daysBack)||0)*86400000).toISOString();
    const end=new Date(Date.now()+ahead*86400000).toISOString();
    const qs=new URLSearchParams({startDateTime:start,endDateTime:end,'$top':'200','$select':'id,subject,start,end,showAs,isAllDay,bodyPreview,body,categories,lastModifiedDateTime,isCancelled,organizer'});
    let next=`/me/calendarView?${qs.toString()}`,pages=0,rows=[];
    while(next&&pages<20){const data=await graph(next);rows=rows.concat(Array.isArray(data?.value)?data.value:[]);next=data?.['@odata.nextLink']||'';pages++;}
    return rows;
  }

  function parseManagedEvent(event){
    const subject=String(event?.subject||''),body=String(event?.body?.content||event?.bodyPreview||'');
    const prefix=subject.match(/^\[(GAME|CERT|TRAINING|VENDOR|WORK)\]\s*/i);
    const marker=body.match(/Managed by ChatGPT Watch:\s*(GAME|CERT|TRAINING|VENDOR|WORK)\s*\|\s*Key:\s*([^\r\n]+)/i);
    if(!prefix&&!marker)return null;
    const type=String(marker?.[1]||prefix?.[1]||'').toUpperCase(),key=String(marker?.[2]||'').trim();
    const meta=body.match(/Impact:\s*(\d{1,3})\s*\|\s*Action state:\s*([^|\r\n]+)\s*\|\s*Next action:\s*([^|\r\n]+)\s*\|\s*Dependency:\s*([^\r\n]+)/i);
    return {id:String(event.id||''),type,key,subject,start:event?.start||null,end:event?.end||null,showAs:event?.showAs||'',isAllDay:event?.isAllDay===true,isCancelled:event?.isCancelled===true,lastModifiedDateTime:event?.lastModifiedDateTime||'',impact:meta?Math.max(0,Math.min(100,Number(meta[1])||0)):null,actionState:meta?String(meta[2]).trim().toUpperCase():'',nextAction:meta?String(meta[3]).trim():'',dependency:meta?String(meta[4]).trim():'',bodyPreview:String(event?.bodyPreview||'')};
  }
  function eventDate(row){const raw=row?.start?.dateTime||row?.start||'';const d=new Date(raw);return Number.isNaN(d.getTime())?null:d;}
  async function managedTimeline(options={}){
    const rows=(await calendarView(options)).map(parseManagedEvent).filter(Boolean).filter(row=>!row.isCancelled);
    rows.sort((a,b)=>(eventDate(a)?.getTime()||0)-(eventDate(b)?.getTime()||0));return rows;
  }

  async function recentMail({daysBack=7,top=50}={}){
    const cfg=loadConfig().outlook;if(!cfg.includeMail)throw new Error('Email insights are disabled. Enable Mail.Read in Account Connections and reconnect Outlook.');
    const s=session();if(!String(s?.scope||'').toLowerCase().includes('mail.read'))throw new Error('The current Outlook session does not include Mail.Read. Reconnect Outlook after enabling email insights.');
    const since=new Date(Date.now()-Math.max(1,Math.min(30,Number(daysBack)||7))*86400000).toISOString();
    const qs=new URLSearchParams({'$top':String(Math.max(1,Math.min(100,Number(top)||50))),'$select':'id,subject,sender,receivedDateTime,isRead,importance,flag,bodyPreview,webLink','$orderby':'receivedDateTime desc','$filter':`receivedDateTime ge ${since}`});
    const data=await graph(`/me/messages?${qs.toString()}`);return Array.isArray(data?.value)?data.value:[];
  }

  async function syncOutlook(){
    const account=await profile(),managed=await managedTimeline({daysBack:30,daysAhead:loadConfig().outlook.calendarDaysAhead});
    const counts=managed.reduce((acc,row)=>{acc[row.type]=(acc[row.type]||0)+1;return acc;},{});
    lastSnapshot={at:new Date().toISOString(),account,managed,counts};
    const cfg=loadConfig();saveConfig({outlook:{...cfg.outlook,lastSyncAt:lastSnapshot.at,lastManagedCount:managed.length}});
    emit('outlook-sync',lastSnapshot);return lastSnapshot;
  }
  async function testOutlook(){const account=await profile(),cals=await calendars();return {account,calendars:cals?.value||[]};}
  function snapshot(){return lastSnapshot;}
  function disconnectOutlook(){clearSession();emit('outlook-disconnected',{});}
  function forgetOutlook(){clearSession();saveConfig({outlook:clone(DEFAULTS.outlook)});emit('outlook-disconnected',{});}
  function status(){const cfg=loadConfig().outlook,s=session();return {outlook:{configured:!!cfg.clientId,connected:isOutlookConnected(),clientId:cfg.clientId,tenant:cfg.tenant,includeMail:cfg.includeMail,redirectUri:redirectUri(),scopes:requestedScopes(cfg),account:s?.account||null,expiresAt:s?.expiresAt||0,lastSyncAt:cfg.lastSyncAt||'',lastManagedCount:cfg.lastManagedCount||0},github:{connected:!!CT.githubSync?.isConnected?.()},breathe:{mode:'outlook-calendar-bridge'}};}

  CT.accountConnections=Object.freeze({loadConfig,saveConfig,status,redirectUri,requestedScopes,hasOutlookConfig,isOutlookConnected,connectOutlook,handleAuthCallback,disconnectOutlook,forgetOutlook,testOutlook,syncOutlook,profile,calendars,calendarView,managedTimeline,recentMail,parseManagedEvent,snapshot});
  Promise.resolve().then(()=>handleAuthCallback()).catch(error=>{emit('outlook-auth-error',{message:error.message});console.warn('[Cert Tracker] Outlook sign-in failed:',error.message);});
})(window);
