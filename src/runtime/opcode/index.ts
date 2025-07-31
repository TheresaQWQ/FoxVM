import { ByteCode, Heap } from "../../common/binary";

import * as memory from "./memory";
import * as math from "./math";
import * as control from "./ControlFlow";
import * as call from "./call";
import * as binary from "./binary";
import * as javascript from "./javascript"

export interface ExtraOptions {
  set_debugger(): void,
  set_pc(value: number): void,
}

export type OpCodeRunner = (opcode: ByteCode, heap: Heap[], stack: any[], memory: Map<number, any>, extra: ExtraOptions) => boolean;

export const runners: { [key: string]: OpCodeRunner } = {
  ...memory,
  ...math,
  ...control,
  ...call,
  ...binary,
  ...javascript,
}