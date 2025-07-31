import { traverse } from "..";

export const MemberExpression: traverse = (node, ctx, that) => {
  if (node.type !== "MemberExpression") return;

  that.traverse.call(that, node.object);
  that.traverse.call(that, node.property);

  ctx.bytecodes.push({ opCode: that.getOpCode.call(that, "MEMBER"), arg: -1 });
  
}