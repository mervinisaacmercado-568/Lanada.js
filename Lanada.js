const Lanada = {

  // ======================
  // TOKENIZER
  // ======================
  tokenize(code) {
    const tokens = [];
    const regex = /\s*(=>|==|<=|>=|[A-Za-z_]\w*|\d+|"[^"]*"|[+\-*/=(),.]|\S)\s*/g;
    let match;
    while ((match = regex.exec(code)) !== null) {
      tokens.push(match[1]);
    }
    return tokens;
  },

  // ======================
  // PARSER
  // ======================
  parse(tokens) {
    let current = 0;

    const peek = () => tokens[current];
    const consume = (expected) => {
      const token = tokens[current];
      if (expected && token !== expected) {
        throw new Error(`Expected '${expected}' but got '${token}'`);
      }
      current++;
      return token;
    };

    function parseProgram() {
      const body = [];
      while (current < tokens.length) {
        body.push(parseStatement());
      }
      return { type: "Program", body };
    }

    function parseStatement() {
      const token = peek();

      if (token === "local") {
        consume("local");
        const name = consume();
        consume("=");
        const value = parseExpression();
        return { type: "VarDecl", name, value };
      }

      if (token === "print") {
        consume("print");
        consume("(");
        const args = [];
        while (peek() !== ")") {
          args.push(parseExpression());
          if (peek() === ",") consume(",");
        }
        consume(")");
        return { type: "Print", args };
      }

      if (token === "if") {
        consume("if");
        const condition = parseExpression();
        consume("then");

        const body = [];
        while (peek() !== "end" && peek() !== "else") {
          body.push(parseStatement());
        }

        let elseBody = [];
        if (peek() === "else") {
          consume("else");
          while (peek() !== "end") {
            elseBody.push(parseStatement());
          }
        }

        consume("end");

        return { type: "If", condition, body, elseBody };
      }

      if (token === "for") {
        consume("for");
        const varName = consume();
        consume("=");
        const start = parseExpression();
        consume(",");
        const end = parseExpression();
        consume("do");

        const body = [];
        while (peek() !== "end") {
          body.push(parseStatement());
        }
        consume("end");

        return { type: "For", varName, start, end, body };
      }

      if (token === "function") {
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
        while (peek() !== "end") {
          body.push(parseStatement());
        }
        consume("end");

        return { type: "Function", name, params, body };
      }

      if (/^[A-Za-z_]\w*$/.test(token) && tokens[current + 1] === "=") {
        const name = consume();
        consume("=");
        const value = parseExpression();
        return { type: "Assign", name, value };
      }

      throw new Error("Unexpected token: " + token);
    }

    function parseExpression() {
      return parseAddition();
    }

    function parseAddition() {
      let left = parseMultiplication();
      while (peek() === "+" || peek() === "-") {
        const operator = consume();
        const right = parseMultiplication();
        left = { type: "Binary", operator, left, right };
      }
      return left;
    }

    function parseMultiplication() {
      let left = parsePrimary();
      while (peek() === "*" || peek() === "/") {
        const operator = consume();
        const right = parsePrimary();
        left = { type: "Binary", operator, left, right };
      }
      return left;
    }

    function parsePrimary() {
      const token = peek();

      if (/^\d+$/.test(token)) {
        consume();
        return { type: "Number", value: token };
      }

      if (/^".*"$/.test(token)) {
        consume();
        return { type: "String", value: token };
      }

      if (token === "string") {
        consume("string");
        consume(".");
        consume("reverse");
        consume("(");
        const value = parseExpression();
        consume(")");
        return { type: "Reverse", value };
      }

      if (/^[A-Za-z_]\w*$/.test(token)) {
        consume();
        return { type: "Variable", name: token };
      }

      if (token === "(") {
        consume("(");
        const expr = parseExpression();
        consume(")");
        return expr;
      }

      throw new Error("Invalid expression: " + token);
    }

    return parseProgram();
  },

  // ======================
  // COMPILER
  // ======================
  compile(node) {
    switch (node.type) {

      case "Program":
        return node.body.map(n => this.compile(n)).join("\n");

      case "VarDecl":
        return `let ${node.name} = ${this.compile(node.value)};`;

      case "Assign":
        return `${node.name} = ${this.compile(node.value)};`;

      case "Print":
        return `print(${node.args.map(a => this.compile(a)).join(", ")});`;

      case "Binary":
        return `(${this.compile(node.left)} ${node.operator} ${this.compile(node.right)})`;

      case "If":
        return `
if (${this.compile(node.condition)}) {
${node.body.map(b => this.compile(b)).join("\n")}
}
${node.elseBody.length ? `
else {
${node.elseBody.map(b => this.compile(b)).join("\n")}
}` : ""}
`;

      case "For":
        return `
for (let ${node.varName} = ${this.compile(node.start)};
     ${node.varName} <= ${this.compile(node.end)};
     ${node.varName}++) {
${node.body.map(b => this.compile(b)).join("\n")}
}
`;

      case "Function":
        return `
function ${node.name}(${node.params.join(", ")}) {
${node.body.map(b => this.compile(b)).join("\n")}
}
`;

      case "Number":
        return node.value;

      case "String":
        return node.value;

      case "Variable":
        return node.name;

      case "Reverse":
        return `${this.compile(node.value)}.split('').reverse().join('')`;

      default:
        throw new Error("Unknown node type: " + node.type);
    }
  },

  // ======================
  // RUNNER (SANDBOXED)
  // ======================
  run(code, output = console.log) {
    try {
      const tokens = this.tokenize(code);
      const ast = this.parse(tokens);
      const js = this.compile(ast);

      const sandbox = {
        print: (...args) => output(...args)
      };

      const fn = new Function(...Object.keys(sandbox), `"use strict";\n${js}`);
      fn(...Object.values(sandbox));

    } catch (err) {
      output("Error: " + err.message);
    }
  }
};

export default Lanada;
