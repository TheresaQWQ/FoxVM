import type { OpCodeRunner } from "."

export const CALL: OpCodeRunner = (bytecode, heap, stack, memory, extra) => {
  const numArgs = bytecode.arg;
  const func = stack.pop();
  const args: any[] = [];

  for (let i = 0; i < numArgs; i++) {
    args.unshift(stack.pop());
  }

  const result = new Function("...args", `return ${func}(...args);`)(...args);
  // stack.push(result);

  return true;
}