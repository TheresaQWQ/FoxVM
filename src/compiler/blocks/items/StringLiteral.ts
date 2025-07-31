import { traverse } from "..";

export const StringLiteral: traverse = (node, ctx, that) => {
  if (node.type !== "StringLiteral") return;

  const addr = ctx.heap.length;
  ctx.heap.push({
    type: "string",
    value: node.value,
  });
  ctx.bytecodes.push({ opCode: that.getOpCode.call(that, "LOAD_H"), arg: addr });
}