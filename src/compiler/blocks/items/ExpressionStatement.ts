import { traverse } from "..";

export const ExpressionStatement: traverse = (node, ctx, that) => {
  if (node.type !== "ExpressionStatement") return;
  that.traverse.call(that, node.expression);
}