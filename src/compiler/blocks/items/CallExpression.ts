import { traverse } from "..";

export const CallExpression: traverse = (node, ctx, that) => {
  if (node.type !== "CallExpression") return;

  for (const arg of node.arguments.reverse()) {
    that.traverse.call(that, arg);
  }

  that.traverse.call(that, node.callee);

  ctx.bytecodes.push({ opCode: that.getOpCode.call(that, "CALL"), arg: node.arguments.length });
}