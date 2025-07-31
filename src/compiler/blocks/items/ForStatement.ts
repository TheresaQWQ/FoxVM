import { traverse } from "..";

export const ForStatement: traverse = (node, ctx, that) => {
  if (node.type !== "ForStatement") return;
  
  if (node.init) {
    const type = node.init.type;
    if (type === "VariableDeclaration") {
      for (const declaration of node.init.declarations) {
        if (declaration.init && declaration.id.type === "Identifier") {
          that.traverse.call(that, declaration.init, ctx);
        
          const varName = declaration.id.name;
          if (ctx.memoryMap.get(varName)) {
            throw new Error(`Variable "${varName}" has already been declared.`);
          }

          const memAddr = ctx.memoryMap.size;
          ctx.memoryMap.set(varName, memAddr);

          ctx.bytecodes.push({ opCode: that.getOpCode.call(that, "STORE_M"), arg: memAddr});
        } else {
          throw new Error(`Unexpected type "${type}" for ForStatement init.`);
        }
      }
    } else {
      throw new Error(`Unexpected type "${type}" for ForStatement init.`);
    }
  }

  const loopStartAddr = ctx.bytecodes.length;

  if (node.test) {
    that.traverse.call(that, node.test, ctx);
  }

  const exitJumpAddr = ctx.bytecodes.length;
  ctx.bytecodes.push({ opCode: that.getOpCode.call(that, "JMP_IF_F"), arg: -1 }); // -1 是占位符

  that.traverse.call(that, node.body, ctx);

  if (node.update) {
    that.traverse.call(that, node.update, ctx);
  }

  ctx.bytecodes.push({ opCode: that.getOpCode.call(that, "JMP"), arg: loopStartAddr });

  ctx.bytecodes[exitJumpAddr].arg = ctx.bytecodes.length;
}