import type { OpCodeRunner } from "."

export const LOAD_H: OpCodeRunner = (bytecode, heap, stack, memory) => {
  const addr = bytecode.arg;
  const value = heap[addr].value;
  stack.push(value);
  return true
}

export const LOAD_M: OpCodeRunner = (bytecode, heap, stack, memory) => {
  const addr = bytecode.arg;
  const value = memory.get(addr);
  stack.push(value);
  return true
}

export const STORE_M: OpCodeRunner = (bytecode, heap, stack, memory) => {
  const addr = bytecode.arg;
  const value = stack.pop();
  memory.set(addr, value);
  return true
}

export const LOAD_C: OpCodeRunner = (bytecode, heap, stack, memory) => {
  const val = bytecode.arg;
  stack.push(val);
  return true
}