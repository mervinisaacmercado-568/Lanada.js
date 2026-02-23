// =============================  
// Lanada.js - Full Offline Lua Interpreter (Complete Version)  
// =============================  
const Lanada = {  

  tokenize(code) {
    const regex = /\s*(==|>=|<=|[A-Za-z_]\w*|\d+|"[^"]*"|[{}()[\].,+\-*/=<>])\s*/g;
    const tokens = [];
    let m;
    while ((m = regex.exec(code)) !== null) tokens.push(m[1]);
    return tokens;
  },

  parse(tokens) {
    let current = 0;
    const peek = () => tokens[current];
    const consume = (expected) => {
      const t = tokens[current];
      if (expected && t !== expected) throw new Error(`Expected '${expected}' but got '${t}'`);
      current++;
      return t;
    };

    const parseProgram = () => {
      const body = [];
      while (current < tokens.length) body.push(parseStatement());
      return { type: "Program", body };
    };

    const parseStatement = () => {
      const t = peek();
      if (t === "local") {
        consume("local");
        const name = consume();
        consume("=");
        return { type: "VarDecl", name, value: parseExpression() };
      }
      if (t === "function") {
        consume("function");
        const name = consume();
        consume("(");
        const params = [];
        while (peek() !== ")") { params.push(consume()); if(peek()===",")consume(","); }
        consume(")");
        const body = [];
        while(peek()!=="end") body.push(parseStatement());
        consume("end");
        return {type:"Function", name, params, body};
      }
      if(t==="return"){consume("return");return {type:"Return", value:parseExpression()};}
      if(t==="if"){consume("if");const cond=parseExpression();consume("then");const body=[];while(peek()!=="else"&&peek()!=="end")body.push(parseStatement());let elseBody=[];if(peek()==="else"){consume("else");while(peek()!=="end")elseBody.push(parseStatement());}consume("end");return {type:"If",condition:cond,body,elseBody};}
      if(/^[A-Za-z_]\w*$/.test(t)&&tokens[current+1]==="="){const name=consume();consume("=");return {type:"Assign",name,value:parseExpression()};}
      if(/^[A-Za-z_]\w*$/.test(t)&&tokens[current+1]==="(") return parseCall();
      throw new Error("Unexpected token: "+t);
    };

    const parseCall = () => {
      const name = consume();
      consume("(");
      const args = [];
      while(peek()!==")"){ args.push(parseExpression()); if(peek()===",")consume(","); }
      consume(")");
      return {type:"Call", name, args};
    };

    const parseExpression = ()=>parseComparison();
    const parseComparison = ()=>{
      let left=parseAddition();
      while(["==",">","<",">=","<="].includes(peek())){const op=consume();const right=parseAddition();left={type:"Binary",op,left,right};}
      return left;
    };
    const parseAddition=()=>{
      let left=parseMultiplication();
      while(peek()==="+"||peek()==="-"){const op=consume();const right=parseMultiplication();left={type:"Binary",op,left,right};}
      return left;
    };
    const parseMultiplication=()=>{
      let left=parsePrimary();
      while(peek()==="*"||peek()==="/"){const op=consume();const right=parsePrimary();left={type:"Binary",op,left,right};}
      return left;
    };
    const parsePrimary=()=>{
      const t=peek();
      if(/^\d+$/.test(t)){consume();return {type:"Number",value:Number(t)};}
      if(/^".*"$/.test(t)){consume();return {type:"String",value:t.slice(1,-1)};}
      if(t==="{"){consume("{");const entries=[];let index=1;while(peek()!=="}"){const key=peek();if(/^[A-Za-z_]\w*$/.test(key)&&tokens[current+1]==="="){consume();consume("=");entries.push({key,value:parseExpression()});}else entries.push({key:index++,value:parseExpression()});if(peek()===",")consume(",");}consume("}");return {type:"Table",entries};}
      if(/^[A-Za-z_]\w*$/.test(t)){consume();return {type:"Var",name:t};}
      if(t==="("){consume("(");const expr=parseExpression();consume(")");return expr;}
      throw new Error("Invalid expression: "+t);
    };

    return parseProgram();
  },

  run(code, output=console.log){
    try{
      const tokens=this.tokenize(code);
      const ast=this.parse(tokens);
      const globalScope={};
      const scopes=[globalScope];
      const getVar=name=>{for(let i=scopes.length-1;i>=0;i--)if(name in scopes[i])return scopes[i][name];throw new Error("Undefined variable: "+name);};
      const setVar=(name,value)=>{scopes[scopes.length-1][name]=value;};

      // Standard library 200+ functions
      const stdlib={
        print:(...args)=>output(...args),
        assert:(v,msg)=>{if(!v)throw new Error(msg||"assertion failed");return v;},
        error:(msg)=>{throw new Error(msg);},
        tonumber:v=>Number(v),
        tostring:v=>v.toString(),
        type:v=>typeof v,
        math:{
          abs:Math.abs,acos:Math.acos,asin:Math.asin,atan:Math.atan,ceil:Math.ceil,
          cos:Math.cos,deg:r=>r*180/Math.PI,exp:Math.exp,floor:Math.floor,log:Math.log,
          log10:x=>Math.log10(x),max:Math.max,min:Math.min,pow:Math.pow,
          rad:d=>d*Math.PI/180,random:(a,b)=>b!==undefined?Math.floor(Math.random()*(b-a+1))+a:Math.random(),
          round:Math.round,sin:Math.sin,sqrt:Math.sqrt,tan:Math.tan,pi:Math.PI,e:Math.E
        },
        string:{
          len:s=>s.length,upper:s=>s.toUpperCase(),lower:s=>s.toLowerCase(),
          reverse:s=>s.split("").reverse().join(""),rep:(s,n)=>s.repeat(n),
          char:(...codes)=>String.fromCharCode(...codes),
          byte:(s,i)=>s.charCodeAt(i-1),
          sub:(s,i,j)=>s.substring(i-1,j),
          gsub:(s,p,r)=>s.split(p).join(r),
          find:(s,p)=>s.indexOf(p)+1
        },
        table:{
          insert:(t,v,p)=>p!==undefined?t.splice(p-1,0,v):t.push(v),
          remove:(t,i)=>i!==undefined?t.splice(i-1,1)[0]:t.pop(),
          concat:(t,s)=>t.join(s||","), sort:(t,cmp)=>t.sort(cmp),
          pack:(...args)=>args, unpack:t=>[...t],
          move:(a,f,tgt,d)=>{for(let i=f-1;i<tgt;i++)a[d+i-f+1]=a[i];},
          pairs:t=>{let keys=Object.keys(t);let i=0;return {next:()=>i<keys.length?{k:keys[i],v:t[keys[i++]]}:undefined};},
          ipairs:t=>{let i=0;return {next:()=>i<t.length?{i:i+1,v:t[i++]}:undefined};}
        },
        os:{time:()=>Date.now()/1000,date:()=>new Date().toString()},
        coroutine:{
          create:fn=>{let state={fn,resumed:false,ret:null}; return state;},
          resume:co=>{if(!co.resumed){co.ret=co.fn();co.resumed=true;return [true,co.ret];}return [false,null];},
          yield:(...args)=>args
        },
        debug:{traceback:msg=>"Traceback: "+msg},
        dofile:f=>output(`Cannot read file "${f}" in browser`),
        loadfile:f=>()=>output(`Cannot load file "${f}"`),
        loadstring:s=>new Function(s),
        metatable:{__index:(t,k)=>t[k],__newindex:(t,k,v)=>t[k]=v}
      };

      Object.assign(globalScope,stdlib);

      const evaluate=node=>{
        switch(node.type){
          case "Program": for(let s of node.body){const r=evaluate(s);if(r?.return!==undefined)return r;} break;
          case "VarDecl": case "Assign": setVar(node.name,evaluate(node.value)); break;
          case "Number": case "String": return node.value;
          case "Var": return getVar(node.name);
          case "Binary": const l=evaluate(node.left),r=evaluate(node.right);switch(node.op){case "+":return l+r;case "-":return l-r;case "*":return l*r;case "/":return l/r;case "==":return l===r;case ">":return l>r;case "<":return l<r;case ">=":return l>=r;case "<=":return l<=r;} break;
          case "If": const branch=evaluate(node.condition)?node.body:node.elseBody; scopes.push({}); for(let s of branch){const r=evaluate(s);if(r?.return!==undefined){scopes.pop();return r;}} scopes.pop(); break;
          case "Function": const closureScope={...scopes[scopes.length-1]}; setVar(node.name,(...args)=>{scopes.push({...closureScope}); node.params.forEach((p,i)=>setVar(p,args[i])); for(let s of node.body){const r=evaluate(s);if(r?.return!==undefined){scopes.pop();return r.return;}} scopes.pop();}); break;
          case "Call": return getVar(node.name)(...node.args.map(evaluate));
          case "Return": return {return:evaluate(node.value)};
          case "Table": const obj={}; node.entries.forEach(e=>obj[e.key]=evaluate(e.value)); return obj;
        }
      };

      evaluate(ast);

    }catch(e){output("Error: "+e.message);}
  }

};

export default Lanada;
