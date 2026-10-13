/* Speaking Room. Plain JS, no build step. */
(function(){
"use strict";
const C = window.CONTENT;
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const pad = n => String(n).padStart(2,"0");
const fmt = d => d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const today = () => fmt(new Date());
const addDays = (ds,n) => { const [y,m,d]=ds.split("-").map(Number); return fmt(new Date(y,m-1,d+n)); };
function el(tag, attrs, ...kids){
  const e=document.createElement(tag);
  for(const k in (attrs||{})){
    const v=attrs[k]; if(v==null||v===false) continue;
    if(k==="class") e.className=v; else if(k==="text") e.textContent=v;
    else if(k.startsWith("on")) e.addEventListener(k.slice(2),v); else e.setAttribute(k,v===true?"":v);
  }
  for(const c of kids){ if(c==null||c===false) continue; e.append(c); }
  return e;
}
const store = {
  get(k,def){ try{ const v=localStorage.getItem("sr-"+k); return v==null?def:JSON.parse(v); }catch(e){ return def; } },
  set(k,v){ try{ localStorage.setItem("sr-"+k, JSON.stringify(v)); }catch(e){} }
};

/* ================= state ================= */
let S = Object.assign({srs:{}, days:{}, speech:[], cards:{updatedAt:"", list:[]}, level:null}, store.get("state",{}));
const B = window.BANK || {levels:[], rows:{}, topics:{}};
const START_LEVEL = 2, MAX_LEVEL = B.levels.length || 1;
/* Topic of a bank row decides which deck toggle controls it */
const TOPIC_DECK = {whisky:"whisky", wine:"whisky", music:"music", lipchitz:"lipchitz", lecture:"lecture"};
const BANK_CARDS = [];
for(const lv in B.rows){
  B.rows[lv].forEach((r,i)=>{
    if(!r) return;
    const [kind, topic, prompt, en, note, alt] = r;
    const c = {id:"b"+lv+"-"+String(i+1).padStart(3,"0"), bank:true, lv:Number(lv), topic, en, note:note||undefined, alt:alt||undefined};
    if(kind==="f"){ c.d="fix"; c.bad=prompt; } else if(kind==="q"){ c.d="ask"; c.q=prompt; }
    else if(kind==="x"){ c.d="bank"; c.src=prompt; c.task=r[6]||"אמור בעבר"; } else { c.d="bank"; c.he=prompt; }
    BANK_CARDS.push(c);
  });
}
function levelState(){
  if(!S.level||!S.level.lv) S.level={lv:START_LEVEL, updatedAt:"", log:[], hist:[{date:today(), lv:START_LEVEL}]};
  return S.level;
}
const prefs = Object.assign({voice:"", rate:0.9, recLang:"en-US", decks:null, url:"", secret:""}, store.get("prefs",{}));
function savePrefs(){ store.set("prefs",prefs); }
let PERSONAL=[];
function allCards(){ const ids=new Set(PERSONAL.map(c=>c.id)); return C.cards.concat(PERSONAL, ((S.cards&&S.cards.list)||[]).filter(c=>!ids.has(c.id))); }
function everyCard(){ return allCards().concat(BANK_CARDS); }
const cardById = id => everyCard().find(c=>c.id===id);

/* Merge rules (the server applies the same rules) */
function mergeState(a,b){
  const out={srs:{},days:{},speech:[],cards:{updatedAt:"",list:[]}};
  const sa=a.srs||{}, sb=b.srs||{};
  for(const id of new Set([...Object.keys(sa),...Object.keys(sb)])){
    const x=sa[id], y=sb[id]; out.srs[id] = !x ? y : !y ? x : ((x.last||"")>=(y.last||"") ? x : y);
  }
  const da=a.days||{}, db=b.days||{};
  for(const d of new Set([...Object.keys(da),...Object.keys(db)])){
    const x=da[d]||{}, y=db[d]||{}, m={};
    for(const dev of new Set([...Object.keys(x),...Object.keys(y)])){
      const p=x[dev]||{}, q=y[dev]||{}, r={};
      if(typeof p!=="object"||typeof q!=="object") continue;
      for(const k of new Set([...Object.keys(p),...Object.keys(q)])) r[k]=Math.max(Number(p[k])||0, Number(q[k])||0);
      m[dev]=r;
    }
    out.days[d]=m;
  }
  const seen=new Map();
  for(const r of (a.speech||[]).concat(b.speech||[])){ if(!r||!r.at) continue; const p=seen.get(r.at); if(!p || (r.feedback && !p.feedback)) seen.set(r.at,r); }
  out.speech=[...seen.values()].sort((p,q)=>q.at.localeCompare(p.at)).slice(0,60);
  const ca=a.cards||{}, cb=b.cards||{};
  out.cards = (ca.updatedAt||"")>=(cb.updatedAt||"") ? (ca.list?ca:{updatedAt:"",list:[]}) : cb;
  const la=a.level, lb=b.level;
  out.level = !la ? (lb||null) : !lb ? la : ((la.updatedAt||"")>=(lb.updatedAt||"") ? la : lb);
  return out;
}

/* ================= server ================= */
const server = {
  ready(){ return !!(prefs.url && prefs.secret); },
  async call(action, payload, opt){
    if(!this.ready()) throw {code:"no_server"};
    const ctl = new AbortController(); const t=setTimeout(()=>ctl.abort(), (opt&&opt.timeout)||45000);
    try{
      const res = await fetch(prefs.url, {method:"POST", body:JSON.stringify(Object.assign({action, secret:prefs.secret}, payload||{})), signal:ctl.signal, redirect:"follow"});
      const j = await res.json();
      if(!j.ok) throw {code:j.error||"server_error"};
      return j;
    }catch(e){ if(e && e.code) throw e; throw {code:"network"}; }
    finally{ clearTimeout(t); }
  },
  async ai(kind, system, messages, maxTokens){
    const j = await this.call("ai", {model:kind, system, messages, max_tokens:maxTokens||700});
    return j.text||"";
  }
};
function parseJson(t){
  try{ return JSON.parse(t); }catch(e){}
  const a=t.indexOf("{"), b=t.lastIndexOf("}");
  if(a>=0&&b>a){ try{ return JSON.parse(t.slice(a,b+1)); }catch(e){} }
  return null;
}

let dirty=false, saveT=null, syncing=false;
function persist(){
  store.set("state",S); dirty=true;
  clearTimeout(saveT); saveT=setTimeout(pushState, 4000);
}
async function pushState(){
  if(!server.ready()||!dirty||syncing) return;
  syncing=true; dirty=false;
  try{
    const j = await server.call("save",{state:S});
    if(j.state){ S=mergeState(S,j.state); store.set("state",S); }
    setSync("מסונכרן "+new Date().toLocaleTimeString("he-IL",{hour:"2-digit",minute:"2-digit"}));
  }catch(e){ dirty=true; setSync(e.code==="unauthorized"?"הסיסמה לא תואמת לשרת":"לא מחובר כרגע. נשמר במכשיר, יסונכרן אחר כך."); }
  syncing=false;
}
async function pullState(){
  if(!server.ready()){ setSync("לא מחובר לשרת. ההתקדמות נשמרת במכשיר הזה בלבד."); return false; }
  try{
    const j=await server.call("load",{});
    S=mergeState(S,j.state||{}); store.set("state",S);
    setSync("מסונכרן");
    dirty=true; pushState();
    return true;
  }catch(e){ setSync(e.code==="unauthorized"?"הסיסמה לא תואמת לשרת":"השרת לא עונה. עובד במצב מקומי."); return false; }
}
function setSync(t){ const s=$("#sync"); if(s) s.textContent="סנכרון: "+t; }
document.addEventListener("visibilitychange",()=>{
  if(document.visibilityState==="hidden" && dirty && server.ready() && navigator.sendBeacon){
    try{ navigator.sendBeacon(prefs.url, JSON.stringify({action:"save",secret:prefs.secret,state:S})); dirty=false; }catch(e){}
  } else if(document.visibilityState==="visible"){ pullState().then(renderAll); }
});

/* ================= activity time ================= */
let lastTouch=0;
if(!prefs.dev){ prefs.dev="d"+Math.random().toString(36).slice(2,8); store.set("prefs",prefs); }
/* S.days[date][deviceId] = counters. Each device writes only its own row, so Mac and iPhone on the same day add up. */
function dayRec(){ const d=today(); S.days[d]=S.days[d]||{}; if(!S.days[d][prefs.dev]) S.days[d][prefs.dev]={activeSec:0,rated:0,good:0,hard:0,miss:0,said:0,accSum:0,free:0,chat:0}; return S.days[d][prefs.dev]; }
function D(d){ const o=S.days[d], t={}; if(!o) return t; for(const dev in o){ const r=o[dev]; if(r&&typeof r==="object") for(const k in r) t[k]=(t[k]||0)+(Number(r[k])||0); } return t; }
function touch(){
  const now=Date.now();
  if(lastTouch){ const gap=(now-lastTouch)/1000; if(gap>0&&gap<=120){ dayRec().activeSec=Math.round(dayRec().activeSec+gap); persist(); } }
  lastTouch=now; renderHeader();
}

/* ================= voice out ================= */
let voices=[];
function loadVoices(){
  if(!("speechSynthesis" in window)) return;
  voices = speechSynthesis.getVoices().filter(v=>/^en[-_]/i.test(v.lang));
  const sel=$("#voiceSel"); if(!sel) return;
  sel.textContent="";
  const rank=v=>(/premium|enhanced|natural|neural/i.test(v.name)?0:1)+(/en[-_]GB/i.test(v.lang)?0:.5);
  voices.sort((a,b)=>rank(a)-rank(b)||a.name.localeCompare(b.name));
  for(const v of voices) sel.append(el("option",{value:v.name,text:v.name+" ("+v.lang+")"}));
  if(!prefs.voice && voices[0]) prefs.voice=voices[0].name;
  sel.value=prefs.voice;
}
if("speechSynthesis" in window){ loadVoices(); speechSynthesis.onvoiceschanged=loadVoices; }
function say(text, onend){
  if(!("speechSynthesis" in window)||!text){ onend&&onend(); return; }
  try{
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(String(text).replace(/["“”]/g,""));
    const v=voices.find(x=>x.name===prefs.voice);
    if(v){ u.voice=v; u.lang=v.lang; } else u.lang="en-GB";
    u.rate=Number(prefs.rate)||0.9;
    if(onend){ u.onend=onend; u.onerror=onend; }
    speechSynthesis.speak(u);
  }catch(e){ onend&&onend(); }
  touch();
}

/* ================= voice in ================= */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const HAS_GUM = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
const recOK = !!SR || HAS_GUM;
const IS_STANDALONE = !!(window.navigator.standalone || (window.matchMedia && matchMedia("(display-mode: standalone)").matches));
function listenWeb(opts){
  /* opts: {continuous, onText(text), onStatus(stage), onDone(finalText, alts), onError(code)}
     stages: "starting" > "audio" (mic open) > "sound" > "speech" */
  let stopped=false, finished=false, finals=[], alts=[], rec=null, interim="", gotResult=false, gotAudio=false;
  const timers=[];
  const status=st=>{ opts.onStatus&&opts.onStatus(st); };
  function text(){ return finals.filter(Boolean).join(" ").replace(/\s+/g," ").trim(); }
  function commitInterim(){ if(interim.trim()){ finals.push(interim.trim()); alts.push([interim.trim()]); interim=""; } }
  function finish(){
    if(finished) return; finished=true; timers.forEach(clearTimeout);
    commitInterim();
    const t=text(), altList=alts.filter(Boolean);
    opts.onDone && opts.onDone(t, altList.length===1 ? altList[0] : [t]);
  }
  function fail(code){ if(finished) return; finished=true; stopped=true; timers.forEach(clearTimeout); try{ rec&&rec.abort(); }catch(e){} opts.onError&&opts.onError(code); }
  function make(){
    rec=new SR();
    rec.lang=prefs.recLang||"en-US";
    rec.interimResults=true;
    rec.continuous=!!opts.continuous;
    rec.maxAlternatives=3;
    const base=finals.length;
    rec.onaudiostart=()=>{ gotAudio=true; status("audio"); };
    rec.onsoundstart=()=>status("sound");
    rec.onspeechstart=()=>status("speech");
    rec.onresult=ev=>{
      gotResult=true; interim="";
      for(let i=ev.resultIndex;i<ev.results.length;i++){
        const r=ev.results[i];
        if(r.isFinal){ finals[base+i]=r[0].transcript.trim(); alts[base+i]=Array.from(r).map(a=>a.transcript.trim()); }
        else interim+=r[0].transcript;
      }
      opts.onText && opts.onText((text()+" "+interim).trim());
    };
    rec.onerror=ev=>{
      if(ev.error==="aborted") return;
      if(ev.error==="no-speech"){ if(!opts.continuous) finish(); return; }
      fail(ev.error);
    };
    rec.onend=()=>{
      if(finished) return;
      if(!stopped && opts.continuous){ commitInterim(); try{ make(); rec.start(); return; }catch(e){} }
      finish();
    };
  }
  function begin(){
    if(finished) return;
    try{ make(); rec.start(); status("starting"); }catch(e){ fail("start"); return; }
    /* Watchdogs: the mic never opened, or it opened but nothing came back */
    timers.push(setTimeout(()=>{ if(!gotAudio&&!gotResult) fail("no-audio"); }, 4000));
    if(!opts.continuous) timers.push(setTimeout(()=>{ if(!gotResult){ stopped=true; try{ rec.stop(); }catch(e){} timers.push(setTimeout(()=>{ if(!finished){ finished=true; opts.onError&&opts.onError("no-result"); } },1500)); } }, 12000));
  }
  /* Let any speech output release the audio first (iPhone keeps the speaker session otherwise) */
  if("speechSynthesis" in window && (speechSynthesis.speaking||speechSynthesis.pending)){ speechSynthesis.cancel(); setTimeout(begin, 400); }
  else { if("speechSynthesis" in window) speechSynthesis.cancel(); begin(); }
  return { stop(){ if(finished) return; stopped=true; try{ rec&&rec.stop(); }catch(e){ finish(); } timers.push(setTimeout(finish, 2500)); } };
}
/* ===== On-device engine: records with the microphone and transcribes with Whisper in the browser.
   Independent of Apple's / Google's recognizer, works in the home screen app. Model downloads once (~80MB) and is cached. */
const WHISPER_MODEL = "Xenova/whisper-base.en";
let whisperPipe=null, whisperLoading=null;
function loadWhisper(onProgress){
  if(window.__mockWhisper) return Promise.resolve(window.__mockWhisper);
  if(whisperPipe) return Promise.resolve(whisperPipe);
  if(!whisperLoading){
    whisperLoading = import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.2").then(async T=>{
      T.env.allowLocalModels=false;
      whisperPipe = await T.pipeline("automatic-speech-recognition", WHISPER_MODEL, {
        progress_callback: p=>{ if(p&&p.status==="progress"&&p.total>1e6) onProgress&&onProgress(Math.round(p.progress||0)); }
      });
      return whisperPipe;
    }).catch(e=>{ whisperLoading=null; throw e; });
  }
  return whisperLoading;
}
function resample(data, from, to){
  if(from===to) return data;
  const ratio=from/to, n=Math.floor(data.length/ratio), out=new Float32Array(n);
  for(let i=0;i<n;i++){ const x=i*ratio, j=Math.floor(x), f=x-j; out[i]=(data[j]||0)*(1-f)+(data[j+1]||0)*f; }
  return out;
}
function listenWhisper(opts){
  let finished=false, stopped=false, stream=null, ctx=null, node=null, src=null;
  const chunks=[]; let rate=48000, heardSpeech=false, lastLoud=0, startT=Date.now(), peak=0, floor=1;
  const status=st=>opts.onStatus&&opts.onStatus(st);
  const timers=[];
  function cleanup(){ timers.forEach(clearTimeout); try{ node&&node.disconnect(); src&&src.disconnect(); }catch(e){} try{ stream&&stream.getTracks().forEach(t=>t.stop()); }catch(e){} try{ ctx&&ctx.close(); }catch(e){} }
  function fail(code){ if(finished) return; finished=true; cleanup(); opts.onError&&opts.onError(code); }
  async function finish(){
    if(finished) return; finished=true; cleanup();
    let len=0; chunks.forEach(c=>len+=c.length);
    if(!len){ opts.onError&&opts.onError("no-input"); return; }
    if(peak<0.002){ opts.onError&&opts.onError("mic-silent"); return; }
    if(len/rate<0.5){ opts.onDone&&opts.onDone("",[""]); return; }
    const all=new Float32Array(len); let o=0; chunks.forEach(c=>{ all.set(c,o); o+=c.length; });
    const audio=resample(all, rate, 16000);
    window.__lastAudio={data:all, rate};
    try{
      status("loading");
      const pipe=await loadWhisper(pct=>opts.onStatus&&opts.onStatus("loading",pct));
      status("transcribing");
      const out=await pipe(audio, audio.length>16000*28 ? {chunk_length_s:30, stride_length_s:5} : {});
      window.__lastRaw=out&&out.text; console.log("[speaking-room] whisper raw:", JSON.stringify(out&&out.text), "seconds:", (audio.length/16000).toFixed(1), "peak:", peak.toFixed(4));
      let t=String((out&&out.text)||"").replace(/\[[^\]]*\]|\([^)]*\)/g," ").replace(/\s+/g," ").trim();
      if(/^(thank you\.?|thanks for watching\.?|you)$/i.test(t)) t="";
      if(t) opts.onText&&opts.onText(t);
      opts.onDone&&opts.onDone(t,[t]);
    }catch(e){ opts.onError&&opts.onError("model"); }
  }
  /* Audio context must be created inside the tap on iPhone */
  try{ ctx=new (window.AudioContext||window.webkitAudioContext)(); ctx.resume&&ctx.resume(); rate=ctx.sampleRate; }catch(e){ fail("audio-capture"); return {stop(){}}; }
  if("speechSynthesis" in window) speechSynthesis.cancel();
  status("starting");
  openMic().then(st=>{
    if(finished){ st.getTracks().forEach(t=>t.stop()); return; }
    stream=st; src=ctx.createMediaStreamSource(st);
    try{ const tr=st.getAudioTracks()[0]; opts.onDevice&&opts.onDevice(tr&&tr.label||""); }catch(e){}
    node=ctx.createScriptProcessor(4096,1,1);
    node.onaudioprocess=ev=>{
      if(finished||stopped) return;
      const d=ev.inputBuffer.getChannelData(0); chunks.push(new Float32Array(d));
      let sum=0; for(let i=0;i<d.length;i++) sum+=d[i]*d[i];
      const rms=Math.sqrt(sum/d.length), now=Date.now();
      /* Voice detection only decides when to stop after a pause. The quietest moment sets the floor,
         so speaking right away, or a quiet microphone, no longer hides the speech. */
      peak=Math.max(peak,rms); if(rms>0) floor=Math.min(floor,rms);
      opts.onLevel&&opts.onLevel(peak);
      if(rms>Math.max(0.003, floor*3)){ lastLoud=now; if(!heardSpeech){ heardSpeech=true; status("speech"); } }
      /* single answer: stop by itself after a pause */
      if(!opts.continuous && heardSpeech && now-lastLoud>1500){ stopped=true; finish(); }
    };
    src.connect(node); node.connect(ctx.destination);
    status("audio");
    timers.push(setTimeout(()=>{ if(!opts.continuous){ stopped=true; finish(); } }, 20000));
    timers.push(setTimeout(()=>{ if(!opts.continuous && !heardSpeech && !stopped){ stopped=true; finish(); } }, 10000));
    timers.push(setTimeout(()=>{ if(!chunks.length && !finished){ fail(ctx&&ctx.state!=="running"?"ctx-suspended":"no-input"); } }, 3000));
  }).catch(e=>fail(e&&e.name==="NotAllowedError"?"not-allowed":"audio-capture"));
  return { stop(){ if(finished) return; stopped=true; finish(); } };
}
/* Pick a real microphone. Virtual devices (eqMac, Zoom, projectors, loopback drivers) often sit
   first in the list and deliver pure silence, which is what broke recognition on the Mac. */
const VIRTUAL_MIC=/eqmac|zoom|virtual|blackhole|loopback|soundflower|projector|teams|krisp|obs|camo|airfoil|audio hijack/i;
function rankMic(d){
  const l=d.label||""; if(!l) return 0;
  if(VIRTUAL_MIC.test(l)) return -100;
  let r=0;
  if(/built-in|macbook|internal|מובנה|iphone microphone|מיקרופון ה-/i.test(l)) r+=10;
  if(/^(default|ברירת מחדל)/i.test(l)) r-=1;
  if(/iphone/i.test(l) && /mac/i.test(navigator.platform||"")) r-=5;
  return r;
}
async function micList(){
  let ins=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==="audioinput");
  if(ins.length && !ins.some(d=>d.label)){ try{ const t=await navigator.mediaDevices.getUserMedia({audio:true}); t.getTracks().forEach(x=>x.stop()); ins=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==="audioinput"); }catch(e){} }
  return ins;
}
async function openMic(){
  const base={echoCancellation:true,noiseSuppression:true,autoGainControl:true};
  let pick=null;
  try{
    const ins=await micList();
    pick = ins.find(d=>prefs.micId && d.deviceId===prefs.micId) || ins.slice().sort((a,b)=>rankMic(b)-rankMic(a))[0] || null;
  }catch(e){}
  try{ return await navigator.mediaDevices.getUserMedia({audio:Object.assign({},base, pick&&pick.deviceId?{deviceId:{exact:pick.deviceId}}:{})}); }
  catch(e){ if(e&&e.name==="NotAllowedError") throw e; return navigator.mediaDevices.getUserMedia({audio:base}); }
}
/* Engine choice: "auto" uses the browser recognizer, and switches to the on-device engine for good
   on this device if the browser recognizer fails. */
function engineNow(){
  if(prefs.engine==="web" && SR) return "web";
  return HAS_GUM ? "whisper" : (SR ? "web" : "none");
}
const WEB_FAIL = new Set(["no-audio","no-result","service-not-allowed","network","language-not-supported","start","audio-capture"]);
let webEmpty=0;
function listen(opts){
  const eng=engineNow();
  if(eng==="whisper" && HAS_GUM) return listenWhisper(opts);
  const wrapped=Object.assign({}, opts, {
    onError:code=>{
      if(prefs.engine!=="web" && HAS_GUM && WEB_FAIL.has(code)){ store.set("webFailed",true); opts.onError&&opts.onError("switched"); return; }
      opts.onError&&opts.onError(code);
    },
    onDone:(t,a)=>{
      if(!t && prefs.engine!=="web" && HAS_GUM){ webEmpty++; if(webEmpty>=2){ store.set("webFailed",true); webEmpty=0; opts.onError&&opts.onError("switched"); return; } }
      else if(t) webEmpty=0;
      opts.onDone&&opts.onDone(t,a);
    }
  });
  return listenWeb(wrapped);
}
function micErrorText(code){
  return ({ "not-allowed":"אין הרשאה למיקרופון. בדפדפן: הגדרות האתר, אפשר מיקרופון.",
            "service-not-allowed":"זיהוי הדיבור כבוי. באייפון: הגדרות, כללי, מקלדת, הפעל הכתבה. במק: הגדרות מערכת, מקלדת, הכתבה.",
            "audio-capture":"לא נמצא מיקרופון.", "network":"אין חיבור לשירות זיהוי הדיבור.",
            "language-not-supported":"השפה לא נתמכת. נסה מבטא אחר בהגדרות.",
            "switched":"זיהוי הדיבור של הדפדפן לא עובד במכשיר הזה, אז עברתי למנוע זיהוי שרץ בתוך המכשיר. לחץ שוב על המיקרופון ודבר. בפעם הראשונה הוא נטען כחצי דקה.",
            "model":"מנוע הזיהוי לא נטען. בדוק חיבור לאינטרנט ונסה שוב.",
            "no-input":"המיקרופון אושר, אבל לא מגיע ממנו קול לדפדפן. בדוק שאף אפליקציה אחרת לא משתמשת במיקרופון, וסגור ופתח את הדפדפן.",
            "ctx-suspended":"הדפדפן לא הפעיל את השמע. לחץ שוב על המיקרופון.",
            "mic-silent":"מהמיקרופון מגיע שקט מוחלט. במק: הגדרות מערכת, צליל, קלט, בחר מיקרופון ובדוק שהפס זז כשאתה מדבר. באייפון: הגדרות, Safari, מיקרופון, אפשר.",
            "no-audio":"המיקרופון לא נפתח."+(IS_STANDALONE?" באפליקציה שעל מסך הבית אפל חוסמת לפעמים זיהוי דיבור: פתח את האתר ישירות ב-Safari, או השתמש בהכתבה במקלדת למטה.":" בדוק בהגדרות האתר שהמיקרופון מותר, או השתמש בהכתבה במקלדת למטה."),
            "no-result":"המיקרופון פתוח, אבל זיהוי הדיבור לא החזיר מילים."+(IS_STANDALONE?" זה קורה באפליקציה שעל מסך הבית: פתח ישירות ב-Safari, או השתמש בהכתבה במקלדת למטה.":" ודא שהכתבה מופעלת בהגדרות המכשיר, או השתמש בהכתבה במקלדת למטה.") })[code] || "המיקרופון לא הצליח ("+code+"). נסה שוב.";
}
const STAGE_TEXT={starting:"פותח מיקרופון...", audio:"מקשיב. דבר עכשיו.", sound:"שומע קול...", speech:"שומע דיבור...", loading:"טוען את מנוע הזיהוי (רק בפעם הראשונה)...", transcribing:"מתמלל..."};
function stageText(st,pct){ return (STAGE_TEXT[st]||"")+(st==="loading"&&pct?" "+pct+"%":"");
}

/* ================= comparing ================= */
const NUM={"0":"zero","1":"one","2":"two","3":"three","4":"four","5":"five","6":"six","7":"seven","8":"eight","9":"nine","10":"ten","11":"eleven","12":"twelve"};
const CONTR=[[/\bcan't\b/g,"can not"],[/\bcannot\b/g,"can not"],[/\bwon't\b/g,"will not"],[/\b(\w+)n't\b/g,"$1 not"],[/\bi'm\b/g,"i am"],[/\b(\w+)'re\b/g,"$1 are"],[/\b(\w+)'ve\b/g,"$1 have"],[/\b(\w+)'ll\b/g,"$1 will"],[/\b(\w+)'d\b/g,"$1 would"],[/\b(it|that|he|she|what|there|here|who)'s\b/g,"$1 is"],[/\blet's\b/g,"let us"]];
function tokens(s){
  let t=String(s).toLowerCase().replace(/[’`]/g,"'");
  for(const [re,rep] of CONTR) t=t.replace(re,rep);
  t=t.replace(/whiskey/g,"whisky").replace(/\bisla\b|\beila\b|\beyela\b/g,"islay").replace(/-/g," ");
  return t.replace(/[^a-z0-9' ]+/g," ").split(/\s+/).filter(Boolean).map(w=>NUM[w]||w.replace(/'/g,""));
}
function lcs(a,b){
  const n=a.length,m=b.length,dp=Array.from({length:n+1},()=>new Array(m+1).fill(0));
  for(let i=n-1;i>=0;i--) for(let j=m-1;j>=0;j--) dp[i][j]= a[i]===b[j] ? dp[i+1][j+1]+1 : Math.max(dp[i+1][j],dp[i][j+1]);
  const ta=new Array(n).fill(false), tb=new Array(m).fill(false);
  let i=0,j=0; while(i<n&&j<m){ if(a[i]===b[j]){ ta[i]=tb[j]=true; i++; j++; } else if(dp[i+1][j]>=dp[i][j+1]) i++; else j++; }
  return {len:dp[0][0], ta, tb};
}
function compare(saidOptions, targets){
  let best=null;
  for(const said of saidOptions){
    const st=tokens(said);
    for(const target of targets){
      const tt=tokens(target);
      const r=lcs(tt,st);
      const score = tt.length+st.length ? (2*r.len)/(tt.length+st.length) : 0;
      if(!best||score>best.score) best={score, said, target, tt, st, r};
    }
  }
  return best;
}
function renderWords(best){
  const tLine=el("div",{class:"words en"}), sLine=el("div",{class:"words en"});
  best.tt.forEach((w,i)=>tLine.append(el("span",{class:best.r.ta[i]?"ok":"miss",text:w})," "));
  best.st.forEach((w,i)=>sLine.append(el("span",{class:best.r.tb[i]?"":"extra",text:w})," "));
  return {tLine,sLine};
}

/* ================= spaced repetition ================= */
const SESSION=14, NEW_PER_DAY=16, INTERVAL=[0,1,2,4,7,14];
let enabled = new Set(prefs.decks || Object.keys(C.decks));
let queue=[], pos=0, phase="ask", heard=null, suggested=0, rec=null;
function bankAllowed(c){ const dk=TOPIC_DECK[c.topic]; return !dk || enabled.has(dk); }
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
/* Fresh sentences: unseen bank rows at the current level, one stretch row from the level above,
   topics mixed. Falls back to neighbouring levels when the current one runs out. */
function freshBank(n){
  const lv=levelState().lv, unseen=BANK_CARDS.filter(c=>!S.srs[c.id]&&bankAllowed(c));
  const at=k=>shuffle(unseen.filter(c=>c.lv===k));
  let pick=[]; const stretch=at(lv+1).slice(0,1);
  const main=at(lv);
  const byTopic={}; main.forEach(c=>(byTopic[c.topic]=byTopic[c.topic]||[]).push(c));
  let more=true; while(more&&pick.length<n-stretch.length){ more=false; for(const k of shuffle(Object.keys(byTopic))){ const c=byTopic[k].shift(); if(c&&pick.length<n-stretch.length){ pick.push(c); more=true; } } }
  pick=pick.concat(stretch);
  for(const k of [lv-1,lv+1,lv-2,lv+2]) if(pick.length<n) pick=pick.concat(at(k).filter(c=>!pick.includes(c)).slice(0,n-pick.length));
  return pick;
}
function buildSession(){
  const t=today();
  const fixed=allCards().filter(c=>enabled.has(c.d)&&C.decks[c.d]);
  const reviewPool=fixed.concat(BANK_CARDS.filter(c=>bankAllowed(c)));
  const due=reviewPool.filter(c=>S.srs[c.id]&&S.srs[c.id].due<=t).sort((a,b)=>S.srs[a.id].due.localeCompare(S.srs[b.id].due)||(S.srs[a.id].box-S.srs[b.id].box)).slice(0,6);
  const newToday=Object.values(S.srs).filter(r=>r.first===t&&!r.bank).length;
  /* New lesson cards: newest material first, mixed across its decks */
  const prio=d=>({lesson:0,past:1,goodwell:1,vocab:1,edsound:2,fix:2,ask:3}[d] ?? 4);
  const unseen=shuffle(fixed.filter(c=>!S.srs[c.id])).sort((a,b)=>prio(a.d)-prio(b.d));
  const lessonNew=[], perDeck={};
  for(const c of unseen){ if(lessonNew.length>=Math.min(6,Math.max(0,NEW_PER_DAY-newToday))) break; if((perDeck[c.d]||0)>=2) continue; perDeck[c.d]=(perDeck[c.d]||0)+1; lessonNew.push(c); }
  const fresh=freshBank(Math.max(3,SESSION-due.length-lessonNew.length));
  queue=shuffle(due.concat(lessonNew,fresh));
  pos=0; phase="ask"; heard=null;
}
function moreFresh(){ queue=freshBank(10); pos=0; phase="ask"; heard=null; renderDrill(); }
/* Level engine: first attempts at bank sentences of the current level decide promotion. */
const LV_WINDOW=25, LV_MIN_DOWN=15;
function levelScore(level, acc){ const byRate={1:95,2:72,3:35}[level]; return acc==null ? byRate : Math.round((acc+byRate)/2); }
function recordLevel(c, level){
  const L=levelState();
  if(c.lv!==L.lv) return;
  L.log.push({s:levelScore(level, heard&&!heard.open?Math.round(heard.score*100):null), f:level===1?1:0, m:level===3?1:0});
  L.log=L.log.slice(-LV_WINDOW); L.updatedAt=new Date().toISOString();
  const n=L.log.length, avg=L.log.reduce((a,b)=>a+b.s,0)/n, flu=L.log.reduce((a,b)=>a+b.f,0)/n, miss=L.log.reduce((a,b)=>a+b.m,0)/n;
  let change=0;
  if(n>=LV_WINDOW && avg>=85 && flu>=0.7 && L.lv<MAX_LEVEL) change=1;
  else if(n>=LV_MIN_DOWN && (avg<60||miss>=0.4) && L.lv>1) change=-1;
  if(change){
    L.lv+=change; L.log=[]; L.hist.push({date:today(), lv:L.lv});
    toast(change>0 ? "עלית לרמה "+L.lv+": "+B.levels[L.lv-1].name : "חוזרים לרמה "+L.lv+" לחיזוק. זה חלק מהדרך.");
  }
}
function toast(msg){
  const t=el("div",{class:"toast",role:"status",text:msg}); document.body.append(t);
  setTimeout(()=>t.classList.add("show"),20); setTimeout(()=>{ t.classList.remove("show"); setTimeout(()=>t.remove(),400); },4200);
}
function rate(level){
  const c=queue[pos]; if(!c) return;
  const t=today(), r=Object.assign({box:0,seen:0,miss:0,first:t}, S.srs[c.id]);
  r.seen++; r.last=new Date().toISOString();
  const firstBank = c.bank && r.seen===1;
  if(c.bank) r.bank=1;
  if(level===1) r.box = firstBank ? 4 : Math.min(5,r.box+1); else if(level===2) r.box=Math.max(1,r.box); else { r.box=1; r.miss++; }
  if(firstBank) recordLevel(c, level);
  if(heard) r.acc=Math.round(heard.score*100);
  r.due = level===3 ? t : addDays(t, INTERVAL[r.box]);
  S.srs[c.id]=r;
  const d=dayRec(); d.rated++; d[level===1?"good":level===2?"hard":"miss"]++;
  if(level>=2 && !queue.slice(pos+1).some(x=>x.id===c.id)) queue.splice(Math.min(queue.length,pos+4),0,c);
  touch(); persist();
  pos++; phase="ask"; heard=null; renderDrill();
}
function targetsOf(c){ return [c.en].concat(c.alt||[]); }
function promptOf(c){ return c.src ? c.src : c.d==="fix"?c.bad : c.d==="ask"?c.q : c.he; }
const isEnPrompt = c => !!(c.src || c.d==="fix" || c.d==="ask");

function scoreSaid(t, options){
  const c=queue[pos]; if(!c||!t) return;
  const d=dayRec(); d.said++;
  if(c.d==="ask"){ heard={score:1, said:t, open:true}; }
  else {
    /* Score what was actually heard. Recognition alternatives only rescue a clear mishearing,
       otherwise they would hide real grammar slips (she drink / she drinks). */
    heard=compare([t], targetsOf(c));
    if(heard.score<0.5){ const b2=compare(options||[t], targetsOf(c)); if(b2&&b2.score>heard.score) heard=b2; }
    d.accSum+=Math.round(heard.score*100);
  }
  suggested = heard.open ? 0 : heard.score>=0.92 ? 1 : heard.score>=0.7 ? 2 : 3;
  phase="shown"; touch(); persist(); renderDrill(); say(c.en);
}
function startMic(btn, live){
  if(rec){ rec.stop(); return; }
  btn.classList.add("on"); live.textContent=stageText("starting");
  let words=false;
  rec=listen({
    onStatus:(st,p)=>{ if(!words) live.textContent=stageText(st,p); },
    onText:t=>{ words=true; live.textContent=t; },
    onDone:(t,options)=>{
      rec=null; btn.classList.remove("on");
      if(!t){ live.textContent="לא נקלטו מילים. לחץ שוב ודבר מיד, או השתמש בהכתבה במקלדת למטה."; return; }
      scoreSaid(t, options);
    },
    onError:code=>{ rec=null; btn.classList.remove("on"); live.textContent=micErrorText(code); }
  });
  touch();
}
/* Keyboard dictation fallback: works everywhere, including the home screen app (use the keyboard mic key) */
function typeBox(){
  const inp=el("input",{class:"en",id:"typeSaid",autocomplete:"off",autocapitalize:"off",spellcheck:"false",lang:"en",placeholder:"לחץ כאן ואז על המיקרופון שבמקלדת"});
  const f=el("form",{class:"row typebox"},inp,el("button",{class:"b",type:"submit",text:"בדוק"}));
  f.addEventListener("submit",e=>{ e.preventDefault(); const v=inp.value.trim(); if(v) scoreSaid(v,[v]); });
  return el("details",{class:"kbd-dict"},el("summary",{text:"הכתבה במקלדת"}),f);
}

function renderDrill(){
  const st=$("#stage"); st.textContent="";
  const total=queue.length, c=queue[pos];
  $("#drillCount").textContent = total ? ("כרטיס "+Math.min(pos+1,total)+" מתוך "+total) : "";
  $("#drillMeter").style.width = total ? (100*Math.min(pos,total)/total)+"%" : "100%";
  if(!c){
    const d=D(today());
    st.append(el("div",{class:"done"},
      el("div",{class:"big",text: total?"סיימת את הסבב של היום":"אין כרטיסים פתוחים כרגע"}),
      el("p",{class:"muted",text:"זמן אימון היום: "+Math.round((d.activeSec||0)/60)+" דקות. עכשיו דקה חופשית או שיחה קצרה, ובזה סגרת יום."}),
      el("div",{class:"row center"},
        el("button",{class:"b primary",type:"button",onclick:()=>showTab("chat"),text:"לשיחה"}),
        el("button",{class:"b",type:"button",onclick:()=>showTab("free"),text:"לדקה החופשית"}),
        el("button",{class:"b",type:"button",onclick:moreFresh,text:"עוד 10 משפטים חדשים"}),
        el("button",{class:"b",type:"button",onclick:extraRound,text:"סבב חזרה"}))));
    return;
  }
  const deck=C.decks[c.d]||{tag:""};
  const isNew=c.bank&&!S.srs[c.id];
  const tagText = c.bank ? ((isNew?"חדש":"חזרה")+" · רמה "+c.lv+(c.src?" · "+c.task:c.d==="fix"?" · מצא ותקן":c.d==="ask"?" · שאלה פתוחה":"")) : deck.tag;
  st.append(el("span",{class:"tag",text:tagText}));
  st.append(el("div",{class:"prompt"+(isEnPrompt(c)?" en":""),text:promptOf(c)}));
  if(c.d==="ask") st.append(el("div",{class:"row"},el("button",{class:"b",type:"button",onclick:()=>say(c.q),text:"השמע את השאלה"})));
  st.append(el("div",{class:"instr",text: c.src?(c.task||"אמור בעבר")+", בקול." : c.d==="fix"?"אמור בקול את המשפט הנכון." : c.d==="ask"?"ענה בקול במשפט שלם, על עצמך." : "אמור את זה באנגלית, בקול."}));

  const live=el("div",{class:"live en"});
  if(recOK){
    const mic=el("button",{class:"mic",type:"button","aria-label":"דבר",id:"drillMic"},el("span",{class:"dot"}));
    mic.addEventListener("click",()=>startMic(mic,live));
    st.append(el("div",{class:"row center"},mic), live);
  }
  st.append(typeBox());
  if(phase==="ask"){
    st.append(el("div",{class:"row center"},
      el("button",{class:"b",type:"button",onclick:()=>{ phase="shown"; heard=null; suggested=0; touch(); renderDrill(); say(c.en); }},
        document.createTextNode(recOK?"הצג תשובה בלי לדבר ":"אמרתי בקול, הצג תשובה "), el("kbd",{class:"kbdonly",text:"Enter"}))));
    if(!recOK) st.append(el("p",{class:"muted small",text:"הדפדפן הזה לא תומך בזיהוי דיבור. פתח ב-Safari או ב-Chrome."}));
    return;
  }
  /* shown */
  if(heard && !heard.open){
    const w=renderWords(heard);
    st.append(el("div",{class:"heard"},
      el("div",{class:"row between"},el("span",{class:"tag",text:"מה שאמרת"}),el("span",{class:"pct",text:Math.round(heard.score*100)+"%"})),
      w.sLine,
      el("span",{class:"tag",text:"המשפט הנכון (באדום: מילים שחסרו)"}), w.tLine));
  } else if(heard && heard.open){
    st.append(el("div",{class:"heard"},el("span",{class:"tag",text:"מה שאמרת"}),el("div",{class:"words en",text:heard.said})));
    if(server.ready()) st.append(checkOpenAnswer(c, heard.said));
  }
  const ans=el("div",{class:"answer"});
  if(!(heard&&!heard.open)){ ans.append(el("span",{class:"tag",text:c.d==="ask"?"דוגמה לתשובה":"המשפט"}), el("div",{class:"big en",text:c.en})); }
  ans.append(el("div",{class:"row"},
    el("button",{class:"b",type:"button",onclick:()=>say(c.en)},document.createTextNode("השמע "),el("kbd",{class:"kbdonly",text:"L"})),
    el("button",{class:"b",type:"button",onclick:()=>{ const old=prefs.rate; prefs.rate=0.7; say(c.en,()=>{prefs.rate=old;}); },text:"לאט"})));
  if(c.note) ans.append(el("div",{class:"note",text:c.note}));
  ans.append(el("div",{class:"instr",text:"הקשב, אמור שוב פעמיים בקצב רגיל, ואז דרג איך זה יצא בפעם הראשונה."}));
  const mk=(lv,cls,label)=>el("button",{class:"b "+cls+(suggested===lv?" sel":""),type:"button",onclick:()=>rate(lv)},el("kbd",{class:"kbdonly",text:String(lv)}),document.createTextNode(" "+label));
  ans.append(el("div",{class:"rate"}, mk(1,"good","יצא שוטף"), mk(2,"warn","היססתי"), mk(3,"bad","לא הצלחתי")));
  st.append(ans);
}
function checkOpenAnswer(c, said){
  const box=el("div",{class:"note"},el("button",{class:"b",type:"button",text:"בדוק את התשובה שלי",onclick:async ev=>{
    const b=ev.currentTarget; b.disabled=true; b.textContent="בודק...";
    try{
      const t=await server.ai("quick", SYSTEM_COACH, [{role:"user",content:"Question: "+c.q+"\nHis spoken answer (speech-to-text): "+said+"\nReply with only JSON: {\"ok\": boolean (true if grammatical and natural enough), \"better\": string (a corrected natural version of his answer), \"why\": string (one short Hebrew sentence, empty if ok)}"}], 300);
      const j=parseJson(t)||{};
      box.textContent="";
      box.append(el("div",{text:j.ok?"נכון וטבעי.":"כדאי לומר כך:"}));
      if(j.better) box.append(el("div",{class:"en",style:"font-weight:600",text:String(j.better)}));
      if(j.why) box.append(el("div",{class:"muted",text:String(j.why)}));
    }catch(e){ b.disabled=false; b.textContent="הבדיקה נכשלה. נסה שוב"; }
  }}));
  return box;
}
function extraRound(){
  const pool=everyCard().filter(c=>(c.bank?bankAllowed(c):enabled.has(c.d))&&S.srs[c.id]).sort((a,b)=>(S.srs[a.id].box-S.srs[b.id].box)||((S.srs[b.id].miss||0)-(S.srs[a.id].miss||0)));
  queue=pool.slice(0,10); pos=0; phase="ask"; heard=null; renderDrill();
}
function renderDecks(){
  const box=$("#deckPick"); box.textContent="";
  const hasPersonal=allCards().some(c=>c.d==="personal");
  for(const k in C.decks){
    if(k==="personal"&&!hasPersonal) continue;
    const id="deck-"+k, cb=el("input",{type:"checkbox",id});
    cb.checked=enabled.has(k);
    cb.addEventListener("change",()=>{ if(cb.checked) enabled.add(k); else enabled.delete(k); if(!enabled.size){ enabled.add(k); cb.checked=true; } prefs.decks=[...enabled]; savePrefs(); buildSession(); renderDrill(); });
    box.append(el("label",{for:id},cb,document.createTextNode(C.decks[k].name)));
  }
}
$("#deckToggle").onclick=()=>{ $("#deckPick").hidden=!$("#deckPick").hidden; };
document.addEventListener("keydown",e=>{
  if($("#p-drill").hidden) return;
  if(e.target&&/TEXTAREA|INPUT|SELECT/.test(e.target.tagName)) return;
  const c=queue[pos]; if(!c) return;
  if(e.code==="Space"){ e.preventDefault(); const m=$("#drillMic"); if(m) m.click(); }
  else if(e.key==="Enter"&&phase==="ask"){ phase="shown"; heard=null; suggested=0; renderDrill(); say(c.en); }
  else if(phase==="shown"&&/^[123]$/.test(e.key)) rate(Number(e.key));
  else if(phase==="shown"&&/^[lLך]$/.test(e.key)) say(c.en);
});

/* ================= AI prompts ================= */
const SYSTEM_COACH = "You are an English speaking coach for Mendy, an Israeli adult whose first language is Hebrew. Level about A2 to B1: he reads well but speaks with basic grammar mistakes. Grammar covered so far, and what to watch: present simple (he/she/it + s, don't/doesn't + base verb, no am/is/are before a main verb, no -ing for habits and stative verbs like know/understand/like); past simple (regular verbs + ed, common irregular verbs, negative didn't + base verb: never \"didn't went\", never was/were before a main verb such as \"I was work\"); good vs well (good describes a noun or follows is/tastes/looks, well describes how an action is done); word order of time phrases and frequency adverbs; question form (do/does/did, can you...). Recent vocabulary: Diaspora, persecution, heritage, migration, revival. His words come from speech-to-text, so ignore punctuation, capitals and obvious recognition glitches; judge grammar, word choice and natural phrasing only. Write Hebrew explanations short and plain. Never use em dashes or en dashes.";

/* ================= chat ================= */
let chat=null, chatRec=null;
function renderChatList(){
  const list=$("#chatList"); list.textContent="";
  $("#chatNeedServer").hidden=server.ready();
  for(const s of C.chats){
    list.append(el("button",{class:"item",type:"button",disabled:!server.ready(),onclick:()=>startChat(s)},
      el("b",{text:s.title}), el("span",{class:"meta",text:s.he})));
  }
}
function startChat(s){
  chat={s, turns:[{role:"assistant",content:s.opener}], fixes:[], started:new Date().toISOString(), userWords:0};
  $("#chatPick").hidden=true; $("#chatRoom").hidden=false;
  $("#chatTitle").textContent=s.title; $("#chatLog").textContent=""; $("#chatLive").textContent="";
  addMsg("them", s.opener); say(s.opener);
}
function addMsg(who, text){
  const m=el("div",{class:"msg "+who},el("div",{class:who==="them"?"en":"en",text}));
  if(who==="them") m.append(el("button",{class:"say",type:"button",text:"השמע שוב",onclick:()=>say(text)}));
  $("#chatLog").append(m); $("#chatLog").scrollTop=1e6; return m;
}
$("#chatMic").onclick=()=>{
  const btn=$("#chatMic"), live=$("#chatLive");
  if(chatRec){ chatRec.stop(); return; }
  if(!recOK){ live.textContent="הדפדפן לא תומך בזיהוי דיבור. אפשר להקליד למטה."; return; }
  btn.classList.add("on"); live.dataset.w=""; live.textContent=stageText("starting");
  chatRec=listen({continuous:true,
    onStatus:(st,p)=>{ if(!live.dataset.w||st==="transcribing") live.textContent=stageText(st,p); },
    onText:t=>{ live.dataset.w="1"; live.textContent=t; },
    onDone:t=>{ chatRec=null; btn.classList.remove("on"); live.textContent=""; if(t) sendChat(t); },
    onError:code=>{ chatRec=null; btn.classList.remove("on"); live.textContent=micErrorText(code); }});
  touch();
};
$("#chatType").addEventListener("submit",e=>{ e.preventDefault(); const v=$("#chatInput").value.trim(); if(v){ $("#chatInput").value=""; sendChat(v); } });
async function sendChat(text){
  if(!chat) return;
  addMsg("me", text); chat.turns.push({role:"user",content:text}); chat.userWords+=tokens(text).length;
  dayRec().chat=(dayRec().chat||0)+1; touch(); persist();
  const wait=el("div",{class:"msg them muted",text:"..."}); $("#chatLog").append(wait); $("#chatLog").scrollTop=1e6;
  $("#chatMic").disabled=true;
  const sys = SYSTEM_COACH + "\nYou are role-playing " + chat.s.role + ". Keep the conversation going naturally. Speak simply, at his level: short sentences, common words. After each of his turns reply with only a JSON object: {\"fix\": null or {\"wrong\": his exact phrase, \"right\": the corrected phrase, \"why\": one short Hebrew sentence} (only the single most important mistake, null if his turn was fine or the error is tiny), \"reply\": your spoken reply in character, at most two short sentences, usually ending with a simple question}. After about 10 of his turns, wrap up politely.";
  try{
    const msgs = chat.turns.slice(-16);
    if(msgs[0].role==="assistant") msgs.unshift({role:"user",content:"(The conversation starts. You already said your opening line.)"});
    const t=await server.ai("quick", sys, msgs, 400);
    const j=parseJson(t)||{reply:t, fix:null};
    wait.remove();
    if(j.fix && j.fix.right){
      chat.fixes.push(j.fix);
      $("#chatLog").append(el("div",{class:"corr"},el("div",{class:"en"},el("span",{class:"muted",style:"text-decoration:line-through",text:String(j.fix.wrong||"")}),document.createTextNode("  "),el("b",{text:String(j.fix.right)})),el("div",{class:"muted small",text:String(j.fix.why||"")})));
    }
    const reply=String(j.reply||"").trim()||"Sorry, can you say that again?";
    chat.turns.push({role:"assistant",content:reply}); addMsg("them",reply); say(reply);
  }catch(e){ wait.textContent=e.code==="no_server"?"אין חיבור לשרת.":"התשובה לא הגיעה. נסה לשלוח שוב."; chat.turns.pop(); }
  $("#chatMic").disabled=false;
}
$("#chatEnd").onclick=()=>{
  if(chatRec){ chatRec.stop(); chatRec=null; }
  if(chat && chat.turns.some(t=>t.role==="user")){
    S.speech.unshift({at:chat.started, date:today(), kind:"chat", topic:chat.s.title, words:chat.userWords, feedback:{mistakes:chat.fixes}});
    persist();
  }
  chat=null; $("#chatRoom").hidden=true; $("#chatPick").hidden=false;
  if("speechSynthesis" in window) speechSynthesis.cancel();
};

/* ================= free talk ================= */
let curTopic=null, freeRec=null, freeT=null, freeStart=0, freeBase="", freeEntry=null;
function topicPool(){ const lv=levelState().lv; let p=(B.topics[lv]||[]).concat(B.topics[lv-1]||[]); if(lv>=4) p=p.concat(C.topics); return p.length?p:C.topics; }
function renderTopic(){ const p=topicPool().filter(t=>!curTopic||t.en!==curTopic.en); curTopic=p[Math.floor(Math.random()*p.length)]; $("#topicEn").textContent=curTopic.en; $("#topicHe").textContent=curTopic.he; }
$("#nextTopic").onclick=()=>renderTopic();
$("#listenTopic").onclick=()=>say(curTopic.en);
$("#freeGo").onclick=()=>{ if(freeT) stopFree(); else startFree(); };
function startFree(){
  freeBase=$("#speech").value.trim(); freeStart=Date.now(); $("#fb").hidden=true; freeEntry=null;
  $("#freeGo").textContent="עצור"; $("#freeStats").textContent="";
  $("#freeLive").dataset.w="";
  if(recOK){
    freeRec=listen({continuous:true,
      onStatus:(st,p)=>{ if(!$("#freeLive").dataset.w||st==="loading"||st==="transcribing") $("#freeLive").textContent=stageText(st,p); },
      onText:t=>{ $("#freeLive").dataset.w="1"; $("#freeLive").textContent=t.split(" ").slice(-14).join(" "); $("#speech").value=(freeBase?freeBase+" ":"")+t; },
      onDone:t=>{ freeRec=null; if(t) $("#speech").value=(freeBase?freeBase+" ":"")+t; $("#freeLive").textContent=""; finishFree(); },
      onError:code=>{ freeRec=null; $("#freeLive").textContent=micErrorText(code); }});
  }
  tick(); freeT=setInterval(tick,500);
}
function tick(){
  const left=Math.max(0,60-Math.floor((Date.now()-freeStart)/1000));
  $("#timer").textContent=Math.floor(left/60)+":"+pad(left%60); touch();
  if(left<=0) stopFree();
}
function stopFree(){
  clearInterval(freeT); freeT=null; $("#freeGo").textContent="עוד דקה";
  if(freeRec) freeRec.stop(); else finishFree();
}
let finishing=false;
function finishFree(){
  if(finishing) return; finishing=true; setTimeout(()=>finishing=false,500);
  const secs=Math.max(1,Math.min(60,(Date.now()-freeStart)/1000));
  const said=$("#speech").value.trim().slice(freeBase.length).trim();
  const n=tokens(said).length;
  if(n<3){ $("#freeStats").textContent=recOK?"כמעט לא נקלט דיבור. אפשר לנסות שוב.":""; return; }
  const wpm=Math.round(n/(secs/60));
  $("#freeStats").textContent=n+" מילים, "+wpm+" מילים לדקה. לדובר שוטף בשיחה רגילה זה בערך 120 עד 150.";
  freeEntry={at:new Date().toISOString(), date:today(), kind:"free", topic:curTopic.en, text:said.slice(0,2500), words:n, wpm, secs:Math.round(secs)};
  S.speech.unshift(freeEntry); dayRec().free=(dayRec().free||0)+1; persist();
  if(server.ready()) $("#fbBtn").focus();
}
$("#speech").addEventListener("input",()=>touch());
$("#fbBtn").onclick=async()=>{
  const text=$("#speech").value.trim();
  if(tokens(text).length<4){ $("#fbStatus").textContent="צריך לפחות משפט או שניים."; return; }
  if(!server.ready()){ $("#fbStatus").textContent="התיקונים דורשים חיבור לשרת (בהגדרות)."; return; }
  $("#fbBtn").disabled=true; $("#fbStatus").textContent="בודק...";
  try{
    const t=await server.ai("smart", SYSTEM_COACH, [{role:"user",content:"He spoke for one minute on this topic: "+curTopic.en+"\nHis words:\n\"\"\""+text.slice(0,3000)+"\"\"\"\nReply with only a JSON object: {\"corrected\": his whole answer rewritten in natural, simple spoken English (keep his meaning and level), \"mistakes\": [{\"wrong\": his exact phrase, \"right\": corrected phrase, \"why\": one short Hebrew sentence}] (at most 6, most important first, skip trivial ones), \"good\": one specific Hebrew sentence on what he did well, \"sayIt\": one useful corrected sentence from his answer to repeat aloud three times}"}], 1200);
    const fb=parseJson(t);
    if(!fb) throw {code:"bad_json"};
    renderFeedback(fb);
    if(freeEntry && text.includes(freeEntry.text.slice(0,40))) freeEntry.feedback=fb;
    else { freeEntry={at:new Date().toISOString(), date:today(), kind:"free", topic:curTopic.en, text:text.slice(0,2500), words:tokens(text).length, feedback:fb}; S.speech.unshift(freeEntry); }
    touch(); persist(); $("#fbStatus").textContent="";
  }catch(e){ $("#fbStatus").textContent = e.code==="unauthorized"?"הסיסמה לא תואמת לשרת.":e.code==="daily_limit"?"הגעת למגבלת השימוש היומית בשרת.":"משהו נתקע. נסה שוב."; }
  $("#fbBtn").disabled=false;
};
function renderFeedback(fb){
  const box=$("#fb"); box.textContent=""; box.hidden=false;
  if(fb.good) box.append(el("div",{class:"note",text:String(fb.good)}));
  const ms=Array.isArray(fb.mistakes)?fb.mistakes:[];
  if(ms.length){ box.append(el("span",{class:"tag",text:"תיקונים"})); for(const m of ms) box.append(fixEl(m,true)); }
  if(fb.corrected){ box.append(el("span",{class:"tag",text:"הגרסה המתוקנת, להקריא בקול"}), el("div",{class:"en",text:String(fb.corrected)}), el("div",{class:"row"},el("button",{class:"b",type:"button",onclick:()=>say(String(fb.corrected)),text:"השמע"}))); }
  if(fb.sayIt){ box.append(el("span",{class:"tag",text:"משפט אחד, שלוש פעמים בקול"}), el("div",{class:"row"},el("span",{class:"en",style:"font-size:1.2rem;font-weight:600",text:String(fb.sayIt)}),el("button",{class:"b",type:"button",onclick:()=>say(String(fb.sayIt)),text:"השמע"}))); }
}
function fixEl(m,withWhy){ return el("div",{class:"fix"},el("span",{class:"en wrong",text:String(m.wrong||"")}),el("span",{class:"en right",text:String(m.right||"")}),withWhy&&m.why?el("span",{class:"muted small",text:String(m.why)}):null); }

/* ================= persistence score ================= */
const DAY_MIN=120;
function computeScore(){
  const t=today(), dates=Object.keys(S.days).filter(d=>(D(d).activeSec||0)>0).sort();
  if(!dates.length) return {score:0,streak:0,window:0,active:0,avgMin:0};
  const first=dates[0]; let win=0, pts=0, active=0, minSum=0;
  for(let i=0;i<14;i++){ const d=addDays(t,-i); if(d<first) break; win++; const s=D(d).activeSec||0; pts+=Math.min(1,s/600); if(s>=DAY_MIN){ active++; minSum+=s/60; } }
  let streak=0, d=t; if((D(d).activeSec||0)<DAY_MIN) d=addDays(t,-1);
  while((D(d).activeSec||0)>=DAY_MIN){ streak++; d=addDays(d,-1); }
  const avgMin=active?minSum/active:0;
  const score=Math.round(100*(0.6*(pts/Math.max(1,win))+0.25*Math.min(1,avgMin/15)+0.15*Math.min(1,streak/7)));
  return {score,streak,window:win,active,avgMin};
}
const scoreLabel=s=>s>=90?"מצוין":s>=75?"טוב מאוד":s>=60?"טוב":s>=40?"צריך חיזוק":"בוא נתחיל";

/* ================= render: header + progress ================= */
function renderHeader(){
  const sc=computeScore();
  $("#hdrScore").textContent=sc.score; $("#hdrStreak").textContent=sc.streak;
  $("#hdrToday").textContent=Math.round((D(today()).activeSec||0)/60);
}
function renderProgress(){
  const sc=computeScore(), t=today();
  $("#ringNum").textContent=sc.score;
  $("#ringArc").setAttribute("stroke-dasharray",(3.52*sc.score).toFixed(1)+" 352"); $("#ringArc").style.opacity=sc.score?1:0;
  $("#scoreLabel").textContent="ציון התמדה: "+scoreLabel(sc.score);
  $("#scoreExplain").textContent = sc.window
    ? "על "+sc.window+" הימים האחרונים: 60% על כמה ימים התאמנת (יום מלא = 10 דקות), 25% על אורך האימון (יעד 15 דקות), 15% על רצף. כרגע "+sc.active+" ימי אימון, ממוצע "+Math.round(sc.avgMin)+" דק' ליום, רצף "+sc.streak+"."
    : "הציון יתחיל להיספר מהאימון הראשון. נספר רק זמן של עבודה פעילה.";
  const days=$("#days"), lab=$("#dlabels"); days.textContent=""; lab.textContent="";
  for(let i=13;i>=0;i--){
    const d=addDays(t,-i), s=D(d).activeSec||0;
    const bar=el("div",{title:d+": "+Math.round(s/60)+" דק'"}); bar.style.height=Math.max(4,Math.min(100,(s/60)/20*100))+"%";
    if(s>=DAY_MIN) bar.classList.add("on"); if(i===0) bar.classList.add("today");
    days.append(bar); lab.append(el("span",{text:String(Number(d.slice(8)))}));
  }
  const all=Object.keys(S.days).map(D), sum=k=>all.reduce((a,b)=>a+(Number(b[k])||0),0);
  const said=sum("said"), acc=said?Math.round(sum("accSum")/Math.max(1,said)):0;
  const learned=Object.values(S.srs).filter(r=>r.box>=3).length;
  const st=$("#stats"); st.textContent="";
  [[Math.round(sum("activeSec")/60),"דקות סך הכל"],[sum("rated"),"משפטים שתורגלו"],[acc+"%","דיוק בזיהוי"],[learned+"/"+everyCard().length,"משפטים יציבים"]]
    .forEach(([v,l])=>st.append(el("div",{class:"stat"},el("b",{text:String(v)}),el("span",{text:l}))));
  renderSpark();
  renderLevel();
  const bx=$("#boxes"); bx.textContent="";
  for(let b=0;b<=5;b++){ const n=b===0?everyCard().filter(c=>!S.srs[c.id]).length:Object.values(S.srs).filter(r=>r.box===b).length; bx.append(el("div",{},el("b",{text:String(n)}),document.createTextNode(b===0?"לא נראו":"תא "+b))); }
  const wk=$("#weak"); wk.textContent="";
  const weak=everyCard().filter(c=>S.srs[c.id]&&(S.srs[c.id].miss||0)>0).sort((a,b)=>(S.srs[b.id].miss-S.srs[a.id].miss)||(S.srs[a.id].box-S.srs[b.id].box)).slice(0,6);
  if(!weak.length) wk.append(el("p",{class:"muted",text:"עדיין אין. כאן יופיעו המשפטים שסימנת \"לא הצלחתי\"."}));
  for(const c of weak) wk.append(el("div",{class:"item"},el("span",{class:"en",text:c.en}),el("span",{class:"meta",text:(c.bank?"רמה "+c.lv:(C.decks[c.d]||{}).name)+" · לא הצליח "+S.srs[c.id].miss+" פעמים · תא "+S.srs[c.id].box+(S.srs[c.id].acc!=null?" · דיוק אחרון "+S.srs[c.id].acc+"%":"")})));
  const sl=$("#speechLog"); sl.textContent="";
  const withFix=S.speech.filter(r=>r.feedback&&Array.isArray(r.feedback.mistakes)&&r.feedback.mistakes.length).slice(0,5);
  if(!withFix.length) sl.append(el("p",{class:"muted",text:"עדיין אין. תיקונים מהשיחה ומהדקה החופשית יישמרו כאן."}));
  for(const r of withFix){ const it=el("div",{class:"item"}); it.append(el("span",{class:"meta",text:(r.date||"")+" · "+(r.kind==="chat"?"שיחה: ":"")+(r.topic||"")}));
    for(const m of r.feedback.mistakes.slice(0,4)) it.append(fixEl(m,false)); sl.append(it); }
}
function renderLevel(){
  const box=$("#levelBox"); if(!box) return; box.textContent="";
  const L=levelState(), info=B.levels[L.lv-1]||{name:"",desc:""};
  const n=L.log.length, avg=n?Math.round(L.log.reduce((a,b)=>a+b.s,0)/n):0, flu=n?Math.round(100*L.log.reduce((a,b)=>a+b.f,0)/n):0;
  box.append(el("div",{class:"row between"},el("b",{class:"lvname",text:"רמה "+L.lv+" מתוך "+MAX_LEVEL+": "+info.name}),el("span",{class:"muted small",text:info.desc})));
  const steps=el("div",{class:"lvsteps"}); for(let i=1;i<=MAX_LEVEL;i++) steps.append(el("i",{class:i<L.lv?"past":i===L.lv?"cur":""})); box.append(steps);
  box.append(el("p",{class:"muted small",text: n
    ? "ברמה הנוכחית: "+n+" מתוך "+LV_WINDOW+" משפטים חדשים. ציון ממוצע "+avg+", שוטף "+flu+"%. עולים רמה כשהממוצע 85 ומעלה ולפחות 70% שוטף."
    : "הרמה נקבעת לפי הניסיון הראשון בכל משפט חדש. אחרי "+LV_WINDOW+" משפטים מהרמה הזאת האפליקציה מחליטה אם לעלות."}));
  const seen=BANK_CARDS.filter(c=>c.lv===L.lv&&S.srs[c.id]).length, tot=BANK_CARDS.filter(c=>c.lv===L.lv).length;
  box.append(el("p",{class:"muted small",text:"משפטים ברמה הזאת שכבר ראית: "+seen+" מתוך "+tot+"."}));
  if(L.hist.length>1) box.append(el("p",{class:"muted small",text:"היסטוריה: "+L.hist.map(h=>h.date.slice(5).split("-").reverse().join(".")+" רמה "+h.lv).join(", ")}));
}
function renderSpark(){
  const box=$("#wpm"); box.textContent="";
  const pts=S.speech.filter(r=>r.kind==="free"&&r.wpm).slice(0,14).reverse();
  if(pts.length<2){ box.append(el("p",{class:"muted",text:pts.length?("פעם אחת: "+pts[0].wpm+" מילים לדקה. הגרף יופיע מהפעם השנייה."):"עוד אין מדידות. כל דקה חופשית מודדת כמה מילים אמרת."})); return; }
  const W=600,H=90,P=22, max=Math.max(150,...pts.map(p=>p.wpm)), x=i=>P+(W-2*P)*i/(pts.length-1), y=v=>H-14-(H-28)*v/max;
  const ns="http://www.w3.org/2000/svg", svg=document.createElementNS(ns,"svg"); svg.setAttribute("viewBox","0 0 "+W+" "+H); svg.setAttribute("preserveAspectRatio","none");
  const mk=(t,a)=>{ const e=document.createElementNS(ns,t); for(const k in a) e.setAttribute(k,a[k]); svg.append(e); return e; };
  [0,60,120].forEach(v=>{ mk("line",{x1:P,x2:W-P,y1:y(v),y2:y(v),class:"gr"}); mk("text",{x:2,y:y(v)+3}).textContent=v; });
  const d=pts.map((p,i)=>(i?"L":"M")+x(i).toFixed(1)+" "+y(p.wpm).toFixed(1)).join(" ");
  mk("path",{d:d+" L"+x(pts.length-1)+" "+y(0)+" L"+x(0)+" "+y(0)+" Z",class:"ar"});
  mk("path",{d,class:"ln"});
  const last=pts[pts.length-1]; mk("circle",{cx:x(pts.length-1),cy:y(last.wpm),r:4,fill:"var(--accent)"});
  box.append(svg, el("p",{class:"muted small",text:"אחרון: "+last.wpm+" מילים לדקה. ראשון: "+pts[0].wpm+"."}));
}
function summaryText(){
  const sc=computeScore(), t=today(), L=[];
  L.push("סיכום חדר הדיבור, "+t);
  L.push("רמה "+levelState().lv+" ("+(B.levels[levelState().lv-1]||{}).name+"), "+levelState().log.length+" ניסיונות ברמה, ציון ממוצע "+(levelState().log.length?Math.round(levelState().log.reduce((a,b)=>a+b.s,0)/levelState().log.length):0));
  L.push("ציון התמדה "+sc.score+" ("+scoreLabel(sc.score)+"), רצף "+sc.streak+", ימי אימון "+sc.active+" מתוך "+sc.window+", ממוצע "+Math.round(sc.avgMin)+" דק'.");
  for(let i=13;i>=0;i--){ const d=addDays(t,-i), r=D(d); if(r.activeSec) L.push(d+": "+Math.round(r.activeSec/60)+" דק', "+(r.rated||0)+" משפטים ("+(r.good||0)+"/"+(r.hard||0)+"/"+(r.miss||0)+"), דיוק "+(r.said?Math.round(r.accSum/r.said):0)+"%, דקות חופשיות "+(r.free||0)+", תורות שיחה "+(r.chat||0)); }
  const weak=everyCard().filter(c=>S.srs[c.id]&&(S.srs[c.id].miss||0)>0).map(c=>c.id+": "+c.en+" (x"+S.srs[c.id].miss+")");
  if(weak.length) L.push("נתקע ב: "+weak.join(" | "));
  const w=S.speech.filter(r=>r.wpm).slice(0,8).map(r=>r.date+" "+r.wpm); if(w.length) L.push("מילים לדקה: "+w.join(", "));
  for(const r of S.speech.filter(r=>r.feedback&&r.feedback.mistakes&&r.feedback.mistakes.length).slice(0,6)) L.push((r.kind==="chat"?"שיחה ":"דקה ")+r.date+": "+r.feedback.mistakes.map(m=>m.wrong+" > "+m.right).join("; "));
  return L.join("\n");
}
$("#copySum").onclick=async()=>{
  const txt=summaryText();
  try{ await navigator.clipboard.writeText(txt); $("#copyMsg").textContent="הועתק. הדבק בשיחה עם Claude."; $("#copyFallback").hidden=true; }
  catch(e){ const f=$("#copyFallback"); f.hidden=false; f.value=txt; f.focus(); f.select(); $("#copyMsg").textContent="סמן והעתק מהתיבה."; }
};

/* ================= settings ================= */
function fillSettings(){
  $("#srvUrl").value=prefs.url||""; $("#srvSecret").value=prefs.secret||"";
  $("#rateSel").value=String(prefs.rate); $("#recLang").value=prefs.recLang;
  $("#engineSel").value=prefs.engine==="web"?"web":(prefs.engine||"auto");
  fillMics();
  const eng=engineNow();
  $("#micSupport").textContent = !recOK ? "הדפדפן הזה לא תומך במיקרופון." : eng==="whisper" ? "פעיל עכשיו: מנוע זיהוי בתוך המכשיר (Whisper). בפעם הראשונה הוא מוריד כ-80MB, ואחר כך עובד גם בלי אינטרנט." : "פעיל עכשיו: זיהוי הדיבור של הדפדפן.";
}
$("#srvSave").onclick=async()=>{
  prefs.url=$("#srvUrl").value.trim(); prefs.secret=$("#srvSecret").value.trim(); savePrefs();
  $("#srvMsg").textContent="בודק...";
  try{ await server.call("ping",{}); $("#srvMsg").textContent="מחובר."; await pullState(); renderAll(); }
  catch(e){ $("#srvMsg").textContent = e.code==="unauthorized"?"הסיסמה שגויה.":e.code==="no_server"?"חסרה כתובת או סיסמה.":"השרת לא עונה. בדוק את הכתובת."; }
};
$("#srvLink").onclick=async()=>{
  if(!server.ready()&&!prefs.pkey){ $("#srvMsg").textContent="אין עדיין מה להעביר."; return; }
  const code=btoa(unescape(encodeURIComponent(JSON.stringify({u:prefs.url,s:prefs.secret,k:prefs.pkey||undefined})))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
  const link=location.origin+location.pathname+"#setup="+code;
  try{ await navigator.clipboard.writeText(link); $("#srvMsg").textContent="הקישור הועתק. שלח אותו לעצמך ופתח באייפון ב-Safari."; }
  catch(e){ $("#srvMsg").textContent=link; }
};
$("#voiceSel").onchange=e=>{ prefs.voice=e.target.value; savePrefs(); say("Smoky whisky comes from Islay."); };
$("#rateSel").onchange=e=>{ prefs.rate=Number(e.target.value); savePrefs(); say("I listen to Bach when I work."); };
$("#recLang").onchange=e=>{ prefs.recLang=e.target.value; savePrefs(); };
$("#micSel").onchange=e=>{ prefs.micId=e.target.value; savePrefs(); };
async function fillMics(){
  const sel=$("#micSel"); if(!sel||!HAS_GUM) return;
  let ins=[]; try{ ins=await micList(); }catch(e){}
  sel.textContent=""; sel.append(el("option",{value:"",text:"אוטומטי (מדלג על התקנים וירטואליים)"}));
  for(const d of ins){ if(/^(default|ברירת מחדל)/i.test(d.label)) continue; sel.append(el("option",{value:d.deviceId,text:(d.label||"מיקרופון")+(VIRTUAL_MIC.test(d.label)?" (וירטואלי)":"")})); }
  sel.value=prefs.micId||"";
}
$("#engineSel").onchange=e=>{ prefs.engine=e.target.value; savePrefs(); store.set("webFailed",false); fillSettings(); if(prefs.engine==="whisper") loadWhisper(()=>{}).catch(()=>{}); };
function micTestStart(){
  const out=$("#micTestOut"), lvl=$("#micLevel"); if(!recOK){ out.textContent="לא נתמך כאן."; return; }
  const eng=engineNow(); let dev="";
  out.textContent=stageText("starting"); lvl.textContent="מנוע: "+(eng==="whisper"?"בתוך המכשיר":"של הדפדפן");
  const r=listen({
    onStatus:(st,p)=>{ out.textContent=stageText(st,p); },
    onDevice:label=>{ dev=label; },
    onLevel:p=>{ lvl.textContent="מנוע: בתוך המכשיר. מיקרופון: "+(dev||"לא ידוע")+". עוצמת קול מקסימלית: "+Math.round(p*1000)+" (שקט: פחות מ-3. דיבור רגיל: 20 ומעלה)"; },
    onText:t=>{ out.textContent=t; },
    onDone:t=>{ out.textContent=t?("נקלט: "+t):"נקלט קול, אבל לא זוהו מילים. לחץ \"השמע הקלטה\" ובדוק אם שומעים אותך."+(window.__lastRaw?" (המנוע החזיר: "+window.__lastRaw+")":""); $("#micPlay").hidden=!window.__lastAudio; $("#micTest").onclick=micTestStart; },
    onError:c=>{ out.textContent=micErrorText(c); $("#micTest").onclick=micTestStart; }
  });
  $("#micTest").onclick=()=>{ r&&r.stop&&r.stop(); };
}
$("#micTest").onclick=micTestStart;
$("#micPlay").onclick=()=>{
  const a=window.__lastAudio; if(!a) return;
  try{ const c=new (window.AudioContext||window.webkitAudioContext)(), b=c.createBuffer(1,a.data.length,a.rate); b.getChannelData(0).set(a.data);
    const src=c.createBufferSource(); src.buffer=b; src.connect(c.destination); src.start(); src.onended=()=>c.close(); }catch(e){}
};
/* Personal cards: personal.enc.json (AES-GCM, key from PBKDF2 of the personal key). See tools/personal.mjs. */
function normCard(c){
  if(!c||!c.id||!c.en||!(c.he||c.q||c.bad||c.src)) return null;
  return {id:"p:"+String(c.id).replace(/^p:/,""), d:C.decks[c.d]?c.d:"personal", he:c.he, q:c.q, bad:c.bad, src:c.src, task:c.task, en:c.en, alt:Array.isArray(c.alt)?c.alt:undefined, note:c.note};
}
async function loadPersonal(){
  const st=$("#pkStatus");
  if(!prefs.pkey){ if(st) st.textContent="לא פעיל במכשיר הזה."; return false; }
  try{
    const o=await (await fetch("personal.enc.json",{cache:"no-store"})).json();
    const u=s=>Uint8Array.from(atob(s),ch=>ch.charCodeAt(0));
    const base=await crypto.subtle.importKey("raw",new TextEncoder().encode(prefs.pkey),"PBKDF2",false,["deriveKey"]);
    const key=await crypto.subtle.deriveKey({name:"PBKDF2",salt:u(o.salt),iterations:o.iter,hash:"SHA-256"},base,{name:"AES-GCM",length:256},false,["decrypt"]);
    const pt=await crypto.subtle.decrypt({name:"AES-GCM",iv:u(o.iv)},key,u(o.data));
    PERSONAL=JSON.parse(new TextDecoder().decode(pt)).map(normCard).filter(Boolean);
    enabled.add("personal");
    if(st) st.textContent="פעיל: "+PERSONAL.length+" משפטים אישיים.";
    return true;
  }catch(e){ if(st) st.textContent="המפתח לא מתאים, או שהקובץ לא נטען."; return false; }
}
$("#pkSave").onclick=async()=>{ prefs.pkey=$("#pkInput").value.trim(); savePrefs(); $("#pkMsg").textContent=(await loadPersonal())?"נשמר.":"לא הצליח."; buildSession(); renderAll(); };

/* ================= tabs ================= */
function showTab(p){
  $$(".tabs button").forEach(b=>b.setAttribute("aria-selected",b.dataset.p===p?"true":"false"));
  ["drill","chat","free","prog","set"].forEach(k=>$("#p-"+k).hidden=k!==p);
  if(p==="prog") renderProgress();
  if(p==="chat") renderChatList();
  if(p==="set") fillSettings();
  store.set("tab",p); window.scrollTo(0,0);
}
$$(".tabs button").forEach(b=>b.onclick=()=>showTab(b.dataset.p));
$("#hdrChip").onclick=()=>showTab("prog");
function renderAll(){ renderHeader(); renderDecks(); renderDrill(); if(!$("#p-prog").hidden) renderProgress(); if(!$("#p-chat").hidden&&!chat) renderChatList(); }

/* ================= boot ================= */
if(location.hash.startsWith("#k=")){ prefs.pkey=decodeURIComponent(location.hash.slice(3)); savePrefs(); history.replaceState(null,"",location.pathname); }
if(location.hash.startsWith("#setup=")){
  try{
    const b=location.hash.slice(7).replace(/-/g,"+").replace(/_/g,"/");
    const o=JSON.parse(decodeURIComponent(escape(atob(b))));
    if(o.u&&o.s){ prefs.url=o.u; prefs.secret=o.s; } if(o.k) prefs.pkey=o.k; savePrefs();
  }catch(e){}
  history.replaceState(null,"",location.pathname);
}
buildSession(); renderTopic(); renderAll();
showTab(store.get("tab","drill"));
loadPersonal().then(ok=>{ if(ok){ buildSession(); renderAll(); } });
if(engineNow()==="whisper") setTimeout(()=>loadWhisper(()=>{}).catch(()=>{}), 1500);
pullState().then(ok=>{ if(ok){ buildSession(); renderAll(); } });
if("serviceWorker" in navigator && location.protocol==="https:") navigator.serviceWorker.register("sw.js").catch(()=>{});
})();
