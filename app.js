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
let S = Object.assign({srs:{}, days:{}, speech:[], cards:{updatedAt:"", list:[]}}, store.get("state",{}));
const prefs = Object.assign({voice:"", rate:0.9, recLang:"en-US", decks:null, url:"", secret:""}, store.get("prefs",{}));
function savePrefs(){ store.set("prefs",prefs); }
function allCards(){ return C.cards.concat((S.cards&&S.cards.list)||[]); }

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
const recOK = !!SR;
function listen(opts){
  /* opts: {continuous, onText(text, final), onDone(finalText, alts), onError(code)} */
  let stopped=false, finals=[], alts=[], rec=null, interim="";
  function make(){
    rec=new SR();
    rec.lang=prefs.recLang||"en-US";
    rec.interimResults=true;
    rec.continuous=!!opts.continuous;
    rec.maxAlternatives=3;
    let base=finals.length;
    rec.onresult=ev=>{
      interim="";
      for(let i=ev.resultIndex;i<ev.results.length;i++){
        const r=ev.results[i];
        if(r.isFinal){
          finals[base+i]=r[0].transcript.trim();
          alts[base+i]=Array.from(r).map(a=>a.transcript.trim());
        } else interim+=r[0].transcript;
      }
      opts.onText && opts.onText(text()+(interim?" "+interim:""), false);
    };
    rec.onerror=ev=>{ if(ev.error==="no-speech"||ev.error==="aborted") return; stopped=true; opts.onError&&opts.onError(ev.error); };
    rec.onend=()=>{
      if(!stopped && opts.continuous){ try{ make(); rec.start(); return; }catch(e){} }
      finish();
    };
  }
  let finished=false;
  function text(){ return finals.filter(Boolean).join(" ").replace(/\s+/g," ").trim(); }
  function finish(){
    if(finished) return; finished=true;
    let t=text(); if(!t && interim) t=interim.trim();
    const altList = alts.filter(Boolean);
    let options=[t];
    if(altList.length===1) options=altList[0];
    opts.onDone && opts.onDone(t, options);
  }
  if("speechSynthesis" in window) speechSynthesis.cancel();
  make();
  try{ rec.start(); }catch(e){ opts.onError&&opts.onError("start"); }
  return { stop(){ stopped=true; try{ rec.stop(); }catch(e){ finish(); } setTimeout(finish, 1500); } };
}
function micErrorText(code){
  return ({ "not-allowed":"אין הרשאה למיקרופון. בדפדפן: הגדרות האתר, אפשר מיקרופון.",
            "service-not-allowed":"זיהוי הדיבור כבוי. באייפון: הגדרות, כללי, מקלדת, הפעל הכתבה. במק: הגדרות מערכת, מקלדת, הכתבה.",
            "audio-capture":"לא נמצא מיקרופון.", "network":"אין חיבור לשירות זיהוי הדיבור.",
            "language-not-supported":"השפה לא נתמכת. נסה מבטא אחר בהגדרות." })[code] || "המיקרופון לא הצליח ("+code+"). נסה שוב.";
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
const SESSION=12, NEW_PER_DAY=8, INTERVAL=[0,1,2,4,7,14];
let enabled = new Set(prefs.decks || Object.keys(C.decks));
let queue=[], pos=0, phase="ask", heard=null, suggested=0, rec=null;
function buildSession(){
  const t=today(), pool=allCards().filter(c=>enabled.has(c.d)&&C.decks[c.d]);
  const due=pool.filter(c=>S.srs[c.id]&&S.srs[c.id].due<=t).sort((a,b)=>S.srs[a.id].due.localeCompare(S.srs[b.id].due)||(S.srs[a.id].box-S.srs[b.id].box));
  const newToday=Object.values(S.srs).filter(r=>r.first===t).length;
  const byDeck={}; pool.filter(c=>!S.srs[c.id]).forEach(c=>(byDeck[c.d]=byDeck[c.d]||[]).push(c));
  const mixed=[]; let more=true; while(more){ more=false; for(const k in byDeck){ const c=byDeck[k].shift(); if(c){ mixed.push(c); more=true; } } }
  const room=Math.max(0,SESSION-due.length);
  queue=due.slice(0,SESSION).concat(mixed.slice(0,Math.min(room,Math.max(0,NEW_PER_DAY-newToday))));
  pos=0; phase="ask"; heard=null;
}
function rate(level){
  const c=queue[pos]; if(!c) return;
  const t=today(), r=Object.assign({box:0,seen:0,miss:0,first:t}, S.srs[c.id]);
  r.seen++; r.last=new Date().toISOString();
  if(level===1) r.box=Math.min(5,r.box+1); else if(level===2) r.box=Math.max(1,r.box); else { r.box=1; r.miss++; }
  if(heard) r.acc=Math.round(heard.score*100);
  r.due = level===3 ? t : addDays(t, INTERVAL[r.box]);
  S.srs[c.id]=r;
  const d=dayRec(); d.rated++; d[level===1?"good":level===2?"hard":"miss"]++;
  if(level>=2 && !queue.slice(pos+1).some(x=>x.id===c.id)) queue.splice(Math.min(queue.length,pos+4),0,c);
  touch(); persist();
  pos++; phase="ask"; heard=null; renderDrill();
}
function targetsOf(c){ return [c.en].concat(c.alt||[]); }
function promptOf(c){ return c.d==="fix"?c.bad : c.d==="ask"?c.q : c.he; }

function startMic(btn, live){
  if(rec){ rec.stop(); return; }
  const c=queue[pos];
  btn.classList.add("on"); live.textContent="מקשיב...";
  rec=listen({
    onText:t=>{ live.textContent=t; },
    onDone:(t,options)=>{
      rec=null; btn.classList.remove("on");
      if(!t){ live.textContent="לא נקלט דיבור. נסה שוב, קצת יותר קרוב למיקרופון."; return; }
      const d=dayRec(); d.said++;
      if(c.d==="ask"){ heard={score:1, said:t, open:true}; }
      else {
        /* Score what was actually heard. Recognition alternatives only rescue a clear mishearing,
           otherwise they would hide real grammar slips (she drink / she drinks). */
        heard=compare([t], targetsOf(c));
        if(heard.score<0.5){ const b2=compare(options, targetsOf(c)); if(b2&&b2.score>heard.score) heard=b2; }
        d.accSum+=Math.round(heard.score*100);
      }
      suggested = heard.open ? 0 : heard.score>=0.92 ? 1 : heard.score>=0.7 ? 2 : 3;
      phase="shown"; touch(); persist(); renderDrill(); say(c.en);
    },
    onError:code=>{ rec=null; btn.classList.remove("on"); live.textContent=micErrorText(code); }
  });
  touch();
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
        el("button",{class:"b",type:"button",onclick:extraRound,text:"עוד סבב חזרה"}))));
    return;
  }
  const deck=C.decks[c.d]||{tag:""};
  st.append(el("span",{class:"tag",text:deck.tag}));
  st.append(el("div",{class:"prompt"+(c.d==="fix"||c.d==="ask"?" en":""),text:promptOf(c)}));
  if(c.d==="ask") st.append(el("div",{class:"row"},el("button",{class:"b",type:"button",onclick:()=>say(c.q),text:"השמע את השאלה"})));
  st.append(el("div",{class:"instr",text: c.d==="fix"?"אמור בקול את המשפט הנכון." : c.d==="ask"?"ענה בקול במשפט שלם, על עצמך." : "אמור את זה באנגלית, בקול."}));

  const live=el("div",{class:"live en"});
  if(recOK){
    const mic=el("button",{class:"mic",type:"button","aria-label":"דבר",id:"drillMic"},el("span",{class:"dot"}));
    mic.addEventListener("click",()=>startMic(mic,live));
    st.append(el("div",{class:"row center"},mic), live);
  }
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
  const pool=allCards().filter(c=>enabled.has(c.d)&&S.srs[c.id]).sort((a,b)=>(S.srs[a.id].box-S.srs[b.id].box)||((S.srs[b.id].miss||0)-(S.srs[a.id].miss||0)));
  queue=pool.slice(0,10); pos=0; phase="ask"; heard=null; renderDrill();
}
function renderDecks(){
  const box=$("#deckPick"); box.textContent="";
  const hasPersonal=((S.cards&&S.cards.list)||[]).length>0;
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
const SYSTEM_COACH = "You are an English speaking coach for Mendy, an Israeli adult whose first language is Hebrew. Level about A2 to B1: he reads well but speaks with basic grammar mistakes. Current focus: present simple (positive, negative, he/she/it + s, no am/is/are before a main verb, no -ing for habits), word order of time phrases and frequency adverbs, question form (do/does, can you...). His words come from speech-to-text, so ignore punctuation, capitals and obvious recognition glitches; judge grammar, word choice and natural phrasing only. Write Hebrew explanations short and plain. Never use em dashes or en dashes.";

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
  btn.classList.add("on"); live.textContent="מקשיב...";
  chatRec=listen({continuous:true,
    onText:t=>{ live.textContent=t; },
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
let topicIdx=Math.floor(Math.random()*C.topics.length), freeRec=null, freeT=null, freeStart=0, freeBase="", freeEntry=null;
function renderTopic(){ const t=C.topics[topicIdx]; $("#topicEn").textContent=t.en; $("#topicHe").textContent=t.he; }
$("#nextTopic").onclick=()=>{ topicIdx=(topicIdx+1)%C.topics.length; renderTopic(); };
$("#listenTopic").onclick=()=>say(C.topics[topicIdx].en);
$("#freeGo").onclick=()=>{ if(freeT) stopFree(); else startFree(); };
function startFree(){
  freeBase=$("#speech").value.trim(); freeStart=Date.now(); $("#fb").hidden=true; freeEntry=null;
  $("#freeGo").textContent="עצור"; $("#freeStats").textContent="";
  if(recOK){
    freeRec=listen({continuous:true,
      onText:t=>{ $("#freeLive").textContent=t.split(" ").slice(-14).join(" "); $("#speech").value=(freeBase?freeBase+" ":"")+t; },
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
  freeEntry={at:new Date().toISOString(), date:today(), kind:"free", topic:C.topics[topicIdx].en, text:said.slice(0,2500), words:n, wpm, secs:Math.round(secs)};
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
    const t=await server.ai("smart", SYSTEM_COACH, [{role:"user",content:"He spoke for one minute on this topic: "+C.topics[topicIdx].en+"\nHis words:\n\"\"\""+text.slice(0,3000)+"\"\"\"\nReply with only a JSON object: {\"corrected\": his whole answer rewritten in natural, simple spoken English (keep his meaning and level), \"mistakes\": [{\"wrong\": his exact phrase, \"right\": corrected phrase, \"why\": one short Hebrew sentence}] (at most 6, most important first, skip trivial ones), \"good\": one specific Hebrew sentence on what he did well, \"sayIt\": one useful corrected sentence from his answer to repeat aloud three times}"}], 1200);
    const fb=parseJson(t);
    if(!fb) throw {code:"bad_json"};
    renderFeedback(fb);
    if(freeEntry && text.includes(freeEntry.text.slice(0,40))) freeEntry.feedback=fb;
    else { freeEntry={at:new Date().toISOString(), date:today(), kind:"free", topic:C.topics[topicIdx].en, text:text.slice(0,2500), words:tokens(text).length, feedback:fb}; S.speech.unshift(freeEntry); }
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
  [[Math.round(sum("activeSec")/60),"דקות סך הכל"],[sum("rated"),"משפטים שתורגלו"],[acc+"%","דיוק בזיהוי"],[learned+"/"+allCards().length,"משפטים יציבים"]]
    .forEach(([v,l])=>st.append(el("div",{class:"stat"},el("b",{text:String(v)}),el("span",{text:l}))));
  renderSpark();
  const bx=$("#boxes"); bx.textContent="";
  for(let b=0;b<=5;b++){ const n=b===0?allCards().filter(c=>!S.srs[c.id]).length:Object.values(S.srs).filter(r=>r.box===b).length; bx.append(el("div",{},el("b",{text:String(n)}),document.createTextNode(b===0?"לא נראו":"תא "+b))); }
  const wk=$("#weak"); wk.textContent="";
  const weak=allCards().filter(c=>S.srs[c.id]&&(S.srs[c.id].miss||0)>0).sort((a,b)=>(S.srs[b.id].miss-S.srs[a.id].miss)||(S.srs[a.id].box-S.srs[b.id].box)).slice(0,6);
  if(!weak.length) wk.append(el("p",{class:"muted",text:"עדיין אין. כאן יופיעו המשפטים שסימנת \"לא הצלחתי\"."}));
  for(const c of weak) wk.append(el("div",{class:"item"},el("span",{class:"en",text:c.en}),el("span",{class:"meta",text:(C.decks[c.d]||{}).name+" · לא הצליח "+S.srs[c.id].miss+" פעמים · תא "+S.srs[c.id].box+(S.srs[c.id].acc!=null?" · דיוק אחרון "+S.srs[c.id].acc+"%":"")})));
  const sl=$("#speechLog"); sl.textContent="";
  const withFix=S.speech.filter(r=>r.feedback&&Array.isArray(r.feedback.mistakes)&&r.feedback.mistakes.length).slice(0,5);
  if(!withFix.length) sl.append(el("p",{class:"muted",text:"עדיין אין. תיקונים מהשיחה ומהדקה החופשית יישמרו כאן."}));
  for(const r of withFix){ const it=el("div",{class:"item"}); it.append(el("span",{class:"meta",text:(r.date||"")+" · "+(r.kind==="chat"?"שיחה: ":"")+(r.topic||"")}));
    for(const m of r.feedback.mistakes.slice(0,4)) it.append(fixEl(m,false)); sl.append(it); }
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
  L.push("ציון התמדה "+sc.score+" ("+scoreLabel(sc.score)+"), רצף "+sc.streak+", ימי אימון "+sc.active+" מתוך "+sc.window+", ממוצע "+Math.round(sc.avgMin)+" דק'.");
  for(let i=13;i>=0;i--){ const d=addDays(t,-i), r=D(d); if(r.activeSec) L.push(d+": "+Math.round(r.activeSec/60)+" דק', "+(r.rated||0)+" משפטים ("+(r.good||0)+"/"+(r.hard||0)+"/"+(r.miss||0)+"), דיוק "+(r.said?Math.round(r.accSum/r.said):0)+"%, דקות חופשיות "+(r.free||0)+", תורות שיחה "+(r.chat||0)); }
  const weak=allCards().filter(c=>S.srs[c.id]&&(S.srs[c.id].miss||0)>0).map(c=>c.id+": "+c.en+" (x"+S.srs[c.id].miss+")");
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
  $("#micSupport").textContent = recOK ? "זיהוי דיבור נתמך בדפדפן הזה." : "הדפדפן הזה לא תומך בזיהוי דיבור. באייפון ובמק: Safari. במחשב אחר: Chrome.";
}
$("#srvSave").onclick=async()=>{
  prefs.url=$("#srvUrl").value.trim(); prefs.secret=$("#srvSecret").value.trim(); savePrefs();
  $("#srvMsg").textContent="בודק...";
  try{ await server.call("ping",{}); $("#srvMsg").textContent="מחובר."; await pullState(); renderAll(); }
  catch(e){ $("#srvMsg").textContent = e.code==="unauthorized"?"הסיסמה שגויה.":e.code==="no_server"?"חסרה כתובת או סיסמה.":"השרת לא עונה. בדוק את הכתובת."; }
};
$("#srvLink").onclick=async()=>{
  if(!server.ready()){ $("#srvMsg").textContent="קודם שמור כתובת וסיסמה."; return; }
  const code=btoa(unescape(encodeURIComponent(JSON.stringify({u:prefs.url,s:prefs.secret})))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
  const link=location.origin+location.pathname+"#setup="+code;
  try{ await navigator.clipboard.writeText(link); $("#srvMsg").textContent="הקישור הועתק. שלח אותו לעצמך ופתח באייפון ב-Safari."; }
  catch(e){ $("#srvMsg").textContent=link; }
};
$("#voiceSel").onchange=e=>{ prefs.voice=e.target.value; savePrefs(); say("Smoky whisky comes from Islay."); };
$("#rateSel").onchange=e=>{ prefs.rate=Number(e.target.value); savePrefs(); say("I listen to Bach when I work."); };
$("#recLang").onchange=e=>{ prefs.recLang=e.target.value; savePrefs(); };
$("#micTest").onclick=()=>{
  const out=$("#micTestOut"); if(!recOK){ out.textContent="לא נתמך כאן."; return; }
  out.textContent="דבר עכשיו...";
  listen({onText:t=>out.textContent=t, onDone:t=>out.textContent=t?("נקלט: "+t):"לא נקלט כלום.", onError:c=>out.textContent=micErrorText(c)});
};
function importCards(raw){
  let data; try{ data=JSON.parse(raw); }catch(e){ return "הטקסט אינו JSON תקין."; }
  const list=(Array.isArray(data)?data:data.cards)||[];
  const ok=[];
  for(const c of list){
    if(!c||!c.id||!c.en) continue;
    const d = C.decks[c.d] ? c.d : "personal";
    if(!(c.he||c.q||c.bad)) continue;
    ok.push({id:"p:"+String(c.id).replace(/^p:/,""), d, he:c.he, q:c.q, bad:c.bad, en:c.en, alt:Array.isArray(c.alt)?c.alt:undefined, note:c.note});
  }
  if(!ok.length) return "לא נמצאו כרטיסים תקינים.";
  const map=new Map(((S.cards&&S.cards.list)||[]).map(c=>[c.id,c])); ok.forEach(c=>map.set(c.id,c));
  S.cards={updatedAt:new Date().toISOString(), list:[...map.values()]};
  enabled.add("personal"); prefs.decks=[...enabled]; savePrefs();
  persist(); buildSession(); renderAll();
  return "נוספו "+ok.length+" כרטיסים. סך הכל אישיים: "+S.cards.list.length+".";
}
$("#cardsImport").onclick=()=>{ $("#cardsMsg").textContent=importCards($("#cardsIn").value.trim()); };
$("#cardsFile").onchange=e=>{ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ $("#cardsMsg").textContent=importCards(String(r.result)); }; r.readAsText(f); };

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
if(location.hash.startsWith("#setup=")){
  try{
    const b=location.hash.slice(7).replace(/-/g,"+").replace(/_/g,"/");
    const o=JSON.parse(decodeURIComponent(escape(atob(b))));
    if(o.u&&o.s){ prefs.url=o.u; prefs.secret=o.s; savePrefs(); }
  }catch(e){}
  history.replaceState(null,"",location.pathname);
}
buildSession(); renderTopic(); renderAll();
showTab(store.get("tab","drill"));
pullState().then(ok=>{ if(ok){ buildSession(); renderAll(); } });
if("serviceWorker" in navigator && location.protocol==="https:") navigator.serviceWorker.register("sw.js").catch(()=>{});
})();
