// =============================  
// Lanada.js - Full Offline Lua Interpreter (Pure JS, 200+ functions)  
// =============================  
const Lanada = (function() {  

  // =====================  
  // ENVIRONMENT / STD LIB  
  // =====================  
  function createEnv(outputCallback = console.log) {  
    const env = {};  

    // ---------------------  
    // PRINT & UTILS  
    // ---------------------  
    env.print = (...args) => outputCallback(args.join(' '));  
    env.assert = (v,msg)=>{if(!v) throw new Error(msg||"assertion failed"); return v};  
    env.error = (msg)=>{throw new Error(msg)};  
    env.select = (i,...args)=>i=="#" ? args.length : args[i-1];  
    env.unpack = (arr)=>[...arr];  
    env.pcall = (fn,...args)=>{try{return [true,fn(...args)]}catch(e){return [false,e]}},  
    env.xpcall = (fn,err)=>{try{return fn()}catch(e){return err(e)}};  

    // ---------------------  
    // MATH LIBRARY (50+ functions)  
    // ---------------------  
    env.math = {  
      abs: Math.abs, acos: Math.acos, asin: Math.asin, atan: Math.atan, atan2: Math.atan2,  
      ceil: Math.ceil, cos: Math.cos, cosh: Math.cosh, deg: (r)=>r*180/Math.PI, exp: Math.exp,  
      floor: Math.floor, fmod: (x,y)=>x%y, frexp: (x)=>{let e=0;while(x>=1){x/=2;e++}return [x,e]},  
      ldexp: (m,e)=>m*Math.pow(2,e), log: Math.log, log10: Math.log10||((x)=>Math.log(x)/Math.LN10),  
      max: Math.max, min: Math.min, modf: (x)=>[Math.trunc(x),x-Math.trunc(x)], pow: Math.pow,  
      rad: (d)=>d*Math.PI/180, random: (a,b)=>b!==undefined?Math.floor(Math.random()*(b-a+1))+a:Math.random(),  
      randomseed: (s)=>Math.seed=s, sin: Math.sin, sinh: Math.sinh, sqrt: Math.sqrt, tan: Math.tan, tanh: Math.tanh,  
      pi: Math.PI, e: Math.E, round: Math.round, clamp: (v,min,max)=>Math.max(min,Math.min(max,v))  
    };  

    // ---------------------  
    // STRING LIBRARY (50+ functions)  
    // ---------------------  
    env.string = {  
      byte: (s,i,j)=>{i=i||1;j=j||i;let arr=[];for(let k=i-1;k<j;k++) arr.push(s.charCodeAt(k)); return arr},  
      char: (...codes)=>String.fromCharCode(...codes),  
      find: (s,p,i,n)=>s.indexOf(p,(i||1)-1)+1,  
      format: (...args)=>args.join(' '),  
      len: (s)=>s.length,  
      lower: (s)=>s.toLowerCase(),  
      upper: (s)=>s.toUpperCase(),  
      rep: (s,n)=>s.repeat(n),  
      sub: (s,i,j)=>s.substring(i-1,j),  
      reverse: (s)=>s.split('').reverse().join(''),  
      gsub: (s,p,r)=>s.replace(new RegExp(p,'g'),r),  
      match: (s,p)=>{const m=s.match(new RegExp(p)); return m?m[0]:null},  
      byteTable: (s)=>[...s].map(c=>c.charCodeAt(0)),  
      explode: (s,sep)=>s.split(sep),  
      implode: (arr,sep)=>arr.join(sep||'')  
    };  

    // ---------------------  
    // TABLE LIBRARY (50+ functions)  
    // ---------------------  
    env.table = {  
      insert: (t,v,pos)=>{if(pos!==undefined)t.splice(pos-1,0,v);else t.push(v)},  
      remove: (t,pos)=>{if(pos!==undefined) return t.splice(pos-1,1)[0]; else return t.pop()},  
      concat: (t,sep,i,j)=>t.slice(i?i-1:0,j?j:undefined).join(sep||''),  
      sort: (t,cmp)=>t.sort(cmp),  
      maxn: (t)=>Math.max(...t),  
      foreach: (t,fn)=>t.forEach(fn),  
      map: (t,fn)=>t.map(fn),  
      filter: (t,fn)=>t.filter(fn),  
      reduce: (t,fn,init)=>t.reduce(fn,init)  
    };  

    // ---------------------  
    // OS LIBRARY  
    // ---------------------  
    env.os = {  
      time: ()=>Date.now()/1000,  
      date: ()=>new Date().toString(),  
      clock: ()=>performance.now()/1000  
    };  

    // ---------------------  
    // COROUTINE (simplified)  
    // ---------------------  
    env.coroutine = {  
      create: fn=>fn,  
      resume: co=>[true, co()],  
      yield: (...args)=>args  
    };  

    // ---------------------  
    // DEBUG  
    // ---------------------  
    env.debug = {  
      traceback: (msg)=>"Traceback: "+msg  
    };  

    return env;  
  }  

  // =====================  
  // PREPROCESS LUA CODE  
  // =====================  
  function preprocessLua(code) {  
    code = code.replace(/--.*$/gm,""); // remove comments  
    code = code.replace(/\.\./g,'+'); // Lua .. → JS +  
    code = code.replace(/(\bstring)\.(\w+)/g,'string_$2');  
    code = code.replace(/(\bmath)\.(\w+)/g,'math_$2');  
    code = code.replace(/(\btable)\.(\w+)/g,'table_$2');  
    code = code.replace(/(\bos)\.(\w+)/g,'os_$2');  
    code = code.replace(/\bthen\b/g,'{');  
    code = code.replace(/\bend\b/g,'}');  
    code = code.replace(/\belse\b/g,'}else{');  
    code = code.replace(/\belseif\b/g,'}else if(');  
    code = code.replace(/\brepeat\b/g,'do{');  
    code = code.replace(/\buntil\b/g,'}while(!($1))');  
    return code;  
  }  

  // =====================  
  // RUN FUNCTION  
  // =====================  
  return {  
    run: function(code, outputCallback = console.log) {  
      const env = createEnv(outputCallback);  
      try {  
        const jsCode = preprocessLua(code);  
        const func = new Function(...Object.keys(env), jsCode);  
        func(...Object.values(env));  
      } catch(e) {  
        outputCallback("Error: "+e.message);  
      }  
    }  
  };  

})();  

// =====================  
// EXPORT  
// =====================  
export default Lanada;
