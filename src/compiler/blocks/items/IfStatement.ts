import { traverse } from "..";

export const IfStatement: traverse = (node, ctx, that) => {
  if (node.type !== "IfStatement") return;

  const test = node.test;
  that.traverse.call(that, test);

  const elseAddr = ctx.bytecodes.length;
  ctx.bytecodes.push({ opCode: that.getOpCode.call(that, "JMP_IF_F"), arg: -1 });

  that.traverse.call(that, node.consequent);

  if (node.alternate) {
    const endAddr = ctx.bytecodes.length;
    ctx.bytecodes[elseAddr].arg = endAddr;
  }
}