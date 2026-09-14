const $=id=>document.getElementById(id);
const messages=$("messages"), input=$("input"), form=$("form"), mic=$("mic");
let recognition=null, listening=false;
const sessionKey="jarvis_session_v1";
const sessionId=localStorage.getItem(sessionKey)||crypto.randomUUID();
localStorage.setItem(sessionKey,sessionId);
const settingsKey="jarvis_web_settings_v1";
let settings=Object.assign({endpoint:"",autoSpeak:true,saveUser:true},JSON.parse(localStorage.getItem(settingsKey)||"{}"));

function addMessage(text,who="ai"){
  const el=document.createElement("div"); el.className=`msg ${who}`;
  el.innerHTML=`<span class="tag">${who==="user"?"YOU":"JARVIS"}</span>${escapeHtml(text)}`;
  messages.appendChild(el); messages.scrollTop=messages.scrollHeight;
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function speak(text){
  if(!settings.autoSpeak || !("speechSynthesis" in window)) return;
  speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.rate=.98; u.pitch=1; speechSynthesis.speak(u);
}
async function ask(text){
  text=String(text).trim(); if(!text)return;
  addMessage(text,"user"); input.value=""; $("statusText").textContent="THINKING"; $("statusDot").style.background="#f4c96b";
  const result=await JarvisAgent.run(text,settings.endpoint,sessionId);
  addMessage(result.text,"ai"); speak(result.text);
  if(settings.saveUser && /^(remember|save|memorize)\b/i.test(text)) updateMemoryUI();
  $("statusText").textContent="READY"; $("statusDot").style.background="";
}
form.addEventListener("submit",e=>{e.preventDefault();ask(input.value)});
document.querySelectorAll("[data-command]").forEach(b=>b.onclick=()=>ask(b.dataset.command));
$("clearChat").onclick=()=>{messages.innerHTML=""; addMessage("Conversation cleared. Local memory was not deleted.","ai")};
function updateMemoryUI(){
  const m=JarvisMemory.all(); $("memoryCount").textContent=m.length;
  $("memoryPreview").textContent=m.length?m.slice(0,3).map(x=>"• "+x.text).join("\n"):"No memories stored.";
}
$("memorySettings").onclick=()=>{$("endpoint").value=settings.endpoint;$("autoSpeak").checked=settings.autoSpeak;$("saveUser").checked=settings.saveUser;$("settings").showModal()};
$("closeSettings").onclick=()=>$("settings").close();
$("saveSettings").onclick=()=>{settings={endpoint:$("endpoint").value.trim(),autoSpeak:$("autoSpeak").checked,saveUser:$("saveUser").checked};localStorage.setItem(settingsKey,JSON.stringify(settings));$("settings").close();addMessage("Settings saved locally.","ai")};
$("wipeMemory").onclick=()=>{if(confirm("Delete all local JARVIS memories?")){JarvisMemory.clear();updateMemoryUI();addMessage("Local memory wiped.","ai")}};

if("SpeechRecognition" in window || "webkitSpeechRecognition" in window){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  recognition=new SR(); recognition.lang=navigator.language||"en-US"; recognition.interimResults=false; recognition.continuous=false;
  recognition.onstart=()=>{listening=true;mic.classList.add("listening");$("micText").textContent="LISTENING...";$("statusText").textContent="LISTENING"};
  recognition.onresult=e=>{const t=e.results[0][0].transcript; input.value=t; ask(t)};
  recognition.onerror=e=>{addMessage("Voice input error: "+e.error,"ai")};
  recognition.onend=()=>{listening=false;mic.classList.remove("listening");$("micText").textContent="START VOICE";$("statusText").textContent="READY"};
  mic.onclick=()=>listening?recognition.stop():recognition.start();
}else{mic.disabled=true;$("micText").textContent="VOICE NOT SUPPORTED"}

$("greeting").textContent=`Good to see you${new Date().getHours()<12?"":"."}`;
updateMemoryUI();
addMessage("JARVIS online. Say “remember …” to store a local memory, or ask for the time/date.","ai");