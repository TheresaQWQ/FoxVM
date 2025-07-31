import { traverse } from "..";

export const BlockStatement: traverse = (node, ctx, that) => {
  if (node.type !== "BlockStatement") return;
  for (const statement of node.body) {
    that.traverse.call(that, statement);
  }
}