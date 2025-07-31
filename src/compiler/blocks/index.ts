import type { Node } from "@babel/types";
import type { CompilerContext, FoxCompiler } from "..";

export type traverse = (node: Node, ctx: CompilerContext, that: FoxCompiler) => void;

export * from "./items/BinaryExpression";
export * from "./items/BlockStatement";
export * from "./items/CallExpression";
export * from "./items/ExpressionStatement";
export * from "./items/Identifier";
export * from "./items/IfStatement";
export * from "./items/MemberExpression";
export * from "./items/NumericLiteral";
export * from "./items/StringLiteral";
export * from "./items/TemplateLiteral";
export * from "./items/VariableDeclaration";
export * from "./items/ForStatement";
export * from "./items/UpdateExpression";
export * from "./items/DebuggerStatement";