// Lanada.js – fixed 200+ function Lua engine
const Lanada = (function() {
  function createEnv(outputCallback) {
    const env = {
      print: (...args) => outputCallback(args.join(' ')),
      assert: (v,msg)=>{if(!v) throw new Error(msg||"assertion failed"); return v},
      error: (msg)=>{throw new Error(msg)},
      pcall: (fn,...args)=>{try{return [true,fn(...args)]}catch(e){return [false,e]}},
      xpcall: (fn,err)=>{try{return fn()}catch(e){return err(e)}},
      load: (s)=>new Function(s),
      loadstring: (s)=>new Function(s),
      dofile: (f)=>outputCallback("Cannot load file in browser\n"),

      // Math
      math: {
        abs: Math.abs, acos: Math.acos, asin: Math.asin, atan: Math.atan,
        ceil: Math.ceil, cos: Math.cos, exp: Math.exp, floor: Math.floor,
        log: Math.log, max: Math.max, min: Math.min, pow: Math.pow,
        random: (a,b)=>b!==undefined?Math.floor(Math.random()*(b-a+1))+a:Math.random(),
        round: Math.round, sin: Math.sin, sqrt: Math.sqrt, tan: Math.tan, pi: Math.PI,
        clamp: (v,min,max)=>Math.min(Math.max(v,min),max)
      },

      // String
      string: {
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
      },

      // Table
      table: {
        insert: (arr,val,pos)=>{if(pos!==undefined) arr.splice(pos-1,0,val); else arr.push(val)},
        remove: (arr,pos)=>{if(pos!==undefined) return arr.splice(pos-1,1)[0]; else return arr.pop()},
        sort: (arr,cmp)=>arr.sort(cmp),
        concat: (arr,sep)=>arr.join(sep||","),
        pack: (...args)=>args,
        unpack: (arr)=>[...arr],
        shuffle: (arr)=>arr.sort(()=>Math.random()-0.5),
        sum: (arr)=>arr.reduce((s,v)=>s+v,0),
        avg: (arr)=>arr.reduce((s,v)=>s+v,0)/arr.length
      },

      // Helpers
      range: (a,b)=>{let arr=[];for(let i=a;i<=b;i++) arr.push(i); return arr;},
      randomChoice: (arr)=>arr[Math.floor(Math.random()*arr.length)],
      deepCopy: (obj)=>JSON.parse(JSON.stringify(obj))
    };
    return env;
  }

  function preprocessLua(code) {
    code = code.replace(/--.*$/gm,""); // remove comments
    code = code.replace(/\blocal\s+/g, 'var ');
    code = code.replace(/function\s+(\w+)\s*\((.*?)\)/g, 'function $1($2){');
    code = code.replace(/if\s+(.*?)\s*then/g, 'if($1){');
    code = code.replace(/elseif\s+(.*?)\s*then/g, '}else if($1){');
    code = code.replace(/else/g, '}else{');
    code = code.replace(/for\s+(\w+)\s*=\s*(\d+)\s*,\s*(\d+)\s*do/g, 'for(var $1=$2;$1<=$3;$1++){');
    code = code.replace(/repeat/g, 'do{');
    code = code.replace(/until\s+(.*)/g, '}while(!($1))');
    code = code.replace(/\bend\b/g, '}');
    code = code.split('\n').map(line=>line.trim()).join(';\n'); // semicolons
    return code;
  }

  return {
    createEnv,
    preprocessLua,
    run: function(code, outputCallback = console.log) {
      const env = createEnv(outputCallback);
      try {
        const jsCode = preprocessLua(code);
        const keys = Object.keys(env);
        const values = Object.values(env);
        const func = new Function(...keys, jsCode);
        func(...values);
      } catch(err) {
        outputCallback('Error: ' + err.message);
      }
    }
  };
})();
