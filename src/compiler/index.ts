import { runners } from "../runtime/opcode"
import { ByteCode, FoxBinary, FoxVMProgram } from "../common/binary";
import { parse } from "@babel/parser";
import * as blocks from "./blocks";
import type { Node } from "@babel/types";

const opcodes = Object.keys(runners);

export interface CompilerContext {
  remapped_opCodes: string[],
  heap: {
    type: string,
    value: any
  }[],
  memoryMap: Map<string, number>,
  bytecodes: ByteCode[]
}

interface Metadata {
  name: string,
  extra: string[],
  version: string,
}

export class FoxCompiler {
  private context: CompilerContext;

  private shuffleArray<T>(array: T[]): T[] {
    return array.sort(() => Math.random() - 0.5);
  }

  public traverse(ast: Node | Node[]) {
    if (Array.isArray(ast)) {
      for (const node of ast) {
        this.traverse(node);
      }
    } else {
      const type = ast.type;
      if (blocks[type]) {
        blocks[type](ast, this.context, this);
      } else {
        console.warn(`[FoxCompiler] Unknown node type: ${type}`)
      }
    }
  }

  public getOpCode(name: string): number {
    return this.context.remapped_opCodes.indexOf(name);
  }

  public getMemoryAddress(name: string): number {
    return this.context.memoryMap.get(name) ?? -1;
  }

  compile(code: string, metadata: Metadata): Uint8Array {
    const ast = parse(code, {
      sourceType: "script"
    })

    const binary = new FoxBinary();

    this.context = {
      heap: [],
      memoryMap: new Map(),
      remapped_opCodes: this.shuffleArray(opcodes),
      bytecodes: []
    }

    this.traverse(ast.program.body);

    const FoxCode: FoxVMProgram = {
      metadata: {
        name: metadata.name,
        extra: metadata.extra,
        build_timestamp: Date.now(),
        build_version: metadata.version,
      },
      bytecode: this.context.bytecodes,
      heap: this.context.heap,
      opcode: this.context.remapped_opCodes,
    };

    return binary.compile(FoxCode);
  }
}