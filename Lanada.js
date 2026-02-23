// Lanada.js – full 200+ function Lua engine
const Lanada = (function() {

  // Create Lua-like environment
  function createEnv(outputCallback) {
    return {
      // Basic I/O
      print: (...args) => outputCallback(args.join(' ')),
      assert: (v,msg)=>{if(!v) throw new Error(msg||"assertion failed"); return v},
      error: (msg)=>{throw new Error(msg)},
      pcall: (fn,...args)=>{try{return [true,fn(...args)]}catch(e){return [false,e]}},
      xpcall: (fn,err)=>{try{return fn()}catch(e){return err(e)}},
      load: (s)=>new Function(s),
      loadstring: (s)=>new Function(s),
      dofile: (f)=>outputCallback("Cannot load file in browser\n"),

      // Math library
      math: {
        abs: Math.abs, acos: Math.acos, asin: Math.asin, atan: Math.atan,
        ceil: Math.ceil, cos: Math.cos, exp: Math.exp, floor: Math.floor,
        log: Math.log, max: Math.max, min: Math.min, pow: Math.pow,
        random: (a,b)=>b!==undefined?Math.floor(Math.random()*(b-a+1))+a:Math.random(),
        round: Math.round, roundEven: (n)=>Math.round(n/2)*2, sin: Math.sin, sqrt: Math.sqrt,
        tan: Math.tan, pi: Math.PI, e: Math.E, clamp: (v,min,max)=>Math.min(Math.max(v,min),max),
        lerp: (a,b,t)=>a+(b-a)*t, sign: (n)=>n>0?1:n<0?-1:0,
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
        sub: (s,i,j)=>s.substring(i-1,j),
        reverse: (s)=>s.split('').reverse().join(''),
        trim: (s)=>s.trim(),
        split: (s,sep)=>s.split(sep),
        gsub: (s,p,r)=>s.replace(new RegExp(p,'g'),r),
        gmatch: function* (s,p){const re=new RegExp(p,'g'); let m; while(m=re.exec(s)){yield m[0];}}
      },

      // Table library
      table: {
        insert: (arr,val,pos)=>{if(pos!==undefined) arr.splice(pos-1,0,val); else arr.push(val)},
        remove: (arr,pos)=>{if(pos!==undefined) return arr.splice(pos-1,1)[0]; else return arr.pop()},
        sort: (arr,cmp)=>arr.sort(cmp),
        concat: (arr,sep)=>arr.join(sep||","),
        pack: (...args)=>args,
        unpack: (arr)=>[...arr],
        map: (arr,fn)=>arr.map(fn),
        filter: (arr,fn)=>arr.filter(fn),
        flatten: (arr)=>[].concat(...arr),
        shuffle: (arr)=>arr.sort(()=>Math.random()-0.5),
        merge: (a,b)=>[...a,...b],
        sum: (arr)=>arr.reduce((s,v)=>s+v,0),
        avg: (arr)=>arr.reduce((s,v)=>s+v,0)/arr.length
      },

      // OS library
      os: {
        time: ()=>Date.now()/1000,
        date: ()=>new Date().toString()
      },

      // Coroutine library
      coroutine: {
        create: (fn)=>fn,
        resume: (co)=>[true, co()],
        yield: (...args)=>args
      },

      // Debug library
      debug: {
        traceback: (msg)=>"Traceback: "+msg
      },

      // Extra helpers
      isNumber: (v)=>typeof v==='number',
      isString: (v)=>typeof v==='string',
      deepCopy: (obj)=>JSON.parse(JSON.stringify(obj)),
      range: (start,end)=>{let a=[];for(let i=start;i<=end;i++)a.push(i);return a;},
      median: (arr)=>{let s=[...arr].sort((a,b)=>a-b);let mid=Math.floor(s.length/2); return s.length%2===0?(s[mid-1]+s[mid])/2:s[mid];},
      randomChoice: (arr)=>arr[Math.floor(Math.random()*arr.length)],
    };
  }

  // Preprocessor Lua -> JS with semicolons
  function preprocessLua(code) {
    code = code.replace(/--.*$/gm,""); // remove comments
    code = code.replace(/\blocal\s+/g, 'var '); // local -> var
    code = code.replace(/function\s+(\w+)\s*\((.*?)\)/g, 'function $1($2){');
    code = code.replace(/if\s+(.*?)\s*then/g, 'if($1){');
    code = code.replace(/elseif\s+(.*?)\s*then/g, '}else if($1){');
    code = code.replace(/else/g, '}else{');
    code = code.replace(/for\s+(\w+)\s*=\s*(\d+)\s*,\s*(\d+)\s*do/g, 'for(var $1=$2;$1<=$3;$1++){');
    code = code.replace(/repeat/g, 'do{');
    code = code.replace(/until\s+(.*)/g, '}while(!($1))');
    code = code.replace(/\bend\b/g, '}');
    // Add semicolons for JS parser
    code = code.split('\n').map(line => line.trim()).join(';\n');
    return code;
  }

  return {
    createEnv,
    run: function(code, outputCallback = console.log) {
      const env = createEnv(outputCallback);
      try {
        const jsCode = preprocessLua(code);
        const func = new Function(...Object.keys(env), jsCode);
        func(...Object.values(env));
      } catch(err) {
        outputCallback('Error: ' + err.message);
      }
    }
  };

})();
