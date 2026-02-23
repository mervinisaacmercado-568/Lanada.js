// Lanada.js – Robust Lua-like JS engine
const Lanada = (function() {

  // Create Lua-like environment
  function createEnv(outputCallback) {
    return {
      print: (...args) => { outputCallback(args.join(' ') + '\n'); },

      // Math library
      math: {
        abs: Math.abs, acos: Math.acos, asin: Math.asin, atan: Math.atan,
        ceil: Math.ceil, cos: Math.cos, exp: Math.exp, floor: Math.floor,
        log: Math.log, max: Math.max, min: Math.min, pow: Math.pow,
        random: (a,b)=>b!==undefined?Math.floor(Math.random()*(b-a+1))+a:Math.random(),
        round: Math.round, sin: Math.sin, sqrt: Math.sqrt,
        tan: Math.tan, pi: Math.PI, e: Math.E
      },

      // String library
      string: {
        byte: (s,i,j)=>s.charCodeAt(i-1),
        char: (...codes)=>String.fromCharCode(...codes),
        find: (s,p)=>s.indexOf(p)+1,
        format: (...args)=>args.join(' '),
        len: (s)=>s.length,
        lower: (s)=>s.toLowerCase(),
        upper: (s)=>s.toUpperCase(),
        rep: (s,n)=>s.repeat(n),
        sub: (s,i,j)=>s.substring(i-1,j)
      },

      // Table library
      table: {
        insert: (arr,val,pos)=>{if(pos!==undefined) arr.splice(pos-1,0,val); else arr.push(val)},
        remove: (arr,pos)=>{if(pos!==undefined) return arr.splice(pos-1,1)[0]; else return arr.pop()},
        sort: (arr,cmp)=>arr.sort(cmp),
        concat: (arr,sep)=>arr.join(sep||",")
      },

      // OS library
      os: {
        time: ()=>Date.now()/1000,
        date: ()=>new Date().toString()
      },

      // Standard Lua functions
      assert: (v,msg)=>{if(!v) throw new Error(msg||"assertion failed"); return v},
      error: (msg)=>{throw new Error(msg)},
      next: (obj,key)=>{const k=Object.keys(obj); const idx=key?k.indexOf(key)+1:0; return idx<k.length?k[idx]:undefined},
      rawget: (obj,key)=>obj[key],
      rawset: (obj,key,val)=>{obj[key]=val; return val},
      select: (i,...args)=>i=="#" ? args.length : args[i-1],
      unpack: (arr)=>[...arr],
      pcall: (fn,...args)=>{try{return true,fn(...args)}catch(e){return false,e}},
      xpcall: (fn,err)=>{try{return fn()}catch(e){return err(e)}},
      dofile: (f)=>outputCallback("Cannot load file in browser\n"),
      load: (s)=>new Function(s),
      loadstring: (s)=>new Function(s),

      // Coroutine library (simplified)
      coroutine: {
        create: (fn)=>fn,
        resume: (co)=>[true, co()],
        yield: (...args)=>args
      },

      // Debug library (simplified)
      debug: {
        traceback: (msg)=>"Traceback: "+msg
      }
    };
  }

  // Preprocess Lua code to JS safely
  function preprocessLua(code) {
    // 1. Remove comments safely
    code = code.replace(/--.*$/gm, '');

    // 2. Replace 'local' with 'var'
    code = code.replace(/\blocal\s+/g, 'var ');

    // 3. Replace loops and if/else
    code = code.replace(/for\s+(\w+)\s*=\s*(\d+)\s*,\s*(\d+)\s*do/g, 'for(let $1=$2;$1<=$3;$1++){');
    code = code.replace(/function\s+(\w+)\s*\((.*?)\)/g, 'function $1($2){');
    code = code.replace(/if\s+(.*?)\s*then/g, 'if($1){');
    code = code.replace(/else/g, '}else{');
    code = code.replace(/repeat/g, 'do{');
    code = code.replace(/until\s+(.*)/g, '}while(!($1))');
    code = code.replace(/\bend\b/g, '}');

    return code;
  }

  return {
    createEnv: createEnv,
    preprocessLua: preprocessLua,
    run: function(code, outputCallback = console.log) {
      const env = createEnv(outputCallback);
      try {
        const jsCode = preprocessLua(code);

        // Wrap with 'with(env)' so dot-access works
        const func = new Function('env', `
          with(env){
            ${jsCode}
          }
        `);
        func(env);

      } catch(err) {
        outputCallback('Error: ' + err.message);
      }
    }
  };
})();
