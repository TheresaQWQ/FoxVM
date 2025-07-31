import type { OpCodeRunner } from ".."

export const MEMBER: OpCodeRunner = (bytecode, heap, stack, memory) => {
  const b = stack.pop()
  const a = stack.pop()

  if (typeof a === "object") {
    stack.push(a[b])
  } else {
    stack.push(`${a}["${b}"]`)
  }

  return true;
}
