import { parse } from "@babel/parser";
import type { Node } from "@babel/types";

// 我们的指令集定义
const opCodes = [
  // --- 内存与堆 ---
  "LOAD_H",   // 从堆加载常量: LOAD_H <heap_addr>
  "LOAD_M",   // 从内存加载变量: LOAD_M <mem_addr>
  "STORE_M",  // 保存数据到内存: STORE_M <mem_addr>

  // --- 运算 ---
  "ADD",      // 加法
  "SUB",      // 减法
  "MUL",      // 乘法
  "DIV",      // 除法

  // --- 控制流 ---
  "JMP",      // 无条件跳转: JMP <bytecode_addr>
  "JMP_IF_F", // 如果栈顶为假则跳转: JMP_IF_F <bytecode_addr>

  // --- 函数 ---
  "CALL",     // 调用函数: CALL <arg_count>
  "RET",      // 返回

  // --- BinaryExpression ---
  "BINARY_FEQ", // 全等于（===）
  "BINARY_EQ",  // 相等（==）
  "BINARY_NE",  // 不相等
  "BINARY_LT",  // 小于
  "BINARY_GT",  // 大于
  "BINARY_LE",  // 小于等于
  "BINARY_GE",  // 大于等于

  // --- 特殊 ---
  "NOP",      // 空操作
  "MEMBER",   // 构建MemberExpression
];

interface VMPCodeBlock {
  opCode: number;
  arg: number;
}

interface BuildContext {
  remapped_opCodes: string[];
  heap: any[];
  memoryMap: Map<string, number>;
  bytecode: VMPCodeBlock[];
}

const getOpCode = (name: string, ctx: BuildContext): number => {
  const index = ctx.remapped_opCodes.indexOf(name);
  if (index === -1) throw new Error(`OpCode ${name} not found!`);
  return index;
};

const buildFromNode = (node: Node, ctx: BuildContext) => {
  switch (node.type) {
    case "NumericLiteral": {
      const addr = ctx.heap.length;
      ctx.heap.push(node.value);
      ctx.bytecode.push({ opCode: getOpCode("LOAD_H", ctx), arg: addr });
      break;
    }

    case "BlockStatement": {
      for (const statement of node.body) {
        buildFromNode(statement, ctx);
      }
      break;
    }

    case "Identifier": {
      const memAddr = ctx.memoryMap.get(node.name);
      if (memAddr === undefined) {
        let heapAddr = ctx.heap.indexOf(node.name);
        if (heapAddr === -1) {
          heapAddr = ctx.heap.length;
          ctx.heap.push(node.name);
        }

        ctx.bytecode.push({ opCode: getOpCode("LOAD_H", ctx), arg: heapAddr });
        return;
      }

      ctx.bytecode.push({ opCode: getOpCode("LOAD_M", ctx), arg: memAddr });
      break;
    }

    case "BinaryExpression": {
      buildFromNode(node.right, ctx);
      buildFromNode(node.left, ctx);
      let opName: string;
      switch (node.operator) {
        case '+': opName = "ADD"; break;
        case '-': opName = "SUB"; break;
        case '*': opName = "MUL"; break;
        case '/': opName = "DIV"; break;

        case '===': opName = "BINARY_FEQ"; break;
        case '==': opName = "BINARY_EQ"; break;
        case '!=': opName = "BINARY_NE"; break;
        case '<': opName = "BINARY_LT"; break;
        case '>': opName = "BINARY_GT"; break;
        case '<=': opName = "BINARY_LE"; break;
        case '>=': opName = "BINARY_GE"; break;
        default: throw new Error(`Unsupported binary operator: ${node.operator}`);
      }
      ctx.bytecode.push({ opCode: getOpCode(opName, ctx), arg: -1 });
      break;
    }

    case "VariableDeclaration": {
      for (const declaration of node.declarations) {
        if (!declaration.init || declaration.id.type !== 'Identifier') continue;

        buildFromNode(declaration.init, ctx);

        const varName = declaration.id.name;
        if (ctx.memoryMap.has(varName)) {
          throw new Error(`Variable "${varName}" has already been declared.`);
        }
        const memAddr = ctx.memoryMap.size;
        ctx.memoryMap.set(varName, memAddr);

        // 3. 生成 STORE 指令，将栈顶的值存入新分配的内存地址
        ctx.bytecode.push({ opCode: getOpCode("STORE_M", ctx), arg: memAddr });
      }
      break;
    }

    case "ExpressionStatement": {
      buildFromNode(node.expression, ctx);
      break;
    }

    case "IfStatement": {
      const test = node.test;
      buildFromNode(test, ctx);

      const elseAddr = ctx.bytecode.length;
      ctx.bytecode.push({ opCode: getOpCode("JMP_IF_F", ctx), arg: -1 });

      buildFromNode(node.consequent, ctx);

      if (node.alternate) {
        const endAddr = ctx.bytecode.length;
        ctx.bytecode[elseAddr].arg = endAddr; // 修改跳转地址为 else 的起始地址
      }
      break;
    }

    case "CallExpression": {
      for (const arg of node.arguments.reverse()) {
        buildFromNode(arg, ctx);
      }

      buildFromNode(node.callee, ctx);

      ctx.bytecode.push({ opCode: getOpCode("CALL", ctx), arg: node.arguments.length });
      break;
    }

    case "MemberExpression": {
      buildFromNode(node.object, ctx);
      buildFromNode(node.property, ctx);

      ctx.bytecode.push({ opCode: getOpCode("MEMBER", ctx), arg: -1 });
      
      break;
    }

    case "StringLiteral": {
      const addr = ctx.heap.length;
      ctx.heap.push(node.value);
      ctx.bytecode.push({ opCode: getOpCode("LOAD_H", ctx), arg: addr });
      break;
    }

    case "TemplateLiteral": {
      const merged: any = [];
      // 按照 [quasis, expressions, quasis, ...] 的顺序合并
      for (let i = 0; i < node.quasis.length; i++) {
        merged.push(node.quasis[i]);
        node.expressions[i] && merged.push(node.expressions[i]);
      }

      for (const index in merged) {
        const element = merged[index];
        if (element.type === "TemplateElement") {
          const addr = ctx.heap.length;
          ctx.heap.push(element.value.raw);
          ctx.bytecode.push({ opCode: getOpCode("LOAD_H", ctx), arg: addr });
        } else {
          buildFromNode(element, ctx);
        }

        if (parseInt(index) > 0) {
          ctx.bytecode.push({ opCode: getOpCode("ADD", ctx), arg: -1 });
        }
      }

      break;
    }

    default:
      console.warn(`Unsupported AST node type: ${node.type}`);
  }
};

interface VMPCode {
  remapped_opCodes: string[];
  heap: any[];
  bytecode: VMPCodeBlock[];
}

export const encode = (input: string): VMPCode => {
  const ast = parse(input, { sourceType: "script" });

  const remapped_opCodes = opCodes.slice().sort(() => Math.random() - 0.5);

  const context: BuildContext = {
    remapped_opCodes,
    heap: [],
    memoryMap: new Map(),
    bytecode: [],
  };

  ast.program.body.forEach((statement) => {
    buildFromNode(statement, context);
  });

  return {
    remapped_opCodes,
    heap: context.heap,
    bytecode: context.bytecode,
  };
};

export const formatCode = (code: VMPCode) => {
  const { remapped_opCodes, heap, bytecode } = code;
  return [
    `opCodes: `,
    remapped_opCodes.map((op, i) => ` - ${i}: ${op}`).join("\n"),
    "",
    `heap: `,
    heap.map((v, i) => ` - ${i}: ${v}`).join("\n"),
    "",
    `bytecode: `,
    bytecode.map((v, i) => ` - ${i}: ${remapped_opCodes[v.opCode]} ${v.arg}`).join("\n"),
  ].join("\n");
}

export const runvmp = (code: VMPCode, debug: boolean = false) => {
  const { remapped_opCodes, heap, bytecode } = code;
  const memory = new Map<number, number>();
  const stack: any[] = [];
  
  let programCounter = 0;

  const operatons: {
    [key: string]: (block: VMPCodeBlock) => boolean;
  } = {
    "LOAD_H": (block: VMPCodeBlock) => {
      const addr = block.arg;
      const value = heap[addr];
      stack.push(value);
      debug && console.log(`[EXEC][DEBUG, ${new Date().toLocaleString()}] LOAD_H: ${addr} -> ${value}`);
      return true;
    },
    "LOAD_M": (block: VMPCodeBlock) => {
      const addr = block.arg;
      const value = memory.get(addr);
      stack.push(value);
      debug && console.log(`[EXEC][DEBUG, ${new Date().toLocaleString()}] LOAD_M: ${addr} -> ${value}`);
      return true;
    },
    "STORE_M": (block: VMPCodeBlock) => {
      const addr = block.arg;
      const value = stack.pop();
      memory.set(addr, value);
      debug && console.log(`[EXEC][DEBUG, ${new Date().toLocaleString()}] STORE_M: ${addr} <- ${value}`);
      return true;
    },
    "ADD": (block: VMPCodeBlock) => {
      const b = stack.pop();
      const a = stack.pop();
      stack.push(a + b);
      debug && console.log(`[EXEC][DEBUG, ${new Date().toLocaleString()}] ADD: ${a} + ${b} -> ${a + b}`);
      return true;
    },
    "SUB": (block: VMPCodeBlock) => {
      const b = stack.pop();
      const a = stack.pop();
      stack.push(a - b);
      debug && console.log(`[EXEC][DEBUG, ${new Date().toLocaleString()}] SUB: ${a} - ${b} -> ${a - b}`);
      return true;
    },
    "MUL": (block: VMPCodeBlock) => {
      const b = stack.pop();
      const a = stack.pop();
      stack.push(a * b);
      debug && console.log(`[EXEC][DEBUG, ${new Date().toLocaleString()}] MUL: ${a} * ${b} -> ${a * b}`);
      return true;
    },
    "DIV": (block: VMPCodeBlock) => {
      const b = stack.pop();
      const a = stack.pop();
      stack.push(a / b);
      debug && console.log(`[EXEC][DEBUG, ${new Date().toLocaleString()}] DIV: ${a} / ${b} -> ${a / b}`);
      return true;
    },
    "CALL": (block: VMPCodeBlock) => {
      const numArgs = block.arg;
      const func = stack.pop();
      const args = stack.slice(-numArgs);
      stack.length -= numArgs;

      debug && console.log(`[EXEC][DEBUG, ${new Date().toLocaleString()}] CALL: ${func}(${args.join(", ")})`);

      const result = new Function("...args", `return ${func}(...args);`)(...args);
      stack.push(result);
      return true;
    },
    "JMP_IF_F": (block: VMPCodeBlock) => {
      const addr = block.arg;
      const value = stack.pop();
      if (!value && value !== -1) {
        programCounter = addr
      } else {
        programCounter += 1;
      }

      debug && console.log(`[EXEC][DEBUG, ${new Date().toLocaleString()}] JMP_IF_F: ${value} -> ${addr}`);

      return false;
    },
    "JMP": (block: VMPCodeBlock) => {
      const addr = block.arg;
      programCounter = addr;
      debug && console.log(`[EXEC][DEBUG, ${new Date().toLocaleString()}] JMP: ${addr}`);
      return false;
    },
    "BINARY_EQ": (block: VMPCodeBlock) => {
      const b = stack.pop();
      const a = stack.pop();
      stack.push(a === b);
      debug && console.log(`[EXEC][DEBUG, ${new Date().toLocaleString()}] BINARY_EQ: ${a} == ${b} -> ${a == b}`);
      return true;
    },
    "BINARY_FEQ": (block: VMPCodeBlock) => {
      const b = stack.pop();
      const a = stack.pop();
      stack.push(a == b);
      debug && console.log(`[EXEC][DEBUG, ${new Date().toLocaleString()}] BINARY_FEQ: ${a} === ${b} -> ${a === b}`);
      return true;
    },
    "BINARY_NE": (block: VMPCodeBlock) => {
      const b = stack.pop();
      const a = stack.pop();
      stack.push(a !== b);
      debug && console.log(`[EXEC][DEBUG, ${new Date().toLocaleString()}] BINARY_NE: ${a} != ${b} -> ${a != b}`);
      return true;
    },
    "BINARY_LT": (block: VMPCodeBlock) => {
      const b = stack.pop();
      const a = stack.pop();
      stack.push(a < b);
      debug && console.log(`[EXEC][DEBUG, ${new Date().toLocaleString()}] BINARY_LT: ${a} < ${b} -> ${a < b}`);
      return true;
    },
    "BINARY_LE": (block: VMPCodeBlock) => {
      const b = stack.pop();
      const a = stack.pop();
      stack.push(a <= b);
      debug && console.log(`[EXEC][DEBUG, ${new Date().toLocaleString()}] BINARY_LE: ${a} <= ${b} -> ${a <= b}`);
      return true;
    },
    "BINARY_GT": (block: VMPCodeBlock) => {
      const b = stack.pop();
      const a = stack.pop();
      stack.push(a > b);
      debug && console.log(`[EXEC][DEBUG, ${new Date().toLocaleString()}] BINARY_GT: ${a} > ${b} -> ${a > b}`);
      return true;
    },
    "BINARY_GE": (block: VMPCodeBlock) => {
      const b = stack.pop();
      const a = stack.pop();
      stack.push(a >= b);
      debug && console.log(`[EXEC][DEBUG, ${new Date().toLocaleString()}] BINARY_GE: ${a} >= ${b} -> ${a >= b}`);
      return true;
    },
    "MEMBER": (block: VMPCodeBlock) => {
      const b = stack.pop();
      const a = stack.pop();

      if (typeof a === "object") {
        stack.push(a[b]);
      } else {
        stack.push(`${a}["${b}"]`);
      }

      debug && console.log(`[EXEC][DEBUG, ${new Date().toLocaleString()}] MEMBER: ${a}["${b}"]`);
      return true;
    }
  }

  while (programCounter < bytecode.length) {
    const block = bytecode[programCounter];
    // debug && console.log(`[EXEC][DEBUG, ${new Date().toLocaleString()}] EXECuting block:`, block);

    const remappedOpCode = remapped_opCodes[block.opCode];
    if (!remappedOpCode) throw new Error(`Unknown op code: ${block.opCode}`);

    const operation = operatons[remappedOpCode];
    if (!operation) throw new Error(`Unknown operation: ${remappedOpCode}`);

    if (operation(block)) programCounter++;
  }
}