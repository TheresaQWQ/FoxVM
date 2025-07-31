import { traverse } from "..";

export const VariableDeclaration: traverse = (node, ctx, that) => {
  if (node.type !== "VariableDeclaration") return;

  for (const declaration of node.declarations) {
    if (!declaration.init || declaration.id.type !== 'Identifier') continue;

    that.traverse.call(that, declaration.init);

    const varName = declaration.id.name;
    if (ctx.memoryMap.has(varName)) {
      throw new Error(`Variable "${varName}" has already been declared.`);
    }
    const memAddr = ctx.memoryMap.size;
    ctx.memoryMap.set(varName, memAddr);

    ctx.bytecodes.push({ opCode: that.getOpCode.call(that, "STORE_M", ctx), arg: memAddr });
  }
}