const JarvisMemory = (() => {
  const KEY = "jarvis_web_memory_v1";
  let data = load();
  function load(){ try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch{return[]}}
  function save(){localStorage.setItem(KEY,JSON.stringify(data))}
  function add(text){
    text = String(text).trim();
    if(!text) return;
    const item={id:crypto.randomUUID?.()||Date.now().toString(),text,createdAt:new Date().toISOString()};
    data.unshift(item); data=data.slice(0,100); save(); return item;
  }
  function all(){return [...data]}
  function clear(){data=[];save()}
  function search(q){
    const words=String(q).toLowerCase().split(/\s+/).filter(Boolean);
    return data.filter(x=>words.some(w=>x.text.toLowerCase().includes(w))).slice(0,8);
  }
  return {add,all,clear,search};
})();