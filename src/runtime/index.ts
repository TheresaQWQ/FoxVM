import { FoxBinary, FoxVMProgram } from "../common/binary";
import { runners } from "./opcode"
import chalk from 'chalk';

export class FoxRuntime {
  private _program: FoxVMProgram;
  private _memory: Map<number, any>;
  private _stack: any[];
  private _pc: number;
  private _isHalted: boolean;

  constructor(binary: Uint8Array) {
    this._program = new FoxBinary().parse(binary);
    this._memory = new Map();
    this._stack = [];
    this._pc = 0;
    this._isHalted = true;
  }

  public printStack() {

    console.log(chalk.blue.bold("\n  Stack:"));
    if (this._stack.length === 0) {
      console.log(chalk.gray("   [NO STACK]"));
    } else {
      for (const value of this._stack) {
        console.log(chalk.cyan(`   - ${value}`));
      }
    }

    console.log(chalk.green.bold("\n  Memory:"));
    if (this._memory.size === 0) {
      console.log(chalk.gray("   [NO MEMORY]"));
    } else {
      for (const [key, value] of this._memory) {
        console.log(chalk.yellow(`   - [${key}] ${value}`));
      }
    }

    console.log(chalk.yellow.bold("\n  Heap:"));
    if (this._program.heap.length === 0) {
      console.log(chalk.gray("   [NO HEAP]"));
    } else {
      for (const index in this._program.heap) {
        const type = this._program.heap[index].type;
        const value = this._program.heap[index].value;
        console.log(chalk.yellow(`   - [${index}] ${type} -> ${value}`));
      }
    }

    // CMD output
    console.log(chalk.magenta.bold("\n  CMD:"));
    const cmds = this._program.bytecode.slice(Math.max(0, this._pc - 8), this._pc + 3);
    for (let i = 0; i < cmds.length; i++) {
      const cmd = cmds[i];
      const opCode = cmd.opCode;
      const opCodeStr = this._program.opcode[opCode];
      const arg = cmd.arg;
      const currentPC = Math.max(0, this._pc - 8) + i;

      if (currentPC === this._pc) {
        console.log(chalk.red.bold(`   -> ${opCodeStr} ${arg} (PC: ${currentPC})`));
      } else {
        console.log(`    - ${opCodeStr} ${arg}`);
      }
    }

    console.log(chalk.blue.bold(`\n  Program Counter: ${this._pc}`));
  }

  public run() {
    this._isHalted = false;

    while (this._pc < this._program.bytecode.length && !this._isHalted) {
      const bytecode = this._program.bytecode[this._pc];

      if (!bytecode) {
        this._isHalted = true;
        console.log("\n\nFoxVM Expectation: ");
        this.printStack();
        break;
      }

      try {
        const opcode = this._program.opcode[bytecode.opCode];
        const runner = runners[opcode];
        if (runner) {
          const extra = {
            set_pc: (pc: number) => this._pc = pc,
            set_debugger: () => {
              console.log("\nFoxVM Debugger: ");
              this.printStack();
              console.log("\n")
              debugger;
            },
          }

          const r = runner(bytecode, this._program.heap, this._stack, this._memory, extra);
          if (r) this._pc++;
        } else {
          console.log("\n\nFoxVM Expectation: ");
          this.printStack();
          console.log(`\nFoxVM Error: \n  Unknown opcode ${opcode}`);
          this._isHalted = true;
        }
      } catch (e) {
        console.log("\n\nFoxVM Expectation: ");
        this.printStack();
        console.log(`\nFoxVM Error: \n  ${e.message}`);
        this._isHalted = true;
      }
    }

    this._memory = new Map();
    this._stack = [];
    this._pc = 0;
  }

  public reset() {
    this._isHalted = true;
  }
}