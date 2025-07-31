import { traverse } from "..";

export const Identifier: traverse = (node, ctx, that) => {
  if (node.type !== "Identifier") return;
  const memAddr = ctx.memoryMap.get(node.name);
  if (memAddr !== void 0) {
    ctx.bytecodes.push({ opCode: that.getOpCode.call(that, "LOAD_M"), arg: memAddr });
    return;
  }

  let heapAddr = ctx.heap.findIndex((x) => x.value === node.name && x.type === "Identifier");
  if (heapAddr === -1) {
    heapAddr = ctx.heap.length;
    ctx.heap.push({
      type: "Identifier",
      value: node.name,
    });
  }

  ctx.bytecodes.push({ opCode: that.getOpCode.call(that, "LOAD_H"), arg: heapAddr });
}