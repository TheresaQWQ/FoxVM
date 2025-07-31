import { traverse } from "..";

export const NumericLiteral: traverse = (node, ctx, that) => {
  if (node.type !== "NumericLiteral") return;
  const addr = ctx.heap.length;
  ctx.heap.push({
    value: node.value,
    type: "number",
  });
  ctx.bytecodes.push({
    opCode: that.getOpCode.call(that, "LOAD_H"),
    arg: addr
  });
}