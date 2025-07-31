import type { OpCodeRunner } from ".."

export const ADD: OpCodeRunner = (bytecode, heap, stack, memory) => {
  const b = stack.pop();
  const a = stack.pop();
  stack.push(a + b);
  return true
}

export const SUB: OpCodeRunner = (bytecode, heap, stack, memory) => {
  const a = stack.pop();
  const b = stack.pop();
  stack.push(b - a);
  return true
}

export const MUL: OpCodeRunner = (bytecode, heap, stack, memory) => {
  const a = stack.pop();
  const b = stack.pop();
  stack.push(a * b);
  return true
}

export const DIV: OpCodeRunner = (bytecode, heap, stack, memory) => {
  const a = stack.pop();
  const b = stack.pop();
  stack.push(b / a);
  return true
}