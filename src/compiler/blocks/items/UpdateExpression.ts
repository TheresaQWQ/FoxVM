import { traverse } from "..";

export const UpdateExpression: traverse = (node, ctx, that) => {
  if (node.type !== "UpdateExpression") return;

  if (node.argument) {
    that.traverse.call(that, node.argument);
  }

  if (node.operator) {
    switch (node.operator) {
      case "++":
        ctx.bytecodes.push({ opCode: that.getOpCode.call(that, "LOAD_C"), arg: 1 });
        ctx.bytecodes.push({ opCode: that.getOpCode.call(that, "ADD"), arg: -1 });

        ctx.bytecodes.push({ opCode: that.getOpCode.call(that, "STORE_M"), arg: that.getMemoryAddress.call(that, node.argument.type === "Identifier" && node.argument.name) });
        break;
      case "--":
        ctx.bytecodes.push({ opCode: that.getOpCode.call(that, "LOAD_C"), arg: 1 });
        ctx.bytecodes.push({ opCode: that.getOpCode.call(that, "SUB"), arg: -1 });

        ctx.bytecodes.push({ opCode: that.getOpCode.call(that, "STORE_M"), arg: that.getMemoryAddress.call(that, node.argument.type === "Identifier" && node.argument.name) });
        break;
    }
  }
}