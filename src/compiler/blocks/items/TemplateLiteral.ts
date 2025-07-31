import { traverse } from "..";

export const TemplateLiteral: traverse = (node, ctx, that) => {
  if (node.type !== "TemplateLiteral") return;

  const merged: any = [];
  for (let i = 0; i < node.quasis.length; i++) {
    merged.push(node.quasis[i]);
    node.expressions[i] && merged.push(node.expressions[i]);
  }

  for (const index in merged) {
    const element = merged[index];
    if (element.type === "TemplateElement") {
      const addr = ctx.heap.length;
      ctx.heap.push({
        type: "string",
        value: element.value.raw,
      });
      
      ctx.bytecodes.push({ opCode: that.getOpCode.call(that, "LOAD_H"), arg: addr });
    } else {
      that.traverse.call(that, element);
    }

    if (parseInt(index) > 0) {
      ctx.bytecodes.push({ opCode: that.getOpCode.call(that, "ADD"), arg: -1 });
    }
  }
}