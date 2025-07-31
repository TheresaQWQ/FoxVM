import type { OpCodeRunner } from "."

export const JMP: OpCodeRunner = (bytecode, heap, stack, memory, extra) => {
  const addr = bytecode.arg;
  extra.set_pc(addr);
  return false;
}

export const JMP_IF_F: OpCodeRunner = (bytecode, heap, stack, memory, extra) => {
  const addr = bytecode.arg;
  const value = stack.pop();

  if (!value && value !== -1) {
    extra.set_pc(addr);
    return false;
  }

  return true;
}

export const INT3: OpCodeRunner = (bytecode, heap, stack, memory, extra) => {
  extra.set_debugger();
  return true;
}