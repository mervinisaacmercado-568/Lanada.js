// =============================  
// Lanada.js - Full Offline Lua Interpreter (Pure JS)  
// =============================  
const Lanada = (function() {  

  // =====================  
  // ENVIRONMENT / STD LIB  
  // =====================  
  function createEnv(outputCallback = console.log) {  
    const env = {};  

    // Print function  
    env.print = (...args) => outputCallback(args.join(' '));  

    // Math library  
    env.math = {  
      abs: Math.abs, acos: Math.acos, asin: Math.asin, atan: Math.atan,  
      ceil: Math.ceil, cos: Math.cos, exp: Math.exp, floor: Math.floor,  
      log: Math.log, max: Math.max, min: Math.min, pow: Math.pow,  
      random: (a,b)=>b!==undefined?Math.floor(Math.random()*(b-a+1))+a:Math.random(),  
      round: Math.round, sin: Math.sin, sqrt: Math.sqrt, tan: Math.tan,  
      pi: Math.PI, e: Math.E  
    };  

    // String library  
    env.string = {  
      byte: (s,i,j)=>s.charCodeAt(i-1),  
      char: (...codes)=>String.fromCharCode(...codes),  
      find: (s,p)=>s.indexOf(p)+1,  
      format: (...args)=>args.join(' '),  
      len: (s)=>s.length,  
      lower: (s)=>s.toLowerCase(),  
      upper: (s)=>s.toUpperCase(),  
      rep: (s,n)=>s.repeat(n),  
      sub: (s,i,j)=>s.substring(i-1,j),  
      reverse: (s)=>s.split('').reverse().join('')  
    };  

    // Table library  
    env.table = {  
      insert: (t,v,pos)=>{if(pos!==undefined) t.splice(pos-1,0,v); else t.push(v);},  
      remove: (t,pos)=>{if(pos!==undefined) return t.splice(pos-1,1)[0]; else return t.pop();},  
      concat: (t,sep)=>t.join(sep||","),  
      sort: (t,cmp)=>t.sort(cmp)  
    };  

    // OS library  
    env.os = {  
      time: ()=>Date.now()/1000,  
      date: ()=>new Date().toString()  
    };  

    // Standard Lua functions  
    env.assert = (v,msg)=>{if(!v) throw new Error(msg||"assertion failed"); return v},  
    env.error = (msg)=>{throw new Error(msg)},  
    env.select = (i,...args)=>i=="#" ? args.length : args[i-1],  
    env.unpack = (arr)=>[...arr],  
    env.pcall = (fn,...args)=>{try{return [true,fn(...args)]}catch(e){return [false,e]}},  
    env.xpcall = (fn,err)=>{try{return fn()}catch(e){return err(e)}},  

    // Coroutine (simplified)  
    env.coroutine = {  
      create: fn=>fn,  
      resume: co=>[true, co()],  
      yield: (...args)=>args  
    };  

    // Debug  
    env.debug = {  
      traceback: (msg)=>"Traceback: "+msg  
    };  

    return env;  
  }  

  // =====================  
  // PREPROCESS LUA  
  // =====================  
  function preprocessLua(code) {  
    // Remove Lua comments  
    code = code.replace(/--.*$/gm,"");  

    // Replace .. with +  
    code = code.replace(/\.\./g,'+');  

    // Replace Lua table calls with mapped functions (e.g., string.upper → string_upper)  
    code = code.replace(/(\bstring)\.(\w+)/g,'string_$2');  
    code = code.replace(/(\bmath)\.(\w+)/g,'math_$2');  
    code = code.replace(/(\btable)\.(\w+)/g,'table_$2');  
    code = code.replace(/(\bos)\.(\w+)/g,'os_$2');  

    // Replace Lua keywords  
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

        // Map env functions to global scope for Function constructor  
        const func = new Function(...Object.keys(env), jsCode);  
        func(...Object.values(env));  

      } catch(e) {  
        outputCallback("Error: "+e.message);  
      }  
    }  
  };  
})();  

// =====================  
// EXPORT FOR MODULE  
// =====================  
export default Lanada;
