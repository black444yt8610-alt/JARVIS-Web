const JarvisAgent = (() => {
  function normalize(s){return s.toLowerCase().trim()}
  function localAnswer(text){
    const q=normalize(text), now=new Date();
    if(/\b(time|clock)\b/.test(q)) return `The local time is ${now.toLocaleTimeString([], {hour:"numeric",minute:"2-digit",second:"2-digit"})}.`;
    if(/\b(date|today|day)\b/.test(q)) return `Today is ${now.toLocaleDateString([], {weekday:"long",year:"numeric",month:"long",day:"numeric"})}.`;
    if(/\b(help|what can you do|commands)\b/.test(q))
      return "I can handle local time and date, remember useful notes, recall memory, speak responses, and send a request to an optional AI backend.";
    if(/\b(what do you remember|recall|my memories)\b/.test(q)){
      const m=JarvisMemory.all();
      return m.length ? "I remember:\n" + m.slice(0,8).map((x,i)=>`${i+1}. ${x.text}`).join("\n") : "My local memory is empty.";
    }
    const remember=q.match(/^(remember|save|memorize)\s+(that\s+)?(.+)/i);
    if(remember){JarvisMemory.add(remember[3]); return "Saved that to local memory."}
    return null;
  }
  async function run(text, endpoint, sessionId){
    const local=localAnswer(text); if(local) return {text:local,source:"local"};
    if(endpoint){
      try{
        const action=/^(remember|save|memorize)\s+/i.test(text) ? "memory_add" : "chat";
        const r=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:text,session_id:sessionId,action})});
        const j=await r.json();
        if(!r.ok) throw new Error(j.error||`HTTP ${r.status}`);
        return {text:j.reply||j.text||j.message||"The backend returned no response.",source:j.source||"backend"};
      }catch(e){return {text:`I couldn't reach the JARVIS backend. ${e.message}`,source:"system"}}
    }
    return {text:"JARVIS AI backend is not configured yet. Add the Supabase Edge Function endpoint in Settings.",source:"system"};
  }
  return {run};
})();