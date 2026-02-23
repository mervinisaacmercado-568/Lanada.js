// =============================  
// Lanada.js - Full Offline Lua Interpreter  
// =============================  

const Lanada = (function() {

  // =====================
  // TOKENIZER
  // =====================
  function tokenize(code) {
    // Remove Lua comments
    code = code.replace(/--.*$/gm, "");

    // Match tokens: identifiers, numbers, strings, operators, punctuation
    const regex = /\s*(==|>=|<=|\.\.|[A-Za-z_]\w*|\d+(\.\d+)?|"[^"]*"|[{}()[\].,+\-*/=<>])\s*/g;
    const tokens = [];
    let m;
    while ((m = regex.exec(code)) !== null) {
      tokens.push(m[1]);
    }
    return tokens;
  }

  // =====================
  // PARSER
  // =====================
  function parse(tokens) {
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
        while (peek() !== ")") {
          params.push(consume());
          if (peek() === ",") consume(",");
        }
        consume(")");
        const body = [];
        while (peek() !== "end") body.push(parseStatement());
        consume("end");
        return { type: "Function", name, params, body };
      }

      if (t === "return") {
        consume("return");
        return { type: "Return", value: parseExpression() };
      }

      if (t === "if") {
        consume("if");
        const condition = parseExpression();
        consume("then");
        const body = [];
        while (peek() !== "else" && peek() !== "end") body.push(parseStatement());
        let elseBody = [];
        if (peek() === "else") {
          consume("else");
          while (peek() !== "end") elseBody.push(parseStatement());
        }
        consume("end");
        return { type: "If", condition, body, elseBody };
      }

      if (/^[A-Za-z_]\w*$/.test(t) && tokens[current + 1] === "=") {
        const name = consume();
        consume("=");
        return { type: "Assign", name, value: parseExpression() };
      }

      if (/^[A-Za-z_]\w*$/.test(t) && tokens[current + 1] === "(") return parseCall();

      throw new Error("Unexpected token: " + t);
    };

    const parseCall = () => {
      const name = consume();
      consume("(");
      const args = [];
      while (peek() !== ")") {
        args.push(parseExpression());
        if (peek() === ",") consume(",");
      }
      consume(")");
      return { type: "Call", name, args };
    };

    const parseExpression = () => parseComparison();

    const parseComparison = () => {
      let left = parseAddition();
      while (["==", ">", "<", ">=", "<=", ".."].includes(peek())) {
        const op = consume();
        const right = parseAddition();
        left = { type: "Binary", op, left, right };
      }
      return left;
    };

    const parseAddition = () => {
      let left = parseMultiplication();
      while (peek() === "+" || peek() === "-") {
        const op = consume();
        const right = parseMultiplication();
        left = { type: "Binary", op, left, right };
      }
      return left;
    };

    const parseMultiplication = () => {
      let left = parsePrimary();
      while (peek() === "*" || peek() === "/") {
        const op = consume();
        const right = parsePrimary();
        left = { type: "Binary", op, left, right };
      }
      return left;
    };

    const parsePrimary = () => {
      const t = peek();

      if (/^\d+(\.\d+)?$/.test(t)) {
        consume();
        return { type: "Number", value: Number(t) };
      }

      if (/^".*"$/.test(t)) {
        consume();
        return { type: "String", value: t.slice(1, -1) };
      }

      if (t === "{") {
        consume("{");
        const entries = [];
        let index = 1;
        while (peek() !== "}") {
          const key = peek();
          if (/^[A-Za-z_]\w*$/.test(key) && tokens[current + 1] === "=") {
            consume();
            consume("=");
            entries.push({ key, value: parseExpression() });
          } else {
            entries.push({ key: index++, value: parseExpression() });
          }
          if (peek() === ",") consume(",");
        }
        consume("}");
        return { type: "Table", entries };
      }

      if (/^[A-Za-z_]\w*$/.test(t)) {
        consume();
        return { type: "Var", name: t };
      }

      if (t === "(") {
        consume("(");
        const expr = parseExpression();
        consume(")");
        return expr;
      }

      throw new Error("Invalid expression: " + t);
    };

    return parseProgram();
  }

  // =====================
  // INTERPRETER
  // =====================
  function run(code, output = console.log) {
    try {
      const tokens = tokenize(code);
      const ast = parse(tokens);

      const globalScope = {};
      const scopes = [globalScope];

      const getVar = name => {
        for (let i = scopes.length - 1; i >= 0; i--)
          if (name in scopes[i]) return scopes[i][name];
        throw new Error("Undefined variable: " + name);
      };

      const setVar = (name, value) => {
        scopes[scopes.length - 1][name] = value;
      };

      const stdlib = {
        print: (...args) => output(args.join(" ")),
        math: {
          abs: Math.abs,
          floor: Math.floor,
          ceil: Math.ceil,
          max: Math.max,
          min: Math.min,
          pow: Math.pow,
          sqrt: Math.sqrt,
          random: (a,b)=>b!==undefined?Math.floor(Math.random()*(b-a+1))+a:Math.random()
        },
        string: {
          reverse: s => s.split("").reverse().join(""),
          upper: s => s.toUpperCase(),
          lower: s => s.toLowerCase(),
          len: s => s.length
        },
        table: {
          insert: (t, v) => t.push(v),
          remove: (t, i) => t.splice(i-1, 1),
          concat: (t, sep) => t.join(sep||",")
        }
      };

      Object.assign(globalScope, stdlib);

      const evaluate = node => {
        switch(node.type) {

          case "Program":
            for (let s of node.body) {
              const r = evaluate(s);
              if (r?.return !== undefined) return r;
            }
            break;

          case "VarDecl":
          case "Assign":
            setVar(node.name, evaluate(node.value));
            break;

          case "Number":
          case "String":
            return node.value;

          case "Var":
            return getVar(node.name);

          case "Binary":
            const l = evaluate(node.left);
            const r = evaluate(node.right);
            switch(node.op) {
              case "+": return l + r;
              case "-": return l - r;
              case "*": return l * r;
              case "/": return l / r;
              case "^": return Math.pow(l, r);
              case "==": return l === r;
              case ">": return l > r;
              case "<": return l < r;
              case ">=": return l >= r;
              case "<=": return l <= r;
              case "..": return String(l) + String(r); // concatenation
            }
            break;

          case "If":
            const branch = evaluate(node.condition) ? node.body : node.elseBody;
            scopes.push({});
            for (let s of branch) {
              const r = evaluate(s);
              if (r?.return !== undefined) { scopes.pop(); return r; }
            }
            scopes.pop();
            break;

          case "Function":
            const closureScope = { ...scopes[scopes.length-1] };
            setVar(node.name, (...args) => {
              scopes.push({ ...closureScope });
              node.params.forEach((p,i)=>setVar(p,args[i]));
              for (let s of node.body) {
                const r = evaluate(s);
                if (r?.return !== undefined) { scopes.pop(); return r.return; }
              }
              scopes.pop();
            });
            break;

          case "Call":
            const fn = getVar(node.name);
            return fn(...node.args.map(evaluate));

          case "Return":
            return { return: evaluate(node.value) };

          case "Table":
            const obj = {};
            node.entries.forEach(e => { obj[e.key] = evaluate(e.value); });
            return obj;
        }
      };

      evaluate(ast);

    } catch(e) {
      output("Error: " + e.message);
    }
  }

  return { run };

})();

// Export for module usage
export default Lanada;
