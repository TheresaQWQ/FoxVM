import { traverse } from "..";

export const BinaryExpression: traverse = (node, ctx, that) => {
  if (node.type !== "BinaryExpression") return;
  
  that.traverse.call(that, node.right);
  that.traverse.call(that, node.left);
  
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

  ctx.bytecodes.push({
    opCode: that.getOpCode.call(that, opName),
    arg: -1
  })
}