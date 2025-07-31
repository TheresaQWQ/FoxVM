import type { OpCodeRunner } from "."

export const BINARY_EQ: OpCodeRunner = (bytecode, heap, stack, memory) => {
  const a = stack.pop()
  const b = stack.pop()
  stack.push(a == b)
  return true;
}

export const BINARY_FEQ: OpCodeRunner = (bytecode, heap, stack, memory) => {
  const a = stack.pop()
  const b = stack.pop()
  stack.push(a === b)
  return true;
}

export const BINARY_NE: OpCodeRunner = (bytecode, heap, stack, memory) => {
  const a = stack.pop()
  const b = stack.pop()
  stack.push(a != b)
  return true;
}

export const BINARY_FNE: OpCodeRunner = (bytecode, heap, stack, memory) => {
  const a = stack.pop()
  const b = stack.pop()
  stack.push(a !== b)
  return true;
}

export const BINARY_LT: OpCodeRunner = (bytecode, heap, stack, memory) => {
  const a = stack.pop()
  const b = stack.pop()
  stack.push(a < b)
  return true;
}

export const BINARY_GT: OpCodeRunner = (bytecode, heap, stack, memory) => {
  const a = stack.pop()
  const b = stack.pop()
  stack.push(a > b)
  return true;
}

export const BINARY_LE: OpCodeRunner = (bytecode, heap, stack, memory) => {
  const a = stack.pop()
  const b = stack.pop()
  stack.push(a <= b)
  return true;
}

export const BINARY_GE: OpCodeRunner = (bytecode, heap, stack, memory) => {
  const a = stack.pop()
  const b = stack.pop()
  stack.push(a >= b)
  return true;
}