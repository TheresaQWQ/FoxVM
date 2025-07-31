const magicString = "FoxVM"
const magicBuffer = new TextEncoder().encode(magicString);
const magicBufferLength = magicBuffer.byteLength;

export interface ByteCode {
  opCode: number,
  arg: number,
}

export interface Heap {
  type: string,
  value: any,
}

export interface Metadata {
  name: string,
  extra: string[],
  build_timestamp: number,
  build_version: string,
}

export interface FoxVMProgram {
  metadata: Metadata,
  heap: Heap[],
  opcode: string[];
  bytecode: ByteCode[];
}

export class FoxBinary {
  private heap: any[];
  private opcode: string[];
  private bytecode: {
    opCode: number,
    arg: number,
  }[]

  private metadata: {
    name: string,
    extra: string[],
    build_timestamp: number,
    build_version: string,
  }

  private code: Uint8Array;

  public parse(code: Uint8Array) {
    this.code = code;

    this.heap = [];
    this.opcode = [];
    this.bytecode = [];

    let offset = 0;
    
    offset = this.readMetadata(offset);
    offset = this.readHeap(offset);
    offset = this.readOpCode(offset);
    offset = this.readByteCode(offset);
    
    const program: FoxVMProgram = {
      metadata: this.metadata,
      heap: this.heap,
      opcode: this.opcode,
      bytecode: this.bytecode
    }

    return program;
  }

  public compile(code: FoxVMProgram) {
    this.metadata = code.metadata;
    this.heap = code.heap;
    this.opcode = code.opcode;
    this.bytecode = code.bytecode;

    this.code = new Uint8Array();
    this.writeMetadata();
    this.writeHeap();
    this.writeOpCode();
    this.writeByteCode();

    return this.code;
  }

  public print(): string {
    const lines: string[] = [];

    lines.push(`// FoxVM bytecode v${this.metadata.build_version}`);
    lines.push(`// Name: ${this.metadata.name}`);
    lines.push(`// Build timestamp: ${this.metadata.build_timestamp}`);
    lines.push(`// Extra: ${this.metadata.extra.join(", ")}`);

    lines.push(`\n`);

    lines.push(`Heap: ${this.heap.length}`);
    for (const index in this.heap) {
      const heap = this.heap[index];
      lines.push(` - [${index}] ${heap.type}: ${heap.value}`)
    }

    lines.push(`\n`);
    
    lines.push(`ByteCodes: ${this.bytecode.length}`);
    for (const index in this.bytecode) {
      const bytecode = this.bytecode[index];
      const opcode = this.opcode[bytecode.opCode];
      const arg = bytecode.arg;
      lines.push(` - [${index}] ${opcode} ${arg}`)
    }

    lines.push(`\n`);
    lines.push(`OpCode Map: ${this.opcode.length}`);
    for (const index in this.opcode) {
      const opcode = this.opcode[index];
      lines.push(` - [${index}] ${opcode}`)
    }

    return lines.join("\n");
  }

  private concate(buf1: Uint8Array, buf2: Uint8Array) {
    const buf = new Uint8Array(buf1.byteLength + buf2.byteLength);
    buf.set(buf1, 0);
    buf.set(buf2, buf1.byteLength);
    return buf;
  }

  private anyToBuffer(type: string, value: any): Uint8Array {
    switch (type) {
      case "string":
        return new TextEncoder().encode(value);
      case "Identifier":
        return new TextEncoder().encode(value);
      case "number":
        return new Uint8Array(new Uint32Array([value]).buffer);
      case "boolean":
        return new Uint8Array(new Uint32Array([value ? 1 : 0]).buffer);
      case "object":
        if (value instanceof Uint8Array) return value;
        return new TextEncoder().encode(JSON.stringify(value));
      case "undefined":
        return new Uint8Array();
      default:
        throw new Error(`unsupported type: ${type}`);
    }
  }

  private bufferToAny(type: string, buffer: Uint8Array): any {
    switch (type) {
      case "string":
        return new TextDecoder().decode(buffer);
      case "Identifier":
        return new TextDecoder().decode(buffer);
      case "number":
        return new DataView(buffer.buffer).getUint32(0, true);
      case "boolean":
        return new DataView(buffer.buffer).getUint32(0, true) === 1;
      case "object":
        return JSON.parse(new TextDecoder().decode(buffer));
      case "undefined":
        return undefined;
      default:
    }
  }

  private readMetadata(offset: number) {
    const dw = new DataView(this.code.buffer);
    
    const magic = new TextDecoder().decode(this.code.slice(offset, offset + magicBufferLength));
    offset += magicBufferLength;
    if (magic !== magicString) {
      throw new Error("Invalid FoxVM bytecode");
    }

    const metadataLength = dw.getUint32(offset, true);
    offset += 4;
    
    const metadataBuffer = this.code.slice(offset, offset + metadataLength);
    offset += metadataLength;

    const metadata = JSON.parse(new TextDecoder().decode(metadataBuffer));

    this.metadata = metadata;
  
    return offset;
  }

  private writeMetadata() {
    const metadataBuffer = new TextEncoder().encode(JSON.stringify(this.metadata));
    const metadataLength = metadataBuffer.byteLength;

    const buffer = new Uint8Array(magicBufferLength + 4 + metadataLength);

    buffer.set(magicBuffer, 0);
    buffer.set(new Uint8Array(new Uint32Array([metadataLength]).buffer), magicBufferLength);
    buffer.set(metadataBuffer, magicBufferLength + 4);
    
    this.code = this.concate(this.code, buffer);
  }

  private readHeap(offset: number) {
    const dw = new DataView(this.code.buffer);
    const itemCount = dw.getUint32(offset, true);
    offset += 4;

    for (let i = 0; i < itemCount; i++) {
      const typeLength = dw.getUint32(offset, true);
      offset += 4;

      const type = new TextDecoder().decode(this.code.slice(offset, offset + typeLength));
      offset += typeLength;

      const valueLength = dw.getUint32(offset, true);
      offset += 4;

      const value = this.code.slice(offset, offset + valueLength);
      offset += valueLength;

      this.heap.push({
        type,
        value: this.bufferToAny(type, value),
      })
    }

    return offset;
  }

  private writeHeap() {
    const heapItems: Uint8Array[] = [];

    for (const item of this.heap) {
      const typeBuffer = new TextEncoder().encode(item.type);
      const typeLength = typeBuffer.byteLength; // 4 bytes
      
      const valueBuffer = this.anyToBuffer(item.type, item.value);
      const valueLength = valueBuffer.byteLength; // 4 bytes

      const buffer = new Uint8Array(8 + typeLength + valueLength);
      const dw = new DataView(buffer.buffer);

      dw.setUint32(0, typeLength, true);
      buffer.set(typeBuffer, 4);

      dw.setUint32(4 + typeLength, valueLength, true);
      buffer.set(valueBuffer, 8 + typeLength);
      heapItems.push(buffer);
    }

    const buffer = new Uint8Array(4 + heapItems.reduce((acc, item) => this.concate(acc, item), new Uint8Array()).byteLength);
    const dw = new DataView(buffer.buffer);

    dw.setUint32(0, this.heap.length, true);
    buffer.set(heapItems.reduce((acc, item) => this.concate(acc, item), new Uint8Array()), 4);

    this.code = this.concate(this.code, buffer);
  }

  private readOpCode(offset: number) {
    const dw = new DataView(this.code.buffer);
    const itemCount = dw.getUint32(offset, true);
    offset += 4;

    for (let i = 0; i < itemCount; i++) {
      const length = dw.getUint32(offset, true);
      offset += 4;

      const opcode = this.code.slice(offset, offset + length);
      offset += length;

      const parsedOpcode = new TextDecoder().decode(opcode);
      this.opcode.push(parsedOpcode);
    }

    return offset;
  }

  private writeOpCode() {
    const opcodes: Uint8Array[] = [];

    for (const opcode of this.opcode) {
      const opcodeBuffer = new TextEncoder().encode(opcode);
      const length = opcodeBuffer.byteLength;

      const buffer = new Uint8Array(4 + length);
      const dw = new DataView(buffer.buffer);

      dw.setUint32(0, length, true);
      buffer.set(opcodeBuffer, 4);
    
      opcodes.push(buffer);
    }

    const buffer = new Uint8Array(4 + opcodes.reduce((acc, item) => this.concate(acc, item), new Uint8Array()).byteLength);
    const dw = new DataView(buffer.buffer);

    dw.setUint32(0, this.opcode.length, true);
    buffer.set(opcodes.reduce((acc, item) => this.concate(acc, item), new Uint8Array()), 4);

    this.code = this.concate(this.code, buffer);
  }

  private readByteCode(offset: number) {
    const dw = new DataView(this.code.buffer);
    const itemCount = dw.getUint32(offset, true);
    offset += 4;

    for (let i = 0; i < itemCount; i++) {
      const opCode = dw.getUint32(offset, true);
      offset += 4;

      const arg = dw.getUint32(offset, true);
      offset += 4;

      this.bytecode.push({
        opCode,
        arg,
      })
    }

    return offset;
  }

  private writeByteCode() {
    const items: Uint8Array[] = [];

    for (const item of this.bytecode) {
      const buffer = new Uint8Array(8);
      const dw = new DataView(buffer.buffer);

      dw.setUint32(0, item.opCode, true);
      dw.setUint32(4, item.arg, true);

      items.push(buffer);
    }

    const buffer = new Uint8Array(4 + items.reduce((acc, item) => this.concate(acc, item), new Uint8Array()).byteLength);
    const dw = new DataView(buffer.buffer);

    dw.setUint32(0, this.bytecode.length, true);
    buffer.set(items.reduce((acc, item) => this.concate(acc, item), new Uint8Array()), 4);

    this.code = this.concate(this.code, buffer);
  }
}

// const compile = new FoxBinary();

// const binary = compile.compile({
//   metadata: {
//     name: "Hello World",
//     extra: [],
//     build_timestamp: Date.now(),
//     build_version: "1.0.0",
//   },
//   heap: [
//     {
//       type: "string",
//       value: "Hello World",
//     },
//   ],
//   opcode: [
//     "ADD",
//     "PRINT"
//   ],
//   bytecode: [{
//     opCode: 0,
//     arg: 0
//   }]
// })

// console.log(binary);

// const program = new FoxBinary();
// const parsed = program.parse(binary);

// console.log(parsed);