import { traverse } from "..";

export const DebuggerStatement: traverse = (node, ctx, that) => {
  if (node.type !== "DebuggerStatement") return;
  
  ctx.bytecodes.push({ opCode: that.getOpCode("INT3"), arg: -1 });
}